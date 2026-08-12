import { db } from "@/lib/database";
export const dynamic="force-dynamic";
export async function GET(){return Response.json({events:db.prepare("SELECT id,title,description,starts_at startsAt,ends_at endsAt,location,navigation_url navigationUrl,shop_url shopUrl FROM public_events WHERE status='published' AND ends_at>=? ORDER BY starts_at LIMIT 20").all(new Date().toISOString())})}
