# Project Memory: Balos Lead Conversion Engine

## Chronology of Completed Work
- **Initial Setup**: Scaffolded Next.js App Router dashboard with Supabase SSR and Tailwind CSS.
- **UAE Market & Revenue Analytics**: Added currency formatting (AED), property type classifications (off-plan vs. secondary), and viewing scheduling pipelines.
- **Arabic Localization & Pruning**: Initially implemented full Arabic RTL dashboard support, then strategically removed Arabic UI toggles based on broker feedback to keep the admin interface clean in English while maintaining full multilingual Arabic capabilities in the WhatsApp AI engine.
- **Forensic System Audit**: Completed comprehensive forensic analysis covering media URLs, auth boundaries, state desynchronization, and deduplication.
- **Competitive Pricing Analysis**: Benchmarked Balos against Gallabox, WATI, and Intercom; solidified the unlimited AI conversations pricing model for Dubai agencies.
- **2026-10-20**: Implemented Secure MCP Layer for Balos to enforce scoped database actions.
- **2026-10-20**: Finalized high-conversion WhatsApp broker outreach messaging.
- **2026-10-21**: Implemented Enterprise External CRM Synchronization Hub (`/settings/crm`) supporting Follow Up Boss, HubSpot, GoHighLevel, Zoho CRM, Salesforce, and custom webhooks/Zapier. Added automated sync triggers on qualification/viewing/handoff, real-time audit logs, and 1-click sync actions from Leads Directory and Inbox Dossier.

## Key Invariants
- UI Language: Clean English; WhatsApp messaging: Multilingual (Arabic, English, Russian, French).
- State Machine: `NEW` -> `CONTACTED` -> `QUALIFIED` -> `VIEWING_SCHEDULED` -> `WON` / `LOST` / `PAUSED`.
- Takeover Status: `controlled_by` field toggles between `'ai'` and `'human'`.

## Active Backlog
- [ ] Implement live audio note transcription and playback in the inbox thread viewer.
- [ ] Add automated broker response time SLA tracking badge.
- [x] Set up external CRM synchronization and automated lead dispatching.
