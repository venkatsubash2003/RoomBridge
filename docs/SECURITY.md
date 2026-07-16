# Production security checklist

The browser prototype demonstrates user experience, not production security.

## Identity

- Use an audited OIDC identity provider.
- Require email verification and offer phone-based MFA.
- Configure Google and Apple credentials server-side.
- Rate-limit registration, login, recovery, and verification.
- Hash passwords using Argon2id or delegate password storage to the identity provider.

## Privacy

- Collect only necessary immigration-related information.
- Make status verification optional and consent-based.
- Never publish documents or detailed visa information.
- Encrypt sensitive fields and implement deletion/export requests.
- Apply address-level access policies and mutual-consent disclosure.

## Marketplace safety

- Scan files for malware and images for prohibited content.
- Remove EXIF location information.
- Detect duplicate images and listings using perceptual hashes.
- Provide reporting, appeal, blocking, and emergency escalation paths.
- Combine automated fraud signals with trained human review.

## Communication and payments

- Authorize every WebSocket subscription and attachment request.
- Scan links and attachments.
- Warn about advance-payment and off-platform-payment scams.
- Use a compliant payment processor; never store card or bank credentials.
- Complete applicable fair-housing, money-transmission, sanctions, and privacy reviews.
