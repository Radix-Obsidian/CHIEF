# CHIEF — Launch Page Sequential Lovable Prompts

Paste these prompts into Lovable **one at a time**, in order. Wait for each to finish before pasting the next. Each prompt builds on the previous output.

---

## Prompt 0 — Project Setup & Design System

```
Create a single-page React + Tailwind CSS + Framer Motion landing page for CHIEF, an AI executive email proxy.

CRITICAL: Set up these design tokens FIRST as CSS custom properties on :root. Every component must use these — never hardcode colors.

:root {
  --background: #0F172A;
  --surface: #1E2937;
  --border: #334155;
  --text-primary: #F8FAFC;
  --text-secondary: #94A3B8;
  --text-muted: #64748B;
  --accent: #10B981;
  --accent-hover: #059669;
  --reject: #EF4444;
}

Import Satoshi font from Fontshare as the primary font:
@import url('https://api.fontshare.com/v2/css?f[]=satoshi@500,700&display=swap');
font-family: 'Satoshi', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;

Global styles:
- letter-spacing: 0.02em on all text
- -webkit-font-smoothing: antialiased
- scroll-behavior: smooth on html
- background-color: var(--background) on body
- color: var(--text-primary) on body

Type scale (use these consistently):
- Hero headline: 48px desktop / 32px mobile, weight 700, line-height 1.1
- Section heading (h2): 28px, weight 700, line-height 1.2
- Sub-heading (h3): 20px, weight 700, line-height 1.3
- Body: 17px, weight 500, line-height 1.5
- Caption: 13px, weight 500, line-height 1.4

Surface treatment:
- All cards: background var(--surface), border 1px solid var(--border), border-radius 12px
- All buttons and inputs: border-radius 12px
- Glassmorphism (for nav): background rgba(15, 23, 42, 0.8), backdrop-filter blur(24px)
- Card shadows: 0 4px 24px rgba(0, 0, 0, 0.3)
- Focus states: outline 2px solid var(--accent), outline-offset 2px

Spacing:
- Horizontal padding: px-6 mobile, px-8 tablet, max-w-6xl mx-auto desktop
- Section vertical spacing: py-24 mobile, py-32 desktop
- Element spacing within sections: space-y-6 to space-y-8

Responsive breakpoints:
- Mobile: < 640px, single column, px-6
- Tablet: 640-1024px, 2-col where applicable, px-8
- Desktop: > 1024px, 3-col grids, max-w-6xl mx-auto

Dark mode only. No light mode toggle. No serif fonts. No border-radius smaller than 12px. No stock photos.

For now, just create the page shell with:
1. An empty <header> for the sticky nav (we'll fill it in the next prompt)
2. An empty <main> with placeholder sections
3. An empty <footer>

Make sure the design tokens and font are working correctly before we add content.
```

---

## Prompt 1 — Sticky Nav + Hero Section

