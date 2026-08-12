import { db } from "@/lib/database";
export async function GET(){const row=db.prepare("SELECT value FROM app_settings WHERE key='matomo'").get() as {value:string}|undefined;if(!row)return Response.json({enabled:false});const value=JSON.parse(row.value);return Response.json({url:value.url,siteId:value.siteId,enabled:Boolean(value.enabled),anonymizeIp:true})}
