import os
import sys
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    """
    Two-pass canvas to dynamically compute and print 'Page X of Y' 
    plus polished enterprise running headers and footers.
    """
    def __init__(self, *args, **kwargs):
        super(NumberedCanvas, self).__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            canvas.Canvas.showPage(self)
        canvas.Canvas.save(self)

    def draw_page_decorations(self, page_count):
        self.saveState()
        margin = 45
        right_margin = letter[0] - margin
        
        # Running top header on pages 2+
        if self._pageNumber > 1:
            self.setFont("Helvetica-Bold", 8)
            self.setFillColor(colors.HexColor("#0B6E6E"))
            self.drawString(margin, letter[1] - 32, "BALOS LEAD CONVERSION ENGINE (BALOS LCE)")
            
            self.setFont("Helvetica", 8)
            self.setFillColor(colors.HexColor("#64748B"))
            self.drawRightString(right_margin, letter[1] - 32, "EXECUTIVE PRODUCT & ARCHITECTURE BRIEFING")
            
            self.setStrokeColor(colors.HexColor("#CBD5E1"))
            self.setLineWidth(0.6)
            self.line(margin, letter[1] - 37, right_margin, letter[1] - 37)

        # Running bottom footer on all pages
        self.setStrokeColor(colors.HexColor("#E2E8F0"))
        self.setLineWidth(0.6)
        self.line(margin, 38, right_margin, 38)

        self.setFont("Helvetica-Bold", 7.5)
        self.setFillColor(colors.HexColor("#0B6E6E"))
        self.drawString(margin, 26, "BALOS LCE")
        
        self.setFont("Helvetica", 7.5)
        self.setFillColor(colors.HexColor("#64748B"))
        self.drawString(margin + 58, 26, "•  DUBAI REAL ESTATE AI REVENUE & LEAD ENGINE  •  EXECUTIVE SUMMARY")
        
        page_str = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(right_margin, 26, page_str)
        self.restoreState()


