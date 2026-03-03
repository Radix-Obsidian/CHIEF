# CHIEF — Launch Page (Lovable Context Prompt)

Build a single-page launch/landing site for **CHIEF**, an AI executive email proxy. The page converts busy founders and C-level executives into early access waitlist signups. Dark mode only. Mobile-first. Apple HIG design principles. React + Tailwind CSS + Framer Motion.

---

## Design System

Use these exact tokens. Do not deviate.

### Colors (dark mode — the only mode)

```css
--background: #0F172A;       /* page background */
--surface: #1E2937;          /* cards, elevated sections */
--border: #334155;           /* borders, dividers */
--text-primary: #F8FAFC;     /* headings, primary text */
--text-secondary: #94A3B8;   /* body text, descriptions */
--text-muted: #64748B;       /* captions, labels */
--accent: #10B981;           /* emerald — CTAs, highlights, success */
--accent-hover: #059669;     /* emerald darker — button hover */
--reject: #EF4444;           /* red — used sparingly for contrast */
```

### Typography

Import Satoshi from Fontshare. Fallback to Inter, then system sans-serif.

```css
@import url('https://api.fontshare.com/v2/css?f[]=satoshi@500,700&display=swap');

font-family: 'Satoshi', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
```

Type scale (Apple HIG inspired):

| Token | Size | Weight | Line-height | Use |
|-------|------|--------|-------------|-----|
| hero-headline | 48px desktop / 32px mobile | 700 | 1.1 | Main headline only |
| title1 | 28px | 700 | 1.2 | Section headings |
| title2 | 20px | 700 | 1.3 | Sub-headings |
| body | 17px | 500 | 1.5 | Body copy |
| caption | 13px | 500 | 1.4 | Labels, badges |

Global: `letter-spacing: 0.02em`, `-webkit-font-smoothing: antialiased`.

### Surfaces & Effects

- Border radius: `12px` on all cards, buttons, inputs
- Card style: `background: #1E2937; border: 1px solid #334155;`
- Glassmorphism on sticky nav: `background: rgba(15, 23, 42, 0.8); backdrop-filter: blur(24px);`
- Subtle glow behind hero mockup: radial gradient of `#10B981` at 15% opacity, 400px radius, blurred
- Shadows: `0 4px 24px rgba(0, 0, 0, 0.3)` on elevated cards
- Focus-visible: `outline: 2px solid #10B981; outline-offset: 2px;`

### Spacing

- Horizontal padding: `px-6` mobile, `px-8` tablet, centered `max-w-6xl` desktop
- Section vertical spacing: `py-24` mobile, `py-32` desktop
- Between elements within sections: `space-y-6` to `space-y-8`

---

## Page Structure

Build these sections in this exact order. Use semantic HTML: `<header>`, `<main>`, `<section>`, `<footer>`. Single `<h1>` in the hero. `<h2>` for each section. Smooth scroll with `scroll-behavior: smooth`.

---

### Section 1: Sticky Nav

A minimal sticky top bar.

**Structure:**
- Left: CHIEF logo (the icon SVG below, 32px height) + "CHIEF" wordmark in Satoshi Bold 17px
- Right: "Get Early Access" ghost button (border only, `border-color: #334155`, text `#F8FAFC`) that smooth-scrolls to the hero email input

**Style:** Glassmorphism bar. `position: sticky; top: 0; z-index: 50;` Height: 64px. Padding: `px-6`.

---

### Section 2: Hero

The first thing visitors see. Must hook in 3 seconds.

**Layout:** Two columns on desktop (text left, phone mockup right). Single column stacked on mobile (text, then mockup below).

**Left column content:**

Badge above headline:
```
LIMITED EARLY ACCESS
```
Style: `caption` size, `#10B981` text, `#10B981/10%` background pill, uppercase tracking-widest.

Headline (`<h1>`, hero-headline size):
```
Your email. Handled.
```

