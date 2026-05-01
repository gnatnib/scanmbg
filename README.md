# ScanMBG

<p align="center">
  <img src="./public/mockup.png" alt="ScanMBG Preview" width="800"/>
</p>

<p align="center">
  <a href="https://scanmbg.vercel.app">scanmbg.vercel.app</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Framework-Next.js_16-black" />
  <img src="https://img.shields.io/badge/Styling-Tailwind_CSS_4-38B2AC" />
  <img src="https://img.shields.io/badge/Vision-Gemini_2.5_Flash-blue" />
  <img src="https://img.shields.io/badge/Fallback-Gemma_4-green" />
  <img src="https://img.shields.io/badge/Deploy-Vercel-black" />
</p>

---

## Overview

ScanMBG is a web application for analyzing the nutritional quality of **MBG (Makan Bergizi Gratis)** meals — Indonesia's free school meal program. Users can scan, upload, or manually input their meals and receive structured insights including **nutritional breakdown, MBG score, and estimated cost**.

## The Problem

The MBG program has become controversial due to **low transparency and inconsistent reporting** of nutritional data. Some reported values are unrealistic — simple foods like *perkedel* being reported with extremely high protein, menu pricing that doesn't match market conditions, and no verifiable calculation methods. This creates a gap between reported data and real-world nutrition.

## Solution

ScanMBG provides a **user-driven, reproducible evaluation system**:

- Uses **image or text input** instead of reported claims
- Applies **AI-based analysis** for consistent estimation
- Produces a **standardized MBG score** based on Kemenkes "Isi Piringku" standards
- Estimates **realistic meal costs** using local market price data

## Features

- Camera capture or image upload for food detection
- Manual meal input with smart autocomplete
- Nutritional analysis (calories, protein, fat, carbs, fiber, vitamins)
- MBG scoring system (0–10) with Kemenkes comparison
- Price estimation against Rp 15.000 MBG budget
- Scan history with persistent storage
- Shareable results with auto-generated embed images (WhatsApp, X)

## System Pipeline

```
Input (Camera / Gallery / Manual)
  │
  ▼
Image Detection ──► Gemini 2.5 Flash (primary, free tier)
  │                   └─► Gemma 4 via Ollama (fallback on 429/timeout)
  │
  ▼
TKPI Database Lookup ── enrich items with official nutrition data
  │
  ▼
Scoring Engine ── MBG score 0–10 (Kemenkes "Isi Piringku")
  │
  ▼
Price Estimation ── local market price database (no AI call)
  │
  ▼
AI Explanation ── lazy-loaded after results render (Gemini → Gemma 4)
  │
  ▼
Result Page + Share
```

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, JavaScript) |
| Styling | Tailwind CSS v4 + Framer Motion |
| Charts | Recharts |
| Icons | Lucide React |
| Vision AI | Gemini 2.5 Flash (primary) → Gemma 4 via Ollama (fallback) |
| Text AI | Gemini 2.5 Flash → Gemma 4 via Ollama (explanation) |
| Nutrition Data | TKPI (Tabel Komposisi Pangan Indonesia) |
| Pricing Data | Local database of pasar tradisional prices 2024–2025 |

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment Variables

Create `.env.local`:

```env
GOOGLE_GEMINI_API_KEY=your_gemini_api_key
OLLAMA_API_KEY=your_ollama_api_key
OLLAMA_BASE_URL=https://ollama.com
```

## Deployment

Deploy to Vercel: [vercel.com/new](https://vercel.com/new)

## Repository

[github.com/gnatnib/scanmbg](https://github.com/gnatnib/scanmbg)
