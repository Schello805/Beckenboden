import bcrypt from "bcryptjs";
import { z } from "zod";
import { audit, db, id, now } from "@/lib/database";
import { createSession } from "@/lib/auth";
import {requestAllowed} from "@/lib/rate-limit";

const schema=z.object({installToken:z.string().min(16),email:z.email(),password:z.string().min(8),firstName:z.string().min(1),lastName:z.string().min(1)});
export async function POST(request:Request){
  if(!requestAllowed(request,"setup",10,60*60_000))return Response.json({error:"Zu viele Einrichtungsversuche. Bitte warte eine Stunde."},{status:429});
  const parsed=schema.safeParse(await request.json().catch(()=>null));
  if(!parsed.success) return Response.json({error:"Ungültige Eingaben."},{status:400});
  if(!process.env.INSTALL_TOKEN || parsed.data.installToken!==process.env.INSTALL_TOKEN) return Response.json({error:"Installationsschlüssel ungültig."},{status:403});
  const count=(db.prepare("SELECT COUNT(*) count FROM users WHERE role='admin'").get() as {count:number}).count;
  if(count) return Response.json({error:"Die Einrichtung ist bereits abgeschlossen."},{status:409});
  const userId=id(), timestamp=now(), hash=await bcrypt.hash(parsed.data.password,12);
  db.prepare("INSERT INTO users (id,email,password_hash,role,first_name,last_name,status,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?)")
    .run(userId,parsed.data.email.trim().toLowerCase(),hash,"admin",parsed.data.firstName.trim(),parsed.data.lastName.trim(),"active",timestamp,timestamp);
  audit(userId,"setup.initialize","user",userId);
  await createSession({id:userId,email:parsed.data.email.trim().toLowerCase(),role:"admin",firstName:parsed.data.firstName.trim(),lastName:parsed.data.lastName.trim()});
  return Response.json({ok:true},{status:201});
}
