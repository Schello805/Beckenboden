import fs from "node:fs/promises";
import path from "node:path";
import { requireAdmin } from "@/lib/auth";
import { audit, db, id, now } from "@/lib/database";
import { mediaDir, safeStoredName, validateMedia } from "@/lib/media";

export const runtime="nodejs";
export async function POST(request:Request){const admin=await requireAdmin();if(!admin)return Response.json({error:"Nicht berechtigt."},{status:403});const form=await request.formData();const file=form.get("file");if(!(file instanceof File))return Response.json({error:"Keine Datei empfangen."},{status:400});const error=validateMedia(file);if(error)return Response.json({error},{status:400});const storedName=safeStoredName(file),mediaId=id();await fs.writeFile(path.join(mediaDir,storedName),Buffer.from(await file.arrayBuffer()),{mode:0o600,flag:"wx"});db.prepare("INSERT INTO media_files (id,owner_id,original_name,stored_name,mime_type,size_bytes,created_at) VALUES (?,?,?,?,?,?,?)").run(mediaId,admin.id,file.name,storedName,file.type,file.size,now());audit(admin.id,"media.upload","media",mediaId,{name:file.name,type:file.type,size:file.size});return Response.json({id:mediaId,name:file.name,type:file.type,size:file.size},{status:201});}
