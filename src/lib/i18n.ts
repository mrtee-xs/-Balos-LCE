export type Language = 'en';
export type Direction = 'ltr';

export interface Translations {
  // Navigation
  nav: {
    operations: string;
    administration: string;
    overview: string;
    inbox: string;
    leads: string;
    viewings: string;
    properties: string;
    agencySettings: string;
    teamManagement: string;
    operationsEngine: string;
    footerTagline: string;
    version: string;
  };
  // Header
  header: {
    dashboard: string;
    live: string;
    syncing: string;
    offline: string;
    testAlert: string;
    readAll: string;
    notifications: string;
    notificationsSynced: string;
    noNewAlerts: string;
    noNewAlertsDesc: string;
    viewLeadInInbox: string;
    leader: string;
    signOut: string;
  };
  // Settings & Language
  settings: {
    title: string;
    subtitle: string;
    savedChanges: string;
    saveSettings: string;
    savingSettings: string;
    failedToSave: string;
    viewOnlyNotice: string;
    aiBannerTitle: string;
    aiBannerDesc: string;
    testLiveBot: string;
    integrationsTitle: string;
    integrationsSubtitle: string;
    allSystemsOperational: string;
    whatsappEngine: string;
    whatsappEngineDesc: string;
    calendarSync: string;
    calendarSyncDesc: string;
    portalIntake: string;
    portalIntakeDesc: string;
    complianceTitle: string;
    complianceDesc: string;
    agencyName: string;
    contactPhone: string;
    contactEmail: string;
    operatingHours: string;
    operatingHoursHelp: string;
    toneOfVoice: string;
    additionalDirectives: string;
  };
  // Overview & Metrics
  overview: {
    needsYou: string;
    needsYouDesc: string;
    allHandledByAi: string;
    allHandledByAiDesc: string;
    viewAll: string;
    leadCountSingle: string;
    leadCountPlural: string;
    pipelineTitle: string;
    pipelineSubtitle: string;
    totalLeads: string;
    upcomingViewings: string;
    noUpcomingViewings: string;
    noUpcomingViewingsDesc: string;
    revenueAnalytics: string;
    channelRoi: string;
    qualifiedLeads: string;
    goldenVisaEligible: string;
    activeAgents: string;
    responseSpeed: string;
    underOneMin: string;
    outsideHours: string;
    outsideHoursDesc: string;
  };
  // Stages & Sources
  stages: {
    NEW: string;
    ENGAGED: string;
    QUALIFIED: string;
    VIEWING_SCHEDULED: string;
    HANDOFF_TO_AGENT: string;
    CLOSED_WON: string;
    CLOSED_LOST: string;
  };
  sources: {
    PROPERTY_FINDER: string;
    BAYUT: string;
    DUBIZZLE: string;
    META_ADS: string;
    WEBSITE: string;
    DIRECT_WHATSAPP: string;
  };
  // Common
  common: {
    search: string;
    filter: string;
    exportCsv: string;
    loading: string;
    error: string;
    cancel: string;
    confirm: string;
    active: string;
    status: string;
    date: string;
    action: string;
    currencyAed: string;
    today: string;
    yesterday: string;
  };
}

