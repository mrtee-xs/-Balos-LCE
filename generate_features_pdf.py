import os
import sys
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.pdfgen import canvas

# ----------------------------------------------------------------------
# Numbered Canvas for "Page X of Y" and Running Headers/Footers
# ----------------------------------------------------------------------
class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, total_pages):
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748B"))

        # Do not draw running header on cover/first page
        if self._pageNumber > 1:
            # Running Header
            self.drawString(40, 755, "Balos Lead Conversion Engine (v2.0) — Feature Specification & Catalog")
            self.setStrokeColor(colors.HexColor("#E2E8F0"))
            self.setLineWidth(0.5)
            self.line(40, 747, 572, 747)

        # Running Footer (all pages)
        self.setStrokeColor(colors.HexColor("#E2E8F0"))
        self.setLineWidth(0.5)
        self.line(40, 42, 572, 42)

        self.drawString(40, 30, "Confidential — For Internal & Partner Advisory Use Only · Balos Real Estate AIOS")
        page_str = f"Page {self._pageNumber} of {total_pages}"
        self.drawRightString(572, 30, page_str)
        self.restoreState()


def build_pdf(filename="Balos_Features_Specification_v2.pdf"):
    doc = SimpleDocTemplate(
        filename,
        pagesize=letter,
        leftMargin=40,
        rightMargin=40,
        topMargin=50,
        bottomMargin=50
    )

    styles = getSampleStyleSheet()

    # Custom Palette
    c_obsidian = colors.HexColor("#0B132B")
    c_gold = colors.HexColor("#C59B27")
    c_teal = colors.HexColor("#0D9488")
    c_slate = colors.HexColor("#334155")
    c_muted = colors.HexColor("#64748B")
    c_bg_light = colors.HexColor("#F8FAFC")
    c_border = colors.HexColor("#CBD5E1")

    # Typography styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=24,
        leading=28,
        textColor=c_obsidian,
        spaceAfter=6
    )

    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=11,
        leading=16,
        textColor=c_slate,
        spaceAfter=15
    )

    h1_style = ParagraphStyle(
        'Heading1_Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=15,
        leading=19,
        textColor=c_obsidian,
        spaceBefore=14,
        spaceAfter=6,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        'Heading2_Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=15,
        textColor=c_teal,
        spaceBefore=8,
        spaceAfter=4,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'Body_Custom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13.5,
        textColor=c_slate,
        spaceAfter=6
    )

    bullet_style = ParagraphStyle(
        'Bullet_Custom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=13,
        textColor=c_slate,
        leftIndent=12,
        firstLineIndent=-8,
        spaceAfter=3
    )

    callout_style = ParagraphStyle(
        'Callout_Text',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=8.5,
        leading=12.5,
        textColor=c_obsidian
    )

    table_header = ParagraphStyle(
        'TH',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=11,
        textColor=colors.white
    )

    table_cell = ParagraphStyle(
        'TC',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=11,
        textColor=c_slate
    )

    table_cell_bold = ParagraphStyle(
        'TC_Bold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=11,
        textColor=c_obsidian
    )

    story = []

    # ------------------------------------------------------------------
    # COVER / HEADER BANNER
    # ------------------------------------------------------------------
    header_data = [
        [
            Paragraph("<b>BALOS LEAD CONVERSION ENGINE (v2.0)</b>", title_style),
            Paragraph("<font color='#C59B27'><b>ENTERPRISE AI SPECIFICATION</b></font><br/><font color='#64748B' size='8'>Dubai Real Estate Edition</font>", ParagraphStyle('HRight', parent=styles['Normal'], alignment=2, leading=11))
        ]
    ]
    header_table = Table(header_data, colWidths=[380, 152])
    header_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
        ('TOPPADDING', (0, 0), (-1, -1), 0),
        ('LEFTPADDING', (0, 0), (-1, -1), 0),
        ('RIGHTPADDING', (0, 0), (-1, -1), 0),
    ]))
    story.append(header_table)
    story.append(Spacer(1, 4))

    story.append(Paragraph(
        "Autonomous WhatsApp Lead Conversion Engine, Human Broker Co-Pilot, Remote Model Context Protocol (MCP) Server & Enterprise CRM Synchronization Hub built exclusively for Dubai Real Estate Brokerages.",
        subtitle_style
    ))

    # Meta Tags Bar
    meta_data = [[
        Paragraph("<b>Version:</b> 2.0.0 Production", table_cell),
        Paragraph("<b>Market:</b> Dubai (DLD Licensed)", table_cell),
        Paragraph("<b>Stack:</b> Next.js 14 · Supabase · WAHA · n8n", table_cell),
        Paragraph("<b>Deployment:</b> balos.tech", table_cell)
    ]]
    meta_table = Table(meta_data, colWidths=[130, 130, 172, 100])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#F1F5F9")),
        ('BOX', (0, 0), (-1, -1), 0.5, c_border),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 10))

    # ------------------------------------------------------------------
    # EXECUTIVE SUMMARY
    # ------------------------------------------------------------------
    story.append(Paragraph("Executive Overview & Platform Mission", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=c_gold, spaceBefore=1, spaceAfter=6))
    story.append(Paragraph(
        "In the ultra-competitive Dubai luxury and off-plan real estate market, lead conversion velocity is the single biggest determinant of commission revenue. Over 68% of international inquiries arrive outside standard UAE business hours (overseas buyers, night-time portal browsing on Property Finder and Bayut). Traditional brokerages lose high-value deals due to slow response times, fragmented manual CRM entry, and language barriers.",
        body_style
    ))
    story.append(Paragraph(
        "<b>Balos Lead Conversion Engine (v2)</b> eliminates these leakages by providing a 24/7/365 autonomous conversational agent on WhatsApp with sub-15 second response SLAs, seamless human takeover, live CRM sync, and deep Model Context Protocol (MCP) tooling for external agent workflows.",
        body_style
    ))

    # Callout Box: High Level Impact
    impact_box = [[
        Paragraph(
            "<b>Key Platform Metrics:</b><br/>"
            "• <b>Sub-15s WhatsApp SLA:</b> Real-time qualification, inventory lookup, and viewing booking.<br/>"
            "• <b>100% Anti-Hallucination:</b> Property search strictly queries live Supabase listings with DLD Trakheesi permits.<br/>"
            "• <b>Zero-Collision Takeover:</b> Instant bot silencing when a human broker speaks or drafts.",
            callout_style
        )
    ]]
    impact_table = Table(impact_box, colWidths=[532])
    impact_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#FEF3C7")),
        ('BOX', (0, 0), (-1, -1), 1, c_gold),
        ('LEFTPADDING', (0, 0), (-1, -1), 10),
        ('RIGHTPADDING', (0, 0), (-1, -1), 10),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(impact_table)
    story.append(Spacer(1, 10))

    # ------------------------------------------------------------------
    # CORE FEATURE MATRIX (TABLE)
    # ------------------------------------------------------------------
    story.append(Paragraph("Comprehensive Platform Capabilities Matrix", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=c_gold, spaceBefore=1, spaceAfter=6))

    matrix_data = [
        [
            Paragraph("Module", table_header),
            Paragraph("Primary Features & Functionality", table_header),
            Paragraph("Key Business Advantage", table_header)
        ],
        [
            Paragraph("<b>1. Autonomous WhatsApp AI Engine</b>", table_cell_bold),
            Paragraph("• Sub-15s response 24/7/365<br/>• Native English & Arabic dialect detection<br/>• Deterministic property search & viewing booking<br/>• Typing realism & seen (blue ticks) emulation", table_cell),
            Paragraph("Captures overseas & night-owl buyers with zero staff overhead.", table_cell)
        ],
        [
            Paragraph("<b>2. AI Co-Pilot & Draft Assist (v2)</b>", table_cell_bold),
            Paragraph("• 1-Click '✨ AI Draft' in inbox composer<br/>• Injects budget AED, communities, history & notes<br/>• Powered by Gemini 3.8 Flash + local fallback<br/>• Auto-silences bot upon agent interaction", table_cell),
            Paragraph("10x broker drafting speed with elite Dubai advisory tone.", table_cell)
        ],
        [
            Paragraph("<b>3. WhatsApp Sales Terminal Bar</b>", table_cell_bold),
            Paragraph("• Rich formatting (*bold*, _italics_, emojis)<br/>• 5 High-converting Dubai snippets (Visa, Valet, Plans)<br/>• 1-Click property suggestion picker with media card<br/>• Multi-format attachment upload (PDF, Video, Images)", table_cell),
            Paragraph("Closes deals directly in WhatsApp with zero platform friction.", table_cell)
        ],
        [
            Paragraph("<b>4. Omnichannel Live Inbox</b>", table_cell_bold),
            Paragraph("• Split-screen 3-column operational layout<br/>• Real-time Supabase WebSockets (zero reload)<br/>• 1-Click 'Take Over' and 'Hand Back to AI'<br/>• Live buyer dossier (score, stage, budget, notes)", table_cell),
            Paragraph("Gives brokers full visibility and control in real-time.", table_cell)
        ],
        [
            Paragraph("<b>5. Remote MCP Server (/api/mcp)</b>", table_cell_bold),
            Paragraph("• 7 Enterprise tools for Claude Desktop & Cursor<br/>• List leads, search properties, ROI summary<br/>• Trigger live WhatsApp message dispatch via agent", table_cell),
            Paragraph("Allows external AI agents to act as fully licensed brokers.", table_cell)
        ],
        [
            Paragraph("<b>6. Enterprise CRM Sync Hub</b>", table_cell_bold),
            Paragraph("• Two-way sync: Follow Up Boss, HubSpot, GHL, Zoho<br/>• Auto-sync on Lead Create, Qualified, Viewing, Handoff<br/>• Full forensic audit logs with latency & payloads", table_cell),
            Paragraph("Zero manual CRM data entry for broker sales teams.", table_cell)
        ],
        [
            Paragraph("<b>7. Executive Operations KPI Hub</b>", table_cell_bold),
            Paragraph("• 6-Card metric grid (Pipeline AED, Commission AED)<br/>• Median reply SLA and after-hours tracking<br/>• 'Needs You' SLA ticker (Waiting 4m, 18m)<br/>• Interactive live bot demo modal with QR code", table_cell),
            Paragraph("Empowers agency principals with real-time operational truth.", table_cell)
        ],
        [
            Paragraph("<b>8. Inventory & Showcase Suite</b>", table_cell_bold),
            Paragraph("• Off-plan & secondary property management<br/>• DLD Trakheesi permit tracking & QR validation<br/>• UAE Golden Visa auto-tagging (AED 2.0M+)<br/>• Interactive modal with video walkthroughs", table_cell),
            Paragraph("Complete regulatory compliance and luxury buyer appeal.", table_cell)
        ]
    ]

    matrix_table = Table(matrix_data, colWidths=[120, 262, 150])
    matrix_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), c_obsidian),
        ('BOX', (0, 0), (-1, -1), 0.5, c_border),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, c_bg_light]),
    ]))
    story.append(matrix_table)
    story.append(Spacer(1, 10))

    story.append(PageBreak())

    # ------------------------------------------------------------------
    # MODULE DEEP DIVES
    # ------------------------------------------------------------------

    # --- Module 1 ---
    story.append(Paragraph("1. Autonomous WhatsApp Conversational AI Engine", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=c_gold, spaceBefore=1, spaceAfter=6))
    story.append(Paragraph(
        "Operating 24/7/365 via the WAHA WhatsApp HTTP Gateway and n8n orchestration, the conversational engine engages inbound prospective buyers within 15 seconds. Unlike generic bots, Balos is trained strictly on Dubai Land Department (DLD) protocols, UAE residency visa rules, and local community geography.",
        body_style
    ))
    story.append(Paragraph("<b>Detailed Capabilities:</b>", body_style))
    story.append(Paragraph("• <b>Dual-Language Dialect Detection:</b> Seamlessly identifies Arabic (Standard & Gulf dialects) and English. Accurately extracts Arabic numerals, quantities (مليون = million, ألف = thousand), and layouts (غرفة = bedroom, استوديو = studio).", bullet_style))
    story.append(Paragraph("• <b>Zero-Hallucination Inventory Tooling:</b> When a lead mentions a community or budget, the engine triggers the <code>Search_Properties</code> tool against verified Supabase inventory. If no unit matches, it states so transparently and suggests adjacent areas rather than inventing stock.", bullet_style))
    story.append(Paragraph("• <b>Natural Human Presence Emulation:</b> Before dispatching, the engine sends WhatsApp 'Blue Ticks' (Send Seen) followed by an authentic typing state ('Start Typing') for 2–3 seconds to mirror natural human broker cadence.", bullet_style))
    story.append(Paragraph("• <b>Autonomous Viewing Scheduling:</b> Connects with Google Calendar via <code>Check_Availability</code> and <code>Book_Viewing</code> tools. Identifies whether buyer is overseas (prioritizing Zoom Walkthroughs) or local resident (Physical Site Visits with valet check-in).", bullet_style))
    story.append(Paragraph("• <b>Intelligent Triage & Human Escalation:</b> Detects when a lead requests a human, asks about negotiation/price discounts, prepares to pay a reservation deposit, or requires legal/tax guidance. Immediately alerts licensed agents.", bullet_style))
    story.append(Spacer(1, 8))

    # --- Module 2 ---
    story.append(Paragraph("2. AI Chat Co-Pilot & Draft Assist (v2.0 Signature Feature)", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=c_gold, spaceBefore=1, spaceAfter=6))
    story.append(Paragraph(
        "Designed to accelerate licensed brokers without taking away their personal touch. When stepping into a conversation, agents can click <b>'✨ AI Draft'</b> to instantly generate an on-brand, consultative advisory message tailored to the lead's exact situation.",
        body_style
    ))
    story.append(Paragraph("• <b>Deep Context Aggregation:</b> Automatically bundles buyer name, persona (Investor High Yield, Capital Gain, End-User), budget range in AED, target communities, bedroom layout, Golden Visa eligibility, broker private notes, and recent 10 messages.", bullet_style))
    story.append(Paragraph("• <b>Dual-Engine Reliability:</b> Evaluated via Google Gemini 3.8 Flash in n8n with 3x automatic retry and an infallible local Next.js circuit-breaker fallback. Ensures 100% response uptime under any network condition.", bullet_style))
    story.append(Paragraph("• <b>Zero-Collision State Guard:</b> Taking over or sending any human message automatically locks <code>ai_paused: true</code> and <code>controlled_by: 'human'</code>, permanently stopping bot interference until explicitly handed back.", bullet_style))
    story.append(Spacer(1, 8))

    # --- Module 3 ---
    story.append(Paragraph("3. Dubai Sales Terminal Message Composer (`MessageInputBar`)", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=c_gold, spaceBefore=1, spaceAfter=6))
    story.append(Paragraph(
        "A purpose-built real estate sales cockpit directly embedded into the active chat window:",
        body_style
    ))
    story.append(Paragraph("• <b>5 Pre-Configured High-Converting Snippets:</b> Instant 1-click insertion of Viewing Confirmation, Sales Gallery Directions (with valet instructions), 60/40 Payment Plan structure, UAE Golden Visa (AED 2.0M+) advisory, and Direct Broker introduction.", bullet_style))
    story.append(Paragraph("• <b>Interactive Property Suggestion Picker:</b> Allows brokers to search inventory and choose between <i>'1-Click Direct Send'</i> (dispatches cover media + full formatted specs card to WhatsApp immediately) or <i>'Insert to Composer'</i> for custom additions.", bullet_style))
    story.append(Paragraph("• <b>Rich Media Attachments:</b> Direct file upload to Supabase Storage supporting photos, video walkthrough tours, official developer PDF brochures, and floor plans.", bullet_style))
    story.append(Spacer(1, 8))

    # --- Module 4 ---
    story.append(Paragraph("4. Remote Model Context Protocol (MCP) Server (`/api/mcp`)", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=c_gold, spaceBefore=1, spaceAfter=6))
    story.append(Paragraph(
        "A native, secure Remote MCP Server enabling external AI clients (Claude Desktop, Cursor, ChatGPT, custom LLMs) to act directly as authorized real estate assistants across your agency database:",
        body_style
    ))

    mcp_table_data = [
        [Paragraph("Tool Identifier", table_header), Paragraph("Scope", table_header), Paragraph("Enterprise Function", table_header)],
        [Paragraph("<code>list_leads</code>", table_cell_bold), Paragraph("leads:read", table_cell), Paragraph("Query leads by stage, temperature, source, or search keyword.", table_cell)],
        [Paragraph("<code>get_lead</code>", table_cell_bold), Paragraph("leads:read", table_cell), Paragraph("Retrieve full buyer dossier, property criteria & chat history.", table_cell)],
        [Paragraph("<code>search_properties</code>", table_cell_bold), Paragraph("inventory:read", table_cell), Paragraph("Search active inventory by community, budget, bedrooms, category.", table_cell)],
        [Paragraph("<code>get_roi_summary</code>", table_cell_bold), Paragraph("roi:read", table_cell), Paragraph("Calculate pipeline value, commission potential, and booking metrics.", table_cell)],
        [Paragraph("<code>list_viewings</code>", table_cell_bold), Paragraph("viewings:read", table_cell), Paragraph("Retrieve upcoming in-person site visits and virtual Zoom tours.", table_cell)],
        [Paragraph("<code>update_lead_status</code>", table_cell_bold), Paragraph("leads:write", table_cell), Paragraph("Advance lead stages (QUALIFIED, VIEWING_SCHEDULED, CLOSED_WON).", table_cell)],
        [Paragraph("<code>send_whatsapp_message</code>", table_cell_bold), Paragraph("messages:write", table_cell), Paragraph("Deliver live WhatsApp text & media directly to any lead phone number.", table_cell)]
    ]
    mcp_table = Table(mcp_table_data, colWidths=[130, 90, 312])
    mcp_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), c_teal),
        ('BOX', (0, 0), (-1, -1), 0.5, c_border),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, c_bg_light]),
    ]))
    story.append(mcp_table)
    story.append(Spacer(1, 10))

    story.append(PageBreak())

    # --- Module 5 ---
    story.append(Paragraph("5. Enterprise CRM Synchronization Hub (`/settings/crm`)", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=c_gold, spaceBefore=1, spaceAfter=6))
    story.append(Paragraph(
        "Balos serves as the high-velocity WhatsApp qualification front-end, syncing cleanly with existing CRM systems without duplicating data or disrupting team workflows.",
        body_style
    ))
    story.append(Paragraph("• <b>Native Adapters:</b> Pre-built integration with <b>Follow Up Boss (FUB)</b>, <b>HubSpot</b>, <b>GoHighLevel (GHL)</b>, <b>Zoho CRM</b>, <b>Salesforce</b>, and generic <b>Webhooks</b>.", bullet_style))
    story.append(Paragraph("• <b>Configurable Automated Triggers:</b> Sync automatically on Lead Creation, Qualification, Viewing Booked, Human Handoff, or Stage Change.", bullet_style))
    story.append(Paragraph("• <b>1-Click Manual Sync:</b> Accessible from both the Inbox Buyer Dossier and the Leads Directory table.", bullet_style))
    story.append(Paragraph("• <b>Forensic Audit Trail:</b> Detailed <code>crm_sync_logs</code> table tracking HTTP response codes, latency in ms, payload dumps, and error diagnostics.", bullet_style))
    story.append(Spacer(1, 8))

    # --- Module 6 & 7 ---
    story.append(Paragraph("6. Executive KPI Dashboard & Operations Hub (`/`)", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=c_gold, spaceBefore=1, spaceAfter=6))
    story.append(Paragraph("• <b>6-Card Financial Grid:</b> Tracks Total Pipeline (AED), Estimated Commission (AED @ 2%), Active Pipeline Count, Qualified Leads, Bookings, and Broker Hours Saved.", bullet_style))
    story.append(Paragraph("• <b>Live SLA Ticker:</b> Real-time ticker counting wait times (<code>Waiting 4m</code>, <code>Waiting 18m</code>) for leads in the 'Needs You' queue requiring immediate human action.", bullet_style))
    story.append(Paragraph("• <b>Night-Owl Analytics:</b> Quantifies conversations and leads captured outside Dubai office hours (18:00–09:00 GST).", bullet_style))
    story.append(Paragraph("• <b>Interactive Live Demo Modal:</b> Dynamic QR code and link generator allowing team members and clients to scan and test the live AI agent instantly.", bullet_style))
    story.append(Spacer(1, 8))

    story.append(Paragraph("7. Inventory Management & Regulatory Compliance", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=c_gold, spaceBefore=1, spaceAfter=6))
    story.append(Paragraph("• <b>DLD Trakheesi Permit Verification:</b> Mandatory permit number and QR tracking on all listings to comply with Dubai real estate advertising laws.", bullet_style))
    story.append(Paragraph("• <b>UAE Golden Visa Auto-Tagging:</b> Properties AED 2,000,000+ automatically receive the Golden Visa 10-Year residency badge.", bullet_style))
    story.append(Paragraph("• <b>Comprehensive Milestones:</b> Structured JSON payment plan support (e.g. 20% down, 40% construction, 40% handover at 0% interest).", bullet_style))
    story.append(Paragraph("• <b>WhatsApp Marketing Compliance:</b> Public verification routes at <code>/privacy</code>, <code>/privacy-policy</code>, and <code>/terms</code>.", bullet_style))
    story.append(Spacer(1, 10))

    # ------------------------------------------------------------------
    # TECHNICAL SPECIFICATIONS & SECURITY ARCHITECTURE
    # ------------------------------------------------------------------
    story.append(Paragraph("Technical Specifications & Architecture", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=c_gold, spaceBefore=1, spaceAfter=6))

    spec_data = [
        [Paragraph("Component", table_header), Paragraph("Technology & Standard", table_header), Paragraph("Operational Role", table_header)],
        [Paragraph("Frontend Framework", table_cell_bold), Paragraph("Next.js 14 (App Router, Server Actions)", table_cell), Paragraph("Ultra-low latency UI, SEO, SSR & streaming", table_cell)],
        [Paragraph("Styling & Theme", table_cell_bold), Paragraph("Tailwind CSS (Obsidian & Dubai Gold)", table_cell), Paragraph("Executive aesthetic matching luxury agencies", table_cell)],
        [Paragraph("Database & Auth", table_cell_bold), Paragraph("Supabase PostgreSQL + Row-Level Security", table_cell), Paragraph("Strict tenant isolation & zero data leaks", table_cell)],
        [Paragraph("WhatsApp Gateway", table_cell_bold), Paragraph("WAHA (WhatsApp HTTP API Server)", table_cell), Paragraph("Session management, webhook delivery, presence", table_cell)],
        [Paragraph("Workflow Engine", table_cell_bold), Paragraph("n8n Enterprise Automation Engine", table_cell), Paragraph("Deterministic agent routing & fallback loops", table_cell)],
        [Paragraph("Language Models", table_cell_bold), Paragraph("Google Gemini 3.8 Flash & DeepSeek", table_cell), Paragraph("Context extraction, multilingual parsing, drafting", table_cell)],
        [Paragraph("Agent Protocol", table_cell_bold), Paragraph("Model Context Protocol (MCP) Remote", table_cell), Paragraph("Open standard integration with external AI", table_cell)]
    ]
    spec_table = Table(spec_data, colWidths=[120, 192, 220])
    spec_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), c_obsidian),
        ('BOX', (0, 0), (-1, -1), 0.5, c_border),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, c_bg_light]),
    ]))
    story.append(spec_table)
    story.append(Spacer(1, 14))

    # Closing Signature / Agency Signoff
    signoff_data = [[
        Paragraph(
            "<b>BALOS LEAD CONVERSION ENGINE v2.0</b><br/>"
            "Official Product Specification · Licensed for Balos Real Estate Luxury & Off-Plan Advisory<br/>"
            "Live Webhook Endpoint: <code>https://balos-lce.vercel.app/api/mcp</code> · Infrastructure: <code>balos.tech</code>",
            ParagraphStyle('Signoff', parent=styles['Normal'], fontName='Helvetica', fontSize=8, leading=12, textColor=c_muted, alignment=1)
        )
    ]]
    signoff_table = Table(signoff_data, colWidths=[532])
    signoff_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#F8FAFC")),
        ('BOX', (0, 0), (-1, -1), 0.5, c_border),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('LEFTPADDING', (0, 0), (-1, -1), 10),
        ('RIGHTPADDING', (0, 0), (-1, -1), 10),
    ]))
    story.append(signoff_table)

    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"[Success] PDF generated at: {filename}")

if __name__ == "__main__":
    build_pdf()
