import {z} from "zod";
import {appOrigin,issueAccountToken} from "@/lib/account-tokens";
import {audit,db} from "@/lib/database";
import {sendMail,smtpSettings} from "@/lib/mail";
import {requestAllowed} from "@/lib/rate-limit";
const schema=z.object({email:z.email()});
const neutral={ok:true,message:"Falls ein aktives Konto besteht und E-Mail eingerichtet ist, wurde ein Link versendet."};
export async function POST(request:Request){if(!requestAllowed(request,"password-request",5,60*60_000))return Response.json(neutral);const parsed=schema.safeParse(await request.json().catch(()=>null));if(!parsed.success)return Response.json({ok:true});const user=db.prepare("SELECT id,email,first_name firstName FROM users WHERE email=? COLLATE NOCASE AND status='active'").get(parsed.data.email.trim()) as {id:string;email:string;firstName:string}|undefined;if(user&&smtpSettings()){const token=issueAccountToken(user.id,"password_reset",30),link=`${appOrigin(request)}/passwort-neu?token=${encodeURIComponent(token)}`;await sendMail({to:user.email,subject:"Stärke deine Mitte · Passwort zurücksetzen",text:`Hallo ${user.firstName},\n\nüber diesen Link kannst du innerhalb von 30 Minuten ein neues Passwort setzen:\n${link}\n\nFalls du das nicht angefordert hast, ignoriere diese Nachricht.`}).catch(()=>undefined);audit(user.id,"password_reset.request","user",user.id)}return Response.json(neutral)}
