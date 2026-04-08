# OrgType

## Build & Run

- **Always use Docker** for backend services. The local system only has JDK 8; the backend requires JDK 21.
  - `docker compose up --build` to build and run everything
  - `docker compose up --build org-service` to rebuild a single service
  - Never run `gradle build` directly on the host machine — it will fail.
- **Frontend**: `cd client && npm run dev` (runs on localhost:5173, proxies API to gateway at :8080)
- **Frontend type-check**: `cd client && npx tsc --noEmit`

## Architecture

- **org-service** (:8081) — Kotlin/Spring Boot, owns the PostgreSQL database
- **game-service** (:8082) — Kotlin/Spring Boot, stateless proxy to org-service
- **gateway** (:8080) — Spring Cloud Gateway, routes `/api/org/**` and `/api/game/**`
- **client** — React + TypeScript + Vite + Tailwind CSS
- **db** — PostgreSQL 16, schema managed by Hibernate `ddl-auto: update` (no migrations)
