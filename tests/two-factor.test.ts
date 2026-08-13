import assert from "node:assert/strict";
import test from "node:test";
import * as OTPAuth from "otpauth";
import { decryptSecret,encryptSecret,newTotp,validTotp } from "../lib/two-factor";

process.env.SESSION_SECRET="test-session-secret-that-is-at-least-32-characters";
test("encrypts TOTP secrets at rest",()=>{const encrypted=encryptSecret("PRIVATE-SECRET");assert.doesNotMatch(encrypted,/PRIVATE-SECRET/);assert.equal(decryptSecret(encrypted),"PRIVATE-SECRET")});
test("accepts a current authenticator token",()=>{const setup=newTotp("admin@example.de"),totp=new OTPAuth.TOTP({issuer:"Stärke deine Mitte",algorithm:"SHA1",digits:6,period:30,secret:OTPAuth.Secret.fromBase32(setup.secret)});assert.equal(validTotp(setup.secret,totp.generate()),true);assert.equal(validTotp(setup.secret,"000000"),false)});
