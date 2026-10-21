# Project Context: Balos Lead Conversion Engine

## System Overview
Balos Lead Conversion Engine is an enterprise operations dashboard and automated AI WhatsApp conversational engine built exclusively for Dubai real estate agencies. It manages multi-channel lead intake, AI qualification, viewing scheduling, and instant human agent takeover.

## Verified Tech Stack & Infrastructure
- **Next.js 14 (App Router)**: Server-rendered dashboard on port `3002`.
- **TypeScript & Tailwind CSS**: Strict typing, Dubai luxury aesthetic (obsidian, slate, gold accents).
- **Supabase (@supabase/ssr & PostgreSQL)**: Strict Row Level Security (RLS), real-time tables, session storage.
- **WAHA (WhatsApp HTTP API)**: Multi-session WhatsApp integration and webhook dispatch.
- **Python ReportLab Engine**: Executive PDF generation (`create_balos_summary_pdf.py`, `generate_report.py`).
- **MCP Security Layer**: Custom Model Context Protocol tool integrations with scoped database access.

## Directory Structure
- `src/app/`: Next.js App Router routes (overview, inbox, leads, viewings, settings).
- `src/components/`: Real-time chat feed, human takeover toggle, pipeline funnel widgets.
- `supabase/`: Schema migrations, RLS policies, seed fixtures, and view definitions.
- `sessions/`: Raw conversation sessions and forensic audit logs.
- `scripts/`: Data ingestion, seed utilities, and verification scripts.
- `INSTALL.md`: Client agency installation, environment configuration, and deployment runbook.

## Core Commands
```bash
# Start dashboard on dedicated port 3002
npm run dev

# Production build and typecheck
npm run build

# Generate executive PDF update report
python generate_report.py

# Run competitive advantage PDF generator
python create_competitive_advantage_pdf.py
```

## Architectural Guidelines & Conventions
- **Port Reservation**: Always run on `http://localhost:3002` to avoid collision with client apps.
- **Security & RLS**: All client interactions must go through authenticated Supabase client sessions enforcing RLS. Never expose the service role key to browser code.
- **Language Policy**: Dashboard UI is exclusively English (after removing UI toggle clutter), while the underlying WhatsApp AI conversational engine supports multilingual chat (Arabic, English, French, Russian).
- **Timezone**: All operational times rendered in Gulf Standard Time (GST / UTC+4); stored internally as ISO-8601 UTC.
