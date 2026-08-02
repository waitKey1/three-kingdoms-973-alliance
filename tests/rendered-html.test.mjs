import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render(pathname = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}-${pathname}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(
    new Request(`http://localhost${pathname}`, { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the 973 alliance command homepage", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  const html = await response.text();
  assert.match(html, /<title>973冰河盟府<\/title>/);
  assert.match(html, /三国冰河时代 · 973区/);
  assert.match(html, /四盟编成态势/);
  assert.match(html, /兰亭一盟强化/);
  assert.match(html, /迁盟执行/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape|react-loading-skeleton/i);
});

test("server-renders migration management data", async () => {
  const response = await render("/migration");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /迁盟管理/);
  assert.match(html, /47条执行项/);
  assert.match(html, /四盟97人编成/);
  assert.match(html, /先确认候补3人/);
});

test("ships the complete migration dataset and social card", async () => {
  const data = JSON.parse(await readFile(new URL("../app/data/migration-data.json", import.meta.url), "utf8"));
  assert.equal(data.records.length, 391);
  assert.equal(data.stats.moves, 47);
  assert.equal(data.stats.reserves, 3);
  assert.deepEqual(data.alliances.map((item) => item.targetCount), [97, 97, 97, 97]);
  const og = await readFile(new URL("../public/og.png", import.meta.url));
  assert.ok(og.byteLength > 100_000);
});
