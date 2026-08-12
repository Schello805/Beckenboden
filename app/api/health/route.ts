import { db } from "@/lib/database";

export const dynamic = "force-dynamic";
export async function GET() {
  db.prepare("SELECT 1").get();
  return Response.json({ ok: true, revision: process.env.APP_REVISION || "development", time: new Date().toISOString() });
}
