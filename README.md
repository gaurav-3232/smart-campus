# Smart Campus Resource Booking System

A full-stack microservice-based booking system for campus resources (rooms, labs, equipment) with secure REST APIs, role-based access control, scheduling conflict prevention via PostgreSQL exclusion constraints, and usage analytics.

## Live Demo

- **Frontend:** [https://smart-campus-web.onrender.com](https://smart-campus-web.onrender.com)
- **Backend API:** [https://smart-campus-hijp.onrender.com](https://smart-campus-hijp.onrender.com)
- **API Docs (Swagger):** [https://smart-campus-hijp.onrender.com/docs](https://smart-campus-hijp.onrender.com/docs)

## Architecture

```
┌─────────────────────────────────────────────────┐
│              React Frontend (Static)             │
│         TypeScript · Tailwind CSS · Vite         │
│        Deployed on Render (Static Site)          │
├─────────────────────────────────────────────────┤
│              FastAPI Backend (Docker)             │
│     JWT Auth · RBAC · Business Rules Engine      │
│         Deployed on Render (Web Service)         │
├─────────────────────────────────────────────────┤
│             PostgreSQL 15+ Database              │
│    Exclusion Constraints · Alembic Migrations    │
│         Hosted on Render (Managed DB)            │
└─────────────────────────────────────────────────┘
```

## Tech Stack

| Layer      | Technology                                              |
|------------|---------------------------------------------------------|
| Frontend   | React 18, TypeScript, Tailwind CSS, Vite, Recharts      |
| Backend    | FastAPI, Python 3.11, SQLAlchemy 2.0 (async), Alembic   |
| Database   | PostgreSQL 15+ with `btree_gist` extension              |
| Auth       | JWT (access + refresh tokens), bcrypt                   |
| Infra      | Docker, Docker Compose, GitHub Actions CI/CD, Render    |

## Features

- **Resource Management** — CRUD for rooms, labs, and equipment with metadata (capacity, location, amenities)
- **Smart Booking** — Create, update, and cancel bookings with automatic conflict detection
- **PostgreSQL Exclusion Constraints** — Database-level prevention of double-booking under concurrent access using `tstzrange` with GiST indexing
- **Role-Based Access Control** — Admin, Staff, and Student roles with granular permissions
- **Server-Side Business Rules:**
  - Students limited to 2-week advance booking
  - Minimum 15 min / maximum 8 hour booking duration
  - 1-hour cancellation policy (admin override available)
  - No past-date bookings
- **Recurring Bookings** — Support for weekly recurring reservations (up to 12 weeks)
- **Availability Analytics** — Historical usage stats, utilization percentages, and peak hour analysis
- **Search & Filter** — Find resources by type, capacity, amenities, and availability
- **JWT Token Rotation** — Secure access + refresh token flow with automatic refresh

## API Endpoints

| Method | Endpoint                           | Auth     | Description                    |
|--------|------------------------------------|----------|--------------------------------|
| POST   | `/api/auth/register`               | Public   | Register new user              |
| POST   | `/api/auth/login`                  | Public   | Login and receive tokens       |
| POST   | `/api/auth/refresh`                | Token    | Refresh access token           |
| GET    | `/api/auth/me`                     | Token    | Get current user profile       |
| GET    | `/api/resources`                   | Token    | List resources (with filters)  |
| GET    | `/api/resources/{id}`              | Token    | Get resource details           |
| POST   | `/api/resources`                   | Admin    | Create resource                |
| PATCH  | `/api/resources/{id}`              | Admin    | Update resource                |
| DELETE | `/api/resources/{id}`              | Admin    | Delete resource                |
| GET    | `/api/resources/{id}/availability` | Token    | Check hourly availability      |
| GET    | `/api/bookings`                    | Token    | List bookings                  |
| POST   | `/api/bookings`                    | Token    | Create booking (+ recurring)   |
| PATCH  | `/api/bookings/{id}`               | Owner    | Update booking                 |
| DELETE | `/api/bookings/{id}`               | Owner    | Cancel booking                 |
| GET    | `/api/analytics/utilization`       | Staff+   | Resource utilization stats     |
| GET    | `/api/analytics/peak-hours`        | Staff+   | Peak booking hours analysis    |

## Local Development

### Prerequisites

- Docker & Docker Compose
- Git

### Quick Start

```bash
git clone https://github.com/gaurav-3232/smart-campus.git
cd smart-campus
docker compose up --build
```

- **Frontend:** http://localhost:5175
- **Backend API:** http://localhost:8002
- **API Docs:** http://localhost:8002/docs

### Default Seed Data

The database migration seeds 12 campus resources across three types:
- **Rooms:** Lecture Hall A (200 cap), Lecture Hall B (100), Seminar Rooms 101/102, Study Rooms 1/2
- **Labs:** Computer Lab 1/2, Physics Lab, Chemistry Lab
- **Equipment:** 3D Printer Station, Projector Kit A

## Project Structure

```
smart-campus/
├── backend/
│   ├── app/
│   │   ├── api/routes/          # Auth, Resources, Bookings, Analytics endpoints
│   │   ├── core/                # Config, JWT security, RBAC
│   │   ├── db/                  # Async SQLAlchemy session
│   │   ├── models/              # User, Resource, Booking ORM models
│   │   ├── schemas/             # Pydantic request/response schemas
│   │   └── services/            # Business logic (booking rules, analytics)
│   ├── migrations/              # Alembic migrations with exclusion constraint
│   ├── tests/                   # API tests
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/          # Layout, shared UI
│   │   ├── contexts/            # Auth context (JWT state management)
│   │   ├── pages/               # Dashboard, Resources, Bookings, Analytics
│   │   ├── services/            # Axios API client with token refresh
│   │   └── types/               # TypeScript interfaces
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml           # Full-stack local development
├── render.yaml                  # Render deployment blueprint
└── .github/workflows/ci.yml    # GitHub Actions CI/CD pipeline
```

## CI/CD

GitHub Actions pipeline runs on every push to `main`:

1. **backend-lint-test** — Installs dependencies, runs Alembic migrations against test DB, executes pytest
2. **frontend-build** — Installs dependencies, TypeScript type checking, Vite production build
3. **docker-build** — Builds Docker images, spins up full stack, verifies health endpoint

## Environment Variables

| Variable                     | Description                              | Default                |
|------------------------------|------------------------------------------|------------------------|
| `DATABASE_URL`               | PostgreSQL connection string             | (required in prod)     |
| `SECRET_KEY`                 | JWT signing secret                       | (required in prod)     |
| `ACCESS_TOKEN_EXPIRE_MINUTES`| Access token TTL                         | `30`                   |
| `REFRESH_TOKEN_EXPIRE_DAYS`  | Refresh token TTL                        | `7`                    |
| `CORS_ORIGINS`               | Allowed origins JSON array               | `["http://localhost"]` |
| `VITE_API_URL`               | Backend URL for frontend (build-time)    | (empty for dev proxy)  |

## License

MIT
