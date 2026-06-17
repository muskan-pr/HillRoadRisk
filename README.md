# HillRoadRisk

**Hyperlocal Landslide Risk Maps for Indian Hilly Terrain**

> ⛰️ Road-segment-level landslide susceptibility scoring for Uttarakhand, updated with live weather data.

![Phase](https://img.shields.io/badge/Phase-1%20Static%20Susceptibility-blue)
![Cost](https://img.shields.io/badge/Infrastructure-₹0%2Fmo-green)
![License](https://img.shields.io/badge/License-MIT-yellow)

## 🎯 What This Does

Instead of answering *"Will there be heavy rainfall in Uttarakhand?"*, this platform answers:

> **"This specific road segment between Joshimath and Badrinath has elevated landslide risk during the next six hours."**

## 🏗️ Architecture

```
Frontend (React + MapLibre GL)  →  FastAPI Backend  →  PostGIS Database
    ↑                                    ↑
 OpenFreeMap tiles              Open-Meteo Weather API
```

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 18+
- Python 3.11+

### 1. Clone & Configure
```bash
cp .env.example .env
```

### 2. Start Database
```bash
docker compose up db -d
```

### 3. Start Backend
```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### 4. Start Frontend
```bash
cd frontend
npm install
npm run dev
```

### 5. Open Dashboard
Navigate to **http://localhost:5173**

API docs at **http://localhost:8000/docs**

## 📁 Project Structure

```
HillRoadRisk/
├── backend/             # FastAPI + PostGIS
│   ├── app/
│   │   ├── api/v1/      # REST endpoints (segments, villages, landslides)
│   │   ├── ingestion/   # Data pipelines (OSM, rainfall)
│   │   ├── models/      # SQLAlchemy + GeoAlchemy2 models
│   │   └── main.py      # FastAPI app
│   └── db/init.sql      # PostGIS schema
├── frontend/            # React + TypeScript + MapLibre GL
│   └── src/
│       ├── components/  # Map, Sidebar, DetailPanel, Header
│       ├── stores/      # Zustand state management
│       └── api/         # Typed API client
├── data/                # DEM tiles, model artifacts (gitignored)
├── notebooks/           # Jupyter exploration notebooks
└── docker-compose.yml   # Local dev environment
```

## 🗺️ Tech Stack

| Layer | Technology | Cost |
|---|---|---|
| Frontend | React + TypeScript + MapLibre GL JS | Free |
| Backend | Python + FastAPI | Free |
| Database | PostgreSQL + PostGIS | Free |
| Map Tiles | OpenFreeMap | Free |
| Weather | Open-Meteo API | Free |
| ML | scikit-learn + XGBoost | Free |
| Hosting | Render + Vercel + Supabase | Free tier |

## 📊 Data Sources

- **SRTM / Copernicus DEM** — Elevation, slope, aspect
- **OpenStreetMap** — Road network
- **Open-Meteo** — Hourly rainfall + forecasts
- **GSI / NDMA / NASA** — Historical landslide records
- **Sentinel-2** — Satellite imagery

## ⚠️ Disclaimer

This is a **risk-assessment tool for informational purposes only**. It is not a guarantee of safety. Always follow official advisories from NDMA and state disaster management authorities.

## 📜 License

MIT
