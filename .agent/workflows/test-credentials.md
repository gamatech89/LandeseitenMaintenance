---
description: Test credentials for browser testing the LSM Platform
---

# Test Credentials

Use these credentials when testing the LSM Platform in the browser at `http://localhost:3001`.

## Admin
- **Email:** `admin@landeseiten.de`
- **Password:** Check `SEED_PASSWORD` in `.env` (currently `LsmAdmin2024!`, but may have changed)
- **Role:** `admin`

## Developer (recommended for testing)
- **Email:** `bojan@example.com`
- **Password:** `password`
- **Role:** `developer`
- **Note:** All developers use `password` as their password

## Manager / Project Manager
- **Email:** `daniel@example.com`
- **Password:** `password`
- **Role:** `manager`
- **Note:** All managers use `password` as their password

## All Users

| Name | Email | Role | Password |
|------|-------|------|----------|
| Admin | admin@landeseiten.de | admin | `SEED_PASSWORD` from .env |
| Admin User | admin@lsm.test | admin | Unknown |
| Bojan | bojan@example.com | developer | `password` |
| Stefan | stefan@example.com | developer | `password` |
| Miroslav | miroslav@example.com | developer | `password` |
| Amir | amir@example.com | developer | `password` |
| Vlad | vlad@example.com | developer | `password` |
| Daniel | daniel@example.com | manager | `password` |
| Lisa | lisa@example.com | manager | `password` |
| Yannick | yannick@example.com | manager | `password` |
| Susanne | susanne@example.com | manager | `password` |
| Laura | laura@example.com | manager | `password` |
| Jonas | jonas@example.com | manager | `password` |
| Boris | boris@gamatech.ch | viewer | Unknown |

## Test Project
- **Project ID:** `107` (Test Project)
- **URL:** `http://localhost:3001/projects/107`
- **Settings:** `http://localhost:3001/projects/107?section=settings`

## API Login Endpoint
```bash
curl -s -X POST http://localhost:8000/api/v1/login \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{"email":"bojan@example.com","password":"password"}'
```
