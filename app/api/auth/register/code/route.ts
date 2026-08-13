import { z } from "zod";
import { hashCode } from "@/lib/codes";
import { db } from "@/lib/database";

const schema=z.object({code:z.string().min(8)});

export async function POST(request:Request){
  const parsed=schema.safeParse(await request.json().catch(()=>null));
  if(!parsed.success)return Response.json({error:"Bitte gib einen vollständigen Zugangscode ein."},{status:400});
  const row=db.prepare("SELECT c.title,ac.redeemed_by redeemedBy FROM access_codes ac JOIN courses c ON c.id=ac.course_id WHERE ac.code_hash=?").get(hashCode(parsed.data.code)) as {title:string;redeemedBy:string|null}|undefined;
  if(!row||row.redeemedBy)return Response.json({error:"Dieser Zugangscode ist ungültig oder wurde bereits verwendet. Prüfe die Schreibweise oder wende dich an die Kursleitung."},{status:400});
  return Response.json({ok:true,courseTitle:row.title});
}
