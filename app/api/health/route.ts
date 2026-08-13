import { db } from "@/lib/database";
import { CAPABILITIES,CODE_REVISION } from "@/lib/version";

export const dynamic = "force-dynamic";
export async function GET() {
  db.prepare("SELECT 1").get();
  return Response.json({ok:true,revision:CODE_REVISION,configuredRevision:process.env.APP_REVISION||"development",capabilities:CAPABILITIES,time:new Date().toISOString()},{headers:{"cache-control":"no-store"}});
}
