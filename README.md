# Balos Lead Conversion Engine (v2.0)

> **Enterprise Operations Dashboard & Autonomous WhatsApp Lead Conversion Engine built exclusively for Dubai Real Estate Agencies.**

Balos Lead Conversion Engine v2 combines conversational AI qualification, instant human broker takeover, multi-format WhatsApp property dispatch, an Enterprise CRM Synchronization Hub, and a native Remote Model Context Protocol (MCP) server for external AI agents.

Built with **Next.js 14 (App Router)**, **TypeScript**, **Tailwind CSS**, **Supabase (`@supabase/ssr` & PostgreSQL RLS)**, **WAHA (WhatsApp HTTP API)**, and **n8n AI Workflows**.

---

## 🚀 What's New in v2.0

### 1. 🤖 AI Chat Co-Pilot & Draft Assist
* **One-Click AI Draft Generation (`✨ Sparkles`)**: Human brokers can generate tailored, high-converting WhatsApp replies powered by **NVIDIA DeepSeek** via n8n.
* **Deep Real Estate Context Injection**: Every AI draft automatically consumes:
  * **Lead Details**: Full name and sanitized E.164 phone number.
  * **Buyer Persona**: Investor, luxury end-user, first-time buyer, or overseas relocator.
  * **Budget in AED**: Exact min and max budget ranges.
  * **Preferred Market**: Off-plan developments vs. ready secondary market.
  * **Target Communities**: Downtown Dubai, Dubai Marina, Palm Jumeirah, Business Bay, JVC, Dubai Hills, etc.
  * **Category & Layout**: Bedrooms (Studio to 5+ BR), penthouses, villas, or townhouses.
  * **UAE Golden Visa Seeker Flag**: Automatically highlighted for properties AED 2.0M+.
  * **Broker Notes**: Private agent context and previous objections.
  * **Chat History**: Full transcript of the last 10 chronological messages.
* **Review, Edit & Send**: Drafts load directly into the message composer for immediate personalization before dispatch.
* **Zero-Collision Human Takeover**: As soon as a human agent takes over or sends a message, `ai_paused: true` and `controlled_by = 'human'` are enforced instantly, preventing automated AI replies from speaking over the broker.

---

### 2. 💬 WhatsApp Message Composer (`MessageInputBar`)
A comprehensive Dubai real estate sales terminal inside the WhatsApp chat thread:

* **WhatsApp Rich Text Formatting**: Full support for `*bold*`, `_italics_`, `~strike~`, linebreaks, and emojis (`Enter` to send, `Shift + Enter` for newlines).
* **Pre-Configured Real Estate Snippets**: 1-click insertion of 5 high-converting templates:
  1. *Viewing Confirmation*: Dates, times, assigned advisor, and gate clearance.
  2. *Sales Gallery Directions*: Developer sales pavilion location, valet parking, and check-in details.
  3. *Off-Plan Payment Structure*: 60/40 milestone payment plan breakdowns (20% down, 40% construction, 40% handover at 0% interest).
  4. *UAE Golden Visa (AED 2.0M+)*: 10-year residency eligibility breakdown.
  5. *Direct Broker Check-in*: Seamless introduction when a licensed broker steps in.
* **Interactive Property Suggestions & Showcase**:
  * Search active inventory by project title, developer, or community.
  * **Direct Dispatch**: 1-click sends cover image/video and full luxury property card to WhatsApp.
  * **Insert to Composer**: Loads all formatted specs into the input bar for customized editing.
  * *Formatted Specs*: Formatted AED price, layout, market type, handover date, payment plan breakdown, projected ROI %, DLD Trakheesi permit number, Golden Visa badge, PDF brochure link, and video tour link.
* **Multi-Format File Attachments**:
  * Direct upload to Supabase Storage (`property-media` / `chat-attachments/`).
  * Supports Images (`.jpg`, `.png`, `.webp`), Videos (`.mp4`, `.mov`, `.webm`), and Documents (`.pdf`, `.doc`, `.docx`, `.xls`, `.xlsx`).
  * External URL attachments support.
  * Visual attachment chip preview with thumbnail, name, file size, and remove button.
* **Dual-Delivery Resilience**: Dispatches via authenticated n8n webhook to WAHA with fallback local persistence in Supabase for optimistic, zero-lag UI updates.

---

### 3. 🔌 Native Remote MCP Server (`/api/mcp`)
A built-in **Model Context Protocol (MCP)** server enabling external AI agents (**Claude Desktop**, **Cursor**, **ChatGPT**, or custom LLM bots) to interact securely with your agency database:

