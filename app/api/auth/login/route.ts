import bcrypt from "bcryptjs";
import { z } from "zod";
import { createSession } from "@/lib/auth";
import { audit, db } from "@/lib/database";
import { failedLogin, loginAllowed, successfulLogin } from "@/lib/rate-limit";

const schema=z.object({email:z.email(),password:z.string().min(1)});
export async function POST(request:Request){
  const parsed=schema.safeParse(await request.json().catch(()=>null));
  if(!parsed.success) return Response.json({error:"E-Mail oder Passwort ist falsch."},{status:401});
  if(!loginAllowed(parsed.data.email))return Response.json({error:"Zu viele Anmeldeversuche. Bitte versuche es später erneut."},{status:429});
  const user=db.prepare("SELECT id,email,password_hash passwordHash,role,first_name firstName,last_name lastName,status FROM users WHERE email=? COLLATE NOCASE").get(parsed.data.email.trim()) as {id:string,email:string,passwordHash:string,role:"user"|"admin",firstName:string,lastName:string,status:string}|undefined;
  if(!user||user.status!=="active"||!await bcrypt.compare(parsed.data.password,user.passwordHash)){failedLogin(parsed.data.email);return Response.json({error:"E-Mail oder Passwort ist falsch."},{status:401});}
  successfulLogin(parsed.data.email);
  await createSession({id:user.id,email:user.email,role:user.role,firstName:user.firstName,lastName:user.lastName});
  audit(user.id,"auth.login","user",user.id);
  return Response.json({user:{id:user.id,email:user.email,role:user.role,firstName:user.firstName,lastName:user.lastName}});
}
