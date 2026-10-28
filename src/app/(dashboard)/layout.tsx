import { createClient } from '../../lib/supabase/server';
import { getDashboardContext } from '../../lib/supabase/context';
import { DashboardProvider } from '../../components/layout/DashboardContext';
import { RealtimeProvider } from '../../components/layout/RealtimeProvider';
import { LanguageProvider } from '../../components/layout/LanguageProvider';
import { Sidebar } from '../../components/layout/Sidebar';
import { Header } from '../../components/layout/Header';
import { MobileTabBar } from '../../components/layout/MobileTabBar';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const context = await getDashboardContext();

  // If user is not authorized in agents table, render exact notice
  if (!context.is_user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-seaglass text-ink">
        <div className="bg-surface p-8 rounded-xl border border-border max-w-md text-center shadow-sm">
          <p className="text-base text-ink font-medium">
            Your account isn't set up for this dashboard. Ask your admin.
          </p>
        </div>
      </div>
    );
  }

  // Initial queue count: scoped to current agent if not admin/principal
  let queueQuery = supabase
    .from('leads')
    .select('id', { count: 'exact', head: true })
    .or('stage.eq.HANDOFF_TO_AGENT,ai_paused.eq.true');

  if (!context.is_admin && context.agent_id) {
    queueQuery = queueQuery.eq('assigned_agent_id', context.agent_id);
  }

  const queueRes = await queueQuery;

  return (
    <DashboardProvider
      value={{
        user: { id: context.agent_id || '', email: context.email || '' },
        isAdmin: context.is_admin,
        name: context.name,
        role: context.role,
        email: context.email,
        agentId: context.agent_id,
        agencyId: context.agency_id,
        agencyName: context.agency_name,
        subscriptionTier: context.subscription_tier,
        subscriptionStatus: context.subscription_status,
        billingCycle: context.billing_cycle,
        monthlyConversationLimit: context.monthly_conversation_limit,
        conversationsUsedThisMonth: context.conversations_used_this_month,
        maxWhatsappLines: context.max_whatsapp_lines,
        agent: context.name
          ? {
              id: context.agent_id || '',
              name: context.name,
              email: context.email || '',
              role: context.role || 'agent',
              phone: '',
              is_active: true,
              rera_brn: null,
              languages: null,
              created_at: '',
            }
          : null,
      }}
    >
      <RealtimeProvider initialQueueCount={queueRes.count || 0}>
        <LanguageProvider>
          <div className="min-h-screen flex bg-seaglass text-ink">
            {/* Desktop rail */}
            <Sidebar />

            {/* Main content area */}
            <div className="flex-1 flex flex-col min-w-0 pb-20 md:pb-6">
              <Header />
              <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">
                {children}
              </main>
            </div>

            {/* Mobile bottom tab bar */}
            <MobileTabBar />
          </div>
        </LanguageProvider>
      </RealtimeProvider>
    </DashboardProvider>
  );
}
