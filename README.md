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
│   ├── FleetView.tsx             # aircraft_view display
│   ├── UnidentifiedAircraftView.tsx # dashboard for unidentified contacts
│   ├── CatalogManager.tsx        # CRUD for operators and categories
│   ├── AppHeader.tsx            # top navigation for app pages
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
