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
│   │   └── aircraft-view/
│   │       └── route.ts          # GET paginated fleet view
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── FleetView.tsx             # aircraft_view display
│   └── AircraftManager.tsx      # CRUD for aircraft table
└── lib/
    ├── db.ts                     # pg Pool singleton
    └── types.ts                  # TypeScript interfaces
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/aircraft-view?page=1&search=` | Paginated fleet view |
| GET | `/api/aircraft` | All aircraft + operators + categories |
| POST | `/api/aircraft` | Create aircraft |
| GET | `/api/aircraft/:id` | Get single aircraft |
| PUT | `/api/aircraft/:id` | Update aircraft |
| DELETE | `/api/aircraft/:id` | Delete aircraft |