Subheadline (body size, `--text-secondary` color, max-width 480px):
```
CHIEF reads your inbox, drafts replies in your exact voice, and waits for your approval. Nothing sends without your swipe.
```

Waitlist form (inline, horizontal on desktop, stacked on mobile):
- Email input: placeholder "your@company.com", `--surface` background, `--border` border, 12px radius, 48px height
- Submit button: "Request Access", `--accent` background, white text, 700 weight, 12px radius, 48px height
- Below form: `caption` size text in `--text-muted`: "Join 200+ founders on the waitlist. No spam."

**Right column content:**

A CSS phone mockup frame (rounded rectangle with 40px radius, `--surface` background, `--border` border, 2px width, aspect ratio ~9:19.5) containing a visual representation of the CHIEF inbox:

Inside the phone frame, render a mock swipe card stack:
- Card 1 (top, slightly rotated -2deg): Shows domain "acme.co" top-left in `caption` uppercase, importance badge "8.4" top-right in orange pill, subject "Re: Series B term sheet — revised timeline" in body weight, 2-line preview "Thanks for the quick turnaround. I've reviewed the updated terms and..." in `--text-secondary`
- Card 2 (behind, slightly smaller scale 0.95, offset down 8px): Partially visible, different subject
- Card 3 (behind card 2, scale 0.9, offset down 16px): Barely visible edge

On the top card, show two ghosted overlay labels:
- Left side: "SEND" in `--accent` color, 30% opacity
- Right side: "ARCHIVE" in `--reject` color, 30% opacity

This communicates the swipe mechanic visually without any explanation needed.

**Animation:**
- Headline: fade up from 20px below, 0.6s ease-out, staggered by word (150ms delay per word)
- Subheadline: fade up 0.4s after headline completes
- Form: fade up 0.3s after subheadline
- Phone mockup: slide in from right (desktop) or from bottom (mobile), spring animation (damping: 25, stiffness: 120)
- Top card in mockup: gentle continuous floating animation (translateY oscillating 3px, 3s duration, ease-in-out, infinite)

---

### Section 3: Pain Points

Lead with the buyer's problems. Make them feel seen, not sold to.

**Section headline** (`<h2>`, title1 size):
```
You didn't build a company to answer email.
```

**Three cards** in a responsive grid: 1-col mobile, 3-col desktop. Each card uses `--surface` bg, `--border` border, 12px radius, `p-8`.

**Card 1:**
- Icon: Clock icon (Lucide `Clock`), 24px, `--accent` color
- Title (title2): `120 emails a day. 3 hours gone.`
- Body (body size, `--text-secondary`): `The average executive loses 28% of their workday to email. That's a thousand hours a year not spent on the decisions only you can make.`

**Card 2:**
- Icon: Lucide `Zap` or `Brain`, 24px, `--accent` color
- Title (title2): `Context switching kills your best thinking.`
- Body: `Every reply you stop to write costs 23 minutes of refocus time. By the third interruption, the deep work is done for the day.`

**Card 3:**
- Icon: Lucide `MessageSquare`, 24px, `--accent` color
- Title (title2): `Rushed replies don't sound like you.`
- Body: `Quick responses lose your tone. Recipients notice. When a founder's email reads like a chatbot wrote it, trust erodes.`

**Animation:** Cards stagger in from bottom, 150ms delay between each. `whileInView`, `viewport={{ once: true, amount: 0.3 }}`.

---

### Section 4: How It Works

De-risk the decision. Show simplicity.

**Section headline** (`<h2>`, title1):
```
Three steps. Two minutes. Done.
```

**Three steps** in a horizontal flow (desktop) or vertical stack (mobile). Connect steps with a thin line or subtle arrow in `--border` color.

**Step 1:**
- Number: "01" in `--accent`, caption size, bold
- Icon: Lucide `Mail` in a 48px circle with `--accent/10%` background
- Title (title2): `Connect Gmail`
- Body (body, `--text-secondary`): `One OAuth click. CHIEF scans your last 50 sent emails to learn exactly how you write. Your greeting, your sign-off, your sentence rhythm.`

