# Launch checklist

The repository is deployable, but these environment-specific actions cannot be completed in source control.

## Infrastructure

- Provision managed PostgreSQL with point-in-time recovery and test `scripts/restore-postgres.sh`.
- Provision authenticated, encrypted Redis and private S3-compatible object storage with lifecycle rules.
- Configure TLS ingress, DNS, network policies, workload identity, autoscaling limits, dashboards, paging, and log retention.
- Supply every variable marked production-required in `.env.example` through a secrets manager.
- Configure and contract email, SMS, maps, malware scanning/media sanitization, and OpenAI providers.
- Run PostgreSQL/Redis integration, browser, image, vulnerability, restore, failover, and load tests in staging.

## Operations and governance

- Assign moderation coverage, appeal SLAs, abuse escalation, incident commander rotation, and customer-support ownership.
- Approve the final privacy notice, terms, retention schedule, subprocessors, cookie treatment, and breach process.
- Complete privacy, accessibility, fair-housing/anti-discrimination, sanctions, consumer-protection, and security reviews for every launch jurisdiction.
- Replace the clearly marked legal templates in the root HTML pages with approved text and operator contact information.
- Define SLOs and load thresholds from measured staging traffic, then tune replicas, pools, limits, and cache TTLs.

Do not expose production traffic until every item has an owner, evidence, and approval date.
