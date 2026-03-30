# Roadmap

Current version: **v0.1.1** — fully functional local analytics dashboard with weather + geocoding enrichment.

---

## Strategy

**Core thesis:** Driftr sells confidence in training decisions, not charts. Free tier shows your data. Pro tier helps you understand it and know what to do next.

**Positioning:** "Your private cycling performance lab." Primary message is better training decisions; secondary is local-first privacy and data ownership.

**Monetization model:** Free core analytics + Pro paid tier ($8/month or $69/year). Optional limited-time Lifetime license test ($149). License-key based — no user accounts, no server-side sessions, preserving local-first architecture.

**Tier split principle:** Gate interpretation and action, not raw data display.

| | Free | Pro |
|---|---|---|
| ZIP import + full parse | yes | yes |
| Dashboard charts (volume, YoY, cadence, HR) | yes | yes |
| CTL/ATL/TSB fitness chart | yes | yes |
| Summary bar, Personal Records, Insight Cards | yes | yes |
| Route heatmap, Time heatmap | yes | yes |
| Weather enrichment + reverse geocoding | yes | yes |
| Activity list + detail panel | yes | yes |
| Rule-based weekly training report (5 bullets) | yes | yes |
| AI Coach (3 messages/day, managed) | yes | yes |
| Power Curve + FTP + W/kg + zone breakdown | — | yes |
| Unlimited AI Coach with deep analysis | — | yes |
| Smart Weekly Digest (AI Monday report) | — | yes |
| "What to do next" action recommendations | — | yes |
| GPS Segments + route comparison | — | yes |
| Training block detection + periodization | — | yes |
| Gear tracking + maintenance alerts | — | yes |
| CSV / PNG / image export | — | yes |
| Advanced filters + saved presets | — | yes |
| 14-day Pro trial on first use (no card) | — | yes |

**Go-to-market:** Community + content first (cycling Reddit, Discord clubs, Strava power-user circles). Educational content ("What my Strava export revealed in 12 months"). No paid ads until funnel metrics are solid.

**Kill criteria:** If <20% of uploaders return within 7 days, retention problem. If <5% of weekly actives ever click a Pro feature, weak monetization intent. If repeated feedback is "cool charts but no clear next action," differentiation failure.

---

## Phase 1 — Prove Demand (v0.2, ~2 weeks)

Goal: get signal that people would pay before building payment infrastructure. Target: 50+ pricing-page waitlist signups.

### 1. Pricing Page + Waitlist CTA
- Add `/pricing` route to the landing site
- Show Free vs Pro comparison table (mirrors tier split above)
- CTA: "Join the Pro waitlist" → feeds into existing `EmailCapture` component
- ~1 day

### 2. Rule-Based Weekly Training Report
- Auto-generated 5-bullet summary card on dashboard load
- Builds on existing `buildCoachContext.js` + `insights.js` logic
- No AI API needed — pure rule-based (volume trend, TSB status, streak health, top effort, consistency score)
- Displayed as a prominent card at the top of the dashboard
- ~2–3 days

### 3. "What to Do Next" Recommendation Engine
- 3–5 actionable suggestions derived from TSB, weekly volume deltas, streak data, HR/power trends
- Examples: "Rest day recommended (TSB at −18)", "Volume ramp: +22% this week vs last 4-week avg", "Consistency dropping — 2 of last 7 days active vs your 5-day avg"
- Extension of existing insight card pattern in `insights.js`
- ~2–3 days

### 4. Shareable Summary Card
- Export a branded PNG image of weekly/monthly stats (total km, elevation, ride count, fitness trend)
- Client-side canvas rendering (html2canvas or custom Canvas API)
- Viral loop: users share on social → discovery
- ~2 days

### 5. Funnel Instrumentation
- Privacy-respecting anonymous analytics (Plausible or Vercel Web Analytics)
- Key events: page-visit, upload-complete, first-insight-viewed, return-visit (7d), pricing-page-viewed, waitlist-signup
- No cookies, no PII, compliant with existing privacy positioning
- ~1 day

