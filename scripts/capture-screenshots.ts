/**
 * Automated screenshot capture for CHIEF — with mock data injection.
 *
 * Uses Playwright page.route() for network-level request interception.
 * Service workers are blocked (in playwright.config.ts) to prevent them
 * from intercepting fetch calls before Playwright's route handlers.
 *
 * Usage:
 *   cd frontend && pnpm exec playwright test --reporter=list
 *
 * Output:
 *   docs/assets/screenshots/*.png + swipe-flow.webm
 */

import { test, expect, Page } from "@playwright/test";
import path from "path";

const OUTPUT_DIR = path.resolve(__dirname, "../docs/assets/screenshots");

/* ── Mock data ── */

const MOCK_DATA = {
  pendingDrafts: [
    {
      thread_id: "t-001",
      email_id: "e-001",
      draft_subject: "Re: Q3 Board Deck — Final Review",
      draft_body:
        "I've reviewed the updated deck. The revenue projections on slide 14 look accurate now. Let's lock this version and distribute to the board by Thursday EOD. I'll handle the follow-up with external counsel on the compliance footnote.",
      importance_score: 9,
      confidence: 0.94,
      original_email: {
        from: "Sarah Chen <sarah.chen@sequoiacap.com>",
        subject: "Q3 Board Deck — Final Review",
        preview:
          "Hi — attached is the revised deck with updated projections...",
      },
    },
    {
      thread_id: "t-002",
      email_id: "e-002",
      draft_subject: "Re: Series B Term Sheet — Counter",
      draft_body:
        "Thanks for sending the updated terms. The 2x liquidation preference is a non-starter — we can do 1x participating with a 3x cap. Happy to discuss on a call tomorrow morning.",
      importance_score: 10,
      confidence: 0.91,
      original_email: {
        from: "David Park <dpark@a16z.com>",
        subject: "Series B Term Sheet — Counter",
        preview:
          "Following up on our conversation, here's our revised term sheet...",
      },
    },
    {
      thread_id: "t-003",
      email_id: "e-003",
      draft_subject: "Re: Engineering Headcount — Q4 Plan",
      draft_body:
        "Approved. Let's post the senior backend and infra lead roles this week. For the ML engineer, let's wait until the Series B closes — should be within 30 days.",
      importance_score: 7,
      confidence: 0.88,
      original_email: {
        from: "Alex Rivera <alex@chiefapp.com>",
        subject: "Engineering Headcount — Q4 Plan",
        preview: "Here's the updated hiring plan for next quarter...",
      },
    },
    {
      thread_id: "t-004",
      email_id: "e-004",
      draft_subject: "Re: Customer Escalation — Acme Corp",
      draft_body:
        "I'll take the call with their CTO directly. Can you set up a 30-minute slot this Friday? Prepare the usage data and our proposed resolution before the call.",
      importance_score: 8,
      confidence: 0.87,
      original_email: {
        from: "Maya Johnson <maya@chiefapp.com>",
        subject: "Customer Escalation — Acme Corp",
        preview:
          "Acme Corp's CTO has requested an executive-level conversation...",
      },
    },
  ],

  draftsList: [
    {
      id: "d-001",
      email_id: "e-001",
      thread_id: "t-001",
      subject: "Re: Q3 Board Deck — Final Review",
      body: "I've reviewed the updated deck. The revenue projections on slide 14 look accurate now.",
      status: "pending",
      confidence: 0.94,
      created_at: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    },
    {
      id: "d-002",
      email_id: "e-002",
      thread_id: "t-002",
      subject: "Re: Series B Term Sheet — Counter",
      body: "Thanks for sending the updated terms. The 2x liquidation preference is a non-starter.",
      status: "pending",
      confidence: 0.91,
      created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    },
    {
      id: "d-003",
      email_id: "e-003",
      thread_id: "t-003",
      subject: "Re: Engineering Headcount — Q4 Plan",
      body: "Approved. Let's post the senior backend and infra lead roles this week.",
      status: "pending",
      confidence: 0.88,
      created_at: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    },
    {
      id: "d-004",
      email_id: "e-010",
      thread_id: "t-010",
      subject: "Re: Partnership Proposal — Stripe Integration",
      body: "This looks promising. Let's schedule a technical deep-dive with their API team next week.",
      status: "sent",
      confidence: 0.92,
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    },
    {
      id: "d-005",
      email_id: "e-011",
      thread_id: "t-011",
      subject: "Re: Offsite Venue Confirmation",
      body: "The Napa location works. Please confirm for March 20-22 and send the logistics doc.",
      status: "sent",
      confidence: 0.95,
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
    },
  ],

  history: [
    {
      id: "h-001",
      subject: "Re: Series A Close — Wire Instructions",
      body: "Wire instructions confirmed. Legal has reviewed and approved. Expecting funds by EOD Friday.",
      status: "sent",
      sent_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      created_at: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
    },
    {
      id: "h-002",
      subject: "Re: Product Launch Timeline",
      body: "Confirmed March 15 for public launch. Marketing assets are locked. Press embargo lifts at 9am ET.",
      status: "sent",
      sent_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 2.1).toISOString(),
    },
    {
      id: "h-003",
      subject: "Re: Board Observer Seat",
      body: "Happy to accommodate. I'll have our legal team draft the observer agreement this week.",
      status: "edited_and_sent",
      sent_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 5.5).toISOString(),
    },
    {
      id: "h-004",
      subject: "Re: Enterprise Pilot — Deloitte",
      body: "Pilot approved for 90 days. Let's cap it at 50 seats and measure activation weekly.",
      status: "sent",
      sent_at: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 8.2).toISOString(),
    },
    {
      id: "h-005",
      subject: "Re: Podcast Interview — 20VC",
      body: "Thursday at 2pm works. I'll prepare talking points around our GTM strategy and founding story.",
      status: "archived",
      sent_at: null,
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    },
    {
      id: "h-006",
      subject: "Re: AWS Credits Application",
      body: "Application submitted. Expecting approval within 5 business days for $100K in credits.",
      status: "sent",
      sent_at: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 26.5).toISOString(),
    },
  ],

  settings: {
    importance_threshold: 5,
    auto_draft: true,
    tone_strictness: 70,
    voice_profile: {
      greeting_style: "Hi,",
      closing_style: "Best,",
      formality_level: 7,
      avg_sentence_length: "medium",
      common_phrases: ["circle back", "let's lock this", "sounds good"],
      tone_descriptors: ["direct", "confident", "concise", "professional"],
      punctuation_style: "minimal",
      emoji_usage: "never",
    },
  },

  draftDetail: {
    id: "d-001",
    email_id: "e-001",
    thread_id: "t-001",
    subject: "Re: Q3 Board Deck — Final Review",
    body: "I've reviewed the updated deck. The revenue projections on slide 14 look accurate now. Let's lock this version and distribute to the board by Thursday EOD.\n\nI'll handle the follow-up with external counsel on the compliance footnote. Can you make sure the data room is updated with the final version before the call?\n\nBest,",
    status: "pending",
    confidence: 0.94,
  },
};

