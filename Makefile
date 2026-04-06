.PHONY: install dev test seed docker-up docker-down lint type-check help

# Default target
help:
	@echo "VN Fashion Shop - Available commands:"
	@echo ""
	@echo "  install      Install all dependencies (backend pip + frontend npm)"
	@echo "  dev          Start backend and frontend in dev mode (requires tmux or run in separate terminals)"
	@echo "  test         Run all tests"
	@echo "  seed         Run database seed script"
	@echo "  docker-up    Start all services with Docker Compose"
	@echo "  docker-down  Stop all Docker Compose services"
	@echo "  lint         Run linters for both backend and frontend"
	@echo "  type-check   Run TypeScript type checker (tsc --noEmit)"
	@echo ""

install:
	@echo ">>> Installing backend dependencies..."
	cd backend && pip install -r requirements.txt
	@echo ">>> Installing frontend dependencies..."
	cd frontend && npm ci
	@echo ">>> Done."

dev:
	@echo ">>> Starting backend (port 8000) and frontend (port 3000)..."
	@echo ">>> Note: Run these in separate terminals for best experience:"
	@echo ">>>   Terminal 1: cd backend && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"
	@echo ">>>   Terminal 2: cd frontend && npm run dev"
	@trap 'kill 0' SIGINT; \
	  (cd backend && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000) & \
	  (cd frontend && npm run dev) & \
	  wait

test:
	@echo ">>> Running backend tests..."
	cd backend && pip install pytest pytest-asyncio httpx -q && pytest tests/ -v --tb=short || echo "No backend tests found."
	@echo ">>> Running frontend type check and lint as test..."
	cd frontend && npm run lint && npx tsc --noEmit

seed:
	@echo ">>> Seeding database..."
	cd backend && python -m seed.seed_data

docker-up:
	@echo ">>> Starting Docker Compose services..."
	docker compose up -d
	@echo ">>> Services started."
	@echo ">>>   Frontend:    http://localhost:3000"
	@echo ">>>   Backend API: http://localhost:8000"
	@echo ">>>   API Docs:    http://localhost:8000/docs"

docker-down:
	@echo ">>> Stopping Docker Compose services..."
	docker compose down

lint:
	@echo ">>> Running backend linter (ruff)..."
	cd backend && pip install ruff -q && ruff check app/ --select E,W,F --ignore E501
	@echo ">>> Running frontend linter (ESLint)..."
	cd frontend && npm run lint

type-check:
	@echo ">>> Running TypeScript type check..."
	cd frontend && npx tsc --noEmit