```
Now build out the sticky nav and hero section.

STICKY NAV:
- Position: sticky, top: 0, z-index: 50, height: 64px
- Background: glassmorphism — rgba(15, 23, 42, 0.8) with backdrop-filter: blur(24px)
- Border bottom: 1px solid var(--border)
- Left side: This SVG icon at 32px height + "CHIEF" text in Satoshi Bold 17px, tracking-widest, uppercase

CHIEF Icon SVG (paste this inline):
<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 1024 1024"><path fill="#476eb9" d="M361.594 470.034c-1.456-42.854 3.344-75.816 37.854-105.609a106.9 106.9 0 0 1 45.919-23.433c16.278-3.875 36.1-3.584 52.779-3.53l42.132.167c16.25.069 38.327-.567 53.908.56 19.283-.737 34.337 1.812 49.11 15.457 21.979 20.3 26.375 58.587 4.699 80.729-11.823 12.123-26.939 17.681-43.699 17.616-30.187-.001-60.435-.071-90.623-.069l-27.872-.027c-2.401-.008-11.139.054-13.002-.339-.556.37-1.508.954-1.972 1.372-7.125-1.335-22.408-.236-30.409-.378-18.972-.338-37.793-.824-56.733.924-4.611.426-8.225 1.031-12.231 3.453-5.211 3.15-7.06 10.097-9.86 13.107"/><path fill="#e33d3c" d="M594.186 338.189c19.283-.737 34.337 1.812 49.11 15.457 21.979 20.3 26.375 58.587 4.699 80.729-11.823 12.123-26.939 17.681-43.699 17.616-30.187-.001-60.435-.071-90.623-.069l-27.872-.027c-2.401-.008-11.139.054-13.002-.339 2.334-3.264 12.044-12.584 15.298-15.819l28.734-28.725 36.087-36.426c8.175-8.351 16.485-17.287 25.424-24.807 4.582-3.854 10.158-4.981 15.384-7.375z"/><path fill="#fdc612" d="M472.799 451.556c.637 3.826.35 12.803.32 17.016l-.242 29.893c-.198 23.153.541 49.901-.189 72.552l.285.623.023 62.116c-.001 5.469-.158 11.062.003 16.522.515 17.404-1.963 27.063 15.426 35.742-10.622.689-21.189.427-31.777-.629-47.228-4.709-85.213-40.429-93.162-87.146-1.57-9.227-2.604-18.775-1.535-28.124-.723-3.223-.414-27.882-.401-32.515l.044-67.572c2.8-3.01 4.649-9.957 9.86-13.107 4.006-2.422 7.62-3.027 12.231-3.453 18.94-1.748 37.761-1.262 56.733-.924 8.001.142 23.284-.957 30.409.378.464-.418 1.416-1.002 1.972-1.372"/><path fill="#2c4e9b" d="M361.594 470.034c2.8-3.01 4.649-9.957 9.86-13.107 4.006-2.422 7.62-3.027 12.231-3.453 18.94-1.748 37.761-1.262 56.733-.924 8.001.142 23.284-.957 30.409.378a5081 5081 0 0 0-64.774 64.141c-12.646 12.595-26.648 25.62-37.556 39.765-2.959 3.838-4.501 9.088-6.546 13.287-.723-3.223-.414-27.882-.401-32.515z"/><path fill="#19d688" d="m472.688 571.017 88.418-.487c17.166-.023 44.223-1.485 60.56 2.714 41.931 10.775 53.595 66.677 22.566 95.663-15.487 14.843-30.073 16.08-50.417 16.8-7.089.471-14.867.405-22.016.301-27.714-.403-55.686.536-83.374.012-17.389-8.679-14.911-18.338-15.426-35.742-.161-5.46-.004-11.053-.003-16.522z"/><path fill="#12a86c" d="M472.973 571.64c2.941 1.842 16.971 17.225 20.618 20.83l49.694 49.842c8.65 8.662 39.844 42.383 50.53 43.395-7.089.471-14.867.405-22.016.301-27.714-.403-55.686.536-83.374.012-17.389-8.679-14.911-18.338-15.426-35.742-.161-5.46-.004-11.053-.003-16.522z"/></svg>

- Right side: "Get Early Access" button — ghost style, border 1px solid var(--border), text var(--text-primary), 13px font, 700 weight, uppercase tracking-widest, 12px radius, px-5 py-2. On hover: border-color var(--accent), text var(--accent). Clicking smooth-scrolls to the hero email input.

HERO SECTION:
Two columns on desktop (60% text / 40% mockup). Single column stacked on mobile.

Left column:
1. Badge pill above headline:
   Text: "LIMITED EARLY ACCESS"
   Style: 13px, uppercase, tracking-widest, color var(--accent), background rgba(16, 185, 129, 0.1), rounded-full, px-4 py-1.5

2. Headline (h1):
   "Your email. Handled."
   48px desktop, 32px mobile, weight 700, line-height 1.1, color var(--text-primary)

3. Subheadline:
   "CHIEF reads your inbox, drafts replies in your exact voice, and waits for your approval. Nothing sends without your swipe."
   17px, weight 500, color var(--text-secondary), max-width 480px, line-height 1.5

4. Waitlist form (flex row on desktop, stacked on mobile):
   - Email input: placeholder "your@company.com", height 48px, bg var(--surface), border 1px solid var(--border), 12px radius, 15px font, focus:border-color var(--accent) focus:ring-1 ring-var(--accent)
   - Button: "Request Access", height 48px, bg var(--accent), white text, 15px, 700 weight, 12px radius, px-6. Hover: brightness 110%. Active: scale 0.98.
   - Subtitle below: "Join 200+ founders on the waitlist. No spam." — 13px, var(--text-muted)

Right column — CSS PHONE MOCKUP (this is critical, build it with pure CSS/HTML, not an image):
- Outer frame: rounded-[40px], border 2px solid var(--border), bg var(--surface), p-3, shadow-2xl shadow-black/40
- Width: 280px mobile, 300px desktop
- Notch: centered 96px wide, 20px tall, rounded-full, bg var(--background), mb-4
- Screen area: rounded-[28px], bg var(--background), px-3 pt-4, height 420px, overflow hidden
- Status bar inside screen: flex justify-between, "CHIEF" left in 9px uppercase bold tracking-widest var(--text-muted), "3 pending" right in 9px var(--text-muted)
- Card stack (3 cards overlapping):
  Card 1 (top, z-30): rotate -2deg, scale 1, y 0
    - bg var(--surface), border 1px solid var(--border), rounded-xl, p-4, shadow-lg shadow-black/20
    - Top row: "ACME.CO" left in 10px uppercase tracking-widest var(--text-muted), "8.4" right in orange pill (text-orange-400, bg-orange-400/10, rounded-full px-2 py-0.5 10px bold)
    - Subject: "Re: Series B term sheet — revised timeline" in 13px medium var(--text-primary)
    - Preview: "Thanks for the quick turnaround. I've reviewed the updated terms and..." in 11px var(--text-secondary), line-clamp-2
    - Pulsing overlays on this card only:
      Left: "SEND" in 10px bold tracking-widest uppercase var(--accent), opacity animating between 0.15 and 0.3, 3s infinite ease-in-out
      Right: "ARCHIVE" in 10px bold tracking-widest uppercase var(--reject), same animation but 1.5s delay
  Card 2 (z-20): rotate 1deg, scale 0.95, translateY 12px
    - "STRIPE.COM" / "7.1" yellow pill / "Q3 board deck — comments inline"
  Card 3 (z-10): rotate 0, scale 0.9, translateY 24px
    - "SEQUOIA.COM" / "9.2" red pill / "Follow-up: partnership proposal"

- Emerald glow behind phone: absolute -inset-12, rounded-full, bg var(--accent) at 8% opacity, blur-3xl

ANIMATIONS (Framer Motion):
- Headline: fade up from y:20, duration 0.6s, stagger words by 150ms
- Subheadline: fade up, 0.4s delay after headline
- Form: fade up, 0.3s after subheadline
- Phone mockup: spring animation (damping 25, stiffness 120, delay 0.6), from y:40 and opacity 0
- Cards inside phone: spring entrance (damping 20, stiffness 100), staggered by 150ms starting at 0.8s delay
- Top card: continuous gentle float — translateY oscillating 0 to -3px, 3s, ease-in-out, infinite
- Home indicator bar at bottom of phone: 112px wide, 4px tall, rounded-full, bg var(--text-muted) at 30% opacity

The phone mockup must look like a real phone with real app content inside — NOT a static image or illustration. Build every element with HTML/CSS.
```