**Step 2:**
- Number: "02"
- Icon: Lucide `Sparkles` in circle
- Title: `AI drafts in your voice`
- Body: `Incoming emails get scored for importance. The ones that matter get a draft reply that mirrors your exact tone and vocabulary. Powered by Claude Sonnet 4.`

**Step 3:**
- Number: "03"
- Icon: Lucide `ArrowLeftRight` in circle
- Title: `Swipe to send`
- Body: `Swipe left to approve. Swipe right to archive. Edit inline if you want. Every email requires your explicit approval before it leaves your outbox.`

**Animation:** Steps reveal sequentially left-to-right on desktop (with connecting line animating between them), top-to-bottom on mobile. 200ms stagger.

---

### Section 5: Voice Match

This is CHIEF's key differentiator. Show, don't tell.

**Section headline** (`<h2>`, title1):
```
It doesn't reply for you. It replies like you.
```

**Section subheadline** (body, `--text-secondary`, max-width 560px, centered):
```
CHIEF analyzes your greeting style, closing phrases, sentence length, vocabulary, and tone from your last 50 sent emails. Then it matches them.
```

**Visual: Voice comparison cards**

Render three cards in a 3-col grid (1-col mobile) simulating the voice calibration feature. Each card: `--surface` bg, `--border` border, 12px radius, `p-5`.

**Card 1 — "Opening":**
- Label: "OPENING" in caption, uppercase, tracking-widest, `--text-muted`
- "Your email" sub-label in 10px uppercase `--text-muted/60%`:
  `Hi David, I wanted to follow up on the Q3 report you sent over.`
- Divider line (`--border`)
- "CHIEF draft" sub-label:
  `Hi David, I wanted to follow up on the Q3 report you sent over.`
- Highlight matched phrases in `--accent` color: "Hi David,", "I wanted to follow up", "Q3 report", "sent over"

**Card 2 — "Body":**
- Your email: `Thanks for the quick turnaround. Let me review the numbers and circle back by EOD.`
- CHIEF draft: `Thanks for the quick turnaround. Let me review the numbers and circle back by EOD.`
- Highlights: "Thanks for the quick turnaround", "review the numbers", "circle back", "EOD"

**Card 3 — "Sign-off":**
- Your email: `Best, Sarah`
- CHIEF draft: `Best, Sarah`
- Highlight all of "Best, Sarah"

**Below the cards**, show a mock slider labeled "Tone Strictness":
- Left label: "Flexible"
- Right label: "Exact Match"
- Slider track with emerald fill at ~75%
- Caption below: `Control how closely CHIEF mirrors your writing style. From natural paraphrase to word-for-word precision.`

**Voice Match metric** (above or beside the cards):
- Large number: "94%" in 48px bold `--text-primary`
- Label: "Voice Match" in caption `--text-muted`
- Emerald progress bar below at 94% fill

**Animation:** Cards fade in with stagger. The emerald highlight spans animate from 0 to 1 opacity with a 0.3s delay after the card appears, as if the AI is "finding" the matches. The progress bar animates from 0 to 94% width.

---

### Section 6: Trust & Security

Overcome the final objection: "Is this safe?"

**Section headline** (`<h2>`, title1):
```
Your email stays your email.
```

**Three pillars** in a 3-col grid (1-col mobile). Each pillar: centered text, icon in a 56px `--accent/10%` circle at top.

**Pillar 1:**
- Icon: Lucide `ShieldCheck`, `--accent` color
- Title (title2): `PII stripped before processing`
- Body (body, `--text-secondary`): `Names, addresses, and phone numbers are removed before any AI model sees your email content. The raw text is never stored.`

