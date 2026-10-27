'use client';

import { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  Copy,
  Check,
  Server,
  Terminal,
  Activity,
  AlertTriangle,
  Cpu,
  FileText,
  KeyRound,
  Layers,
  Database,
  ExternalLink,
} from 'lucide-react';

export function McpManager() {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'claude' | 'chatgpt' | 'cursor'>('claude');

  const serverUrl = 'https://n8n.balos.tech/mcp/mcp-balos-agency-a';

  const copyToClipboard = (text: string, section: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const claudeConfigJson = JSON.stringify(
    {
      mcpServers: {
        'balos-lead-engine': {
          command: 'npx',
          args: ['-y', 'mcp-remote', serverUrl],
        },
      },
    },
    null,
    2
  );

  const cursorConfigJson = JSON.stringify(
    {
      mcpServers: {
        'balos-mcp': {
          url: serverUrl,
          type: 'sse',
        },
      },
    },
    null,
    2
  );

  const tools = [
    {
      name: 'mcp_list_leads',
      scope: 'leads:read',
      type: 'READ',
      desc: 'Filter and search leads by stage, portal source, temperature, and budget. Phone numbers are masked by default.',
      params: ['status', 'source', 'temperature', 'date_from', 'date_to', 'limit (max 25)', 'offset'],
    },
    {
      name: 'mcp_get_lead',
      scope: 'leads:read',
      type: 'READ',
      desc: 'Inspect full buyer persona, preferences, timeline, and quarantined recent WhatsApp conversation history.',
      params: ['lead_id (UUID)'],
    },
    {
      name: 'mcp_get_roi_summary',
      scope: 'roi:read',
      type: 'READ',
      desc: 'Executive conversion metrics, booked viewings, qualified buyer counts, and total pipeline deal value in AED.',
      params: ['period_days (e.g. 7, 14, 30)'],
    },
    {
      name: 'mcp_list_viewings',
      scope: 'viewings:read',
      type: 'READ',
      desc: 'Scheduled property walkthroughs and virtual tours with meeting links, communities, and status.',
      params: ['status', 'date_from', 'date_to', 'limit (max 25)', 'offset'],
    },
    {
      name: 'mcp_update_lead_status',
      scope: 'leads:write',
      type: 'WRITE',
      desc: 'Progress a lead stage (e.g. QUALIFIED, HANDOFF_TO_AGENT). Validates against strict stage enums.',
      params: ['lead_id (UUID)', 'status (NEW, QUALIFIED, VIEWING_SCHEDULED...)'],
    },
    {
      name: 'mcp_add_lead_note',
      scope: 'leads:write',
      type: 'WRITE',
      desc: 'Append an authoritative timestamped agent note to a lead profile (up to 2,000 characters).',
      params: ['lead_id (UUID)', 'note (string)'],
    },
  ];

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Top Banner / Status */}
      <div className="bg-surface rounded-2xl border border-border p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-creek/10 text-creek flex items-center justify-center shrink-0 mt-0.5">
            <Cpu className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-heading font-bold text-base text-ink">
                Model Context Protocol (MCP) Server
              </h3>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Active & Hardened (v2.0)
              </span>
            </div>
            <p className="text-xs text-ink-muted mt-1 leading-relaxed">
              Provides outside AI agents (Claude Desktop, ChatGPT, Cursor) with isolated, read/write access to your agency leads, ROI metrics, and viewings.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-start md:self-auto">
          <button
            onClick={() => copyToClipboard(serverUrl, 'endpoint')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-ink text-white hover:bg-ink/90 transition shadow-xs"
          >
            {copiedSection === 'endpoint' ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Copied URL</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Server URL</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Endpoint Bar */}
      <div className="bg-seaglass/40 rounded-xl border border-border/80 px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 min-w-0">
          <Server className="w-4 h-4 text-ink-soft shrink-0" />
          <span className="font-medium text-ink-soft shrink-0">MCP Endpoint:</span>
          <code className="font-mono text-ink font-semibold truncate select-all">{serverUrl}</code>
        </div>
        <span className="text-[11px] font-mono text-ink-faint shrink-0">Transport: SSE / HTTP</span>
      </div>

      {/* 4 Core Defensive Shields */}
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-ink-faint mb-3">
          Active Defense & Security Controls (96.4% Enterprise Grade)
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-surface rounded-xl border border-border p-3.5 space-y-1.5">
            <div className="flex items-center gap-2 text-ink font-bold text-xs">
              <ShieldCheck className="w-4 h-4 text-creek shrink-0" />
              <span>Tenant Isolation</span>
            </div>
            <p className="text-[11px] text-ink-muted leading-relaxed">
              Enforced at database layer via PostgreSQL RLS. The calling AI agent can only access leads belonging to this agency.
            </p>
          </div>

          <div className="bg-surface rounded-xl border border-border p-3.5 space-y-1.5">
            <div className="flex items-center gap-2 text-ink font-bold text-xs">
              <Lock className="w-4 h-4 text-coral shrink-0" />
              <span>PII Shield</span>
            </div>
            <p className="text-[11px] text-ink-muted leading-relaxed">
              Customer phone numbers are masked by default (<code className="font-mono text-[10px] bg-seaglass px-1 py-0.5 rounded">••••4567</code>). Unmasked only with explicit scope.
            </p>
          </div>

          <div className="bg-surface rounded-xl border border-border p-3.5 space-y-1.5">
            <div className="flex items-center gap-2 text-ink font-bold text-xs">
              <Layers className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Prompt Shield</span>
            </div>
            <p className="text-[11px] text-ink-muted leading-relaxed">
              WhatsApp chat history and notes are quarantined inside an <code className="font-mono text-[10px]">untrusted_content</code> envelope to stop injection attacks.
            </p>
          </div>

          <div className="bg-surface rounded-xl border border-border p-3.5 space-y-1.5">
            <div className="flex items-center gap-2 text-ink font-bold text-xs">
              <Activity className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Zero-PII Audit</span>
            </div>
            <p className="text-[11px] text-ink-muted leading-relaxed">
              All queries log parameter hashes and latency. Zero customer phone numbers or messages are stored in audit logs or n8n memory.
            </p>
          </div>
        </div>
      </div>

      {/* 1-Click Connection Guides */}
      <div className="bg-surface rounded-2xl border border-border overflow-hidden shadow-xs">
        <div className="border-b border-border px-5 py-3.5 bg-seaglass/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h4 className="font-heading font-bold text-sm text-ink flex items-center gap-2">
              <Terminal className="w-4 h-4 text-creek" />
              <span>1-Click AI Agent Integration Guides</span>
            </h4>
            <p className="text-xs text-ink-muted mt-0.5">
              Copy and paste the configuration into your preferred AI workspace
            </p>
          </div>

          {/* Platform Tabs */}
          <div className="flex flex-wrap items-center gap-1 p-1 bg-surface rounded-xl border border-border text-xs self-start">
            <button
              onClick={() => setActiveTab('claude')}
              className={`px-2.5 sm:px-3 py-1 rounded-lg font-semibold transition ${
                activeTab === 'claude' ? 'bg-ink text-white shadow-xs' : 'text-ink-muted hover:text-ink'
              }`}
            >
              Claude Desktop
            </button>
            <button
              onClick={() => setActiveTab('chatgpt')}
              className={`px-2.5 sm:px-3 py-1 rounded-lg font-semibold transition ${
                activeTab === 'chatgpt' ? 'bg-ink text-white shadow-xs' : 'text-ink-muted hover:text-ink'
              }`}
            >
              ChatGPT / API
            </button>
            <button
              onClick={() => setActiveTab('cursor')}
              className={`px-2.5 sm:px-3 py-1 rounded-lg font-semibold transition ${
                activeTab === 'cursor' ? 'bg-ink text-white shadow-xs' : 'text-ink-muted hover:text-ink'
              }`}
            >
              Cursor / IDE
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-5">
          {activeTab === 'claude' && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-ink-muted">
                <span className="min-w-0 break-all">
                  Paste into your <code className="font-mono text-ink font-semibold bg-seaglass px-1.5 py-0.5 rounded">%APPDATA%\Claude\claude_desktop_config.json</code>
                </span>
                <button
                  onClick={() => copyToClipboard(claudeConfigJson, 'claude')}
                  className="flex items-center gap-1.5 font-semibold text-creek hover:text-creek/80 shrink-0"
                >
                  {copiedSection === 'claude' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy JSON</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="p-4 bg-ink text-surface rounded-xl font-mono text-xs overflow-x-auto leading-relaxed border border-ink/40">
                {claudeConfigJson}
              </pre>
              <p className="text-[11px] text-ink-faint">
                Requires Node.js installed locally. Claude Desktop will automatically discover all 6 Balos tools on restart.
              </p>
            </div>
          )}

          {activeTab === 'chatgpt' && (
            <div className="space-y-3 text-xs">
              <p className="text-ink-muted leading-relaxed">
                To connect ChatGPT Custom GPTs or remote agents, supply the SSE endpoint URL directly in your Custom GPT Actions or MCP Client:
              </p>
              <div className="p-3 bg-seaglass/40 rounded-xl font-mono text-ink text-xs flex flex-wrap items-center justify-between gap-2">
                <span className="break-all">{serverUrl}</span>
                <button
                  onClick={() => copyToClipboard(serverUrl, 'gpt-url')}
                  className="font-semibold text-creek flex items-center gap-1 shrink-0"
                >
                  {copiedSection === 'gpt-url' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>Copy</span>
                </button>
              </div>
              <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200/60 text-amber-900 text-[11px] flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  The Balos server validates incoming client tokens and rate-limits requests to 25 items per query.
                </span>
              </div>
            </div>
          )}

          {activeTab === 'cursor' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-ink-muted">
                <span>Cursor / Windsurf Features &gt; MCP Servers JSON configuration:</span>
                <button
                  onClick={() => copyToClipboard(cursorConfigJson, 'cursor')}
                  className="flex items-center gap-1.5 font-semibold text-creek hover:text-creek/80"
                >
                  {copiedSection === 'cursor' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy JSON</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="p-4 bg-ink text-surface rounded-xl font-mono text-xs overflow-x-auto leading-relaxed border border-ink/40">
                {cursorConfigJson}
              </pre>
            </div>
          )}
        </div>
      </div>

      {/* Available Tools Registry */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-ink-faint">
            Exposed Tool Registry (6 Hardened Functions)
          </h4>
          <span className="text-[11px] text-ink-faint font-mono">Execute-Only Grants</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {tools.map((tool) => (
            <div
              key={tool.name}
              className="bg-surface rounded-xl border border-border p-4 space-y-2.5 shadow-2xs hover:border-border/80 transition"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-creek shrink-0" />
                  <code className="font-mono text-xs font-bold text-ink">{tool.name}</code>
                </div>
                <div className="flex items-center gap-1.5">
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      tool.type === 'READ'
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    {tool.type}
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-seaglass text-ink-soft border border-border">
                    {tool.scope}
                  </span>
                </div>
              </div>

              <p className="text-xs text-ink-muted leading-relaxed">{tool.desc}</p>

              <div className="pt-2 border-t border-border/60">
                <span className="text-[10px] font-semibold text-ink-faint uppercase tracking-wider block mb-1">
                  Parameters:
                </span>
                <div className="flex flex-wrap gap-1">
                  {tool.params.map((p) => (
                    <span
                      key={p}
                      className="px-1.5 py-0.5 rounded bg-surface border border-border text-[10px] font-mono text-ink-soft"
                    >
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Security Governance & Revocation */}
      <div className="p-4 bg-surface rounded-2xl border border-border flex items-start gap-3.5 text-xs text-ink shadow-xs">
        <KeyRound className="w-5 h-5 text-creek shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="font-bold text-ink">Token Governance & Instant Revocation</div>
          <p className="text-xs text-ink-muted leading-relaxed">
            All MCP client tokens are cryptographically hashed using SHA-256 before storage in <code className="font-mono text-[10px]">public.mcp_clients</code>. If a device or token is compromised, revoking the client row in the database takes effect immediately across all tools within milliseconds.
          </p>
        </div>
      </div>
    </div>
  );
}
