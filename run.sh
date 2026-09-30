#!/usr/bin/env bash

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_ROOT"

BACKEND_PID=""
FRONTEND_PID=""

echo "========================================"
echo " Starting LabelLens"
echo "========================================"

cleanup() {
    echo
    echo "Stopping LabelLens..."

    if [ -n "${FRONTEND_PID}" ]; then
        kill "${FRONTEND_PID}" 2>/dev/null || true
    fi

    if [ -n "${BACKEND_PID}" ]; then
        kill "${BACKEND_PID}" 2>/dev/null || true
    fi

    wait 2>/dev/null || true

    echo "LabelLens stopped."
}

trap cleanup INT TERM EXIT


# --------------------------------------------------
# Validate environment
# --------------------------------------------------

if [ ! -d ".venv" ]; then
    echo "ERROR: .venv does not exist."
    echo "Run ./setup.sh first."
    exit 1
fi

if [ ! -d "frontend/node_modules" ]; then
    echo "ERROR: frontend/node_modules does not exist."
    echo "Run ./setup.sh first."
    exit 1
fi

source .venv/bin/activate

if ! command -v node >/dev/null 2>&1 || ! command -v npm >/dev/null 2>&1; then
    echo "ERROR: Node.js and npm are required."
    echo "Run ./setup.sh first."
    exit 1
fi

if ! command -v curl >/dev/null 2>&1; then
    echo "ERROR: curl is required."
    exit 1
fi

# --------------------------------------------------
# Check required ports
# --------------------------------------------------

if command -v lsof >/dev/null 2>&1; then

    if lsof -i :8000 >/dev/null 2>&1; then
        echo "ERROR: Port 8000 is already in use."
        echo "Stop the existing process and run ./run.sh again."
        exit 1
    fi

    if lsof -i :3000 >/dev/null 2>&1; then
        echo "ERROR: Port 3000 is already in use."
        echo "Stop the existing process and run ./run.sh again."
        exit 1
    fi

fi


# --------------------------------------------------
# Start backend
# --------------------------------------------------

echo
echo "Starting FastAPI backend..."
echo "API: http://127.0.0.1:8000"

uvicorn backend.app.main:app \
    --host 127.0.0.1 \
    --port 8000 &

BACKEND_PID=$!


# --------------------------------------------------
# Wait for backend
# --------------------------------------------------

echo "Waiting for backend..."

for _ in {1..20}; do

    if curl -fsS http://127.0.0.1:8000/health >/dev/null 2>&1; then
        break
    fi

    if ! kill -0 "$BACKEND_PID" 2>/dev/null; then
        echo "ERROR: FastAPI failed to start."
        exit 1
    fi

    sleep 0.5

done


if ! curl -fsS http://127.0.0.1:8000/health >/dev/null 2>&1; then
    echo "ERROR: Backend health check failed."
    exit 1
fi

echo "Backend is healthy."


# --------------------------------------------------
# Start frontend
# --------------------------------------------------

echo
echo "Starting Next.js frontend..."
echo "UI: http://localhost:3000"

cd "$PROJECT_ROOT/frontend"

npm run dev &

FRONTEND_PID=$!

cd "$PROJECT_ROOT"


# --------------------------------------------------
# Wait for frontend
# --------------------------------------------------

echo "Waiting for frontend..."

for _ in {1..30}; do

    if curl -fsS http://localhost:3000 >/dev/null 2>&1; then
        break
    fi

    if ! kill -0 "$FRONTEND_PID" 2>/dev/null; then
        echo "ERROR: Next.js failed to start."
        exit 1
    fi

    sleep 0.5

done


if ! curl -fsS http://localhost:3000 >/dev/null 2>&1; then
    echo "ERROR: Frontend health check failed."
    exit 1
fi


echo
echo "========================================"
echo " LabelLens is running"
echo "========================================"
echo
echo "Dashboard: http://localhost:3000"
echo "API:       http://127.0.0.1:8000"
echo "API Docs:  http://127.0.0.1:8000/docs"
echo
echo "Press Ctrl+C to stop both servers."
echo


wait
