# Cost Model (MVP, Pay-as-you-go)

## High-level expectation
Main cost drivers are usually:
- Vision API processing
- Public image egress bandwidth

Firestore/Auth/Functions/Cloud Run are often low at MVP scale if free quotas are not exceeded.

## Working estimate ranges
- Low usage (~1k reports/month): low double-digit USD or below, often mostly Vision + egress.
- Medium usage (~10k reports/month): likely dominated by Vision API and storage egress.

## What to track monthly
- Number of uploaded images
- Vision API calls by feature
- Total egress GB from public bucket
- Cloud Run request volume and instance time
- Function execution count and duration

## Optimization levers
- Reduce unnecessary Vision feature calls
- Compress/resize images before processing
- Cache public image responses appropriately
- Keep query/index design efficient to reduce wasted reads
