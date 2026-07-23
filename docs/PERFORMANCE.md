# Performance verification

Run the baseline test against an isolated staging environment:

```bash
k6 run -e BASE_URL=https://staging.example.com tests/load/api.js
```

The committed gate requires fewer than 1% failed requests, p95 latency below
500 ms, and p99 below 1 second. Before increasing production limits, add
authenticated scenarios for listing search, conversations, matching, uploads,
and moderation using disposable seeded accounts.

Capacity tests must monitor API CPU/memory, PostgreSQL connections and query
latency, Redis operations, worker backlog, object-storage errors, delivery
provider limits, and scanner throughput. Record the tested image digest,
dataset size, infrastructure shape, and resulting safe operating limit.
