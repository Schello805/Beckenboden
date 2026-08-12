import assert from "node:assert/strict";
import test from "node:test";
process.env.SESSION_SECRET="account-token-test-secret-that-is-long-enough";
process.env.DATA_DIR=`/tmp/kraftbaum-account-token-test-${process.pid}`;
const {db}=await import("../lib/database");
const {issueAccountToken,consumeAccountToken}=await import("../lib/account-tokens");
const timestamp=new Date().toISOString(),userId=crypto.randomUUID();
db.prepare("INSERT INTO users (id,email,password_hash,role,first_name,last_name,status,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?)").run(userId,`${userId}@example.test`,"hash","user","Test","Person","active",timestamp,timestamp);
test("account reset token is one-time and stored as a hash",()=>{const token=issueAccountToken(userId,"password_reset",30);assert.equal(db.prepare("SELECT token_hash FROM account_tokens WHERE user_id=?").get(userId)?.token_hash===token,false);assert.equal(consumeAccountToken(token,"password_reset"),userId);assert.equal(consumeAccountToken(token,"password_reset"),null)});
