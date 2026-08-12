import webpush from "web-push";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { audit,db,now } from "@/lib/database";
import { pushSettings } from "@/lib/push";
import { encryptSecret } from "@/lib/two-factor";
const schema=z.object({subject:z.string().refine(value=>value.startsWith("mailto:")||value.startsWith("https://"))});
export async function GET(){const admin=await requireAdmin();if(!admin)return Response.json({error:"Nicht berechtigt."},{status:403});const settings=pushSettings();return Response.json(settings?{configured:true,publicKey:settings.publicKey,subject:settings.subject}:{configured:false})}
export async function POST(request:Request){const admin=await requireAdmin();if(!admin)return Response.json({error:"Nicht berechtigt."},{status:403});const parsed=schema.safeParse(await request.json().catch(()=>null));if(!parsed.success)return Response.json({error:"Als Kontakt wird mailto:adresse oder eine HTTPS-URL benötigt."},{status:400});const keys=webpush.generateVAPIDKeys(),value={publicKey:keys.publicKey,encryptedPrivateKey:encryptSecret(keys.privateKey),subject:parsed.data.subject};db.prepare("INSERT INTO app_settings (key,value,updated_at) VALUES ('push',?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated_at=excluded.updated_at").run(JSON.stringify(value),now());audit(admin.id,"push.configure","settings","push");return Response.json({publicKey:keys.publicKey})}
