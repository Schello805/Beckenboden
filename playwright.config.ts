import {defineConfig,devices} from "@playwright/test";
import path from "node:path";

const dataDir=path.join(process.cwd(),".e2e-data");
export default defineConfig({
  testDir:"./tests/e2e",fullyParallel:false,workers:1,retries:process.env.CI?1:0,
  reporter:process.env.CI?[["github"],["html",{open:"never"}]]:"list",
  use:{baseURL:"http://127.0.0.1:3100",trace:"retain-on-failure",screenshot:"only-on-failure"},
  projects:[{name:"chromium",use:{...devices["Desktop Chrome"]}}],
  webServer:{command:"npm run start:e2e",url:"http://127.0.0.1:3100/api/health",reuseExistingServer:false,timeout:120_000,env:{...process.env,DATA_DIR:dataDir,INSTALL_TOKEN:"e2e-install-token-secure",SESSION_SECRET:"e2e-session-secret-at-least-thirty-two-characters",SESSION_COOKIE_SECURE:"false",APP_URL:"http://127.0.0.1:3100",APP_REVISION:"e2e"}}
});
