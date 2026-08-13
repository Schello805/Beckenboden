import {db} from "@/lib/database";
import {sendMail,smtpSettings} from "@/lib/mail";

export async function notifyAdmins(subject:string,text:string){
  try{
    if(!smtpSettings())return;
    const recipients=(db.prepare("SELECT email FROM users WHERE role='admin' AND status='active' ORDER BY created_at").all() as {email:string}[]).map(row=>row.email);
    await Promise.all(recipients.map(to=>sendMail({to,subject:`Stärke deine Mitte · ${subject}`,text}).catch(()=>undefined)));
  }catch{/* Eine Benachrichtigung darf die eigentliche Fachaktion niemals zurückrollen. */}
}
