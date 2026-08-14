import {requireAdmin} from "@/lib/auth";
import {systemHealth} from "@/lib/system-health";
export const dynamic="force-dynamic";export const runtime="nodejs";
export async function GET(){const admin=await requireAdmin();if(!admin)return Response.json({error:"Nicht berechtigt."},{status:403});return Response.json(await systemHealth(),{headers:{"cache-control":"no-store"}})}
