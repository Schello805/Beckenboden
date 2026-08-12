import webpush from "web-push";
import { db } from "@/lib/database";
import { decryptSecret } from "@/lib/two-factor";
type PushSettings={publicKey:string;encryptedPrivateKey:string;subject:string};
export function pushSettings(){const row=db.prepare("SELECT value FROM app_settings WHERE key='push'").get() as {value:string}|undefined;return row?JSON.parse(row.value) as PushSettings:null}
export async function sendPush(userId:string,payload:{title:string;body:string;url?:string}){const settings=pushSettings();if(!settings)return;webpush.setVapidDetails(settings.subject,settings.publicKey,decryptSecret(settings.encryptedPrivateKey));const rows=db.prepare("SELECT id,endpoint,p256dh,auth FROM push_subscriptions WHERE user_id=? AND enabled=1").all(userId) as {id:string;endpoint:string;p256dh:string;auth:string}[];await Promise.all(rows.map(async row=>{try{await webpush.sendNotification({endpoint:row.endpoint,keys:{p256dh:row.p256dh,auth:row.auth}},JSON.stringify(payload),{TTL:3600})}catch(error){const status=(error as {statusCode?:number}).statusCode;if(status===404||status===410)db.prepare("DELETE FROM push_subscriptions WHERE id=?").run(row.id)}}))}
