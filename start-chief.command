#!/bin/bash
# ─────────────────────────────────────────────────────
# CHIEF — macOS Launcher
# Double-click from Finder to start both servers.
# ─────────────────────────────────────────────────────

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

GREEN='\033[0;32m'
DIM='\033[2m'
RESET='\033[0m'

echo ""
echo -e "${GREEN}CHIEF${RESET} — starting backend + frontend..."
echo ""

BACKEND_PID=""
FRONTEND_PID=""

cleanup() {
  echo ""
  echo -e "${DIM}Shutting down...${RESET}"
  [ -n "$BACKEND_PID" ] && kill "$BACKEND_PID" 2>/dev/null
  [ -n "$FRONTEND_PID" ] && kill "$FRONTEND_PID" 2>/dev/null
  wait 2>/dev/null
  echo -e "${GREEN}Done.${RESET}"
  exit 0
}

trap cleanup SIGINT SIGTERM EXIT

# ── Backend ──
echo -e "${DIM}Starting backend (port 8000)...${RESET}"
(
  cd "$SCRIPT_DIR/backend"
  source .venv/bin/activate 2>/dev/null || true
  uvicorn main:app --host 0.0.0.0 --port 8000 --reload
) &
BACKEND_PID=$!

# ── Frontend ──
echo -e "${DIM}Starting frontend (port 3000)...${RESET}"
(
  cd "$SCRIPT_DIR/frontend"
  pnpm dev
) &
FRONTEND_PID=$!

# ── Wait for readiness ──
echo -e "${DIM}Waiting for servers...${RESET}"

wait_for_port() {
  local port=$1
  local attempt=0
  while ! curl -sf "http://localhost:$port" > /dev/null 2>&1; do
    attempt=$((attempt + 1))
    if [ $attempt -ge 60 ]; then
      echo -e "Timed out waiting for port $port"
      return 1
    fi
    sleep 1
  done
}

wait_for_port 8000 &
W1=$!
wait_for_port 3000 &
W2=$!
wait $W1 $W2

echo ""
echo -e "${GREEN}Both servers ready.${RESET} Opening browser..."
echo ""

open "http://localhost:3000"

echo -e "  Backend:  ${DIM}http://localhost:8000${RESET}"
echo -e "  Frontend: ${GREEN}http://localhost:3000${RESET}"
echo ""
echo -e "  ${DIM}Press Ctrl+C to stop both servers.${RESET}"
echo ""

wait
