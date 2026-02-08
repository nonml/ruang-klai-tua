# Logging and PDPA Guidelines

## Principles
- Log minimum necessary data only.
- Never log raw image bytes.
- Never log full user-submitted free text by default.
- Prefer IDs and status codes over content.

## Allowed log content
- Request IDs / trace IDs
- Report IDs / attachment IDs
- Operation result (`ok`, `error`, `status`)
- Timing and retry counts
- Non-sensitive counters and metrics

## Avoid in logs
- Personal names, phone numbers, citizen IDs
- Raw OCR text extracts
- Full addresses or precise personal location traces
- Full auth tokens or session cookies

## Storage and access
- Restrict log access to authorized project operators.
- Enable audit logging for admin access.
- Configure retention for operational needs only.

## Incident handling
- If sensitive data appears in logs, treat as privacy incident.
- Remove affected logs where possible and rotate credentials if needed.
- Document remediation and preventive fix in code.
