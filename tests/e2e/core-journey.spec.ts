import {expect,request as apiRequest,test} from "@playwright/test";
import * as OTPAuth from "otpauth";

test("complete member journey and admin CRUD lifecycle",async({page,browser})=>{
  test.setTimeout(90_000);
  const adminApi=await apiRequest.newContext({baseURL:"http://127.0.0.1:3100"});
  const setup=await adminApi.post("/api/setup/initialize",{data:{installToken:"e2e-install-token-secure",email:"admin@example.test",password:"Admin-Testpasswort-2026",firstName:"Test",lastName:"Admin"}});
  expect(setup.status()).toBe(201);
  const twoFactorStart=await adminApi.post("/api/admin/two-factor",{data:{action:"begin"}});
  const twoFactorBody=await twoFactorStart.json();
  expect(twoFactorStart.ok(),`${twoFactorStart.status()} ${JSON.stringify(twoFactorBody)}`).toBeTruthy();
  const manualKey=twoFactorBody.manualKey as string;
  const token=new OTPAuth.TOTP({issuer:"Stärke deine Mitte",algorithm:"SHA1",digits:6,period:30,secret:OTPAuth.Secret.fromBase32(manualKey)}).generate();
  expect((await adminApi.post("/api/admin/two-factor",{data:{action:"confirm",code:token}})).ok()).toBeTruthy();

  await page.goto("/");
  await page.getByRole("button",{name:"Nur erforderlich"}).click();
  await expect(page.getByRole("heading",{name:"Kurscode eingeben"})).toBeVisible();

  const anonymous=await browser.newContext();
  expect((await anonymous.request.get("/api/admin/courses")).status()).toBe(403);
  await anonymous.close();

  const courseCreate=await adminApi.post("/api/admin/courses",{data:{title:"E2E Grundkurs",description:"Automatisierter Testkurs",sessionCount:2,durationMinutes:90,location:"Testweg 1, 10115 Berlin",navigationUrl:"https://maps.google.com/?q=Berlin",status:"published"}});
  expect(courseCreate.status()).toBe(201);
  const courseId=(await courseCreate.json()).id as string;
  const courses=await (await adminApi.get("/api/admin/courses")).json();
  expect(courses.courses).toEqual(expect.arrayContaining([expect.objectContaining({id:courseId,title:"E2E Grundkurs"})]));
  expect((await adminApi.patch(`/api/admin/courses/${courseId}`,{data:{title:"E2E Grundkurs aktualisiert"}})).ok()).toBeTruthy();

  expect((await adminApi.post(`/api/admin/courses/${courseId}/sessions`,{data:{startsAt:["2027-09-01T16:30:00.000Z","2027-09-08T16:30:00.000Z"]}})).status()).toBe(201);
  const sessions=(await (await adminApi.get(`/api/admin/courses/${courseId}/sessions`)).json()).sessions;
  expect(sessions).toHaveLength(2);
  expect((await adminApi.patch(`/api/admin/courses/${courseId}/sessions/${sessions[0].id}`,{data:{startsAt:"2027-09-01T17:00:00.000Z",endsAt:"2027-09-01T18:30:00.000Z"}})).ok()).toBeTruthy();
  expect((await adminApi.delete(`/api/admin/courses/${courseId}/sessions/${sessions[1].id}`)).ok()).toBeTruthy();

  const eventCreate=await adminApi.post("/api/admin/events",{data:{title:"E2E Zeit für mich",description:"Testevent",startsAt:"2027-11-01T09:00:00.000Z",endsAt:"2027-11-01T15:00:00.000Z",status:"draft"}});
  expect(eventCreate.status()).toBe(201);
  const eventId=(await eventCreate.json()).id as string;
  expect((await adminApi.patch(`/api/admin/events/${eventId}`,{data:{title:"E2E Event aktualisiert",status:"archived"}})).ok()).toBeTruthy();
  expect((await adminApi.delete(`/api/admin/events/${eventId}`)).ok()).toBeTruthy();

  const contentCreate=await adminApi.post("/api/admin/content",{data:{courseId,title:"E2E Übung",kind:"text",body:"Achtsam üben",status:"draft",ruleType:"immediate"}});
  expect(contentCreate.status()).toBe(201);
  const contentId=(await contentCreate.json()).id as string;
  expect((await adminApi.patch(`/api/admin/content/${contentId}`,{data:{title:"E2E Übung aktualisiert",status:"published"}})).ok()).toBeTruthy();
  expect((await adminApi.delete(`/api/admin/content/${contentId}`)).ok()).toBeTruthy();

  const png=Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=","base64");
  const mediaCreate=await adminApi.post("/api/admin/media",{multipart:{file:{name:"e2e-symbol.png",mimeType:"image/png",buffer:png}}});
  expect(mediaCreate.status()).toBe(201);
  const mediaId=(await mediaCreate.json()).id as string;
  expect((await adminApi.get(`/api/media/${mediaId}`)).ok()).toBeTruthy();
  const decorationCreate=await adminApi.post("/api/admin/tree-decorations",{data:{courseId,mediaId,title:"E2E Stern",memoryText:"Ein besonderer Moment",positionX:70,positionY:20,sizePercent:10,rotation:5,status:"published"}});
  expect(decorationCreate.status()).toBe(201);
  const decorationId=(await decorationCreate.json()).id as string;
  expect((await adminApi.patch(`/api/admin/tree-decorations/${decorationId}`,{data:{title:"E2E Blüte",memoryText:"Aktualisierte Erinnerung",positionX:72,positionY:22,sizePercent:11,rotation:0,status:"draft"}})).ok()).toBeTruthy();
  expect((await adminApi.delete(`/api/admin/tree-decorations/${decorationId}`)).ok()).toBeTruthy();

  const codeCreate=await adminApi.post("/api/admin/codes",{data:{courseId,type:"attendance",count:1,assignedEmails:["teilnehmerin@example.test"],sendInvitations:false}});
  expect(codeCreate.status()).toBe(201);
  const code=(await codeCreate.json()).codes[0].code as string;
  const audit=await (await adminApi.get("/api/admin/audit?limit=100")).json();
  expect(audit.entries).toEqual(expect.arrayContaining([expect.objectContaining({action:"codes.create"})]));

  const member=await browser.newPage();
  await member.goto(`/#code=${encodeURIComponent(code)}`);
  await member.getByRole("button",{name:"Nur erforderlich"}).click();
  await expect(member.getByRole("heading",{name:"Kurscode eingeben"})).toBeVisible();
  await member.getByRole("button",{name:"Code prüfen und weiter"}).click();
  await expect(member.getByRole("heading",{name:"Konto erstellen"})).toBeVisible();
  await member.getByLabel("Vorname").fill("Erika");
  await member.getByLabel("Nachname").fill("Musterfrau");
  await member.getByLabel("E-Mail-Adresse").fill("teilnehmerin@example.test");
  await member.getByLabel(/Passwort/).fill("Teilnahme8!");
  await member.getByRole("checkbox").check();
  await member.getByRole("button",{name:"Konto erstellen & Kurs aktivieren"}).click();
  await expect(member.getByRole("heading",{name:"Dein persönlicher Kursbereich ist bereit."})).toBeVisible();
  await member.getByRole("button",{name:"Weiter"}).click();
  await expect(member.getByRole("heading",{name:"Ein anonymer Blick auf deine Bedürfnisse"})).toBeVisible();
  await member.getByRole("button",{name:"Weiter"}).click();
  await member.getByRole("button",{name:"Weiter"}).click();
  await member.getByRole("button",{name:"Meinen Bereich öffnen"}).click();
  await expect(member.getByText("Willkommen, Erika",{exact:false})).toBeVisible();
  await member.getByRole("button",{name:"Kurse",exact:true}).first().click();
  await expect(member.getByText("E2E Grundkurs aktualisiert")).toBeVisible();
  await member.close();

  expect((await adminApi.delete(`/api/admin/courses/${courseId}`)).ok()).toBeTruthy();
  const finalCourses=await (await adminApi.get("/api/admin/courses")).json();
  expect(finalCourses.courses).not.toEqual(expect.arrayContaining([expect.objectContaining({id:courseId})]));
  await adminApi.dispose();
});
