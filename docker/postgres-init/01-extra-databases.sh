#!/bin/sh
# Creates the shadow database Prisma Migrate needs and the database the
# integration tests truncate, so a clean clone can run migrations and tests
# without any manual setup.
set -eu

for name in $(echo "${POSTGRES_MULTIPLE_DATABASES:-}" | tr ',' ' '); do
  [ -z "$name" ] && continue
  echo "creating database $name"
  psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<SQL
    SELECT 'CREATE DATABASE "$name"'
    WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '$name')\gexec
SQL
done
