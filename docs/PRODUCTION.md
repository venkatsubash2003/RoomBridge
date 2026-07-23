# Production operations

## Release gates

A production release requires passing CI, migration review, staging smoke tests,
security review, backup verification, and an assigned rollback owner. Production
configuration must use HTTPS, managed PostgreSQL, shared rate limiting/queues,
private object storage, and real email delivery.

## Deployment order

1. Back up the database and verify the latest restore drill.
2. Apply backward-compatible migrations.
3. Deploy workers, then API instances, then static assets.
4. Check readiness, login, registration, messaging, upload, and moderation flows.
5. Observe errors, latency, saturation, and queue depth before completing rollout.

## Reliability targets

- Availability target: 99.9% monthly.
- API latency target: p95 below 500 ms, excluding explicitly asynchronous work.
- Recovery point objective: 15 minutes.
- Recovery time objective: 60 minutes.

## Required alerts

Alert on elevated 5xx responses, auth rejection anomalies, database saturation,
queue backlog, failed malware scans, delivery-provider failures, storage errors,
and missed backups. Every alert must link to a tested runbook.

## Data and incident controls

Keep security and moderation audit records append-only. Test account export,
account deletion, backup restoration, credential rotation, and incident
notification at least quarterly. Never log passwords, session cookies,
verification codes, document contents, or exact private addresses.
