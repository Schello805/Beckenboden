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
  const [install, update] = await Promise.all([
    readFile(new URL("deploy/install.sh", root), "utf8"),
    readFile(new URL("deploy/update.sh", root), "utf8"),
  ]);
  assert.match(install, /chown -R "\$\{APP_USER\}:\$\{APP_USER\}" "\$\{APP_DIR\}"/);
  assert.doesNotMatch(install, /safe\.directory/);
  assert.match(install, /build-essential python3/);
  assert.match(install, /if ! runuser .*npm ci/);
  assert.match(update, /sqlite3 .*\.backup/);
  assert.match(update, /git pull --ff-only/);
  assert.match(update, /curl --fail/);
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
