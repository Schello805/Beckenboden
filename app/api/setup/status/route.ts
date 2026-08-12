import { db } from "@/lib/database";
export async function GET() {
  const admins = db.prepare("SELECT COUNT(*) count FROM users WHERE role='admin'").get() as {count:number};
  return Response.json({ setupRequired: admins.count === 0 });
}