---

## Prompt 2 — Pain Points Section

```
Add the Pain Points section below the hero. This section leads with the buyer's problems.

Section background: var(--background) (same as page)
Section padding: py-24 mobile, py-32 desktop

Section headline (h2, centered):
"You didn't build a company to answer email."
28px, weight 700, color var(--text-primary), margin-bottom space-y-4

Three cards in a responsive grid: 1 column mobile, 3 columns desktop (gap-6).
Each card: bg var(--surface), border 1px solid var(--border), border-radius 12px, padding p-8.
Add subtle glassmorphism to each card: a very faint rgba(16, 185, 129, 0.03) background overlay or a slight inner glow to differentiate from flat surfaces.

Card 1:
- Icon: Lucide Clock icon, 24px, color var(--accent)
- Title (h3, 20px, 700): "120 emails a day. 3 hours gone."
- Body (17px, 500, var(--text-secondary)): "The average executive loses 28% of their workday to email. That's a thousand hours a year not spent on the decisions only you can make."

Card 2:
- Icon: Lucide Brain icon, 24px, color var(--accent)
- Title: "Context switching kills your best thinking."
- Body: "Every reply you stop to write costs 23 minutes of refocus time. By the third interruption, the deep work is done for the day."

Card 3:
- Icon: Lucide MessageSquare icon, 24px, color var(--accent)
- Title: "Rushed replies don't sound like you."
- Body: "Quick responses lose your tone. Recipients notice. When a founder's email reads like a chatbot wrote it, trust erodes."

Spacing within each card: icon at top, 16px gap to title, 8px gap to body.

ANIMATION (Framer Motion):
- Section headline: fade up from y:20, opacity 0 to 1, duration 0.6s, whileInView, viewport once true amount 0.3
- Cards: stagger in from bottom (y:30 to y:0), opacity 0 to 1, 150ms delay between each card
- Use whileInView with viewport={{ once: true, amount: 0.3 }}
- Transition: duration 0.5, ease "easeOut"

No exclamation marks. No "revolutionary" or "game-changing" language. The copy is declarative and specific.
```

