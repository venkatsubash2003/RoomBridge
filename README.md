# RoomBridge

RoomBridge is an interactive product prototype for helping international students and professionals find compatible roommates, housing, and support for living together.

## Run

```bash
npm start
```

Open `http://localhost:8080`.

No installation or external credentials are required. To validate JavaScript:

```bash
npm run check
```

## File structure

```text
RoomBridge/
├── index.html                       Browser entry point
├── package.json                     Local commands and project metadata
├── README.md                        Setup and project overview
├── docs/
│   ├── ARCHITECTURE.md              Current and production architecture
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

Browser storage and visible verification codes are used only to make the flows testable. OAuth, code delivery, maps, real-time communication, protected documents, moderation services, notifications, insurance, and payments require production backend integrations. See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) and [docs/SECURITY.md](docs/SECURITY.md).
