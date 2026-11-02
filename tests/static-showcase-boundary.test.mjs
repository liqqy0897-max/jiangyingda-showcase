import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const publicFiles = [
  "app/components/SiteHeader.tsx",
  "app/page.tsx",
  "app/services/page.tsx",
  "app/assurance/page.tsx",
  "app/about/page.tsx",
];

test("public showcase pages do not link to API, join, or platform routes", async () => {
  for (const file of publicFiles) {
    const source = await readFile(file, "utf8");
    assert.doesNotMatch(source, /href=["']\/(?:api|join|platform)(?:[\/"'#?]|$)/, file);
    assert.doesNotMatch(source, /fetch\(["']\/api\//, file);
  }
});

test("static build excludes interactive routes and enables export mode", async () => {
  const script = await readFile("scripts/build-static-showcase.mjs", "utf8");
  const config = await readFile("next.config.ts", "utf8");

  for (const blocked of ['["app", "api"]', '["app", "join"]', '["app", "platform"]']) {
    assert.match(script, new RegExp(blocked.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
  assert.match(config, /output:\s*"export"/);
  assert.match(config, /unoptimized:\s*true/);
});
