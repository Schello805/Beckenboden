import nodemailer from "nodemailer";
import { db } from "@/lib/database";
import { decryptSecret } from "@/lib/two-factor";
export type SmtpSettings={host:string;port:number;secure:boolean;user:string;encryptedPassword:string;from:string;supportTo:string};
export function smtpSettings(){const row=db.prepare("SELECT value FROM app_settings WHERE key='smtp'").get() as {value:string}|undefined;return row?JSON.parse(row.value) as SmtpSettings:null}
export async function sendMail(options:{to:string;subject:string;text:string;replyTo?:string}){const settings=smtpSettings();if(!settings)throw new Error("SMTP ist noch nicht eingerichtet.");const transport=nodemailer.createTransport({host:settings.host,port:settings.port,secure:settings.secure,auth:settings.user?{user:settings.user,pass:decryptSecret(settings.encryptedPassword)}:undefined});return transport.sendMail({from:settings.from,to:options.to,replyTo:options.replyTo,subject:options.subject,text:options.text})}
