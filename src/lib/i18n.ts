export type Language = 'en' | 'ar';
export type Direction = 'ltr' | 'rtl';

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
    language: string;
    toggleLanguage: string;
    currentLangLabel: string;
  };
  // Settings & Language
  settings: {
    title: string;
    subtitle: string;
    languageAndDisplay: string;
    languageDesc: string;
    selectLanguage: string;
    english: string;
    arabic: string;
    arabicUAE: string;
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
      language: 'Language',
      toggleLanguage: 'Switch to Arabic',
      currentLangLabel: 'EN',
    },
    settings: {
      title: 'Agency Settings & AI Configuration',
      subtitle: 'Manage agency profile, operational schedule, AI voice, and display preferences',
      languageAndDisplay: 'Language & Display',
      languageDesc: 'Choose your preferred dashboard language. Switching adapts text and layout direction (RTL/LTR).',
      selectLanguage: 'Dashboard Language',
      english: 'English',
      arabic: 'العربية',
      arabicUAE: 'العربية (الإمارات)',
      savedChanges: 'Changes saved successfully.',
      saveSettings: 'Save settings',
      savingSettings: 'Saving changes...',
      failedToSave: 'Failed to update agency configuration.',
      viewOnlyNotice: 'You have agent permissions (view-only). Only agency administrators can modify settings.',
      aiBannerTitle: 'Changes apply to the AI immediately.',
      aiBannerDesc: 'The Balos AI lead engine references this identity, operating schedule, and escalation routing in real time.',
      testLiveBot: 'Test live AI bot',
      integrationsTitle: 'Connected integrations, portals & languages',
      integrationsSubtitle: 'Live channels, calendar synchronization, and multilingual buyer capabilities',
      allSystemsOperational: 'All systems operational',
      whatsappEngine: 'WhatsApp Business Engine',
      whatsappEngineDesc: '24/7 instant response (<60s), inventory-grounded photo & video delivery, and soft human handoff.',
      calendarSync: 'Google Calendar & Meet Sync',
      calendarSyncDesc: 'Checks live diary slots before proposing times and auto-generates Google Meet links for international buyers.',
      portalIntake: 'Portal & Ad Lead Intake',
      portalIntakeDesc: 'Auto-tags enquiries from Property Finder, Bayut, Dubizzle, and Meta Click-to-WhatsApp Ads, plus 1-click CSV CRM export.',
      complianceTitle: 'Multilingual & RERA Compliance',
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
  ar: {
    nav: {
      operations: 'العمليات التشغيلية',
      administration: 'الإدارة العامة',
      overview: 'نظرة عامة',
      inbox: 'المحادثات',
      leads: 'العملاء المحتملون',
      viewings: 'المعاينات',
      properties: 'العقارات',
      agencySettings: 'إعدادات الوكالة',
      teamManagement: 'إدارة الفريق',
      operationsEngine: 'محرك العمليات الذكي',
      footerTagline: 'ذكاء عقارات دبي',
      version: 'الإصدار 2.4',
    },
    header: {
      dashboard: 'لوحة التحكم',
      live: 'مباشر',
      syncing: 'جارٍ المزامنة',
      offline: 'غير متصل',
      testAlert: 'إشعار تجريبي',
      readAll: 'تحديد الكل كمقروء',
      notifications: 'الإشعارات وتعيين العملاء',
      notificationsSynced: 'مزامنة حية عبر Supabase Realtime',
      noNewAlerts: 'لا توجد تنبيهات جديدة',
      noNewAlertsDesc: 'عندما يُعيّن مسؤول المبيعات عميلًا لمستشار، يظهر الإشعار هنا فورًا.',
      viewLeadInInbox: 'عرض العميل في المحادثات ←',
      leader: 'مشرف',
      signOut: 'تسجيل الخروج',
      language: 'اللغة',
      toggleLanguage: 'Switch to English',
      currentLangLabel: 'عربي',
    },
    settings: {
      title: 'إعدادات الوكالة والمساعد الذكي',
      subtitle: 'إدارة هوية الوكالة، وأوقات العمل، ونبرة المحادثة، ولغة لوحة التحكم',
      languageAndDisplay: 'لغة العرض والواجهة',
      languageDesc: 'اختر لغة لوحة التحكم المفضلة لديك. يتم تحديث اتجاه النصوص والواجهة تلقائيًا (RTL/LTR).',
      selectLanguage: 'لغة لوحة التحكم',
      english: 'English (الإنجليزية)',
      arabic: 'العربية (الإمارات)',
      arabicUAE: 'العربية (الإمارات)',
      savedChanges: 'حُفظت التغييرات.',
      saveSettings: 'حفظ الإعدادات',
      savingSettings: 'جارٍ الحفظ...',
      failedToSave: 'تعذّر حفظ الإعدادات. حاول مرة أخرى.',
      viewOnlyNotice: 'صلاحياتك الحالية للعرض فقط. يمكن لمديري الوكالة تعديل هذه الإعدادات.',
      aiBannerTitle: 'تُطبّق التغييرات على المساعد الذكي فورًا.',
      aiBannerDesc: 'يعتمد محرك Balos على هذه الإعدادات وأوقات العمل وقواعد تحويل المحادثات لحظيًا.',
      testLiveBot: 'تجربة المساعد الذكي',
      integrationsTitle: 'التكاملات والمنصات ولغات التواصل',
      integrationsSubtitle: 'القنوات الحية، ومزامنة التقويم، والرد الذكي بعدة لغات للمشترين الدوليين',
      allSystemsOperational: 'جميع الأنظمة تعمل بكفاءة',
      whatsappEngine: 'محرك واتساب للأعمال',
      whatsappEngineDesc: 'استجابة فورية على مدار الساعة (أقل من دقيقة)، وإرسال الصور والكتالوجات، والتحويل السلس للمستشار.',
      calendarSync: 'مزامنة تقويم Google و Meet',
      calendarSyncDesc: 'فحص المواعيد المتاحة آليًا قبل اقتراحها، وتوليد روابط اجتماعات مرئية للمستثمرين خارج الدولة.',
      portalIntake: 'استقبال العملاء من المنصات والإعلانات',
      portalIntakeDesc: 'تتبع تلقائي للطلبات من بروبرتي فايندر وبيوت ودوبيزل وإعلانات ميتا، مع تصدير فوري لبيانات CRM.',
      complianceTitle: 'تعدد اللغات والامتثال لتراخيص ريرا',
      complianceDesc: 'ربط موثوق مع المخزون العقاري وإرفاق تصاريح تراخيص التابعة لدائرة الأراضي والأملاك.',
      agencyName: 'اسم الوكالة العقارية',
      contactPhone: 'رقم الواتساب والهاتف الرئيسي',
      contactEmail: 'البريد الإلكتروني للتواصل',
      operatingHours: 'ساعات العمل (توقيت الإمارات)',
      operatingHoursHelp: 'الإثنين - السبت، 9:00 ص - 7:00 م',
      toneOfVoice: 'نبرة المحادثة',
      additionalDirectives: 'توجيهات وملاحظات إضافية للمساعد',
    },
    overview: {
      needsYou: 'تحتاج تدخلك',
      needsYouDesc: 'عملاء بانتظار استجابة المستشار العقاري',
      allHandledByAi: 'المساعد الذكي يتعامل مع كافة العملاء',
      allHandledByAiDesc: 'عندما يطلب العميل التحدث لمستشار أو يحتاج لتفاوض مخصص، ستجده هنا.',
      viewAll: 'عرض الكل',
      leadCountSingle: 'عميل',
      leadCountPlural: 'عملاء',
      pipelineTitle: 'مسار العملاء المحتملين',
      pipelineSubtitle: 'توزيع مراحل التحويل والمتابعة',
      totalLeads: 'إجمالي العملاء',
      upcomingViewings: 'المعاينات القادمة',
      noUpcomingViewings: 'لا توجد معاينات مجدولة حاليًا',
      noUpcomingViewingsDesc: 'ستظهر المعاينات الميدانية والاستشارات المرئية المجدولة هنا.',
      revenueAnalytics: 'تحليلات المبيعات والإيرادات',
      channelRoi: 'عائد القنوات التسويقية',
      qualifiedLeads: 'عملاء مؤهلون',
      goldenVisaEligible: 'مؤهل للإقامة الذهبية',
      activeAgents: 'المستشارون النشطون',
      responseSpeed: 'متوسط سرعة الاستجابة',
      underOneMin: 'أقل من 60 ثانية',
      outsideHours: 'الرد التلقائي خارج الدوام نشط',
      outsideHoursDesc: 'المساعد الذكي يتابع استفسارات المشترين على مدار 24 ساعة',
    },
    stages: {
      NEW: 'جديد',
      ENGAGED: 'قيد التواصل',
      QUALIFIED: 'مؤهل',
      VIEWING_SCHEDULED: 'معاينة مجدولة',
      HANDOFF_TO_AGENT: 'تحويل لمستشار',
      CLOSED_WON: 'صفقة ناجحة',
      CLOSED_LOST: 'مستبعد',
    },
    sources: {
      PROPERTY_FINDER: 'بروبرتي فايندر',
      BAYUT: 'بيوت',
      DUBIZZLE: 'دوبيزل',
      META_ADS: 'إعلانات ميتا',
      WEBSITE: 'الموقع الإلكتروني',
      DIRECT_WHATSAPP: 'واتساب مباشر',
    },
    common: {
      search: 'بحث...',
      filter: 'تصفية',
      exportCsv: 'تصدير CSV',
      loading: 'جارٍ التحميل...',
      error: 'حدث خطأ',
      cancel: 'إلغاء',
      confirm: 'تأكيد',
      active: 'نشط',
      status: 'الحالة',
      date: 'التاريخ',
      action: 'إجراء',
      currencyAed: 'درهم',
      today: 'اليوم',
      yesterday: 'أمس',
    },
  },
};

export function getTranslation(lang: Language): Translations {
  return translations[lang] || translations.en;
}

export function getDir(lang: Language): Direction {
  return lang === 'ar' ? 'rtl' : 'ltr';
}
