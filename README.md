# VN Fashion Shop

Ung dung thuong mai dien tu thoi trang Viet Nam - Full-stack web application voi FastAPI backend va Next.js frontend.

## Kien truc he thong

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

## Cong nghe su dung

### Backend
- **FastAPI** - Python web framework hieu nang cao
- **SQLAlchemy 2.0** - ORM async voi PostgreSQL
- **Pydantic v2** - Validation va serialization
- **JWT** (python-jose) - Xac thuc token
- **bcrypt** - Ma hoa mat khau
- **Redis** - Cache va rate limiting
- **SlowAPI** - Rate limiting middleware

### Frontend
- **Next.js 14** - React framework voi App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first CSS
- **Lucide React** - Icon library

### Infrastructure
- **Docker & Docker Compose** - Container hoa
- **PostgreSQL 16** - Co so du lieu chinh
- **Redis 7** - Cache va message broker

## Tinh nang

### Nguoi dung
- Dang ky / Dang nhap (JWT authentication)
- Xem danh sach san pham voi bo loc (danh muc, gia, kich thuoc, mau sac)
- Tim kiem san pham
- Xem chi tiet san pham (hinh anh, bien the, mo ta)
- Gio hang (them, sua, xoa san pham)
- Dat hang va thanh toan
- Xem lich su don hang
- Quan ly tai khoan va dia chi giao hang

### Quan tri vien (Admin)
- Dashboard thong ke (doanh thu, don hang, khach hang)
- Quan ly san pham (CRUD)
- Quan ly don hang (cap nhat trang thai)
- Quan ly danh muc san pham

### Ky thuat
- API RESTful voi prefix `/api/v1`
- CORS middleware cho frontend
- Security headers (X-Frame-Options, CSP, XSS Protection)
- Rate limiting (60 req/min mac dinh, 10 req/min cho auth)
- Phan trang va sap xep du lieu
- Xu ly loi tap trung (global exception handler)
- Health check endpoint
- Seed data (du lieu mau)

## Cai dat va chay

### Yeu cau
- Docker Desktop (bao gom Docker Compose)
- Git

### Buoc 1: Clone repository
```bash
git clone <repository-url>
cd vn-fashion-shop
```

### Buoc 2: Cau hinh environment
```bash
cp .env.example .env
# Chinh sua .env neu can (mac dinh da hoat dong voi Docker)
```

### Buoc 3: Khoi dong voi Docker Compose
```bash
docker compose up -d
```

Lenh nay se khoi dong:
- **PostgreSQL** tai `localhost:5432`
- **Redis** tai `localhost:6379`
- **Backend API** tai `http://localhost:8000`
- **Frontend** tai `http://localhost:3000`

### Buoc 4: Tao database va seed du lieu
```bash
# Tao bang du lieu
docker compose exec backend python -m app.create_tables

# Them du lieu mau
docker compose exec backend python -m seed.seed_data
```

### Buoc 5: Truy cap ung dung
- **Frontend**: http://localhost:3000
- **Backend API docs**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## Tai khoan mac dinh (sau khi seed)

| Vai tro | Email | Mat khau |
|---------|-------|----------|
| Admin | admin@vnfashion.vn | Admin123! |
| Nguoi dung | user@vnfashion.vn | User123! |

## Cau truc thu muc

```
vn-fashion-shop/
├── backend/
│   ├── app/
│   │   ├── config.py          # Cau hinh ung dung
│   │   ├── database.py        # Ket noi database
│   │   ├── dependencies.py    # Dependencies (auth, rate limit)
│   │   ├── main.py            # Diem vao FastAPI
│   │   ├── models/            # SQLAlchemy models
│   │   │   ├── user.py        # User, Address
│   │   │   ├── product.py     # Product, Category, Variant
│   │   │   └── order.py       # Order, OrderItem
│   │   ├── routers/           # API endpoints
│   │   │   ├── auth.py        # Xac thuc (login, register)
│   │   │   ├── products.py    # San pham, danh muc
│   │   │   ├── cart.py        # Gio hang
│   │   │   ├── orders.py      # Don hang
│   │   │   ├── admin.py       # Quan tri
│   │   │   └── checkout.py    # Thanh toan
│   │   ├── schemas/           # Pydantic schemas
│   │   ├── services/          # Business logic
│   │   └── utils/             # Tien ich (JWT, hash, ...)
│   ├── seed/                  # Du lieu mau
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── app/               # Next.js App Router pages
│   │   │   ├── auth/          # Trang dang nhap/dang ky
│   │   │   ├── admin/         # Trang quan tri
│   │   │   ├── products/      # Trang san pham
│   │   │   └── layout.tsx     # Root layout
│   │   ├── components/        # React components
│   │   │   ├── layout/        # Header, Footer
│   │   │   ├── products/      # ProductCard, ProductGrid
│   │   │   └── ui/            # Button, Input, Modal
│   │   ├── hooks/             # Custom hooks (useAuth, useCart)
│   │   ├── lib/               # API client, utilities
│   │   └── types/             # TypeScript type definitions
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml
├── .env.example
└── README.md
```

## API Endpoints

### Auth (`/api/v1/auth`)
| Method | Endpoint | Mo ta |
|--------|----------|-------|
| POST | `/login` | Dang nhap |
| POST | `/register` | Dang ky |
| POST | `/refresh` | Lam moi token |
| GET | `/profile` | Lay thong tin ca nhan |
| POST | `/logout` | Dang xuat |

### Products (`/api/v1/products`)
| Method | Endpoint | Mo ta |
|--------|----------|-------|
| GET | `/` | Danh sach san pham (co bo loc, phan trang) |
| GET | `/{slug}` | Chi tiet san pham |
| GET | `/featured` | San pham noi bat |
| GET | `/new-arrivals` | San pham moi |
| GET | `/search?q=` | Tim kiem san pham |

### Categories (`/api/v1/categories`)
| Method | Endpoint | Mo ta |
|--------|----------|-------|
| GET | `/` | Danh sach danh muc |

### Cart (`/api/v1/cart`)
| Method | Endpoint | Mo ta |
|--------|----------|-------|
| GET | `/` | Xem gio hang |
| POST | `/items` | Them san pham vao gio |
| PATCH | `/items/{id}` | Cap nhat so luong |
| DELETE | `/items/{id}` | Xoa san pham khoi gio |

### Orders (`/api/v1/orders`)
| Method | Endpoint | Mo ta |
|--------|----------|-------|
| POST | `/` | Tao don hang |
| GET | `/` | Danh sach don hang |
| GET | `/{id}` | Chi tiet don hang |
| POST | `/{id}/cancel` | Huy don hang |

### Admin (`/api/v1/admin`)
| Method | Endpoint | Mo ta |
|--------|----------|-------|
| GET | `/metrics` | Thong ke dashboard |
| GET | `/products` | Quan ly san pham |
| POST | `/products` | Tao san pham |
| PUT | `/products/{id}` | Cap nhat san pham |
| GET | `/orders` | Quan ly don hang |
| PATCH | `/orders/{id}/status` | Cap nhat trang thai don |

## Dung ung dung

```bash
docker compose down
```

Xoa du lieu (bao gom volumes):
```bash
docker compose down -v
```

## Tac gia

Tran Quang Vu
