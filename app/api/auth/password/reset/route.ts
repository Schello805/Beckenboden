import bcrypt from "bcryptjs";
import { z } from "zod";
import { consumeAccountToken } from "@/lib/account-tokens";
import { audit,db,now } from "@/lib/database";
const schema=z.object({token:z.string().min(32),password:z.string().min(12).max(200)});
export async function POST(request:Request){const parsed=schema.safeParse(await request.json().catch(()=>null));if(!parsed.success)return Response.json({error:"Link oder Passwort ist ungültig."},{status:400});const userId=consumeAccountToken(parsed.data.token,"password_reset");if(!userId)return Response.json({error:"Der Link ist ungültig oder abgelaufen."},{status:400});db.prepare("UPDATE users SET password_hash=?,updated_at=? WHERE id=?").run(await bcrypt.hash(parsed.data.password,12),now(),userId);audit(userId,"password_reset.complete","user",userId);return Response.json({ok:true})}
