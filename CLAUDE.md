# OrgType

## Build & Run

- **Database**: `docker compose up db` — only Postgres runs in Docker
- **Backend** (run locally, requires JDK 21):
  - `cd org-service && ./gradlew bootRun`
  - `cd game-service && ./gradlew bootRun`
  - `cd gateway && ./gradlew bootRun`
  - All services default to `localhost` — no env vars needed for local dev
- **Frontend**: `cd client && npm run dev` (runs on localhost:5173, proxies API to gateway at :8080)
- **Frontend type-check**: `cd client && npx tsc --noEmit`
- **Full Docker** (CI/deploy only): `docker compose up --build`

## Architecture

- **org-service** (:8081) — Kotlin/Spring Boot, owns the PostgreSQL database
- **game-service** (:8082) — Kotlin/Spring Boot, stateless proxy to org-service
- **gateway** (:8080) — Spring Cloud Gateway, routes `/api/org/**` and `/api/game/**`
- **client** — React + TypeScript + Vite + Tailwind CSS
- **db** — PostgreSQL 16, schema managed by Hibernate `ddl-auto: update` (no migrations)
