# OrgType

A Wordle-style typing game where players guess employee names from photos and org chart context. Built as a microservices application with Kotlin/Spring Boot, React/TypeScript, PostgreSQL, Docker, and Kubernetes.

## How It Works

Players are shown an employee's photo, role, and position in the org hierarchy. Letters of the name are partially revealed based on difficulty — the player types to fill in the rest. A correct guess earns points; wait too long and the auto-hint system gives it away.

### Game Modes

| Mode | Description |
|------|-------------|
| **Random** | Employees appear in random order |
| **Top → Down** | Traverse the org chart from leadership down |
| **Bottom → Up** | Start from individual contributors and work up |

### Difficulty Levels

| Level | Letters Pre-Filled |
|-------|-------------------|
| Easy | 75% |
| Medium | 50% |
| Hard | 25% |
| Expert | 0% |

### Scoring & Streaks

- **+1 point** per correct answer
- **+1 speed bonus** if answered in under 5 seconds
- **+2 streak bonus** at 3 consecutive correct
- **+3 streak bonus** at 5 consecutive correct
- **+5 streak bonus** at 10+ consecutive correct

Points fuel the **Peek system** — spend points to preview upcoming employees:

| Peek | Cost |
|------|------|
| Small peek (next 1) | 1 point |
| Big peek (next 3) | 3 points |

### Auto-Hint & Timeout

Every 10 seconds, a random unrevealed letter is automatically filled in. If all letters are revealed by hints before the player finishes typing, the round times out — it counts as "seen" but not "correct."

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `⌘ .` | Pause / Resume |
| `⌘ 1` | Small peek |
| `⌘ 3` | Big peek |
| `⌘ R` | Retry current |
| `⌘ B` | Previous person |
| `⌘ ⇧ N` | Next person |
| `⌘ ⇧ R` | Restart round |
| `⌘ K` | Command palette |

## Admin Panel

Accessible from the footer link. Features include:

- **JSON Import** — Drag-and-drop or paste an org chart JSON file. Preview the tree structure before importing.
- **Org Chart Management** — View, inspect, and delete imported org charts.
- **Inline Employee Editing** — During gameplay, click a revealed card to edit the employee's image URL, LinkedIn URL, role alias, or preferred name.
- **Flagging** — Flag employees with a reason (incorrect role, wrong manager, duplicate, left company, etc.) and an optional note.
- **Flag Reconciliation** — Review open flags, view employees with the same role for comparison, and resolve or dismiss flags.
- **Hide vs. Delete** — Hide removes an employee from the game but keeps them in the database. Delete fully removes them and reassigns their reports to their manager.

### Org Chart JSON Format

```json
{
  "name": "Jane Doe",
  "role": "CEO",
  "imageUrl": "https://example.com/photo.jpg",
  "linkedinUrl": "https://linkedin.com/in/janedoe",
  "reports": [
    {
      "name": "John Smith",
      "role": "VP Engineering",
      "reports": []
    }
  ]
}
```

Employees without an `imageUrl` get an auto-generated avatar.

## Architecture

```
                ┌─────────────┐
                │   client    │  React + TS + Vite (port 5173)
                └──────┬──────┘
                       │
                       ▼
                ┌─────────────┐
                │   gateway   │  Spring Cloud Gateway (port 8080)
                └──┬───────┬──┘
                   │       │
         /api/org  │       │  /api/game
                   ▼       ▼
         ┌─────────────┐ ┌──────────────┐
         │ org-service │ │ game-service │  Kotlin/Spring Boot
         │   (8081)    │ │    (8082)    │
         └──────┬──────┘ └──────┬───────┘
                │               │
                ▼               │
         ┌─────────────┐        │
         │ PostgreSQL  │◄───────┘
         │    (5432)   │
         └─────────────┘
```

- **org-service** — Owns the PostgreSQL database. Manages employees, org chart hierarchy, flags, and data quality.
- **game-service** — Stateless proxy to org-service. Wraps employee data for the game client (random, top-down, bottom-up ordering).
- **gateway** — Routes `/api/org/**` to org-service, `/api/game/**` to game-service. Handles CORS.
- **client** — React frontend with game UI, admin panel, command palette, and local session management.
- **db** — PostgreSQL 16. Schema managed by Hibernate `ddl-auto: update` (no migrations).

Player profiles, game sessions, and peek points are stored in the browser's localStorage — the backend is stateless with respect to game state.

## Local Development

### Prerequisites

- Docker Desktop
- Node.js 20+
- Ports 5173, 8080, 8081, 8082, and 5432 available

> **Note**: The backend requires JDK 21 — always use Docker. Never run `gradle build` directly on the host.

### Run the backend

```bash
docker compose up --build
```

