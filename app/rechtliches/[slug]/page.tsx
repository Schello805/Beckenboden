/* eslint-disable @next/next/no-html-link-for-pages */
import { notFound } from "next/navigation";
import { db } from "@/lib/database";
export const dynamic="force-dynamic";
export default async function LegalPage({params}:{params:Promise<{slug:string}>}){const {slug}=await params,document=db.prepare("SELECT title,version,body,effective_at effectiveAt FROM legal_documents WHERE slug=? AND status='published' ORDER BY version DESC LIMIT 1").get(slug) as {title:string;version:number;body:string;effectiveAt:string|null}|undefined;if(!document)notFound();return <main className="legal-page"><a href="/">← Zur App</a><p className="eyebrow">Rechtliches</p><h1>{document.title}</h1><p className="legal-version">Version {document.version} · Stand {document.effectiveAt?new Date(document.effectiveAt).toLocaleString("de-DE"):"Entwurf"}</p><article>{document.body.split("\n").map((line,index)=>line?<p key={index}>{line}</p>:<br key={index}/>)}</article></main>}
