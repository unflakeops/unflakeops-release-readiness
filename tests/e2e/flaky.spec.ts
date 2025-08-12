import { test, expect } from "@playwright/test";
const DEMO_URL = "https://example.com";
function sometimesFlaky(prob = 0.35) {
  return Math.random() < prob;
}
test("homepage has Example Domain in title (with simulated flakiness)", async ({
  page,
}) => {
  await page.goto(DEMO_URL);
  const title = await page.title();
  if (process.env.QUARANTINE === "1")
    test.skip(true, "Quarantined test — known flaky");
  if (process.env.FLAKY_SIM === "1" && sometimesFlaky())
    expect(title).toBe("Not The Title");
  else expect(title).toContain("Example Domain");
});
