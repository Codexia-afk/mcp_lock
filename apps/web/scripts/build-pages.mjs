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

  const repoRoot = path.resolve(webRoot, "../..");
  const rootCnamePath = path.join(repoRoot, "CNAME");
  const hasCustomDomain = fs.existsSync(rootCnamePath) && fs.readFileSync(rootCnamePath, "utf-8").trim().length > 0;
  const customDomain = hasCustomDomain ? fs.readFileSync(rootCnamePath, "utf-8").trim() : "";
  const repoName = process.env.GITHUB_REPOSITORY ? process.env.GITHUB_REPOSITORY.split("/")[1] : "mcp_lock";
  const basePath = hasCustomDomain ? "" : `/${repoName}`;

  console.log(`Building static export (customDomain: "${customDomain}", basePath: "${basePath}")...`);
  const nextBin = path.join(webRoot, "node_modules/.bin/next");
  execSync(`"${nextBin}" build`, {
    cwd: webRoot,
    stdio: "inherit",
    env: {
      ...process.env,
      NEXT_PUBLIC_STATIC_EXPORT: "true",
      NEXT_PUBLIC_BASE_PATH: basePath,
    },
  });

  const nojekyllPath = path.join(outDir, ".nojekyll");
  fs.writeFileSync(nojekyllPath, "");
  if (hasCustomDomain) {
    const cnamePath = path.join(outDir, "CNAME");
    fs.writeFileSync(cnamePath, `${customDomain}\n`);
    console.log(`Created out/CNAME (${customDomain}) and out/.nojekyll`);
  } else {
    console.log("Created out/.nojekyll (default github.io deployment)");
  }
  console.log("Static export for GitHub Pages completed successfully in out/");
} finally {
  if (apiMoved && fs.existsSync(apiBackup)) {
    fs.renameSync(apiBackup, apiDir);
    console.log("Restored app/api directory");
  }
}
