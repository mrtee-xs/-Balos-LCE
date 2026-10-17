// scripts/generate_sql_seed.js
const fs = require('fs');
const path = require('path');

console.log("Generating comprehensive UAE Real Estate Demo Seed (73 leads + properties + agents + bookings + messages)...");

// 1. Agents
const agents = [
  { id: '11111111-1111-4111-8111-111111111111', name: 'Balogun Joshua', email: 'balogun@balosrealestate.ae', phone: '+971 50 111 2233', role: 'admin', rera: 'BRN-48921', langs: "ARRAY['English', 'Yoruba']" },
  { id: '22222222-2222-4222-8222-222222222222', name: 'Sarah Jenkins', email: 'sarah.j@balosrealestate.ae', phone: '+971 52 333 4455', role: 'sales_leader', rera: 'BRN-39102', langs: "ARRAY['English', 'French']" },
  { id: '33333333-3333-4333-8333-333333333333', name: 'Omar Al-Mansoor', email: 'omar.m@balosrealestate.ae', phone: '+971 55 777 8899', role: 'team_leader', rera: 'BRN-51209', langs: "ARRAY['Arabic', 'English']" },
  { id: '44444444-4444-4444-8444-444444444444', name: 'Tariq Vance', email: 'tariq.v@balosrealestate.ae', phone: '+971 58 999 0011', role: 'agent', rera: 'BRN-62840', langs: "ARRAY['English', 'Urdu', 'Hindi']" }
];

// 2. Properties
const properties = [
  {
    id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    title: 'Burj Royale Luxury 2BR Suite',
    developer: 'Emaar Properties',
    project_name: 'Burj Royale',
    community: 'Downtown Dubai',
    sub_community: 'Opera District',
    category: 'APARTMENT',
    market_type: 'READY_SECONDARY',
    price_aed: 3200000,
    bedrooms: 2,
    bathrooms: 2,
    size_sqft: 1150,
    handover_date: 'Ready',
    service_charge: 22.5,
    roi: 7.8,
    golden_visa: true,
    permit: 'TRAK-DXB-98214',
    status: 'AVAILABLE',
    desc: 'Breathtaking Burj Khalifa and Dubai Fountain views. High-floor luxury apartment with premium finishings and turnkey designer furniture.',
    images: "ARRAY['/properties/burj_royale_downtown.jpg']"
  },
  {
    id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    title: 'DAMAC Lagoons Mediterranean Villa',
    developer: 'DAMAC Properties',
    project_name: 'DAMAC Lagoons - Santorini',
    community: 'DAMAC Lagoons',
    sub_community: 'Santorini Cluster',
    category: 'VILLA',
    market_type: 'OFF_PLAN',
    price_aed: 4500000,
    bedrooms: 4,
    bathrooms: 5,
    size_sqft: 3200,
    handover_date: 'Q4 2026',
    service_charge: 14.0,
    roi: 8.5,
    golden_visa: true,
    permit: 'TRAK-DXB-44109',
    status: 'AVAILABLE',
    desc: 'Island living inspired villa surrounded by crystal blue lagoons, sandy beaches, and water cinema. 60/40 payment plan with 2 years post-handover.',
    images: "ARRAY['/properties/villa_damac_lagoons.jpg']"
  },
  {
    id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
    title: 'Sobha Hartland Forest Sanctuary Villa',
    developer: 'Sobha Realty',
    project_name: 'Sobha Hartland II',
    community: 'Sobha Hartland',
    sub_community: 'Forest Villas',
    category: 'VILLA',
    market_type: 'OFF_PLAN',
    price_aed: 8900000,
    bedrooms: 5,
    bathrooms: 6,
    size_sqft: 5400,
    handover_date: 'Q2 2027',
    service_charge: 16.5,
    roi: 9.1,
    golden_visa: true,
    permit: 'TRAK-DXB-87231',
    status: 'AVAILABLE',
    desc: 'Unmatched private luxury in the heart of MBR City. Lush green forest sanctuary with private pool, smart home automation, and private elevator.',
    images: "ARRAY['/properties/sobha_hartland_investment.jpg']"
  },
  {
    id: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
    title: 'Modern JVC 3BR Family Townhouse',
    developer: 'Binghatti Developers',
    project_name: 'Jumeirah Village Circle',
    community: 'JVC',
    sub_community: 'District 12',
    category: 'TOWNHOUSE',
    market_type: 'READY_SECONDARY',
    price_aed: 1950000,
    bedrooms: 3,
    bathrooms: 4,
    size_sqft: 2450,
    handover_date: 'Ready',
    service_charge: 9.0,
    roi: 8.9,
    golden_visa: false,
    permit: 'TRAK-DXB-11928',
    status: 'AVAILABLE',
    desc: 'Spacious corner townhouse with private landscaped garden, rooftop terrace, and walking distance to Circle Mall.',
    images: "ARRAY['/properties/jvc_townhouse.jpg']"
  },
  {
    id: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
    title: 'Palm Jumeirah Signature Sky Penthouse',
    developer: 'Omniyat',
    project_name: 'One Palm by Omniyat',
    community: 'Palm Jumeirah',
    sub_community: 'Trunk',
    category: 'PENTHOUSE',
    market_type: 'READY_SECONDARY',
    price_aed: 24500000,
    bedrooms: 4,
    bathrooms: 6,
    size_sqft: 7800,
    handover_date: 'Ready',
    service_charge: 35.0,
    roi: 6.8,
    golden_visa: true,
    permit: 'TRAK-DXB-65001',
    status: 'AVAILABLE',
    desc: 'Ultra-exclusive beachfront residence managed by Dorchester Collection. Private infinity pool, double-height ceilings, and private yacht berth access.',
    images: "ARRAY['/properties/penthouse_cover.jpg']"
  },
  {
    id: 'ffffffff-ffff-4fff-8fff-ffffffffffff',
    title: 'Executive Bay Canal View 1BR Apartment',
    developer: 'DAMAC Properties',
    project_name: 'Executive Bay',
    community: 'Business Bay',
    sub_community: 'Marasi Drive',
    category: 'APARTMENT',
    market_type: 'READY_SECONDARY',
    price_aed: 1350000,
    bedrooms: 1,
    bathrooms: 2,
    size_sqft: 820,
    handover_date: 'Ready',
    service_charge: 18.0,
    roi: 9.2,
    golden_visa: false,
    permit: 'TRAK-DXB-30981',
    status: 'AVAILABLE',
    desc: 'Prime high-ROI rental asset on Marasi Bay canal with direct metro proximity. Fully leased at AED 115k/year generating instant positive cash flow.',
    images: "ARRAY['/properties/burj_royale_downtown.jpg']"
  }
];

