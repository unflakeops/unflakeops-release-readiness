import fs from 'fs';
import { parseStringPromise } from 'xml2js';
import path from 'path';

const artifactsDir = 'artifacts';
const files = [path.join(artifactsDir,'playwright-results.xml'), path.join(artifactsDir,'newman-results.xml')];

function normalize(msg=''){ return msg.replace(/\d+/g,'<num>').replace(/\b[0-9a-f]{7,}\b/gi,'<hash>').replace(/https?:\/\/\S+/g,'<url>').toLowerCase().trim(); }

const clusters = new Map();
for (const file of files){
  if (!fs.existsSync(file)) continue;
  const xml = fs.readFileSync(file,'utf-8');
  const parsed = await parseStringPromise(xml);
  const suites = parsed.testsuites?.testsuite || parsed.testsuite || [];
  const list = Array.isArray(suites) ? suites : [suites];
  for (const s of list){
    const cases = s.testcase || [];
    for (const tc of cases){
      const name = tc.$?.name || 'unknown-test';
      const failure = tc.failure?.[0]?._ || tc.failure?.[0] || '';
      const error = tc.error?.[0]?._ || tc.error?.[0] || '';
      const msg = normalize(failure || error);
      const key = msg ? `${name}::${msg}` : `${name}::pass`;
      const entry = clusters.get(key) || { name, message: msg, count: 0, quarantined: false };
      entry.count += (msg ? 1 : 0);
      clusters.set(key, entry);
    }
  }
}

let quarantine = [];
try { quarantine = JSON.parse(fs.readFileSync('quarantine/quarantine.json','utf-8')); } catch {}
for (const [k,v] of clusters.entries()){ if (quarantine.some(q => v.name.includes(q))) { v.quarantined = True; clusters.set(k,v); } }

const out = Array.from(clusters.values()).sort((a,b)=>b.count-a.count);
fs.writeFileSync(path.join(artifactsDir,'fingerprints.json'), JSON.stringify(out,null,2));
console.log('Wrote artifacts/fingerprints.json with', out.length, 'clusters');
