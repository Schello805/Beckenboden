import { execFile } from "node:child_process";
import { promisify } from "node:util";
import fs from "node:fs/promises";
import path from "node:path";
import { requireAdmin } from "@/lib/auth";
import { audit } from "@/lib/database";
import { CODE_REVISION } from "@/lib/version";
const exec=promisify(execFile),dataDir=process.env.DATA_DIR||path.join(process.cwd(),"data");
export const dynamic="force-dynamic";export const runtime="nodejs";
export async function GET(){const admin=await requireAdmin();if(!admin)return Response.json({error:"Die Updateverwaltung ist ausschließlich für angemeldete Admins mit eingerichteter Zwei-Faktor-Anmeldung verfügbar."},{status:403});let updateStatus:unknown=null;try{updateStatus=JSON.parse(await fs.readFile(path.join(dataDir,"update-status.json"),"utf8"))}catch{updateStatus=null}let available=false,remoteRevision:string|null=null,checkError:string|null=null;try{const {stdout}=await exec("git",["ls-remote","origin","refs/heads/main"],{cwd:process.cwd(),timeout:5000});const remote=stdout.trim().split(/\s/)[0],{stdout:local}=await exec("git",["rev-parse","HEAD"],{cwd:process.cwd(),timeout:2000});available=Boolean(remote&&remote!==local.trim());remoteRevision=remote?remote.slice(0,7):null}catch{checkError="Die Updatequelle konnte nicht erreicht werden. Die laufende Revision wird weiterhin angezeigt."}return Response.json({currentRevision:CODE_REVISION,available,remoteRevision,checkError,updateStatus},{headers:{"cache-control":"no-store"}})}
export async function POST(){const admin=await requireAdmin();if(!admin)return Response.json({error:"Nicht berechtigt."},{status:403});try{await exec("sudo",["systemctl","start","--no-block","mein-kraftbaum-update.service"],{timeout:3000});audit(admin.id,"update.start","system","application");return Response.json({ok:true,message:"Update wurde gestartet. Die App startet nach erfolgreicher Prüfung neu."},{status:202})}catch{return Response.json({error:"Der Update-Dienst ist noch nicht installiert. Führe das Installationsskript einmal erneut aus."},{status:503})}}
