"use client";
/* Authenticated branding intentionally bypasses public image optimization. */
/* eslint-disable @next/next/no-img-element */
import {useState} from "react";
import {AppInstall} from "./app-install";
import {PushPreference} from "./push-preference";
import {appTimeZone} from "@/lib/app-time";
import type {Dashboard} from "./user-dashboard";

export function UserOnboarding({userId,data,onDone}:{userId:string;data:Dashboard|null;onDone:()=>void}){
  const key=`kraftbaum_onboarding_step_${userId}`,[step,setStepState]=useState(()=>typeof window==="undefined"?0:Math.min(3,Number(localStorage.getItem(key)||0))),[busy,setBusy]=useState(false),next=data?.upcoming[0],course=data?.courses[0];
  function setStep(value:number){setStepState(value);localStorage.setItem(key,String(value))}
  async function finish(){setBusy(true);const response=await fetch("/api/me/onboarding",{method:"POST"});setBusy(false);if(response.ok){localStorage.removeItem(key);onDone()}}
  return <div className="onboarding-overlay" role="dialog" aria-modal="true" aria-labelledby="onboarding-title"><section className="onboarding-card"><div className="onboarding-brand"><img src="/logo-kraftbaum.svg" alt=""/><span>Schritt {step+1} von 4</span></div><div className="wizard-progress" aria-label={`Onboarding, Schritt ${step+1} von 4`}>{[0,1,2,3].map(index=><i className={index<=step?"active":""} key={index}/>)}</div>
    {step===0&&<div className="onboarding-content"><p className="eyebrow">Schön, dass du da bist</p><h2 id="onboarding-title">Dein persönlicher Kursbereich ist bereit.</h2><p><b>{course?.title||"Dein Kurs"}</b> begleitet dich zwischen den gemeinsamen Präsenzterminen. Inhalte werden passend zu deiner persönlichen Kursteilnahme freigeschaltet.</p>{next&&<aside><small>DEIN ERSTER TERMIN</small><b>{new Date(next.startsAt).toLocaleString("de-DE",{timeZone:appTimeZone()})}</b><span>{next.location||"Der Ort folgt"}</span></aside>}</div>}
    {step===1&&<div className="onboarding-content"><p className="eyebrow">Gut vorbereitet</p><h2 id="onboarding-title">Ein anonymer Blick auf deine Bedürfnisse</h2><p>Der freiwillige Eingangsfragebogen hilft der Kursleitung, die gemeinsame Zeit gut auf die Gruppe abzustimmen. Die Antworten werden nicht mit deinem App-Konto verknüpft.</p><a className="primary onboarding-link" href="https://bebo.anja-tanzt.de/index.php/468255?newtest=Y&lang=de-informal" target="_blank" rel="noreferrer">Fragebogen in neuem Tab öffnen ↗</a><small>Du kannst diesen Schritt überspringen oder den Fragebogen später unter „Nützliches“ öffnen.</small></div>}
    {step===2&&<div className="onboarding-content"><p className="eyebrow">Schnell erreichbar</p><h2 id="onboarding-title">Die App auf deinem Home-Bildschirm</h2><p>So erreichst du deinen Teilnahme-QR und deine Termine beim Kursbesuch besonders schnell.</p><AppInstall persistent/></div>}
    {step===3&&<div className="onboarding-content"><p className="eyebrow">Auf Wunsch erinnert</p><h2 id="onboarding-title">Kurze, hilfreiche Mitteilungen</h2><p>Push ist freiwillig. Du erhältst zum Beispiel eine Nachricht, wenn deine Anwesenheit eingetragen und dein Baum weitergewachsen ist.</p><PushPreference/></div>}
    <footer className="onboarding-actions">{step>0&&<button type="button" onClick={()=>setStep(step-1)}>Zurück</button>}{step<3?<button type="button" className="primary" onClick={()=>setStep(step+1)}>Weiter</button>:<button type="button" className="primary" disabled={busy} onClick={finish}>{busy?"Wird vorbereitet …":"Meinen Bereich öffnen"}</button>}</footer>
  </section></div>
}
