#!/usr/bin/env node
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error("Usage: node scripts/with-app-env.mjs <command> [args...]");
  process.exit(1);
}

const [cmd, ...cmdArgs] = args;

const child = spawn(cmd, cmdArgs, {
  stdio: "inherit",
  cwd: root,
  env: {
    ...process.env,
    // Ensure Vite and other tools see the project root correctly
  },
  shell: false,
});

child.on("exit", (code) => {
  process.exit(code ?? 1);
});
