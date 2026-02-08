# IAM Minimum Roles (MVP)

Use dedicated service accounts and assign only required roles.

## Cloud Run service account (Next.js API)
Recommended minimum:
- `roles/datastore.user` (Firestore read/write)
- `roles/iam.serviceAccountTokenCreator` (only if needed for signing flows via IAM)
- `roles/storage.objectViewer` on public bucket (if server reads public objects)
- `roles/storage.objectAdmin` on temp bucket only if server must manage temp objects directly

## Cloud Functions service account (blurAndPublish)
Recommended minimum:
- `roles/storage.objectViewer` on temp bucket
- `roles/storage.objectCreator` (or objectAdmin) on public bucket
- `roles/datastore.user` (write processed metadata and pending records)
- `roles/logging.logWriter` (normally inherited in runtime)

## General rules
- Do not use project-wide `Editor` for runtime identities.
- Scope bucket roles to bucket-level IAM where possible.
- Use separate service accounts for Cloud Run and Functions.
- Audit IAM periodically and remove unused bindings.
