export const DEFAULT_TIME_ZONE="Europe/Berlin";

export function appTimeZone(){
  if(typeof document!=="undefined")return document.documentElement.dataset.timeZone||DEFAULT_TIME_ZONE;
  return DEFAULT_TIME_ZONE;
}

export function formatDate(value:string|Date,options:Intl.DateTimeFormatOptions={dateStyle:"medium",timeStyle:"short"},timeZone=appTimeZone()){
  return new Intl.DateTimeFormat("de-DE",{...options,timeZone}).format(new Date(value));
}

export function zonedInputValue(value:string|Date,timeZone=appTimeZone()){
  const parts=new Intl.DateTimeFormat("en-CA",{timeZone,year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hourCycle:"h23"}).formatToParts(new Date(value));
  const part=(type:Intl.DateTimeFormatPartTypes)=>parts.find(item=>item.type===type)?.value||"";
  return `${part("year")}-${part("month")}-${part("day")}T${part("hour")}:${part("minute")}`;
}

export function zonedLocalToIso(value:string,timeZone=appTimeZone()){
  const match=/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if(!match)throw new Error("Datum und Uhrzeit sind unvollständig.");
  const wanted=Date.UTC(+match[1],+match[2]-1,+match[3],+match[4],+match[5]);
  let guess=wanted;
  for(let iteration=0;iteration<3;iteration++){
    const shown=zonedInputValue(new Date(guess),timeZone),shownMatch=/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(shown)!;
    const shownUtc=Date.UTC(+shownMatch[1],+shownMatch[2]-1,+shownMatch[3],+shownMatch[4],+shownMatch[5]);
    guess+=wanted-shownUtc;
  }
  if(zonedInputValue(new Date(guess),timeZone)!==value)throw new Error("Diese Ortszeit existiert wegen der Zeitumstellung nicht. Bitte wähle eine andere Uhrzeit.");
  return new Date(guess).toISOString();
}
