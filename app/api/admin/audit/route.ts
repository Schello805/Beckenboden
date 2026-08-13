import {requireAdmin} from "@/lib/auth";
import {db} from "@/lib/database";
export const dynamic="force-dynamic";
export async function GET(request:Request){
  const admin=await requireAdmin();if(!admin)return Response.json({error:"Nicht berechtigt."},{status:403});
  const limit=Math.min(500,Math.max(25,Number(new URL(request.url).searchParams.get("limit"))||200));
  const entries=db.prepare(`SELECT a.id,a.action,a.entity_type entityType,a.entity_id entityId,a.detail,a.created_at createdAt,
    u.first_name firstName,u.last_name lastName,u.email,
    tu.first_name targetFirstName,tu.last_name targetLastName,tu.email targetEmail,
    ac.code_hint codeHint,c.title courseTitle,s.title sessionTitle
    FROM audit_log a LEFT JOIN users u ON u.id=a.actor_id
    LEFT JOIN users tu ON tu.id=json_extract(a.detail,'$.userId')
    LEFT JOIN access_codes ac ON ac.id=json_extract(a.detail,'$.codeId')
    LEFT JOIN course_sessions s ON s.id=CASE WHEN a.entity_type='session' THEN a.entity_id END
    LEFT JOIN courses c ON c.id=COALESCE(json_extract(a.detail,'$.courseId'),s.course_id,CASE WHEN a.entity_type='course' THEN a.entity_id END)
    ORDER BY a.created_at DESC LIMIT ?`).all(limit) as Array<Record<string,unknown>&{detail:string}>;
  return Response.json({entries:entries.map(entry=>({...entry,detail:JSON.parse(entry.detail||"{}")}))});
}
