import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import * as OTPAuth from "otpauth";

function key(){const secret=process.env.SESSION_SECRET;if(!secret||secret.length<32)throw new Error("SESSION_SECRET fehlt.");return crypto.createHash("sha256").update(secret).digest()}
export function encryptSecret(value:string){const iv=crypto.randomBytes(12),cipher=crypto.createCipheriv("aes-256-gcm",key(),iv),encrypted=Buffer.concat([cipher.update(value,"utf8"),cipher.final()]);return [iv.toString("base64url"),cipher.getAuthTag().toString("base64url"),encrypted.toString("base64url")].join(".")}
export function decryptSecret(value:string){const [iv,tag,data]=value.split(".");const decipher=crypto.createDecipheriv("aes-256-gcm",key(),Buffer.from(iv,"base64url"));decipher.setAuthTag(Buffer.from(tag,"base64url"));return Buffer.concat([decipher.update(Buffer.from(data,"base64url")),decipher.final()]).toString("utf8")}
export function newTotp(email:string){const secret=new OTPAuth.Secret({size:20}),totp=new OTPAuth.TOTP({issuer:"Stärke deine Mitte",label:email,algorithm:"SHA1",digits:6,period:30,secret});return {secret:secret.base32,uri:totp.toString()}}
export function validTotp(secret:string,token:string){const totp=new OTPAuth.TOTP({issuer:"Stärke deine Mitte",algorithm:"SHA1",digits:6,period:30,secret:OTPAuth.Secret.fromBase32(secret)});return totp.validate({token,window:1})!==null}
export function makeRecoveryCodes(){return Array.from({length:10},()=>`${crypto.randomBytes(3).toString("hex")}-${crypto.randomBytes(3).toString("hex")}`)}
export async function hashRecoveryCodes(codes:string[]){return Promise.all(codes.map(code=>bcrypt.hash(code,10)))}
export async function consumeRecoveryCode(token:string,stored:string){const hashes=JSON.parse(stored||"[]") as string[];for(let i=0;i<hashes.length;i++)if(await bcrypt.compare(token.toLowerCase(),hashes[i]))return hashes.filter((_,index)=>index!==i);return null}