**Pillar 2:**
- Icon: Lucide `Hand` (stop gesture) or `Ban`, `--accent` color
- Title: `Zero auto-send. Period.`
- Body: `Every reply requires your explicit swipe approval. If you don't act, nothing goes out. No exceptions. No overrides. No "smart send."

**Pillar 3:**
- Icon: Lucide `Lock`, `--accent` color
- Title: `Enterprise-grade encryption`
- Body: `OAuth tokens stored in Supabase Vault. Row-level security on every table. Per-user isolation across every layer of the stack.`

**Animation:** Pillars fade up with stagger, `whileInView`.

---

### Section 7: Cross-Device Sync

Expand the value beyond a single device.

**Section headline** (`<h2>`, title1):
```
One account. Every device. Always in sync.
```

**Section body** (body, `--text-secondary`, centered, max-width 520px):
```
Start reviewing drafts on the train. Finish at your desk. Your voice profile, pending approvals, and full history follow you everywhere.
```

**Visual:** Three device silhouettes (phone, laptop, tablet) in a row, all showing the same simplified inbox UI (just colored rectangles representing cards). Connect them with dotted lines or a subtle glow to suggest sync. Use `--surface` for device frames, `--accent/30%` for the "active card" on each screen.

**Three sync features** below the visual, in a horizontal row:

- "Voice profile syncs instantly" with a Lucide `Mic` icon
- "Drafts update in real-time" with a Lucide `RefreshCw` icon
- "Full history on every device" with a Lucide `History` icon

Each: icon + text, inline, `--text-secondary`, caption size.

---

### Section 8: Early Access CTA

The final conversion push. Repeat the waitlist form.

**Background:** Full-width section with `--surface` background and a subtle top/bottom border in `--border`.

**Scarcity badge** (centered, above headline):
```
EARLY ACCESS — LIMITED SPOTS
```
Style: same as hero badge. `--accent` text, pill background.

**Headline** (title1, centered):
```
Start in two minutes.
```

**Subheadline** (body, `--text-secondary`, centered):
```
Connect Gmail. Let CHIEF learn your voice. Review AI-drafted replies with a swipe. Install on any device.
```

**Waitlist form** (centered, same design as hero):
- Email input + "Request Access" button
- Below: "We're onboarding founders in small batches. You'll hear from us within 48 hours."

**Below the form**, show a compact PWA install preview:

**"How you'll install CHIEF"** (title2, centered)

Three platform cards in a row (1-col mobile):

**iOS card:**
- Apple icon
- "iPhone & iPad"
- Step 1: "Open CHIEF in Safari"
- Step 2: "Tap the Share button"
- Step 3: "Tap 'Add to Home Screen'"
- Mini visual: a simplified iOS share sheet icon

**Android card:**
- Android icon (or Chrome icon)
- "Android"
- Step 1: "Open CHIEF in Chrome"
- Step 2: "Tap 'Install app' when prompted"
- Step 3: "CHIEF appears on your home screen"

**Desktop card:**
- Monitor icon
- "Mac & PC"
- Step 1: "Open CHIEF in Chrome or Edge"
- Step 2: "Click the install icon in the address bar"
- Step 3: "CHIEF runs as a standalone app"

Each card: `--surface` bg nested inside the `--background` full-width section (so use a slightly lighter surface or add a subtle border to differentiate). 12px radius, p-5.

---

### Section 9: Footer

Minimal. No clutter.

**Layout:** Centered, single column.

- CHIEF logo + wordmark (smaller, 24px icon + 15px text)
- One line of links: `Privacy` · `Terms` · `GitHub` — in `--text-muted`, body size, with `--text-secondary` on hover
- "Built with Claude Sonnet 4" in caption, `--text-muted`
- `© 2026 CHIEF` in caption, `--text-muted`

Padding: `py-16`.

---

## Animations (Global)

Use Framer Motion for all animations. Wrap each section in a `motion.section` with:

```jsx
<motion.section
  initial={{ opacity: 0, y: 20 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true, amount: 0.2 }}
  transition={{ duration: 0.6, ease: "easeOut" }}
