# Roadmap

Current version: **v0.1.0** — fully functional local analytics dashboard with weather + geocoding enrichment.

---

## 🚀 Near-Term (v0.2)

### AI Coach (BYOK)
Bring-your-own-key LLM integration for personalised training analysis. Planned providers:
- **Anthropic Claude** (native API)
- **OpenAI / GPT-4o** (OpenAI-compatible)
- **OpenRouter** (multi-model, no key needed for free tier)
- **Ollama** (100% local, no key needed)

Features:
- Natural language Q&A about your training ("Why was my form so low in March?")
- Weekly training summary generated automatically
- Anomaly detection ("Your HR was 12 bpm above average for the effort")
- Key stays in localStorage, never sent anywhere except the chosen provider

### Segments & Comparisons
- Mark best efforts on a route automatically (no Strava segment API needed — pure GPS)
- Side-by-side effort comparison chart for repeated routes

### Gear Tracking
- Per-gear km / hours / elevation totals
- Mileage warning when a bike approaches a service interval (configurable)

---

## 📈 Medium-Term (v0.3)

### Power Analysis (for rides with power meter data)
- Power curve (best 5s / 1m / 5m / 20m / 60m)
- Estimated FTP from best 20-minute effort
- W/kg if body weight is entered in settings
- Training zones breakdown (pie chart)

### Route Intelligence
- Automatic climb detection from elevation profile (name, grade, length)
- "Most climbed segments" list derived from GPS overlap
- Route difficulty score

### Export & Sharing
- Export filtered activity list as CSV
- Export charts as PNG
- Shareable summary card (generated client-side as an image, no upload)

### Enhanced Filtering
- Filter by activity type (Road / Gravel / MTB / Virtual)
- Filter by gear
- Filter by weather condition (rainy rides, hot rides, etc.)
- Saved filter presets

---

## 🔭 Long-Term (v0.4+)

### Multi-Sport Support
- Running, swimming, hiking — currently only cycling is fully supported
- Sport-specific metrics (pace for running, SWOLF for swimming)

### Training Plan Integration
- Import a structured training plan (e.g. TrainingPeaks .csv export)
- Overlay planned vs actual load on the CTL/ATL chart
- Compliance score per week

### Social / Team Mode
- Import multiple athletes' exports (different browser profiles or a team ZIP)
- Compare CTL curves side-by-side
- Leaderboard for a given route/timeframe

### Progressive Web App (PWA)
- Installable on desktop and mobile
- Offline-first (already almost there — just needs a service worker)
- Push notifications for weekly summary

### Strava Live Sync
- OAuth connection to Strava API for automatic activity sync (no manual ZIP export needed)
- Incremental sync — only fetch new activities
- Respects rate limits, caches in IndexedDB just like the ZIP flow

---

## ✅ Completed

| Feature | Version |
|---|---|
| ZIP import (CSV + FIT files) | v0.1 |
| GPS track parsing + route heatmap | v0.1 |
| Wind analysis (headwind/tailwind/crosswind) | v0.1 |
| GPS spike filtering | v0.1 |
| IndexedDB persistence | v0.1 |
| Open-Meteo weather enrichment | v0.1 |
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
