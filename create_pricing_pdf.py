import os
import sys
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
)
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    """
    Two-pass canvas for precise running header and footer across all pages.
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
            self.draw_decorations(num_pages)
            canvas.Canvas.showPage(self)
        canvas.Canvas.save(self)

    def draw_decorations(self, page_count):
        self.saveState()
        margin = 36
        right_margin = letter[0] - margin

        # Header rule & text
        self.setFont("Helvetica-Bold", 7.5)
        self.setFillColor(colors.HexColor("#0B6E6E"))
        self.drawString(margin, letter[1] - 26, "BALOS LEAD CONVERSION ENGINE (BALOS LCE)")

        self.setFont("Helvetica", 7.5)
        self.setFillColor(colors.HexColor("#64748B"))
        self.drawRightString(right_margin, letter[1] - 26, "COMMERCIAL PRICING & ADD-ONS DOSSIER (AED)")

        self.setStrokeColor(colors.HexColor("#CBD5E1"))
        self.setLineWidth(0.5)
        self.line(margin, letter[1] - 30, right_margin, letter[1] - 30)

        # Footer rule & text
        self.setStrokeColor(colors.HexColor("#E2E8F0"))
        self.setLineWidth(0.5)
        self.line(margin, 26, right_margin, 26)

        self.setFont("Helvetica-Bold", 7)
        self.setFillColor(colors.HexColor("#0B6E6E"))
        self.drawString(margin, 16, "BALOS LCE")

        self.setFont("Helvetica", 7)
        self.setFillColor(colors.HexColor("#64748B"))
        self.drawString(margin + 55, 16, "•  CONFIDENTIAL & PROPRIETARY  •  ALL PLANS INCLUDE UNLIMITED BROKER SEATS  •  CURRENCY: AED")

        page_str = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(right_margin, 16, page_str)
        self.restoreState()


def generate_pricing_dossier_pdf(output_filename="Balos_Commercial_Pricing_Table.pdf"):
    margin = 36
    usable_width = letter[0] - (2 * margin) # 612 - 72 = 540 pt

    doc = SimpleDocTemplate(
        output_filename,
        pagesize=letter,
        leftMargin=margin,
        rightMargin=margin,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()

    # Colors
    c_primary = colors.HexColor("#0B6E6E")      # Deep Emerald Creek
    c_primary_light = colors.HexColor("#F0F7F6")# Mint Cream wash
    c_dark = colors.HexColor("#12262B")         # Obsidian
    c_gold = colors.HexColor("#B4820E")         # Dubai Gold
    c_gold_light = colors.HexColor("#FFFBEB")   # Warm gold tint
    c_slate = colors.HexColor("#334155")
    c_slate_dark = colors.HexColor("#0F172A")
    c_border = colors.HexColor("#E2E8F0")
    c_card_bg = colors.HexColor("#F8FAFC")

    # Typography
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=16,
        leading=19,
        textColor=c_dark,
        spaceAfter=2
    )

    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.2,
        leading=11,
        textColor=c_primary,
        spaceAfter=5
    )

    section_h1 = ParagraphStyle(
        'SectionH1',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=13,
        textColor=c_primary,
        spaceBefore=6,
        spaceAfter=3,
        keepWithNext=True
    )

    th_feature = ParagraphStyle(
        'THFeature',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=7.2,
        leading=9,
        textColor=colors.white,
        alignment=0
    )

    th_tier = ParagraphStyle(
        'THTier',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=7.5,
        leading=9.5,
        textColor=colors.white,
        alignment=1
    )

    th_anchor = ParagraphStyle(
        'THAnchor',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=10,
        textColor=colors.HexColor("#FEF08A"),
        alignment=1
    )

    td_feature = ParagraphStyle(
        'TDFeature',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=6.8,
        leading=8.5,
        textColor=c_dark
    )

    td_cell = ParagraphStyle(
        'TDCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=6.5,
        leading=8.3,
        textColor=c_slate_dark,
        alignment=1
    )

    td_anchor_cell = ParagraphStyle(
        'TDAnchorCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=6.5,
        leading=8.3,
        textColor=c_slate_dark,
        alignment=1
    )

    td_anchor_cell_bold = ParagraphStyle(
        'TDAnchorCellBold',
        parent=td_anchor_cell,
        fontName='Helvetica-Bold',
        textColor=c_primary
    )

    badge_unlimited = ParagraphStyle(
        'BadgeUnlimited',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=7,
        leading=8.8,
        textColor=colors.HexColor("#065F46"),
        alignment=1
    )

    badge_anchor_unlimited = ParagraphStyle(
        'BadgeAnchorUnlimited',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=7.2,
        leading=9,
        textColor=c_primary,
        alignment=1
    )

    note_title = ParagraphStyle(
        'NoteTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=7.5,
        leading=9.5,
        textColor=c_primary,
        spaceAfter=2
    )

    note_body = ParagraphStyle(
        'NoteBody',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=6.8,
        leading=9,
        textColor=c_slate
    )

    elements = []

    # =========================================================================
    # PAGE 1: CORE COMMERCIAL PRICING MATRIX (AED)
    # =========================================================================
    elements.append(Paragraph("Balos Commercial Pricing & Packaging", title_style))
    elements.append(Paragraph("UAE Real Estate Edition • Unlimited Broker Seats Across All Tiers • Currency: AED", subtitle_style))

    # Banner: Unlimited Seats Highlight
    banner_data = [
        [
            Paragraph("<b>CORE POLICY: UNLIMITED AGENT SEATS ACROSS ALL TIERS</b><br/>"
                      "<font color='#334155'>We never penalize agencies for growing their team. Every Balos subscription includes "
                      "<b>unlimited broker seats and mobile logins</b> at zero extra cost. All prices in AED (excl. 5% UAE VAT).</font>", 
                      ParagraphStyle('BannerText', parent=styles['Normal'], fontName='Helvetica', fontSize=7, leading=9.2, textColor=c_dark))
        ]
    ]
    t_banner = Table(banner_data, colWidths=[usable_width])
    t_banner.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), c_gold_light),
        ('BOX', (0,0), (-1,-1), 1, c_gold),
        ('TOPPADDING', (0,0), (-1,-1), 2.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ]))
    elements.append(t_banner)
    elements.append(Spacer(1, 4))

    # PRICING TABLE MATRIX
    col_feat = usable_width * 0.28   # 151.2 pt
    col_t1   = usable_width * 0.17   # 91.8 pt (Starter)
    col_t2   = usable_width * 0.20   # 108 pt (Growth - wider for anchor emphasis)
    col_t3   = usable_width * 0.17   # 91.8 pt (Scale)
    col_t4   = usable_width * 0.18   # 97.2 pt (Enterprise)

    table_data = [
        # Row 0: Headers
        [
            Paragraph("<b>Plan / Capability</b>", th_feature),
            Paragraph("<b>Starter</b><br/><font size=6 color='#E2E8F0'>Boutique Teams</font>", th_tier),
            Paragraph("<b>Growth (Core)</b><br/><font size=6 color='#FEF08A'>★ Most Popular</font>", th_anchor),
            Paragraph("<b>Scale</b><br/><font size=6 color='#E2E8F0'>Multi-Team Agencies</font>", th_tier),
            Paragraph("<b>Enterprise</b><br/><font size=6 color='#E2E8F0'>Developers / Brokerages</font>", th_tier),
        ],
        # Row 1: Monthly Price in AED
        [
            Paragraph("<b>Monthly Retainer (AED)</b>", td_feature),
            Paragraph("<b>AED 1,999</b> / mo", ParagraphStyle('P1', parent=td_cell, fontName='Helvetica-Bold', fontSize=7.5, textColor=c_dark)),
            Paragraph("<b>AED 4,999</b> / mo", ParagraphStyle('P2', parent=td_cell, fontName='Helvetica-Bold', fontSize=8, textColor=c_primary)),
            Paragraph("<b>AED 9,999</b> / mo", ParagraphStyle('P3', parent=td_cell, fontName='Helvetica-Bold', fontSize=7.5, textColor=c_dark)),
            Paragraph("<b>Custom Quote</b><br/><font size=5.2 color='#64748B'>(Bespoke Scope)</font>", ParagraphStyle('P4', parent=td_cell, fontName='Helvetica-Bold', fontSize=7.2, textColor=c_dark)),
        ],
        # Row 2: Founding Partner Offer in AED
        [
            Paragraph("<b>Founding Partner Rate</b><br/><font size=5.2 color='#64748B'>First 10 Agencies (Lifetime Lock)</font>", td_feature),
            Paragraph("—", td_cell),
            Paragraph("<b>AED 3,999 / mo</b><br/><font size=5.5 color='#B4820E'><b>LIFETIME LOCK</b></font>", td_anchor_cell_bold),
            Paragraph("—", td_cell),
            Paragraph("<b>Custom Quote</b>", td_cell),
        ],
        # Row 3: Agent Seats (UNLIMITED ACROSS ALL)
        [
            Paragraph("<b>Broker / Agent Seats</b><br/><font size=5.2 color='#047857'>Zero Per-Seat Fees</font>", td_feature),
            Paragraph("<b>UNLIMITED</b>", badge_unlimited),
            Paragraph("<b>UNLIMITED</b>", badge_anchor_unlimited),
            Paragraph("<b>UNLIMITED</b>", badge_unlimited),
            Paragraph("<b>UNLIMITED</b>", badge_unlimited),
        ],
        # Row 4: Included Conversations
        [
            Paragraph("<b>Included Conversations</b><br/><font size=5.2 color='#64748B'>Active Inbound Leads / Mo</font>", td_feature),
            Paragraph("<b>500</b> / month", td_cell),
            Paragraph("<b>2,000</b> / month", td_anchor_cell_bold),
            Paragraph("<b>6,000</b> / month", td_cell),
            Paragraph("<b>Custom Pooled Volume</b>", td_cell),
        ],
        # Row 5: WhatsApp Numbers
        [
            Paragraph("<b>Active WhatsApp Lines</b>", td_feature),
            Paragraph("1 Dedicated Number", td_cell),
            Paragraph("1 Dedicated Number", td_anchor_cell),
            Paragraph("3 Dedicated Numbers", td_cell),
            Paragraph("Dedicated Multi-Line Pool", td_cell),
        ],
        # Row 6: 24/7 AI Qualification SLA
        [
            Paragraph("<b>24/7 AI Qualification SLA</b><br/><font size=5.2 color='#64748B'>Instant Response 24/7/365</font>", td_feature),
            Paragraph("&lt; 15s Median Response", td_cell),
            Paragraph("<b>&lt; 15s Median Response</b>", td_anchor_cell_bold),
            Paragraph("&lt; 15s Median Response", td_cell),
            Paragraph("&lt; 15s Median Response", td_cell),
        ],
        # Row 7: UAE Real Estate Intelligence
        [
            Paragraph("<b>Real Estate Logic & Flow</b><br/><font size=5.2 color='#64748B'>Budget, Prime Areas, Financing</font>", td_feature),
            Paragraph("Full Domain Intelligence", td_cell),
            Paragraph("Full Domain Intelligence", td_anchor_cell),
            Paragraph("Full Domain Intelligence", td_cell),
            Paragraph("Bespoke Scripts & Prompt Tuning", td_cell),
        ],
        # Row 8: Golden Visa Screening
        [
            Paragraph("<b>Golden Visa Qualification</b><br/><font size=5.2 color='#64748B'>Automated for AED 2.0M+ Budgets</font>", td_feature),
            Paragraph("Included", td_cell),
            Paragraph("<b>Included</b>", td_anchor_cell_bold),
            Paragraph("Included", td_cell),
            Paragraph("Included", td_cell),
        ],
        # Row 9: Tri-Modal Viewing Booking
        [
            Paragraph("<b>Viewing & Calendar Engine</b><br/><font size=5.2 color='#64748B'>Site Visits, Zoom & Consultations</font>", td_feature),
            Paragraph("Site Visits & Calls", td_cell),
            Paragraph("<b>Site, Zoom & Office</b>", td_anchor_cell_bold),
            Paragraph("Site, Zoom & Office", td_cell),
            Paragraph("Custom VIP Workflows", td_cell),
        ],
        # Row 10: 1-Tap Mobile Agent Takeover
        [
            Paragraph("<b>1-Tap Broker Takeover</b><br/><font size=5.2 color='#64748B'>Mobile Co-Pilot & Private Notes</font>", td_feature),
            Paragraph("Included for All Agents", td_cell),
            Paragraph("<b>Included for All Agents</b>", td_anchor_cell_bold),
            Paragraph("Included for All Agents", td_cell),
            Paragraph("Included for All Agents", td_cell),
        ],
        # Row 11: Multilingual Language Support
        [
            Paragraph("<b>Multilingual Language Support</b><br/><font size=5.2 color='#64748B'>Cross-Border Investor Desks</font>", td_feature),
            Paragraph("English Only", td_cell),
            Paragraph("<b>English & Arabic (العربية)</b>", td_anchor_cell_bold),
            Paragraph("<b>Full Multilingual Suite</b><br/><font size=5 color='#64748B'>English, Arabic, Russian, French, Chinese</font>", td_cell),
            Paragraph("<b>All Global Languages</b><br/><font size=5 color='#64748B'>Custom Dialects & Local Voice</font>", td_cell),
        ],
        # Row 12: Lead Source & Attribution
        [
            Paragraph("<b>Marketing Attribution</b><br/><font size=5.2 color='#64748B'>Portals (PF, Bayut), Meta Ads</font>", td_feature),
            Paragraph("Basic Source Tagging", td_cell),
            Paragraph("<b>Full Channel ROI & Pipeline</b>", td_anchor_cell_bold),
            Paragraph("Full ROI + Junk Shield", td_cell),
            Paragraph("Custom BI & Data Warehouse", td_cell),
        ],
        # Row 13: CRM Integration
        [
            Paragraph("<b>CRM & Database Sync</b><br/><font size=5.2 color='#64748B'>HubSpot, Salesforce, Reapit, etc.</font>", td_feature),
            Paragraph("CSV One-Click Export", td_cell),
            Paragraph("<b>1 Direct Two-Way Sync</b>", td_anchor_cell_bold),
            Paragraph("Up to 3 Two-Way Syncs", td_cell),
            Paragraph("Bespoke Enterprise API", td_cell),
        ],
        # Row 14: Setup & Onboarding Fee in AED
        [
            Paragraph("<b>One-Time Setup Fee</b><br/><font size=5.2 color='#64748B'>Waived on Annual Prepay</font>", td_feature),
            Paragraph("AED 1,500", td_cell),
            Paragraph("<b>AED 3,500</b><br/><font size=5.2 color='#B4820E'><b>(AED 1,500 for Founders)</b></font>", td_anchor_cell),
            Paragraph("AED 7,500", td_cell),
            Paragraph("<b>Custom Quote</b>", td_cell),
        ],
        # Row 15: Support SLA
        [
            Paragraph("<b>Success & Support SLA</b>", td_feature),
            Paragraph("Email & WhatsApp Support", td_cell),
            Paragraph("<b>Monthly Strategy Review</b>", td_anchor_cell_bold),
            Paragraph("Weekly Dedicated Call", td_cell),
            Paragraph("Dedicated Account Director", td_cell),
        ],
    ]

    t_matrix = Table(table_data, colWidths=[col_feat, col_t1, col_t2, col_t3, col_t4])
    t_matrix.setStyle(TableStyle([
        # Headers
        ('BACKGROUND', (0,0), (-1,0), c_dark),
        ('BACKGROUND', (2,0), (2,0), c_primary),
        # Growth Anchor Highlight
        ('BACKGROUND', (2,1), (2,-1), c_primary_light),
        # Borders
        ('BOX', (0,0), (-1,-1), 1, c_border),
        ('BOX', (2,0), (2,-1), 1.5, c_primary),
        ('INNERGRID', (0,0), (-1,-1), 0.35, c_border),
        # Padding
        ('TOPPADDING', (0,0), (-1,-1), 1.8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 1.8),
        ('LEFTPADDING', (0,0), (-1,-1), 3),
        ('RIGHTPADDING', (0,0), (-1,-1), 3),
        # Alternating background for other columns
        ('ROWBACKGROUNDS', (0,1), (1,-1), [colors.white, c_card_bg]),
        ('ROWBACKGROUNDS', (3,1), (-1,-1), [colors.white, c_card_bg]),
    ]))
    elements.append(t_matrix)
    elements.append(Spacer(1, 4))

    # Notes & Policies on Page 1
    notes_data = [
        [
            Paragraph("<b>COMMERCIAL TERMS & POLICIES (AED):</b>", note_title),
            Paragraph("<b>THE FOUNDING PARTNER GUARANTEE:</b>", note_title)
        ],
        [
            Paragraph(
                "• <b>Unlimited Agent Seats:</b> Onboard your entire brokerage team at zero extra cost. No per-seat penalties.<br/>"
                "• <b>Annual Prepay Incentive:</b> Pay 10 months upfront, get 12 months of service (2 months free) + 100% setup fee waiver.<br/>"
                "• <b>Conversation Overages:</b> AED 1.50 per qualified conversation beyond plan limits (or save via Boost Packs on Page 2).<br/>"
                "• <b>Taxes & Currency:</b> All pricing quoted in AED (Arab Emirates Dirham), excluding applicable 5% UAE VAT.",
                note_body
            ),
            Paragraph(
                "• <b>Exclusive Founding Rate:</b> First 10 agencies secure Growth at <b>AED 3,999/mo for life</b> (save AED 12,000/yr).<br/>"
                "• <b>Discounted Setup:</b> Done-for-you inventory loading and broker routing for <b>AED 1,500</b> (regularly AED 3,500).<br/>"
                "• <b>30-Day Performance Assurance:</b> If Balos does not book at least 5 qualified viewings in your first 30 days (min. 150 inquiries), we refund your setup and first month in full.<br/>"
                "• <b>Enterprise:</b> All Enterprise deployments are quoted based on bespoke integration & volume.",
                note_body
            )
        ]
    ]
    t_notes = Table(notes_data, colWidths=[usable_width * 0.5, usable_width * 0.5])
    t_notes.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), c_card_bg),
        ('BOX', (0,0), (-1,-1), 0.75, c_border),
        ('INNERGRID', (0,0), (-1,-1), 0.5, c_border),
        ('TOPPADDING', (0,0), (-1,-1), 2.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2.5),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    elements.append(t_notes)

    # =========================================================================
    # PAGE 2: MODULAR ADD-ONS CATALOG & OVERAGE PACKS (AED)
    # =========================================================================
    elements.append(PageBreak())

    elements.append(Paragraph("Balos Modular Add-Ons & Expansion Packs", title_style))
    elements.append(Paragraph("Flexible Capacity & High-ROI Extensions • Currency: AED", subtitle_style))
    elements.append(Spacer(1, 4))

    # SECTION 1: Conversation Boost Packs
    elements.append(Paragraph("1. Conversation Boost Packs (When Monthly Plan Volume Is Exhausted)", section_h1))
    intro_packs = (
        "Never lose a lead due to capped volume. If an agency experiences an ad spend surge or developer project launch, "
        "pre-purchased Boost Packs provide significant volume discounts over standard pay-as-you-go rates."
    )
    elements.append(Paragraph(intro_packs, note_body))
    elements.append(Spacer(1, 3))

    boost_headers = [
        Paragraph("<b>Boost Pack Tier</b>", ParagraphStyle('BH1', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=7.5, textColor=colors.white)),
        Paragraph("<b>Additional Volume</b>", ParagraphStyle('BH2', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=7.5, textColor=colors.white, alignment=1)),
        Paragraph("<b>Price (AED)</b>", ParagraphStyle('BH3', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=7.5, textColor=colors.white, alignment=1)),
        Paragraph("<b>Effective Cost / Convo</b>", ParagraphStyle('BH4', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=7.5, textColor=colors.white, alignment=1)),
        Paragraph("<b>Savings vs Overage</b>", ParagraphStyle('BH5', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=7.5, textColor=colors.white, alignment=1)),
    ]
    boost_rows = [
        boost_headers,
        [
            Paragraph("<b>Pay-As-You-Go Overage</b>", td_feature),
            Paragraph("Billed per conversation", td_cell),
            Paragraph("<b>AED 1.50</b> / convo", td_cell),
            Paragraph("AED 1.50", td_cell),
            Paragraph("Standard Baseline", td_cell),
        ],
        [
            Paragraph("<b>+1,000 Conversation Pack</b>", td_feature),
            Paragraph("+1,000 Inbound Inquiries", td_cell),
            Paragraph("<b>AED 1,100</b> one-time", ParagraphStyle('B1', parent=td_cell, fontName='Helvetica-Bold', textColor=c_primary)),
            Paragraph("<b>AED 1.10</b> / convo", td_cell),
            Paragraph("<b>27% Discount</b>", ParagraphStyle('S1', parent=td_cell, fontName='Helvetica-Bold', textColor=colors.HexColor("#065F46"))),
        ],
        [
            Paragraph("<b>+2,500 Conversation Pack</b>", td_feature),
            Paragraph("+2,500 Inbound Inquiries", td_cell),
            Paragraph("<b>AED 2,200</b> one-time", ParagraphStyle('B2', parent=td_cell, fontName='Helvetica-Bold', textColor=c_primary)),
            Paragraph("<b>AED 0.88</b> / convo", td_cell),
            Paragraph("<b>41% Discount</b>", ParagraphStyle('S2', parent=td_cell, fontName='Helvetica-Bold', textColor=colors.HexColor("#065F46"))),
        ],
        [
            Paragraph("<b>+5,000 Conversation Pack</b>", td_feature),
            Paragraph("+5,000 Inbound Inquiries", td_cell),
            Paragraph("<b>AED 3,650</b> one-time", ParagraphStyle('B3', parent=td_cell, fontName='Helvetica-Bold', textColor=c_primary)),
            Paragraph("<b>AED 0.73</b> / convo", td_cell),
            Paragraph("<b>51% Discount</b>", ParagraphStyle('S3', parent=td_cell, fontName='Helvetica-Bold', textColor=colors.HexColor("#065F46"))),
        ],
    ]
    t_boost = Table(boost_rows, colWidths=[usable_width * 0.28, usable_width * 0.22, usable_width * 0.18, usable_width * 0.16, usable_width * 0.16])
    t_boost.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), c_dark),
        ('BOX', (0,0), (-1,-1), 1, c_border),
        ('INNERGRID', (0,0), (-1,-1), 0.4, c_border),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, c_card_bg]),
    ]))
    elements.append(t_boost)
    elements.append(Spacer(1, 6))

    # SECTION 2: Infrastructure & Feature Add-Ons
    elements.append(Paragraph("2. Infrastructure & Specialized Revenue Add-Ons", section_h1))
    
    addons_headers = [
        Paragraph("<b>Add-On Module</b>", ParagraphStyle('AH1', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=7.5, textColor=colors.white)),
        Paragraph("<b>Pricing (AED)</b>", ParagraphStyle('AH2', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=7.5, textColor=colors.white, alignment=1)),
        Paragraph("<b>Scope & Value Delivered</b>", ParagraphStyle('AH3', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=7.5, textColor=colors.white)),
    ]
    addons_rows = [
        addons_headers,
        [
            Paragraph("<b>Additional WhatsApp Line</b>", td_feature),
            Paragraph("<b>AED 750</b> / mo<br/><font size=5.5 color='#64748B'>(per number)</font>", td_cell),
            Paragraph("Deploy dedicated lines for specific sub-communities (e.g. Palm Jumeirah luxury desk), off-plan project campaigns, or dedicated marketing landing pages.", note_body),
        ],
        [
            Paragraph("<b>Additional CRM Two-Way Connector</b>", td_feature),
            Paragraph("<b>AED 550</b> / mo<br/><font size=5.5 color='#64748B'>(per connector)</font>", td_cell),
            Paragraph("Sync live qualified lead dossiers and chat transcripts with secondary CRMs or property databases (Salesforce, Reapit, Propertybase, Zoho, or Custom SQL).", note_body),
        ],
        [
            Paragraph("<b>Multilingual Language Expansion</b><br/><font size=5.5 color='#64748B'>Standalone Add-on for Starter</font>", td_feature),
            Paragraph("<b>AED 750</b> / mo<br/><font size=5.5 color='#64748B'>(per language pack)</font>", td_cell),
            Paragraph("Adds native language detection and cultural conversational fluency in Arabic, Russian, Mandarin, French, or Hindi for international buyer campaigns.", note_body),
        ],
        [
            Paragraph("<b>Custom Off-Plan Inventory Ingestion</b>", td_feature),
            Paragraph("<b>AED 1,100</b> / project<br/><font size=5.5 color='#64748B'>(one-time load)</font>", td_cell),
            Paragraph("White-glove ingestion of complex developer off-plan allocations: floor plans, 60/40 or 80/20 payment plan matrices, video tours, and RERA Trakheesi permits.", note_body),
        ],
    ]
    t_addons = Table(addons_rows, colWidths=[usable_width * 0.30, usable_width * 0.20, usable_width * 0.50])
    t_addons.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), c_dark),
        ('BOX', (0,0), (-1,-1), 1, c_border),
        ('INNERGRID', (0,0), (-1,-1), 0.4, c_border),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, c_card_bg]),
    ]))
    elements.append(t_addons)
    elements.append(Spacer(1, 6))

    # SECTION 3: The Zero-Downtime & Overage Guarantee
    elements.append(Paragraph("3. Zero-Downtime Lead Protection Policy", section_h1))
    policy_box = [
        [
            Paragraph("<b>THE BALOS ZERO-LEAKAGE GUARANTEE:</b><br/>"
                      "Balos will <b>never shut down or cut off a high-net-worth buyer mid-conversation</b> if an agency reaches 100% of their monthly conversation limit. "
                      "When an account reaches 85% capacity, an automated notification is sent to the agency administrator. If the limit is reached, inquiries continue to be answered "
                      "seamlessly without interruption at standard overage rates (AED 1.50/convo) or through your pre-authorized Boost Pack. "
                      "<b>Your revenue pipeline is protected 24/7/365.</b>", 
                      ParagraphStyle('PolicyText', parent=styles['Normal'], fontName='Helvetica', fontSize=7.2, leading=10, textColor=c_dark))
        ]
    ]
    t_pbox = Table(policy_box, colWidths=[usable_width])
    t_pbox.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), c_primary_light),
        ('BOX', (0,0), (-1,-1), 1, c_primary),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ]))
    elements.append(t_pbox)

    doc.build(elements, canvasmaker=NumberedCanvas)
    print(f"Successfully generated {output_filename}")

if __name__ == "__main__":
    out_name = "Balos_Commercial_Pricing_Table.pdf"
    if len(sys.argv) > 1:
        out_name = sys.argv[1]
    generate_pricing_dossier_pdf(out_name)
