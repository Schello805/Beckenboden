import {NextRequest,NextResponse} from "next/server";

const unsafe=new Set(["POST","PUT","PATCH","DELETE"]);
export function proxy(request:NextRequest){
  if(!request.nextUrl.pathname.startsWith("/api/")||!unsafe.has(request.method))return NextResponse.next();
  const origin=request.headers.get("origin");
  if(!origin)return NextResponse.next();
  const allowed=new Set([request.nextUrl.origin]),forwardedHost=request.headers.get("x-forwarded-host")?.split(",")[0]?.trim(),forwardedProto=request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  if(forwardedHost)allowed.add(`${forwardedProto||"https"}://${forwardedHost}`);
  try{if(process.env.APP_URL)allowed.add(new URL(process.env.APP_URL).origin)}catch{/* Eine ungültige APP_URL erweitert die erlaubten Ursprünge nicht. */}
  if(!allowed.has(origin))return NextResponse.json({error:"Die Anfrage wurde aus Sicherheitsgründen abgelehnt. Lade die App neu und versuche es erneut."},{status:403,headers:{"cache-control":"no-store"}});
  return NextResponse.next();
}
export const config={matcher:"/api/:path*"};
