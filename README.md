# VN Fashion Shop

Vietnamese fashion e-commerce application — full-stack web app with FastAPI backend and Next.js frontend.

## Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| **Admin** | admin@vnfashion.vn | Admin123! |
| **User** | user@vnfashion.vn | User123! |

## Tech Stack

### Backend
- **FastAPI** — high-performance Python web framework
- **SQLAlchemy 2.0** — async ORM with PostgreSQL
- **Pydantic v2** — validation and serialization
- **JWT** (python-jose) — token authentication
- **bcrypt** — password hashing
- **Redis** — cache and rate limiting
- **Celery** — async task queue

### Frontend
- **Next.js 14** — React framework with App Router
- **TypeScript** — type safety
- **Tailwind CSS** — utility-first CSS
- **Lucide React** — icon library

### Infrastructure
- **Docker & Docker Compose** — containerization
- **PostgreSQL 16** — primary database
- **Redis 7** — cache and message broker

## System Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│  Next.js     │────▶│  FastAPI      │────▶│ PostgreSQL  │
│  Frontend    │     │  Backend      │     │  Database   │
│  :3000       │     │  :8000        │     │  :5432      │
└─────────────┘     └──────┬───────┘     └─────────────┘
                           │
                           ▼
                    ┌──────────────┐
                    │    Redis     │
                    │  Cache/Queue │
                    │  :6379       │
                    └──────────────┘
```

## Quick Start with Docker

### Requirements
- Docker Desktop (includes Docker Compose)
- Git

### Steps

```bash
# 1. Clone repository
git clone <repository-url>
cd vn-fashion-shop

# 2. Configure environment (defaults work with Docker)
cp .env.example .env

# 3. Start all services
docker compose up -d

# 4. Seed the database
docker compose exec backend python -m seed.seed_data

# 5. Open the app
# Frontend:    http://localhost:3000
# Backend API: http://localhost:8000
# API Docs:    http://localhost:8000/docs
```

## Local Development (Without Docker)

### Requirements
- Python 3.12+
- Node.js 20+
- PostgreSQL 16 running locally
- Redis 7 running locally

### Setup

```bash
# 1. Configure environment for local dev
cp .env.example .env
# Edit .env: set DB_HOST=localhost and REDIS_HOST=localhost

# 2. Install all dependencies
make install
# Or manually:
#   cd backend && pip install -r requirements.txt
#   cd frontend && npm ci

# 3. Create the database
createdb vnfashion   # or use psql

# 4. Seed the database
make seed
# Or: cd backend && python -m seed.seed_data

# 5. Start backend and frontend in separate terminals
# Terminal 1 (backend):
cd backend && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Terminal 2 (frontend):
cd frontend && npm run dev
```

After setup:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs (Swagger)**: http://localhost:8000/docs

## Makefile Commands

```bash
make install      # Install backend (pip) + frontend (npm) deps
make dev          # Start backend + frontend in dev mode
make test         # Run all tests
make seed         # Seed database with sample data
make docker-up    # docker compose up -d
make docker-down  # docker compose down
make lint         # Run ruff (backend) + ESLint (frontend)
make type-check   # Run tsc --noEmit (frontend)
```

## Running Tests

```bash
# All tests
make test

# Backend tests only
cd backend && pytest tests/ -v

# Frontend type check + lint
cd frontend && npm run lint && npx tsc --noEmit
```

## Features

### Customer
- Register / Login (JWT authentication)
- Browse products with filters (category, price, size, color)
- Product search
- Product detail with images and variants
- Shopping cart (add, update, remove)
- Checkout and payment (Stripe)
- Order history
- Manage account and shipping addresses

### Admin
- Dashboard with stats (revenue, orders, customers)
- Product management (CRUD)
- Order management (update status)
- Category management

## API Endpoints

### Auth (`/api/v1/auth`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/login` | Login |
| POST | `/register` | Register |
| POST | `/refresh` | Refresh token |
| GET | `/profile` | Get profile |
| POST | `/logout` | Logout |

### Products (`/api/v1/products`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | List products (with filters, pagination) |
| GET | `/{slug}` | Product detail |
| GET | `/featured` | Featured products |
| GET | `/new-arrivals` | New arrivals |
| GET | `/search?q=` | Search products |

### Cart (`/api/v1/cart`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | View cart |
| POST | `/items` | Add item |
| PATCH | `/items/{id}` | Update quantity |
| DELETE | `/items/{id}` | Remove item |

### Orders (`/api/v1/orders`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/` | Create order |
| GET | `/` | List orders |
| GET | `/{id}` | Order detail |
| POST | `/{id}/cancel` | Cancel order |

### Admin (`/api/v1/admin`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/metrics` | Dashboard stats |
| GET | `/products` | Manage products |
| POST | `/products` | Create product |
| PUT | `/products/{id}` | Update product |
| GET | `/orders` | Manage orders |
| PATCH | `/orders/{id}/status` | Update order status |

## Directory Structure

```
vn-fashion-shop/
├── backend/
│   ├── app/
│   │   ├── config.py          # App configuration
│   │   ├── database.py        # Database connection
│   │   ├── dependencies.py    # FastAPI dependencies (auth, rate limit)
│   │   ├── main.py            # FastAPI entry point
│   │   ├── models/            # SQLAlchemy models
│   │   │   ├── user.py        # User, Address
│   │   │   ├── product.py     # Product, Category, Variant
│   │   │   └── order.py       # Order, OrderItem
│   │   ├── routers/           # API endpoint handlers
│   │   ├── schemas/           # Pydantic schemas
│   │   ├── services/          # Business logic
│   │   └── utils/             # JWT, hashing, helpers
│   ├── seed/                  # Sample data seed script
│   ├── tests/                 # Pytest test suite
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── app/               # Next.js App Router pages
│   │   ├── components/        # React components
│   │   ├── hooks/             # Custom hooks (useAuth, useCart)
│   │   ├── lib/               # API client, utilities
│   │   └── types/             # TypeScript type definitions
│   ├── Dockerfile
│   └── package.json
├── .github/
│   └── workflows/
│       └── ci.yml             # GitHub Actions CI pipeline
├── Makefile                   # Developer convenience commands
├── docker-compose.yml
├── .env.example
└── README.md
```

## Troubleshooting

### Backend fails to start — "could not connect to database"
- Ensure PostgreSQL is running: `pg_isready -h localhost`
- Check `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` in `.env`
- For Docker: use `DB_HOST=db`, for local dev: use `DB_HOST=localhost`

### Backend fails to start — "could not connect to Redis"
- Ensure Redis is running: `redis-cli ping` → should return `PONG`
- Check `REDIS_HOST` and `REDIS_PORT` in `.env`

### Frontend shows API errors
- Confirm backend is running on port 8000
- Check `NEXT_PUBLIC_API_URL` in `.env` (should be `http://localhost:8000/api/v1` for local dev)

### Stripe payment errors
- The app loads with placeholder Stripe keys but payments won't process
- Replace `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, and `STRIPE_WEBHOOK_SECRET` with real test keys from https://dashboard.stripe.com

### Database tables not found
- Run the seed script which creates tables automatically: `make seed`
- Or in Docker: `docker compose exec backend python -m seed.seed_data`

### Port already in use
```bash
# Find and kill the process using the port
lsof -ti:8000 | xargs kill -9
lsof -ti:3000 | xargs kill -9
```

## Author

Tran Quang Vu