/* ── Network-level mock injection via page.route() ── */

async function setupMocks(page: Page) {
  // Block real Supabase domain connections (realtime WebSocket, auth, etc.)
  await page.route("https://opmxjutanslefvambmjy.supabase.co/**", (route) =>
    route.abort()
  );

  // Intercept all /api/ calls and return mock data
  await page.route("**/api/**", async (route) => {
    const url = route.request().url();
    const method = route.request().method();

    // POST endpoints
    if (method === "POST") {
      if (url.includes("/api/dev/seed")) {
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            user_id: "demo-user-001",
            access_token: "mock-token-for-screenshots",
          }),
        });
      }
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ok: true }),
      });
    }

    // GET /api/inbox/pending
    if (url.includes("/api/inbox/pending")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_DATA.pendingDrafts),
      });
    }

    // GET /api/drafts?status=sent (history page)
    if (url.includes("/api/drafts") && url.includes("status=sent")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_DATA.history),
      });
    }

    // GET /api/drafts/:id (single draft detail)
    if (/\/api\/drafts\/[^/?]+/.test(url) && !url.includes("/approve")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_DATA.draftDetail),
      });
    }

    // GET /api/drafts (drafts list)
    if (url.includes("/api/drafts")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_DATA.draftsList),
      });
    }

    // GET /api/settings
    if (url.includes("/api/settings")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_DATA.settings),
      });
    }

    // Default: return empty JSON
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({}),
    });
  });
}

async function setAuth(page: Page) {
  await page.goto("/login");
  await page.evaluate(() => {
    localStorage.setItem("chief_user_id", "demo-user-001");
    localStorage.setItem("chief_access_token", "mock-token-for-screenshots");
    localStorage.setItem("chief_referral_code", "CHIEF-X7K2");
  });
}

