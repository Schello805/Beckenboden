import crypto from "node:crypto";
import {processMailQueue} from "@/lib/mail-queue";
import {queueSystemAlerts} from "@/lib/system-health";
import {processSessionReminders} from "@/lib/session-reminders";

export const dynamic="force-dynamic";export const runtime="nodejs";
function allowed(request:Request){const expected=process.env.INTERNAL_JOB_TOKEN||"",provided=request.headers.get("authorization")?.replace(/^Bearer\s+/i,"")||"";if(!expected||expected.length!==provided.length)return false;return crypto.timingSafeEqual(Buffer.from(expected),Buffer.from(provided))}
export async function POST(request:Request){if(!allowed(request))return Response.json({error:"Nicht berechtigt."},{status:403});const reminders=await processSessionReminders(),mail=await processMailQueue(30),health=await queueSystemAlerts();return Response.json({reminders,mail,health},{headers:{"cache-control":"no-store"}})}