>
```

For staggered children, use `staggerChildren: 0.15` in parent's `transition`.

Respect reduced motion:
```jsx
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
// If true, skip all animations (set initial = animate states)
```

Smooth scroll for anchor links:
```css
html { scroll-behavior: smooth; }
```

---

## Waitlist Form Logic

```typescript
interface WaitlistFormState {
  email: string;
  status: 'idle' | 'submitting' | 'success' | 'error';
  errorMessage?: string;
}

// Validation
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// On submit:
// 1. Validate email
// 2. POST to your backend or Supabase directly:
//    INSERT INTO waitlist (email, source, created_at)
//    VALUES (email, 'landing_page', NOW())
// 3. On success: show "You're on the list. We'll reach out within 48 hours."
// 4. On error: show "Something went wrong. Try again."

// Success state replaces the form with a confirmation message + checkmark icon
```

For the Lovable prototype, use a simple `console.log` or `alert` on submit. The Supabase integration can be wired after.

---

## Responsive Breakpoints

| Breakpoint | Width | Behavior |
|------------|-------|----------|
| Mobile | < 640px | Single column. Stacked hero. Full-width cards. `px-6`. |
| Tablet | 640–1024px | 2-col grids where applicable. `px-8`. |
| Desktop | > 1024px | 3-col grids. Side-by-side hero. `max-w-6xl mx-auto`. |

Hero headline: 32px mobile, 40px tablet, 48px desktop.

---

## Accessibility

- Single `<h1>` in hero. `<h2>` per section. `<h3>` for card titles.
- All icons have `aria-hidden="true"` (decorative) or `aria-label` (functional).
- CTA buttons: `aria-label="Request early access to CHIEF"`
- Email input: `aria-label="Enter your email address"`, `type="email"`, `required`
- Color contrast: `#10B981` on `#0F172A` = 5.8:1 ratio (passes WCAG AA)
- `#F8FAFC` on `#0F172A` = 17.4:1 ratio (passes WCAG AAA)
- Focus-visible: `outline: 2px solid #10B981; outline-offset: 2px;`
- Skip-to-content link as first focusable element
- `prefers-reduced-motion` respected (see Animations section)

---

## Embedded Assets