---

## Prompt 3 — How It Works Section

```
Add the "How It Works" section below Pain Points. This section de-risks the decision by showing simplicity.

Section background: var(--surface) — slightly elevated from page background to create visual separation
Section padding: py-24 mobile, py-32 desktop

Section headline (h2, centered):
"Three steps. Two minutes. Done."
28px, weight 700, var(--text-primary)

Three steps displayed horizontally on desktop with connecting lines between them, vertically on mobile.

On desktop: the three steps are in a row with a thin dashed line (1px, var(--border)) connecting them horizontally, passing through the step icons.

Step 1:
- Step number: "01" in 13px bold var(--accent), uppercase
- Icon: Lucide Mail icon in a 48px circle — the circle has bg rgba(16, 185, 129, 0.1), the icon is 24px var(--accent)
- Title (h3, 20px, 700, var(--text-primary)): "Connect Gmail"
- Body (17px, 500, var(--text-secondary), max-width 280px, centered): "One OAuth click. CHIEF scans your last 50 sent emails to learn exactly how you write. Your greeting, your sign-off, your sentence rhythm."

Step 2:
- Number: "02"
- Icon: Lucide Sparkles icon in circle
- Title: "AI drafts in your voice"
- Body: "Incoming emails get scored for importance. The ones that matter get a draft reply that mirrors your exact tone and vocabulary. Powered by Claude Sonnet 4."

Step 3:
- Number: "03"
- Icon: Lucide ArrowLeftRight icon in circle
- Title: "Swipe to send"
- Body: "Swipe left to approve. Swipe right to archive. Edit inline if you want. Every email requires your explicit approval before it leaves your outbox."

Layout on desktop: items-start, text-center for each step, gap-12 between steps.
Layout on mobile: items-center, text-center, space-y-12 between steps, connecting line runs vertically.

ANIMATION (Framer Motion):
- Section headline: fade up, duration 0.6s
- Steps: stagger in from left-to-right on desktop (x:-20 to x:0), top-to-bottom on mobile (y:20 to y:0), 200ms stagger
- Connecting line: animate width from 0 to 100% on desktop, height from 0 to 100% on mobile, duration 1.2s, easeOut, triggered by whileInView
- Icon circles: scale from 0 to 1 with a spring (damping 15, stiffness 200), staggered 200ms
- All animations: whileInView, viewport once true amount 0.2
```

