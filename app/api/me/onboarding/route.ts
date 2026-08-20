import {currentUser} from "@/lib/auth";
import {audit,db,now} from "@/lib/database";

export async function GET(){const user=await currentUser();if(!user)return Response.json({error:"Bitte melde dich an."},{status:401});const row=db.prepare("SELECT onboarding_completed_at completedAt FROM users WHERE id=?").get(user.id) as {completedAt:string|null}|undefined;return Response.json({completed:Boolean(row?.completedAt)},{headers:{"cache-control":"private, no-store"}})}
export async function POST(){const user=await currentUser();if(!user)return Response.json({error:"Bitte melde dich an."},{status:401});const timestamp=now();db.prepare("UPDATE users SET onboarding_completed_at=COALESCE(onboarding_completed_at,?),updated_at=? WHERE id=?").run(timestamp,timestamp,user.id);audit(user.id,"onboarding.complete","user",user.id);return Response.json({ok:true,message:"Dein persönlicher Bereich ist bereit."})}