### CHIEF Icon SVG (use in nav and footer)

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024"><path fill="#476eb9" d="M361.594 470.034c-1.456-42.854 3.344-75.816 37.854-105.609a106.9 106.9 0 0 1 45.919-23.433c16.278-3.875 36.1-3.584 52.779-3.53l42.132.167c16.25.069 38.327-.567 53.908.56 19.283-.737 34.337 1.812 49.11 15.457 21.979 20.3 26.375 58.587 4.699 80.729-11.823 12.123-26.939 17.681-43.699 17.616-30.187-.001-60.435-.071-90.623-.069l-27.872-.027c-2.401-.008-11.139.054-13.002-.339-.556.37-1.508.954-1.972 1.372-7.125-1.335-22.408-.236-30.409-.378-18.972-.338-37.793-.824-56.733.924-4.611.426-8.225 1.031-12.231 3.453-5.211 3.15-7.06 10.097-9.86 13.107"/><path fill="#e33d3c" d="M594.186 338.189c19.283-.737 34.337 1.812 49.11 15.457 21.979 20.3 26.375 58.587 4.699 80.729-11.823 12.123-26.939 17.681-43.699 17.616-30.187-.001-60.435-.071-90.623-.069l-27.872-.027c-2.401-.008-11.139.054-13.002-.339 2.334-3.264 12.044-12.584 15.298-15.819l28.734-28.725 36.087-36.426c8.175-8.351 16.485-17.287 25.424-24.807 4.582-3.854 10.158-4.981 15.384-7.375z"/><path fill="#fdc612" d="M472.799 451.556c.637 3.826.35 12.803.32 17.016l-.242 29.893c-.198 23.153.541 49.901-.189 72.552l.285.623.023 62.116c-.001 5.469-.158 11.062.003 16.522.515 17.404-1.963 27.063 15.426 35.742-10.622.689-21.189.427-31.777-.629-47.228-4.709-85.213-40.429-93.162-87.146-1.57-9.227-2.604-18.775-1.535-28.124-.723-3.223-.414-27.882-.401-32.515l.044-67.572c2.8-3.01 4.649-9.957 9.86-13.107 4.006-2.422 7.62-3.027 12.231-3.453 18.94-1.748 37.761-1.262 56.733-.924 8.001.142 23.284-.957 30.409.378.464-.418 1.416-1.002 1.972-1.372"/><path fill="#2c4e9b" d="M361.594 470.034c2.8-3.01 4.649-9.957 9.86-13.107 4.006-2.422 7.62-3.027 12.231-3.453 18.94-1.748 37.761-1.262 56.733-.924 8.001.142 23.284-.957 30.409.378a5081 5081 0 0 0-64.774 64.141c-12.646 12.595-26.648 25.62-37.556 39.765-2.959 3.838-4.501 9.088-6.546 13.287-.723-3.223-.414-27.882-.401-32.515z"/><path fill="#19d688" d="m472.688 571.017 88.418-.487c17.166-.023 44.223-1.485 60.56 2.714 41.931 10.775 53.595 66.677 22.566 95.663-15.487 14.843-30.073 16.08-50.417 16.8-7.089.471-14.867.405-22.016.301-27.714-.403-55.686.536-83.374.012-17.389-8.679-14.911-18.338-15.426-35.742-.161-5.46-.004-11.053-.003-16.522z"/><path fill="#12a86c" d="M472.973 571.64c2.941 1.842 16.971 17.225 20.618 20.83l49.694 49.842c8.65 8.662 39.844 42.383 50.53 43.395-7.089.471-14.867.405-22.016.301-27.714-.403-55.686.536-83.374.012-17.389-8.679-14.911-18.338-15.426-35.742-.161-5.46-.004-11.053-.003-16.522z"/></svg>
```

### CHIEF Full Logo SVG (use for larger placements if needed)

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024"><path fill="#476fba" d="M135.935 479.731c-.553-7.009-.076-14.814.35-21.811 2.195-36.013 33.68-64.929 69.177-66.883 22.61-1.245 45.42-.023 68.069-.512 8.223-.164 17.6-.243 25.733.611 13.438-.382 24.325 1.382 34.498 11.09a41.66 41.66 0 0 1 12.799 29.707c.465 25.925-19.877 37.39-43.384 37.543l-64.697-.056c-3.447-.007-21.941-.362-24.034.003l-.567.014-.515.161c-20.91-.47-43.555-.605-64.459.826-8.158.558-8.011 4.959-12.97 9.307"/><path fill="#e43938" d="M299.264 391.136c13.438-.382 24.325 1.382 34.498 11.09a41.66 41.66 0 0 1 12.799 29.707c.465 25.925-19.877 37.39-43.384 37.543l-64.697-.056c-3.447-.007-21.941-.362-24.034.003l-.567.014c2.114-2.877 8.764-9.207 11.464-11.89l21.863-21.634 22.642-22.686c5.234-5.294 11.044-11.121 16.76-15.908 2.759-2.311 8.958-4.408 12.656-6.183"/><path fill="#fdc80e" d="m213.879 469.437.567-.014c.081 27.09.739 57.317-.018 84.122l.105 1.302c.695 15.233-.084 30.749.193 46.008.138 7.606-.495 15.477.918 22.971.887 4.633 5.666 7.216 9.455 9.308-2.367.447-9.046.415-11.532.379-21.504-.309-42.215-7.175-57.24-23.075-14.98-15.852-20.693-36.054-20.251-57.479-.414-6.611-.033-17.602-.027-24.459l-.114-48.769c4.959-4.348 4.812-8.749 12.97-9.307 20.904-1.431 43.549-1.296 64.459-.826z"/><path fill="#294d9b" d="M135.935 479.731c4.959-4.348 4.812-8.749 12.97-9.307 20.904-1.431 43.549-1.296 64.459-.826l-43.614 42.924c-9.589 9.34-20.21 18.942-28.62 29.36-2.108 2.611-3.773 7.837-5.054 11.077-.414-6.611-.033-17.602-.027-24.459z"/><path fill="#17da8a" d="m214.428 553.545 63.898-.096c6.952-.004 14.247.115 21.171.002 14.134-.23 24.5.486 35.013 10.944a40.35 40.35 0 0 1 11.853 28.813 40.42 40.42 0 0 1-12.598 28.517c-11.408 10.981-22.953 11.717-37.779 11.382-21.376.469-49.712.796-70.887.027-3.789-2.092-8.568-4.675-9.455-9.308-1.413-7.494-.78-15.365-.918-22.971-.277-15.259.502-30.775-.193-46.008z"/><path fill="#0fab6c" d="M214.533 554.847c4.483 3.21 16.316 15.768 20.599 20.093 15.716 15.87 31.449 31.818 47.209 47.653 2.846 2.86 13.034 8.237 13.645 10.514-21.376.469-49.712.796-70.887.027-3.789-2.092-8.568-4.675-9.455-9.308-1.413-7.494-.78-15.365-.918-22.971-.277-15.259.502-30.775-.193-46.008"/><path fill="#323233" d="M712.148 456.203c10.288-.686 21.368-.103 31.795-.194 10.059-.088 20.12-.409 30.201.707 5.9.653 9.349 8.081 8.432 13.571-3.97 10.2-19.062 6.852-26.74 7.51-5.66.485-32.662-1.306-35.553.435a655 655 0 0 0-.307 23.737c8.426-.247 48.672-2.745 51.977 4.359 13.377 28.754-50.089 8.148-51.975 18.547l.005 22.142c10.941-.18 49.688-2.31 57.268 1.749 2.126 1.138 3.635 3.132 4.336 5.419 1.024 3.342.42 7.021-1.354 10-1.263 2.122-3.339 3.136-5.681 3.689-5.481 1.294-53.455 1.093-60.573.353-3.081-.32-6.392-1.063-9.032-2.747-3.264-2.082-5.304-5.723-6.076-9.453-2.129-10.297-.462-30.569-.397-41.707.087-14.74-1.121-30.128.524-44.778.298-2.652.765-4.744 2.278-7 2.619-3.904 6.487-5.358 10.872-6.339"/><path fill="#323233" d="M526.7 455.589c7.392-.355 9.645.563 13.832 6.583.587 14.089.056 26.956-.051 41.016 17.778.356 37.119-.063 55.055-.086-.135-12.424-.672-26.901.349-39.314.469-5.705 8.505-9.54 14.129-7.687a10.29 10.29 0 0 1 6.323 5.906c2.018 4.866 1.146 85.363.758 96.68-.038 1.127-.434 2.767-.958 3.854-1.544 3.205-3.733 4.235-6.872 5.442-6.829 1.054-12.754-2.118-13.385-9.527-1.039-12.215-.479-25.289-.4-37.621-17.641-.653-37.203-.302-54.991-.301.272 9.794 3.696 36.936-3.624 45.341-4.301 4.938-12.264 2.405-16.712-2.632-1.515-9.618-2.317-94.792-.081-101.782 1.004-3.137 3.903-4.49 6.628-5.872"/><path fill="#323233" d="M447.89 455.685a60.64 60.64 0 0 1 29.213 5.553c9.014 4.179 25.588 16.387 7.799 25.355-7.274 2.193-15.637-5.693-22.222-7.609-26.478-7.705-51.509 15.358-43.714 42.838a32.58 32.58 0 0 0 15.527 19.694c10.403 5.803 23.587 6.257 34.233.914 5.036-2.528 7.55-5.385 13.391-6.883 4.211.716 11.705 3.857 11.821 8.107.384 14.051-25.496 23.124-34.624 24.342a57.95 57.95 0 0 1-42.855-11.398c-34.043-26.33-25.885-83.798 15.292-97.649 5.662-1.904 10.218-2.598 16.139-3.264"/><path fill="#323233" d="M819.359 456.665c1.848-.132 7.493-.432 9.109-.26 13.407 1.425 44.316-2.58 55.726 2.019 4.452 4.562 6.14 11.417 1.355 16.341-4.745 4.882-15.613 3.292-22.045 3.336l-34.985.391-.007 24.401c6.362-.857 15.261-.384 21.885-.438 9.395-.076 41.949-3.423 30.046 15.227-5.243 4.099-16.876 3.008-23.385 2.974q-14.304-.144-28.61-.077-.07 11.442-.021 22.884c.038 4.924.323 9.906-.159 14.805-.944 9.59-6.118 10.045-14.069 10.187-6.239-4.447-7.149-6.59-7.13-14.236.067-27.048-.326-54.118.046-81.161.13-9.48 2.77-13.765 12.244-16.393"/><path fill="#323233" d="M653.866 456.139c2.07-.295 4.032-.307 6.106.016 2.269.354 5.674 1.331 6.881 3.53 1.988 3.622 2.282 96.237.981 101.746-.798 3.38-3.696 4.959-6.459 6.576-9.285.621-13.448-1.39-13.789-11.184-1.01-28.992-.565-58.035-.468-87.041.024-7.362.006-10.046 6.748-13.643"/></svg>
```