---

## Prompt 4 — Voice Match Section

```
Add the Voice Match section below How It Works. This is CHIEF's key differentiator — show, don't tell.

Section background: var(--background)
Section padding: py-24 mobile, py-32 desktop

Section headline (h2, centered):
"It doesn't reply for you. It replies like you."
28px, weight 700, var(--text-primary)

Section subheadline (centered, 17px, 500, var(--text-secondary), max-width 560px, mx-auto):
"CHIEF analyzes your greeting style, closing phrases, sentence length, vocabulary, and tone from your last 50 sent emails. Then it matches them."

VOICE MATCH METRIC (centered, above the cards):
- Large number: "94%" in 48px bold var(--text-primary), tabular-nums
- Label below: "Voice Match" in 13px var(--text-muted)
- Progress bar below label: 192px wide, 6px tall, rounded-full
  - Track: bg var(--border)
  - Fill: bg var(--accent), animates from width 0 to 94% over 1.2s easeOut, triggered by whileInView, 0.3s delay

THREE COMPARISON CARDS in a 3-col grid (1-col mobile), gap-4:

Each card: bg var(--surface), border 1px solid var(--border), 12px radius, p-5

Card 1 — "Opening":
- Label: "OPENING" in 11px uppercase tracking-widest 500 var(--text-muted)
- "Your email" sub-label in 10px uppercase tracking-widest var(--text-muted) at 50% opacity, mt-4
- Text: "Hi David, I wanted to follow up on the Q3 report you sent over." in 13px var(--text-secondary), leading-relaxed
- Divider: border-t border var(--border), pt-4, mt-4
- "Chief draft" sub-label in 10px uppercase tracking-widest var(--text-muted) at 50% opacity
- Same text but with these phrases highlighted in var(--accent) color with font-medium: "Hi David,", "I wanted to follow up", "Q3 report", "sent over"
- The highlights should animate: initially render in var(--text-secondary), then transition to var(--accent) with a 0.4s duration, staggered by 100ms per phrase, triggered 0.3s after the card appears in viewport

Card 2 — "Body":
- Your email: "Thanks for the quick turnaround. Let me review the numbers and circle back by EOD."
- Chief draft: same text, highlights on "Thanks for the quick turnaround", "review the numbers", "circle back", "EOD"

Card 3 — "Sign-off":
- Your email: "Best, Sarah"
- Chief draft: "Best, Sarah" — highlight all of it

TONE STRICTNESS SLIDER (below cards, centered, max-width 448px, mx-auto):
- Label: "Tone Strictness" in 13px 500 var(--text-secondary), centered
- Slider row (mt-3, flex items-center gap-3):
  - Left label: "Flexible" in 12px var(--text-muted)
  - Track: flex-1, h-1.5, rounded-full, bg var(--border), position relative
    - Fill: h-full rounded-full bg var(--accent), animate width from 0 to 75%, 1s easeOut, delay 0.5s, whileInView
    - Thumb: absolute, top 50%, left at 75% (animated), -translate-x-1/2 -translate-y-1/2, h-4 w-4, rounded-full, border-2 border var(--background), bg var(--accent), shadow-md with var(--accent) at 30% opacity
  - Right label: "Exact Match" in 12px var(--text-muted)
- Caption below (mt-3, 13px, var(--text-muted), centered):
  "Control how closely CHIEF mirrors your writing style. From natural paraphrase to word-for-word precision."

ANIMATION:
- Comparison cards: fade in from y:16, opacity 0, stagger 150ms, whileInView viewport once
- Voice match number: fade in from opacity 0
- Progress bar and slider fill: width animations as described above
- Highlight phrases: color transition from var(--text-secondary) to var(--accent), 0.4s, staggered 100ms per phrase, delay 0.3s after card enters viewport
```

---

## Prompt 5 — Trust & Security + Cross-Device Sync

