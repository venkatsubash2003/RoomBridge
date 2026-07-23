# RoomBridge architecture

The browser uses cookie-authenticated REST APIs and authenticated server-sent events. Server APIs are authoritative; browser session storage is only a non-sensitive display cache.

```text
Browser + moderation console
             |
       API replicas
       /    |     \
PostgreSQL Redis  private object storage
             |
        worker replicas
      /    |     |    \
 scanner email  SMS  media sanitizer
```

- PostgreSQL stores accounts, opaque sessions, profiles, workflows, audit records, moderation state, and idempotency responses.
- Redis supplies cross-instance rate limiting, listing cache, realtime pub/sub, and asynchronous queues.
- Private object storage uses short-lived signed URLs. Uploads remain quarantined until size/type checks, malware scanning, and optional media sanitization pass.
- Workers retry encrypted notification jobs with bounded exponential backoff.
- API and worker deployments scale independently with disruption budgets and autoscaling policies.
- Append-only audit records capture security and moderation decisions. Role checks protect the moderation console and APIs.

SQLite, in-process limits, and development verification codes are local-development conveniences and are rejected or disabled by the production configuration gate.
