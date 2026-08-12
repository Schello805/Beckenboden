import { db } from "@/lib/database";

type Rule={ruleType:string;threshold:number|null;sessionSequence:number|null;manualUnlocked:number};

export function mayAccessContent(userId:string,courseId:string,contentId:string){
  const enrollment=db.prepare("SELECT completed_at completedAt,access_mode accessMode FROM enrollments WHERE user_id=? AND course_id=?").get(userId,courseId) as {completedAt:string|null;accessMode:string}|undefined;
  if(!enrollment)return false;
  if(enrollment.accessMode==="full")return true;
  const rule=db.prepare(`SELECT r.rule_type ruleType,r.threshold,r.session_sequence sessionSequence,
    EXISTS(SELECT 1 FROM manual_unlocks m WHERE m.user_id=? AND m.content_id=r.content_id) manualUnlocked
    FROM unlock_rules r WHERE r.content_id=?`).get(userId,contentId) as Rule|undefined;
  if(!rule)return false;
  if(rule.manualUnlocked||rule.ruleType==="immediate")return true;
  if(rule.ruleType==="completion")return Boolean(enrollment.completedAt);
  if(rule.ruleType==="attendance_count"){
    const count=(db.prepare("SELECT COUNT(*) count FROM attendance a JOIN course_sessions s ON s.id=a.session_id WHERE a.user_id=? AND s.course_id=?").get(userId,courseId) as {count:number}).count;
    return count>=(rule.threshold||0);
  }
  if(rule.ruleType==="session")return Boolean(db.prepare("SELECT 1 FROM attendance a JOIN course_sessions s ON s.id=a.session_id WHERE a.user_id=? AND s.course_id=? AND s.sequence=?").get(userId,courseId,rule.sessionSequence));
  return false;
}
