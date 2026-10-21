import { redirect } from 'next/navigation';
import { getDashboardContext } from '../../../../lib/supabase/context';
import { isAgencyPrincipal } from '../../../../lib/types';
import { getCrmIntegrationsAction, getCrmSyncLogsAction } from '../../../../lib/actions/crm';
import { CrmIntegrationsManager } from '../../../../components/settings/CrmIntegrationsManager';

export const revalidate = 0; // dynamic

export default async function CrmSettingsPage() {
  const context = await getDashboardContext();
  const isPrincipal = isAgencyPrincipal(context.role, context.is_admin);

  if (!context.is_user || !isPrincipal) {
    redirect('/');
  }

  const [integrationsRes, logs] = await Promise.all([
    getCrmIntegrationsAction(),
    getCrmSyncLogsAction(30),
  ]);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold font-heading text-ink">
          CRM Integrations & Webhooks
        </h2>
        <p className="text-xs text-ink-muted mt-0.5">
          Connect Follow Up Boss, HubSpot, GoHighLevel, Zoho, Salesforce, or custom webhooks to synchronize WhatsApp qualified leads in real time.
        </p>
      </div>

      <CrmIntegrationsManager
        initialIntegrations={integrationsRes.data}
        initialLogs={logs}
        needsMigration={integrationsRes.needsMigration}
      />
    </div>
  );
}