// Helper data for generating 73 realistic leads
const leadTemplates = [
  // 1-14: NEW leads (fresh inbound, AI actively greeting / asking qualifying questions)
  { name: 'Rashid Al-Nuaimi', phone: '+971508219481', source: 'BAYUT', comm: ['Downtown Dubai', 'Business Bay'], cat: 'APARTMENT', bMin: 3000000, bMax: 4500000, persona: 'INVESTOR_CAPITAL_GAIN', daysAgo: 0.1, propIdx: 0 },
  { name: 'Dr. Marcus Weber', phone: '+491702819021', source: 'PROPERTY_FINDER', comm: ['Palm Jumeirah', 'Sobha Hartland'], cat: 'VILLA', bMin: 7000000, bMax: 10000000, persona: 'INVESTOR_HIGH_YIELD', daysAgo: 0.2, propIdx: 2 },
  { name: 'Fatima Zahra Al-Hashimi', phone: '+971529182736', source: 'META_ADS', comm: ['Business Bay'], cat: 'APARTMENT', bMin: 1200000, bMax: 1500000, persona: 'INVESTOR_HIGH_YIELD', daysAgo: 0.3, propIdx: 5 },
  { name: 'Arthur Pendelton', phone: '+447911123456', source: 'WEBSITE', comm: ['Downtown Dubai'], cat: 'APARTMENT', bMin: 2800000, bMax: 3500000, persona: 'END_USER_BUYER', daysAgo: 0.4, propIdx: 0 },
  { name: 'Siddharth Patel', phone: '+971556123456', source: 'PROPERTY_FINDER', comm: ['JVC', 'Dubai Hills Estate'], cat: 'TOWNHOUSE', bMin: 1800000, bMax: 2200000, persona: 'END_USER_BUYER', daysAgo: 0.5, propIdx: 3 },
  { name: 'Elena Rostova', phone: '+971501928374', source: 'DIRECT_WHATSAPP', comm: ['Palm Jumeirah'], cat: 'PENTHOUSE', bMin: 20000000, bMax: 28000000, persona: 'END_USER_BUYER', daysAgo: 0.6, propIdx: 4 },
  { name: 'Khalid Al-Sabah', phone: '+96599123456', source: 'BAYUT', comm: ['DAMAC Lagoons', 'Dubai Hills Estate'], cat: 'VILLA', bMin: 4000000, bMax: 5500000, persona: 'INVESTOR_HIGH_YIELD', daysAgo: 0.7, propIdx: 1 },
  { name: 'Chloe Montgomery', phone: '+447829102938', source: 'META_ADS', comm: ['Downtown Dubai', 'Dubai Marina'], cat: 'APARTMENT', bMin: 3000000, bMax: 4000000, persona: 'INVESTOR_CAPITAL_GAIN', daysAgo: 0.8, propIdx: 0 },
  { name: 'Mohamed Bin Rashid Al-Falasi', phone: '+971504829102', source: 'DIRECT_WHATSAPP', comm: ['Sobha Hartland'], cat: 'VILLA', bMin: 8000000, bMax: 12000000, persona: 'END_USER_BUYER', daysAgo: 0.9, propIdx: 2 },
  { name: 'Jean-Pierre Dubois', phone: '+33612345678', source: 'PROPERTY_FINDER', comm: ['Palm Jumeirah', 'Downtown Dubai'], cat: 'PENTHOUSE', bMin: 15000000, bMax: 25000000, persona: 'INVESTOR_CAPITAL_GAIN', daysAgo: 1.0, propIdx: 4 },
  { name: 'Amina Idris', phone: '+971527788990', source: 'DUBIZZLE', comm: ['JVC'], cat: 'TOWNHOUSE', bMin: 1700000, bMax: 2100000, persona: 'END_USER_BUYER', daysAgo: 1.1, propIdx: 3 },
  { name: 'Klaus Schmidt', phone: '+491512345678', source: 'META_ADS', comm: ['Business Bay'], cat: 'APARTMENT', bMin: 1300000, bMax: 1600000, persona: 'INVESTOR_HIGH_YIELD', daysAgo: 1.2, propIdx: 5 },
  { name: 'Zaid Al-Harbi', phone: '+966501239876', source: 'PROPERTY_FINDER', comm: ['DAMAC Lagoons'], cat: 'VILLA', bMin: 4200000, bMax: 5000000, persona: 'INVESTOR_HIGH_YIELD', daysAgo: 1.3, propIdx: 1 },
  { name: 'Liam O’Connor', phone: '+447712398765', source: 'BAYUT', comm: ['Downtown Dubai'], cat: 'APARTMENT', bMin: 3100000, bMax: 3800000, persona: 'INVESTOR_CAPITAL_GAIN', daysAgo: 1.4, propIdx: 0 },

  // 15-30: ENGAGED leads (back-and-forth dialogue on bedrooms, payment plans, Golden Visa requirements)
  { name: 'Nasser Al-Otaibi', phone: '+966551982734', source: 'BAYUT', comm: ['Downtown Dubai'], cat: 'APARTMENT', bMin: 3200000, bMax: 4000000, persona: 'INVESTOR_CAPITAL_GAIN', daysAgo: 1.5, propIdx: 0 },
  { name: 'Vikram Sengupta', phone: '+971509876543', source: 'PROPERTY_FINDER', comm: ['Sobha Hartland'], cat: 'VILLA', bMin: 8500000, bMax: 9500000, persona: 'END_USER_BUYER', daysAgo: 1.6, propIdx: 2 },
  { name: 'Sophie Laurent', phone: '+33698765432', source: 'META_ADS', comm: ['Palm Jumeirah'], cat: 'PENTHOUSE', bMin: 22000000, bMax: 26000000, persona: 'END_USER_BUYER', daysAgo: 1.7, propIdx: 4 },
  { name: 'Ahmed Tariq Al-Balooshi', phone: '+971554433221', source: 'DIRECT_WHATSAPP', comm: ['DAMAC Lagoons'], cat: 'VILLA', bMin: 4300000, bMax: 4800000, persona: 'INVESTOR_HIGH_YIELD', daysAgo: 1.8, propIdx: 1 },
  { name: 'David Sterling', phone: '+447812983746', source: 'PROPERTY_FINDER', comm: ['Business Bay'], cat: 'APARTMENT', bMin: 1300000, bMax: 1500000, persona: 'INVESTOR_HIGH_YIELD', daysAgo: 2.0, propIdx: 5 },
  { name: 'Pooja Agarwal', phone: '+971528877665', source: 'BAYUT', comm: ['JVC'], cat: 'TOWNHOUSE', bMin: 1850000, bMax: 2100000, persona: 'END_USER_BUYER', daysAgo: 2.1, propIdx: 3 },
  { name: 'Abdullah Al-Dossary', phone: '+966543219876', source: 'WEBSITE', comm: ['Downtown Dubai', 'Business Bay'], cat: 'APARTMENT', bMin: 3000000, bMax: 4200000, persona: 'INVESTOR_CAPITAL_GAIN', daysAgo: 2.2, propIdx: 0 },
  { name: 'Maximilian Krause', phone: '+491719827364', source: 'PROPERTY_FINDER', comm: ['Sobha Hartland'], cat: 'VILLA', bMin: 8800000, bMax: 9500000, persona: 'INVESTOR_HIGH_YIELD', daysAgo: 2.3, propIdx: 2 },
  { name: 'Hind Bint Sultan', phone: '+971501122334', source: 'DIRECT_WHATSAPP', comm: ['Palm Jumeirah'], cat: 'PENTHOUSE', bMin: 24000000, bMax: 30000000, persona: 'END_USER_BUYER', daysAgo: 2.4, propIdx: 4 },
  { name: 'George Hamilton', phone: '+447938472918', source: 'META_ADS', comm: ['DAMAC Lagoons'], cat: 'VILLA', bMin: 4400000, bMax: 4900000, persona: 'INVESTOR_HIGH_YIELD', daysAgo: 2.5, propIdx: 1 },
  { name: 'Rania Mansour', phone: '+971553322110', source: 'BAYUT', comm: ['Business Bay'], cat: 'APARTMENT', bMin: 1350000, bMax: 1600000, persona: 'INVESTOR_HIGH_YIELD', daysAgo: 2.6, propIdx: 5 },
  { name: 'Lucas Rossi', phone: '+393401234567', source: 'PROPERTY_FINDER', comm: ['Downtown Dubai'], cat: 'APARTMENT', bMin: 3200000, bMax: 3600000, persona: 'INVESTOR_CAPITAL_GAIN', daysAgo: 2.7, propIdx: 0 },
  { name: 'Deepak Chawla', phone: '+971507766554', source: 'DUBIZZLE', comm: ['JVC'], cat: 'TOWNHOUSE', bMin: 1900000, bMax: 2200000, persona: 'END_USER_BUYER', daysAgo: 2.8, propIdx: 3 },
  { name: 'Fahad Al-Mutawa', phone: '+96597654321', source: 'BAYUT', comm: ['Sobha Hartland'], cat: 'VILLA', bMin: 8900000, bMax: 9800000, persona: 'END_USER_BUYER', daysAgo: 2.9, propIdx: 2 },
  { name: 'Oliver Bennett', phone: '+447519283746', source: 'META_ADS', comm: ['DAMAC Lagoons'], cat: 'VILLA', bMin: 4500000, bMax: 5000000, persona: 'INVESTOR_HIGH_YIELD', daysAgo: 3.0, propIdx: 1 },
  { name: 'Anastasia Ivanova', phone: '+971521928374', source: 'PROPERTY_FINDER', comm: ['Downtown Dubai'], cat: 'APARTMENT', bMin: 3100000, bMax: 3500000, persona: 'INVESTOR_CAPITAL_GAIN', daysAgo: 3.1, propIdx: 0 },

  // 31-48: QUALIFIED leads (budget verified, Golden Visa confirmed, ready for viewing)
  { name: 'Sheikh Majed Al-Qasimi', phone: '+971509988776', source: 'DIRECT_WHATSAPP', comm: ['Palm Jumeirah'], cat: 'PENTHOUSE', bMin: 24500000, bMax: 30000000, persona: 'END_USER_BUYER', daysAgo: 3.2, propIdx: 4 },
  { name: 'Dr. Henrik Lindqvist', phone: '+46701234567', source: 'PROPERTY_FINDER', comm: ['Sobha Hartland'], cat: 'VILLA', bMin: 8900000, bMax: 10000000, persona: 'INVESTOR_HIGH_YIELD', daysAgo: 3.3, propIdx: 2 },
  { name: 'Sultan Al-Ghamdi', phone: '+966509871234', source: 'BAYUT', comm: ['Downtown Dubai'], cat: 'APARTMENT', bMin: 3200000, bMax: 4000000, persona: 'INVESTOR_CAPITAL_GAIN', daysAgo: 3.4, propIdx: 0 },
  { name: 'William Thorne', phone: '+447890123456', source: 'META_ADS', comm: ['DAMAC Lagoons'], cat: 'VILLA', bMin: 4500000, bMax: 5200000, persona: 'INVESTOR_HIGH_YIELD', daysAgo: 3.5, propIdx: 1 },
  { name: 'Mariam Al-Kaabi', phone: '+971551239870', source: 'BAYUT', comm: ['Business Bay'], cat: 'APARTMENT', bMin: 1350000, bMax: 1700000, persona: 'INVESTOR_HIGH_YIELD', daysAgo: 3.6, propIdx: 5 },
  { name: 'Rajesh Mehra', phone: '+971524455667', source: 'PROPERTY_FINDER', comm: ['JVC'], cat: 'TOWNHOUSE', bMin: 1950000, bMax: 2300000, persona: 'END_USER_BUYER', daysAgo: 3.7, propIdx: 3 },
  { name: 'Matteo Moretti', phone: '+393339876543', source: 'WEBSITE', comm: ['Downtown Dubai'], cat: 'APARTMENT', bMin: 3200000, bMax: 3700000, persona: 'INVESTOR_CAPITAL_GAIN', daysAgo: 3.8, propIdx: 0 },
  { name: 'Bader Al-Shammari', phone: '+966567891234', source: 'BAYUT', comm: ['Sobha Hartland'], cat: 'VILLA', bMin: 8900000, bMax: 9500000, persona: 'END_USER_BUYER', daysAgo: 3.9, propIdx: 2 },
  { name: 'Charlotte Dubois', phone: '+33687654321', source: 'META_ADS', comm: ['DAMAC Lagoons'], cat: 'VILLA', bMin: 4500000, bMax: 5000000, persona: 'INVESTOR_HIGH_YIELD', daysAgo: 4.0, propIdx: 1 },
  { name: 'Hamad Al-Thani', phone: '+97455123456', source: 'PROPERTY_FINDER', comm: ['Palm Jumeirah'], cat: 'PENTHOUSE', bMin: 25000000, bMax: 32000000, persona: 'INVESTOR_CAPITAL_GAIN', daysAgo: 4.1, propIdx: 4 },
  { name: 'Ananya Sharma', phone: '+971508899001', source: 'BAYUT', comm: ['Downtown Dubai'], cat: 'APARTMENT', bMin: 3200000, bMax: 3600000, persona: 'INVESTOR_CAPITAL_GAIN', daysAgo: 4.2, propIdx: 0 },
  { name: 'Richard Hayes', phone: '+447788990011', source: 'PROPERTY_FINDER', comm: ['Sobha Hartland'], cat: 'VILLA', bMin: 8900000, bMax: 9200000, persona: 'INVESTOR_HIGH_YIELD', daysAgo: 4.3, propIdx: 2 },
  { name: 'Laila Al-Suwaidi', phone: '+971523344556', source: 'DIRECT_WHATSAPP', comm: ['DAMAC Lagoons'], cat: 'VILLA', bMin: 4500000, bMax: 5200000, persona: 'END_USER_BUYER', daysAgo: 4.4, propIdx: 1 },
  { name: 'Hans Zimmer-Berg', phone: '+491609876543', source: 'WEBSITE', comm: ['Downtown Dubai'], cat: 'APARTMENT', bMin: 3200000, bMax: 3800000, persona: 'INVESTOR_CAPITAL_GAIN', daysAgo: 4.5, propIdx: 0 },
  { name: 'Sanjay Kapoor', phone: '+971556677889', source: 'DUBIZZLE', comm: ['JVC'], cat: 'TOWNHOUSE', bMin: 1950000, bMax: 2200000, persona: 'END_USER_BUYER', daysAgo: 4.6, propIdx: 3 },
  { name: 'Tariq Al-Fahim', phone: '+971502233445', source: 'BAYUT', comm: ['Business Bay'], cat: 'APARTMENT', bMin: 1350000, bMax: 1600000, persona: 'INVESTOR_HIGH_YIELD', daysAgo: 4.7, propIdx: 5 },
  { name: 'Isabelle Moreau', phone: '+33678901234', source: 'META_ADS', comm: ['Palm Jumeirah'], cat: 'PENTHOUSE', bMin: 24500000, bMax: 27000000, persona: 'END_USER_BUYER', daysAgo: 4.8, propIdx: 4 },
  { name: 'Yousef Al-Hajri', phone: '+966508877665', source: 'PROPERTY_FINDER', comm: ['Sobha Hartland'], cat: 'VILLA', bMin: 8900000, bMax: 9600000, persona: 'INVESTOR_HIGH_YIELD', daysAgo: 4.9, propIdx: 2 },

  // 49-60: VIEWING_SCHEDULED leads (have calendar bookings, Zoom links or on-site visits)
  { name: 'Lord Julian Montgomery', phone: '+447700900123', source: 'PROPERTY_FINDER', comm: ['Palm Jumeirah'], cat: 'PENTHOUSE', bMin: 24500000, bMax: 30000000, persona: 'INVESTOR_CAPITAL_GAIN', daysAgo: 5.0, propIdx: 4, viewingType: 'VIRTUAL_ZOOM_MEET' },
  { name: 'Ibrahim Al-Kandari', phone: '+96598765432', source: 'BAYUT', comm: ['Sobha Hartland'], cat: 'VILLA', bMin: 8900000, bMax: 9500000, persona: 'END_USER_BUYER', daysAgo: 5.1, propIdx: 2, viewingType: 'PHYSICAL_SITE_VISIT' },
  { name: 'Alexander Sterling', phone: '+447890987654', source: 'PROPERTY_FINDER', comm: ['Downtown Dubai'], cat: 'APARTMENT', bMin: 3200000, bMax: 3800000, persona: 'INVESTOR_CAPITAL_GAIN', daysAgo: 5.2, propIdx: 0, viewingType: 'PHYSICAL_SITE_VISIT' },
  { name: 'Dr. Noura Al-Marri', phone: '+971503344556', source: 'DIRECT_WHATSAPP', comm: ['DAMAC Lagoons'], cat: 'VILLA', bMin: 4500000, bMax: 5000000, persona: 'END_USER_BUYER', daysAgo: 5.3, propIdx: 1, viewingType: 'PHYSICAL_SITE_VISIT' },
  { name: 'Stefan Lindemann', phone: '+491723456789', source: 'META_ADS', comm: ['Business Bay'], cat: 'APARTMENT', bMin: 1350000, bMax: 1550000, persona: 'INVESTOR_HIGH_YIELD', daysAgo: 5.4, propIdx: 5, viewingType: 'VIRTUAL_ZOOM_MEET' },
  { name: 'Amitabh Sen', phone: '+971557788990', source: 'BAYUT', comm: ['JVC'], cat: 'TOWNHOUSE', bMin: 1950000, bMax: 2250000, persona: 'END_USER_BUYER', daysAgo: 5.5, propIdx: 3, viewingType: 'PHYSICAL_SITE_VISIT' },
  { name: 'Baroness Alix von Ribbentrop', phone: '+491523456789', source: 'PROPERTY_FINDER', comm: ['Palm Jumeirah'], cat: 'PENTHOUSE', bMin: 24500000, bMax: 28000000, persona: 'INVESTOR_CAPITAL_GAIN', daysAgo: 5.6, propIdx: 4, viewingType: 'VIRTUAL_ZOOM_MEET' },
  { name: 'Faisal Al-Obeid', phone: '+966554433221', source: 'BAYUT', comm: ['Sobha Hartland'], cat: 'VILLA', bMin: 8900000, bMax: 9900000, persona: 'INVESTOR_HIGH_YIELD', daysAgo: 5.7, propIdx: 2, viewingType: 'PHYSICAL_SITE_VISIT' },
  { name: 'James Carstairs', phone: '+447911223344', source: 'META_ADS', comm: ['Downtown Dubai'], cat: 'APARTMENT', bMin: 3200000, bMax: 3700000, persona: 'INVESTOR_CAPITAL_GAIN', daysAgo: 5.8, propIdx: 0, viewingType: 'PHYSICAL_SITE_VISIT' },
  { name: 'Reem Al-Zahrani', phone: '+966503322114', source: 'BAYUT', comm: ['DAMAC Lagoons'], cat: 'VILLA', bMin: 4500000, bMax: 5000000, persona: 'END_USER_BUYER', daysAgo: 5.9, propIdx: 1, viewingType: 'OFFICE_CONSULTATION' },
  { name: 'Michael O’Keefe', phone: '+353871234567', source: 'PROPERTY_FINDER', comm: ['Business Bay'], cat: 'APARTMENT', bMin: 1350000, bMax: 1600000, persona: 'INVESTOR_HIGH_YIELD', daysAgo: 6.0, propIdx: 5, viewingType: 'VIRTUAL_ZOOM_MEET' },
  { name: 'Alok Nambiar', phone: '+971504455667', source: 'PROPERTY_FINDER', comm: ['JVC'], cat: 'TOWNHOUSE', bMin: 1950000, bMax: 2200000, persona: 'END_USER_BUYER', daysAgo: 6.1, propIdx: 3, viewingType: 'PHYSICAL_SITE_VISIT' },

  // 61-66: HANDOFF_TO_AGENT leads (high urgency, AI paused, broker in direct conversation)
  { name: 'Sergey Voronin', phone: '+971501192837', source: 'DIRECT_WHATSAPP', comm: ['Palm Jumeirah'], cat: 'PENTHOUSE', bMin: 24500000, bMax: 35000000, persona: 'INVESTOR_CAPITAL_GAIN', daysAgo: 6.2, propIdx: 4, reason: 'Demanded cash discount negotiation & private viewing with master broker.' },
  { name: 'Sheikh Saud Al-Qassimi', phone: '+971509911223', source: 'PROPERTY_FINDER', comm: ['Sobha Hartland'], cat: 'VILLA', bMin: 8900000, bMax: 15000000, persona: 'END_USER_BUYER', daysAgo: 6.3, propIdx: 2, reason: 'Wants bulk purchase of 2 adjacent standalone villas with customized interior finishes.' },
  { name: 'Lady Vivienne Sterling', phone: '+447800112233', source: 'META_ADS', comm: ['Downtown Dubai'], cat: 'APARTMENT', bMin: 3200000, bMax: 4000000, persona: 'INVESTOR_CAPITAL_GAIN', daysAgo: 6.4, propIdx: 0, reason: 'Requested legal advisory regarding UAE Golden Visa issuance timeline and escrow safety.' },
  { name: 'Turki Al-Hussaini', phone: '+966550099887', source: 'BAYUT', comm: ['DAMAC Lagoons'], cat: 'VILLA', bMin: 4500000, bMax: 5500000, persona: 'INVESTOR_HIGH_YIELD', daysAgo: 6.5, propIdx: 1, reason: 'Requested developer waiver of 4% DLD fees and 2-year post-handover payment structure.' },
  { name: 'Dmitri Sokolov', phone: '+971526677889', source: 'WEBSITE', comm: ['Business Bay'], cat: 'APARTMENT', bMin: 1350000, bMax: 1800000, persona: 'INVESTOR_HIGH_YIELD', daysAgo: 6.6, propIdx: 5, reason: 'Investor seeking guaranteed 8% net rental guarantee contract from developer.' },
  { name: 'Priya Narang', phone: '+971553344556', source: 'PROPERTY_FINDER', comm: ['JVC'], cat: 'TOWNHOUSE', bMin: 1950000, bMax: 2400000, persona: 'END_USER_BUYER', daysAgo: 6.7, propIdx: 3, reason: 'Urgent relocation notice from landlord; ready to sign SPA within 48 hours.' },

  // 67-70: CLOSED_WON leads (Deals finalized, deposits paid, commissions banked)
  { name: 'Christophe Bernard', phone: '+33611223344', source: 'PROPERTY_FINDER', comm: ['Palm Jumeirah'], cat: 'PENTHOUSE', bMin: 24500000, bMax: 24500000, persona: 'INVESTOR_CAPITAL_GAIN', daysAgo: 7.5, propIdx: 4, wonCommission: 490000 },
  { name: 'Sultan Al-Maktoum Trading LLC', phone: '+971501238910', source: 'BAYUT', comm: ['Sobha Hartland'], cat: 'VILLA', bMin: 8900000, bMax: 8900000, persona: 'INVESTOR_HIGH_YIELD', daysAgo: 8.2, propIdx: 2, wonCommission: 178000 },
  { name: 'Dr. Gregory House', phone: '+12125550192', source: 'META_ADS', comm: ['Downtown Dubai'], cat: 'APARTMENT', bMin: 3200000, bMax: 3200000, persona: 'END_USER_BUYER', daysAgo: 9.0, propIdx: 0, wonCommission: 64000 },
  { name: 'Zubair Qureshi', phone: '+971507711223', source: 'PROPERTY_FINDER', comm: ['DAMAC Lagoons'], cat: 'VILLA', bMin: 4500000, bMax: 4500000, persona: 'INVESTOR_HIGH_YIELD', daysAgo: 10.1, propIdx: 1, wonCommission: 90000 },

  // 71-73: CLOSED_LOST leads (Unresponsive, budget shifted below market, or bought elsewhere)
  { name: 'Gary Cooper', phone: '+447900112233', source: 'DUBIZZLE', comm: ['JVC'], cat: 'TOWNHOUSE', bMin: 1200000, bMax: 1400000, persona: 'END_USER_BUYER', daysAgo: 11.0, propIdx: 3, lostReason: 'Budget below market minimum for 3BR townhouse.' },
  { name: 'Khaled Bitar', phone: '+9613123456', source: 'BAYUT', comm: ['Business Bay'], cat: 'APARTMENT', bMin: 1100000, bMax: 1200000, persona: 'INVESTOR_HIGH_YIELD', daysAgo: 12.5, propIdx: 5, lostReason: 'Postponed Dubai investment until Q2 next year.' },
  { name: 'Olga Smirnova', phone: '+971559988776', source: 'PROPERTY_FINDER', comm: ['Downtown Dubai'], cat: 'APARTMENT', bMin: 2900000, bMax: 3000000, persona: 'INVESTOR_CAPITAL_GAIN', daysAgo: 13.5, propIdx: 0, lostReason: 'Purchased alternate secondary unit through personal friend broker.' }
];

