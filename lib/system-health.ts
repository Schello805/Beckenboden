import fs from "node:fs/promises";
import path from "node:path";
import {db,now} from "@/lib/database";
import {enqueueMail} from "@/lib/mail-queue";
import {smtpSettings} from "@/lib/mail";
import {configuredTimeZone} from "@/lib/timezone-settings";

const dataDir=process.env.DATA_DIR||path.join(process.cwd(),"data"),backupRoot="/var/backups/mein-kraftbaum";
async function jsonFile(name:string){try{return JSON.parse(await fs.readFile(path.join(dataDir,name),"utf8"))}catch{return null}}
export async function systemHealth(){
  let disk={totalBytes:0,freeBytes:0,freePercent:0},latestBackup:null|{name:string;createdAt:string;ageHours:number}=null;
  try{const stat=await fs.statfs(dataDir,{bigint:true}),total=Number(stat.blocks*stat.bsize),free=Number(stat.bavail*stat.bsize);disk={totalBytes:total,freeBytes:free,freePercent:total?Math.round(free/total*1000)/10:0}}catch{/* reported below */}
  try{const names=(await fs.readdir(backupRoot)).filter(name=>/^\d{8}-\d{6}-(daily|update|manual|pre-restore)$/.test(name)).sort().reverse();if(names[0]){const manifest=await jsonAt(path.join(backupRoot,names[0],"manifest.json")),stat=await fs.stat(path.join(backupRoot,names[0]));const createdAt=manifest?.createdAt||stat.mtime.toISOString();latestBackup={name:names[0],createdAt,ageHours:Math.round((Date.now()-new Date(createdAt).getTime())/36000)/10}}}catch{/* reported below */}
  let database="ok";try{database=String((db.pragma("quick_check",{simple:true}) as string)||"unbekannt")}catch{database="nicht prüfbar"}
  const queue=db.prepare("SELECT status,COUNT(*) count FROM mail_queue GROUP BY status").all() as {status:string;count:number}[],terminalFailed=Number((db.prepare("SELECT COUNT(*) count FROM mail_queue WHERE status='failed' AND attempts>=max_attempts").get() as {count:number}).count),updateStatus=await jsonFile("update-status.json"),restoreStatus=await jsonFile("restore-status.json"),backupStatus=await jsonFile("backup-status.json"),alerts:{level:"warning"|"error";code:string;message:string}[]=[];
  if(database!=="ok")alerts.push({level:"error",code:"database",message:`Datenbankprüfung meldet: ${database}.`});
  if(!disk.totalBytes)alerts.push({level:"warning",code:"disk_unknown",message:"Freier Speicher konnte nicht ermittelt werden."});else if(disk.freePercent<10||disk.freeBytes<2*1024**3)alerts.push({level:"error",code:"disk",message:`Nur noch ${disk.freePercent} % Speicher frei.`});
  if(!latestBackup)alerts.push({level:"warning",code:"backup_missing",message:"Es wurde noch kein lesbares Server-Backup gefunden."});else if(latestBackup.ageHours>48)alerts.push({level:"error",code:"backup_old",message:`Das letzte Backup ist ${Math.round(latestBackup.ageHours)} Stunden alt.`});
  if(updateStatus?.status==="failed")alerts.push({level:"error",code:"update_failed",message:"Das letzte Update ist fehlgeschlagen."});
  if(restoreStatus?.status==="failed")alerts.push({level:"error",code:"restore_failed",message:"Die letzte Wiederherstellung ist fehlgeschlagen."});
  if(backupStatus?.status==="failed")alerts.push({level:"error",code:"backup_failed",message:"Das letzte manuelle Backup ist fehlgeschlagen."});
  if(terminalFailed)alerts.push({level:"error",code:"mail_failed",message:`${terminalFailed} E-Mail(s) konnten auch nach mehreren Versuchen nicht versendet werden.`});
  if(!smtpSettings())alerts.push({level:"warning",code:"smtp",message:"SMTP ist nicht eingerichtet; Systemwarnungen und Einladungen können nicht versendet werden."});
  return {checkedAt:now(),revision:process.env.APP_REVISION||"dev",uptimeSeconds:Math.round(process.uptime()),database,disk,latestBackup,mailQueue:Object.fromEntries(queue.map(row=>[row.status,row.count])),terminalFailed,updateStatus,restoreStatus,backupStatus,alerts};
}
async function jsonAt(file:string){try{return JSON.parse(await fs.readFile(file,"utf8"))}catch{return null}}
export async function queueSystemAlerts(){const health=await systemHealth(),signature=health.alerts.filter(a=>a.level==="error").map(a=>a.code).sort().join(","),key="health_alert_state",previous=db.prepare("SELECT value FROM app_settings WHERE key=?").get(key) as {value:string}|undefined;let state:{signature?:string;sentAt?:string}={};try{state=previous?JSON.parse(previous.value):{}}catch{/* reset invalid state */}const recent=state.sentAt&&Date.now()-new Date(state.sentAt).getTime()<12*3600_000;if(signature&&(!recent||state.signature!==signature)&&smtpSettings()){const admins=db.prepare("SELECT email FROM users WHERE role='admin' AND status='active'").all() as {email:string}[],text=`Die automatische Systemprüfung hat Handlungsbedarf erkannt:\n\n${health.alerts.filter(a=>a.level==="error").map(a=>`• ${a.message}`).join("\n")}\n\nDetails findest du im Adminbereich unter „System & Backups“.\nPrüfzeit: ${new Date(health.checkedAt).toLocaleString("de-DE",{timeZone:configuredTimeZone()})}`;for(const admin of admins)enqueueMail({to:admin.email,subject:"Stärke deine Mitte · Systemwarnung",text,kind:"system_alert"});state={signature,sentAt:health.checkedAt}}else if(!signature)state={signature:"",sentAt:state.sentAt};db.prepare("INSERT INTO app_settings(key,value,updated_at) VALUES(?,?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated_at=excluded.updated_at").run(key,JSON.stringify(state),now());return health}