This starts PostgreSQL, org-service, game-service, and gateway. First build takes a few minutes; subsequent runs use cached layers.

To rebuild a single service after changes:

```bash
docker compose up --build org-service
```

On first startup, the backend seeds the database with a sample org chart if no data exists.

### Run the frontend

```bash
cd client
npm install
npm run dev
```

The frontend runs at `http://localhost:5173` and proxies API requests to the gateway at `:8080`.

### Type-check the frontend

```bash
cd client
npx tsc --noEmit
```

## Testing

### Backend tests

```bash
cd org-service
./gradlew test
```

> Run inside a JDK 21 container if your host doesn't have it:
> ```bash
> docker run --rm -v "$(pwd):/app" -w /app gradle:8.12-jdk21 gradle test
> ```

### Frontend tests

```bash
cd client
npm test           # one-shot
npm run test:watch # watch mode
```

## Observability

The backend services expose Prometheus metrics and structured logs.

### Metrics

Each service exposes a `/management/prometheus` endpoint with JVM, HTTP, and DB metrics:

- `http_server_requests_seconds_count` — request rate
- `http_server_requests_seconds_bucket` — latency histogram (for p95/p99)
- `jvm_memory_used_bytes` — heap usage
- `hikaricp_connections_active` — DB connection pool (org-service)

### Run Prometheus + Grafana locally

```bash
# Start the app first
docker compose up -d

# Then start the observability stack
docker compose -f docker-compose.observability.yml up -d
```

- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3000 (anonymous viewer enabled, admin/admin for editing)

Grafana auto-provisions the **OrgType Overview** dashboard via provisioning config files in `observability/`. The dashboard includes:

- HTTP request rate per service
- p95 / p99 latency
- JVM heap usage
- 5xx error rate
- Service up/down status

### Structured logging

Logs use plain text in dev (default profile) and JSON in production via the `prod` Spring profile. JSON logs include `service`, `traceId`, and `spanId` fields ready for ingestion by Datadog, Splunk, ELK, or Loki.

```bash
SPRING_PROFILES_ACTIVE=prod docker compose up
```

## Kubernetes

The `k8s/` directory contains production-ready Kubernetes manifests demonstrating:

- Multi-replica deployments with rolling updates (`maxUnavailable: 0`)
- Liveness, readiness, and startup probes
- ConfigMaps and Secrets for configuration
- PersistentVolumeClaims for database storage
- Service discovery via stable DNS names
- Resource requests and limits
- Ingress for external traffic
- Prometheus scrape annotations for automatic metric discovery

### Deploy to local Kubernetes (minikube)

```bash
# 1. Start a local cluster
minikube start --cpus=4 --memory=4096

# 2. Build images
docker compose build

# 3. Load images into minikube
minikube image load orgtype-org-service:latest
minikube image load orgtype-game-service:latest
minikube image load orgtype-gateway:latest

# 4. Apply all manifests
kubectl apply -f k8s/ -R

# 5. Watch pods come up (~2 minutes for Spring Boot)
kubectl get pods -n orgtype -w
```

When all pods show `1/1 Running`, expose the gateway:

```bash
minikube service gateway -n orgtype
```

### Common kubectl commands

```bash
kubectl get pods -n orgtype                                # list pods
kubectl logs -n orgtype -l app=org-service                 # tail logs
kubectl describe pod <pod-name> -n orgtype                 # debug a pod
kubectl rollout restart deployment/org-service -n orgtype   # restart after rebuild
kubectl delete -f k8s/ -R                                  # tear everything down
```

### After a code change

```bash
docker compose build org-service
minikube image load orgtype-org-service:latest
kubectl rollout restart deployment/org-service -n orgtype
```

### Cleanup

```bash
minikube stop      # pause cluster, keep state
minikube delete    # destroy cluster entirely
```

## CI/CD

GitHub Actions runs on every push and PR to `main`:

- **backend-test** — Runs JUnit tests for org-service and game-service
- **frontend-test** — Type-checks, lints, and runs Vitest tests
- **docker-build** — Builds all Docker images (only if tests pass)

See `.github/workflows/ci.yml`.

## Project Layout

```
.
├── client/                          # React + TS frontend
├── org-service/                     # Kotlin/Spring Boot — owns the database
├── game-service/                    # Kotlin/Spring Boot — stateless proxy
├── gateway/                         # Spring Cloud Gateway
├── k8s/                             # Kubernetes manifests
│   ├── namespace.yml
│   ├── configmap.yml
│   ├── ingress.yml
│   ├── db/
│   ├── org-service/
│   ├── game-service/
│   └── gateway/
├── observability/                   # Prometheus + Grafana configs
├── .github/workflows/               # CI pipeline
├── docker-compose.yml               # Local dev orchestration
└── docker-compose.observability.yml # Prometheus + Grafana stack
```
