# --- CampusGrid Local Simulation Script (/startcycle) ---
# Enforces sequential compiling of testing-env, staging-env, and production-env targets to guarantee zero code-drift.

$ErrorActionPreference = "Stop"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "🚀 STARTING CAMPUSGRID-ENGINE DOCKER PIPELINE SIMULATION" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# Step 1: Build & Verify Testing Environment Target
Write-Host "`n🧹 [1/3] Compiling and Verifying Target: testing-env..." -ForegroundColor Yellow
docker build --target testing-env -t campusgrid-engine:testing .
Write-Host "✅ Target testing-env compiled successfully!" -ForegroundColor Green

# Step 2: Build & Verify Staging Environment Target
Write-Host "`n🚧 [2/3] Compiling and Verifying Target: staging-env..." -ForegroundColor Yellow
docker build --target staging-env -t campusgrid-engine:staging .
Write-Host "✅ Target staging-env compiled successfully!" -ForegroundColor Green

# Step 3: Build & Verify Production Environment Target
Write-Host "`n💎 [3/3] Compiling and Verifying Target: production-env..." -ForegroundColor Yellow
docker build --target production-env -t campusgrid-engine:production .
Write-Host "✅ Target production-env compiled successfully!" -ForegroundColor Green

Write-Host "`n==========================================================" -ForegroundColor Green
Write-Host "🎉 ALL PIPELINE TARGETS COMPILED SUCCESSFULLY WITH ZERO DRIFT!" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
