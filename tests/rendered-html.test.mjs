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
