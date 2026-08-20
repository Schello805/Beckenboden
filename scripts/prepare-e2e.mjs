import {mkdir,rm} from "node:fs/promises";
import path from "node:path";

const target=path.join(process.cwd(),".e2e-data");
await rm(target,{recursive:true,force:true});
await mkdir(target,{recursive:true,mode:0o700});
