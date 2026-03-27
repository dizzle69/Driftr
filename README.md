# Strava Analytics

Local-first cycling analytics dashboard. Import your Strava ZIP export and get deep insights that Strava doesn't show you — all processed in your browser, nothing uploaded to any server.

![Stack](https://img.shields.io/badge/React-18.3-61DAFB?logo=react) ![Stack](https://img.shields.io/badge/Vite-5.4-646CFF?logo=vite) ![Stack](https://img.shields.io/badge/Tailwind-3.4-38BDF8?logo=tailwindcss)

---

## Quick Start

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build → dist/
```

---

## What It Does

Import your Strava data export (the ZIP you download from Strava settings) and get:

### 📊 Dashboard Charts
- **Weekly volume** — km, elevation, moving time per calendar week
- **Year-over-Year** — monthly distance comparison across all years
- **Cadence trend** — rolling weekly average cadence
- **Heart Rate trend** — rolling weekly average HR

### 💪 Training Load
- **CTL / ATL / TSB** (Fitness / Fatigue / Form) curves using exponential moving averages on Relative Effort
- Color-coded TSB bars — green when fresh, red when fatigued

### 🏅 Summary & Records
- **Summary bar** — total km, elevation, ride count, current streak, longest streak, weekly consistency %
- **Personal Records** — longest ride, biggest climbing day, fastest avg speed, highest power, most elevation in a week
- **Insight Cards** — smart observations (best month, top gear ratio, training consistency, etc.)

### 🗺️ Maps & Heatmap
- **Route Heatmap** — all GPS tracks overlaid on a Leaflet map; click any route to highlight it
- **Time Heatmap** — activity distribution by day-of-week × hour-of-day

### 📋 Activity List
- Sortable table with all rides: date, name, start location, distance, time, speed, elevation, watts, HR, temp, wind
- Click any row to expand a **detail panel** with ride profile chart (elevation + speed/power), full stats, weather breakdown, wind analysis (headwind/tailwind/crosswind %)

### 🌤️ Weather Enrichment (Open-Meteo)
- Automatically fetches historical weather via Open-Meteo for each ride (temperature, wind, precipitation, UV, cloud cover)
- Uses start/middle/end sampling from Open-Meteo hourly data to improve wind classification and temperature-based charts/insights
- Background enrichment with progress bar — non-blocking, runs after import
- Results cached in IndexedDB — subsequent loads are instant

### 📍 Reverse Geocoding (Nominatim / OpenStreetMap)
- Resolves GPS start coordinates to human-readable location names ("Hamburg", "Vienna, Austria")
- Shown in the activity table and detail panel
- Throttled to respect Nominatim's 1 req/sec ToS; IDB-cached for instant re-loads

### 🔍 Filtering
- Timeframe presets: Last 30 / 90 / 365 days, This Year, Last Year, All Time
- Custom date range picker
- Minimum distance filter
- All charts, stats, and tables update reactively

---

## Architecture

**100% client-side** — no backend, no account, no tracking.

Data that leaves the browser:
- **Open-Meteo API** — GPS start point + date per activity (weather fetch)
- **Nominatim API** — GPS start point per activity (reverse geocoding)
- **AI Coach (optional)** — when you open the chat, enter a provider key, and opt in to sending your training context, prompts/responses are sent directly from the browser to the chosen LLM provider

Open-Meteo and Nominatim are throttled and cached in IndexedDB after the first request.

### Stack

| Layer | Technology |
|---|---|
| UI framework | React 18 + Vite 5 |
| Styling | Tailwind CSS 3 (dark theme) |
| Charts | Recharts 2 |
| Maps | Leaflet + react-leaflet |
| Local storage | IndexedDB via `idb` |
| ZIP parsing | JSZip |
| CSV parsing | PapaParse |
| FIT file parsing | fit-file-parser |
| GPS math | Custom haversine implementation |

### Key Files

```
src/
├── App.jsx                     # Root — state, enrichment triggers, progress bars
├── components/
│   ├── FileUploader.jsx        # ZIP import, worker orchestration
│   ├── ActivityList.jsx        # Sortable table + detail panel + ride profile chart
│   ├── DashboardCharts.jsx     # Weekly/YoY/cadence/HR recharts
│   ├── FitnessChart.jsx        # CTL/ATL/TSB training load
│   ├── SummaryBar.jsx          # Streak + totals bar
│   ├── InsightCards.jsx        # Smart insight tiles
│   ├── PersonalRecords.jsx     # PRs
│   ├── TimeHeatmap.jsx         # Day × hour activity grid
│   ├── RouteHeatmap.jsx        # Leaflet GPS overlay
│   └── TimeframeFilter.jsx     # Filter controls
├── hooks/
│   └── useActivities.js        # Activities state + weather + geocoding enrichment
├── utils/
│   ├── parseStrava.js          # CSV + FIT → activity objects
│   ├── weatherApi.js           # Open-Meteo fetch + cache
│   ├── geocodingApi.js         # Nominatim fetch + cache
│   ├── gpsCalc.js              # Haversine, wind analysis
│   └── insights.js             # Insight card generators
├── db/
│   └── indexedDb.js            # IDB wrapper (activities, weather_cache, geocoding_cache)
└── workers/
    └── parseWorker.js          # Off-main-thread ZIP/FIT parsing
```

---

## Roadmap

See [ROADMAP.md](ROADMAP.md) for planned features.

---

## Privacy

Your ride data never leaves your machine (except the two anonymised APIs above, and optionally your AI Coach chat prompts when you opt in). No cookies, no analytics, no login required. Reset button wipes all IndexedDB data instantly.
