# OrgType

A Wordle-style typing game where players identify employees from photos in an organization chart. Built as a microservices application with Kotlin/Spring Boot, React/TypeScript, PostgreSQL, Docker, and Kubernetes.

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

- **org-service** — Owns the PostgreSQL database. Manages employees, org chart hierarchy, and data quality flags.
- **game-service** — Stateless proxy to org-service. Wraps employee data for the game client.
- **gateway** — Routes `/api/org/**` to org-service, `/api/game/**` to game-service. Handles CORS.
- **client** — React frontend. Game UI, admin panel, and session management.
- **db** — PostgreSQL 16. Schema managed by Hibernate `ddl-auto: update` (no migrations).

## Local Development

### Prerequisites

- Docker Desktop
- Node.js 20+
- Make sure ports 5173, 8080, 8081, 8082, and 5432 are free

> **Note**: The backend requires JDK 21 — always use Docker. Never run `gradle build` directly on the host.

### Run the backend

```bash
docker compose up --build
```

This starts PostgreSQL, org-service, game-service, and gateway. First build takes a few minutes; subsequent runs are fast.

To rebuild a single service after changes:
```bash
docker compose up --build org-service
```

### Run the frontend

```bash
cd client
npm install
npm run dev
```

The frontend runs on `http://localhost:5173` and proxies API requests to the gateway at `:8080`.

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

## Kubernetes (Production-grade Deployment)

The `k8s/` directory contains production-ready Kubernetes manifests demonstrating:

- Multi-replica deployments with rolling updates (`maxUnavailable: 0`)
- Liveness, readiness, and startup probes
- ConfigMaps and Secrets for configuration
- PersistentVolumeClaims for database storage
- Service discovery via stable DNS names
- Resource requests and limits
- An Ingress for external traffic

### Deploy to local Kubernetes (minikube)

```bash
# 1. Start a local cluster
minikube start --cpus=4 --memory=4096

# 2. Build images on your Mac's Docker (faster than building inside minikube)
docker compose build

# 3. Load images into minikube
minikube image load orgtype-org-service:latest
minikube image load orgtype-game-service:latest
minikube image load orgtype-gateway:latest

# 4. Apply all manifests recursively
kubectl apply -f k8s/ -R

# 5. Watch pods come up (takes ~2 minutes for Spring Boot to start)
kubectl get pods -n orgtype -w
```

When all pods show `1/1 Running`, expose the gateway:

```bash
minikube service gateway -n orgtype
```

This opens a tunnel and prints a URL. Test it:

```bash
curl http://127.0.0.1:<port>/api/org/employees
```

### Common kubectl commands

```bash
kubectl get pods -n orgtype                       # list pods
kubectl logs -n orgtype -l app=org-service        # tail logs by label
kubectl describe pod <pod-name> -n orgtype        # debug a pod
kubectl rollout restart deployment/org-service -n orgtype  # restart after rebuild
kubectl delete -f k8s/ -R                         # tear everything down
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

## Observability

The backend services expose Prometheus metrics and structured logs out of the box.

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

# Then start the observability stack (uses the same Docker network)
docker compose -f docker-compose.observability.yml up -d
```

- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3000 (anonymous viewer enabled, admin/admin for editing)

Grafana auto-loads the **OrgType Overview** dashboard with:
- HTTP request rate per service
- p95 / p99 latency
- JVM heap usage
- 5xx error rate
- Service up/down status

### Structured logging

Logs use plain text in dev (default profile) and JSON in production via the `prod` Spring profile. JSON logs include `service`, `traceId`, and `spanId` fields ready for ingestion by Datadog, Splunk, ELK, or Loki.

To enable JSON logs locally:
```bash
SPRING_PROFILES_ACTIVE=prod docker compose up
```

### Kubernetes integration

The K8s deployments include Prometheus scrape annotations (`prometheus.io/scrape`, `prometheus.io/path`, `prometheus.io/port`), so a Prometheus operator running in the cluster will automatically discover and scrape all three services.

## CI/CD

GitHub Actions runs on every push and PR to `main`:

- **backend-test** — Runs JUnit tests for org-service and game-service
- **frontend-test** — Type-checks, lints, and runs Vitest tests
- **docker-build** — Builds all Docker images (only if tests pass)

See `.github/workflows/ci.yml`.

## Project Layout

```
.
├── client/                    # React + TS frontend
├── org-service/               # Kotlin/Spring Boot — owns the database
├── game-service/              # Kotlin/Spring Boot — proxy to org-service
├── gateway/                   # Spring Cloud Gateway
├── k8s/                       # Kubernetes manifests
│   ├── namespace.yml
│   ├── configmap.yml
│   ├── ingress.yml
│   ├── db/
│   ├── org-service/
│   ├── game-service/
│   └── gateway/
├── .github/workflows/         # CI pipeline
├── docker-compose.yml         # Local dev orchestration
└── CLAUDE.md                  # Quick reference for AI assistants
```
