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
            canvas.Canvas.showPage(self)
        canvas.Canvas.save(self)

    def draw_page_decorations(self, page_count):
        self.saveState()
        margin = 42
        right_margin = letter[0] - margin
        
        # Running top header on pages 2+
        if self._pageNumber > 1:
            self.setFont("Helvetica-Bold", 7.5)
            self.setFillColor(colors.HexColor("#0B6E6E"))
            self.drawString(margin, letter[1] - 30, "BALOS LEAD CONVERSION ENGINE (BALOS LCE) • STRATEGIC ADVISORY BRIEFING")
            
            self.setFont("Helvetica", 7.5)
            self.setFillColor(colors.HexColor("#64748B"))
            self.drawRightString(right_margin, letter[1] - 30, "WHY UAE BROKERAGES CHOOSE BALOS OVER GENERIC CHATBOTS")
            
            self.setStrokeColor(colors.HexColor("#CBD5E1"))
            self.setLineWidth(0.5)
            self.line(margin, letter[1] - 34, right_margin, letter[1] - 34)

        # Running bottom footer on all pages
        self.setStrokeColor(colors.HexColor("#E2E8F0"))
        self.setLineWidth(0.5)
        self.line(margin, 34, right_margin, 34)

        self.setFont("Helvetica-Bold", 7.5)
        self.setFillColor(colors.HexColor("#0B6E6E"))
        self.drawString(margin, 23, "BALOS LCE")
        
        self.setFont("Helvetica", 7)
        self.setFillColor(colors.HexColor("#64748B"))
        self.drawString(margin + 55, 23, "•  CONFIDENTIAL  •  PREPARED FOR UAE REAL ESTATE ADVISORS & AGENCY EXECUTIVES")
        
        page_str = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(right_margin, 23, page_str)
        self.restoreState()


