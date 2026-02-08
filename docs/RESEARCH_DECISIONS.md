# Research Decisions (MVP Baseline)

This file captures the implementation decisions extracted from Deep Research so we can remove temporary research notes from the repo.

## 1) Upload pipeline
- Keep the current pattern: create report -> signed PUT to temp -> blur function -> commit attachment.
- Reason: strongest privacy/security for MVP.

## 2) Attachment hijacking protection
- Keep reportId + uid in object path.
- Validate ownership in server endpoints before generating upload URL and before commit.

## 3) Signed URL policy
- Expiry: 10 minutes.
- File types: JPG/PNG/WEBP only.
- Max size: 10MB per image.
- Enforce both client-side and server-side checks.

## 4) CORS for browser PUT
- Allow app origins explicitly (prod domain + localhost).
- Methods: PUT, OPTIONS.
- Allow Content-Type headers used by upload requests.

## 5) Storage write path
- Keep client SDK writes disabled for temp/public objects.
- Allow uploads only via signed URL flow.

## 6) Firestore access model
- Read reports only for statuses: PENDING, VERIFIED, HELD.
- Require authentication for all write actions.
- Prevent duplicate confirm/flag from same uid.

## 7) Anti-abuse limits
- Keep day + minute + IP fingerprint limits for create/confirm/flag/upload endpoints.
- Tighten further only after production usage data.

## 8) Query/index strategy
- Avoid `where !=` for list/search.
- Prefer positive filters and explicit indexes.

## 9) MVP data strategy
- Keep queries simple for MVP.
- Add indexes only for queries we actively use.

## 10) Blur pipeline scope
- Continue face blur and safe pixelation as baseline.
- Extend with stronger plate/text PII detection in next iteration.

## 11) Logging and PDPA
- Do not log raw user text/images.
- Keep only minimal operational metadata.
- Define retention and restricted access.

## 12) Thai wording safety
- Use neutral, evidence-first wording.
- Avoid accusatory terms in UI and policy copy.

## 13) Auto-hide safeguard
- Keep hide threshold at 3 flags.
- Prevent immediate hide when confirmations indicate stronger validity.

## 14) Production deployment pattern
- Cloud Run (Next.js) + Firebase Functions (background) + Firebase Auth/Firestore/Storage.

## 15) IAM principle
- Use least-privilege service accounts per runtime.
- Avoid broad Editor roles.

## 16) Observability baseline
- Structured logs, error alerts, processing lag checks.

## 17) Cost baseline
- Expect Vision API + egress to dominate costs.
- Keep monthly cost forecast and update after real traffic.

## 18) Go-live discipline
- Use explicit smoke tests covering privacy, security rules, and upload pipeline integrity.
