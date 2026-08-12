import { clearSession, currentUser } from "@/lib/auth";
import { audit } from "@/lib/database";
export async function POST(){const user=await currentUser();if(user)audit(user.id,"auth.logout","user",user.id);await clearSession();return Response.json({ok:true});}
