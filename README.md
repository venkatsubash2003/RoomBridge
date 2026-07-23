# RoomBridge

RoomBridge is a full-stack roommate and housing marketplace for international students and professionals. It includes authenticated profiles and matching, moderated listings, private messaging, household and lease workflows, trust-and-safety operations, private uploads, data export/deletion, and a restricted moderation console.

## Local development

Requires Node.js 22.

```bash
npm ci
npm start
```

Open `http://localhost:8080`. Development uses SQLite at `data/roombridge.sqlite` and returns verification codes in API responses. These codes are never returned in production.

```bash
npm run verify
npm run test:api
npm run test:e2e
```

## Production architecture

Production startup fails unless HTTPS origin, PostgreSQL, Redis, private S3-compatible storage, malware scanning, email, SMS, maps, OpenAI, job encryption, and metrics credentials are configured. API and worker processes scale independently; Redis provides distributed limits, cache, realtime fan-out, and job coordination.

Use the container and Kubernetes manifests under `deploy/`. Apply PostgreSQL migrations from `migrations/`, deploy workers before APIs, and validate readiness before sending traffic.

## Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [API](docs/API.md)
- [Security](docs/SECURITY.md)
- [Production operations](docs/PRODUCTION.md)
- [Performance and scaling](docs/PERFORMANCE.md)
- [Launch checklist](docs/LAUNCH_CHECKLIST.md)
- [Privacy controls](docs/PRIVACY_CONTROLS.md)

Payments, insurance, and video calling are intentionally not offered. Enabling them requires separately approved providers, compliance design, and product work; the current application does not imply those capabilities.