### PWA Manifest (reference — not functional on landing page, but shown in install preview section)

```json
{
  "name": "CHIEF",
  "short_name": "CHIEF",
  "description": "Zero inbox. Full context. Acts like you.",
  "start_url": "/inbox",
  "display": "standalone",
  "background_color": "#0F172A",
  "theme_color": "#0F172A",
  "orientation": "portrait",
  "icons": [
    { "src": "/icon.svg", "sizes": "any", "type": "image/svg+xml" },
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ],
  "categories": ["productivity", "business"]
}
```

---

## Copy Framework Reference

All copy on this page follows two frameworks simultaneously:

**Win Without Pitching Manifesto:**
- Position from expertise and authority — never beg, never pitch
- Declarative statements. No hedging words ("might", "could", "try", "help")
- Specificity creates credibility (exact numbers, concrete details)
- Create scarcity — "limited early access", "small batches"
- Short, powerful statements over long explanations
- The product speaks for itself through demonstration, not persuasion

**Customer Centric Sales:**
- Lead with the buyer's pain, not product features
- Make the reader see themselves in the problem
- Enable visualization of their success (the "after" state)
- Questions that make the reader self-qualify ("You didn't build a company to...")
- Remove all friction from the signup/conversion process
- Empathetic but never salesy — respect the reader's intelligence

**Do NOT include any of these words or phrases in the copy:**
- "Revolutionary", "game-changing", "cutting-edge", "next-generation"
- "We believe", "We think", "We hope"
- "Try it today", "Sign up now", "Don't miss out"
- "AI-powered" (show the AI, don't label it)
- Exclamation marks (zero on the entire page)

---

## What NOT to Build

- No light mode. Dark mode only.
- No hamburger menu. Just the sticky nav with one CTA.
- No testimonials section (we don't have users yet — that's honest).
- No pricing section.
- No feature comparison table.
- No video embeds.
- No cookie banner.
- No chatbot widget.
- No rounded corners smaller than 12px.
- No serif fonts anywhere.
- No gradients on text.
- No stock photos. All visuals are CSS/SVG illustrations.
