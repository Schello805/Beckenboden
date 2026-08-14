import {spawn} from "node:child_process";
import {Readable} from "node:stream";
import fs from "node:fs/promises";
import path from "node:path";
import {requireAdmin} from "@/lib/auth";
import {audit} from "@/lib/database";
export const dynamic="force-dynamic";export const runtime="nodejs";
const root="/var/backups/mein-kraftbaum",pattern=/^\d{8}-\d{6}-(daily|update|manual|pre-restore)$/;
export async function GET(_:Request,{params}:{params:Promise<{name:string}>}){const admin=await requireAdmin();if(!admin)return Response.json({error:"Nicht berechtigt."},{status:403});const {name}=await params;if(!pattern.test(name))return Response.json({error:"Ungültiger Backupname."},{status:400});try{const info=await fs.stat(path.join(root,name));if(!info.isDirectory())throw new Error()}catch{return Response.json({error:"Backup nicht gefunden."},{status:404})}const child=spawn("tar",["-C",root,"-czf","-",name],{stdio:["ignore","pipe","pipe"]});audit(admin.id,"backup.download","backup",name);return new Response(Readable.toWeb(child.stdout) as ReadableStream,{headers:{"content-type":"application/gzip","content-disposition":`attachment; filename="${name}.tar.gz"`,"cache-control":"private, no-store"}})}
