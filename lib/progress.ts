import { db, now } from "./database";

export function refreshCompletion(userId:string,courseId:string){
  const course=db.prepare("SELECT session_count sessionCount FROM courses WHERE id=?").get(courseId) as {sessionCount:number}|undefined;
  if(!course)return;
  const attended=(db.prepare("SELECT COUNT(*) count FROM attendance a JOIN course_sessions s ON s.id=a.session_id WHERE a.user_id=? AND s.course_id=?").get(userId,courseId) as {count:number}).count;
  db.prepare("UPDATE enrollments SET completed_at=? WHERE user_id=? AND course_id=?").run(attended>=course.sessionCount?now():null,userId,courseId);
}

export function courseProgress(userId:string,courseId:string){
  return db.prepare(`SELECT c.id,c.title,c.description,c.session_count sessionCount,c.duration_minutes durationMinutes,c.starts_at startsAt,c.ends_at endsAt,c.location,c.navigation_url navigationUrl,c.status,e.tree_variant treeVariant,e.completed_at completedAt,
    (SELECT COUNT(*) FROM attendance a JOIN course_sessions s ON s.id=a.session_id WHERE a.user_id=e.user_id AND s.course_id=c.id) attendedCount
    FROM enrollments e JOIN courses c ON c.id=e.course_id WHERE e.user_id=? AND c.id=?`).get(userId,courseId);
}
