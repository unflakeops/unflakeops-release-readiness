// scripts/fingerprints_pretty.js
// Usage: node scripts/fingerprints_pretty.js [topN]
// Prints the top N failure clusters from artifacts/fingerprints.json

import fs from "fs";
import path from "path";

let chalk;
try {
  chalk = (await import("chalk")).default;
} catch {
  chalk = null;
}

const TOP = Number(process.argv[2] || 5);
const file = path.join("artifacts", "fingerprints.json");

if (!fs.existsSync(file)) {
  console.error("No artifacts/fingerprints.json found. Run the CI step first.");
  process.exit(1);
}

let data;
try {
  data = JSON.parse(fs.readFileSync(file, "utf8"));
} catch (e) {
  console.error("Could not parse artifacts/fingerprints.json:", e.message);
  process.exit(1);
}

if (!Array.isArray(data) || data.length === 0) {
  console.log("No failed clusters found. (All green or no failures recorded.)");
  process.exit(0);
}

// sort by count desc
data.sort((a, b) => (b.count || 0) - (a.count || 0));
const top = data.slice(0, TOP);

const cols = process.stdout.columns || 120;
const w = {
  idx: 3, // #
  cnt: 6, // count
  q: 3, // Q?
  name: 28, // test name
  // signature gets the rest
};
w.sig = Math.max(20, cols - (w.idx + w.cnt + w.q + w.name + 10));

const pad = (s, n) =>
  s.length > n ? s.slice(0, n - 1) + "…" : s.padEnd(n, " ");
const header =
  pad("#", w.idx) +
  "  " +
  pad("count", w.cnt) +
  "  " +
  pad("Q", w.q) +
  "  " +
  pad("test", w.name) +
  "  " +
  pad("signature", w.sig);

console.log(header);
console.log("-".repeat(Math.min(cols, header.length)));

for (let i = 0; i < top.length; i++) {
  const c = top[i] || {};
  const line =
    pad(String(i + 1), w.idx) +
    "  " +
    pad(String(c.count ?? 0), w.cnt) +
    "  " +
    pad(c.quarantined ? "Y" : "", w.q) +
    "  " +
    pad(c.name || "—", w.name) +
    "  " +
    pad((c.message || "—").toLowerCase(), w.sig);

  if (chalk && c.quarantined) {
    console.log(chalk.yellow(line));
  } else if (chalk && (c.count || 0) > 0) {
    console.log(chalk.red(line));
  } else {
    console.log(line);
  }
}

console.log(
  "\nLegend: Q=quarantined test (listed in quarantine/quarantine.json)"
);
