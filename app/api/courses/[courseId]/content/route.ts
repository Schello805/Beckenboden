import { currentUser } from "@/lib/auth";
import { db } from "@/lib/database";

export async function GET(_:Request,{params}:{params:Promise<{courseId:string}>}){
  const user=await currentUser();if(!user)return Response.json({error:"Bitte melde dich an."},{status:401});
  const {courseId}=await params;
  const enrollment=db.prepare("SELECT completed_at completedAt,access_mode accessMode FROM enrollments WHERE user_id=? AND course_id=?").get(user.id,courseId) as {completedAt:string|null;accessMode:string}|undefined;
  if(!enrollment)return Response.json({error:"Kurs nicht gefunden."},{status:404});
  const attendanceCount=(db.prepare("SELECT COUNT(*) count FROM attendance a JOIN course_sessions s ON s.id=a.session_id WHERE a.user_id=? AND s.course_id=?").get(user.id,courseId) as {count:number}).count;
  const attendedSequences=new Set((db.prepare("SELECT s.sequence FROM attendance a JOIN course_sessions s ON s.id=a.session_id WHERE a.user_id=? AND s.course_id=?").all(user.id,courseId) as {sequence:number}[]).map(x=>x.sequence));
  const rows=db.prepare(`SELECT i.id,i.title,i.kind,i.body,i.asset_path assetPath,i.external_url externalUrl,i.content_updated_at contentUpdatedAt,r.rule_type ruleType,r.threshold,r.session_sequence sessionSequence,
    EXISTS(SELECT 1 FROM manual_unlocks m WHERE m.user_id=? AND m.content_id=i.id) manualUnlocked
    FROM content_items i JOIN unlock_rules r ON r.content_id=i.id WHERE i.course_id=? AND i.status='published' ORDER BY i.created_at`).all(user.id,courseId) as {id:string;title:string;kind:string;body:string|null;assetPath:string|null;externalUrl:string|null;contentUpdatedAt:string;ruleType:string;threshold:number|null;sessionSequence:number|null;manualUnlocked:number}[];
  const items=rows.filter(item=>enrollment.accessMode==="full"||item.manualUnlocked||item.ruleType==="immediate"||(item.ruleType==="attendance_count"&&attendanceCount>=(item.threshold||0))||(item.ruleType==="session"&&attendedSequences.has(item.sessionSequence||0))||(item.ruleType==="completion"&&enrollment.completedAt));
  return Response.json({items,attendanceCount,completed:Boolean(enrollment.completedAt)});
}
