import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/database";
export async function GET(){const admin=await requireAdmin();if(!admin)return Response.json({error:"Nicht berechtigt."},{status:403});const users=db.prepare(`SELECT u.id,u.email,u.role,u.first_name firstName,u.last_name lastName,u.birthday,u.phone,u.status,u.created_at createdAt,(SELECT COUNT(*) FROM enrollments e WHERE e.user_id=u.id) courseCount FROM users u ORDER BY u.last_name,u.first_name`).all();return Response.json({users});}
