import fs from 'fs';
import path from 'path';
import { parseStringPromise } from 'xml2js';
import chalk from 'chalk';

const cfg = JSON.parse(fs.readFileSync('gate/config.json','utf-8'));
const readOnly = process.argv.includes('--readOnly') || cfg.mode === 'readOnly';

const artifactsDir = 'artifacts';
const junitFiles = [path.join(artifactsDir,'playwright-results.xml'), path.join(artifactsDir,'newman-results.xml')];

function pct(n,d){ return d===0?1:n/d; }

let total=0, failed=0; let durations=[];
for (const f of junitFiles){
  if (!fs.existsSync(f)) continue;
  const xml = fs.readFileSync(f,'utf-8');
  const parsed = await parseStringPromise(xml);
  const suites = parsed.testsuites?.testsuite || parsed.testsuite || [];
  const list = Array.isArray(suites) ? suites : [suites];
  for (const s of list){
    const tests = Number(s.$?.tests || 0);
    const failures = Number(s.$?.failures || 0) + Number(s.$?.errors || 0);
    total += tests; failed += failures;
    const cases = s.testcase || [];
    for (const tc of cases){ durations.push(Number(tc.$?.time || 0)*1000); }
  }
}

durations.sort((a,b)=>a-b);
const mid=Math.floor(durations.length/2);
const median = durations.length ? (durations.length%2?durations[mid]:(durations[mid-1]+durations[mid])/2) : 0;

let quarantine=[]; try{ quarantine = JSON.parse(fs.readFileSync('quarantine/quarantine.json','utf-8')); }catch{}

const passRate = pct(total - failed, total);
const okPass = passRate >= cfg.passRateThreshold;
const okQuarantine = quarantine.length <= cfg.maxQuarantineDebt;
const okDuration = median <= cfg.maxMedianDurationMs;

const score = (okPass?1:0)+(okQuarantine?1:0)+(okDuration?1:0);
const status = score===3?'PASS':(score===2?'WARN':'FAIL');

const summary = { passRate:Number(passRate.toFixed(3)), medianDurationMs:Math.round(median), quarantineDebt:quarantine.length, thresholds:cfg, score, status, mode: readOnly? 'readOnly':'enforce' };
fs.writeFileSync(path.join(artifactsDir,'gate-score.json'), JSON.stringify(summary,null,2));
console.log(`${summary.mode.toUpperCase()} gate — passRate=${summary.passRate} (>=${cfg.passRateThreshold}), median=${summary.medianDurationMs}ms (<=${cfg.maxMedianDurationMs}), quarantine=${summary.quarantineDebt} (<=${cfg.maxQuarantineDebt}) => ${status}`);
if(!readOnly && status==='FAIL'){ console.error(chalk.red('Gate enforcement: failing pipeline.')); process.exit(1); }
