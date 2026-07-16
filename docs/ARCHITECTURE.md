# RoomBridge architecture

## Current prototype

RoomBridge is a dependency-free browser application. The entry point is `index.html`; state is persisted in browser storage so every workflow can be demonstrated without infrastructure or credentials.

```text
index.html
  ├── src/js/config.js
  ├── src/js/core/app.js
  ├── src/js/modules/life-hub.js
  └── src/styles/main.css
```

`core/app.js` owns routing, authentication demo flows, onboarding, matching, listings, messaging, lease transfer, and household formation. `modules/life-hub.js` owns safety, newcomer support, financial tools, post-move tools, and administrative workflows.

## Production target

The production application should use separate deployable boundaries:

```text
apps/
  web/                    User-facing web application
  admin/                  Restricted moderation application
services/
  identity/               Authentication, sessions, verification
  profiles/               Preferences and privacy-safe public profiles
  matching/               Eligibility, scoring, feedback, groups
  listings/               Listings, media, search, map data
  messaging/              WebSocket delivery, receipts, blocking
  safety/                 Reports, moderation, fraud signals
  households/             Groups, voting, expenses, agreements
  payments/               Licensed provider integration
packages/
  schemas/                Shared validated data contracts
  authorization/          Roles and permission policies
  observability/          Audit logs, metrics, tracing
```

## Security boundaries

- Store sessions in secure, `HttpOnly`, `SameSite` cookies.
- Keep identity documents in restricted encrypted storage; expose only verification results.
- Never expose immigration documents or detailed status publicly.
- Strip image metadata and scan all uploads before publication.
- Keep exact addresses private until both parties consent.
- Enforce authorization on the server for every document, conversation, and administrative action.
- Maintain immutable moderation and payment audit logs.
- Use licensed providers for money movement and insurance.

See [SECURITY.md](SECURITY.md) for the production checklist.
