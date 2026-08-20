"use client";
import {useEffect,useState} from "react";

type PushState={available:boolean;publicKey:string|null;enabled:boolean};

function decode(value:string){
  const padding="=".repeat((4-value.length%4)%4);
  const raw=atob((value+padding).replace(/-/g,"+").replace(/_/g,"/"));
  return Uint8Array.from([...raw].map(char=>char.charCodeAt(0)));
}

function isAppleMobile(){
  return /iPhone|iPad|iPod/i.test(navigator.userAgent)||(/Macintosh/i.test(navigator.userAgent)&&navigator.maxTouchPoints>1);
}

function isStandalone(){
  return window.matchMedia("(display-mode: standalone)").matches||Boolean((navigator as Navigator&{standalone?:boolean}).standalone);
}

async function result(response:Response){
  const body=await response.json().catch(()=>({error:"Der Server hat keine lesbare Antwort geliefert."}));
  if(!response.ok)throw new Error(body.error||"Die Push-Einstellung konnte nicht geändert werden.");
  return body;
}

export function PushPreference({onEnabled}:{onEnabled?:()=>void}={}){
  const [state,setState]=useState<PushState|null>(null);
  const [notice,setNotice]=useState("");
  const [busy,setBusy]=useState(false);

  useEffect(()=>{
    let active=true;
    async function load(){
      try{
        let subscription:PushSubscription|null=null;
        if("serviceWorker" in navigator&&"PushManager" in window){
          const registration=await navigator.serviceWorker.ready;
          subscription=await registration.pushManager.getSubscription();
        }
        const query=subscription?`?endpoint=${encodeURIComponent(subscription.endpoint)}`:"";
        const server=await result(await fetch(`/api/push${query}`,{cache:"no-store"})) as PushState;
        if(active)setState({...server,enabled:Boolean(subscription&&server.enabled)});
      }catch(error){
        if(active)setNotice(error instanceof Error?error.message:"Die Push-Einstellung konnte nicht geladen werden.");
      }
    }
    void load();
    return()=>{active=false};
  },[]);

  async function enable(){
    if(!state?.publicKey||!("serviceWorker" in navigator)||!("PushManager" in window)||!("Notification" in window)){
      setNotice("Push wird in dieser Ansicht nicht unterstützt. Öffne die App auf iPhone oder iPad über das Symbol auf deinem Home-Bildschirm.");
      return;
    }
    if(isAppleMobile()&&!isStandalone()){
      setNotice("Auf iPhone und iPad funktioniert Push nur in der installierten Web-App. Füge die Seite zuerst zum Home-Bildschirm hinzu und öffne sie anschließend dort.");
      return;
    }
    setBusy(true);
    setNotice("");
    try{
      const permission=await Notification.requestPermission();
      if(permission!=="granted"){
        setNotice(permission==="denied"?"Benachrichtigungen sind für diese App in den Geräte-Einstellungen blockiert. Erlaube sie dort und versuche es anschließend erneut.":"Push wurde nicht aktiviert, weil die Berechtigungsabfrage geschlossen wurde.");
        return;
      }
      const registration=await navigator.serviceWorker.ready;
      const existing=await registration.pushManager.getSubscription();
      const subscription=existing||await registration.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:decode(state.publicKey)});
      await result(await fetch("/api/push",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(subscription)}));
      setState({...state,enabled:true});
      setNotice("Push-Benachrichtigungen sind auf diesem Gerät aktiv.");
      onEnabled?.();
    }catch(error){
      setNotice(error instanceof Error?error.message:"Push konnte nicht aktiviert werden. Prüfe die Geräte-Einstellungen und versuche es erneut.");
    }finally{
      setBusy(false);
    }
  }

  async function disable(){
    if(!("serviceWorker" in navigator)||!("PushManager" in window)){
      setNotice("Auf diesem Gerät ist keine Push-Registrierung vorhanden.");
      if(state)setState({...state,enabled:false});
      return;
    }
    setBusy(true);
    setNotice("");
    try{
      const registration=await navigator.serviceWorker.ready;
      const subscription=await registration.pushManager.getSubscription();
      if(subscription){
        await result(await fetch("/api/push",{method:"DELETE",headers:{"content-type":"application/json"},body:JSON.stringify({endpoint:subscription.endpoint})}));
        await subscription.unsubscribe();
      }
      const badgeNavigator=navigator as Navigator&{clearAppBadge?:()=>Promise<void>};
      await badgeNavigator.clearAppBadge?.().catch(()=>undefined);
      if(state)setState({...state,enabled:false});
      setNotice("Push-Benachrichtigungen sind auf diesem Gerät ausgeschaltet.");
    }catch(error){
      setNotice(error instanceof Error?error.message:"Push konnte nicht ausgeschaltet werden. Bitte versuche es erneut.");
    }finally{
      setBusy(false);
    }
  }

  if(!state?.available)return notice?<div className="push-preference"><b>Benachrichtigungen</b><small role="status">{notice}</small></div>:null;
  return <div className="push-preference">
    <b>Benachrichtigungen</b>
    <p>Erhalte Erinnerungen vor deinen gemeinsamen Terminen und eine Nachricht, wenn deine Teilnahme eingetragen wurde. Die Einstellung gilt jeweils für dieses Gerät.</p>
    <button type="button" className={state.enabled?"":"primary"} disabled={busy} onClick={state.enabled?disable:enable}>{busy?"Wird gespeichert …":state.enabled?"Auf diesem Gerät ausschalten":"Push auf diesem Gerät aktivieren"}</button>
    {notice&&<small role="status">{notice}</small>}
  </div>;
}