let sql = `-- ============================================================================
-- BALOS LEAD CONVERSION ENGINE - UAE PRODUCTION DEMO SEED
-- 73 Real-time Qualified Leads, Properties, Agents, Bookings, Messages, & Alerts
-- Ready to run directly in Supabase SQL Editor
-- ============================================================================

BEGIN;

-- 1. Ensure UAE Launch Schema Extensions & Modernized Constraints Exist
-- Modernize agents role constraint to support full leadership hierarchy
ALTER TABLE IF EXISTS public.agents DROP CONSTRAINT IF EXISTS agents_role_check;
ALTER TABLE IF EXISTS public.agents ADD CONSTRAINT agents_role_check 
  CHECK (role IN ('admin', 'sales_leader', 'team_leader', 'agent'));

-- Modernize leads stage & temperature constraints
ALTER TABLE IF EXISTS public.leads DROP CONSTRAINT IF EXISTS leads_stage_check;
ALTER TABLE IF EXISTS public.leads ADD CONSTRAINT leads_stage_check 
  CHECK (stage IN ('NEW', 'ENGAGED', 'QUALIFIED', 'VIEWING_SCHEDULED', 'HANDOFF_TO_AGENT', 'CLOSED_WON', 'CLOSED_LOST'));

ALTER TABLE IF EXISTS public.leads DROP CONSTRAINT IF EXISTS leads_temperature_check;
ALTER TABLE IF EXISTS public.leads ADD CONSTRAINT leads_temperature_check 
  CHECK (temperature IN ('COLD', 'WARM', 'HOT'));

-- Modernize bookings viewing type constraint
ALTER TABLE IF EXISTS public.bookings DROP CONSTRAINT IF EXISTS bookings_viewing_type_check;
ALTER TABLE IF EXISTS public.bookings ADD CONSTRAINT bookings_viewing_type_check 
  CHECK (viewing_type IN ('PHYSICAL_SITE_VISIT', 'VIRTUAL_ZOOM_MEET', 'OFFICE_CONSULTATION'));

-- Ensure UAE Launch columns exist on leads
ALTER TABLE IF EXISTS public.leads
  ADD COLUMN IF NOT EXISTS source text DEFAULT 'DIRECT_WHATSAPP',
  ADD COLUMN IF NOT EXISTS source_detail text,
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS last_property_id uuid REFERENCES public.properties(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS public.agent_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid REFERENCES public.agents(id) ON DELETE CASCADE,
  lead_id uuid REFERENCES public.leads(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'LEAD_ASSIGNED',
  title text NOT NULL,
  body text,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Clear out any previous seed data safely
DELETE FROM public.agent_notifications;
DELETE FROM public.bookings;
DELETE FROM public.messages;
DELETE FROM public.leads;
DELETE FROM public.properties;
DELETE FROM public.agents;
DELETE FROM public.business_info;

-- 3. Business Info
INSERT INTO public.business_info (
  id, agency_name, description, service_areas, operating_hours,
  tone_of_voice, contact_email, contact_phone, website, additional_notes, updated_at
) VALUES (
  '99999999-9999-4999-8999-999999999999',
  'Balos Real Estate Luxury & Off-Plan',
  'Premier boutique Dubai real estate advisory specializing in prime off-plan developer launches, luxury waterfront penthouses, and Golden Visa investment portfolios.',
  'Downtown Dubai, Palm Jumeirah, Business Bay, Dubai Hills Estate, DAMAC Lagoons, Sobha Hartland, JVC, Dubai Marina',
  'Monday - Saturday: 09:00 - 18:00 (GST). AI WhatsApp Engine active 24/7/365 with 15-second response SLA.',
  'Executive, warm, consultative, authoritative on Dubai Land Department (DLD) regulations, Golden Visa advisory, and payment plan analysis.',
  'vip@balosrealestate.ae',
  '+971 50 123 4567',
  'https://balosrealestate.ae',
  'Standard brokerage commission: 2% on secondary / 0% buyer commission on direct developer off-plan.',
  now()
);

-- 4. Insert Team Agents
INSERT INTO public.agents (id, name, email, phone, role, rera_brn, languages, is_active, created_at)
VALUES
`;

