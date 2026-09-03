import { spawn } from "node:child_process";
import { REPO_ROOT } from "./validate.js";

export function runPreview(): void {
  console.log("Starting local preview server...");
  console.log("Example: http://localhost:5173/g/2026.08.26/PAY-1245");
  console.log("");

  const child = spawn("pnpm", ["--filter", "@trail/viewer", "dev"], {
    cwd: REPO_ROOT,
    stdio: "inherit",
    shell: process.platform === "win32",
  });

  child.on("exit", (code) => {
    process.exitCode = code ?? 0;
  });
}
