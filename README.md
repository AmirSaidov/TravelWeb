# TravelWeb

Проект разделён на две части:

- `tour_backend/` — Django backend (API)
- `Frontend/` — Vite/React frontend

## Требования

- Python 3.11+ (рекомендовано)
- Node.js 18+ и npm
- PostgreSQL (по умолчанию) или SQLite (fallback)

## Быстрый старт (Frontend)

```bash
cd Frontend
npm install
npm run dev
```

Vite поднимется на `http://localhost:5173`.

## Быстрый старт (Backend)

### 1) Установить зависимости

```bash
cd tour_backend
python -m venv .venv
# Windows:
.venv\\Scripts\\activate
# macOS/Linux:
# source .venv/bin/activate

pip install -r requirements.txt
```

### 2) Настроить переменные окружения

Создай файл `tour_backend/.env` на основе `tour_backend/.env.example`.

По умолчанию используется PostgreSQL. Если хочешь SQLite для локального запуска — раскомментируй строки `DB_ENGINE=django.db.backends.sqlite3` и `DB_NAME=db.sqlite3`.

### 3) Миграции и запуск

```bash
cd tour_backend
python manage.py migrate
python manage.py runserver
```

Backend будет доступен на `http://127.0.0.1:8000`.

## Запуск вместе

Открой два терминала:

1) Backend: `cd tour_backend && python manage.py runserver`
2) Frontend: `cd Frontend && npm run dev`

