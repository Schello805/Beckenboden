import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { audit,db,now } from "@/lib/database";
const schema=z.object({status:z.enum(["draft","published","archived"])});
export async function PATCH(request:Request,{params}:{params:Promise<{eventId:string}>}){const admin=await requireAdmin();if(!admin)return Response.json({error:"Nicht berechtigt."},{status:403});const parsed=schema.safeParse(await request.json().catch(()=>null));if(!parsed.success)return Response.json({error:"Ungültiger Status."},{status:400});const {eventId}=await params;const result=db.prepare("UPDATE public_events SET status=?,updated_at=? WHERE id=?").run(parsed.data.status,now(),eventId);if(!result.changes)return Response.json({error:"Veranstaltung nicht gefunden."},{status:404});audit(admin.id,"event.update","event",eventId,parsed.data);return Response.json({ok:true})}
