# Strava Analytics

Local-first web app for cyclists. Import your Strava export and get insights Strava doesn't show you.

## Setup

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Phase Status

- [x] Phase 1 — Foundation & Import (scaffold ready)
- [ ] Phase 2 — GPX/FIT Parsing
- [ ] Phase 3 — IndexedDB Persistence
- [ ] Phase 4 — Weather Integration
- [ ] Phase 5 — Wind Analysis
- [ ] Phase 6 — Charts & Insights
- [ ] Phase 7 — Polish & Launch

## Architecture

All processing is client-side. No data leaves the browser except:
- Open-Meteo API calls (GPS start coordinates + date per activity)

See `PROJECTS/Strava-Analytics/Brief.md` and `Roadmap.md` for full spec.
