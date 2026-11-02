import { cp, mkdir, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const stage = path.join(root, ".static-showcase-build");
const output = path.join(root, "dist", "static-showcase");
const nextCli = path.join(root, "node_modules", "next", "dist", "bin", "next");

const copiedEntries = [
  "app",
  "public",
  "src",
  "next.config.ts",
  "next-env.d.ts",
  "package.json",
  "tsconfig.json",
];

async function run(command, args, options = {}) {
  await new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: "inherit", ...options });
    child.once("error", reject);
    child.once("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} exited with code ${code}`));
    });
  });
}

await rm(stage, { recursive: true, force: true });
await rm(output, { recursive: true, force: true });
await mkdir(stage, { recursive: true });

for (const entry of copiedEntries) {
  await cp(path.join(root, entry), path.join(stage, entry), { recursive: true });
}

await symlink(path.join(root, "node_modules"), path.join(stage, "node_modules"), "junction");

const stagedLayoutPath = path.join(stage, "app", "layout.tsx");
let stagedLayout = await readFile(stagedLayoutPath, "utf8");
stagedLayout = stagedLayout
  .replace(/import \{ Noto_Sans_SC, Noto_Serif_SC \} from "next\/font\/google";\r?\n/, "")
  .replace(/const bodyFont = Noto_Sans_SC\([\s\S]*?\);\r?\n\r?\nconst displayFont = Noto_Serif_SC\([\s\S]*?\);\r?\n\r?\n/, "")
  .replace('<body className={`${bodyFont.variable} ${displayFont.variable}`}>', "<body>");

if (/next\/font|bodyFont|displayFont/.test(stagedLayout)) {
  throw new Error("Static showcase layout still depends on hosted fonts.");
}
await writeFile(stagedLayoutPath, stagedLayout, "utf8");

// Production showcase boundary: publish content pages only.
for (const blockedPath of [
  ["app", "api"],
  ["app", "join"],
  ["app", "platform"],
  ["app", "components", "JoinPanel.tsx"],
  ["src", "join"],
  ["src", "platform"],
]) {
  await rm(path.join(stage, ...blockedPath), { recursive: true, force: true });
}

await run(process.execPath, [nextCli, "build", "--webpack"], {
  cwd: stage,
  env: {
    ...process.env,
    STATIC_SHOWCASE: "true",
    NEXT_PUBLIC_STATIC_SHOWCASE: "true",
  },
});

await mkdir(path.dirname(output), { recursive: true });
await cp(path.join(stage, "out"), output, { recursive: true });

const packageJson = JSON.parse(await readFile(path.join(root, "package.json"), "utf8"));
await writeFile(
  path.join(output, "STATIC_SHOWCASE_MANIFEST.json"),
  `${JSON.stringify(
    {
      name: packageJson.name,
      mode: "static-showcase",
      blockedRoutes: ["/api", "/join", "/platform"],
      generatedAt: new Date().toISOString(),
    },
    null,
    2,
  )}\n`,
  "utf8",
);

await rm(stage, { recursive: true, force: true });
console.log(`STATIC_SHOWCASE_OK ${output}`);
