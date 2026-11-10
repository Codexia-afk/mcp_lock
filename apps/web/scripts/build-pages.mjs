import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.resolve(__dirname, "..");
const apiDir = path.join(webRoot, "src/app/api");
const apiBackup = path.join(webRoot, ".api_backup");
const outDir = path.join(webRoot, "out");

let apiMoved = false;

try {
  if (fs.existsSync(apiDir)) {
    fs.renameSync(apiDir, apiBackup);
    apiMoved = true;
    console.log("Temporarily moved app/api for static export");
  }

  console.log("Building static export with NEXT_PUBLIC_STATIC_EXPORT=true...");
  const nextBin = path.join(webRoot, "node_modules/.bin/next");
  execSync(`"${nextBin}" build`, {
    cwd: webRoot,
    stdio: "inherit",
    env: {
      ...process.env,
      NEXT_PUBLIC_STATIC_EXPORT: "true",
    },
  });

  const cnamePath = path.join(outDir, "CNAME");
  const nojekyllPath = path.join(outDir, ".nojekyll");
  fs.writeFileSync(cnamePath, "mcplock.tech\n");
  fs.writeFileSync(nojekyllPath, "");
  console.log("Created out/CNAME (mcplock.tech) and out/.nojekyll");
  console.log("Static export for GitHub Pages completed successfully in out/");
} finally {
  if (apiMoved && fs.existsSync(apiBackup)) {
    fs.renameSync(apiBackup, apiDir);
    console.log("Restored app/api directory");
  }
}
