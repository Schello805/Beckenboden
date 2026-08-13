import fs from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/database";
import { mediaDir } from "@/lib/media";
import { mayAccessContent } from "@/lib/content-access";

export const runtime="nodejs";
export const dynamic="force-dynamic";

function appearanceIncludes(value:string|undefined,mediaId:string){try{const parsed=value?JSON.parse(value):{};return parsed.figureMediaId===mediaId||(Array.isArray(parsed.growthMediaIds)&&parsed.growthMediaIds.includes(mediaId))}catch{return false}}

export async function GET(request:Request,{params}:{params:Promise<{mediaId:string}>}){
  const user=await currentUser();
  if(!user)return Response.json({error:"Bitte melde dich an."},{status:401});
  const {mediaId}=await params;
  const row=db.prepare("SELECT stored_name storedName,original_name originalName,mime_type mimeType,size_bytes sizeBytes FROM media_files WHERE id=?").get(mediaId) as {storedName:string;originalName:string;mimeType:string;sizeBytes:number}|undefined;
  if(!row)return Response.json({error:"Datei nicht gefunden."},{status:404});
  const links=db.prepare("SELECT id,course_id courseId FROM content_items WHERE asset_path=? AND status='published'").all(mediaId) as {id:string;courseId:string}[];
  const appearanceRow=db.prepare("SELECT value FROM app_settings WHERE key='appearance'").get() as {value:string}|undefined;
  const decorationAccess=db.prepare(`SELECT 1 FROM tree_decorations d JOIN enrollments e ON e.course_id=d.course_id LEFT JOIN tree_decoration_unlocks u ON u.decoration_id=d.id AND u.user_id=e.user_id WHERE d.media_id=? AND e.user_id=? AND d.status='published' AND (e.completed_at IS NOT NULL OR u.id IS NOT NULL) LIMIT 1`).get(mediaId,user.id);
  const access=user.role==="admin"||appearanceIncludes(appearanceRow?.value,mediaId)||Boolean(decorationAccess)||links.some(item=>mayAccessContent(user.id,item.courseId,item.id));
  if(!access)return Response.json({error:"Nicht freigeschaltet."},{status:403});
  const filePath=path.join(mediaDir,row.storedName),range=request.headers.get("range");
  let start=0,end=row.sizeBytes-1,status=200;
  if(range){const match=/bytes=(\d*)-(\d*)/.exec(range);if(!match)return new Response(null,{status:416});start=match[1]?Number(match[1]):0;end=match[2]?Math.min(Number(match[2]),end):end;if(start>end||start>=row.sizeBytes)return new Response(null,{status:416});status=206}
  const length=end-start+1,stream=fs.createReadStream(filePath,{start,end});
  const headers:Record<string,string>={"content-type":row.mimeType,"content-length":String(length),"content-disposition":`inline; filename*=UTF-8''${encodeURIComponent(row.originalName)}`,"cache-control":"private, max-age=300","x-content-type-options":"nosniff","accept-ranges":"bytes"};
  if(status===206)headers["content-range"]=`bytes ${start}-${end}/${row.sizeBytes}`;
  return new Response(Readable.toWeb(stream) as ReadableStream,{status,headers});
}
