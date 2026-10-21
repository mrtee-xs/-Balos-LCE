'use client';

import { useState, useTransition } from 'react';
import {
  CrmIntegration,
  CrmSyncLog,
  CRM_PROVIDERS_META,
  CrmProvider,
} from '../../lib/types';
import {
  saveCrmIntegrationAction,
  testCrmIntegrationAction,
  clearCrmSyncLogsAction,
} from '../../lib/actions/crm';
import { formatDubaiDateTime, formatDubaiTime } from '../../lib/date';
import {
  Share2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Send,
  Settings2,
  Key,
  Globe,
  ShieldCheck,
  RefreshCw,
  ExternalLink,
  Code,
  FileText,
  Activity,
  Layers,
  Sparkles,
  Zap,
  Check,
  Copy,
  ChevronRight,
  Eye,
  EyeOff,
  Trash2,
  Terminal,
  Database,
} from 'lucide-react';

interface CrmIntegrationsManagerProps {
  initialIntegrations: CrmIntegration[];
  initialLogs: CrmSyncLog[];
  needsMigration?: boolean;
}

export function CrmIntegrationsManager({
  initialIntegrations,
  initialLogs,
  needsMigration = false,
}: CrmIntegrationsManagerProps) {
  const [integrations, setIntegrations] = useState<CrmIntegration[]>(initialIntegrations);
  const [logs, setLogs] = useState<CrmSyncLog[]>(initialLogs);
  const [activeTab, setActiveTab] = useState<'integrations' | 'mapping' | 'logs'>('integrations');
  const [selectedProvider, setSelectedProvider] = useState<CrmProvider | null>(null);
  const [editingIntegration, setEditingIntegration] = useState<CrmIntegration | null>(null);
  const [showKey, setShowKey] = useState<boolean>(false);
  const [isPending, startTransition] = useTransition();
  const [testResult, setTestResult] = useState<any | null>(null);
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [inspectPayloadLog, setInspectPayloadLog] = useState<CrmSyncLog | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [showSqlModal, setShowSqlModal] = useState<boolean>(false);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(id);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const openConfigModal = (provider: CrmProvider) => {
    const existing = integrations.find((i) => i.provider === provider);
    const meta = CRM_PROVIDERS_META.find((m) => m.provider === provider);
    if (existing) {
      setEditingIntegration({ ...existing });
    } else {
      setEditingIntegration({
        id: `mock-${provider}`,
        provider,
        name: meta?.name || provider,
        is_enabled: false,
        api_endpoint: meta?.defaultEndpoint || '',
        sync_on_create: false,
        sync_on_qualified: true,
        sync_on_viewing: true,
        sync_on_handoff: true,
        sync_on_stage_change: false,
      });
    }
    setSelectedProvider(provider);
    setTestResult(null);
    setFeedback(null);
    setShowKey(false);
  };

  const handleSaveIntegration = () => {
    if (!editingIntegration) return;
    setFeedback(null);

    startTransition(async () => {
      const res = await saveCrmIntegrationAction(editingIntegration);
      if (res.success && res.data) {
        setIntegrations((prev) =>
          prev.map((i) => (i.provider === res.data!.provider ? res.data! : i))
        );
        setFeedback({
          type: 'success',
          message: `${editingIntegration.name} configuration saved successfully.`,
        });
        setTimeout(() => setSelectedProvider(null), 1200);
      } else {
        setFeedback({
          type: 'error',
          message: res.error || 'Failed to save configuration.',
        });
      }
    });
  };

  const handleToggleEnable = (integration: CrmIntegration, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = { ...integration, is_enabled: !integration.is_enabled };
    setIntegrations((prev) =>
      prev.map((i) => (i.provider === integration.provider ? updated : i))
    );

    startTransition(async () => {
      await saveCrmIntegrationAction(updated);
    });
  };

  const handleRunTestPing = async () => {
    if (!editingIntegration) return;
    setIsTesting(true);
    setTestResult(null);

    try {
      const result = await testCrmIntegrationAction(editingIntegration);
      setTestResult(result);
      if (result.success) {
        setFeedback({
          type: 'success',
          message: `Connected successfully! (HTTP ${result.httpStatus} - ${result.durationMs}ms)`,
        });
      } else {
        setFeedback({
          type: 'error',
          message: result.errorMessage || `Connection failed (HTTP ${result.httpStatus}).`,
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        httpStatus: 0,
        durationMs: 0,
        errorMessage: err.message || 'Unknown network error.',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleClearLogs = () => {
    startTransition(async () => {
      await clearCrmSyncLogsAction();
      setLogs([]);
    });
  };

  const activeCount = integrations.filter((i) => i.is_enabled).length;
  const currentMeta = CRM_PROVIDERS_META.find((m) => m.provider === selectedProvider);

  return (
    <div className="space-y-6">
      {/* Top Banner & Stats */}
      <div className="bg-surface rounded-2xl border border-border p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-ink text-white flex items-center justify-center shrink-0 shadow-xs">
              <Share2 className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold font-heading text-ink">
                  External CRM Synchronization
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-creek-light text-creek">
                  Live Dispatcher v2.4
                </span>
              </div>
              <p className="text-xs text-ink-muted mt-0.5">
                Automatically push WhatsApp qualified leads, viewing appointments, and agent handoffs into your core agency CRM.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="px-3 py-1.5 rounded-xl border border-border bg-surface-subtle text-xs">
              <span className="text-ink-muted">Active Integrations: </span>
              <span className="font-bold text-ink">{activeCount} of {CRM_PROVIDERS_META.length}</span>
            </div>
            {needsMigration && (
              <button
                type="button"
                onClick={() => setShowSqlModal(true)}
                className="px-3 py-1.5 rounded-xl border border-amber-300 bg-amber-50 text-amber-900 text-xs font-semibold hover:bg-amber-100 transition inline-flex items-center gap-1.5"
              >
                <Database className="w-3.5 h-3.5 text-amber-700" />
                <span>Run SQL Migration</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-border/80 mt-5 pt-1">
          <button
            type="button"
            onClick={() => setActiveTab('integrations')}
            className={`px-3.5 py-2 text-xs font-semibold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'integrations'
                ? 'border-ink text-ink'
                : 'border-transparent text-ink-muted hover:text-ink'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>CRM Connectors</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-seaglass text-ink font-bold">
              {CRM_PROVIDERS_META.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('mapping')}
            className={`px-3.5 py-2 text-xs font-semibold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'mapping'
                ? 'border-ink text-ink'
                : 'border-transparent text-ink-muted hover:text-ink'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Field Intelligence Mapping</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('logs')}
            className={`px-3.5 py-2 text-xs font-semibold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'logs'
                ? 'border-ink text-ink'
                : 'border-transparent text-ink-muted hover:text-ink'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Audit Trail & Sync Logs</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-seaglass text-ink font-bold">
              {logs.length}
            </span>
          </button>
        </div>
      </div>

      {/* Migration Notice Banner if DB table pending */}
      {needsMigration && (
        <div className="p-4 rounded-2xl border border-amber-200 bg-amber-50/70 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900">
              <span className="font-bold block text-sm mb-0.5">Postgres CRM Schema Ready</span>
              The external CRM integration engine is active in memory. For permanent persistence across database reloads,
              run the safe migration in your Supabase SQL editor.
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowSqlModal(true)}
            className="px-3 py-1.5 rounded-xl bg-amber-600 text-white font-semibold text-xs hover:bg-amber-700 transition shrink-0"
          >
            View SQL
          </button>
        </div>
      )}

      {/* TAB 1: INTEGRATIONS HUB */}
      {activeTab === 'integrations' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {CRM_PROVIDERS_META.map((meta) => {
            const config = integrations.find((i) => i.provider === meta.provider);
            const isEnabled = Boolean(config?.is_enabled);
            const isConfigured = Boolean(config?.api_key || config?.webhook_url);
            const lastSync = config?.last_sync_at;
            const lastStatus = config?.last_sync_status;

            return (
              <div
                key={meta.provider}
                onClick={() => openConfigModal(meta.provider)}
                className={`bg-surface rounded-2xl border transition-all cursor-pointer p-5 flex flex-col justify-between hover:shadow-md relative overflow-hidden group ${
                  isEnabled
                    ? 'border-emerald-300 ring-1 ring-emerald-400/20'
                    : 'border-border hover:border-ink/30'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shadow-xs ${meta.iconBg}`}
                      >
                        {meta.name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-heading font-bold text-sm text-ink group-hover:text-creek transition">
                          {meta.name}
                        </h4>
                        <span className="text-[10px] font-semibold text-ink-muted uppercase tracking-wider">
                          {meta.category}
                        </span>
                      </div>
                    </div>

                    {/* Enable Toggle Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        if (!config) {
                          openConfigModal(meta.provider);
                        } else {
                          handleToggleEnable(config, e);
                        }
                      }}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        isEnabled ? 'bg-emerald-500' : 'bg-stone-300'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          isEnabled ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  <p className="text-xs text-ink-muted line-clamp-2 leading-relaxed mb-4">
                    {meta.tagline}
                  </p>
                </div>

                <div className="space-y-2.5 pt-3 border-t border-border/70 text-xs">
                  {/* Status Indicator */}
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-ink-soft">Status:</span>
                    {isEnabled ? (
                      <span className="inline-flex items-center gap-1 font-semibold text-emerald-600">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Active & Syncing</span>
                      </span>
                    ) : isConfigured ? (
                      <span className="text-ink-muted font-medium">Ready (Paused)</span>
                    ) : (
                      <span className="text-ink-faint">Not Configured</span>
                    )}
                  </div>

                  {/* Last Sync */}
                  {lastSync && (
                    <div className="flex items-center justify-between text-[11px] text-ink-soft">
                      <span>Last sync:</span>
                      <span className="font-medium text-ink">
                        {formatDubaiTime(lastSync)}
                      </span>
                    </div>
                  )}

                  {/* Triggers Summary */}
                  {config && (
                    <div className="flex items-center gap-1.5 flex-wrap pt-1">
                      {config.sync_on_qualified && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-creek-subtle text-creek font-medium">
                          Qualified Leads
                        </span>
                      )}
                      {config.sync_on_viewing && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-saffron-light text-saffron-hover font-medium">
                          Viewings
                        </span>
                      )}
                      {config.sync_on_handoff && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-coral-light text-coral font-medium">
                          Handoffs
                        </span>
                      )}
                    </div>
                  )}

                  <div className="pt-2 flex items-center justify-between text-[11px] font-semibold text-ink group-hover:text-creek transition">
                    <span>Configure Settings</span>
                    <ChevronRight className="w-4 h-4 transform group-hover:translate-x-0.5 transition" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 2: FIELD INTELLIGENCE MAPPING */}
      {activeTab === 'mapping' && (
        <div className="bg-surface rounded-2xl border border-border p-6 space-y-6">
          <div>
            <h3 className="font-heading font-bold text-base text-ink">
              Dubai Real Estate CRM Field Mapping Matrix
            </h3>
            <p className="text-xs text-ink-muted mt-1">
              Balos AI standardizes WhatsApp lead qualification data into clean, typed attributes before pushing to your CRM.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-border bg-surface-subtle text-ink font-semibold">
                  <th className="py-2.5 px-4 rounded-l-xl">Balos Intelligence Field</th>
                  <th className="py-2.5 px-4">Sample Extracted Value</th>
                  <th className="py-2.5 px-4">Standard CRM Target Property</th>
                  <th className="py-2.5 px-4 rounded-r-xl">Behavior & Tags</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                <tr>
                  <td className="py-3 px-4 font-semibold text-ink">Full Name & Phone</td>
                  <td className="py-3 px-4 font-mono text-ink-muted">Dr. Tariq Al Mansoori (+971501234567)</td>
                  <td className="py-3 px-4"><code>First Name</code>, <code>Last Name</code>, <code>Phone / Mobile</code></td>
                  <td className="py-3 px-4 text-ink-soft">Deduped against existing CRM contact record</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-semibold text-ink">Lead Qualification Score</td>
                  <td className="py-3 px-4 font-mono text-emerald-600 font-bold">92 / 100</td>
                  <td className="py-3 px-4"><code>Lead Score</code> / <code>Rating</code></td>
                  <td className="py-3 px-4 text-ink-soft">Tags lead as <code>Hot Prospect</code> if score ≥ 75</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-semibold text-ink">Budget AED (Min / Max / Midpoint)</td>
                  <td className="py-3 px-4 font-mono text-ink font-semibold">AED 5,000,000 - 8,500,000</td>
                  <td className="py-3 px-4"><code>Deal Amount</code> / <code>Annual Revenue</code></td>
                  <td className="py-3 px-4 text-ink-soft">Calculates exact single-number AED midpoint</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-semibold text-ink">Target Communities</td>
                  <td className="py-3 px-4 font-mono text-ink-muted">Downtown Dubai, Palm Jumeirah</td>
                  <td className="py-3 px-4"><code>Preferred Locations</code> / <code>Tags</code></td>
                  <td className="py-3 px-4 text-ink-soft">Stored as comma-separated tags and custom field</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-semibold text-ink">Golden Visa Seeker Flag</td>
                  <td className="py-3 px-4 font-mono text-saffron-hover font-bold">true (Qualified AED 2M+)</td>
                  <td className="py-3 px-4"><code>Tags: Golden Visa Applicant</code></td>
                  <td className="py-3 px-4 text-ink-soft">Enables automated Visa advisory workflows</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-semibold text-ink">Scheduled Viewing</td>
                  <td className="py-3 px-4 font-mono text-ink-muted">Physical Site Visit (2026-10-24 14:00 GST)</td>
                  <td className="py-3 px-4"><code>Tasks / Appointments / Events</code></td>
                  <td className="py-3 px-4 text-ink-soft">Includes property address and Zoom link</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-semibold text-ink">Assigned Licensed Agent</td>
                  <td className="py-3 px-4 font-mono text-ink-muted">Karim Mansour (karim@balos.ae)</td>
                  <td className="py-3 px-4"><code>Contact Owner</code> / <code>Assigned User</code></td>
                  <td className="py-3 px-4 text-ink-soft">Matches agent email or name in target CRM</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: AUDIT TRAIL & LOGS */}
      {activeTab === 'logs' && (
        <div className="bg-surface rounded-2xl border border-border p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-heading font-bold text-base text-ink">
                Real-Time CRM Synchronization Logs
              </h3>
              <p className="text-xs text-ink-muted mt-0.5">
                Every webhook push and API sync event is audited with request duration, payload, and response status.
              </p>
            </div>
            {logs.length > 0 && (
              <button
                type="button"
                onClick={handleClearLogs}
                className="px-3 py-1.5 rounded-xl border border-border text-ink-muted hover:text-coral hover:border-coral/30 text-xs font-medium transition inline-flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear Logs</span>
              </button>
            )}
          </div>

          {logs.length === 0 ? (
            <div className="p-12 text-center border border-dashed border-border rounded-xl">
              <Share2 className="w-8 h-8 text-ink-faint mx-auto mb-2" />
              <p className="text-xs font-semibold text-ink">No CRM sync events logged yet</p>
              <p className="text-[11px] text-ink-muted mt-0.5">
                Configure an integration above or click "Test Ping" to send a sample Dubai lead.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-border text-ink-soft font-semibold">
                    <th className="py-2 px-3">Timestamp</th>
                    <th className="py-2 px-3">Provider</th>
                    <th className="py-2 px-3">Trigger Event</th>
                    <th className="py-2 px-3">Lead Contact</th>
                    <th className="py-2 px-3">Status</th>
                    <th className="py-2 px-3">Latency</th>
                    <th className="py-2 px-3 text-right">Payload</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {logs.map((log) => {
                    const isSuccess = log.status === 'SUCCESS';
                    return (
                      <tr key={log.id} className="hover:bg-surface-subtle transition">
                        <td className="py-2.5 px-3 font-mono text-[11px] text-ink-muted whitespace-nowrap">
                          {formatDubaiTime(log.created_at)}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-ink capitalize">
                          {log.provider}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-seaglass text-ink">
                            {log.event}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-medium text-ink">
                          {log.lead_name || 'Anonymous Lead'}
                        </td>
                        <td className="py-2.5 px-3">
                          {isSuccess ? (
                            <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 text-[11px]">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>{log.http_status ? `HTTP ${log.http_status}` : '200 OK'}</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 font-semibold text-coral text-[11px]">
                              <AlertCircle className="w-3.5 h-3.5" />
                              <span>{log.http_status ? `HTTP ${log.http_status}` : 'Failed'}</span>
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[11px] text-ink-muted">
                          {log.duration_ms ? `${log.duration_ms}ms` : '—'}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => setInspectPayloadLog(log)}
                            className="px-2.5 py-1 rounded-lg border border-border bg-surface-pure hover:bg-seaglass text-ink font-semibold text-[11px] transition"
                          >
                            Inspect
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* CONFIGURATION MODAL / DRAWER */}
      {selectedProvider && editingIntegration && currentMeta && (
        <div className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface w-full max-w-2xl rounded-2xl border border-border shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shadow-xs ${currentMeta.iconBg}`}
                >
                  {currentMeta.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-heading font-bold text-base text-ink">
                    Configure {currentMeta.name}
                  </h3>
                  <p className="text-xs text-ink-muted">{currentMeta.tagline}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedProvider(null)}
                className="w-8 h-8 rounded-xl border border-border flex items-center justify-center text-ink-muted hover:text-ink hover:bg-seaglass transition"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 flex-1 text-xs">
              {/* Feedback Alert */}
              {feedback && (
                <div
                  className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                    feedback.type === 'success'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-coral-light border-coral/30 text-coral'
                  }`}
                >
                  {feedback.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0 text-coral" />
                  )}
                  <span>{feedback.message}</span>
                </div>
              )}

              {/* Enable Switch */}
              <div className="flex items-center justify-between p-3.5 bg-surface-subtle rounded-xl border border-border">
                <div>
                  <span className="font-bold text-ink block">Enable {currentMeta.name} Integration</span>
                  <span className="text-[11px] text-ink-muted">
                    When enabled, leads will automatically sync based on the triggers below.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setEditingIntegration((prev) =>
                      prev ? { ...prev, is_enabled: !prev.is_enabled } : null
                    )
                  }
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    editingIntegration.is_enabled ? 'bg-emerald-500' : 'bg-stone-300'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      editingIntegration.is_enabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Credentials Section */}
              <div className="space-y-3.5">
                <h4 className="font-heading font-bold text-xs uppercase tracking-wider text-ink-faint">
                  Authentication & Endpoints
                </h4>

                {/* API Key / Token / Secret */}
                <div>
                  <label className="block font-semibold text-ink mb-1">
                    {currentMeta.keyLabel}
                  </label>
                  <div className="relative">
                    <input
                      type={showKey ? 'text' : 'password'}
                      value={editingIntegration.api_key || ''}
                      onChange={(e) =>
                        setEditingIntegration((prev) =>
                          prev ? { ...prev, api_key: e.target.value } : null
                        )
                      }
                      placeholder={currentMeta.keyPlaceholder}
                      className="w-full pl-3.5 pr-10 py-2 rounded-xl border border-border bg-surface-pure text-ink font-mono placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-creek/20 focus:border-creek"
                    />
                    <button
                      type="button"
                      onClick={() => setShowKey((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink"
                    >
                      {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Endpoint URL (or Webhook URL for Webhook type) */}
                <div>
                  <label className="block font-semibold text-ink mb-1">
                    {currentMeta.provider === 'webhook' ? 'Webhook Endpoint URL' : 'API Endpoint URL'}
                  </label>
                  <input
                    type="url"
                    value={
                      currentMeta.provider === 'webhook'
                        ? editingIntegration.webhook_url || ''
                        : editingIntegration.api_endpoint || ''
                    }
                    onChange={(e) =>
                      setEditingIntegration((prev) =>
                        prev
                          ? currentMeta.provider === 'webhook'
                            ? { ...prev, webhook_url: e.target.value }
                            : { ...prev, api_endpoint: e.target.value }
                          : null
                      )
                    }
                    placeholder={currentMeta.defaultEndpoint}
                    className="w-full px-3.5 py-2 rounded-xl border border-border bg-surface-pure text-ink font-mono placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-creek/20 focus:border-creek"
                  />
                </div>

                {/* Account ID / Location ID / System Name (if applicable) */}
                {currentMeta.supportsAccountId && (
                  <div>
                    <label className="block font-semibold text-ink mb-1">
                      {currentMeta.accountIdLabel}
                    </label>
                    <input
                      type="text"
                      value={editingIntegration.account_id || ''}
                      onChange={(e) =>
                        setEditingIntegration((prev) =>
                          prev ? { ...prev, account_id: e.target.value } : null
                        )
                      }
                      placeholder={currentMeta.accountIdPlaceholder}
                      className="w-full px-3.5 py-2 rounded-xl border border-border bg-surface-pure text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-creek/20 focus:border-creek"
                    />
                  </div>
                )}

                {/* Webhook Secret for Webhook Provider */}
                {currentMeta.provider === 'webhook' && (
                  <div>
                    <label className="block font-semibold text-ink mb-1">
                      Webhook Secret (HMAC-SHA256 Signing Header)
                    </label>
                    <input
                      type="text"
                      value={editingIntegration.webhook_secret || ''}
                      onChange={(e) =>
                        setEditingIntegration((prev) =>
                          prev ? { ...prev, webhook_secret: e.target.value } : null
                        )
                      }
                      placeholder="whsec_xxxxxxxxxxxx (Optional for verification)"
                      className="w-full px-3.5 py-2 rounded-xl border border-border bg-surface-pure text-ink font-mono placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-creek/20 focus:border-creek"
                    />
                  </div>
                )}
              </div>

              {/* Sync Triggers Section */}
              <div className="space-y-3 pt-2">
                <h4 className="font-heading font-bold text-xs uppercase tracking-wider text-ink-faint">
                  Automatic Sync Triggers
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <label className="flex items-center gap-2.5 p-2.5 rounded-xl border border-border bg-surface-pure cursor-pointer hover:bg-seaglass/40 transition">
                    <input
                      type="checkbox"
                      checked={editingIntegration.sync_on_qualified}
                      onChange={(e) =>
                        setEditingIntegration((prev) =>
                          prev ? { ...prev, sync_on_qualified: e.target.checked } : null
                        )
                      }
                      className="rounded border-border text-ink focus:ring-creek/30 w-4 h-4"
                    />
                    <div>
                      <span className="font-semibold text-ink block">Qualified Leads</span>
                      <span className="text-[10px] text-ink-muted">Score ≥ 50 or QUALIFIED stage</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-2.5 p-2.5 rounded-xl border border-border bg-surface-pure cursor-pointer hover:bg-seaglass/40 transition">
                    <input
                      type="checkbox"
                      checked={editingIntegration.sync_on_viewing}
                      onChange={(e) =>
                        setEditingIntegration((prev) =>
                          prev ? { ...prev, sync_on_viewing: e.target.checked } : null
                        )
                      }
                      className="rounded border-border text-ink focus:ring-creek/30 w-4 h-4"
                    />
                    <div>
                      <span className="font-semibold text-ink block">Scheduled Viewings</span>
                      <span className="text-[10px] text-ink-muted">Physical, Virtual, or Office meet</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-2.5 p-2.5 rounded-xl border border-border bg-surface-pure cursor-pointer hover:bg-seaglass/40 transition">
                    <input
                      type="checkbox"
                      checked={editingIntegration.sync_on_handoff}
                      onChange={(e) =>
                        setEditingIntegration((prev) =>
                          prev ? { ...prev, sync_on_handoff: e.target.checked } : null
                        )
                      }
                      className="rounded border-border text-ink focus:ring-creek/30 w-4 h-4"
                    />
                    <div>
                      <span className="font-semibold text-ink block">Human Agent Handoff</span>
                      <span className="text-[10px] text-ink-muted">When AI pauses or hands off</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-2.5 p-2.5 rounded-xl border border-border bg-surface-pure cursor-pointer hover:bg-seaglass/40 transition">
                    <input
                      type="checkbox"
                      checked={editingIntegration.sync_on_create}
                      onChange={(e) =>
                        setEditingIntegration((prev) =>
                          prev ? { ...prev, sync_on_create: e.target.checked } : null
                        )
                      }
                      className="rounded border-border text-ink focus:ring-creek/30 w-4 h-4"
                    />
                    <div>
                      <span className="font-semibold text-ink block">All Inbound Leads</span>
                      <span className="text-[10px] text-ink-muted">Immediately on 1st message</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Test Ping Diagnostic Box */}
              {testResult && (
                <div className="p-3.5 rounded-xl border border-border bg-surface-subtle space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-ink">Test Connection Result:</span>
                    <span
                      className={`font-mono text-xs font-bold px-2 py-0.5 rounded-full ${
                        testResult.success
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-coral-light text-coral'
                      }`}
                    >
                      {testResult.httpStatus ? `HTTP ${testResult.httpStatus}` : 'Error'} ({testResult.durationMs}ms)
                    </span>
                  </div>

                  {testResult.errorMessage && (
                    <p className="text-coral text-xs">{testResult.errorMessage}</p>
                  )}

                  {testResult.responsePayload && (
                    <div>
                      <span className="text-[10px] text-ink-muted block mb-1">Server Response Body:</span>
                      <pre className="p-2.5 bg-ink text-white rounded-lg text-[10px] font-mono overflow-x-auto max-h-32">
                        {JSON.stringify(testResult.responsePayload, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-border bg-surface-subtle flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={isTesting}
                  onClick={handleRunTestPing}
                  className="px-3 py-2 rounded-xl border border-border bg-surface-pure hover:bg-seaglass text-ink font-semibold text-xs transition inline-flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Send className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                  <span>{isTesting ? 'Testing Connection...' : 'Test Connection & Ping'}</span>
                </button>

                <a
                  href={currentMeta.docsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2 rounded-xl text-ink-muted hover:text-ink text-xs transition inline-flex items-center gap-1"
                >
                  <span>API Docs</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedProvider(null)}
                  className="px-3.5 py-2 rounded-xl text-xs text-ink-muted hover:text-ink"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={handleSaveIntegration}
                  className="px-4 py-2 rounded-xl bg-ink text-white font-semibold text-xs hover:bg-ink/90 transition shadow-xs disabled:opacity-50 inline-flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{isPending ? 'Saving...' : 'Save Configuration'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* INSPECT PAYLOAD MODAL */}
      {inspectPayloadLog && (
        <div className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface w-full max-w-2xl rounded-2xl border border-border shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="font-heading font-bold text-sm text-ink">
                  Sync Audit Payload Inspector
                </h3>
                <span className="text-xs text-ink-muted">
                  {inspectPayloadLog.provider.toUpperCase()} • {inspectPayloadLog.event} •{' '}
                  {formatDubaiDateTime(inspectPayloadLog.created_at)}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setInspectPayloadLog(null)}
                className="w-7 h-7 rounded-lg border border-border flex items-center justify-center text-ink-muted hover:text-ink"
              >
                ✕
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-3 flex-1 text-xs">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-ink">Request Payload (JSON dispatched to CRM):</span>
                  <button
                    type="button"
                    onClick={() =>
                      copyToClipboard(
                        JSON.stringify(inspectPayloadLog.request_payload, null, 2),
                        'req'
                      )
                    }
                    className="text-[11px] text-ink-muted hover:text-ink inline-flex items-center gap-1"
                  >
                    {copiedText === 'req' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedText === 'req' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <pre className="p-3 bg-stone-900 text-stone-100 rounded-xl font-mono text-[11px] overflow-x-auto max-h-56">
                  {JSON.stringify(inspectPayloadLog.request_payload, null, 2)}
                </pre>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-ink">CRM Response Body:</span>
                  <button
                    type="button"
                    onClick={() =>
                      copyToClipboard(
                        JSON.stringify(inspectPayloadLog.response_payload, null, 2),
                        'res'
                      )
                    }
                    className="text-[11px] text-ink-muted hover:text-ink inline-flex items-center gap-1"
                  >
                    {copiedText === 'res' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedText === 'res' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <pre className="p-3 bg-stone-900 text-stone-100 rounded-xl font-mono text-[11px] overflow-x-auto max-h-40">
                  {JSON.stringify(inspectPayloadLog.response_payload, null, 2)}
                </pre>
              </div>
            </div>

            <div className="p-3 border-t border-border flex justify-end">
              <button
                type="button"
                onClick={() => setInspectPayloadLog(null)}
                className="px-4 py-1.5 rounded-xl bg-ink text-white text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SQL MIGRATION MODAL */}
      {showSqlModal && (
        <div className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface w-full max-w-2xl rounded-2xl border border-border shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-600" />
                <h3 className="font-heading font-bold text-sm text-ink">
                  Supabase Migration: CRM Integrations & Audit Logs
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowSqlModal(false)}
                className="w-7 h-7 rounded-lg border border-border flex items-center justify-center text-ink-muted hover:text-ink"
              >
                ✕
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-3 flex-1 text-xs">
              <p className="text-ink-muted leading-relaxed">
                Run this idempotent SQL script in your Supabase SQL Editor to permanently store CRM API credentials,
                webhook secrets, and sync audit logs with Row-Level Security (RLS) enforcement.
              </p>

              <div className="relative">
                <pre className="p-3 bg-stone-900 text-stone-100 rounded-xl font-mono text-[11px] overflow-x-auto max-h-72">
{`-- 1. Create table for CRM Integration Configurations
CREATE TABLE IF NOT EXISTS public.crm_integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL,
  name text NOT NULL,
  is_enabled boolean NOT NULL DEFAULT false,
  api_key text,
  api_endpoint text,
  account_id text,
  webhook_url text,
  webhook_secret text,
  sync_on_create boolean NOT NULL DEFAULT false,
  sync_on_qualified boolean NOT NULL DEFAULT true,
  sync_on_viewing boolean NOT NULL DEFAULT true,
  sync_on_handoff boolean NOT NULL DEFAULT true,
  sync_on_stage_change boolean NOT NULL DEFAULT false,
  field_mapping jsonb DEFAULT '{}'::jsonb,
  last_sync_at timestamptz,
  last_sync_status text,
  last_sync_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Create table for CRM Sync Audit Trail
CREATE TABLE IF NOT EXISTS public.crm_sync_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id uuid REFERENCES public.crm_integrations(id) ON DELETE SET NULL,
  provider text NOT NULL,
  lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  lead_name text,
  event text NOT NULL,
  status text NOT NULL,
  http_status integer,
  request_payload jsonb,
  response_payload jsonb,
  error_message text,
  duration_ms integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.crm_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_sync_logs ENABLE ROW LEVEL SECURITY;`}
                </pre>
              </div>

              <div className="p-3 bg-surface-subtle rounded-xl border border-border text-[11px] text-ink-muted">
                File located at: <code>supabase/migrations/20261021_crm_integrations.sql</code>
              </div>
            </div>

            <div className="p-3 border-t border-border flex items-center justify-between">
              <button
                type="button"
                onClick={() =>
                  copyToClipboard(
                    `CREATE TABLE IF NOT EXISTS public.crm_integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL,
  name text NOT NULL,
  is_enabled boolean NOT NULL DEFAULT false,
  api_key text,
  api_endpoint text,
  account_id text,
  webhook_url text,
  webhook_secret text,
  sync_on_create boolean NOT NULL DEFAULT false,
  sync_on_qualified boolean NOT NULL DEFAULT true,
  sync_on_viewing boolean NOT NULL DEFAULT true,
  sync_on_handoff boolean NOT NULL DEFAULT true,
  sync_on_stage_change boolean NOT NULL DEFAULT false,
  field_mapping jsonb DEFAULT '{}'::jsonb,
  last_sync_at timestamptz,
  last_sync_status text,
  last_sync_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.crm_sync_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id uuid REFERENCES public.crm_integrations(id) ON DELETE SET NULL,
  provider text NOT NULL,
  lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  lead_name text,
  event text NOT NULL,
  status text NOT NULL,
  http_status integer,
  request_payload jsonb,
  response_payload jsonb,
  error_message text,
  duration_ms integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.crm_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_sync_logs ENABLE ROW LEVEL SECURITY;`,
                    'sql'
                  )
                }
                className="px-3 py-1.5 rounded-xl border border-border text-xs font-semibold text-ink hover:bg-seaglass transition inline-flex items-center gap-1.5"
              >
                {copiedText === 'sql' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedText === 'sql' ? 'Copied SQL' : 'Copy All SQL'}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowSqlModal(false)}
                className="px-4 py-1.5 rounded-xl bg-ink text-white text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
