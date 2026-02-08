# Go-Live Checklist

## Product and policy
- [ ] Terms and Privacy pages are live and linked from submit flow.
- [ ] Consent is required before report submission.
- [ ] UI copy is neutral and evidence-first (no accusation language).

## Authentication and authorization
- [ ] Login required for submit, confirm, flag, attachment actions.
- [ ] Hidden reports are not readable via app queries.
- [ ] Duplicate confirm/flag by same uid is blocked.

## Upload and processing pipeline
- [ ] Report creation works.
- [ ] Attachment request endpoint returns signed URL with expected path.
- [ ] Browser PUT upload succeeds with correct CORS.
- [ ] Function processes image and writes `processed_uploads`.
- [ ] Commit endpoint attaches only processed + owned objects.
- [ ] Temp objects are removed after processing.

## Moderation and abuse controls
- [ ] `flag_count >= 3` hide rule works.
- [ ] Confirm safeguard against false-positive auto-hide works.
- [ ] Rate limits trigger correctly for create/confirm/flag/upload.

## Privacy and logging
- [ ] No raw OCR/user text/image bytes in application logs.
- [ ] Processed metadata is minimal and non-sensitive.
- [ ] Log access is limited to authorized operators.
- [ ] Log retention is configured and documented.

## Security and IAM
- [ ] Runtime service accounts use least privilege.
- [ ] Temp bucket is not public.
- [ ] Public bucket read policy matches product intent.
- [ ] Firestore rules and indexes deployed from repo files.

## Reliability and monitoring
- [ ] Cloud Run and Functions error alerts are active.
- [ ] Dashboard includes 5xx rate, function failures, and processing delays.
- [ ] Manual runbook exists for stuck uploads and failed processing.

## Final smoke test set
- [ ] New report with 1 image succeeds end-to-end.
- [ ] New report with 3 images succeeds end-to-end.
- [ ] Confirm/flag works with separate test accounts.
- [ ] Hidden report no longer appears on list/detail pages.
