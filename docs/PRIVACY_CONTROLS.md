# Privacy controls

RoomBridge stores account identity, public roommate preferences, listing data, conversations, household/lease workflows, verification results, private uploaded documents, moderation history, and operational audit data.

Implemented controls include private-by-default documents, exact-address omission from public listing responses, authenticated downloads, account export, anonymized account deletion, and restricted moderation access. Verification documents are never added to public profiles.

Before launch, the operator must define and enforce retention windows for unverified accounts, expired sessions/codes, rejected uploads, messages, deleted accounts, reports, appeals, audit records, backups, and provider logs. Object-storage lifecycle and database cleanup jobs must match the approved schedule.

The production privacy notice must name the controller/operator, contact channel, purposes and legal bases, subprocessors, international transfers, regional rights, appeal/complaint routes, retention periods, and any automated decision support. Automated fraud signals must remain reviewable and must not independently determine housing eligibility.
