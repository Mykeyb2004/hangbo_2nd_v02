import { access, cp, mkdir, rm } from "node:fs/promises";
import path from "node:path";

const rootDir = process.cwd();
const nextDir = path.join(rootDir, ".next");
const standaloneDir = path.join(nextDir, "standalone");
const staticDir = path.join(nextDir, "static");
const publicDir = path.join(rootDir, "public");
const dataDir = path.join(rootDir, "data");
const reportDataFile = path.join(dataDir, "report-data.json");
const reportsDir = path.join(dataDir, "reports");
const distDir = path.join(rootDir, "dist");

async function ensureExists(targetPath, label) {
  try {
    await access(targetPath);
  } catch {
    throw new Error(`${label} not found: ${targetPath}`);
  }
}

async function main() {
  await ensureExists(standaloneDir, "Standalone build output");
  await ensureExists(staticDir, "Static build output");
  await ensureExists(publicDir, "Public assets");
  await ensureExists(reportDataFile, "Report data JSON");
  await ensureExists(reportsDir, "Archived report JSON");

  await rm(distDir, { recursive: true, force: true });
  await cp(standaloneDir, distDir, { recursive: true });

  await mkdir(path.join(distDir, ".next"), { recursive: true });
  await cp(staticDir, path.join(distDir, ".next", "static"), { recursive: true });
  await cp(publicDir, path.join(distDir, "public"), { recursive: true });
  await rm(path.join(distDir, "data"), { recursive: true, force: true });
  await mkdir(path.join(distDir, "data"), { recursive: true });
  await cp(reportDataFile, path.join(distDir, "data", "report-data.json"));
  await cp(reportsDir, path.join(distDir, "data", "reports"), { recursive: true });

  console.log(`Deploy bundle created at ${distDir}`);
  console.log("Start it with: cd dist && node server.js");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
