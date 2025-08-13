<p align="center">
  <img src="img/unflakeops_wordmark.png" alt="UnflakeOps" width="520" />
  <br/>
  <em>Cut flakiness 40–60% in 30 days • Read‑only → Soft → Enforce merge gates</em>
</p>

## Artifacts (what you can download & why it matters)

Every CI run uploads a small **evidence bundle** to the run page (**Actions → latest run → Artifacts**). It contains:

- `playwright-results.xml` — JUnit from the browser E2E test (objective pass/fail + timings).
- `newman-results.xml` — JUnit from the API smoke (same format for easy aggregation).
- `fingerprints.json` — clustered failure “signatures” (deduped errors so you see top offenders first).
- `gate-score.json` — release gate summary (pass rate, median duration, quarantine debt, PASS/WARN/FAIL).

**Why it’s valuable:** download once, share anywhere. It’s auditable proof of test health, makes flaky bugs obvious, and shows if the release gate would block or allow a merge—without needing repo access.

> Reproduce locally:  
> `npm i && npx playwright install chromium && npm run ci:all:readonly` → files appear in `./artifacts/` (not committed to git).
