"use client";

export class ApiError extends Error{constructor(message:string,public status=0){super(message)}}
function fallback(status:number){
  if(status===401)return "Deine Sitzung ist abgelaufen. Bitte melde dich erneut an.";
  if(status===403)return "Diese Aktion ist noch nicht freigeschaltet. Admins schließen zuerst unter „Sicherheit“ die Zwei-Faktor-Einrichtung ab.";
  if(status===404)return "Der angeforderte Eintrag wurde nicht gefunden. Lade die Seite neu und versuche es erneut.";
  if(status===409)return "Die Änderung widerspricht dem aktuellen Datenstand. Lade die Seite neu und prüfe die Angaben.";
  if(status===413)return "Die Datei ist größer als erlaubt. Prüfe Dateityp und Größenlimit am Uploadfeld.";
  if(status===429)return "Zu viele Versuche in kurzer Zeit. Bitte warte einige Minuten und versuche es dann erneut.";
  if(status===503)return "Diese Funktion ist noch nicht eingerichtet oder vorübergehend nicht verfügbar. Prüfe die zugehörige Konfiguration im Adminbereich.";
  if(status>=500)return "Der Server konnte den Vorgang nicht abschließen. Es wurde nichts bestätigt; versuche es erneut. Bleibt der Fehler bestehen, prüfe den Serverstatus oder kontaktiere den Support.";
  return "Der Vorgang konnte nicht abgeschlossen werden. Prüfe deine Eingaben und versuche es erneut.";
}
export async function requestJson<T=Record<string,unknown>>(url:string,options?:RequestInit):Promise<T>{
  let response:Response;
  try{response=await fetch(url,options)}catch{throw new ApiError("Die App konnte den Server nicht erreichen. Prüfe deine Internetverbindung und versuche es erneut.")}
  const result=await response.json().catch(()=>null) as ({error?:string}&T)|null;
  if(!response.ok){const message=result?.error?.trim()&&!/^Nicht berechtigt\.?$/i.test(result.error)?result.error:fallback(response.status);throw new ApiError(message,response.status)}
  return (result||{}) as T;
}
export function messageOf(error:unknown){return error instanceof Error?error.message:"Der Vorgang ist unerwartet fehlgeschlagen. Bitte versuche es erneut."}
