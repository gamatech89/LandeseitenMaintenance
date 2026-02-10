---
description: How to start the LSM Platform for development
---

# Starting LSM Platform

## Backend (Laravel API)

```bash
cd /Users/bmarkovic/Documents/Projects/ManagmentApp
php artisan serve
```

Runs on: http://127.0.0.1:8000

## Frontend (React/Vite)

```bash
cd /Users/bmarkovic/Documents/Projects/ManagmentApp/apps/web
npm run dev
```

Runs on: http://localhost:3000

## Kill All Servers

```bash
killall node php
```

Or kill specific ports:
```bash
lsof -ti :3000 | xargs kill
lsof -ti :8000 | xargs kill
```
