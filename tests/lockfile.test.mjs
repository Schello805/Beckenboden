import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

const root=new URL("../",import.meta.url);
const packageJson=JSON.parse(await readFile(new URL("package.json",root),"utf8"));
const lock=JSON.parse(await readFile(new URL("package-lock.json",root),"utf8"));

test("package lock root exactly mirrors declared dependencies",()=>{
  const locked=lock.packages[""];
  assert.equal(locked.version,packageJson.version);
  assert.deepEqual(locked.dependencies,packageJson.dependencies);
  assert.deepEqual(locked.devDependencies,packageJson.devDependencies);
  assert.deepEqual(locked.engines,packageJson.engines);
});

test("tsx resolves the esbuild version declared by its lock entry",()=>{
  const tsx=lock.packages["node_modules/tsx"],esbuild=lock.packages["node_modules/tsx/node_modules/esbuild"];
  assert.ok(tsx&&esbuild,"tsx and its esbuild package must be locked");
  const requested=tsx.dependencies.esbuild.replace(/^[^0-9]*/,"").split(".").map(Number);
  const resolved=esbuild.version.split(".").map(Number);
  assert.equal(resolved[0],requested[0]);
  assert.equal(resolved[1],requested[1]);
  assert.ok(resolved[2]>=requested[2]);
});