agents.forEach((a, i) => {
  sql += `  ('${a.id}', '${a.name}', '${a.email}', '${a.phone}', '${a.role}', '${a.rera}', ${a.langs}, true, now() - interval '30 days')${i === agents.length - 1 ? ';' : ',\n'}`;
});

sql += `\n\n-- 5. Insert Prime Dubai Properties (golden_visa_eligible is automatically generated by Postgres)
INSERT INTO public.properties (
  id, title, developer, project_name, community, sub_community, category,
  market_type, price_aed, bedrooms, bathrooms, size_sqft, handover_date,
  service_charge_aed_sqft, projected_roi, trakheesi_permit_no,
  status, description, images, created_at, updated_at
) VALUES\n`;

properties.forEach((p, i) => {
  sql += `  (
    '${p.id}', '${p.title.replace(/'/g, "''")}', '${p.developer}', '${p.project_name.replace(/'/g, "''")}',
    '${p.community}', '${p.sub_community}', '${p.category}', '${p.market_type}',
    ${p.price_aed}, ${p.bedrooms}, ${p.bathrooms}, ${p.size_sqft}, '${p.handover_date}',
    ${p.service_charge}, ${p.roi}, '${p.permit}',
    '${p.status}', '${p.desc.replace(/'/g, "''")}', ${p.images},
    now() - interval '20 days', now()
  )${i === properties.length - 1 ? ';' : ',\n'}`;
});

