#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# startcycle.sh — CampusGrid Engine: Local Build Verification
# ─────────────────────────────────────────────────────────────────────────────
# Run this before pushing to main to verify all three Docker targets build
# cleanly on your local machine. If any stage fails, fix it before pushing.
#
# Usage:
#   chmod +x scripts/startcycle.sh
#   ./scripts/startcycle.sh
# ─────────────────────────────────────────────────────────────────────────────
set -e

BOLD='\033[1m'
GREEN='\033[0;32m'
RED='\033[0;31m'
CYAN='\033[0;36m'
RESET='\033[0m'

echo ""
echo -e "${BOLD}${CYAN}══════════════════════════════════════════════${RESET}"
echo -e "${BOLD}${CYAN}  CampusGrid Engine — Build Cycle Verification${RESET}"
echo -e "${BOLD}${CYAN}══════════════════════════════════════════════${RESET}"
echo ""

# ─── Stage 1: testing-env ───────────────────────────────────────────────────
echo -e "${BOLD}▶ [1/3] Building testing-env...${RESET}"
if docker build --target testing-env -t campusgrid-engine:cycle-testing . --quiet; then
  echo -e "${GREEN}  ✅ testing-env — PASS${RESET}"
else
  echo -e "${RED}  ❌ testing-env — FAILED${RESET}"
  exit 1
fi

echo ""

# ─── Stage 2: staging-env ───────────────────────────────────────────────────
echo -e "${BOLD}▶ [2/3] Building staging-env...${RESET}"
if docker build --target staging-env -t campusgrid-engine:cycle-staging . --quiet; then
  echo -e "${GREEN}  ✅ staging-env — PASS${RESET}"
else
  echo -e "${RED}  ❌ staging-env — FAILED${RESET}"
  exit 1
fi

echo ""

# ─── Stage 3: production-env ────────────────────────────────────────────────
echo -e "${BOLD}▶ [3/3] Building production-env...${RESET}"
if docker build --target production-env -t campusgrid-engine:cycle-production . --quiet; then
  echo -e "${GREEN}  ✅ production-env — PASS${RESET}"
else
  echo -e "${RED}  ❌ production-env — FAILED${RESET}"
  exit 1
fi

echo ""
echo -e "${BOLD}${GREEN}══════════════════════════════════════════════${RESET}"
echo -e "${BOLD}${GREEN}  🎉 All 3 stages passed. Safe to push to main.${RESET}"
echo -e "${BOLD}${GREEN}══════════════════════════════════════════════${RESET}"
echo ""

# Clean up local verify images
docker rmi campusgrid-engine:cycle-testing campusgrid-engine:cycle-staging campusgrid-engine:cycle-production 2>/dev/null || true