export const translations: Record<Language, Translations> = {
  en: {
    nav: {
      operations: 'Operations',
      administration: 'Administration',
      overview: 'Overview',
      inbox: 'Inbox',
      leads: 'Leads',
      viewings: 'Viewings',
      properties: 'Properties',
      agencySettings: 'Agency settings',
      teamManagement: 'Team & leadership',
      operationsEngine: 'Operations Engine',
      footerTagline: 'Dubai Real Estate AI',
      version: 'v2.4',
    },
    header: {
      dashboard: 'Dashboard',
      live: 'Live',
      syncing: 'Syncing',
      offline: 'Offline',
      testAlert: 'Test alert',
      readAll: 'Read all',
      notifications: 'Notifications & Assignments',
      notificationsSynced: 'Synced live via Supabase Realtime',
      noNewAlerts: 'No new alerts',
      noNewAlertsDesc: 'When a Sales Leader or Admin assigns a lead to an agent in Supabase, the notification appears here instantly.',
      viewLeadInInbox: 'View lead in Inbox →',
      leader: 'Leader',
      signOut: 'Sign out',
    },
    settings: {
      title: 'Agency Settings & AI Configuration',
      subtitle: 'Manage agency profile, operational schedule, and AI voice',
      savedChanges: 'Changes saved successfully.',
      saveSettings: 'Save settings',
      savingSettings: 'Saving changes...',
      failedToSave: 'Failed to update agency configuration.',
      viewOnlyNotice: 'You have agent permissions (view-only). Only agency administrators can modify settings.',
      aiBannerTitle: 'Changes apply to the AI immediately.',
      aiBannerDesc: 'The Balos AI lead engine references this identity, operating schedule, and escalation routing in real time.',
      testLiveBot: 'Test live AI bot',
      integrationsTitle: 'Connected integrations, portals & channels',
      integrationsSubtitle: 'Live channels, calendar synchronization, and buyer communication capabilities',
      allSystemsOperational: 'All systems operational',
      whatsappEngine: 'WhatsApp Business Engine',
      whatsappEngineDesc: '24/7 instant response (<60s), inventory-grounded photo & video delivery, and soft human handoff.',
      calendarSync: 'Google Calendar & Meet Sync',
      calendarSyncDesc: 'Checks live diary slots before proposing times and auto-generates Google Meet links for international buyers.',
      portalIntake: 'Portal & Ad Lead Intake',
      portalIntakeDesc: 'Auto-tags enquiries from Property Finder, Bayut, Dubizzle, and Meta Click-to-WhatsApp Ads, plus 1-click CSV CRM export.',
      complianceTitle: 'Compliance & Verification',
      complianceDesc: 'Strict inventory grounding & DLD Trakheesi permit attachment active.',
      agencyName: 'Agency brand name',
      contactPhone: 'Primary WhatsApp & phone',
      contactEmail: 'Contact email',
      operatingHours: 'Operating hours (Dubai GST)',
      operatingHoursHelp: 'Mon-Sat, 9:00 AM - 7:00 PM GST',
      toneOfVoice: 'Tone of voice',
      additionalDirectives: 'Additional directives & notes',
    },
    overview: {
      needsYou: 'Needs you',
      needsYouDesc: 'Leads requiring human attention or handoff',
      allHandledByAi: 'All leads handled by AI',
      allHandledByAiDesc: 'When a client asks for a human agent or needs negotiation, they will appear here.',
      viewAll: 'View all',
      leadCountSingle: 'lead',
      leadCountPlural: 'leads',
      pipelineTitle: 'Lead pipeline',
      pipelineSubtitle: 'Distribution across conversion stages',
      totalLeads: 'total leads',
      upcomingViewings: 'Upcoming viewings',
      noUpcomingViewings: 'No upcoming viewings',
      noUpcomingViewingsDesc: 'Scheduled property viewings and consultations will appear here.',
      revenueAnalytics: 'Revenue & conversion analytics',
      channelRoi: 'Channel ROI',
      qualifiedLeads: 'Qualified leads',
      goldenVisaEligible: 'Golden Visa Eligible',
      activeAgents: 'Active agents',
      responseSpeed: 'Avg Response Time',
      underOneMin: '< 60 seconds',
      outsideHours: 'After Hours Active',
      outsideHoursDesc: 'AI is handling international buyer inquiries 24/7',
    },
    stages: {
      NEW: 'New',
      ENGAGED: 'Engaged',
      QUALIFIED: 'Qualified',
      VIEWING_SCHEDULED: 'Viewing scheduled',
      HANDOFF_TO_AGENT: 'Handoff to agent',
      CLOSED_WON: 'Closed won',
      CLOSED_LOST: 'Closed lost',
    },
    sources: {
      PROPERTY_FINDER: 'Property Finder',
      BAYUT: 'Bayut',
      DUBIZZLE: 'Dubizzle',
      META_ADS: 'Meta Click-to-WhatsApp',
      WEBSITE: 'Agency Website',
      DIRECT_WHATSAPP: 'Direct WhatsApp',
    },
    common: {
      search: 'Search...',
      filter: 'Filter',
      exportCsv: 'Export CSV',
      loading: 'Loading...',
      error: 'An error occurred',
      cancel: 'Cancel',
      confirm: 'Confirm',
      active: 'Active',
      status: 'Status',
      date: 'Date',
      action: 'Action',
      currencyAed: 'AED',
      today: 'Today',
      yesterday: 'Yesterday',
    },
  },
};

export function getTranslation(): Translations {
  return translations.en;
}

export function getDir(): Direction {
  return 'ltr';
}