/* ── Tests ── */

test.describe("CHIEF Screenshot Capture", () => {
  test("1. Login page", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("img[alt='CHIEF']")).toBeVisible();
    await page.screenshot({
      path: path.join(OUTPUT_DIR, "login.png"),
    });
  });

  test("2. Inbox with swipe cards", async ({ page }) => {
    await setupMocks(page);
    await setAuth(page);
    await page.goto("/inbox");

    await expect(page.locator("h1", { hasText: "Inbox" })).toBeVisible();
    await expect(
      page.locator("[class*='cursor-grab']").first()
    ).toBeVisible();

    await page.screenshot({
      path: path.join(OUTPUT_DIR, "inbox.png"),
    });
  });

  test("3. Drafts list + detail", async ({ page }) => {
    await setupMocks(page);
    await setAuth(page);
    await page.goto("/drafts");

    const firstDraftLink = page.locator("a[href^='/drafts/']").first();
    await expect(firstDraftLink).toBeVisible();

    await page.screenshot({
      path: path.join(OUTPUT_DIR, "drafts.png"),
    });

    // Navigate to draft detail
    await firstDraftLink.click();
    await expect(page.locator("textarea").first()).toBeVisible();

    await page.screenshot({
      path: path.join(OUTPUT_DIR, "draft-detail.png"),
    });
  });

  test("4. Settings + Voice Calibration", async ({ page }) => {
    await setupMocks(page);
    await setAuth(page);
    await page.goto("/settings");

    await expect(page.locator("text=Tone Strictness")).toBeVisible();

    // Viewport screenshot only — fullPage:true causes the fixed bottom nav
    // to render mid-page, overlapping content
    await page.screenshot({
      path: path.join(OUTPUT_DIR, "settings.png"),
    });

    // Scroll to Voice Calibration for a focused screenshot
    await page.evaluate(() => {
      const sections = document.querySelectorAll("section");
      const voiceSection = Array.from(sections).find((s) =>
        s.textContent?.includes("Voice Calibration")
      );
      voiceSection?.scrollIntoView({ behavior: "instant", block: "start" });
    });
    await expect(page.locator("text=Voice Match")).toBeVisible();

    await page.screenshot({
      path: path.join(OUTPUT_DIR, "voice-calibration.png"),
    });
  });

  test("5. History", async ({ page }) => {
    await setupMocks(page);
    await setAuth(page);
    await page.goto("/history");

    await expect(
      page.locator("text=Re: Series A Close").first()
    ).toBeVisible();

    await page.screenshot({
      path: path.join(OUTPUT_DIR, "history.png"),
    });
  });

  test("6. Swipe flow video", async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      colorScheme: "dark",
      serviceWorkers: "block",
      recordVideo: {
        dir: OUTPUT_DIR,
        size: { width: 390, height: 844 },
      },
    });

    const page = await context.newPage();
    await setupMocks(page);
    await setAuth(page);
    await page.goto("/inbox");

    const card = page.locator("[class*='cursor-grab']").first();
    await expect(card).toBeVisible();

    const box = await card.boundingBox();
    if (box) {
      const centerX = box.x + box.width / 2;
      const centerY = box.y + box.height / 2;

      // Swipe left = approve
      await page.mouse.move(centerX, centerY);
      await page.mouse.down();
      for (let i = 1; i <= 30; i++) {
        await page.mouse.move(centerX - i * 7, centerY, { steps: 1 });
        await page.waitForTimeout(16); // ~60fps frame pacing for video
      }
      await page.mouse.up();

      // Wait for next card to appear after animation
      const nextCard = page.locator("[class*='cursor-grab']").first();
      await expect(nextCard).toBeVisible();

      const nextBox = await nextCard.boundingBox();
      if (nextBox) {
        const nx = nextBox.x + nextBox.width / 2;
        const ny = nextBox.y + nextBox.height / 2;

        // Swipe right = archive
        await page.mouse.move(nx, ny);
        await page.mouse.down();
        for (let i = 1; i <= 30; i++) {
          await page.mouse.move(nx + i * 7, ny, { steps: 1 });
          await page.waitForTimeout(16);
        }
        await page.mouse.up();

        // Wait briefly for final animation before closing
        await page
          .locator("[class*='cursor-grab']")
          .first()
          .waitFor({ state: "visible", timeout: 3000 })
          .catch(() => {});
      }
    }

    await context.close();
  });
});
