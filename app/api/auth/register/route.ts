import bcrypt from "bcryptjs";
import { z } from "zod";
import { createSession } from "@/lib/auth";
import { hashCode } from "@/lib/codes";
import { audit, db, id, now } from "@/lib/database";

const schema=z.object({code:z.string().min(8),email:z.email(),password:z.string().min(8),firstName:z.string().min(1),lastName:z.string().min(1),birthday:z.string().optional(),phone:z.string().optional()});
export async function POST(request:Request){
  const parsed=schema.safeParse(await request.json().catch(()=>null));
  if(!parsed.success)return Response.json({error:"Bitte prüfe deine Eingaben."},{status:400});
  const email=parsed.data.email.trim().toLowerCase();
  const code=db.prepare("SELECT id,course_id courseId,type,assigned_email assignedEmail,redeemed_by redeemedBy FROM access_codes WHERE code_hash=?").get(hashCode(parsed.data.code)) as {id:string,courseId:string,type:string,assignedEmail:string|null,redeemedBy:string|null}|undefined;
  if(!code||code.redeemedBy||(code.assignedEmail&&code.assignedEmail.toLowerCase()!==email)) return Response.json({error:"Dieser Code ist ungültig oder bereits verwendet."},{status:400});
  if(db.prepare("SELECT 1 FROM users WHERE email=? COLLATE NOCASE").get(email)) return Response.json({error:"Für diese E-Mail besteht bereits ein Konto. Bitte melde dich an und löse den Code im Profil ein.",existingAccount:true},{status:409});
  const userId=id(),timestamp=now(),passwordHash=await bcrypt.hash(parsed.data.password,12);
  const transaction=db.transaction(()=>{
    db.prepare("INSERT INTO users (id,email,password_hash,role,first_name,last_name,birthday,phone,status,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)").run(userId,email,passwordHash,"user",parsed.data.firstName.trim(),parsed.data.lastName.trim(),parsed.data.birthday||null,parsed.data.phone||null,"active",timestamp,timestamp);
    db.prepare("INSERT INTO enrollments (id,user_id,course_id,access_mode,tree_variant,created_at) VALUES (?,?,?,?,?,?)").run(id(),userId,code.courseId,code.type,"sage",timestamp);
    db.prepare("UPDATE access_codes SET redeemed_by=?,redeemed_at=? WHERE id=?").run(userId,timestamp,code.id);
  }); transaction();
  audit(userId,"auth.register","user",userId,{courseId:code.courseId,codeId:code.id});
  await createSession({id:userId,email,role:"user",firstName:parsed.data.firstName.trim(),lastName:parsed.data.lastName.trim()});
  return Response.json({ok:true},{status:201});
}
