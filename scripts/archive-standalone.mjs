import { access, rm } from "node:fs/promises";
import { spawn } from "node:child_process";
import path from "node:path";

const rootDir = process.cwd();
const distDir = path.join(rootDir, "dist");
const archiveFile = path.join(rootDir, "dist.tar.gz");
const envFile = path.join(rootDir, ".env");

async function ensureExists(targetPath, label) {
  try {
    await access(targetPath);
  } catch {
    throw new Error(`${label} not found: ${targetPath}`);
  }
}

async function runTar() {
  const tarArgs = ["-czf", archiveFile, "-C", distDir, ".", "-C", rootDir, ".env"];

  await new Promise((resolve, reject) => {
    const child = spawn("tar", tarArgs, {
      cwd: rootDir,
      stdio: "inherit",
    });

    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`tar exited with code ${code ?? "unknown"}`));
    });
  });
}

async function main() {
  await ensureExists(distDir, "Deploy bundle");
  await ensureExists(envFile, ".env file");
  await rm(archiveFile, { force: true });
  await runTar();
  console.log(`Archive created at ${archiveFile}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
