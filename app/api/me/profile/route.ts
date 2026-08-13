import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { z } from "zod";
import { clearSession,createSession,currentUser } from "@/lib/auth";
import { audit,db,now } from "@/lib/database";

const profile=z.object({action:z.literal("profile"),firstName:z.string().min(1).max(80),lastName:z.string().min(1).max(80),birthday:z.string().nullable().optional(),phone:z.string().max(60).nullable().optional()});
const email=z.object({action:z.literal("email"),email:z.email(),currentPassword:z.string().min(1)});
const password=z.object({action:z.literal("password"),currentPassword:z.string().min(1),newPassword:z.string().min(12).max(200)});
const remove=z.object({action:z.literal("anonymize"),currentPassword:z.string().min(1),confirmation:z.literal("KONTO LÖSCHEN")});
const schema=z.discriminatedUnion("action",[profile,email,password,remove]);

export async function GET(){const user=await currentUser();if(!user)return Response.json({error:"Bitte melde dich an."},{status:401});const row=db.prepare("SELECT id,email,first_name firstName,last_name lastName,birthday,phone,email_verified_at emailVerifiedAt FROM users WHERE id=?").get(user.id);return Response.json({profile:row})}

export async function PATCH(request:Request){
  const user=await currentUser();
  if(!user)return Response.json({error:"Bitte melde dich an."},{status:401});
  const parsed=schema.safeParse(await request.json().catch(()=>null));
  if(!parsed.success)return Response.json({error:"Bitte prüfe deine Angaben."},{status:400});
  if(parsed.data.action==="profile"){
    const next={firstName:parsed.data.firstName.trim(),lastName:parsed.data.lastName.trim(),birthday:parsed.data.birthday||null,phone:parsed.data.phone?.trim()||null};
    db.prepare("UPDATE users SET first_name=?,last_name=?,birthday=?,phone=?,updated_at=? WHERE id=?").run(next.firstName,next.lastName,next.birthday,next.phone,now(),user.id);
    audit(user.id,"profile.update","user",user.id);
    await createSession({...user,firstName:next.firstName,lastName:next.lastName});
    return Response.json({ok:true,profile:{...next,email:user.email}});
  }
  const row=db.prepare("SELECT password_hash passwordHash FROM users WHERE id=?").get(user.id) as {passwordHash:string};
  if(!await bcrypt.compare(parsed.data.currentPassword,row.passwordHash))return Response.json({error:"Das aktuelle Passwort ist nicht richtig."},{status:403});
  if(parsed.data.action==="password"){
    db.prepare("UPDATE users SET password_hash=?,updated_at=? WHERE id=?").run(await bcrypt.hash(parsed.data.newPassword,12),now(),user.id);
    audit(user.id,"profile.password_change","user",user.id);
    await clearSession();
    return Response.json({ok:true,loggedOut:true});
  }
  if(parsed.data.action==="email"){
    const nextEmail=parsed.data.email.trim().toLowerCase();
    if(nextEmail===user.email.toLowerCase())return Response.json({ok:true,email:user.email,unchanged:true});
    try{db.prepare("UPDATE users SET email=?,email_verified_at=NULL,updated_at=? WHERE id=?").run(nextEmail,now(),user.id)}catch{return Response.json({error:"Diese E-Mail-Adresse wird bereits verwendet."},{status:409})}
    audit(user.id,"profile.email_change","user",user.id);
    await createSession({...user,email:nextEmail});
    return Response.json({ok:true,email:nextEmail,verificationRequired:true});
  }
  const active=(db.prepare("SELECT COUNT(*) count FROM enrollments e JOIN courses c ON c.id=e.course_id WHERE e.user_id=? AND e.completed_at IS NULL AND c.status<>'archived'").get(user.id) as {count:number}).count;
  if(active)return Response.json({error:"Dein Konto hat noch einen aktiven Kurs. Bitte kontaktiere Anja, bevor du es anonymisierst."},{status:409});
  const timestamp=now(),reference=crypto.createHash("sha256").update(`${user.id}:${process.env.SESSION_SECRET}`).digest("hex").slice(0,24);
  db.transaction(()=>{db.prepare("INSERT INTO attendance_archive (id,course_id,session_id,participant_reference,source,recorded_at,archived_at) SELECT lower(hex(randomblob(16))),s.course_id,a.session_id,?,a.source,a.recorded_at,? FROM attendance a JOIN course_sessions s ON s.id=a.session_id WHERE a.user_id=?").run(reference,timestamp,user.id);db.prepare("DELETE FROM attendance WHERE user_id=?").run(user.id);db.prepare("DELETE FROM manual_unlocks WHERE user_id=?").run(user.id);db.prepare("DELETE FROM consent_history WHERE user_id=?").run(user.id);db.prepare("DELETE FROM enrollments WHERE user_id=?").run(user.id);db.prepare("UPDATE access_codes SET redeemed_by=NULL WHERE redeemed_by=?").run(user.id);db.prepare("UPDATE users SET email=?,password_hash='',first_name='Gelöscht',last_name='Konto',birthday=NULL,phone=NULL,status='anonymized',updated_at=? WHERE id=?").run(`deleted-${reference}@invalid.local`,timestamp,user.id)})();
  audit(null,"profile.anonymize","user",user.id,{attendanceReference:reference});
  await clearSession();
  return Response.json({ok:true,loggedOut:true});
}
