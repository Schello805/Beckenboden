import assert from "node:assert/strict";
import test from "node:test";
import { brandedMail } from "../lib/mail-template";

test("renders every mail as restrained branded HTML with legal links and plain fallback",()=>{
  process.env.APP_URL="https://app.example.test/";
  const mail=brandedMail("Stärke deine Mitte · E-Mail bestätigen","Hallo Maria,\n\nÖffne https://app.example.test/verify?a=1&b=2");
  assert.match(mail.html,/Stärke deine Mitte/);
  assert.match(mail.html,/Anja Schellenberger/);
  assert.match(mail.html,/icon-192\.png/);
  assert.match(mail.html,/rechtliches\/impressum/);
  assert.match(mail.html,/rechtliches\/datenschutz/);
  assert.match(mail.html,/rechtliches\/nutzungsbedingungen/);
  assert.match(mail.html,/E-Mail bestätigen/);
  assert.match(mail.html,/&amp;/);
  assert.match(mail.text,/Impressum: https:\/\/app\.example\.test\/rechtliches\/impressum/);
});

test("escapes user supplied mail contents",()=>{
  const mail=brandedMail("Nachricht <script>","Hallo <img src=x onerror=alert(1)>");
  assert.doesNotMatch(mail.html,/<script>|<img src=x/);
  assert.match(mail.html,/&lt;script&gt;/);
  assert.match(mail.html,/&lt;img/);
});
