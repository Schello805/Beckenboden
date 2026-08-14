import {z} from "zod";
import {requireAdmin} from "@/lib/auth";
import {audit,db,now} from "@/lib/database";
import {configuredTimeZone,validTimeZone} from "@/lib/timezone-settings";
const schema=z.object({timeZone:z.string().min(1).refine(validTimeZone,"Unbekannte Zeitzone.")});
export async function GET(){if(!await requireAdmin())return Response.json({error:"Nicht berechtigt."},{status:403});return Response.json({timeZone:configuredTimeZone()})}
export async function POST(request:Request){const admin=await requireAdmin();if(!admin)return Response.json({error:"Nicht berechtigt."},{status:403});const parsed=schema.safeParse(await request.json().catch(()=>null));if(!parsed.success)return Response.json({error:"Bitte wähle eine gültige Zeitzone."},{status:400});db.prepare("INSERT INTO app_settings(key,value,updated_at) VALUES('timezone',?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated_at=excluded.updated_at").run(JSON.stringify(parsed.data),now());audit(admin.id,"timezone.update","settings","timezone",parsed.data);return Response.json({ok:true,timeZone:parsed.data.timeZone,message:"Zeitzone gespeichert. Alle Termine werden entsprechend angezeigt."})}
