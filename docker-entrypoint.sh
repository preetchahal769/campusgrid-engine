#!/bin/sh
# --- CampusGrid Engine Startup Script ---
# Automatically runs migrations on start, and runs database seeding ONLY when RUN_SEED=true.

set -e

echo "🔄 Running outstanding Prisma database migrations..."
npx prisma migrate deploy

# Conditional Seeding Check
if [ "$RUN_SEED" = "true" ]; then
  echo "🌱 RUN_SEED=true detected. Running database seeding scripts..."
  npx prisma db seed || echo "⚠️ Seeding skipped or encountered a non-fatal warning."
else
  echo "⏭️ RUN_SEED is not set to 'true'. Skipping database seeding to protect existing data."
fi

echo "🚀 Database updated successfully. Launching NestJS Application..."
exec "$@"