| Tool Name | Scope | Description |
| :--- | :--- | :--- |
| `list_leads` | `leads:read` | Filter leads by pipeline stage, temperature, source, or search keyword. |
| `get_lead` | `leads:read` | Inspect full buyer dossier, property preferences, and conversation history. |
| `search_properties`| `inventory:read` | Search available inventory by community, budget AED, bedrooms, or category. |
| `get_roi_summary` | `roi:read` | Executive conversion metrics, booked viewings, and pipeline deal value in AED. |
| `list_viewings` | `viewings:read` | Retrieve scheduled in-person and virtual walkthrough appointments. |
| `update_lead_status`| `leads:write` | Advance pipeline stages (`QUALIFIED`, `VIEWING_SCHEDULED`, `CLOSED_WON`, etc.). |
| `send_whatsapp_message` | `messages:write` | Dispatch real-time WhatsApp messages directly to leads or phone numbers. |

#### Claude Desktop Configuration (`claude_desktop_config.json`)
```json
{
  "mcpServers": {
    "balos-lead-engine": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "https://your-domain.com/api/mcp"]
    }
  }
}
```

---

### 4. 🔄 Enterprise CRM Synchronization Hub (`/settings/crm`)
Native two-way synchronization engine connecting Balos to your primary CRM:

* **Supported Providers**:
  * **Follow Up Boss (FUB)**
  * **HubSpot**
  * **GoHighLevel (GHL)**
  * **Zoho CRM**
  * **Salesforce**
  * **Custom Webhooks** (Zapier, Make, custom endpoints)
* **Automated Sync Triggers**:
  * `sync_on_create`: On new lead creation.
  * `sync_on_qualified`: When lead reaches qualified criteria.
  * `sync_on_viewing`: When a viewing walkthrough is booked.
  * `sync_on_handoff`: When a human broker takes over.
  * `sync_on_stage_change`: On any pipeline progression.
* **1-Click Manual Sync**:
  * Directly from the **Inbox Lead Dossier** (`Sync to CRM`).
  * Directly from the **Leads Directory Table** via row-level sync actions.
* **Audit Trail & Forensics**: `crm_sync_logs` table stores full JSON request/response payloads, HTTP status codes, latency in milliseconds, and error messages.

---

### 5. 🏢 Interactive Property Showcase Modal (`PropertyInfoModal`)
* Full-screen luxury property inspection with photo galleries, video walkthrough player, payment schedule visualizer, and DLD Trakheesi regulatory badges.
* 1-click **Share to WhatsApp** action to immediately deliver marketing collateral to active buyer threads.

---

### 6. 👤 Agent Personal Workspace & Navigation
* **Personal Overview (`/`)**: Tailored dashboard for assigned agents highlighting personal active handoff queues, assigned leads, and upcoming scheduled viewings.
* **Agent Profile Settings (`/settings/profile`)**: Manage agent contact info, WhatsApp notification settings, and custom message signatures.
* **Role-Based Navigation**: Agency Principals have access to Agency Settings, Team Management, MCP, and CRM Hub; individual brokers see their personalized operational workspace.
* **Live SLA Queue Ticker**: Real-time counter updating every 10 seconds tracking response wait times (`Waiting 4m`, `Waiting 18m`) for urgent human takeovers.

---

### 7. ⚖️ Privacy, Security & Compliance
* **Row-Level Security (RLS)**: Enforced across all tables (`leads`, `messages`, `properties`, `crm_integrations`, `crm_sync_logs`).
* **WhatsApp Meta Verification**: Dedicated public routes at `/privacy`, `/privacy-policy`, and `/terms`.

---

## 🛠️ Tech Stack & Infrastructure

* **Framework**: Next.js 14 (App Router)
* **Styling**: Tailwind CSS (Dubai Obsidian & Gold palette)
* **Database & Auth**: Supabase PostgreSQL with `@supabase/ssr` and Row-Level Security (RLS)
* **WhatsApp Gateway**: WAHA (WhatsApp HTTP API)
* **Automation & AI Workflows**: n8n with NVIDIA DeepSeek LLM
* **Protocol Support**: Model Context Protocol (MCP) Remote Server
* **Executive Reports**: Python ReportLab PDF Generation

---

## 📦 Installation & Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/mrtee-xs/-Balos-LCE.git
   cd -Balos-LCE
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env.local` file based on `.env.example`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   N8N_AGENT_MESSAGE_WEBHOOK_URL=https://n8n.balos.tech/webhook/balos-agent-message
   ```

4. **Run Database Migrations**:
   Execute the migration scripts located in `supabase/migrations/` in your Supabase SQL editor:
   * `20261020_mcp_phase1_hardened.sql`
   * `20261021_crm_integrations.sql`

5. **Start Development Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3002](http://localhost:3002) in your browser.

---

## 📄 License & Commercial Rights

Copyright © 2026 Balos Tech. All rights reserved. Built exclusively for UAE real estate operations.
