import { currentUser } from "@/lib/auth";
import { db } from "@/lib/database";
import { normalizeGrowthMessages } from "@/lib/growth-messages";

export const dynamic="force-dynamic";

export async function GET(){
  const user=await currentUser();
  if(!user)return Response.json({error:"Bitte melde dich an."},{status:401});
  const appearanceRow=db.prepare("SELECT value FROM app_settings WHERE key='appearance'").get() as {value:string}|undefined;
  const storedAppearance=appearanceRow?JSON.parse(appearanceRow.value):{};
  const appearance={figureMediaId:storedAppearance.figureMediaId||null,growthMediaIds:Array.from({length:9},(_,index)=>storedAppearance.growthMediaIds?.[index]||null),growthMessages:normalizeGrowthMessages(storedAppearance.growthMessages)};
  const courses=db.prepare(`SELECT c.id,c.title,c.description,c.session_count sessionCount,c.duration_minutes durationMinutes,c.starts_at startsAt,c.ends_at endsAt,c.location,c.navigation_url navigationUrl,c.status,e.tree_variant treeVariant,e.completed_at completedAt,(SELECT COUNT(*) FROM attendance a JOIN course_sessions s ON s.id=a.session_id WHERE a.user_id=e.user_id AND s.course_id=c.id) attendedCount FROM enrollments e JOIN courses c ON c.id=e.course_id WHERE e.user_id=? ORDER BY COALESCE(c.ends_at,'9999') DESC`).all(user.id);
  const upcoming=db.prepare(`SELECT s.id,s.course_id courseId,s.sequence,s.title,s.starts_at startsAt,s.ends_at endsAt,COALESCE(s.location,c.location) location,COALESCE(s.navigation_url,c.navigation_url) navigationUrl FROM course_sessions s JOIN courses c ON c.id=s.course_id JOIN enrollments e ON e.course_id=c.id WHERE e.user_id=? AND s.starts_at>=? ORDER BY s.starts_at LIMIT 20`).all(user.id,new Date().toISOString());
  const decorations=db.prepare(`SELECT DISTINCT d.id,d.media_id mediaId,d.title,d.memory_text memoryText,d.position_x positionX,d.position_y positionY,d.size_percent sizePercent,d.rotation FROM tree_decorations d JOIN enrollments e ON e.course_id=d.course_id LEFT JOIN tree_decoration_unlocks u ON u.decoration_id=d.id AND u.user_id=e.user_id WHERE e.user_id=? AND d.status='published' AND (e.completed_at IS NOT NULL OR u.id IS NOT NULL) ORDER BY d.created_at`).all(user.id);
  return Response.json({user,courses,upcoming,appearance,decorations});
}