sql += `\n\n-- 6. Insert 73 Real-Time Leads\nINSERT INTO public.leads (
  id, whatsapp_id, e164_phone, full_name, stage, temperature, lead_score,
  buyer_persona, preferred_market, target_communities, target_category,
  budget_aed_min, budget_aed_max, is_uae_resident, golden_visa_seeker,
  assigned_agent_id, ai_paused, source, source_detail, notes,
  last_property_id, created_at, updated_at
) VALUES\n`;

const leadIds = [];

leadTemplates.forEach((t, i) => {
  const leadId = `10000000-0000-4000-8000-${String(i + 1).padStart(12, '0')}`;
  leadIds.push(leadId);

  let stage = 'NEW';
  let temp = 'WARM';
  let score = 55;
  let aiPaused = false;

  if (i < 14) {
    stage = 'NEW'; temp = 'WARM'; score = 50 + Math.floor(Math.random() * 20);
  } else if (i < 30) {
    stage = 'ENGAGED'; temp = 'WARM'; score = 65 + Math.floor(Math.random() * 15);
  } else if (i < 48) {
    stage = 'QUALIFIED'; temp = 'HOT'; score = 80 + Math.floor(Math.random() * 15);
  } else if (i < 60) {
    stage = 'VIEWING_SCHEDULED'; temp = 'HOT'; score = 90 + Math.floor(Math.random() * 8);
  } else if (i < 66) {
    stage = 'HANDOFF_TO_AGENT'; temp = 'HOT'; score = 95; aiPaused = true;
  } else if (i < 70) {
    stage = 'CLOSED_WON'; temp = 'HOT'; score = 100;
  } else {
    stage = 'CLOSED_LOST'; temp = 'COLD'; score = 30;
  }

  const assignedAgent = agents[i % agents.length].id;
  const targetProp = properties[t.propIdx].id;
  const isGv = t.bMax >= 2000000;
  const commArray = `ARRAY[${t.comm.map(c => `'${c}'`).join(',')}]`;
  const notesText = t.reason || t.lostReason || (isGv ? 'Verified Golden Visa buyer. Pre-qualified budget.' : 'Interested in high rental yield assets.');

  sql += `  (
    '${leadId}',
    '${t.phone.replace(/[^0-9]/g, '')}@c.us',
    '${t.phone}',
    '${t.name.replace(/'/g, "''")}',
    '${stage}',
    '${temp}',
    ${score},
    '${t.persona}',
    'READY_SECONDARY',
    ${commArray},
    '${t.cat}',
    ${t.bMin},
    ${t.bMax},
    ${i % 3 === 0},
    ${isGv},
    '${assignedAgent}',
    ${aiPaused},
    '${t.source}',
    'Campaign: ${t.source}_UAE_Prime_Q4',
    '${notesText.replace(/'/g, "''")}',
    '${targetProp}',
    now() - interval '${t.daysAgo} days',
    now() - interval '${Math.max(0, t.daysAgo - 0.2)} days'
  )${i === leadTemplates.length - 1 ? ';' : ',\n'}`;
});

