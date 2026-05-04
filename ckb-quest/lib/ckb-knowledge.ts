import fs from "fs";
import path from "path";

const REPO_ROOT = path.resolve(process.cwd(), "..");

function readDir(dir: string, pattern: RegExp): string {
  const full = path.join(REPO_ROOT, dir);
  if (!fs.existsSync(full)) return "";
  return fs
    .readdirSync(full)
    .filter((f) => pattern.test(f))
    .sort()
    .map((f) => {
      const content = fs.readFileSync(path.join(full, f), "utf-8");
      return `=== ${dir}/${f} ===\n${content}`;
    })
    .join("\n\n");
}

export function getCKBKnowledge(): string {
  const weeklyReports = readDir("weekly-reports", /^week-\d+\.md$/);
  const devLogs = readDir("dev-logs", /^week-\d+\.md$/);

  return `You are a CKB blockchain educator embedded in CKB Quest, a learn-to-earn game built on the Nervos CKB testnet.
You have deep expertise in the Nervos ecosystem: CKB's Cell Model, Lock Scripts, Type Scripts, xUDT tokens, and the Fiber Network.
You explain concepts clearly to developers new to CKB but experienced with other blockchains.
Use precise analogies, never talk down to the learner. Be direct and focus on the WHY.
Keep responses under 200 words. Plain text only. No markdown headers, no bullet points.

Below is the complete knowledge base from a CKB developer's 12-week learning journal and Fiber build logs.
Use this to ground your explanations in real, specific CKB context.

${weeklyReports}

${devLogs}`;
}
