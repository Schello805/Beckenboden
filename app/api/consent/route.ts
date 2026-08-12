import { z } from "zod";
import { currentUser } from "@/lib/auth";
import { db,id,now } from "@/lib/database";
const schema=z.object({analytics:z.boolean()});
export async function POST(request:Request){const parsed=schema.safeParse(await request.json().catch(()=>null));if(!parsed.success)return Response.json({error:"Ungültige Auswahl."},{status:400});const user=await currentUser();db.prepare("INSERT INTO consent_history (id,user_id,consent_type,granted,created_at) VALUES (?,?,?,?,?)").run(id(),user?.id||null,"analytics",parsed.data.analytics?1:0,now());return Response.json({ok:true})}
