import {currentUser} from "@/lib/auth";
import {db,now} from "@/lib/database";
const unauthorized=()=>Response.json({error:"Bitte melde dich an."},{status:401});
export async function GET(){const user=await currentUser();if(!user)return unauthorized();const notifications=db.prepare("SELECT id,title,body,target_url url,read_at readAt,created_at createdAt FROM user_notifications WHERE user_id=? ORDER BY created_at DESC LIMIT 20").all(user.id),unread=(db.prepare("SELECT COUNT(*) count FROM user_notifications WHERE user_id=? AND read_at IS NULL").get(user.id) as {count:number}).count;return Response.json({notifications,unread},{headers:{"cache-control":"private, no-store"}})}
export async function PATCH(){const user=await currentUser();if(!user)return unauthorized();db.prepare("UPDATE user_notifications SET read_at=? WHERE user_id=? AND read_at IS NULL").run(now(),user.id);return Response.json({ok:true})}
export async function DELETE(){const user=await currentUser();if(!user)return unauthorized();const removed=db.prepare("DELETE FROM user_notifications WHERE user_id=?").run(user.id).changes;return Response.json({ok:true,removed})}