def generate_balos_summary_pdf(output_filename="Balos_What_Is_Balos_Summary.pdf"):
    margin = 45
    usable_width = letter[0] - (2 * margin) # 612 - 90 = 522 pt = 7.25 in

    doc = SimpleDocTemplate(
        output_filename,
        pagesize=letter,
        leftMargin=margin,
        rightMargin=margin,
        topMargin=44,
        bottomMargin=46
    )

    styles = getSampleStyleSheet()

    # Color Palette: Dubai Luxury & Enterprise Modern
    c_primary = colors.HexColor("#0B6E6E")      # Deep Emerald Creek
    c_primary_light = colors.HexColor("#F0F7F6")# Mint Cream / Emerald Wash
    c_dark = colors.HexColor("#12262B")         # Obsidian / Deep Ink
    c_gold = colors.HexColor("#B4820E")         # Dubai Saffron Gold
    c_gold_light = colors.HexColor("#FFFBEB")   # Warm Gold Tint
    c_slate = colors.HexColor("#334155")        # Slate Text
    c_slate_dark = colors.HexColor("#0F172A")   # Deep Slate
    c_card_bg = colors.HexColor("#F8FAFC")      # Crisp Card Background
    c_card_border = colors.HexColor("#E2E8F0")  # Border Subtle
    c_accent_border = colors.HexColor("#CBD5E1")

    # Typography Styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=22,
        leading=26,
        textColor=c_dark,
        spaceAfter=2
    )

    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10.5,
        leading=14,
        textColor=c_primary,
        spaceAfter=8
    )

    section_h1 = ParagraphStyle(
        'SectionH1',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=15,
        textColor=c_primary,
        spaceBefore=8,
        spaceAfter=4,
        keepWithNext=True
    )

    section_h2 = ParagraphStyle(
        'SectionH2',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9.5,
        leading=13,
        textColor=c_dark,
        spaceBefore=6,
        spaceAfter=2,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'BodyStyle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=12,
        textColor=c_slate,
        spaceAfter=4
    )

    table_header_style = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=10,
        textColor=colors.white
    )

    table_cell = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=11,
        textColor=c_slate_dark
    )

    table_cell_bold = ParagraphStyle(
        'TableCellBold',
        parent=table_cell,
        fontName='Helvetica-Bold',
        textColor=c_dark
    )

    elements = []

    # =========================================================================
    # PAGE 1: TITLE, META, EXECUTIVE DEFINITION, KPI BANNER, PROBLEM VS SOLUTION
    # =========================================================================
    elements.append(Paragraph("What is Balos?", title_style))
    elements.append(Paragraph("Balos Lead Conversion Engine (LCE) • Executive Product & Architecture Briefing", subtitle_style))

    # Meta Overview Box
    meta_info = [
        [
            Paragraph("<b>PLATFORM:</b> Balos Lead Conversion Engine (Balos LCE)", body_style),
            Paragraph("<b>TARGET MARKET:</b> Dubai & UAE Real Estate Brokerages & Agencies", body_style)
        ],
        [
            Paragraph("<b>CORE INTERFACE:</b> 24/7 WhatsApp AI Agent + Web Brokerage OS", body_style),
            Paragraph("<b>TECH STACK:</b> Next.js 14, TypeScript, Supabase (RLS), Tailwind CSS", body_style)
        ],
        [
            Paragraph("<b>KEY SLA:</b> &lt; 15s Median AI Response SLA", body_style),
            Paragraph("<b>AVAILABILITY:</b> 24/7/365 Continuous Inbound Lead Nurturing & Scheduling", body_style)
        ]
    ]
    meta_table = Table(meta_info, colWidths=[usable_width * 0.5, usable_width * 0.5])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), c_card_bg),
        ('BOX', (0,0), (-1,-1), 1, c_card_border),
        ('INNERGRID', (0,0), (-1,-1), 0.5, c_card_border),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ]))
    elements.append(meta_table)
    elements.append(Spacer(1, 6))

    # 1. Executive Summary & Core Definition
    elements.append(Paragraph("1. Executive Definition: What is Balos?", section_h1))
    summary_p = (
        "<b>Balos</b> (the <i>Balos Lead Conversion Engine</i>) is an autonomous, full-funnel <b>AI-powered WhatsApp "
        "Lead Qualification and Revenue Engine</b> custom-engineered for Dubai and UAE real estate brokerages, agencies, "
        "and property sales teams.<br/><br/>"
        "In the fast-moving Dubai property market, agencies invest tens of thousands of dirhams every month generating "
        "leads across Property Finder, Bayut, Dubizzle, Meta Click-to-WhatsApp ads, and agency portals. However, more than "
        "60% of inquiries arrive after-hours or on weekends from overseas investors across Europe, Asia, and the Americas. "
        "Manual response times often lag by hours, allowing high-net-worth buyers to be signed by competing agencies.<br/><br/>"
        "<b>Balos eliminates lead leakage entirely:</b> it deploys an instant, multilingual conversational AI directly inside WhatsApp. "
        "The engine answers within 15 seconds 24/7, qualifies buyer intent (budget in AED, preferred communities, buyer persona, "
        "and payment methods), automatically screens for <b>UAE Golden Visa eligibility (AED 2,000,000+)</b>, matches verified "
        "property inventory with photos and video tours, and books viewings (Physical, Zoom, or Office) straight onto agent calendars."
    )
    elements.append(Paragraph(summary_p, body_style))
    elements.append(Spacer(1, 4))

    # Metric Banner
    metric_data = [
        [
            Paragraph("<b>&lt; 15s</b><br/><font color='#4A6166'>Median Response SLA</font>", ParagraphStyle('M1', fontName='Helvetica-Bold', fontSize=10.5, leading=13, textColor=c_primary, alignment=1)),
            Paragraph("<b>100%</b><br/><font color='#4A6166'>After-Hours Inbound Coverage</font>", ParagraphStyle('M2', fontName='Helvetica-Bold', fontSize=10.5, leading=13, textColor=c_primary, alignment=1)),
            Paragraph("<b>AED 2.0M+</b><br/><font color='#4A6166'>Auto Golden Visa Screening</font>", ParagraphStyle('M3', fontName='Helvetica-Bold', fontSize=10.5, leading=13, textColor=c_primary, alignment=1)),
            Paragraph("<b>3 Formats</b><br/><font color='#4A6166'>Tri-Modal Viewing Booking</font>", ParagraphStyle('M4', fontName='Helvetica-Bold', fontSize=10.5, leading=13, textColor=c_primary, alignment=1)),
        ]
    ]
    metric_table = Table(metric_data, colWidths=[usable_width * 0.25] * 4)
    metric_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), c_primary_light),
        ('BOX', (0,0), (-1,-1), 1, c_primary),
        ('INNERGRID', (0,0), (-1,-1), 0.5, c_card_border),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
    ]))
    elements.append(metric_table)
    elements.append(Spacer(1, 6))

    # 2. The Dubai Real Estate Problem vs. The Balos Solution
    elements.append(Paragraph("2. The Dubai Real Estate Market Dilemma vs. Balos", section_h1))
    
    comp_headers = [
        Paragraph("<b>Traditional Dubai Brokerage Friction Point</b>", table_header_style),
        Paragraph("<b>How Balos Solves It with AI & Workflow Automation</b>", table_header_style)
    ]
    comp_rows = [
        comp_headers,
        [
            Paragraph("<b>Severe Lead Leakage Due to Timezones:</b> Inquiries from overseas investors in Europe, Asia, or the Americas arrive at night or on weekends. Average human agent response time exceeds 4 to 12 hours, by which point the lead has contacted competing brokerages.", table_cell),
            Paragraph("<b>Instant 24/7 AI Engagement (&lt;15s):</b> Balos answers immediately 24/7 in native Asia/Dubai (GST) timezone, warmly greeting leads in English, Arabic, or their native tongue before competitors even open the app.", table_cell)
        ],
        [
            Paragraph("<b>Broker Burnout on Junk Inquiries:</b> 70%+ of portal inquiries lack adequate budget, are window shoppers, or are automated bot spam, wasting valuable broker time on administrative manual triage.", table_cell),
            Paragraph("<b>Algorithmic Qualification & Spam Quarantine:</b> Balos gathers exact budget, target communities, readiness timeline, and financing methods, quarantining bots and flagging high-intent buyers for brokers.", table_cell)
        ],
        [
            Paragraph("<b>Opaque Marketing Attribution:</b> Agencies spend large budgets on Property Finder, Bayut, and Meta Ads without granular visibility into which campaigns yield actual viewings and closed deals.", table_cell),
            Paragraph("<b>Full-Funnel Attribution & Channel ROI:</b> Tracks exact lead origin (e.g. Bayut vs. Meta Click-to-WhatsApp) through qualification, scheduled viewings, and closed-won commissions (2% UAE standard).", table_cell)
        ],
        [
            Paragraph("<b>Disjointed Scheduling & Viewing Ghosting:</b> Back-and-forth messaging to arrange property visits results in ghosting and missed appointments for both local and overseas clients.", table_cell),
            Paragraph("<b>Tri-Modal Automated Booking:</b> Books Physical Site Visits, Virtual Zoom Walkthroughs (with instant meeting links), or Office Consultations straight to agent calendars.", table_cell)
        ]
    ]

    comp_table = Table(comp_rows, colWidths=[usable_width * 0.5, usable_width * 0.5])
    comp_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), c_dark),
        ('BOX', (0,0), (-1,-1), 0.75, c_card_border),
        ('INNERGRID', (0,0), (-1,-1), 0.5, c_card_border),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    elements.append(comp_table)

    # End of Page 1
    elements.append(PageBreak())

    # =========================================================================
    # PAGE 2: CORE FUNCTIONAL PILLARS & WORKFLOW MODULES
    # =========================================================================
    elements.append(Paragraph("3. Core Functional Pillars of the Balos Engine", section_h1))
    intro_pillars = (
        "Balos operates as an integrated dual-layer engine: an <b>autonomous conversational AI layer on WhatsApp</b> "
        "and a <b>centralized operations and revenue management dashboard</b> for agency leadership and brokers."
    )
    elements.append(Paragraph(intro_pillars, body_style))
    elements.append(Spacer(1, 3))

    pillars = [
        (
            "A. 24/7 WhatsApp Conversational AI Engine",
            "The front-line AI engine communicates naturally with inbound buyers via WhatsApp without rigid robotic menus:<br/>"
            "• <b>Natural Discovery:</b> Discovers buyer persona (High-Yield Investor, Capital Gain Investor, End-User Buyer, Tenant).<br/>"
            "• <b>Community Matching:</b> Understands top Dubai prime areas (Downtown Dubai, Dubai Marina, Palm Jumeirah, Dubai Hills Estate, Business Bay, DAMAC Lagoons, Sobha Hartland).<br/>"
            "• <b>Budget & Financing Discovery:</b> Captures price range in AED and payment style (Cash, Mortgage, Developer Payment Plan, Cryptocurrency)."
        ),
        (
            "B. Dubai & UAE Market Specialization",
            "Tailored precisely to the legal and commercial realities of the UAE real estate ecosystem:<br/>"
            "• <b>Automatic UAE Golden Visa Screening:</b> Inquiries and properties with budgets of AED 2,000,000+ are automatically tagged as Golden Visa eligible, arming agents with high-value investor leverage.<br/>"
            "• <b>RERA & Trakheesi Compliance:</b> Integrates Broker Registration Numbers (BRN) and listing Trakheesi permit numbers for full regulatory legitimacy.<br/>"
            "• <b>Timezone-Aware After-Hours Guard:</b> Programmed to Dubai GST (UTC+4); inquiries during off-hours (6:00 PM – 9:00 AM) trigger instant AI nurturing, ensuring zero lead leakage."
        ),
        (
            "C. Human-in-the-Loop Co-Pilot & Real-Time Inbox",
            "Balos empowers human brokers rather than replacing them:<br/>"
            "• <b>1-Click Live Handoff:</b> Agents can inspect real-time WhatsApp dialogs and toggle between <b>'Take Over'</b> (instantly pauses AI) and <b>'Hand Back to AI'</b> with 15-second polling and real-time synchronization.<br/>"
            "• <b>Urgency & Handoff Triggers:</b> When a lead asks complex contractual questions, requests immediate human calls, or confirms a viewing, the engine notifies the assigned agent immediately.<br/>"
            "• <b>Internal Broker Notes:</b> Agents can annotate lead profiles with private notes invisible to the client."
        ),
        (
            "D. Tri-Modal Viewing & Calendar Engine",
            "Streamlines scheduling across 3 distinct viewing formats adapted for domestic and cross-border buyers:<br/>"
            "1. <b>Physical Site Visits:</b> On-location showings at the developer sales center or ready property.<br/>"
            "2. <b>Virtual Zoom Walkthroughs:</b> Automatically generates Zoom meeting links for overseas international investors.<br/>"
            "3. <b>In-Office Consultations:</b> VIP investment strategy meetings at the agency's headquarters.<br/>"
            "• Complete lifecycle tracking: <code>REQUESTED</code>, <code>CONFIRMED</code>, <code>CANCELLED</code>, <code>COMPLETED</code>."
        ),
        (
            "E. Property Inventory & Rich Media Manager",
            "A comprehensive property database powering both the AI recommendations and broker catalog:<br/>"
            "• <b>Inventory Types:</b> Off-Plan (developer projects with payment plans), Ready Secondary, and Luxury Rentals.<br/>"
            "• <b>Smart Media Engine:</b> Automated cover photo detection for WhatsApp cards, high-res image ordering, and optimized video walkthrough clips to send directly into WhatsApp chats."
        ),
        (
            "F. Financial Trajectory & Revenue Analytics",
            "Provides brokerage executives with deep financial visibility:<br/>"
            "• <b>Total vs. Qualified Pipeline (AED):</b> Filters out junk inquiries to showcase true potential revenue.<br/>"
            "• <b>Commission Modeling:</b> Automatic 2% UAE brokerage commission forecasting based on qualified deal value.<br/>"
            "• <b>Multi-Channel Attribution:</b> Direct ROI comparison across Property Finder, Bayut, Dubizzle, Meta Ads, and Website."
        )
    ]

    for title, desc in pillars:
        elements.append(Paragraph(title, section_h2))
        elements.append(Paragraph(desc, body_style))

    # End of Page 2
    elements.append(PageBreak())

    # =========================================================================
    # PAGE 3: USER JOURNEY, ARCHITECTURE & ROLE HIERARCHY
    # =========================================================================
    elements.append(Paragraph("4. End-to-End Inbound Lead Journey", section_h1))
    journey_intro = "The lifecycle of an inbound buyer inquiry flowing through the Balos Engine:"
    elements.append(Paragraph(journey_intro, body_style))
    elements.append(Spacer(1, 3))

    # Journey Table
    journey_data = [
        [
            Paragraph("<b>Stage</b>", table_header_style),
            Paragraph("<b>Action / Interaction</b>", table_header_style),
            Paragraph("<b>Engine Behavior & System Outcome</b>", table_header_style)
        ],
        [
            Paragraph("<b>1. Inbound Influx</b>", table_cell_bold),
            Paragraph("Buyer clicks WhatsApp ad or portal link (Property Finder / Bayut / Meta Ads).", table_cell),
            Paragraph("Webhook triggers Balos. Engine logs lead record, tags source channel, and starts timer.", table_cell)
        ],
        [
            Paragraph("<b>2. Instant AI Greeting (&lt;15s)</b>", table_cell_bold),
            Paragraph("AI greets buyer warmly in their detected language (English, Arabic, etc.).", table_cell),
            Paragraph("SLA satisfied. Establishes immediate conversational connection before competing brokers respond.", table_cell)
        ],
        [
            Paragraph("<b>3. Budget & Persona Discovery</b>", table_cell_bold),
            Paragraph("AI asks concise questions regarding budget in AED, bedrooms, and buyer type.", table_cell),
            Paragraph("Maps buyer to persona (Investor vs End-User). Validates budget against target community pricing.", table_cell)
        ],
        [
            Paragraph("<b>4. Golden Visa Screening</b>", table_cell_bold),
            Paragraph("AI verifies budget. If AED 2,000,000+, flags Golden Visa eligibility.", table_cell),
            Paragraph("Shares relevant off-plan/ready listings that fulfill UAE Golden Visa residency requirements.", table_cell)
        ],
        [
            Paragraph("<b>5. Tri-Modal Viewing Booking</b>", table_cell_bold),
            Paragraph("Buyer selects preferred slot for Site Visit, Virtual Zoom, or Office Consultation.", table_cell),
            Paragraph("Creates booking in database, generates Zoom link (if virtual), and syncs calendar event.", table_cell)
        ],
        [
            Paragraph("<b>6. Human Agent Handoff</b>", table_cell_bold),
            Paragraph("Engine alerts assigned agent via push notification with a fully qualified briefing dossier.", table_cell),
            Paragraph("Broker reviews conversation summary, clicks 'Take Over' in dashboard, and conducts viewing to close deal.", table_cell)
        ]
    ]

    col_stage = usable_width * 0.20
    col_action = usable_width * 0.40
    col_outcome = usable_width * 0.40
    journey_table = Table(journey_data, colWidths=[col_stage, col_action, col_outcome])
    journey_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), c_primary),
        ('BOX', (0,0), (-1,-1), 0.75, c_card_border),
        ('INNERGRID', (0,0), (-1,-1), 0.5, c_card_border),
        ('TOPPADDING', (0,0), (-1,-1), 3.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3.5),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    elements.append(journey_table)
    elements.append(Spacer(1, 6))

    # 5. Technology Architecture & Security Standards
    elements.append(Paragraph("5. Technical Architecture & Security Standards", section_h1))
    
    tech_info = [
        [
            Paragraph("<b>Architecture Layer</b>", table_header_style),
            Paragraph("<b>Technology Selected</b>", table_header_style),
            Paragraph("<b>Operational & Enterprise Advantage</b>", table_header_style)
        ],
        [
            Paragraph("<b>Frontend Framework</b>", table_cell_bold),
            Paragraph("Next.js 14 App Router + TypeScript", table_cell),
            Paragraph("Server Components for high-speed rendering; mobile-first broker UI.", table_cell)
        ],
        [
            Paragraph("<b>Database & Auth</b>", table_cell_bold),
            Paragraph("Supabase PostgreSQL + RLS", table_cell),
            Paragraph("Row-Level Security isolates agency data; real-time inbox synchronizations.", table_cell)
        ],
        [
            Paragraph("<b>Messaging Ingestion</b>", table_cell_bold),
            Paragraph("Meta WhatsApp Cloud API / Twilio", table_cell),
            Paragraph("Direct webhook ingestion with cryptographic signature validation.", table_cell)
        ],
        [
            Paragraph("<b>Styling System</b>", table_cell_bold),
            Paragraph("Tailwind CSS + Dubai Luxury Theme", table_cell),
            Paragraph("Emerald (`#0B6E6E`), Deep Ink (`#12262B`), and Saffron Gold (`#D9A21B`).", table_cell)
        ],
        [
            Paragraph("<b>Team Hierarchy & RBAC</b>", table_cell_bold),
            Paragraph("Admin, Sales Leader, Team Leader, Agent", table_cell),
            Paragraph("Strict lead assignment permissions; automated assignment push triggers.", table_cell)
        ]
    ]
    col_layer = usable_width * 0.22
    col_tech = usable_width * 0.38
    col_adv = usable_width * 0.40
    tech_table = Table(tech_info, colWidths=[col_layer, col_tech, col_adv])
    tech_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), c_dark),
        ('BOX', (0,0), (-1,-1), 0.75, c_card_border),
        ('INNERGRID', (0,0), (-1,-1), 0.5, c_card_border),
        ('TOPPADDING', (0,0), (-1,-1), 3.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3.5),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    elements.append(tech_table)
    elements.append(Spacer(1, 6))

    # 6. Key Business Benefits for Brokerages
    elements.append(Paragraph("6. Tangible Commercial Return on Investment (ROI)", section_h1))
    benefits = (
        "• <b>3x Higher Lead Conversion:</b> Responding in &lt;15 seconds stops buyers from searching competitor listings.<br/>"
        "• <b>100% Weekend & Nighttime Coverage:</b> Captures overseas capital from the UK, Europe, Russia, and the Far East 24/7.<br/>"
        "• <b>Eliminates Broker Fatigue:</b> Human brokers spend their day showing properties and closing transactions, not filtering spam.<br/>"
        "• <b>Granular Marketing Accountability:</b> Accurately identifies which portals and ad campaigns deliver the highest ROI."
    )
    elements.append(Paragraph(benefits, body_style))
    elements.append(Spacer(1, 6))

    # Sign-off box
    signoff_data = [
        [
            Paragraph(
                "<b>Document Title:</b> What is Balos? — Comprehensive Product & Architecture Summary<br/>"
                "<b>Target Audience:</b> Agency Principals, Managing Directors, Head of Sales, and Investment Stakeholders<br/>"
                "<b>Official Repository:</b> <font color='#0B6E6E'><u>https://github.com/mrtee-xs/-Balos-LCE</u></font>",
                body_style
            )
        ]
    ]
    signoff_table = Table(signoff_data, colWidths=[usable_width])
    signoff_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), c_card_bg),
        ('BOX', (0,0), (-1,-1), 1, c_card_border),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ]))
    elements.append(signoff_table)

    doc.build(elements, canvasmaker=NumberedCanvas)
    print(f"Successfully generated {output_filename}")

if __name__ == "__main__":
    out_pdf = "Balos_What_Is_Balos_Summary.pdf"
    if len(sys.argv) > 1:
        out_pdf = sys.argv[1]
    generate_balos_summary_pdf(out_pdf)
