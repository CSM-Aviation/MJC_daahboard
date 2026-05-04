# MJC Dashboard

Internal office dashboard for Madera Jet Center (KMAE). Displays flight schedules, HR notices, and maintenance queue data on a wall-mounted TV, with an admin panel for content management.

## Project Structure

```
├── frontend/          # Next.js app (Vercel)
├── backend/           # Node.js Express API (AWS AppRunner)
├── shared/            # Shared TypeScript types
└── docs/              # Functional documentation
```

## Prerequisites

- Node.js 20+
- MongoDB (local or Atlas)

## Quick Start

### Backend

```bash
cd backend
cp .env.example .env    # Edit with your MongoDB URI and JWT secret
npm install
npm run dev             # Starts on port 4000
```

### Frontend

```bash
cd frontend
cp .env.local.example .env.local
npm install
npm run dev             # Starts on port 3000
```

### Default Login

On first run, the backend seeds a default admin account:
- **Username:** `admin`
- **Password:** `admin`

Change this immediately after first login.

## API

All endpoints prefixed with `/api/v1`. See [docs/MJC_Dashboard_Functional_Documentation.md](docs/MJC_Dashboard_Functional_Documentation.md) for full API reference.

## Key URLs

- **TV Display:** `http://localhost:3000/display`
- **Admin Panel:** `http://localhost:3000/admin`
- **API Health:** `http://localhost:4000/api/health`
