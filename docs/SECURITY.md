# Security controls

## Implemented

- Scrypt password hashing, cryptographically random one-time codes, opaque expiring sessions, secure `HttpOnly` cookies, logout, password reset, and session revocation.
- Strict input limits, same-origin mutation checks, distributed abuse limits, trusted-proxy opt-in, CSP, HSTS, frame denial, cross-origin isolation headers, request IDs, and structured logs.
- Server-side authorization for conversations, households, listings, documents, uploads, and moderation actions.
- Private quarantined uploads with signed URLs, size/type validation, malware scanning, and media-sanitizer integration.
- User blocking, reports, listing review, identity/listing verification review, suspensions, bans, appeals, and append-only moderation/audit history.
- Account export and anonymized deletion, encrypted queued message payloads, secrets supplied only through environment configuration, and authenticated metrics.

## Operational requirements

- Terminate TLS at an approved ingress and keep HSTS enabled.
- Rotate provider, database, Redis, metrics, and encryption credentials; never place secrets in manifests or images.
- Restrict database, Redis, object storage, scanner, metrics, and admin access by network policy and least privilege.
- Review scanner failures and quarantined files; do not bypass quarantine.
- Alert on authentication anomalies, elevated errors, queue delay, provider failure, database/Redis saturation, and missed backups.
- Run dependency, container, DAST, and infrastructure scans in the release environment.
- Complete penetration testing and privacy, fair-housing, sanctions, accessibility, and incident-response reviews before launch.

Payments, insurance, and calls are out of scope and disabled. They must not be enabled without provider and compliance review.