---

## Phase 2 — Build the Gate (v0.3, ~3–4 weeks)

Goal: ship actual Free/Pro split with working payment and gated premium features.

### 6. Pro Context + Gate Wrapper
- `ProContext` (React context) + `ProGate` wrapper component
- `<ProGate featureName="power-curve" fallback={<UpgradePrompt />}>`
- Shows blurred/truncated preview of gated feature with real data + upgrade CTA
- ~1 day

### 7. License Key Payment Flow (Lemon Squeezy)
- User clicks "Get Pro" → hosted Lemon Squeezy checkout
- Payment succeeds → license key generated
- User pastes key into Driftr Settings panel
- Client validates against Lemon Squeezy Validate API (CORS-friendly, no backend)
- Valid key stored in localStorage; re-validated weekly on app load
- Handles monthly/annual/lifetime variants
- No user accounts, no auth database — preserves local-first architecture
- ~2–3 days

### 8. Managed AI Coach (Pro feature)
- Thin proxy via Vercel Edge Function or Supabase Edge Function
- Validates license key, forwards prompt to Anthropic/OpenAI with Driftr's API key
- Streams response back to browser
- Free tier: 3 messages/day (rate-limited by key). Pro: unlimited
- Removes BYOK friction — users get AI coaching without managing API keys
- Existing `AiCoach.jsx` updated to use managed endpoint; BYOK remains as fallback
- ~3–4 days

### 9. Power Curve + Zones (Pro-gated)
- `PowerCurve.jsx` already exists — gate behind `ProGate`
- Add: body weight input → W/kg display
- Add: training zone breakdown pie chart (recovery / endurance / tempo / threshold / VO2max / anaerobic)
- ~2 days

### 10. Export & Sharing (Pro-gated)
- CSV export of filtered activity list
- PNG export of individual charts (Recharts → canvas → download)
- Shareable summary card from Phase 1 gets Pro-only customization (branding, date range, extra stats)
- ~2 days

### 11. 14-Day Pro Trial
- On first app load (no existing license key), auto-activate 14-day trial
- Trial start date stored in localStorage
- After expiry, Pro features show `ProGate` upgrade prompt
- ~1 day

---

## Phase 3 — Deepen the Moat (v0.4, ~4–6 weeks)

Goal: make Pro indispensable for serious cyclists through unique features competitors don't offer.

### 12. GPS Segments + Route Comparison
- Auto-detect repeated routes from GPS track overlap
- Downsample tracks to ~50m resolution, geohash bucketing for candidate matching, Hausdorff distance for confirmation
- Computed in a Web Worker to keep UI responsive
- Show effort comparison across attempts (time, avg speed, avg power, avg HR) in a side-by-side chart
- "Personal segment" leaderboard per route
- ~1.5 weeks

### 13. Training Block Detection + Periodization
- Detect build / peak / recovery phases from weekly volume + TSB trends
- Periodization chart showing block boundaries overlaid on volume/fitness curves
- Weekly compliance scoring: planned vs actual load
- ~1 week

### 14. Smart Weekly Digest (AI Monday Report)
- Every Monday (or on demand), auto-generate a rich AI analysis of last week
- What went well, what didn't, what to focus on this week
- Stored locally in IndexedDB, browsable history
- Pro-only
- ~3–4 days

### 15. Gear Tracking
- Per-bike km / hours / elevation totals (extracted from Strava export gear field)
- Configurable maintenance interval warnings ("Chain at 4,800 km — service soon")
- ~3–4 days

### 16. PWA + Install Prompt
- Service worker for offline capability
- Web App Manifest for "Add to Home Screen" / desktop install
- Already almost there — just needs SW registration and manifest
- ~2–3 days

### 17. Advanced Filters + Saved Presets (Pro-gated)
- Filter by activity type (Road / Gravel / MTB / Virtual)
- Filter by gear
- Filter by weather condition (rainy, hot, cold, windy)
- Save/load named filter presets
- ~3–4 days

