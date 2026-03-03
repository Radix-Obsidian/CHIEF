/**
 * Automated screenshot capture for CHIEF landing page assets.
 *
 * Prerequisites:
 *   - Backend running: uvicorn main:app --port 8000
 *   - Frontend running: pnpm dev (port 3000)
 *
 * Usage:
 *   npx playwright test scripts/capture-screenshots.ts
 *
 * Output:
 *   docs/assets/screenshots/*.png + swipe-flow.webm (convert to GIF with ffmpeg)
 */

import { test, expect, Page } from "@playwright/test";
import path from "path";

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const OUTPUT_DIR = path.resolve(__dirname, "../docs/assets/screenshots");

const MOBILE_VIEWPORT = { width: 390, height: 844 }; // iPhone 14 Pro

test.describe("CHIEF Screenshot Capture", () => {
  test.use({
    viewport: MOBILE_VIEWPORT,
    colorScheme: "dark",
  });

  test("1. Login page", async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.waitForSelector("img[alt='CHIEF']");
    await page.waitForTimeout(500); // let fonts load
    await page.screenshot({
      path: path.join(OUTPUT_DIR, "login.png"),
      fullPage: false,
    });
  });

  test("2. Inbox with swipe cards", async ({ page }) => {
    await seedAndAuth(page);
    await page.goto(`${BASE_URL}/inbox`);
    await page.waitForTimeout(1500); // let animations settle
    await page.screenshot({
      path: path.join(OUTPUT_DIR, "inbox.png"),
      fullPage: false,
    });
  });

  test("3. Draft detail", async ({ page }) => {
    await seedAndAuth(page);
    await page.goto(`${BASE_URL}/drafts`);
    await page.waitForTimeout(1000);

    // Click first draft link
    const firstDraft = page.locator("a[href^='/drafts/']").first();
    if (await firstDraft.isVisible()) {
      await firstDraft.click();
      await page.waitForTimeout(1000);
      await page.screenshot({
        path: path.join(OUTPUT_DIR, "draft-detail.png"),
        fullPage: false,
      });
    }
  });

  test("4. Settings + Voice Calibration", async ({ page }) => {
    await seedAndAuth(page);
    await page.goto(`${BASE_URL}/settings`);
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: path.join(OUTPUT_DIR, "settings.png"),
      fullPage: true,
    });

    // Scroll to voice calibration section
    await page.evaluate(() => {
      const voiceSection = document.querySelector("[class*='voice']") ||
        document.querySelectorAll("section")[1];
      voiceSection?.scrollIntoView({ behavior: "instant", block: "start" });
    });
    await page.waitForTimeout(500);
    await page.screenshot({
      path: path.join(OUTPUT_DIR, "voice-calibration.png"),
      fullPage: false,
    });
  });

  test("5. History", async ({ page }) => {
    await seedAndAuth(page);
    await page.goto(`${BASE_URL}/history`);
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: path.join(OUTPUT_DIR, "history.png"),
      fullPage: false,
    });
  });

  test("6. Swipe flow video", async ({ browser }) => {
    const context = await browser.newContext({
      viewport: MOBILE_VIEWPORT,
      colorScheme: "dark",
      recordVideo: {
        dir: OUTPUT_DIR,
        size: MOBILE_VIEWPORT,
      },
    });

    const page = await context.newPage();
    await seedAndAuth(page);
    await page.goto(`${BASE_URL}/inbox`);
    await page.waitForTimeout(2000); // let cards fully render

    // Simulate swipe left (approve) on top card
    const card = page.locator("[class*='swipe']").first();
    if (await card.isVisible()) {
      const box = await card.boundingBox();
      if (box) {
        // Swipe left = approve
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await page.mouse.down();
        await page.mouse.move(box.x - 150, box.y + box.height / 2, {
          steps: 20,
        });
        await page.mouse.up();
        await page.waitForTimeout(1500);

        // Swipe right = archive on next card
        const nextCard = page.locator("[class*='swipe']").first();
        if (await nextCard.isVisible()) {
          const nextBox = await nextCard.boundingBox();
          if (nextBox) {
            await page.mouse.move(
              nextBox.x + nextBox.width / 2,
              nextBox.y + nextBox.height / 2
            );
            await page.mouse.down();
            await page.mouse.move(
              nextBox.x + nextBox.width + 150,
              nextBox.y + nextBox.height / 2,
              { steps: 20 }
            );
            await page.mouse.up();
            await page.waitForTimeout(1500);
          }
        }
      }
    }

    await context.close(); // saves the video
    // Video saved as .webm — convert to GIF:
    // ffmpeg -i swipe-flow.webm -vf "fps=15,scale=390:-1" -loop 0 swipe-flow.gif
  });
});

/**
 * Seed demo data and authenticate via the /api/dev/seed endpoint.
 */
async function seedAndAuth(page: Page) {
  const response = await page.request.post(`${BASE_URL}/api/dev/seed`);
  const data = await response.json();

  // Set auth tokens in localStorage
  await page.goto(`${BASE_URL}/login`);
  await page.evaluate(
    ({ userId, token }) => {
      localStorage.setItem("chief_user_id", userId);
      localStorage.setItem("chief_access_token", token);
    },
    { userId: data.user_id, token: data.access_token }
  );
}
