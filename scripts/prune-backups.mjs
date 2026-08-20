import fs from "node:fs";
import path from "node:path";

const backupRoot=process.env.BACKUP_ROOT||"/var/backups/mein-kraftbaum";
const dataDir=process.env.DATA_DIR||path.join(process.cwd(),"data");
const defaults={daily:14,update:10,manual:10,"pre-restore":3};
const namePattern=/^\d{8}-\d{6}-(daily|update|manual|pre-restore)$/;

function limits(){
  try{
    const parsed=JSON.parse(fs.readFileSync(path.join(dataDir,"backup-retention.json"),"utf8"));
    return Object.fromEntries(Object.entries(defaults).map(([kind,fallback])=>{
      const value=Number(parsed[kind]);
      return [kind,Number.isInteger(value)&&value>=1&&value<=365?value:fallback];
    }));
  }catch{return defaults}
}

if(!fs.existsSync(backupRoot)){process.exit(0)}
const configured=limits(),removed=[];
for(const kind of Object.keys(defaults)){
  const entries=fs.readdirSync(backupRoot,{withFileTypes:true})
    .filter(entry=>entry.isDirectory()&&namePattern.test(entry.name)&&entry.name.endsWith(`-${kind}`))
    .map(entry=>entry.name).sort().reverse();
  for(const name of entries.slice(configured[kind])){
    const target=path.resolve(backupRoot,name);
    if(path.dirname(target)!==path.resolve(backupRoot)||!namePattern.test(name))throw new Error("Unsicherer Backup-Pfad abgewiesen.");
    fs.rmSync(target,{recursive:true,force:false});
    removed.push(name);
  }
}
process.stdout.write(JSON.stringify({limits:configured,removed}));
