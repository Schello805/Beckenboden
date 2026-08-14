import {z} from "zod";
import {requireAdmin} from "@/lib/auth";
import {db} from "@/lib/database";
import {retryMail} from "@/lib/mail-queue";
export const dynamic="force-dynamic";
export async function GET(){const admin=await requireAdmin();if(!admin)return Response.json({error:"Nicht berechtigt."},{status:403});const jobs=db.prepare("SELECT id,kind,recipient,status,attempts,max_attempts maxAttempts,last_error lastError,created_at createdAt,updated_at updatedAt,sent_at sentAt,code_hint codeHint FROM mail_queue ORDER BY created_at DESC LIMIT 250").all(),counts=db.prepare("SELECT status,COUNT(*) count FROM mail_queue GROUP BY status").all();return Response.json({jobs,counts},{headers:{"cache-control":"no-store"}})}
const retrySchema=z.object({id:z.string().uuid()});
export async function POST(request:Request){const admin=await requireAdmin();if(!admin)return Response.json({error:"Nicht berechtigt."},{status:403});const parsed=retrySchema.safeParse(await request.json().catch(()=>null));if(!parsed.success)return Response.json({error:"Ungültiger Versandauftrag."},{status:400});if(!retryMail(parsed.data.id,admin.id))return Response.json({error:"Nur endgültig fehlgeschlagene E-Mails können erneut vorgemerkt werden."},{status:409});return Response.json({ok:true,message:"Die E-Mail wurde erneut zum Versand vorgemerkt."})}
