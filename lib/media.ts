import fs from "node:fs";
import path from "node:path";

export const mediaDir=path.join(process.env.DATA_DIR||path.join(process.cwd(),"data"),"media");
fs.mkdirSync(mediaDir,{recursive:true,mode:0o700});

const types:Record<string,{extensions:string[];limit:number}>={
  "image/jpeg":{extensions:[".jpg",".jpeg"],limit:5*1024*1024},"image/png":{extensions:[".png"],limit:5*1024*1024},"image/webp":{extensions:[".webp"],limit:5*1024*1024},
  "application/pdf":{extensions:[".pdf"],limit:20*1024*1024},"video/mp4":{extensions:[".mp4"],limit:5*1024*1024*1024},"video/webm":{extensions:[".webm"],limit:5*1024*1024*1024},
};
export function validateMedia(file:File){const rule=types[file.type],extension=path.extname(file.name).toLowerCase();if(!rule||!rule.extensions.includes(extension))return "Dieser Dateityp ist nicht erlaubt.";if(file.size>rule.limit)return `Die Datei ist zu groß. Erlaubt sind maximal ${Math.round(rule.limit/1024/1024)} MB.`;if(file.size===0)return "Die Datei ist leer.";return null}
export function safeStoredName(file:File){return `${crypto.randomUUID()}${path.extname(file.name).toLowerCase()}`}
