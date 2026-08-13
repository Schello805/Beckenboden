import QRCode from "qrcode";
import { createQrToken, currentUser } from "@/lib/auth";
export const dynamic="force-dynamic";
export async function GET(){const user=await currentUser();if(!user)return Response.json({error:"Bitte melde dich an."},{status:401});const token=await createQrToken(user.id);const png=await QRCode.toBuffer(token,{type:"png",width:512,margin:4,color:{dark:"#000000",light:"#ffffff"},errorCorrectionLevel:"Q"});return new Response(new Uint8Array(png),{headers:{"content-type":"image/png","cache-control":"no-store, private","content-disposition":"inline; filename=kraftbaum-qr.png"}});}
