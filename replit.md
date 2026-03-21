# QReate — QR Code Generator

## Overview

A premium QR code generator web app for digital natives and small businesses. Modern glassmorphism dark UI with smooth animations, full QR customization, history management, and analytics.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite (artifacts/qreate)
- **API framework**: Express 5 (artifacts/api-server)
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **QR Generation**: `qrcode` (client-side)
- **UI**: Recharts (analytics), react-colorful (color pickers), framer-motion (animations)

## Structure

```text
artifacts/
├── api-server/         # Express API server
└── qreate/             # React + Vite QR Code Generator app
lib/
├── api-spec/           # OpenAPI spec + Orval codegen config
├── api-client-react/   # Generated React Query hooks
├── api-zod/            # Generated Zod schemas from OpenAPI
└── db/                 # Drizzle ORM schema + DB connection
scripts/                # Utility scripts
```

## Features

1. **QR Generator** — 3-step flow: content type → data → customize
   - Types: URL, text, email, phone, SMS, Wi-Fi, vCard, event
   - Real-time live preview
   - Client-side generation with `qrcode` package

2. **Customization**
   - Color pickers (fg/bg) via react-colorful
   - Dot styles (square, rounded, dots, classy)
   - Gradient support (linear/radial)
   - Logo upload in center
   - Error correction level (L/M/Q/H)

3. **Export** — PNG, SVG, copy to clipboard

4. **History Page** (`/history`) — saved QR codes with search, sort, rename, delete

5. **Analytics** — scan tracking (geo, device, time) with Recharts charts

6. **Freemium UI** — upgrade prompt overlay for analytics (premium feature)

7. **Dark/Light mode** — persisted in localStorage

## Database Schema

- `qr_codes` — QR code records with style JSONB, scan count
- `scan_events` — individual scan events with geo, device, userAgent

## API Endpoints

- `GET /api/qrcodes` — list with search, sort
- `POST /api/qrcodes` — create
- `GET /api/qrcodes/:id` — get single
- `PATCH /api/qrcodes/:id` — update
- `DELETE /api/qrcodes/:id` — delete
- `POST /api/qrcodes/:id/scan` — record a scan
- `GET /api/qrcodes/:id/analytics` — get analytics

## Running

- API server: `pnpm --filter @workspace/api-server run dev`
- Frontend: `pnpm --filter @workspace/qreate run dev`
- DB schema push: `pnpm --filter @workspace/db run push`
- Codegen: `pnpm --filter @workspace/api-spec run codegen`
