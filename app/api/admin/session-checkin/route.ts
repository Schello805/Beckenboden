import crypto from "node:crypto";
import QRCode from "qrcode";
import {z} from "zod";
import {requireAdmin} from "@/lib/auth";
import {audit,db,id,now} from "@/lib/database";
const createSchema=z.object({sessionId:z.string().uuid(),minutes:z.number().int().min(5).max(240).default(45)});
const closeSchema=z.object({checkinId:z.string().uuid()});
const hash=(value:string)=>crypto.createHash("sha256").update(value).digest("hex");
export async function POST(request:Request){
  const admin=await requireAdmin();if(!admin)return Response.json({error:"Nicht berechtigt."},{status:403});
  const parsed=createSchema.safeParse(await request.json().catch(()=>null));if(!parsed.success)return Response.json({error:"Bitte wähle einen Termin und eine gültige Dauer."},{status:400});
  const session=db.prepare("SELECT id,title FROM course_sessions WHERE id=?").get(parsed.data.sessionId) as {id:string;title:string}|undefined;if(!session)return Response.json({error:"Termin nicht gefunden."},{status:404});
  db.prepare("UPDATE session_checkins SET closed_at=? WHERE session_id=? AND closed_at IS NULL").run(now(),session.id);
  const token=crypto.randomBytes(24).toString("base64url"),checkinId=id(),createdAt=now(),expiresAt=new Date(Date.now()+parsed.data.minutes*60000).toISOString();
  db.prepare("INSERT INTO session_checkins (id,session_id,token_hash,created_by,expires_at,created_at) VALUES (?,?,?,?,?,?)").run(checkinId,session.id,hash(token),admin.id,expiresAt,createdAt);
  const origin=process.env.APP_URL||new URL(request.url).origin,url=`${origin.replace(/\/$/,"")}/?checkin=${encodeURIComponent(token)}`;
  audit(admin.id,"checkin.open","session",session.id,{checkinId,expiresAt});
  return Response.json({id:checkinId,url,expiresAt,qrCode:await QRCode.toDataURL(url,{width:640,margin:3,errorCorrectionLevel:"M"})},{status:201});
}
export async function DELETE(request:Request){
  const admin=await requireAdmin();if(!admin)return Response.json({error:"Nicht berechtigt."},{status:403});
  const parsed=closeSchema.safeParse(await request.json().catch(()=>null));if(!parsed.success)return Response.json({error:"Ungültiger Check-in."},{status:400});
  const row=db.prepare("SELECT session_id sessionId FROM session_checkins WHERE id=?").get(parsed.data.checkinId) as {sessionId:string}|undefined;if(!row)return Response.json({error:"Check-in nicht gefunden."},{status:404});
  db.prepare("UPDATE session_checkins SET closed_at=? WHERE id=?").run(now(),parsed.data.checkinId);audit(admin.id,"checkin.close","session",row.sessionId,{checkinId:parsed.data.checkinId});return Response.json({ok:true});
}
