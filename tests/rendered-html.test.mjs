import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

const root = new URL("../", import.meta.url);

test("renders the finished Kraftbaum product", async () => {
  const page = await readFile(new URL("app/kraftbaum-app.tsx", root), "utf8");
  assert.match(page, /Mein Baum/);
  assert.match(page, /Deine Kraft/);
  assert.match(page, /Beckenboden Beginner/);
  assert.match(page, /Termine & Events/);
  assert.match(page, /Nützliches/);
  assert.match(page, /AdminConsole/);
  assert.doesNotMatch(page, /SkeletonPreview|codex-preview/);
});

test("keeps privacy-sensitive questionnaire links external", async () => {
  const page = await readFile(new URL("app/kraftbaum-app.tsx", root), "utf8");
  assert.match(page, /bebo\.anja-tanzt\.de\/index\.php\/468255/);
  assert.match(page, /bebo\.anja-tanzt\.de\/DBB-Fragebogen/);
  assert.doesNotMatch(page, /iframe/);
});

test("ships push-safe deployment and CI definitions", async () => {
  const [ci, update, product] = await Promise.all([
    readFile(new URL(".github/workflows/ci.yml", root), "utf8"),
    readFile(new URL("deploy/update.sh", root), "utf8"),
    readFile(new URL("docs/PRODUCT.md", root), "utf8"),
  ]);
  assert.match(ci, /branches: \[main\]/);
  assert.match(ci, /npm test/);
  assert.match(update, /git pull --ff-only origin main/);
  assert.match(update, /npm test/);
  assert.match(product, /Code-first/);
});

test("ships an installable offline app without caching authentication calls", async () => {
  const [worker,layout] = await Promise.all([
    readFile(new URL("public/sw.js", root), "utf8"),
    readFile(new URL("app/layout.tsx", root), "utf8"),
  ]);
  assert.match(layout, /manifest\.webmanifest/);
  assert.match(worker, /api\/dashboard/);
  assert.match(worker, /CLEAR_PRIVATE_CACHES/);
  assert.doesNotMatch(worker, /api\/auth/);
  assert.doesNotMatch(worker, /api\/admin/);
  assert.match(worker, /request\.method==="GET"/);
});

test("keeps deployment recoverable and avoids unsafe Git ownership bypasses", async () => {
  const [install, update, preflight, service, backup, timer] = await Promise.all([
    readFile(new URL("deploy/install.sh", root), "utf8"),
    readFile(new URL("deploy/update.sh", root), "utf8"),
    readFile(new URL("deploy/preflight.sh", root), "utf8"),
    readFile(new URL("deploy/mein-kraftbaum.service", root), "utf8"),
    readFile(new URL("deploy/backup.sh", root), "utf8"),
    readFile(new URL("deploy/mein-kraftbaum-backup.timer", root), "utf8"),
  ]);
  assert.match(install, /chown -R "\$\{APP_USER\}:\$\{APP_USER\}" "\$\{APP_DIR\}"/);
  assert.doesNotMatch(install, /safe\.directory/);
  assert.match(install, /build-essential python3/);
  assert.match(install, /if ! runuser .*npm ci/);
  assert.match(update, /backup\.sh" update/);
  assert.match(update, /git pull --ff-only/);
  assert.match(update, /curl --fail/);
  assert.match(update, /rollback\.sh/);
  assert.match(preflight, /APP_URL.*https/);
  assert.match(preflight, /stat -c '%a'/);
  assert.match(service, /ProtectKernelModules=true/);
  assert.match(install, /for attempt in \{1\.\.20\}/);
  assert.match(backup, /\.backup/);
  assert.match(backup, /PRAGMA integrity_check/);
  assert.match(backup, /runuser .* git/);
  assert.match(timer, /Persistent=true/);
  assert.match(install, /enable --now mein-kraftbaum-backup\.timer/);
});

test("notifies only eligible audiences with data-minimized push copy", async () => {
  const [push, content, events, sessions] = await Promise.all([
    readFile(new URL("lib/push.ts", root), "utf8"),
    readFile(new URL("app/api/admin/content/route.ts", root), "utf8"),
    readFile(new URL("app/api/admin/events/route.ts", root), "utf8"),
    readFile(new URL("app/api/admin/courses/[courseId]/sessions/route.ts", root), "utf8"),
  ]);
  assert.match(push, /e\.course_id=\?/);
  assert.match(push, /u\.status='active'/);
  assert.match(content, /ruleType==="immediate"/);
  assert.match(events, /status==="published"/);
  assert.match(sessions, /sendPushToCourse/);
  for (const source of [content, events, sessions]) assert.doesNotMatch(source, /body:.*email|body:.*firstName|body:.*lastName/i);
});

test("offers rate-limited admin recovery and revokes existing sessions", async () => {
  const [recovery, auth, form] = await Promise.all([
    readFile(new URL("app/api/auth/admin-recovery/route.ts", root), "utf8"),
    readFile(new URL("lib/auth.ts", root), "utf8"),
    readFile(new URL("app/password-request.tsx", root), "utf8"),
  ]);
  assert.match(recovery, /loginAllowed/);
  assert.match(recovery, /consumeRecoveryCode/);
  assert.match(recovery, /session_version=session_version\+1/);
  assert.match(auth, /row\.sessionVersion===Number\(payload\.sessionVersion/);
  assert.match(form, /Admin-Wiederherstellungscode verwenden/);
  assert.match(recovery, /audit\(user\.id,"admin_recovery\.complete","user",user\.id\)/);
  assert.doesNotMatch(recovery, /audit\([^)]*recoveryCode/);
});

test("allows only SMTP and 2FA during first-admin security bootstrap", async () => {
  const [smtp,consoleSource]=await Promise.all([
    readFile(new URL("app/api/admin/settings/smtp/route.ts",root),"utf8"),
    readFile(new URL("app/admin-console.tsx",root),"utf8"),
  ]);
  assert.match(smtp,/requireAdmin\(\{allowTwoFactorSetup:true\}\)/);
  assert.doesNotMatch(smtp,/email_verified|emailVerified/);
  assert.match(consoleSource,/id==="security"\|\|id==="communication"/);
  assert.match(consoleSource,/if\(requireSecurity\)return/);
  assert.match(consoleSource,/!requireSecurity&&<footer/);
});

test("shows actionable feedback for critical settings and profile requests",async()=>{
  const [smtp,profile,update,client]=await Promise.all([
    readFile(new URL("app/admin-smtp.tsx",root),"utf8"),
    readFile(new URL("app/profile-settings.tsx",root),"utf8"),
    readFile(new URL("app/admin-update.tsx",root),"utf8"),
    readFile(new URL("app/client-api.ts",root),"utf8"),
  ]);
  for(const source of [smtp,profile,update]){assert.match(source,/requestJson/);assert.match(source,/catch/)}
  assert.match(smtp,/role="status"/);
  assert.match(profile,/aria-live="polite"/);
  assert.match(client,/Sitzung ist abgelaufen/);
  assert.match(client,/Internetverbindung/);
});
