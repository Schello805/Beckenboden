import {db} from "./database";
import {DEFAULT_TIME_ZONE} from "./app-time";

export function validTimeZone(value:string){try{new Intl.DateTimeFormat("de-DE",{timeZone:value}).format();return true}catch{return false}}
export function configuredTimeZone(){const row=db.prepare("SELECT value FROM app_settings WHERE key='timezone'").get() as {value:string}|undefined;if(!row)return DEFAULT_TIME_ZONE;try{const value=JSON.parse(row.value).timeZone;return typeof value==="string"&&validTimeZone(value)?value:DEFAULT_TIME_ZONE}catch{return DEFAULT_TIME_ZONE}}
