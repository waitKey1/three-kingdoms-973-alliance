import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { calculateScores, calculateSixTotal } from "../app/lib/server/score";
import { allianceInputSchema, phoneSchema } from "../app/lib/server/schemas";
import { canManageAlliance } from "../app/lib/server/session";

test("source roster preserves approved migration totals", async () => {
  const data = JSON.parse(await readFile(new URL("../app/data/migration-data.json", import.meta.url), "utf8"));
  assert.equal(data.records.length, 391);
  assert.equal(data.stats.assigned, 388);
  assert.equal(data.stats.moves, 47);
  assert.equal(data.stats.reserves, 3);
  assert.equal(data.stats.sixMatched, 205);
  assert.deepEqual(data.alliances.map((item: { targetCount: number }) => item.targetCount), [97, 97, 97, 97]);
});

test("six-dimensional total is computed only when all six values exist", () => {
  assert.equal(calculateSixTotal({ infantryDefense: 1, infantryHealth: 2, cavalryAttack: 3, cavalryDestruction: 4, archerAttack: 5, archerDestruction: 6 }), 21);
  assert.equal(calculateSixTotal({ infantryDefense: 1, infantryHealth: null, cavalryAttack: 3, cavalryDestruction: 4, archerAttack: 5, archerDestruction: 6 }), null);
});

test("missing six dimensions redistributes the remaining score weights", () => {
  const scores = calculateScores([
    { id: "complete", totalMerit: 100n, strength: 100n, power: 100n, sixDimensionTotal: 100 },
    { id: "missing", totalMerit: 100n, strength: 100n, power: 100n, sixDimensionTotal: null },
  ]);
  assert.equal(scores.find((row) => row.id === "complete")?.battleScore, 100);
  assert.equal(scores.find((row) => row.id === "missing")?.battleScore, 100);
});

test("alliance capacities and mainland phone numbers are validated", () => {
  assert.equal(phoneSchema.safeParse("13800138000").success, true);
  assert.equal(phoneSchema.safeParse("123456").success, false);
  const base = { name: "测试盟", slug: "test", roleLabel: "支援盟", color: "#76c2bf", capacity: 100, sortOrder: 5 };
  assert.equal(allianceInputSchema.safeParse({ ...base, targetCapacity: 97 }).success, true);
  assert.equal(allianceInputSchema.safeParse({ ...base, targetCapacity: 94 }).success, false);
  assert.equal(allianceInputSchema.safeParse({ ...base, targetCapacity: 98 }).success, false);
});

test("alliance administrators are constrained to their own alliance", () => {
  assert.equal(canManageAlliance({ role: "REGION_ADMIN", status: "ACTIVE", allianceId: null }, "any"), true);
  assert.equal(canManageAlliance({ role: "ALLIANCE_ADMIN", status: "ACTIVE", allianceId: "a" }, "a"), true);
  assert.equal(canManageAlliance({ role: "ALLIANCE_ADMIN", status: "ACTIVE", allianceId: "a" }, "b"), false);
  assert.equal(canManageAlliance({ role: "ALLIANCE_MEMBER", status: "ACTIVE", allianceId: "a" }, "a"), false);
});
