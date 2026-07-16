# RoomBridge

RoomBridge is an interactive product prototype for helping international students and professionals find compatible roommates, housing, and support for living together.

## Run

```bash
npm start
```

Open `http://localhost:8080`.

The application server creates `data/roombridge.sqlite` automatically. No external credentials are required for local development. To validate JavaScript:

```bash
npm run check
```

## File structure

```text
RoomBridge/
├── index.html                       Browser entry point
├── package.json                     Local commands and project metadata
├── .env.example                     Optional provider configuration
├── README.md                        Setup and project overview
├── docs/
│   ├── ARCHITECTURE.md              Current and production architecture
│   ├── API.md                       Authenticated API reference
│   ├── FEATURE_ORDER.md             Ordered feature roadmap
│   └── SECURITY.md                  Production security requirements
└── src/
    ├── js/
    │   ├── config.js                Non-secret runtime configuration
    │   ├── core/
    │   │   └── app.js               Router and core product workflows
    │   └── modules/
    │       └── life-hub.js          Safety, international, finance, home, admin
    └── styles/
        └── main.css                 Responsive application design system
├── server/
│   ├── server.js                    HTTP, REST, SSE, and static server
│   ├── database.js                  SQLite schema and database access
│   ├── auth.js                      Password, session, and verification security
│   └── services/                    Matching, AI, maps, and notifications
└── tests/
    └── api-smoke.mjs                End-to-end API smoke test
```

## Feature areas

- Secure authentication demo, verification, recovery, and session handling
- International-student and professional onboarding
- Weighted roommate matching, deal-breakers, explanations, feedback, and groups
- Room, apartment, and lease-transfer listings with rich media
- Search, maps, commute estimates, saved searches, and alerts
- Private and group messaging, attachments, translation, calls, and blocking
- Lease replacement, landlord approval, fees, documents, and handoff steps
- Household invitations, budgets, voting, shortlists, rooms, and rent splitting
- Reporting, moderation, fraud warnings, reputation, and privacy controls
- Language, currency, community, relocation, and newcomer guidance
- Affordability, move-in costs, expenses, deposits, insurance, and reminders
- Agreements, chores, shopping, maintenance, calendar, and private feedback
- Administrative moderation, verification, analytics, fraud, support, and flags

## Prototype boundaries

The primary account, profile, and API flows now use the SQLite backend and secure cookie sessions. Development verification codes remain visible when `NODE_ENV` is not `production`. OAuth, email/SMS delivery, provider maps, protected object storage, calls, insurance, and payments still require configured production providers. See [docs/API.md](docs/API.md), [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md), and [docs/SECURITY.md](docs/SECURITY.md).