// 7. Insert Active & Upcoming Bookings
sql += `\n\n-- 7. Insert Real-time Viewing Bookings\nINSERT INTO public.bookings (
  id, lead_id, property_id, agent_id, viewing_type, scheduled_at, meeting_link, status, notes, created_at
) VALUES\n`;

const bookings = [
  // 12 for VIEWING_SCHEDULED
  { idx: 48, offsetHours: 4, type: 'VIRTUAL_ZOOM_MEET', link: 'https://zoom.us/j/8291029381?pwd=DubaiVIP' },
  { idx: 49, offsetHours: 18, type: 'PHYSICAL_SITE_VISIT', link: null },
  { idx: 50, offsetHours: 26, type: 'PHYSICAL_SITE_VISIT', link: null },
  { idx: 51, offsetHours: 42, type: 'PHYSICAL_SITE_VISIT', link: null },
  { idx: 52, offsetHours: 50, type: 'VIRTUAL_ZOOM_MEET', link: 'https://zoom.us/j/9102938471?pwd=BusinessBay' },
  { idx: 53, offsetHours: 66, type: 'PHYSICAL_SITE_VISIT', link: null },
  { idx: 54, offsetHours: 72, type: 'VIRTUAL_ZOOM_MEET', link: 'https://zoom.us/j/7728192837?pwd=OnePalm' },
  { idx: 55, offsetHours: 90, type: 'PHYSICAL_SITE_VISIT', link: null },
  { idx: 56, offsetHours: 96, type: 'PHYSICAL_SITE_VISIT', link: null },
  { idx: 57, offsetHours: 114, type: 'OFFICE_CONSULTATION', link: null },
  { idx: 58, offsetHours: 120, type: 'VIRTUAL_ZOOM_MEET', link: 'https://zoom.us/j/4491029384?pwd=ExecBay' },
  { idx: 59, offsetHours: 138, type: 'PHYSICAL_SITE_VISIT', link: null },
  // Past completed bookings for CLOSED_WON
  { idx: 66, offsetHours: -48, type: 'PHYSICAL_SITE_VISIT', link: null, status: 'COMPLETED' },
  { idx: 67, offsetHours: -72, type: 'PHYSICAL_SITE_VISIT', link: null, status: 'COMPLETED' },
  { idx: 68, offsetHours: -96, type: 'VIRTUAL_ZOOM_MEET', link: 'https://zoom.us/j/1192837465', status: 'COMPLETED' },
  { idx: 69, offsetHours: -120, type: 'PHYSICAL_SITE_VISIT', link: null, status: 'COMPLETED' }
];

