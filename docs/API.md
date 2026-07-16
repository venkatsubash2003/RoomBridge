# RoomBridge API

All protected endpoints use an opaque `HttpOnly` session cookie.

## Foundation

- `POST /api/auth/register`
- `POST /api/auth/verify`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `GET /api/health`
- `GET /api/events` — authenticated server-sent event stream

## Profiles, listings, and matching

- `GET|PUT /api/profile`
- `GET|POST /api/listings`
- `GET /api/matches`
- `POST /api/match-feedback`
- `GET|POST /api/saved-searches`

Exact listing addresses are deliberately excluded from public listing responses.

## Communication and safety

- `GET|POST /api/conversations`
- `GET|POST /api/conversations/:id/messages`
- `POST /api/conversations/:id/block`
- `POST /api/reports`
- `GET|POST /api/verifications`

## Groups and housing transitions

- `POST /api/households`
- `POST /api/households/:id/members`
- `POST /api/lease-workflows`

## Maps, notifications, and AI

- `GET /api/commute`
- `GET /api/notifications`
- `POST /api/ai/translate`
- `POST /api/ai/fraud-check`

Provider-backed translation activates only when `OPENAI_API_KEY` is configured. Fraud detection retains local deterministic safeguards even without an AI provider.
