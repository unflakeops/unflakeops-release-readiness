// Minimal API smoke that writes JUnit XML to artifacts/newman-results.xml
import fs from "fs";
import path from "path";

const start = Date.now();
const outDir = "artifacts";
const outFile = path.join(outDir, "newman-results.xml");
await fs.promises.mkdir(outDir, { recursive: true });

let ok = false;
let errMsg = "";
try {
  const res = await fetch("https://httpbin.org/status/200");
  ok = res.status === 200;
  if (!ok) errMsg = `Expected 200, got ${res.status}`;
} catch (e) {
  ok = false;
  errMsg = String(e?.message ?? e);
}

const durSec = (Date.now() - start) / 1000;
const xml = `<?xml version="1.0" encoding="UTF-8"?>
<testsuites tests="1" failures="${
  ok ? 0 : 1
}" errors="0" time="${durSec.toFixed(3)}">
  <testsuite name="api_smoke" tests="1" failures="${
    ok ? 0 : 1
  }" errors="0" time="${durSec.toFixed(3)}">
    <testcase name="GET /status/200" time="${durSec.toFixed(3)}">
      ${
        ok
          ? ""
          : `<failure message="API status not 200"><![CDATA[${errMsg}]]></failure>`
      }
    </testcase>
  </testsuite>
</testsuites>`;
await fs.promises.writeFile(outFile, xml, "utf8");
console.log(`API smoke ${ok ? "PASS" : "FAIL"} — wrote ${outFile}`);
process.exitCode = ok ? 0 : 1;
