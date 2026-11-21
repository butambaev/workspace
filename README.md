# WorkSpace — управление проектами, командами и задачами

Полноценное веб-приложение: Django REST Framework + PostgreSQL + React (Vite), JWT-авторизация, роли (Admin / Manager / Member), Kanban с drag & drop, уведомления, дашборд со статистикой.

## ⚠️ Честно о тестировании

Архив собран в изолированной среде **без доступа в интернет и без Docker**, поэтому:

- ✅ Проверено: синтаксис всего Python-кода (`compileall`).
- ❌ **Не запускалось**: Docker Compose, PostgreSQL, миграции, `npm install`, сборка и запуск Frontend, регистрация/JWT/Kanban/права «вживую».
- Код написан аккуратно, но при первом запуске возможны мелкие ошибки (опечатка, версия пакета). Если что-то упадёт — выполните `docker compose logs backend` / `docker compose logs frontend` и пришлите мне текст ошибки, я исправлю.
- Миграции Django не лежат в архиве — они **генерируются автоматически при старте** контейнера (`makemigrations` → `migrate`). Для разработки это нормально; перед продакшеном закоммитьте сгенерированные файлы.
- Режим Docker — **разработческий** (`runserver`, `vite dev`). Для продакшена нужны gunicorn, сборка фронтенда и nginx.

## Технологии

Backend: Python 3.12, Django 5.1, DRF, Simple JWT, PostgreSQL 16, django-filter, drf-spectacular, django-cors-headers.
Frontend: React 18, JavaScript, Vite, React Router, Axios, Context API, Lucide React, Recharts.
Инфраструктура: Docker, Docker Compose.

## 1. Установка Docker

- Windows / macOS: установите [Docker Desktop](https://www.docker.com/products/docker-desktop/) и запустите его.
- Linux: https://docs.docker.com/engine/install/ (плюс плагин `docker compose`).

Проверка:
```bash
docker --version
docker compose version
```

## 2. Открыть проект в VS Code

Распакуйте `WorkSpace-Fullstack.zip` → в VS Code: **File → Open Folder** → выберите папку `workspace`. Терминал: **Terminal → New Terminal**.

## 3. Создать `.env`

```bash
cp .env.example .env
```
Windows (PowerShell): `Copy-Item .env.example .env`

Файл `.env` необязателен для первого запуска (в `docker-compose.yml` есть значения по умолчанию), но для реальных данных обязательно поменяйте `DJANGO_SECRET_KEY` и пароль БД.

## 4. Запуск

```bash
docker compose up --build
```
При старте автоматически: поднимается PostgreSQL → backend ждёт готовности БД → создаются и применяются миграции → создаются демо-данные (если БД пустая) → запускаются Backend и Frontend.

## 5. Проверка

- Frontend: http://localhost:5173
- Backend API: http://localhost:8000/api/
- Swagger: http://localhost:8000/api/docs/
- Redoc: http://localhost:8000/api/redoc/
- Django admin: http://localhost:8000/admin/

Быстрая проверка backend:
```bash
curl -X POST http://localhost:8000/api/auth/login/ -H "Content-Type: application/json" -d "{\"username\":\"admin\",\"password\":\"admin12345\"}"
```

## Тестовые пользователи

| Логин | Пароль | Роль |
|---|---|---|
| admin | admin12345 | Admin |
| manager | manager12345 | Manager |
| anna, ivan, olga | member12345 | Member |

Первый зарегистрированный в пустой БД пользователь автоматически становится Admin. Новые пользователи — Member; роль меняет Admin на странице «Команда».

Пересоздать демо-данные вручную:
```bash
docker compose exec backend python manage.py seed_demo --force
```
Создать суперпользователя:
```bash
docker compose exec backend python manage.py createsuperuser
```

## Управление контейнерами

```bash
docker compose ps                 # список контейнеров
docker compose logs -f            # все логи
docker compose logs -f backend    # логи backend
docker compose stop               # остановить
docker compose down               # остановить и удалить контейнеры (данные БД сохранятся)
docker compose down -v            # + удалить данные БД
```

## Роли и права (проверяются на Backend)

- **Admin** — всё, включая смену ролей пользователей, видит все проекты.
- **Manager** — создаёт проекты; редактирует проекты, задачи и участников **только своих** проектов.
- **Member** — видит проекты, где он участник; меняет статус **только назначенных ему** задач; комментирует.
- Пользователь не видит чужие проекты и задачи (фильтрация в queryset).

## API (основное)

`POST /api/auth/register|login|refresh/` · `GET|PATCH /api/auth/profile/` · `POST /api/auth/change-password/` · `/api/projects/` (CRUD, `POST /{id}/members/`, `DELETE /{id}/members/{user_id}/`) · `/api/tasks/` (CRUD, фильтры `status, priority, project, assignee, mine, overdue`, `search`, `ordering`, `GET|POST /{id}/comments/`) · `GET /api/dashboard/` · `GET /api/team/` · `PATCH /api/team/{id}/role/` · `GET /api/notifications/` · `PATCH /api/notifications/{id}/read/` · `POST /api/notifications/read-all/` · `GET /api/notifications/unread-count/`.

## Структура

```
backend/  config, accounts, projects, tasks, teams, notifications, Dockerfile, entrypoint.sh
frontend/ src/{components,pages,services,context,hooks,styles}, Dockerfile
docker-compose.yml  .env.example  .gitignore
```

## Известные ограничения

- Уведомления — через REST (опрос каждые 30 с), без WebSocket.
- Аватар хранится как уменьшенное изображение (data-URL) в БД.
- Логин по username (не по email).