def generate_competitive_advantage_pdf(output_filename="Balos_Why_UAE_Agencies_Choose_Us.pdf"):
    margin = 42
    usable_width = letter[0] - (2 * margin) # 612 - 84 = 528 pt = 7.33 in

    doc = SimpleDocTemplate(
        output_filename,
        pagesize=letter,
        leftMargin=margin,
        rightMargin=margin,
        topMargin=40,
        bottomMargin=42
    )

    styles = getSampleStyleSheet()

    # Premium UAE Real Estate Palette
    c_primary = colors.HexColor("#0B6E6E")      # Deep Emerald Creek
    c_primary_light = colors.HexColor("#F0F7F6")# Mint Cream wash
    c_primary_tint = colors.HexColor("#E1EFEF") # Slightly deeper mint
    c_dark = colors.HexColor("#12262B")         # Obsidian Ink
    c_gold = colors.HexColor("#B4820E")         # Dubai Saffron Gold
    c_gold_light = colors.HexColor("#FFFBEB")   # Warm Gold Tint
    c_slate = colors.HexColor("#334155")        # Slate Text
    c_slate_light = colors.HexColor("#64748B")  # Light Slate
    c_slate_dark = colors.HexColor("#0F172A")   # Deep Slate
    c_card_bg = colors.HexColor("#F8FAFC")      # Crisp Card Background
    c_card_border = colors.HexColor("#E2E8F0")  # Border Subtle
    c_danger_light = colors.HexColor("#FEF2F2") # Subtle Red Tint
    c_danger_border = colors.HexColor("#FECACA")
    c_danger_text = colors.HexColor("#991B1B")
    c_success_light = colors.HexColor("#ECFDF5")# Subtle Green Tint
    c_success_border = colors.HexColor("#A7F3D0")
    c_success_text = colors.HexColor("#065F46")

    # Typography Styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=18,
        leading=22,
        textColor=c_dark,
        spaceAfter=2
    )

    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9.5,
        leading=13,
        textColor=c_primary,
        spaceAfter=6
    )

    section_h1 = ParagraphStyle(
        'SectionH1',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10.5,
        leading=13.5,
        textColor=c_primary,
        spaceBefore=6,
        spaceAfter=3,
        keepWithNext=True
    )

    section_h2 = ParagraphStyle(
        'SectionH2',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=11.5,
        textColor=c_dark,
        spaceBefore=4,
        spaceAfter=2,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'BodyStyle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=7.8,
        leading=11,
        textColor=c_slate,
        spaceAfter=3
    )

    callout_style = ParagraphStyle(
        'CalloutText',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=7.8,
        leading=11,
        textColor=c_slate_dark
    )

    table_header_style = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=7.5,
        leading=9.5,
        textColor=colors.white
    )

    table_cell = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=7.3,
        leading=9.8,
        textColor=c_slate_dark
    )

    table_cell_bold = ParagraphStyle(
        'TableCellBold',
        parent=table_cell,
        fontName='Helvetica-Bold',
        textColor=c_dark
    )

    table_cell_danger = ParagraphStyle(
        'TableCellDanger',
        parent=table_cell,
        textColor=c_danger_text
    )

    table_cell_success = ParagraphStyle(
        'TableCellSuccess',
        parent=table_cell,
        textColor=c_success_text
    )

    elements = []

    # =========================================================================
    # PAGE 1: STRATEGIC MEMO, ADVISOR QUESTION & THE HIGH-STAKES UAE REALITY
    # =========================================================================
    elements.append(Paragraph("Why Choose Balos Over Generic Competitors?", title_style))
    elements.append(Paragraph("Strategic Advisory Briefing: Why UAE Real Estate Brokerages Choose Balos Over Gallabox & Engati", subtitle_style))

    # Meta Overview Box
    meta_info = [
        [
            Paragraph("<b>DOCUMENT PURPOSE:</b> UAE Real Estate Strategic Differentiation Dossier", body_style),
            Paragraph("<b>TARGET AUDIENCE:</b> UAE Real Estate Advisors, Agency Principals & Sales Heads", body_style)
        ],
        [
            Paragraph("<b>PRIMARY COMPETITORS:</b> Gallabox (Meta BSP) & Engati (Enterprise Omnichannel CX)", body_style),
            Paragraph("<b>CORE POSITIONING:</b> Purpose-Built AI Lead Engine with White-Glove Bespoke Integration", body_style)
        ],
        [
            Paragraph("<b>COMMERCIAL BENCHMARK:</b> Average UAE Deal: AED 2.5M – AED 15M+ | Commission: AED 50K – 300K+", body_style),
            Paragraph("<b>INTEGRATION STANCE:</b> 100% Custom-Built On Top of Agency's Existing Tech & Inventory Stack", body_style)
        ]
    ]
    meta_table = Table(meta_info, colWidths=[usable_width * 0.52, usable_width * 0.48])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), c_card_bg),
        ('BOX', (0,0), (-1,-1), 1, c_card_border),
        ('INNERGRID', (0,0), (-1,-1), 0.5, c_card_border),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('LEFTPADDING', (0,0), (-1,-1), 7),
        ('RIGHTPADDING', (0,0), (-1,-1), 7),
    ]))
    elements.append(meta_table)
    elements.append(Spacer(1, 4))

    # 1. The Advisor's Question & The Executive Answer
    elements.append(Paragraph("1. The Core Question From Our UAE Industry Advisor", section_h1))
    
    advisor_q = (
        "<i>\"Gallabox and Engati are already established in the region and used by dozens of businesses across retail, "
        "services, and tech. Why would a top-tier Dubai or Abu Dhabi real estate brokerage choose Balos over these incumbent platforms?\"</i>"
    )
    advisor_box = [
        [Paragraph(f"<b>THE ADVISOR'S INQUIRY:</b><br/>{advisor_q}", callout_style)]
    ]
    adv_table = Table(advisor_box, colWidths=[usable_width])
    adv_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), c_gold_light),
        ('BOX', (0,0), (-1,-1), 1, c_gold),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ]))
    elements.append(adv_table)
    elements.append(Spacer(1, 4))

    exec_answer = (
        "<b>The Executive Answer:</b> Gallabox and Engati are <b>horizontal communication utilities</b> built for high-volume "
        "support ticket deflection (retail orders, food delivery, doctor appointments, banking FAQs). They sell empty software "
        "canvases that force the brokerage to spend weeks building conversation trees from scratch.<br/><br/>"
        "<b>Balos is an autonomous, vertical Real Estate Revenue Engine</b> custom-engineered for the multi-million dirham "
        "transactions of the UAE property market. Most importantly, <b>we do not sell an off-the-shelf, one-size-fits-all box. "
        "We custom-build and integrate Balos directly on top of what the agency already has</b>—their existing CRM, WhatsApp numbers, "
        "developer off-plan allocations, and broker routing rules. While generic tools treat an inquiry like an e-commerce support ticket, "
        "<b>Balos treats it like an AED 100,000 commission opportunity.</b>"
    )
    elements.append(Paragraph(exec_answer, body_style))
    elements.append(Spacer(1, 4))

    # 2. The Multi-Million Dirham Stakes of UAE Real Estate
    elements.append(Paragraph("2. The High-Stakes Economics of UAE Property vs. Generic SaaS", section_h1))

    stakes_text = (
        "Generic chatbot platforms fail in UAE real estate because they do not understand the extreme commercial velocity and "
        "cross-border nature of the Dubai property ecosystem:"
    )
    elements.append(Paragraph(stakes_text, body_style))

    stakes_cards = [
        [
            Paragraph("<b>Extreme Transaction Value:</b><br/>In generic e-commerce, losing a customer is a $30 loss. In Dubai real estate, an average off-plan or secondary transaction is <b>AED 2,500,000 to AED 10,000,000+</b>. A single closed deal yields <b>AED 50,000 to AED 200,000+ in agency commission (2%)</b>. Software cannot afford to deliver a sluggish or clunky user experience.", body_style),
            Paragraph("<b>The 60%+ Cross-Border Timezone Gap:</b><br/>Over 60% of high-net-worth buyers on Property Finder, Bayut, and Meta Ads inquire from the UK, Europe, India, China, Russia, and the US during UAE night hours (6:00 PM – 9:00 AM). When agencies take 4 to 8 hours to reply manually in the morning, <b>the buyer has already engaged 3 competing agencies</b>.", body_style)
        ],
        [
            Paragraph("<b>The Broker Field Reality:</b><br/>Real estate agents spend their working day driving on Sheikh Zayed Road, attending developer project launches, and conducting property viewings. They do not sit at desks managing multi-channel ticketing inboxes. They require an autonomous AI layer that pre-qualifies buyers and hands over scheduled appointments.", body_style),
            Paragraph("<b>Severe Ad Spend Waste:</b><br/>UAE brokerages spend AED 20,000 to AED 100,000+ per month on portal listings and Click-to-WhatsApp ads. 70%+ of these inquiries are unqualified window shoppers or spam. Human brokers burn out filtering junk instead of closing serious investors.", body_style)
        ]
    ]
    stakes_table = Table(stakes_cards, colWidths=[usable_width * 0.5, usable_width * 0.5])
    stakes_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), c_card_bg),
        ('BOX', (0,0), (-1,-1), 1, c_card_border),
        ('INNERGRID', (0,0), (-1,-1), 0.5, c_card_border),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    elements.append(stakes_table)

    # End of Page 1
    elements.append(PageBreak())

    # =========================================================================
    # PAGE 2: WHY INCUMBENTS (GALLABOX & ENGATI) FAIL UAE REAL ESTATE
    # =========================================================================
    elements.append(Paragraph("3. Anatomy of the Incumbents: Why Gallabox & Engati Fall Short", section_h1))
    p2_intro = (
        "While Gallabox and Engati are respectable software platforms in their own domains, deploying them inside a high-performance "
        "UAE real estate agency reveals deep operational friction points that cost brokerages millions of dirhams in leaked commissions."
    )
    elements.append(Paragraph(p2_intro, body_style))
    elements.append(Spacer(1, 3))

    # Gallabox Deep-Dive
    elements.append(Paragraph("A. Gallabox: The Limitations of a Generic WhatsApp Marketing Utility", section_h2))
    gallabox_issues = [
        [
            Paragraph("<b>1. The 'Blank Canvas' Setup Burden</b>", table_cell_bold),
            Paragraph("Gallabox provides a generic visual bot builder. The brokerage must design every conversational node, write prompts, and handle edge cases. Real estate agencies are sales teams, not software development agencies. Bot setup stalls, leading to abandoned implementations.", table_cell)
        ],
        [
            Paragraph("<b>2. Zero Real Estate Native Logic</b>", table_cell_bold),
            Paragraph("Gallabox has no concept of UAE property types (Off-Plan vs. Ready Secondary), developer payment plans (e.g., 60/40, 80/20), DLD/RERA Trakheesi permits, or community yields (Downtown vs. Dubai Hills). It cannot recommend matching inventory dynamically.", table_cell)
        ],
        [
            Paragraph("<b>3. The Metered 'AI Credits' Trap</b>", table_cell_bold),
            Paragraph("Gallabox throttles and bills AI usage via 'AI Credits' (500 to 8,000 monthly pool). When a brokerage launches a viral Meta Click-to-WhatsApp ad or a major developer project campaign, credits deplete rapidly, triggering unexpected surcharges or bot downtime.", table_cell)
        ],
        [
            Paragraph("<b>4. Helpdesk-Style Shared Inbox</b>", table_cell_bold),
            Paragraph("Gallabox's inbox is modeled after Zendesk for customer support reps. It lacks high-urgency lead qualification dossiers, viewing status trackers, and seamless 1-click mobile handoffs engineered for brokers on the road.", table_cell)
        ]
    ]
    t_gallabox = Table(gallabox_issues, colWidths=[usable_width * 0.30, usable_width * 0.70])
    t_gallabox.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), c_card_bg),
        ('BOX', (0,0), (-1,-1), 0.75, c_card_border),
        ('INNERGRID', (0,0), (-1,-1), 0.5, c_card_border),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    elements.append(t_gallabox)
    elements.append(Spacer(1, 5))

    # Engati Deep-Dive
    elements.append(Paragraph("B. Engati: The Limitations of Heavy Enterprise Omnichannel CX", section_h2))
    engati_issues = [
        [
            Paragraph("<b>1. Enterprise Bloat & Slow Time-to-Value</b>", table_cell_bold),
            Paragraph("Engati is engineered for massive institutions like banks, insurance providers, and university admissions. Setup requires custom enterprise contracts, lengthy onboarding, and technical IT administration. An agency loses weeks before going live.", table_cell)
        ],
        [
            Paragraph("<b>2. Ticket Deflection vs. Aggressive Conversion</b>", table_cell_bold),
            Paragraph("Engati's core design goal is to deflect customer service calls. In real estate, the objective is the exact opposite: to aggressively qualify intent, build rapport, showcase luxurious inventory, and immediately secure a viewing slot with a broker.", table_cell)
        ],
        [
            Paragraph("<b>3. Disjointed Viewing & Appointment Scheduling</b>", table_cell_bold),
            Paragraph("Engati cannot differentiate between an in-person site visit, a Zoom walkthrough with a foreign investor, or an office consultation. It cannot auto-generate Zoom links or manage the specialized lifecycle of a real estate showing.", table_cell)
        ],
        [
            Paragraph("<b>4. Unpredictable MAU Pricing Penalties</b>", table_cell_bold),
            Paragraph("Engati's pricing frequently scales based on Monthly Active Users (MAUs). An agency generating high volumes of low-intent portal inquiries is penalized with massive platform invoices for leads that never convert.", table_cell)
        ]
    ]
    t_engati = Table(engati_issues, colWidths=[usable_width * 0.30, usable_width * 0.70])
    t_engati.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), c_card_bg),
        ('BOX', (0,0), (-1,-1), 0.75, c_card_border),
        ('INNERGRID', (0,0), (-1,-1), 0.5, c_card_border),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    elements.append(t_engati)
    elements.append(Spacer(1, 5))

    # Strategic Takeaway Box
    takeaway = [
        [Paragraph("<b>STRATEGIC ADVISORY TAKEAWAY:</b><br/>Brokerages don't fail with Gallabox or Engati because the software is broken; they fail because <b>generic tools require the brokerage to invent the real estate engine itself</b>. When agency staff lack the technical skill to build and maintain advanced sales workflows, the tool becomes an expensive, underutilized digital answering machine.", callout_style)]
    ]
    t_takeaway = Table(takeaway, colWidths=[usable_width])
    t_takeaway.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), c_danger_light),
        ('BOX', (0,0), (-1,-1), 1, c_danger_border),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ]))
    elements.append(t_takeaway)

    # End of Page 2
    elements.append(PageBreak())

    # =========================================================================
    # PAGE 3: OUR STRATEGIC STAND: BESPOKE WHITE-GLOVE ARCHITECTURE
    # =========================================================================
    elements.append(Paragraph("4. Our Stand: We Build It For Them Based On What They Already Have", section_h1))
    p3_stand_intro = (
        "The single greatest barrier to software adoption in UAE real estate is <b>change fatigue</b>. Brokerages have already "
        "invested hundreds of thousands of dirhams into their existing CRM, property listings, WhatsApp Business accounts, and agent routines. "
        "They will violently resist any tool that requires ripping out their current systems or training their agents on complex new software.<br/><br/>"
        "<b>Balos takes an uncompromising stance: ZERO RIP-AND-REPLACE.</b> We do not ask the agency to change how they operate. "
        "Instead, our engineering team acts as their technical partner, <b>custom-building and configuring Balos directly on top of "
        "their existing infrastructure.</b>"
    )
    elements.append(Paragraph(p3_stand_intro, body_style))
    elements.append(Spacer(1, 3))

    custom_layers = [
        (
            "Layer 1: Seamless CRM Two-Way Synchronization (Zero Rip-and-Replace)",
            "We build direct webhook and API connectors into their existing database of record:<br/>"
            "• <b>Supported Stacks:</b> Salesforce, HubSpot, Propertybase, Reapit, Zoho CRM, Bitrix24, or custom agency SQL databases.<br/>"
            "• <b>Automated Data Push:</b> Once Balos qualifies an inbound lead and books a viewing, the complete lead dossier, budget, Golden Visa status, and full WhatsApp chat transcript are injected instantly into their existing CRM fields without human intervention.<br/>"
            "• <b>Agency Benefit:</b> The agency retains their historical data, existing sales funnels, and reporting dashboards completely intact."
        ),
        (
            "Layer 2: Ingesting Their Exclusive Inventory & Developer Allocations",
            "Generic bots recommend static web links. Balos synchronizes directly with the agency's actual live listings portfolio:<br/>"
            "• <b>Off-Plan & Developer Feeds:</b> Ingests the agency's exclusive allocations from Emaar, Nakheel, Sobha, DAMAC, Aldar, Meraas, etc.<br/>"
            "• <b>Secondary & Resale Portfolio:</b> Connects via XML feeds, Google Sheets, or CSV uploads to sync active secondary listings, floor plans, video walkthroughs, and verified Trakheesi permit numbers.<br/>"
            "• <b>Smart Media Delivery:</b> The AI automatically pulls high-res cover cards and video walkthrough clips from their inventory to send inside WhatsApp."
        ),
        (
            "Layer 3: Tailoring To Their Exact Team Topology & Routing Hierarchy",
            "Every brokerage organizes their sales force differently. Balos adapts to the agency's specific organizational design:<br/>"
            "• <b>Community Specialization Routing:</b> Directs Downtown Dubai inquiries to their Downtown team, and Palm Jumeirah luxury leads to their prime villa desk.<br/>"
            "• <b>Language-Based Routing:</b> Detects buyer language (English, Arabic, Russian, French, Mandarin) and routes the handoff to native-speaking brokers.<br/>"
            "• <b>Team Hierarchy & Permissions:</b> Mirrors their organizational chart (Managing Director -> Sales Director -> Team Leader -> Senior Agent)."
        ),
        (
            "Layer 4: Brand Persona Tuning & White-Glove Onboarding",
            "We eliminate the agency's technical burden completely:<br/>"
            "• <b>Bespoke Conversational Tone:</b> We tune the AI prompt architecture to reflect their exact prestige—from conservative ultra-luxury private client advisory to high-energy investment dealmaking.<br/>"
            "• <b>Done-For-You Setup:</b> While Gallabox and Engati hand agencies an empty dashboard, <b>our team handles 100% of the setup, testing, and number verification</b>. The agency goes live with a fully customized engine in 48 hours."
        )
    ]

    for title, desc in custom_layers:
        elements.append(Paragraph(title, section_h2))
        elements.append(Paragraph(desc, body_style))

    # Standout Callout Box
    custom_box = [
        [Paragraph("<b>THE WINNING PROMISE FOR AGENCY PRINCIPALS:</b><br/><i>\"You don't need to hire a bot developer, you don't need to change your CRM, and you don't need to retrain your agents. We custom-build the Balos engine around your current stack, connect your active inventory, and deliver qualified viewings straight to your brokers' phones.\"</i>", callout_style)]
    ]
    t_cbox = Table(custom_box, colWidths=[usable_width])
    t_cbox.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), c_primary_light),
        ('BOX', (0,0), (-1,-1), 1, c_primary),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ]))
    elements.append(t_cbox)

    # End of Page 3
    elements.append(PageBreak())

    # =========================================================================
    # PAGE 4: THE 6 PILLARS OF BALOS SUPERIORITY (WHY WE WIN)
    # =========================================================================
    elements.append(Paragraph("5. The 6 Pillars of Balos Real Estate Engine Superiority", section_h1))
    p4_intro = (
        "In addition to custom white-glove architecture, Balos provides purpose-built real estate functionality "
        "that horizontal competitors cannot duplicate without massive custom software development."
    )
    elements.append(Paragraph(p4_intro, body_style))
    elements.append(Spacer(1, 3))

    pillars = [
        (
            "1. Turn-Key Real Estate Domain Intelligence",
            "Pre-trained on UAE property mechanics: buyer personas (High-Yield Investor, Capital Appreciation, End-User, Tenant), financing styles (Cash, UAE Bank Mortgage, Developer Payment Plan, Crypto), and prime master communities (Downtown, Palm, Dubai Hills, Lagoons)."
        ),
        (
            "2. Sub-15s Median Response SLA & 100% After-Hours Coverage",
            "Operates 24/7/365 to greet inbound international leads across Europe, Asia, and the Americas in under 15 seconds in native Asia/Dubai time (GST). Quarantines automated spam and bot clicks so brokers only speak to serious buyers."
        ),
        (
            "3. Automated UAE Golden Visa Qualification (AED 2,000,000+)",
            "The ultimate international investor conversion lever: when an inbound buyer indicates an AED 2.0M+ budget, Balos automatically flags Golden Visa eligibility and matches properties meeting Federal ICP requirements, giving brokers immediate leverage."
        ),
        (
            "4. Tri-Modal Viewing & Automated Calendar Scheduling Engine",
            "Directly schedules across three distinct formats: <b>Physical Site Visits</b> (on-location showings), <b>Virtual Zoom Walkthroughs</b> (with automatic Zoom meeting link generation for overseas clients), and <b>In-Office Consultations</b> (VIP advisory meetings)."
        ),
        (
            "5. Mobile-First Broker Co-Pilot & 1-Click Human Handoff",
            "Designed for field brokers on mobile devices: provides 1-click <b>'Take Over'</b> (instantly pauses AI) and <b>'Hand Back to AI'</b> controls, pushes structured qualification dossiers before calls, and safeguards agency lead ownership against rogue agent churn."
        ),
        (
            "6. Full-Funnel Portal Attribution & Commission Trajectory",
            "Directly connects lead sources (Property Finder, Bayut, Dubizzle, Meta Click-to-WhatsApp) through to qualified AED pipeline value and projected 2% brokerage commissions, giving leadership indisputable marketing ROI proof."
        )
    ]

    for title, desc in pillars:
        elements.append(Paragraph(title, section_h2))
        elements.append(Paragraph(desc, body_style))

    # End of Page 4
    elements.append(PageBreak())

    # =========================================================================
    # PAGE 5: SIDE-BY-SIDE COMPETITIVE MATRIX & FINANCIAL ROI MATH
    # =========================================================================
    elements.append(Paragraph("6. Direct Head-to-Head Architectural Comparison", section_h1))
    
    matrix_headers = [
        Paragraph("<b>Capability / Workflow</b>", table_header_style),
        Paragraph("<b>Gallabox (Generic BSP)</b>", table_header_style),
        Paragraph("<b>Engati (Generic CX)</b>", table_header_style),
        Paragraph("<b>Balos Lead Engine</b>", table_header_style)
    ]
    matrix_rows = [
        matrix_headers,
        [
            Paragraph("<b>Implementation Model</b>", table_cell_bold),
            Paragraph("DIY Self-Serve Canvas", table_cell_danger),
            Paragraph("Heavy Pro Services ($$$)", table_cell_danger),
            Paragraph("<b>White-Glove Built on Your Stack</b>", table_cell_success)
        ],
        [
            Paragraph("<b>Existing CRM Integration</b>", table_cell_bold),
            Paragraph("Basic Zapier / Generic connectors", table_cell),
            Paragraph("Enterprise IT setup required", table_cell),
            Paragraph("<b>Zero Rip-and-Replace Two-Way Sync</b>", table_cell_success)
        ],
        [
            Paragraph("<b>Live Inventory Ingestion</b>", table_cell_bold),
            Paragraph("❌ None (External links only)", table_cell_danger),
            Paragraph("❌ None (PDF text search only)", table_cell_danger),
            Paragraph("<b>Native Off-Plan / Ready + Video</b>", table_cell_success)
        ],
        [
            Paragraph("<b>SLA & After-Hours Capture</b>", table_cell_bold),
            Paragraph("Flow-dependent; delayed", table_cell),
            Paragraph("Flow-dependent; rigid", table_cell),
            Paragraph("<b>&lt; 15s Median AI Response 24/7</b>", table_cell_success)
        ],
        [
            Paragraph("<b>Golden Visa Screening</b>", table_cell_bold),
            Paragraph("❌ Not supported", table_cell_danger),
            Paragraph("❌ Not supported", table_cell_danger),
            Paragraph("<b>Automated (AED 2.0M+)</b>", table_cell_success)
        ],
        [
            Paragraph("<b>Viewing Formats</b>", table_cell_bold),
            Paragraph("Generic web link / Calendly", table_cell),
            Paragraph("Generic appointment ticket", table_cell),
            Paragraph("<b>Tri-Modal (Site, Zoom, Office)</b>", table_cell_success)
        ],
        [
            Paragraph("<b>Automated Zoom Provisioning</b>", table_cell_bold),
            Paragraph("❌ Requires Zapier / third-party", table_cell_danger),
            Paragraph("❌ Complex custom webhook", table_cell_danger),
            Paragraph("<b>Native Auto-Generated Zoom Links</b>", table_cell_success)
        ],
        [
            Paragraph("<b>Field Broker UX</b>", table_cell_bold),
            Paragraph("Desktop support inbox", table_cell),
            Paragraph("Enterprise ticketing interface", table_cell),
            Paragraph("<b>Mobile-First Co-Pilot + 1-Click</b>", table_cell_success)
        ],
        [
            Paragraph("<b>Pricing Structure</b>", table_cell_bold),
            Paragraph("Metered AI credits + seat add-ons", table_cell_danger),
            Paragraph("High MAU penalties & quotes", table_cell_danger),
            Paragraph("<b>Predictable Agency Tier Model</b>", table_cell_success)
        ],
        [
            Paragraph("<b>Marketing Attribution</b>", table_cell_bold),
            Paragraph("Generic UTM tags", table_cell),
            Paragraph("Customer Data Platform (CDP)", table_cell),
            Paragraph("<b>Bayut/PF/Meta to 2% Commission</b>", table_cell_success)
        ]
    ]

    col_w1 = usable_width * 0.28
    col_w2 = usable_width * 0.24
    col_w3 = usable_width * 0.24
    col_w4 = usable_width * 0.24
    t_matrix = Table(matrix_rows, colWidths=[col_w1, col_w2, col_w3, col_w4])
    t_matrix.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), c_dark),
        ('BOX', (0,0), (-1,-1), 0.75, c_card_border),
        ('INNERGRID', (0,0), (-1,-1), 0.5, c_card_border),
        ('TOPPADDING', (0,0), (-1,-1), 2.2),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2.2),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
    ]))
    elements.append(t_matrix)
    elements.append(Spacer(1, 5))

    # 7. The Commercial ROI Math for Agency Principals
    elements.append(Paragraph("7. The Commercial ROI Math for UAE Brokerage Principals", section_h1))
    
    roi_cards = [
        [
            Paragraph("<b>THE COST OF LEAD LEAKAGE (WITHOUT BALOS)</b>", ParagraphStyle('RH1', fontName='Helvetica-Bold', fontSize=8, leading=10, textColor=c_danger_text)),
            Paragraph("<b>THE BALOS REVENUE EQUATION (WITH BALOS)</b>", ParagraphStyle('RH2', fontName='Helvetica-Bold', fontSize=8, leading=10, textColor=c_success_text))
        ],
        [
            Paragraph(
                "• Monthly Inbound Inquiries: 250 leads<br/>"
                "• After-hours / overseas inquiries (60%): 150 leads<br/>"
                "• Slow human response time (>4 hours): 40% ghost rate<br/>"
                "• Leaked high-intent overseas buyers: <b>~4 leads per month</b><br/>"
                "• <b>Lost Commission Potential (2% on AED 3M): AED 240,000 / mo</b><br/>"
                "<i>Generic tools fail to stop this because they lack instant qualification and automatic Zoom booking.</i>",
                body_style
            ),
            Paragraph(
                "• Sub-15s response stops lead leakage 100% 24/7.<br/>"
                "• Automatically screens Golden Visa & books Zoom appointments.<br/>"
                "• Closing just <b>ONE extra transaction per quarter</b> at AED 2.5M yields <b>AED 50,000 in brokerage commission</b>.<br/>"
                "• <b>Net Annual ROI on Balos: 500% to 1,200%+</b>.<br/>"
                "<i>Balos pays for itself entirely within the first closed deal.</i>",
                body_style
            )
        ]
    ]
    t_roi = Table(roi_cards, colWidths=[usable_width * 0.5, usable_width * 0.5])
    t_roi.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (0,0), c_danger_light),
        ('BACKGROUND', (1,0), (1,0), c_success_light),
        ('BACKGROUND', (0,1), (-1,-1), c_card_bg),
        ('BOX', (0,0), (-1,-1), 1, c_card_border),
        ('INNERGRID', (0,0), (-1,-1), 0.5, c_card_border),
        ('TOPPADDING', (0,0), (-1,-1), 3.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3.5),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    elements.append(t_roi)

    # End of Page 5
    elements.append(PageBreak())

    # =========================================================================
    # PAGE 6: FIELD-TESTED ADVISOR SCRIPT & 14-DAY PILOT OFFER
    # =========================================================================
    elements.append(Paragraph("8. Field-Tested Advisor Script & Objection Handling Playbook", section_h1))
    p6_intro = (
        "When our UAE industry advisor introduces Balos to agency principals, managing directors, or top-producing teams, "
        "use this exact script and objection handling framework:"
    )
    elements.append(Paragraph(p6_intro, body_style))
    elements.append(Spacer(1, 2))

    objections = [
        (
            "Objection 1: \"We already have a CRM and systems in place; we don't want to change software.\"",
            "<b>Advisor Response:</b><br/>"
            "<i>\"You don't change anything. That is the exact reason brokerages choose Balos. Competitors ask you to adapt to their "
            "generic tool. Balos adapts to you. We custom-build the integration directly on top of your current CRM, your current WhatsApp number, "
            "and your active developer listings. Balos simply acts as the high-speed qualification engine at the front, pushing booked viewings "
            "and enriched buyer profiles straight into your existing database.\"</i>"
        ),
        (
            "Objection 2: \"We already use Gallabox / a WhatsApp chatbot platform.\"",
            "<b>Advisor Response:</b><br/>"
            "<i>\"Gallabox is great for broadcasting property brochures, but what happens when an overseas investor from the UK "
            "messages your ad on a Friday night at 11 PM asking about a 2-bedroom off-plan unit with a payment plan? Gallabox makes them "
            "wait for an agent or shows a static menu. By Saturday morning, that investor has messaged two other agencies.<br/>"
            "Balos isn't a broadcasting tool; it's an autonomous sales engine. It qualifies their AED budget, checks their Golden Visa "
            "eligibility, and books a Zoom walkthrough straight onto your broker's calendar within 60 seconds.\"</i>"
        ),
        (
            "Objection 3: \"Engati offers enterprise AI; can't we just train it on our PDF listings?\"",
            "<b>Advisor Response:</b><br/>"
            "<i>\"You can train Engati to answer FAQs from PDFs, but answering questions doesn't qualify a buyer or close a deal. "
            "Engati doesn't know what a 60/40 payment plan is, doesn't calculate Golden Visa thresholds, and doesn't know how to separate "
            "high-yield investors from tenants. Furthermore, your brokers work on phones in the field, not at desks managing enterprise tickets. "
            "Balos is built specifically for how real estate brokers actually close transactions.\"</i>"
        ),
        (
            "Objection 4: \"Our brokers prefer using their personal WhatsApp numbers to talk to clients.\"",
            "<b>Advisor Response:</b><br/>"
            "<i>\"That is the #1 risk for every brokerage principal in Dubai. When agents use personal numbers, you have zero visibility into "
            "response times, leads get dropped when agents are busy, and when a top broker leaves your firm, they take your multi-million "
            "dirham client book with them. Balos provides the agency with 100% centralized lead ownership, logs every interaction, and gives "
            "the broker a seamless 1-click mobile takeover button. It protects both the broker's sanity and the agency's enterprise value.\"</i>"
        )
    ]

    for title, desc in objections:
        elements.append(Paragraph(title, section_h2))
        elements.append(Paragraph(desc, body_style))

    elements.append(Spacer(1, 3))

    # The 14-Day Zero-Risk Pilot Offer Box
    elements.append(Paragraph("9. The Advisory Call-to-Action: The 14-Day Zero-Leakage Pilot", section_h1))
    pilot_text = (
        "<b>Offer this exact pilot to any interested UAE brokerage:</b><br/>"
        "<i>\"We don't ask you to change your existing CRM or cancel any software today. Let our engineers connect Balos to one of your active "
        "Meta Click-to-WhatsApp ad campaigns or a single portal listing line for 14 days, built around your current listings and team. "
        "We will guarantee a sub-15s response time on 100% of after-hours inquiries, automatically screen every lead for Golden Visa eligibility, "
        "and book qualified Zoom or site viewings directly onto your brokers' phones. If Balos doesn't book you more qualified viewings in 14 days "
        "than your current setup, you pay nothing.\"</i>"
    )
    pilot_box = [
        [Paragraph(pilot_text, callout_style)]
    ]
    t_pilot = Table(pilot_box, colWidths=[usable_width])
    t_pilot.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), c_primary_light),
        ('BOX', (0,0), (-1,-1), 1, c_primary),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ]))
    elements.append(t_pilot)
    elements.append(Spacer(1, 3))

    # Sign-off box
    signoff_data = [
        [
            Paragraph(
                "<b>Document Title:</b> Why UAE Real Estate Brokerages Choose Balos Over Generic Competitors<br/>"
                "<b>Target Applications:</b> Dubai & UAE Real Estate Brokerages, Developer Sales Teams, High-Performing Agency Units<br/>"
                "<b>Official Repository & Product Demo:</b> <font color='#0B6E6E'><u>https://github.com/mrtee-xs/-Balos-LCE</u></font>",
                body_style
            )
        ]
    ]
    signoff_table = Table(signoff_data, colWidths=[usable_width])
    signoff_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), c_card_bg),
        ('BOX', (0,0), (-1,-1), 1, c_card_border),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ]))
    elements.append(signoff_table)

    doc.build(elements, canvasmaker=NumberedCanvas)
    print(f"Successfully generated {output_filename}")

if __name__ == "__main__":
    out_pdf = "Balos_Why_UAE_Agencies_Choose_Us.pdf"
    if len(sys.argv) > 1:
        out_pdf = sys.argv[1]
    generate_competitive_advantage_pdf(out_pdf)
