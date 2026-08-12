import QRCode from "qrcode";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { audit,db,now } from "@/lib/database";
import { decryptSecret,encryptSecret,hashRecoveryCodes,makeRecoveryCodes,newTotp,validTotp } from "@/lib/two-factor";

const schema=z.discriminatedUnion("action",[
  z.object({action:z.literal("begin")}),
  z.object({action:z.literal("confirm"),code:z.string().regex(/^\d{6}$/)})
]);
export async function GET(){const admin=await requireAdmin({allowTwoFactorSetup:true});if(!admin)return Response.json({error:"Nicht berechtigt."},{status:403});const row=db.prepare("SELECT two_factor_method method,two_factor_enabled_at enabledAt FROM users WHERE id=?").get(admin.id);return Response.json(row)}
export async function POST(request:Request){const admin=await requireAdmin({allowTwoFactorSetup:true});if(!admin)return Response.json({error:"Nicht berechtigt."},{status:403});const parsed=schema.safeParse(await request.json().catch(()=>null));if(!parsed.success)return Response.json({error:"Ungültige Eingabe."},{status:400});if(parsed.data.action==="begin"){const setup=newTotp(admin.email);db.prepare("UPDATE users SET two_factor_pending_secret=?,updated_at=? WHERE id=?").run(encryptSecret(setup.secret),now(),admin.id);audit(admin.id,"2fa.begin","user",admin.id);return Response.json({qrCode:await QRCode.toDataURL(setup.uri,{width:280,margin:1}),manualKey:setup.secret});}const row=db.prepare("SELECT two_factor_pending_secret secret FROM users WHERE id=?").get(admin.id) as {secret:string|null}|undefined;if(!row?.secret||!validTotp(decryptSecret(row.secret),parsed.data.code))return Response.json({error:"Der Code ist nicht gültig."},{status:400});const recoveryCodes=makeRecoveryCodes();db.prepare("UPDATE users SET two_factor_secret=two_factor_pending_secret,two_factor_pending_secret=NULL,two_factor_method='totp',recovery_codes=?,two_factor_enabled_at=?,updated_at=? WHERE id=?").run(JSON.stringify(await hashRecoveryCodes(recoveryCodes)),now(),now(),admin.id);audit(admin.id,"2fa.enable","user",admin.id);return Response.json({recoveryCodes});}