---

## Backlog (unscheduled)

Features considered but deferred. Re-evaluate after Phase 3 based on user demand and retention data.

### Route Intelligence
- Automatic climb detection from elevation profile (name, grade, length)
- "Most climbed segments" list derived from GPS overlap (builds on Phase 3 segments)
- Route difficulty score

### Multi-Sport Support
- Running, swimming, hiking — currently only cycling is fully supported
- Sport-specific metrics (pace for running, SWOLF for swimming)
- Risk: dilutes positioning. Only pursue if retention data shows demand.

### Training Plan Integration
- Import a structured training plan (e.g. TrainingPeaks .csv export)
- Overlay planned vs actual load on the CTL/ATL chart
- Compliance score per week

### Social / Team Mode
- Import multiple athletes' exports
- Compare CTL curves side-by-side
- Leaderboard for a given route/timeframe
- Risk: conflicts with local-first architecture. Needs careful design.

### Strava Live Sync
- OAuth connection to Strava API for automatic activity sync
- Incremental sync — only fetch new activities
- Risk: Strava API terms are restrictive. ZIP export flow is actually a privacy feature. Defer unless strong demand.

### Additional AI Coach Providers
- OpenRouter (multi-model)
- Ollama (100% local)
- Lower priority now that managed AI Coach removes BYOK friction for most users

---

## Technical Notes

### Monetization Architecture
The payment and gating system is designed to preserve local-first principles:

- **No user accounts.** License key = identity.
- **No server-side database.** Key validation is a stateless API call to Lemon Squeezy.
- **One Edge Function** for managed AI Coach (validates key, proxies LLM call).
- **`ProContext` + `ProGate`** pattern for consistent feature gating across components.
- **`UpgradePrompt`** component shows blurred preview with real data + price + one-click checkout link.

### Key Metrics to Instrument
| Funnel Stage | Event |
|---|---|
| Discovery | Landing page visit |
| Activation | ZIP upload completed |
| Aha moment | First insight card viewed |
| Retention | Return visit within 7 days |
| Revenue intent | Pricing page viewed |
| Conversion | Waitlist signup / Pro purchase |
| Engagement | AI Coach messages sent / week |
| Expansion | Pro features used / week |

---

## ✅ Completed

| Feature | Version |
|---|---|
| ZIP import (CSV + FIT files) | v0.1 |
| ZIP parsing off the main thread (Web Worker) | v0.1.1 |
| GPS track parsing + route heatmap | v0.1 |
| Wind analysis (headwind/tailwind/crosswind) | v0.1 |
| Weather sampled at start/mid/end (cost-free) + time-bucketed wind analysis | v0.1.1 |
| GPS spike filtering | v0.1 |
| IndexedDB persistence | v0.1 |
| Open-Meteo weather enrichment | v0.1 |
| Weather/geocoding/map-tile consent toggles + cache-aware reset | v0.1.1 |
| AI coach consent + non-persistent API key storage | v0.1.1 |
| Nominatim reverse geocoding | v0.1 |
| CTL/ATL/TSB fitness chart | v0.1 |
| Weekly/YoY/cadence/HR charts | v0.1 |
| Personal Records | v0.1 |
| Insight Cards | v0.1 |
| Time heatmap | v0.1 |
| Summary bar (streaks, totals, consistency) | v0.1 |
| Timeframe filter (presets + custom range) | v0.1 |
| Sortable activity list with detail panel | v0.1 |
| Ride profile chart (elevation + speed/power) | v0.1 |
| Power Curve (best 5s/1m/5m/20m/60m + estimated FTP) | v0.1.1 |
| AI Coach BYOK (Claude + OpenAI, browser-direct) | v0.1.1 |
| Demo data mode | v0.1.1 |
| Landing page + Get Started section | v0.1.1 |
| Email capture (waitlist) component | v0.1.1 |
| Tester access gate (optional code lock) | v0.1.1 |
| Impressum + Datenschutz pages | v0.1.1 |
