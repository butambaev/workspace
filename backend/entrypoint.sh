#!/bin/sh
set -e
python - <<'PY'
import os, time, psycopg2
for i in range(60):
    try:
        psycopg2.connect(dbname=os.environ.get('POSTGRES_DB','workspace'), user=os.environ.get('POSTGRES_USER','workspace'),
            password=os.environ.get('POSTGRES_PASSWORD','workspace'), host=os.environ.get('POSTGRES_HOST','db'),
            port=os.environ.get('POSTGRES_PORT','5432')).close()
        print('PostgreSQL готов'); break
    except Exception:
        print('Ожидание PostgreSQL...'); time.sleep(1)
else:
    raise SystemExit('PostgreSQL недоступен')
PY
python manage.py makemigrations accounts projects tasks notifications --noinput
python manage.py migrate --noinput
if [ "$SEED_DEMO" = "1" ]; then python manage.py seed_demo; fi
exec python manage.py runserver 0.0.0.0:8000
