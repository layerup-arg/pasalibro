#!/usr/bin/env bash
# Crea una base temporal, aplica los scripts y corre el escenario de prueba de permisos.
# Uso: PGHOST=/tmp PGPORT=5432 PGUSER=postgres supabase/tests/run.sh
set -e
cd "$(dirname "$0")/.."
DB=pasalibro_test
psql -q -c "drop database if exists $DB" -c "create database $DB"
psql -q -d $DB -c "do \$\$ begin create role anon nologin; exception when duplicate_object then null; end \$\$;" \
           -c "do \$\$ begin create role authenticated nologin; exception when duplicate_object then null; end \$\$;"
sed '/^create role/d' tests/mock_supabase.sql | psql -q -v ON_ERROR_STOP=1 -d $DB
psql -q -v ON_ERROR_STOP=1 -d $DB -f 001_base.sql 2>/dev/null
psql -q -v ON_ERROR_STOP=1 -d $DB -f 002_modelo.sql
psql -q -d $DB -f tests/rls_test.sql
