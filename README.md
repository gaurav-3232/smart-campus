# Smart Campus Resource Booking System

A full-stack microservice-based booking system for campus resources (rooms, labs, equipment) with secure REST APIs, role-based access control, scheduling conflict prevention, and usage analytics.

## Architecture

```
┌─────────────────────────────────────────────────┐
│                  React Frontend                  │
│          TypeScript · Tailwind CSS               │
├─────────────────────────────────────────────────┤
│               FastAPI Backend                    │
│    JWT Auth · RBAC · Business Rules Engine       │
├─────────────────────────────────────────────────┤
│              PostgreSQL Database                 │
│   Exclusion Constraints · Alembic Migrations     │
└─────────────────────────────────────────────────┘
```

## Tech Stack

| Layer      | Technology                                      |
|------------|--------------------------------------------------|
| Frontend   | React 18, TypeScript, Tailwind CSS, Vite         |
| Backend    | FastAPI, Python 3.11, SQLAlchemy 2.0, Alembic    |
| Database   | PostgreSQL 15 with btree_gist extension           |
| Auth       | JWT (access + refresh tokens), bcrypt             |
| Infra      | Docker, Docker Compose, GitHub Actions            |

## Features

- **Resource Management**: CRUD for rooms, labs, and equipment with metadata
- **Smart Booking**: Create, update, cancel bookings with conflict detection
- **Exclusion Constraints**: PostgreSQL-level prevention of double-booking under concurrent access
- **Role-Based Access**: Admin, Staff, and Student roles with granular permissions
- **Availability Analytics**: Historical usage stats, peak hours, utilization rates
- **Recurring Bookings**: Support for weekly recurring reservations
- **Search & Filter**: Find available resources by type, capacity, amenities, and time slot

## Quick Start

```bash
# Clone and start
git clone https://github.com/gaurav-3232/smart-campus.git
cd smart-campus
docker compose up --build

# Frontend: http://localhost:5173
# Backend API: http://localhost:8000
# API Docs: http://localhost:8000/docs
```

## Environment Variables

Copy `.env.example` to `.env` and configure:

```
DATABASE_URL=postgresql://campus:campus@db:5432/campus_booking
SECRET_KEY=your-secret-key
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
```

## API Endpoints

| Method | Endpoint                          | Auth     | Description                    |
|--------|-----------------------------------|----------|--------------------------------|
| POST   | `/api/auth/register`              | Public   | Register new user              |
| POST   | `/api/auth/login`                 | Public   | Login, get tokens              |
| POST   | `/api/auth/refresh`               | Token    | Refresh access token           |
| GET    | `/api/resources`                  | Token    | List all resources             |
| POST   | `/api/resources`                  | Admin    | Create resource                |
| GET    | `/api/resources/{id}/availability`| Token    | Check availability             |
| GET    | `/api/bookings`                   | Token    | List user's bookings           |
| POST   | `/api/bookings`                   | Token    | Create booking                 |
| PATCH  | `/api/bookings/{id}`              | Owner    | Update booking                 |
| DELETE | `/api/bookings/{id}`              | Owner    | Cancel booking                 |
| GET    | `/api/analytics/utilization`      | Admin    | Resource utilization stats     |
| GET    | `/api/analytics/peak-hours`       | Admin    | Peak usage hours               |

## License

MIT
