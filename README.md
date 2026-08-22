# AIRCRAFT DB CRUD

A Next.js + TypeScript app for managing  PostgreSQL aircraft database.

## Setup

Edit `.env.local`
```
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DATABASE
```


## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── aircraft/
│   │   │   ├── route.ts          # GET all, POST create
│   │   │   └── [id]/route.ts     # GET one, PUT update, DELETE
│   │   ├── categories/
│   │   │   ├── route.ts          # GET all, POST create
│   │   │   └── [id]/route.ts     # GET one, PUT update, DELETE
│   │   ├── operators/
│   │   │   ├── route.ts          # GET all, POST create
│   │   │   └── [id]/route.ts     # GET one, PUT update, DELETE
│   │   ├── aircraft-view/
│   │       └── route.ts          # GET paginated fleet view
│   │   └── unidentified-aircraft/
│   │       ├── route.ts          # GET paginated list, POST create
│   │       └── [id]/route.ts     # GET one, PUT update, DELETE
│   ├── globals.css
│   ├── layout.tsx
│   ├── page.tsx
│   ├── catalogs/
│   │   └── page.tsx
│   └── stats/
│       └── page.tsx
├── components/
│   ├── DashboardTabs.tsx         # fleet / unknown segmented switch
│   ├── FleetView.tsx             # aircraft_view display
│   ├── UnidentifiedAircraftView.tsx # dashboard for unidentified contacts
│   ├── CatalogManager.tsx        # CRUD for operators and categories
│   ├── AppHeader.tsx             # top navigation for app pages
│   ├── ThemeToggle.tsx           # dark (default) / light switch
│   ├── ui.tsx                    # compact interface primitives
│   ├── viz.tsx                   # chart primitives (stat, meter, bars, heatmap)
│   └── AircraftManager.tsx       # CRUD for aircraft table
└── lib/
    ├── db.ts                     # pg Pool singleton
    ├── stats.ts                  # analytics queries for /stats
    └── types.ts                  # TypeScript interfaces
```

## Interface

Dark-first, compact operations theme. Design tokens live in `src/app/globals.css`
(`:root` = dark, `:root[data-theme="light"]` = light) and are exposed to Tailwind
as `ops-*` colors in `tailwind.config.js`. Charts use a single validated teal
sequential ramp (`--seq-1` … `--seq-7`) with red reserved for data gaps.

## Analytics (`/stats`)

Coverage- and composition-oriented, computed in `src/lib/stats.ts`:

- ADS-B trackability (share of records with a valid 6-digit hex ICAO)
- Per-field completeness of the registry, with the missing count per field
- Fleet by operator (with per-operator ADS-B coverage) and by category
- Dominant airframes, distinct/singleton counts and top-5 concentration
- Operator x category heatmap
- Registration-prefix composition and ICAO allocation blocks
- Monthly additions over the last 12 months, with a 30-day pace delta
- Attention queue (records with critical fields empty) and identity collisions
- Unidentified-contact backlog, including hexes that collide with the fleet

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/aircraft-view?page=1&search=` | Paginated fleet view |
| GET | `/api/aircraft` | All aircraft + operators + categories |
| POST | `/api/aircraft` | Create aircraft |
| GET | `/api/aircraft/:id` | Get single aircraft |
| PUT | `/api/aircraft/:id` | Update aircraft |
| DELETE | `/api/aircraft/:id` | Delete aircraft |
| GET | `/api/operators` | All operators with aircraft usage count |
| POST | `/api/operators` | Create operator |
| GET | `/api/operators/:id` | Get single operator |
| PUT | `/api/operators/:id` | Update operator |
| DELETE | `/api/operators/:id` | Delete operator |
| GET | `/api/categories` | All categories with aircraft usage count |
| POST | `/api/categories` | Create category |
| GET | `/api/categories/:id` | Get single category |
| PUT | `/api/categories/:id` | Update category |
| DELETE | `/api/categories/:id` | Delete category |
| GET | `/api/unidentified-aircraft?page=1&search=` | Paginated unidentified aircraft list |
| POST | `/api/unidentified-aircraft` | Create unidentified aircraft |
| GET | `/api/unidentified-aircraft/:id` | Get single unidentified aircraft |
| PUT | `/api/unidentified-aircraft/:id` | Update unidentified aircraft |
| DELETE | `/api/unidentified-aircraft/:id` | Delete unidentified aircraft |

## Database Schema

![schema](aircraftdb.png)