```
Add two sections below Voice Match: Trust & Security, then Cross-Device Sync.

--- TRUST & SECURITY ---

Section background: var(--surface) — elevated
Section padding: py-24 mobile, py-32 desktop

Section headline (h2, centered):
"Your email stays your email."
28px, weight 700, var(--text-primary)

Three pillars in a 3-col grid (1-col mobile), gap-8. Each pillar: text-center.

Pillar 1:
- Icon container: 56px circle, bg rgba(16, 185, 129, 0.1), centered, flex items-center justify-center
- Icon: Lucide ShieldCheck, 28px, var(--accent)
- Title (h3, 20px, 700, var(--text-primary), mt-5): "PII stripped before processing"
- Body (17px, 500, var(--text-secondary), mt-3): "Names, addresses, and phone numbers are removed before any AI model sees your email content. The raw text is never stored."

Pillar 2:
- Icon: Lucide Hand (or Ban), 28px
- Title: "Zero auto-send. Period."
- Body: "Every reply requires your explicit swipe approval. If you don't act, nothing goes out. No exceptions. No overrides. No 'smart send.'"

Pillar 3:
- Icon: Lucide Lock, 28px
- Title: "Enterprise-grade encryption"
- Body: "OAuth tokens stored in Supabase Vault. Row-level security on every table. Per-user isolation across every layer of the stack."

ANIMATION: Pillars fade up from y:20, stagger 150ms, whileInView viewport once amount 0.3.

--- CROSS-DEVICE SYNC ---

Section background: var(--background)
Section padding: py-24 mobile, py-32 desktop

Section headline (h2, centered):
"One account. Every device. Always in sync."
28px, weight 700, var(--text-primary)

Section body (centered, 17px, 500, var(--text-secondary), max-width 520px, mx-auto):
"Start reviewing drafts on the train. Finish at your desk. Your voice profile, pending approvals, and full history follow you everywhere."

DEVICE VISUAL (centered, mt-12):
Three device silhouettes in a row: phone (small), laptop (large, center), tablet (medium).
Build them as CSS shapes:
- Phone: 60px wide, 100px tall, rounded-2xl, border 2px solid var(--border), bg var(--surface)
- Laptop: 200px wide, 130px tall, rounded-xl on top, with a 220px wide base/stand, border 2px solid var(--border), bg var(--surface)
- Tablet: 100px wide, 130px tall, rounded-2xl, border 2px solid var(--border), bg var(--surface)

Inside each device, show 3 tiny colored rectangles representing email cards:
- Top card: var(--accent) at 30% opacity
- Other cards: var(--border)
This creates a visual echo of the app's inbox across devices.

Connect devices with dotted lines (border-dashed, 1px, var(--border)) at their vertical centers.

Three sync features below the visual (flex row on desktop, stacked on mobile, gap-8, centered, mt-8):
- Lucide Mic icon + "Voice profile syncs instantly" — 13px var(--text-secondary)
- Lucide RefreshCw icon + "Drafts update in real-time" — 13px var(--text-secondary)
- Lucide History icon + "Full history on every device" — 13px var(--text-secondary)
Each: icon 16px var(--accent), inline-flex items-center gap-2

ANIMATION: Devices fade in with scale 0.9 to 1, staggered. Dotted lines animate width/opacity after devices appear. Feature items stagger in.
```

---

## Prompt 6 — Early Access CTA + Footer

