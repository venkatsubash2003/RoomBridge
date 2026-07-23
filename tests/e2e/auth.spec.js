import { test, expect } from "@playwright/test";

test("a new user can verify, complete onboarding, and reach server-backed discovery", async ({page}) => {
  const email=`browser-${Date.now()}@example.com`;
  await page.goto("/");
  await page.getByLabel("Full name").fill("Browser Test");
  await page.getByLabel("Email address").fill(email);
  await page.locator('input[name="password"]').fill("BrowserRoomBridge123");
  await page.getByRole("button",{name:/Create account/}).click();
  const code=await page.locator(".demo-code strong").textContent();
  await page.getByLabel("Verification code").fill(code);
  await page.getByRole("button",{name:"Verify and continue"}).click();

  await page.getByText("Find a new home",{exact:true}).click();
  await page.getByRole("button",{name:/Continue/}).click();
  await page.getByLabel("Preferred location").fill("Jersey City, NJ");
  await page.getByLabel("Monthly budget (USD)").fill("1400");
  await page.getByLabel("Move-in date").fill("2026-09-01");
  await page.getByRole("button",{name:/Continue/}).click();
  await page.getByLabel("Country").fill("United States");
  await page.getByLabel("Languages").fill("English");
  await page.getByRole("button",{name:/Continue/}).click();
  await page.getByRole("button",{name:/See my matches/}).click();

  await expect(page.getByRole("heading",{name:/Good to see you, Browser/})).toBeVisible();
  await expect(page.getByText("No matches in this view yet.")).toBeVisible();
});

test("invalid credentials stay generic and production security headers are present", async ({page}) => {
  const response=await page.goto("/");
  expect(response.headers()["content-security-policy"]).toContain("object-src 'none'");
  await page.getByRole("button",{name:"Sign in"}).click();
  await page.getByLabel("Email address").fill("missing@example.com");
  await page.locator('input[name="password"]').fill("IncorrectPassword123");
  await page.getByRole("button",{name:/Sign in/}).last().click();
  await expect(page.getByRole("alert")).toHaveText("Invalid credentials");
});
