# MVP Plan (เรื่องใกล้ตัว)

## Scope (2 Weeks)

MVP focuses on the **school category** first to validate the workflow and safety model before expanding.

## MVP Features
1. **LINE login** (must be traceable)
2. **Nearby page** with map + latest reports
3. **Submit page** with 7-field form + image upload
4. **Report detail page** with status + confirm/flag actions
5. **Status system**
   - `PENDING` default
   - `VERIFIED` after validation rules
   - `HELD` for high-risk content
   - `HIDDEN` when policy threshold is reached
6. **Auto-blur** before publish/storage
7. **Risk gate (rules/LLM hook)**
8. **Crowd confirmation**
   - move to `VERIFIED` after at least 2 confirmations from different accounts

## 7-Field Form (MVP)
- Evidence images 1-3 (required)
- Location (required)
- School (search/select + manual fallback)
- Problem type (dropdown)
- Severity (low/medium/high)
- Observation note (preset + short text <= 200 chars)
- Observed date (defaults to today, editable)

## Problem Categories (MVP Dropdown)
- Bathroom / sanitation
- Water supply
- Electricity / lighting
- Building damage / danger
- Classroom / learning equipment
- School-front safety / crossing / traffic
- School lunch (observation only, no accusation)

## Phase 0 Checklist (MVP Pilot)
- [ ] LINE login + consent (Terms/PDPA)
- [ ] 7-field form + upload + nearby map
- [ ] status flow `PENDING/VERIFIED/HELD/HIDDEN`
- [ ] confirm + flag actions
- [ ] baseline risk rules (keyword + PII regex)
- [ ] auto-blur pipeline hook
- [ ] LINE OA share card template

## Phase 0 Metrics
- At least 30 reports in 14 days
- At least 20% 7-day return users
- Less than 5% high-risk leakage to public surfaces

## Notes
- Evidence-first language only
- No accusation / no ranking
- Consent required before submit
- Login required for all write actions