bookings.forEach((b, i) => {
  const leadId = leadIds[b.idx];
  const template = leadTemplates[b.idx];
  const propId = properties[template.propIdx].id;
  const agentId = agents[b.idx % agents.length].id;
  const schedTime = b.offsetHours >= 0
    ? `now() + interval '${b.offsetHours} hours'`
    : `now() - interval '${Math.abs(b.offsetHours)} hours'`;
  const status = b.status || 'CONFIRMED';
  const linkVal = b.link ? `'${b.link}'` : 'NULL';

  sql += `  (
    gen_random_uuid(),
    '${leadId}',
    '${propId}',
    '${agentId}',
    '${b.type}',
    ${schedTime},
    ${linkVal},
    '${status}',
    'Viewing for ${template.name.replace(/'/g, "''")} - ${properties[template.propIdx].title.replace(/'/g, "''")}',
    now() - interval '2 days'
  )${i === bookings.length - 1 ? ';' : ',\n'}`;
});

// 8. Insert Realistic WhatsApp Message Threads
sql += `\n\n-- 8. Insert Inbound & Outbound WhatsApp Conversation Messages\nINSERT INTO public.messages (
  id, lead_id, direction, sender, content, created_at
) VALUES\n`;

const messageRows = [];

// Generate threads for top 15 leads so Inbox is buzzing with conversations
const threadsToGenerate = [
  {
    idx: 0, // Rashid Al-Nuaimi (Downtown 2BR)
    msgs: [
      { dir: 'INBOUND', sender: 'LEAD', text: "Marhaban! I saw your listing on Bayut for the Burj Royale 2BR. Is it still available for AED 3.2M? Can we do a quick call?" },
      { dir: 'OUTGOING', sender: 'AI', text: "Marhaba Rashid! Yes, the Burj Royale 2BR (1,150 sq.ft) in Downtown Dubai is active and available. It offers panoramic Burj Khalifa views and qualifies for the UAE 10-Year Golden Visa. Are you looking to purchase for personal use or investment?" },
      { dir: 'INBOUND', sender: 'LEAD', text: "Investment primarily. I am looking for a solid 7%+ net ROI with ready rental demand." },
      { dir: 'OUTGOING', sender: 'AI', text: "Burj Royale currently yields 7.8% net with zero vacancy due to Downtown short-term rental demand. Would you like me to schedule a private physical walkthrough with our Downtown specialist this week?" }
    ]
  },
  {
    idx: 1, // Dr. Marcus Weber (Sobha Hartland Villa)
    msgs: [
      { dir: 'INBOUND', sender: 'LEAD', text: "Hello, I found your agency via Property Finder. I am relocating my family from Frankfurt to Dubai and looking for a 5BR standalone villa in Sobha Hartland around AED 8-9M." },
      { dir: 'OUTGOING', sender: 'AI', text: "Guten Tag Dr. Weber! Welcome to Dubai. Our Sobha Hartland Forest Sanctuary 5BR villa (AED 8.9M) is ideal for families—private pool, elevator, and located 2 minutes from North London Collegiate School. Does your purchase require the UAE Golden Visa for your family?" },
      { dir: 'INBOUND', sender: 'LEAD', text: "Yes, exactly. Golden Visa eligibility for myself, my wife, and two children is a strict requirement." },
      { dir: 'OUTGOING', sender: 'AI', text: "Under UAE Land Department regulations, purchases above AED 2M qualify for the 10-Year Renewable Golden Visa. Our team facilitates the complete visa issuance process. Shall we schedule a virtual Zoom walkthrough with architectural floor plans?" }
    ]
  },
  {
    idx: 2, // Fatima (Business Bay 1BR)
    msgs: [
      { dir: 'INBOUND', sender: 'LEAD', text: "السلام عليكم، شفت إعلانكم على إنستغرام بخصوص شقق الخليج التجاري. هل ما زالت متوفرة؟" },
      { dir: 'OUTGOING', sender: 'AI', text: "وعليكم السلام ورحمة الله وبركاته أختي فاطمة. نعم متوفرة، لدينا شقة غرفة وصالة في Executive Bay على القناة المائية بإطلالة مفتوحة وعائد إيجاري 9.2% سنوياً بسعر 1.35 مليون درهم. هل تفضلين الدفع كاش أو عن طريق تمويل بنكي؟" },
      { dir: 'INBOUND', sender: 'LEAD', text: "أفضل الكاش للاستثمار الفوري واستلام الإيجار مباشرة." },
      { dir: 'OUTGOING', sender: 'AI', text: "ممتاز جداً! الشقة مؤجرة حالياً وجاهزة لنقل الملكية الفوري. سأقوم بتعيين مستشارنا العقاري عمر المنصور للتنسيق معك ومشاركتك عقود الإيجار والوثائق." }
    ]
  },
  {
    idx: 48, // Lord Julian Montgomery (Palm Penthouse Zoom)
    msgs: [
      { dir: 'INBOUND', sender: 'LEAD', text: "Good morning. I am inquiring about the One Palm Signature Penthouse (AED 24.5M). I am currently in London and require a private virtual video walkthrough." },
      { dir: 'OUTGOING', sender: 'AI', text: "Good morning Lord Montgomery. It is a pleasure to connect. The One Palm Dorchester Collection penthouse features a private beachfront pool, 7,800 sq.ft layout, and private yacht berth. I can arrange an exclusive live HD Zoom walkthrough." },
      { dir: 'INBOUND', sender: 'LEAD', text: "That suits me well. Please send the Zoom invitation for today." },
      { dir: 'OUTGOING', sender: 'AI', text: "Your Virtual Walkthrough has been confirmed for today. Meeting Link: https://zoom.us/j/8291029381?pwd=DubaiVIP. Our Sales Leader Sarah Jenkins will host the private inspection." }
    ]
  },
  {
    idx: 60, // Sergey Voronin (Handoff urgent)
    msgs: [
      { dir: 'INBOUND', sender: 'LEAD', text: "Hi, I have ready funds of AED 25M in Dubai Islamic Bank. I want to inspect the Palm Jumeirah penthouse and make a cash offer this afternoon. I need to speak directly with the managing broker now." },
      { dir: 'OUTGOING', sender: 'AI', text: "Hello Sergey. Thank you for confirming your immediate liquidity. I have flagged your inquiry as URGENT PRIORITY and escalated directly to our Managing Broker Balogun Joshua. AI is pausing now." },
      { dir: 'OUTGOING', sender: 'HUMAN_AGENT', text: "Hello Sergey, this is Balogun Joshua, Managing Broker. I am reviewing your request right now. I can meet you at the One Palm reception at 3:30 PM with the title deed and SPA contract." },
      { dir: 'INBOUND', sender: 'LEAD', text: "Perfect Balogun. See you at 3:30 PM at One Palm." }
    ]
  }
];

