import { redirect } from 'next/navigation';
import { getDashboardContext } from '../../../../lib/supabase/context';
import { McpManager } from '../../../../components/settings/McpManager';

export const revalidate = 0; // dynamic

export default async function McpSettingsPage() {
  const context = await getDashboardContext();

  if (!context.is_user || !context.is_admin) {
    redirect('/');
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold font-heading text-ink">
          AI Agents & MCP Integrations
        </h2>
        <p className="text-xs text-ink-muted mt-0.5">
          Connect Claude Desktop, ChatGPT, or custom agency AI agents with strict tenant isolation & PII masking
        </p>
      </div>

      <McpManager />
    </div>
  );
}
