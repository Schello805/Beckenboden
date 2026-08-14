import {z} from "zod";
import {requireAdmin} from "@/lib/auth";
import {audit,db,now} from "@/lib/database";

const updateSchema=z.object({startsAt:z.string().datetime()});
type SessionRow={id:string;course_id:string;sequence:number;title:string;starts_at:string;ends_at:string};
type CourseRow={title:string;durationMinutes:number};

export async function PATCH(request:Request,{params}:{params:Promise<{courseId:string;sessionId:string}>}){
  const admin=await requireAdmin();
  if(!admin)return Response.json({error:"Nicht berechtigt."},{status:403});
  const parsed=updateSchema.safeParse(await request.json().catch(()=>null));
  if(!parsed.success)return Response.json({error:"Bitte gib ein gültiges Datum und eine gültige Startzeit an."},{status:400});
  const {courseId,sessionId}=await params;
  const session=db.prepare("SELECT * FROM course_sessions WHERE id=? AND course_id=?").get(sessionId,courseId) as SessionRow|undefined;
  const course=db.prepare("SELECT title,duration_minutes durationMinutes FROM courses WHERE id=?").get(courseId) as CourseRow|undefined;
  if(!session||!course)return Response.json({error:"Termin nicht gefunden."},{status:404});
  const startsAt=parsed.data.startsAt,endsAt=new Date(Date.parse(startsAt)+course.durationMinutes*60000).toISOString();
  db.prepare("UPDATE course_sessions SET title=?,starts_at=?,ends_at=?,updated_at=? WHERE id=?").run(`${course.title} · Einheit ${session.sequence}`,startsAt,endsAt,now(),sessionId);
  audit(admin.id,"session.update","session",sessionId,{courseId,sequence:session.sequence,startsAt,previousStartsAt:session.starts_at});
  return Response.json({ok:true});
}

export async function DELETE(_:Request,{params}:{params:Promise<{courseId:string;sessionId:string}>}){
  const admin=await requireAdmin();
  if(!admin)return Response.json({error:"Nicht berechtigt."},{status:403});
  const {courseId,sessionId}=await params;
  const session=db.prepare("SELECT * FROM course_sessions WHERE id=? AND course_id=?").get(sessionId,courseId) as SessionRow|undefined;
  if(!session)return Response.json({error:"Termin nicht gefunden."},{status:404});
  const attendanceCount=(db.prepare("SELECT COUNT(*) count FROM attendance WHERE session_id=?").get(sessionId) as {count:number}).count,timestamp=now();
  db.transaction(()=>{
    db.prepare("INSERT INTO attendance_archive (id,course_id,session_id,participant_reference,source,recorded_at,archived_at) SELECT lower(hex(randomblob(16))),?,?, 'user:'||user_id,source,recorded_at,? FROM attendance WHERE session_id=?").run(courseId,sessionId,timestamp,sessionId);
    db.prepare("DELETE FROM attendance WHERE session_id=?").run(sessionId);
    db.prepare("DELETE FROM course_sessions WHERE id=? AND course_id=?").run(sessionId,courseId);
  })();
  audit(admin.id,"session.delete","session",sessionId,{courseId,sequence:session.sequence,attendanceArchived:attendanceCount});
  return Response.json({ok:true,attendanceArchived:attendanceCount});
}
