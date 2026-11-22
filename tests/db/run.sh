#!/usr/bin/env bash
# Tests supabase/schema.sql against a real Postgres.
#   PGADMIN_URL  connection string for a superuser (default: local socket as current user)
# Scenario 1: fresh database + access rules.  Scenario 2: upgrade from the original schema.
set -euo pipefail

cd "$(dirname "$0")/../.."
ADMIN_URL="${PGADMIN_URL:-postgresql:///postgres}"
base="${ADMIN_URL%/*}"

run() { psql -v ON_ERROR_STOP=1 -q -At -o /dev/null "$@" 2>&1 | { grep -v "skipping$" || true; }; }

fresh_db() {
  run "$ADMIN_URL" -c "drop database if exists $1" -c "create database $1"
  run "$base/$1" -f tests/rig/supabase-stub.sql
}

echo "── fresh database"
fresh_db dw_test_fresh
run "$base/dw_test_fresh" -f supabase/schema.sql
run "$base/dw_test_fresh" -f supabase/schema.sql   # idempotent
run "$base/dw_test_fresh" -f tests/db/assertions.sql

echo "── upgrade from the original schema"
fresh_db dw_test_legacy
run "$base/dw_test_legacy" -f tests/db/legacy-schema.sql
run "$base/dw_test_legacy" -f supabase/schema.sql
run "$base/dw_test_legacy" -f supabase/schema.sql  # idempotent
run "$base/dw_test_legacy" -f tests/db/legacy-assertions.sql
run "$base/dw_test_legacy" -f tests/db/assertions.sql

echo "All database checks passed."
