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

test("greets the authenticated admin instead of a hard-coded person",async()=>{
  const [admin,app]=await Promise.all([
    readFile(new URL("app/admin-console.tsx",root),"utf8"),
    readFile(new URL("app/kraftbaum-app.tsx",root),"utf8")
  ]);
  assert.match(app,/admin=\{user\}/);
  assert.match(admin,/`Guten Abend, \$\{admin\.firstName\}\.`/);
  assert.match(admin,/admin\.firstName\[0\]/);
  assert.doesNotMatch(admin,/Guten Abend, Anja/);
});

test("roots the start tree in visible earth while keeping its message readable",async()=>{
  const styles=await readFile(new URL("app/globals.css",root),"utf8");
  assert.match(styles,/calm, tangible earth bed/);
  assert.match(styles,/\.hero \.ground\{z-index:1/);
  assert.match(styles,/\.hero \.ground:before/);
  assert.match(styles,/\.tree-scene \.growing-tree,\.tree-scene \.growth-stage-image\{bottom:80px\}/);
  assert.match(styles,/\.hero \.growth-message\{z-index:5/);
});

test("keeps privacy-sensitive questionnaire links external", async () => {
  const page = await readFile(new URL("app/kraftbaum-app.tsx", root), "utf8");
  assert.match(page, /bebo\.anja-tanzt\.de\/index\.php\/468255/);
  assert.match(page, /bebo\.anja-tanzt\.de\/DBB-Fragebogen/);
  assert.doesNotMatch(page, /iframe/);
});

test("keeps optional registration fields contained and links required legal texts",async()=>{
  const [page,styles]=await Promise.all([
    readFile(new URL("app/kraftbaum-app.tsx",root),"utf8"),
    readFile(new URL("app/globals.css",root),"utf8"),
  ]);
  assert.match(page,/href="\/rechtliches\/nutzungsbedingungen" target="_blank" rel="noreferrer">Nutzungsbedingungen/);
  assert.match(page,/href="\/rechtliches\/datenschutz" target="_blank" rel="noreferrer">Datenschutzerklärung/);
  assert.match(styles,/\.access-form \.form-row>\*\{min-width:0\}/);
  assert.match(styles,/\.access-form input:not\(\[type=checkbox\]\)\{min-width:0;max-width:100%\}/);
});

test("guides new users through code validation before account details",async()=>{
  const [ui,route,styles]=await Promise.all([readFile(new URL("app/kraftbaum-app.tsx",root),"utf8"),readFile(new URL("app/api/auth/register/code/route.ts",root),"utf8"),readFile(new URL("app/globals.css",root),"utf8")]);
  assert.match(ui,/Schritt \$\{registerStep\} von 2/);
  assert.match(ui,/Code prüfen und weiter/);
  assert.match(ui,/\/api\/auth\/register\/code/);
  assert.match(ui,/className="access-watermark" src="\/logo-kraftbaum\.svg"/);
  assert.match(route,/JOIN courses/);
  assert.match(route,/ungültig oder wurde bereits verwendet/);
  assert.match(styles,/\.wizard-progress\{/);
  assert.match(styles,/\.access-watermark\{/);
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

test("requests push deliberately and badges an installed app until it is opened",async()=>{
  const [preference,registration,worker]=await Promise.all([readFile(new URL("app/push-preference.tsx",root),"utf8"),readFile(new URL("app/pwa-registration.tsx",root),"utf8"),readFile(new URL("public/sw.js",root),"utf8")]);
  assert.match(preference,/Notification\.requestPermission\(\)/);
  assert.match(preference,/Tippe auf „Push aktivieren“/);
  assert.match(preference,/Home-Bildschirm/);
  assert.match(worker,/self\.navigator\.setAppBadge\(1\)/);
  assert.match(worker,/self\.navigator\.clearAppBadge\(\)/);
  assert.match(registration,/clearAppBadge/);
  assert.match(registration,/visibilitychange/);
});

test("offers platform-aware app installation after login and permanently in the profile",async()=>{
  const [install,app,profile,registration,styles]=await Promise.all([readFile(new URL("app/app-install.tsx",root),"utf8"),readFile(new URL("app/kraftbaum-app.tsx",root),"utf8"),readFile(new URL("app/profile-settings.tsx",root),"utf8"),readFile(new URL("app/pwa-registration.tsx",root),"utf8"),readFile(new URL("app/globals.css",root),"utf8")]);
  assert.match(install,/beforeinstallprompt/);
  assert.match(install,/Zum Home-Bildschirm/);
  assert.match(install,/Später/);
  assert.doesNotMatch(app,/<AppInstall\/>/);
  assert.match(profile,/<AppInstall persistent\/>/);
  assert.match(registration,/__kraftbaumInstallPrompt/);
  assert.match(styles,/\.install-invitation\{position:fixed/);
});

test("adds visible keyboard and touch accessible help icons to admin headings",async()=>{
  const [tooltips,styles]=await Promise.all([readFile(new URL("app/use-admin-tooltips.ts",root),"utf8"),readFile(new URL("app/globals.css",root),"utf8")]);
  assert.match(tooltips,/h1,h2,h3,.panel>small,.panel-title small/);
  assert.match(tooltips,/button\.className="admin-help"/);
  assert.match(tooltips,/data-help/);
  assert.match(tooltips,/aria-expanded/);
  assert.match(styles,/\.real-admin \.admin-help/);
  assert.match(styles,/\.admin-help\.open:after/);
});

test("adds visible explanatory help icons to every admin form field",async()=>{
  const [tooltips,styles,admin]=await Promise.all([
    readFile(new URL("app/use-admin-tooltips.ts",root),"utf8"),
    readFile(new URL("app/globals.css",root),"utf8"),
    readFile(new URL("app/admin-console.tsx",root),"utf8")
  ]);
  assert.match(tooltips,/\.admin-form label,.address-fields label/);
  assert.match(tooltips,/Fortlaufende Nummer der Kurseinheit/);
  assert.match(tooltips,/Aussagekräftiger Name des Kurses/);
  assert.match(tooltips,/className="admin-help field-help"/);
  assert.match(styles,/\.admin-field-title\{/);
  assert.match(styles,/\.address-city\{grid-template-columns:minmax\(92px,110px\)/);
  assert.match(styles,/Kurs verwalten: archivieren oder endgültig löschen/);
  assert.match(admin,/Kurs endgültig löschen/);
});

test("explains every access-code type beside the selector",async()=>{
  const admin=await readFile(new URL("app/admin-console.tsx",root),"utf8");
  assert.match(admin,/className="admin-help field-help"/);
  assert.match(admin,/Präsenzkurs · gestaffelt: Inhalte wachsen/);
  assert.match(admin,/Vollzugang: Der gesamte Kursinhalt wird sofort freigeschaltet/);
  assert.match(admin,/Event: Zugang für eine besondere Einzelveranstaltung/);
  assert.match(admin,/title="Freischaltung wächst schrittweise/);
  assert.match(admin,/title="Schaltet alle Inhalte/);
});

test("creates courses with validated structured addresses and direct map actions",async()=>{
  const [admin,address,dashboard,styles]=await Promise.all([readFile(new URL("app/admin-console.tsx",root),"utf8"),readFile(new URL("app/admin-address-fields.tsx",root),"utf8"),readFile(new URL("app/user-dashboard.tsx",root),"utf8"),readFile(new URL("app/globals.css",root),"utf8")]);
  assert.match(admin,/const form=e\.currentTarget/);
  assert.match(admin,/form\.reset\(\)/);
  assert.match(admin,/submitCourse[\s\S]{0,250}const form=e\.currentTarget/);
  assert.match(address,/Straße/);
  assert.match(address,/Hausnummer/);
  assert.match(address,/pattern="\[0-9\]\{5\}"/);
  assert.match(address,/Google Maps ↗/);
  assert.match(address,/Apple Karten ↗/);
  assert.match(dashboard,/function MapActions/);
  assert.match(styles,/\.address-fields\{/);
});

test("manages event title images and keeps archived courses and events collapsed",async()=>{
  const [eventsAdmin,eventApi,eventDetail,courseDetail,database,dashboard,styles]=await Promise.all([
    readFile(new URL("app/admin-events.tsx",root),"utf8"),
    readFile(new URL("app/api/admin/events/route.ts",root),"utf8"),
    readFile(new URL("app/api/admin/events/[eventId]/route.ts",root),"utf8"),
    readFile(new URL("app/api/admin/courses/[courseId]/route.ts",root),"utf8"),
    readFile(new URL("lib/database.ts",root),"utf8"),
    readFile(new URL("app/user-dashboard.tsx",root),"utf8"),
    readFile(new URL("app/globals.css",root),"utf8")
  ]);
  assert.match(database,/public_events ADD COLUMN media_id/);
  assert.match(eventsAdmin,/name="image"/);
  assert.match(eventsAdmin,/Archivierte Veranstaltungen/);
  assert.match(eventsAdmin,/Endgültig löschen/);
  assert.match(eventApi,/media_id mediaId/);
  assert.match(eventDetail,/export async function DELETE/);
  assert.match(courseDetail,/DELETE FROM attendance/);
  assert.match(courseDetail,/INSERT INTO attendance_archive/);
  assert.match(courseDetail,/DELETE FROM courses/);
  assert.match(dashboard,/className="event-cover"/);
  assert.match(styles,/\.archive-accordion/);
});

test("does not serve stale page HTML across application updates",async()=>{
  const [worker,registration,page,config,update]=await Promise.all([readFile(new URL("public/sw.js",root),"utf8"),readFile(new URL("app/pwa-registration.tsx",root),"utf8"),readFile(new URL("app/page.tsx",root),"utf8"),readFile(new URL("next.config.ts",root),"utf8"),readFile(new URL("deploy/update.sh",root),"utf8")]);
  assert.doesNotMatch(worker,/const SHELL=\["\/"/);
  assert.match(worker,/request\.mode!=="navigate"/);
  assert.match(worker,/appCaches\.slice\(0,-2\)/);
  assert.match(worker,/await caches\.match\(event\.request\)\)\|\|response/);
  assert.match(registration,/updateViaCache:"none"/);
  assert.match(registration,/controllerchange/);
  assert.match(page,/dynamic = "force-dynamic"/);
  assert.match(config,/private, no-store, no-cache/);
  assert.match(update,/ASSETS_OK/);
  assert.match(update,/\/_next\/static\//);
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
  assert.match(install, /if ! as_app .*npm ci/);
  assert.match(update, /backup\.sh" update/);
  assert.match(update, /git pull --ff-only/);
  assert.match(update, /curl --fail/);
  assert.match(update, /rollback\.sh/);
  assert.match(preflight, /APP_URL.*https/);
  assert.match(preflight, /stat -c '%a'/);
  assert.match(service, /ProtectKernelModules=true/);
  assert.match(install, /for attempt in \{1\.\.20\}/);
  assert.match(install, /systemctl restart mein-kraftbaum/);
  assert.match(install, /EXPECTED_REVISION/);
  assert.match(install, /\$\{HEALTH_JSON\}.*\$\{EXPECTED_REVISION\}/);
  assert.match(preflight, /Laufender Prozess entspricht nicht dem installierten Code/);
  assert.match(backup, /\.backup/);
  assert.match(backup, /PRAGMA integrity_check/);
  assert.match(backup, /runuser .* git/);
  assert.match(timer, /Persistent=true/);
  assert.match(install, /enable --now mein-kraftbaum-backup\.timer/);
  assert.match(install, /NPM_CONFIG_CACHE/);
  assert.match(update, /\/var\/cache\/mein-kraftbaum/);
  assert.match(preflight, /Separater npm-Cache/);
});

test("uses the supplied Kraftbaum logo for branding and app icons",async()=>{
  const [page,layout,manifest,worker,logo]=await Promise.all([
    readFile(new URL("app/kraftbaum-app.tsx",root),"utf8"),
    readFile(new URL("app/layout.tsx",root),"utf8"),
    readFile(new URL("app/manifest.ts",root),"utf8"),
    readFile(new URL("public/sw.js",root),"utf8"),
    readFile(new URL("public/logo-kraftbaum.svg",root),"utf8"),
  ]);
  assert.match(page,/className="brand-logo" src="\/logo-kraftbaum\.svg"/);
  assert.doesNotMatch(page,/className="tree-hotspots"/);
  assert.match(layout,/apple-touch-icon\.png/);
  assert.match(manifest,/icon-192\.png/);
  assert.match(manifest,/icon-512\.png/);
  assert.match(worker,/icon:"\/icon-192\.png"/);
  assert.match(logo,/fill="#c65f36"/);
});

test("brands the app as Stärke deine Mitte by Anja Schellenberger",async()=>{
  const [page,layout,manifest,admin]=await Promise.all([
    readFile(new URL("app/kraftbaum-app.tsx",root),"utf8"),
    readFile(new URL("app/layout.tsx",root),"utf8"),
    readFile(new URL("app/manifest.ts",root),"utf8"),
    readFile(new URL("app/admin-console.tsx",root),"utf8"),
  ]);
  for(const source of [page,layout,manifest,admin])assert.doesNotMatch(source,/Anja tanzt/i);
  assert.match(page,/STÄRKE DEINE MITTE/);
  assert.match(page,/ANJA SCHELLENBERGER/);
  assert.match(layout,/Stärke deine Mitte · Anja Schellenberger/);
  assert.match(manifest,/short_name:"Stärke deine Mitte"/);
});

test("remounts persisted Matomo values and clears obsolete installer failures",async()=>{
  const [privacy,update,install]=await Promise.all([
    readFile(new URL("app/admin-privacy.tsx",root),"utf8"),
    readFile(new URL("app/admin-update.tsx",root),"utf8"),
    readFile(new URL("deploy/install.sh",root),"utf8"),
  ]);
  assert.match(privacy,/key=\{`matomo-\$\{matomo\.url\}/);
  assert.match(privacy,/setMatomo\(next\)/);
  assert.match(update,/status\.available&&status\.updateStatus\?\.status==="failed"/);
  assert.match(install,/update-status\.json/);
  assert.match(install,/"status":"success"/);
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
  assert.match(profile,/aria-live=\{noticeTone==="feedback-error"\?"assertive":"polite"\}/);
  assert.match(client,/Sitzung ist abgelaufen/);
  assert.match(client,/Internetverbindung/);
});

test("keeps SMTP test and analytics consent actions visibly contrasted",async()=>{
  const [smtp,consent,styles]=await Promise.all([
    readFile(new URL("app/admin-smtp.tsx",root),"utf8"),
    readFile(new URL("app/consent-manager.tsx",root),"utf8"),
    readFile(new URL("app/globals.css",root),"utf8"),
  ]);
  assert.match(smtp,/className="secondary-action"[^>]*>Testmail versenden/);
  assert.match(consent,/className="primary consent-accept"/);
  assert.match(styles,/\.secondary-action\{[^}]*background:#edf2ed!important;[^}]*color:var\(--forest\)!important/);
  assert.match(styles,/\.consent-dialog button\.consent-accept\{[^}]*background:var\(--forest\);color:#fff/);
});

test("renders cookie controls only after hydration and keeps them touchable",async()=>{
  const [consent,styles]=await Promise.all([readFile(new URL("app/consent-manager.tsx",root),"utf8"),readFile(new URL("app/globals.css",root),"utf8")]);
  assert.match(consent,/\[mounted,setMounted\]=useState\(false\)/);
  assert.match(consent,/if\(!mounted\|\|choice&&!open\)return null/);
  assert.match(consent,/type="button" disabled=\{busy\}/);
  assert.match(consent,/aria-modal="true"/);
  assert.match(styles,/\.consent-dialog\{z-index:1000;pointer-events:auto;touch-action:manipulation\}/);
});

test("configures a separate human-readable SMTP sender name",async()=>{
  const [client,route,mail]=await Promise.all([
    readFile(new URL("app/admin-smtp.tsx",root),"utf8"),
    readFile(new URL("app/api/admin/settings/smtp/route.ts",root),"utf8"),
    readFile(new URL("lib/mail.ts",root),"utf8")
  ]);
  assert.match(client,/Absendername/);
  assert.match(client,/name="fromName"/);
  assert.match(client,/Absenderadresse <small>nur die E-Mail-Adresse/);
  assert.match(route,/fromName:z\.string\(\)\.trim\(\)\.min\(1\)\.max\(100\)/);
  assert.match(mail,/from:\{name:settings\.fromName\|\|"Stärke deine Mitte",address:settings\.from\}/);
});

test("health check reports a build-embedded revision and SMTP bootstrap capability",async()=>{
  const [health,version,install]=await Promise.all([
    readFile(new URL("app/api/health/route.ts",root),"utf8"),
    readFile(new URL("lib/version.ts",root),"utf8"),
    readFile(new URL("deploy/install.sh",root),"utf8"),
  ]);
  assert.match(health,/CODE_REVISION/);
  assert.match(health,/cache-control":"no-store/);
  assert.match(version,/smtp-before-2fa/);
  assert.match(install,/HEALTH_JSON.*smtp-before-2fa/);
});

test("shows revision, update availability and frontend installation only to admins",async()=>{
  const [app,update,route]=await Promise.all([
    readFile(new URL("app/kraftbaum-app.tsx",root),"utf8"),
    readFile(new URL("app/admin-update.tsx",root),"utf8"),
    readFile(new URL("app/api/admin/update/route.ts",root),"utf8"),
  ]);
  assert.match(app,/user\.role==="admin"&&<AdminUpdate\/>/);
  assert.match(update,/Stärke deine Mitte · Revision/);
  assert.match(update,/Update verfügbar/);
  assert.match(update,/Kein Update verfügbar/);
  assert.match(update,/method:"POST"/);
  assert.match(route,/currentRevision:CODE_REVISION/);
  assert.match(route,/update-request/);
  assert.doesNotMatch(route,/sudo|systemctl/);
});

test("starts frontend updates through a least-privilege systemd path trigger",async()=>{
  const [appService,pathUnit,install,preflight]=await Promise.all([
    readFile(new URL("deploy/mein-kraftbaum.service",root),"utf8"),
    readFile(new URL("deploy/mein-kraftbaum-update.path",root),"utf8"),
    readFile(new URL("deploy/install.sh",root),"utf8"),
    readFile(new URL("deploy/preflight.sh",root),"utf8"),
  ]);
  assert.match(appService,/NoNewPrivileges=true/);
  assert.match(pathUnit,/PathExists=\/opt\/mein-kraftbaum\/data\/update-request/);
  assert.match(pathUnit,/Unit=mein-kraftbaum-update\.service/);
  assert.match(install,/enable --now mein-kraftbaum-update\.path/);
  assert.doesNotMatch(install,/NOPASSWD/);
  assert.match(preflight,/Frontend-Update-Trigger/);
});

test("keeps the admin area navigable and its update footer in flow on phones",async()=>{
  const [consoleSource,styles]=await Promise.all([
    readFile(new URL("app/admin-console.tsx",root),"utf8"),
    readFile(new URL("app/globals.css",root),"utf8"),
  ]);
  assert.match(consoleSource,/admin-mobile-navigation/);
  assert.match(consoleSource,/Adminbereich auswählen/);
  assert.match(styles,/@media\(max-width:800px\).*\.admin-page>\.admin-footer\{position:static!important;inset:auto!important/s);
  assert.match(styles,/\.admin-mobile-navigation\{display:grid/);
});

test("uses a compact content-height rhythm across all admin screens",async()=>{
  const styles=await readFile(new URL("app/globals.css",root),"utf8");
  assert.match(styles,/\.real-admin \.admin-workspace,\.real-admin \.admin-columns\{align-items:start;gap:14px;margin-top:18px\}/);
  assert.match(styles,/\.real-admin \.panel\{align-self:start;padding:18px;margin-top:18px\}/);
  assert.match(styles,/\.real-admin \.admin-form\{gap:9px;margin-top:12px\}/);
  assert.match(styles,/@media\(max-width:800px\).*\.real-admin \.admin-form input,[^}]*min-height:44px/s);
});

test("provides semantic inline validation, conditional fields and submit locking",async()=>{
  const [ux,lock,admin,styles]=await Promise.all([readFile(new URL("app/use-admin-form-ux.ts",root),"utf8"),readFile(new URL("app/use-admin-submit-lock.ts",root),"utf8"),readFile(new URL("app/admin-console.tsx",root),"utf8"),readFile(new URL("app/globals.css",root),"utf8")]);
  assert.match(ux,/aria-invalid/);
  assert.match(ux,/field-error/);
  assert.match(ux,/conditional-hidden/);
  assert.match(ux,/attendance_count/);
  assert.match(lock,/Wird verarbeitet …/);
  assert.match(admin,/useAdminFormUx\(\)/);
  assert.match(admin,/useAdminSubmitLock\(\)/);
  assert.match(styles,/\.feedback-success/);
  assert.match(styles,/\.feedback-error/);
});

test("shows a clear confirmation after following the email verification link",async()=>{
  const source=await readFile(new URL("app/kraftbaum-app.tsx",root),"utf8");
  assert.match(source,/searchParams\.get\("emailVerified"\)==="1"/);
  assert.match(source,/E-Mail-Adresse wurde erfolgreich bestätigt/);
  assert.match(source,/history\.replaceState/);
  assert.match(source,/role="status"/);
});

test("separates ordinary profile data from protected email and password changes",async()=>{
  const [ui,route]=await Promise.all([readFile(new URL("app/profile-settings.tsx",root),"utf8"),readFile(new URL("app/api/me/profile/route.ts",root),"utf8")]);
  assert.doesNotMatch(ui,/location\.reload/);
  assert.match(ui,/action:"profile"/);
  assert.match(ui,/action:"email"/);
  assert.match(ui,/Änderungen werden automatisch gespeichert/);
  assert.match(ui,/onChange=\{e=>scheduleProfile/);
  assert.match(ui,/Neues Passwort wiederholen/);
  assert.match(route,/action:z\.literal\("profile"\).*birthday.*phone/);
  assert.doesNotMatch(route,/action:z\.literal\("profile"\).*currentPassword/);
  assert.match(route,/email_verified_at=NULL/);
});

test("provides authenticated profile image CRUD for every user",async()=>{
  const [ui,route,database,auth]=await Promise.all([readFile(new URL("app/profile-settings.tsx",root),"utf8"),readFile(new URL("app/api/me/avatar/route.ts",root),"utf8"),readFile(new URL("lib/database.ts",root),"utf8"),readFile(new URL("lib/auth.ts",root),"utf8")]);
  assert.match(ui,/Bild auswählen/);
  assert.match(ui,/Bild ersetzen/);
  assert.match(ui,/>Löschen</);
  assert.match(ui,/URL\.createObjectURL/);
  assert.match(route,/export async function GET/);
  assert.match(route,/export async function POST/);
  assert.match(route,/export async function DELETE/);
  assert.match(route,/image\/jpeg.*image\/png.*image\/webp/);
  assert.match(route,/currentUser/);
  assert.match(database,/profile_media_id/);
  assert.match(auth,/profileImage/);
});

test("opens the attendance QR from the profile as a mobile-friendly presentation pass",async()=>{
  const [profile,app,admin,styles]=await Promise.all([readFile(new URL("app/profile-settings.tsx",root),"utf8"),readFile(new URL("app/kraftbaum-app.tsx",root),"utf8"),readFile(new URL("app/use-admin-tooltips.ts",root),"utf8"),readFile(new URL("app/globals.css",root),"utf8")]);
  assert.match(profile,/className="profile-qr"/);
  assert.match(profile,/Beim Kursbesuch vorzeigen/);
  assert.match(profile,/QR-Code öffnen/);
  assert.match(profile,/className="qr-presenter" role="dialog" aria-modal="true"/);
  assert.match(profile,/wakeLock/);
  assert.match(profile,/Der Bildschirm bleibt während der Anzeige aktiv/);
  assert.match(styles,/\.qr-presenter\{position:fixed;inset:0;z-index:10000/);
  assert.match(styles,/\.qr-presenter-code\{width:min\(72vh,82vw,480px\)/);
  assert.doesNotMatch(app,/className="personal-qr"/);
  assert.match(admin,/Direkte TLS-Verbindung verwenden/);
  assert.match(admin,/Als neue Version veröffentlichen/);
  assert.match(styles,/input\[type=checkbox\]\{appearance:none;width:18px;height:18px/);
});

test("makes sending the verification email an explicit immediate action",async()=>{
  const ui=await readFile(new URL("app/profile-settings.tsx",root),"utf8");
  assert.match(ui,/Bestätigungsmail senden/);
  assert.match(ui,/Die E-Mail wird sofort versendet/);
  assert.doesNotMatch(ui,/Bestätigungsmail senden<span>›/);
});

test("lists legal footer documents vertically",async()=>{
  const styles=await readFile(new URL("app/globals.css",root),"utf8");
  assert.match(styles,/\.footer-legal\{display:grid;[^}]*gap:/);
  assert.match(styles,/\.footer-legal a\{display:block;margin:0/);
});

test("offers a privacy-friendly Google review action in the responsive footer",async()=>{
  const [app,styles]=await Promise.all([readFile(new URL("app/kraftbaum-app.tsx",root),"utf8"),readFile(new URL("app/globals.css",root),"utf8")]);
  assert.match(app,/className="footer-review"/);
  assert.match(app,/0xbb1767c240562350/);
  assert.match(app,/Bewertung auf Google schreiben/);
  assert.match(app,/className="footer-review"[^>]*target="_blank" rel="noreferrer"/);
  assert.match(styles,/\.app-footer\{display:grid;grid-template-columns:/);
  assert.match(styles,/@media\(max-width:600px\)\{\.app-footer\{grid-template-columns:1fr/);
});

test("grows the Kraftbaum through nine replaceable visual stages",async()=>{
  const [app,appearance,styles]=await Promise.all([readFile(new URL("app/kraftbaum-app.tsx",root),"utf8"),readFile(new URL("app/admin-appearance.tsx",root),"utf8"),readFile(new URL("app/globals.css",root),"utf8")]);
  assert.match(app,/function GrowingTree/);
  assert.match(app,/stage===0\?"Ein Samen/);
  assert.match(app,/Math\.min\(8,Math\.max\(0,progress\)\)/);
  assert.match(appearance,/Array\(9\)\.fill\(null\)/);
  assert.match(appearance,/Neun Wachstumsstufen/);
  assert.match(styles,/\.growing-tree,\.growth-stage-image/);
  assert.match(styles,/\.hero-copy\{top:30px;[^}]*text-align:center/);
  assert.match(styles,/\.hero h1 em\{white-space:nowrap\}/);
  assert.match(styles,/@keyframes seedWake/);
  assert.match(styles,/@keyframes branchGrow/);
  assert.match(app,/stage===7&&<g className="tree-flowers"/);
  assert.match(app,/stage===8&&<g className="tree-apples"/);
  assert.match(appearance,/"Blüten","Rote Äpfel"/);
  assert.match(appearance,/Alle Bilder 1–9 gemeinsam hochladen/);
  assert.match(appearance,/new Set\(numbered\.map/);
  assert.match(styles,/\.growth-stage-preview\{height:130px;overflow:hidden\}/);
});

test("previews the complete growth journey once when the start tree loads",async()=>{
  const [app,styles]=await Promise.all([readFile(new URL("app/kraftbaum-app.tsx",root),"utf8"),readFile(new URL("app/globals.css",root),"utf8")]);
  assert.match(app,/stage\*900/);
  assert.match(app,/8\*900\+3000/);
  assert.match(app,/targetRef\.current/);
  assert.match(app,/className=\{`growth-visual/);
  assert.doesNotMatch(app,/So wächst dein Kraftbaum/);
  assert.doesNotMatch(app,/className="woman"|className="cat"|custom-figure/);
  assert.match(app,/growthMessages=\{data\?\.appearance\?\.growthMessages\}/);
  assert.doesNotMatch(app,/courseLabels|selectedCourse/);
  assert.match(app,/growthMessages=\{data\?\.appearance\?\.growthMessages\} decorations=\{data\?\.decorations\|\|\[\]\} animateJourney/);
  assert.match(styles,/\.tree-scene \.growing-tree,\.tree-scene \.growth-stage-image\{bottom:80px\}/);
});

test("shows and manages a loving motivational message for every growth stage",async()=>{
  const [app,appearance,route,dashboard,messages,styles]=await Promise.all([
    readFile(new URL("app/kraftbaum-app.tsx",root),"utf8"),
    readFile(new URL("app/admin-appearance.tsx",root),"utf8"),
    readFile(new URL("app/api/admin/settings/appearance/route.ts",root),"utf8"),
    readFile(new URL("app/api/dashboard/route.ts",root),"utf8"),
    readFile(new URL("lib/growth-messages.ts",root),"utf8"),
    readFile(new URL("app/globals.css",root),"utf8")
  ]);
  assert.match(messages,/DEFAULT_GROWTH_MESSAGES/);
  assert.equal((messages.match(/^\s+"/gm)||[]).length,9);
  assert.match(app,/className="growth-message"/);
  assert.match(app,/messages\[visualStage\]/);
  assert.match(appearance,/Motivationsspruch/);
  assert.match(appearance,/saveAllMessages/);
  assert.match(route,/max\(240\)/);
  assert.match(dashboard,/normalizeGrowthMessages/);
  assert.match(styles,/\.growth-message\{/);
  assert.match(styles,/\.growth-message-form\{/);
});

test("saves all nine growth messages with one clear action",async()=>{
  const [appearance,styles]=await Promise.all([
    readFile(new URL("app/admin-appearance.tsx",root),"utf8"),
    readFile(new URL("app/globals.css",root),"utf8")
  ]);
  assert.match(appearance,/function saveAllMessages/);
  assert.match(appearance,/Alle Sprüche speichern/);
  assert.match(appearance,/Alle neun Motivationssprüche wurden gemeinsam gespeichert/);
  assert.doesNotMatch(appearance,/>Spruch speichern</);
  assert.match(styles,/\.save-all-messages\{/);
});

test("shows motivation only after the growth preview reaches the personal status",async()=>{
  const app=await readFile(new URL("app/kraftbaum-app.tsx",root),"utf8");
  assert.match(app,/\[previewing,setPreviewing\]=useState\(animateJourney\)/);
  assert.match(app,/setDisplayStage\(targetRef\.current\);setFading\(false\);setPreviewing\(false\)/);
  assert.match(app,/\{!previewing&&<blockquote className="growth-message"/);
});

test("keeps the growth tree presentational and removes obsolete SVG controls",async()=>{
  const [app,appearance]=await Promise.all([readFile(new URL("app/kraftbaum-app.tsx",root),"utf8"),readFile(new URL("app/admin-appearance.tsx",root),"utf8")]);
  assert.doesNotMatch(app,/tree-hotspots|tree-course-popover|aria-pressed/);
  assert.doesNotMatch(appearance,/SVG verwenden|automatisch als SVG|resetStage/);
  assert.match(appearance,/Für jede Wachstumsstufe kannst du das angezeigte Bild/);
});

test("shows complete square growth images in the admin preview",async()=>{
  const styles=await readFile(new URL("app/globals.css",root),"utf8");
  assert.match(styles,/\.real-admin \.growth-stage-preview\{width:100%;height:auto;aspect-ratio:1\/1;padding:8px\}/);
  assert.match(styles,/\.real-admin \.growth-stage-preview img\{width:100%;height:100%;object-fit:contain;object-position:center\}/);
});

test("composes the start page as a refined responsive growth scene",async()=>{
  const [app,styles]=await Promise.all([readFile(new URL("app/kraftbaum-app.tsx",root),"utf8"),readFile(new URL("app/globals.css",root),"utf8")]);
  assert.match(app,/className="hero-atmosphere" aria-hidden="true"/);
  assert.match(app,/className="progress-kicker"/);
  assert.match(app,/className="journey-progress shell"/);
  assert.match(app,/DEIN PERSÖNLICHER WEG/);
  assert.match(app,/className="card-symbol"/);
  assert.match(styles,/Refined, calm start-page composition/);
  assert.match(styles,/\.hero \.progress-card\{left:max\(7vw/);
  assert.match(styles,/\.hero-atmosphere i/);
  assert.match(styles,/three clear layers/);
  assert.match(styles,/\.hero \.growth-message\{left:14%;right:14%;bottom:12px/);
  assert.match(styles,/\.journey-progress \.progress-card\{position:relative/);
  assert.match(styles,/@media\(max-width:480px\)\{\.hero\{min-height:735px\}/);
});

test("keeps the authenticated app fitted and its progress count aligned on phones",async()=>{
  const [layout,styles]=await Promise.all([readFile(new URL("app/layout.tsx",root),"utf8"),readFile(new URL("app/globals.css",root),"utf8")]);
  assert.match(layout,/width:"device-width",initialScale:1,viewportFit:"cover"/);
  assert.match(styles,/html,body\{max-width:100%;overflow-x:clip/);
  assert.match(styles,/grid-template-columns:repeat\(5,minmax\(0,1fr\)\)/);
  assert.match(styles,/\.hero \.progress-card>div:first-of-type\{display:grid/);
  assert.match(styles,/\.progress-card>div:first-of-type\{display:flex;align-items:baseline;justify-content:flex-start;gap:22px/);
  assert.match(styles,/\.progress-card>div:first-of-type>strong\{display:flex;align-items:baseline/);
});

test("provides a free-positioned Kraftbaum decoration editor",async()=>{
  const [database,editor,admin,app,dashboard,media,styles]=await Promise.all([
    readFile(new URL("lib/database.ts",root),"utf8"),readFile(new URL("app/admin-tree-decorations.tsx",root),"utf8"),readFile(new URL("app/admin-appearance.tsx",root),"utf8"),readFile(new URL("app/kraftbaum-app.tsx",root),"utf8"),readFile(new URL("app/api/dashboard/route.ts",root),"utf8"),readFile(new URL("app/api/media/[mediaId]/route.ts",root),"utf8"),readFile(new URL("app/globals.css",root),"utf8")
  ]);
  assert.match(database,/CREATE TABLE IF NOT EXISTS tree_decorations/);
  assert.match(database,/CREATE TABLE IF NOT EXISTS tree_decoration_unlocks/);
  assert.match(editor,/className="decoration-canvas"/);
  assert.match(editor,/onPointerMove=\{position\}/);
  assert.match(editor,/Größe: \{Math\.round\(selected\.sizePercent\)\}/);
  assert.match(editor,/Drehung: \{Math\.round\(selected\.rotation\)\}/);
  assert.match(editor,/Manuelle Freischaltung/);
  assert.match(admin,/AdminTreeDecorations/);
  assert.match(app,/className="tree-decoration-layer"/);
  assert.match(dashboard,/tree_decoration_unlocks/);
  assert.match(media,/decorationAccess/);
  assert.match(styles,/\.tree-decoration-layout\{/);
});

test("uses a compact opaque and scannable attendance QR token",async()=>{
  const [route,token,auth,styles]=await Promise.all([readFile(new URL("app/api/me/qr/route.ts",root),"utf8"),readFile(new URL("lib/qr-token.ts",root),"utf8"),readFile(new URL("lib/auth.ts",root),"utf8"),readFile(new URL("app/globals.css",root),"utf8")]);
  assert.match(route,/width:512,margin:4/);
  assert.match(route,/dark:"#000000",light:"#ffffff"/);
  assert.match(token,/randomBytes\(24\)/);
  assert.match(token,/token_hash/);
  assert.match(token,/12\*60\*60_000/);
  assert.match(auth,/verifyQrTokenValue/);
  assert.match(styles,/\.qr-presenter-code img\{display:block;width:100%;height:100%/);
});

test("ships app-specific imprint and privacy documents to fresh and existing installations",async()=>{
  const [content,database]=await Promise.all([readFile(new URL("lib/legal-content.ts",root),"utf8"),readFile(new URL("lib/database.ts",root),"utf8")]);
  assert.match(content,/Anja Schellenberger/);
  assert.match(content,/Ziegeleistraße 32/);
  assert.match(content,/09822 4290985/);
  assert.match(content,/info@anja-tanzt\.de/);
  assert.match(content,/Geltungsbereich: app\.anja-tanzt\.de/);
  assert.match(content,/selbst gehostete Matomo-Instanz/);
  assert.match(content,/YouTube und Vimeo/);
  assert.match(content,/Web-Push/);
  assert.match(content,/Profilbilder/);
  assert.match(content,/bis zu zehn Jahre/);
  assert.doesNotMatch(content,/Newsletter|PayPal|Sofortüberweisung|Jetpack|Pinterest/);
  assert.match(database,/appLegalInstalled/);
  assert.match(database,/MAX\(version\),0\)\+1/);
});

test("opens every legal document and external destination outside the running app tab",async()=>{
  const [app,consent,dashboard]=await Promise.all([readFile(new URL("app/kraftbaum-app.tsx",root),"utf8"),readFile(new URL("app/consent-manager.tsx",root),"utf8"),readFile(new URL("app/user-dashboard.tsx",root),"utf8")]);
  const legalAnchors=[...`${app}\n${consent}`.matchAll(/<a\s+[^>]*href="\/rechtliches\/[^"]+"[^>]*>/g)].map(match=>match[0]);
  assert.ok(legalAnchors.length>=7);
  for(const anchor of legalAnchors){assert.match(anchor,/target="_blank"/);assert.match(anchor,/rel="noreferrer"/)}
  for(const source of [app,dashboard])for(const anchor of source.match(/<a\s+[^>]*href=(?:"https?:\/\/|\{(?:next\?\.navigationUrl|url|item\.externalUrl\|\|"#"|s\.navigationUrl|event\.navigationUrl|event\.shopUrl))[^>]*>/g)||[]){assert.match(anchor,/target="_blank"/);assert.match(anchor,/rel="noreferrer"/)}
});

test("supports three attendance workflows with an auditable shared check-in",async()=>{
  const [admin,workspace,claim,database,auditApi,checkinApi,styles]=await Promise.all([
    readFile(new URL("app/admin-console.tsx",root),"utf8"),readFile(new URL("app/admin-attendance-workspace.tsx",root),"utf8"),readFile(new URL("app/checkin-claim.tsx",root),"utf8"),readFile(new URL("lib/database.ts",root),"utf8"),readFile(new URL("app/api/admin/audit/route.ts",root),"utf8"),readFile(new URL("app/api/checkin/[token]/route.ts",root),"utf8"),readFile(new URL("app/globals.css",root),"utf8")]);
  assert.match(admin,/AdminAttendanceWorkspace/);
  assert.match(admin,/Auditprotokoll/);
  assert.match(workspace,/Persönlich begrüßen/);
  assert.match(workspace,/Gemeinsamer Termin-QR/);
  assert.match(workspace,/Persönlichen QR-Code scannen/);
  assert.match(workspace,/window\.setInterval\(load,4000\)/);
  assert.match(claim,/Ich bin angekommen/);
  assert.match(database,/CREATE TABLE IF NOT EXISTS session_checkins/);
  assert.match(database,/audit_log_no_delete/);
  assert.match(auditApi,/code_hint codeHint/);
  assert.match(checkinApi,/attendance\.self_checkin/);
  assert.match(styles,/Human-friendly attendance/);
});

test("notifies admins when codes are created or redeemed without mailing full codes",async()=>{
  const [codes,redeem,register,notifications]=await Promise.all([readFile(new URL("app/api/admin/codes/route.ts",root),"utf8"),readFile(new URL("app/api/codes/redeem/route.ts",root),"utf8"),readFile(new URL("app/api/auth/register/route.ts",root),"utf8"),readFile(new URL("lib/admin-notifications.ts",root),"utf8")]);
  assert.match(codes,/notifyAdmins\("Zugangscodes erstellt"/);
  assert.match(codes,/nicht per E-Mail versendet/);
  assert.match(redeem,/notifyAdmins\("Zugangscode eingelöst"/);
  assert.match(register,/notifyAdmins\("Neue Registrierung und Code-Einlösung"/);
  assert.match(redeem,/codeHint/);
  assert.match(register,/codeHint/);
  assert.match(notifications,/role='admin'/);
});

test("plans every course session from date and start time without manual metadata",async()=>{
  const [planner,route,admin,styles]=await Promise.all([
    readFile(new URL("app/admin-session-planner.tsx",root),"utf8"),readFile(new URL("app/api/admin/courses/[courseId]/sessions/route.ts",root),"utf8"),readFile(new URL("app/admin-console.tsx",root),"utf8"),readFile(new URL("app/globals.css",root),"utf8")
  ]);
  assert.match(planner,/course\.sessionCount-result\.sessions\.length/);
  assert.match(planner,/type="date"/);
  assert.match(planner,/type="time"/);
  assert.match(planner,/split\(\/\[\\n,;\]\+\//);
  assert.doesNotMatch(planner,/name="sequence"|name="title"|name="endsAt"/);
  assert.match(route,/course\.durationMinutes\*60000/);
  assert.match(route,/`\$\{course\.title\} · Einheit \$\{sequence\}`/);
  assert.match(route,/sessions\.create_batch/);
  assert.match(styles,/Batch planning replaces manual session numbers/);
  assert.match(styles,/Keep native date and time controls inside the mobile session cards/);
  assert.match(styles,/grid-template-columns:minmax\(0,1\.35fr\) minmax\(0,\.85fr\)/);
  assert.match(admin,/const form=e\.currentTarget/);
});

test("keeps permanent course deletion feedback visible",async()=>{
  const admin=await readFile(new URL("app/admin-console.tsx",root),"utf8");
  assert.match(admin,/Kurs wird endgültig gelöscht/);
  assert.match(admin,/wurde endgültig gelöscht/);
  assert.match(admin,/Kurs konnte nicht gelöscht werden/);
  assert.match(admin,/scrollIntoView/);
});
