import test from "node:test";
import assert from "node:assert/strict";
import {formatDate,zonedInputValue,zonedLocalToIso} from "../lib/app-time";

test("converts Berlin wall-clock appointments with daylight saving time",()=>{
  assert.equal(zonedLocalToIso("2027-01-14T18:30","Europe/Berlin"),"2027-01-14T17:30:00.000Z");
  assert.equal(zonedLocalToIso("2027-07-14T18:30","Europe/Berlin"),"2027-07-14T16:30:00.000Z");
  assert.equal(zonedInputValue("2027-07-14T16:30:00.000Z","Europe/Berlin"),"2027-07-14T18:30");
  assert.match(formatDate("2027-07-14T16:30:00.000Z",{dateStyle:"medium",timeStyle:"short"},"Europe/Berlin"),/18:30/);
});

test("rejects a Berlin wall-clock time skipped by the spring transition",()=>{
  assert.throws(()=>zonedLocalToIso("2027-03-28T02:30","Europe/Berlin"),/Zeitumstellung/);
});
