import { db } from "@/lib/database";
export const dynamic="force-dynamic";
export async function GET(_:Request,{params}:{params:Promise<{slug:string}>}){const {slug}=await params;const document=db.prepare("SELECT slug,title,version,body,effective_at effectiveAt FROM legal_documents WHERE slug=? AND status='published' ORDER BY version DESC LIMIT 1").get(slug);return document?Response.json({document}):Response.json({error:"Dokument nicht gefunden."},{status:404})}