threadsToGenerate.forEach((th) => {
  const leadId = leadIds[th.idx];
  th.msgs.forEach((m, mIdx) => {
    const timeOffset = (th.msgs.length - mIdx) * 25; // 25 mins apart
    messageRows.push(`(
      gen_random_uuid(),
      '${leadId}',
      '${m.dir}',
      '${m.sender}',
      '${m.text.replace(/'/g, "''")}',
      now() - interval '${timeOffset} minutes'
    )`);
  });
});

sql += messageRows.join(',\n') + ';\n\n';

// 9. Insert Agent Notifications
sql += `-- 9. Insert Agent Notifications for Live Handoffs & High-Value Assignments
INSERT INTO public.agent_notifications (
  agent_id, lead_id, type, title, body, read, created_at
) VALUES\n`;

const notifs = [
  {
    agentId: agents[0].id,
    leadId: leadIds[60],
    type: 'HANDOFF_REQUEST',
    title: '🔥 Urgent Handoff: Sergey Voronin (AED 25M Cash)',
    body: 'Investor with immediate cash liquidity ready to inspect One Palm Penthouse.',
    read: false,
    minsAgo: 15
  },
  {
    agentId: agents[1].id,
    leadId: leadIds[48],
    type: 'VIEWING_CONFIRMED',
    title: '📅 Live Zoom Confirmed: Lord Julian Montgomery',
    body: 'Virtual walkthrough scheduled for One Palm Signature Sky Penthouse.',
    read: false,
    minsAgo: 45
  },
  {
    agentId: agents[2].id,
    leadId: leadIds[2],
    type: 'LEAD_ASSIGNED',
    title: '📍 New Qualified Lead: Fatima Zahra Al-Hashimi',
    body: 'Cash investor inquiring on Executive Bay Canal 1BR (AED 1.35M).',
    read: true,
    minsAgo: 120
  },
  {
    agentId: agents[3].id,
    leadId: leadIds[4],
    type: 'LEAD_ASSIGNED',
    title: '📍 New Assigned Lead: Siddharth Patel',
    body: 'JVC 3BR Townhouse buyer pre-approved for mortgage (AED 1.95M).',
    read: true,
    minsAgo: 240
  }
];

notifs.forEach((n, i) => {
  sql += `  (
    '${n.agentId}',
    '${n.leadId}',
    '${n.type}',
    '${n.title.replace(/'/g, "''")}',
    '${n.body.replace(/'/g, "''")}',
    ${n.read},
    now() - interval '${n.minsAgo} minutes'
  )${i === notifs.length - 1 ? ';' : ',\n'}`;
});

sql += `\nCOMMIT;\n\n-- ============================================================================
-- VERIFICATION COUNT QUERY
-- ============================================================================
SELECT 
  (SELECT count(*) FROM public.leads) as total_leads,
  (SELECT count(*) FROM public.properties) as total_properties,
  (SELECT count(*) FROM public.agents) as total_agents,
  (SELECT count(*) FROM public.bookings) as total_bookings,
  (SELECT count(*) FROM public.messages) as total_messages,
  (SELECT count(*) FROM public.agent_notifications) as total_notifications;
`;

const outputPath = path.join(__dirname, '..', 'supabase', 'seed_demo_73_leads.sql');
fs.writeFileSync(outputPath, sql, 'utf8');
console.log("Successfully generated:", outputPath);
