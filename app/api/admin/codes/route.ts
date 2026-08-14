import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { generateCode, hashCode } from "@/lib/codes";
import { audit, db, id, now } from "@/lib/database";
import {notifyAdmins} from "@/lib/admin-notifications";
import {sendMail,smtpErrorMessage,smtpSettings} from "@/lib/mail";

const schema=z.object({courseId:z.string().uuid(),type:z.enum(["attendance","full","event"]),count:z.number().int().min(1).max(500),assignedEmails:z.array(z.email()).max(500).default([]),sendInvitations:z.boolean().default(false)});
type CreatedCode={id:string;code:string;assignedEmail:string|null};
type Delivery={email:string;codeHint:string;sentAt:string;status:"sent"|"failed";error?:string};

function registrationUrl(code:string){const origin=(process.env.APP_URL||"https://app.anja-tanzt.de").replace(/\/$/,"");return `${origin}/#code=${encodeURIComponent(code)}`}
function invitationText(courseTitle:string,code:string){return `Hallo,\n\nfür dich wurde ein persönlicher Zugang zu „${courseTitle}“ eingerichtet.\n\nDein Zugangscode: ${code}\n\nÖffne die App über diesen Link. Der Code ist dort bereits eingetragen:\n${registrationUrl(code)}\n\nBitte registriere dich mit der E-Mail-Adresse, an die diese Einladung gesendet wurde. Falls du bereits ein Konto hast, melde dich damit an und löse den neuen Code anschließend in deinem Profil ein.\n\nDer Code ist persönlich und nur einmal verwendbar. Bewahre diese Nachricht daher sicher auf.`}

export async function POST(request:Request){
  const admin=await requireAdmin();if(!admin)return Response.json({error:"Nicht berechtigt."},{status:403});
  const parsed=schema.safeParse(await request.json().catch(()=>null));if(!parsed.success)return Response.json({error:"Bitte prüfe Anzahl, Codetyp und E-Mail-Adressen."},{status:400});
  const input=parsed.data;
  if(input.sendInvitations&&!input.assignedEmails.length)return Response.json({error:"Trage mindestens eine E-Mail-Adresse ein, wenn Einladungen versendet werden sollen."},{status:400});
  if(input.sendInvitations&&!smtpSettings())return Response.json({error:"Der Einladungsversand ist ausgewählt, aber SMTP ist noch nicht eingerichtet. Richte den Mailversand unter „E-Mail“ ein oder deaktiviere die Versandoption."},{status:503});
  const course=db.prepare("SELECT title FROM courses WHERE id=?").get(input.courseId) as {title:string}|undefined;if(!course)return Response.json({error:"Kurs nicht gefunden."},{status:404});
  const timestamp=now(),created:CreatedCode[]=[];const insert=db.prepare("INSERT INTO access_codes (id,code_hash,code_hint,course_id,type,assigned_email,created_by,created_at) VALUES (?,?,?,?,?,?,?,?)");
  db.transaction(()=>{for(let i=0;i<input.count;i++){const code=generateCode(),assignedEmail=input.assignedEmails[i]?.trim().toLowerCase()||null,codeId=id();insert.run(codeId,hashCode(code),code.slice(-4),input.courseId,input.type,assignedEmail,admin.id,timestamp);created.push({id:codeId,code,assignedEmail});}})();
  audit(admin.id,"codes.create","course",input.courseId,{count:created.length,type:input.type,courseId:input.courseId,assignedEmails:created.filter(item=>item.assignedEmail).length,invitationSendingRequested:input.sendInvitations});
  const deliveries:Delivery[]=[];
  if(input.sendInvitations){for(const item of created){if(!item.assignedEmail)continue;const sentAt=now();try{await sendMail({to:item.assignedEmail,subject:`Dein Zugang zu ${course.title}`,text:invitationText(course.title,item.code)});deliveries.push({email:item.assignedEmail,codeHint:item.code.slice(-4),sentAt,status:"sent"});audit(admin.id,"code.invitation_sent","access_code",item.id,{codeId:item.id,courseId:input.courseId,recipient:item.assignedEmail,sentAt,status:"smtp_accepted"})}catch(error){const message=smtpErrorMessage(error);deliveries.push({email:item.assignedEmail,codeHint:item.code.slice(-4),sentAt,status:"failed",error:message});audit(admin.id,"code.invitation_failed","access_code",item.id,{codeId:item.id,courseId:input.courseId,recipient:item.assignedEmail,sentAt,error:message})}}}
  const sent=deliveries.filter(item=>item.status==="sent").length,failed=deliveries.length-sent,unassigned=created.filter(item=>!item.assignedEmail).length;
  audit(admin.id,"codes.delivery_summary","course",input.courseId,{courseId:input.courseId,requested:input.sendInvitations,attempted:deliveries.length,sent,failed,unassigned});
  const lines=deliveries.length?deliveries.map(item=>`${new Date(item.sentAt).toLocaleString("de-DE")} · ${item.email} · Code ••••-${item.codeHint} · ${item.status==="sent"?"vom Mailserver angenommen":`fehlgeschlagen: ${item.error}`}`).join("\n"):"Es wurde kein Einladungsversand angefordert.";
  await notifyAdmins("Zugangscodes und Einladungsversand",`${admin.firstName} ${admin.lastName} hat am ${new Date(timestamp).toLocaleString("de-DE")} ${created.length} Zugangscode(s) für „${course.title}“ erstellt.\n\nCodetyp: ${input.type}\nZugeordnete E-Mail-Adressen: ${created.filter(item=>item.assignedEmail).length}\nEinladungen versendet: ${sent}\nFehlgeschlagen: ${failed}\nCodes ohne E-Mail-Zuordnung: ${unassigned}\n\nVERSANDPROTOKOLL\n${lines}\n\nAus Sicherheitsgründen enthält diese Sammel-E-Mail nur die letzten vier Zeichen der Codes. Die vollständigen Codes stehen ausschließlich in den persönlichen Einladungen und in der einmaligen Ausgabe im Adminbereich.`);
  return Response.json({codes:created.map(({code,assignedEmail})=>({code,assignedEmail})),delivery:{requested:input.sendInvitations,attempted:deliveries.length,sent,failed,unassigned,items:deliveries}},{status:201});
}