```
Add the final two sections: Early Access CTA, then Footer.

--- EARLY ACCESS CTA ---

Section background: var(--surface)
Section border-top and border-bottom: 1px solid var(--border)
Section padding: py-24 mobile, py-32 desktop

Center everything.

Scarcity badge (centered):
"EARLY ACCESS — LIMITED SPOTS"
13px, uppercase, tracking-widest, color var(--accent), bg rgba(16, 185, 129, 0.1), rounded-full, px-4 py-1.5

Headline (h2, centered, mt-6):
"Start in two minutes."
28px, weight 700, var(--text-primary)

Subheadline (centered, 17px, 500, var(--text-secondary), mt-4, max-width 480px, mx-auto):
"Connect Gmail. Let CHIEF learn your voice. Review AI-drafted replies with a swipe. Install on any device."

Waitlist form (centered, mt-8, max-width 480px, mx-auto):
Same design as the hero form — email input + "Request Access" button, flex row on desktop, stacked on mobile.
Below form: "We're onboarding founders in small batches. You'll hear from us within 48 hours." — 13px var(--text-muted), mt-3

Both the hero form and this form should share the same component. When submitted:
1. Validate email with regex /^[^\s@]+@[^\s@]+\.[^\s@]+$/
2. Set state to "submitting" (show a spinner in the button)
3. Simulate submission with a 800ms timeout
4. Show success state: replace the form with a checkmark icon in a 40px circle (bg var(--accent) at 20%, icon var(--accent)) + "You're on the list." in 15px bold + "We'll reach out within 48 hours." in 13px var(--text-muted)
5. Use AnimatePresence for the transition between form and success state

PWA INSTALL PREVIEW (below form, mt-16, centered):
Heading (h3, 20px, 700, var(--text-primary), centered):
"How you'll install CHIEF"

Three platform cards in a 3-col grid (1-col mobile), gap-4, mt-6:

Each card: bg var(--background), border 1px solid var(--border), 12px radius, p-5, text-center

iOS card:
- Lucide Smartphone icon, 24px, var(--accent)
- "iPhone & iPad" — 17px 700 var(--text-primary), mt-3
- Steps (13px var(--text-secondary), mt-3, space-y-2):
  "1. Open CHIEF in Safari"
  "2. Tap the Share button"
  "3. Tap 'Add to Home Screen'"

Android card:
- Lucide Smartphone icon (or Chrome-like icon), 24px, var(--accent)
- "Android" — 17px 700
- Steps:
  "1. Open CHIEF in Chrome"
  "2. Tap 'Install app' when prompted"
  "3. CHIEF appears on your home screen"

Desktop card:
- Lucide Monitor icon, 24px, var(--accent)
- "Mac & PC" — 17px 700
- Steps:
  "1. Open CHIEF in Chrome or Edge"
  "2. Click the install icon in the address bar"
  "3. CHIEF runs as a standalone app"

--- FOOTER ---

Background: var(--background)
Padding: py-16
Centered, single column.

- CHIEF icon SVG (24px height) + "CHIEF" text (15px, 700, tracking-widest, uppercase, var(--text-muted))
- Links row (mt-4): "Privacy" · "Terms" · "GitHub" — 17px var(--text-muted), hover var(--text-secondary), separated by interpuncts (·)
- "Built with Claude Sonnet 4" — 13px var(--text-muted), mt-4
- "© 2026 CHIEF" — 13px var(--text-muted), mt-2

ANIMATION:
- CTA section: fade up on scroll
- Platform cards: stagger in, 150ms delay each
- Footer: simple fade in
```

---

## Copy Rules (reference for all prompts)

These rules apply across all sections. If Lovable's AI tries to rewrite copy, enforce these:

**Win Without Pitching Manifesto:**
- Declarative statements. No hedging ("might", "could", "try", "help")
- Specificity = credibility (exact numbers, concrete details)
- Create scarcity — "limited early access", "small batches"
- Short, powerful statements over long explanations

**Customer Centric Sales:**
- Lead with pain, not features
- Make the reader see themselves in the problem
- Remove friction from signup
- Respect the reader's intelligence

**Banned words/phrases:**
- "Revolutionary", "game-changing", "cutting-edge", "next-generation"
- "We believe", "We think", "We hope"
- "Try it today", "Sign up now", "Don't miss out"
- "AI-powered" (show the AI, don't label it)
- Zero exclamation marks on the entire page

**What NOT to build:**
- No light mode
- No hamburger menu
- No testimonials (no users yet)
- No pricing
- No feature comparison
- No video embeds
- No cookie banner
- No chatbot widget
- No stock photos — all visuals are CSS/SVG
- No serif fonts
- No gradients on text
- No border-radius smaller than 12px
