# Kubernetes deployment

Replace `ROOMBRIDGE_IMAGE` with an immutable image digest. Create
`roombridge-secrets` through the platform's external secret controller; never
commit a Secret manifest. It must provide `PUBLIC_ORIGIN`, `DATABASE_URL`,
`REDIS_URL`, object-storage credentials and bucket, email credentials,
`METRICS_TOKEN`, and scanner credentials.

TLS should terminate at the managed ingress or gateway. Apply network policies
that allow API/worker egress only to PostgreSQL, Redis, object storage, email,
scanner, maps, and AI providers. Restrict `/internal/metrics` to the monitoring
network in addition to its bearer token.
