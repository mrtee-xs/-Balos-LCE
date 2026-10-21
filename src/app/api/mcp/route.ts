import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Supabase configuration
const DEFAULT_SUPABASE_URL = 'https://xsiitikrcckzivadvact.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhzaWl0aWtyY2Nreml2YWR2YWN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5ODU3MDQsImV4cCI6MjEwNTU2MTcwNH0.c7ifHSefGyqy_MsZj63fJTXA2d_9rs7aaKSJJqjJmvE';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  DEFAULT_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
});

// WAHA Configuration
const WAHA_BASE_URL = 'https://waha.balos.tech';

// Standard MCP Tool Definitions
const MCP_TOOLS = [
  {
    name: 'list_leads',
    description:
      'List real estate leads from Balos with filtering by pipeline stage, temperature, source, or search keyword.',
    inputSchema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          description:
            'Filter by stage: NEW, ENGAGED, QUALIFIED, VIEWING_SCHEDULED, HANDOFF_TO_AGENT, CLOSED_WON, CLOSED_LOST',
        },
        temperature: {
          type: 'string',
          description: 'Filter by temperature: HOT, WARM, COLD',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of leads to return (1-50, default 20)',
        },
      },
    },
  },
  {
    name: 'get_lead',
    description:
      'Get full dossier and recent conversation history for a specific lead by ID or phone number.',
    inputSchema: {
      type: 'object',
      properties: {
        lead_id: {
          type: 'string',
          description: 'UUID of the lead, or phone number',
        },
      },
      required: ['lead_id'],
    },
  },
  {
    name: 'search_properties',
    description:
      'Search available Dubai properties in the agency inventory by community, budget, bedrooms, or category.',
    inputSchema: {
      type: 'object',
      properties: {
        community: {
          type: 'string',
          description: 'Community name (e.g. Dubai Marina, Business Bay, JVC, Downtown Dubai)',
        },
        max_budget_aed: {
          type: 'number',
          description: 'Maximum budget in AED',
        },
        bedrooms: {
          type: 'number',
          description: 'Number of bedrooms (0 for studio, 1, 2, 3+)',
        },
        category: {
          type: 'string',
          description: 'Property category: APARTMENT, VILLA, TOWNHOUSE, PENTHOUSE',
        },
        market_type: {
          type: 'string',
          description: 'Market type: OFF_PLAN or READY_SECONDARY',
        },
      },
    },
  },
  {
    name: 'get_roi_summary',
    description:
      'Get executive ROI performance metrics, lead conversion rates, and pipeline health for the agency.',
    inputSchema: {
      type: 'object',
      properties: {
        period_days: {
          type: 'number',
          description: 'Timeframe in days (default 7)',
        },
      },
    },
  },
  {
    name: 'list_viewings',
    description:
      'List scheduled property viewings and virtual video walkthroughs with leads.',
    inputSchema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          description: 'Filter by status: CONFIRMED, COMPLETED, CANCELLED',
        },
      },
    },
  },
  {
    name: 'update_lead_status',
    description:
      'Update the pipeline stage of a lead (e.g. QUALIFIED, VIEWING_SCHEDULED, HANDOFF_TO_AGENT, CLOSED_WON, CLOSED_LOST).',
    inputSchema: {
      type: 'object',
      properties: {
        lead_id: {
          type: 'string',
          description: 'UUID of the lead',
        },
        status: {
          type: 'string',
          description:
            'Target stage: NEW, ENGAGED, QUALIFIED, VIEWING_SCHEDULED, HANDOFF_TO_AGENT, CLOSED_WON, CLOSED_LOST',
        },
      },
      required: ['lead_id', 'status'],
    },
  },
  {
    name: 'send_whatsapp_message',
    description:
      'Send a direct WhatsApp message to a lead via the Balos engine and WAHA.',
    inputSchema: {
      type: 'object',
      properties: {
        lead_id: {
          type: 'string',
          description: 'UUID of the lead',
        },
        message: {
          type: 'string',
          description: 'Text message to send to the lead',
        },
      },
      required: ['lead_id', 'message'],
    },
  },
];

// Active SSE sessions map
interface Session {
  id: string;
  writer: WritableStreamDefaultWriter<Uint8Array>;
  encoder: TextEncoder;
}
const activeSessions = new Map<string, Session>();

// CORS headers helper
function getCorsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept',
  };
}

// -----------------------------------------------------------------------------
// OPTIONS: Handle CORS preflight
// -----------------------------------------------------------------------------
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: getCorsHeaders(),
  });
}

// -----------------------------------------------------------------------------
// GET: Handle SSE connection from Claude or return MCP status
// -----------------------------------------------------------------------------
export async function GET(request: NextRequest) {
  const acceptHeader = request.headers.get('accept') || '';
  const url = new URL(request.url);

  // If client explicitly requests event-stream (or general probe), initiate SSE connection
  const isSse =
    acceptHeader.includes('text/event-stream') ||
    url.searchParams.has('sse') ||
    acceptHeader.includes('*/*');

  if (isSse) {
    const sessionId = crypto.randomUUID();
    const encoder = new TextEncoder();
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();

    const session: Session = {
      id: sessionId,
      writer,
      encoder,
    };
    activeSessions.set(sessionId, session);

    // Initial endpoint announcement event required by MCP SSE Transport spec
    const postEndpoint = `/api/mcp?sessionId=${sessionId}`;
    const initialMessage = `event: endpoint\ndata: ${postEndpoint}\n\n`;

    writer.write(encoder.encode(initialMessage)).catch(() => {
      activeSessions.delete(sessionId);
    });

    const responseStream = new ReadableStream({
      start(controller) {
        request.signal.addEventListener('abort', () => {
          activeSessions.delete(sessionId);
          try {
            writer.close();
          } catch {
            // ignore
          }
        });
      },
      cancel() {
        activeSessions.delete(sessionId);
      },
    });

    return new Response(stream.readable, {
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        ...getCorsHeaders(),
      },
    });
  }

  // Plain JSON probe
  return NextResponse.json(
    {
      name: 'Balos MCP Server',
      version: '1.0.0',
      protocolVersion: '2024-11-05',
      status: 'online',
      description: 'Balos Real Estate Lead Conversion Engine MCP Server',
      toolsCount: MCP_TOOLS.length,
      endpoint: '/api/mcp',
    },
    { headers: getCorsHeaders() }
  );
}

// -----------------------------------------------------------------------------
// POST: Process MCP JSON-RPC 2.0 messages
// -----------------------------------------------------------------------------
export async function POST(request: NextRequest) {
  const url = new URL(request.url);
  const sessionId = url.searchParams.get('sessionId');

  let body: any;
  try {
    body = await request.json();
  } catch (err) {
    return NextResponse.json(
      { jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } },
      { status: 400, headers: getCorsHeaders() }
    );
  }

  // Handle batch or single RPC request
  const requests = Array.isArray(body) ? body : [body];
  const responses: any[] = [];

  for (const req of requests) {
    const res = await handleJsonRpc(req);
    if (res) responses.push(res);
  }

  const finalResult = Array.isArray(body) ? responses : responses[0];

  // If an active SSE session exists for this sessionId, also broadcast over SSE
  if (sessionId && activeSessions.has(sessionId) && finalResult) {
    const session = activeSessions.get(sessionId)!;
    try {
      const sseMsg = `event: message\ndata: ${JSON.stringify(finalResult)}\n\n`;
      session.writer.write(session.encoder.encode(sseMsg)).catch(() => {
        activeSessions.delete(sessionId);
      });
    } catch {
      activeSessions.delete(sessionId);
    }
  }

  // Also return directly in HTTP response
  if (!finalResult) {
    return new NextResponse(null, { status: 204, headers: getCorsHeaders() });
  }

  return NextResponse.json(finalResult, { headers: getCorsHeaders() });
}

// -----------------------------------------------------------------------------
// JSON-RPC 2.0 Dispatcher
// -----------------------------------------------------------------------------
async function handleJsonRpc(req: any) {
  if (!req || typeof req !== 'object') {
    return { jsonrpc: '2.0', id: null, error: { code: -32600, message: 'Invalid Request' } };
  }

  const { id, method, params } = req;

  // 1. Initial Handshake
  if (method === 'initialize') {
    return {
      jsonrpc: '2.0',
      id,
      result: {
        protocolVersion: '2024-11-05',
        capabilities: {
          tools: { listChanged: false },
        },
        serverInfo: {
          name: 'Balos Real Estate MCP Server',
          version: '1.0.0',
        },
        instructions:
          'Connected to Balos Real Estate Lead Conversion Engine. You can inspect leads, view UAE investor profiles, search property inventory, track viewings, and send WhatsApp communications.',
      },
    };
  }

  // 2. Initialized notification (no response required by JSON-RPC spec)
  if (method === 'notifications/initialized') {
    return null;
  }

  // 3. Ping
  if (method === 'ping') {
    return { jsonrpc: '2.0', id, result: {} };
  }

  // 4. Tools Listing
  if (method === 'tools/list') {
    return {
      jsonrpc: '2.0',
      id,
      result: {
        tools: MCP_TOOLS,
      },
    };
  }

  // 5. Tools Execution
  if (method === 'tools/call') {
    const toolName = params?.name || '';
    const args = params?.arguments || {};

    try {
      const toolOutput = await executeTool(toolName, args);
      return {
        jsonrpc: '2.0',
        id,
        result: {
          content: [
            {
              type: 'text',
              text: typeof toolOutput === 'string' ? toolOutput : JSON.stringify(toolOutput, null, 2),
            },
          ],
        },
      };
    } catch (err: any) {
      return {
        jsonrpc: '2.0',
        id,
        result: {
          isError: true,
          content: [
            {
              type: 'text',
              text: `Tool Execution Error: ${err?.message || String(err)}`,
            },
          ],
        },
      };
    }
  }

  // Unknown method
  return {
    jsonrpc: '2.0',
    id,
    error: {
      code: -32601,
      message: `Method '${method}' not found`,
    },
  };
}

// -----------------------------------------------------------------------------
// Tool Executors
// -----------------------------------------------------------------------------
async function executeTool(name: string, args: any) {
  // Normalize tool name (support both list_leads and mcp_list_leads)
  const cleanName = name.replace(/^mcp_/, '');

  switch (cleanName) {
    case 'list_leads': {
      let query = supabase
        .from('leads')
        .select(
          'id, full_name, e164_phone, stage, temperature, lead_score, buyer_persona, budget_aed_min, budget_aed_max, last_lead_message_at, ai_paused'
        )
        .order('last_lead_message_at', { ascending: false, nullsFirst: false })
        .limit(Math.min(args.limit || 20, 50));

      if (args.status) query = query.eq('stage', args.status);
      if (args.temperature) query = query.eq('temperature', args.temperature);

      const { data, error } = await query;
      if (error) throw new Error(error.message);
      return {
        count: data?.length || 0,
        leads: data || [],
      };
    }

    case 'get_lead': {
      const leadId = String(args.lead_id || '').trim();
      if (!leadId) throw new Error('Missing lead_id argument');

      // Find lead by UUID or phone
      const isUuid =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(leadId);

      let query = supabase.from('leads').select('*');
      if (isUuid) {
        query = query.eq('id', leadId);
      } else {
        query = query.or(`e164_phone.eq.${leadId},whatsapp_id.eq.${leadId}`);
      }

      const { data: lead, error: leadErr } = await query.maybeSingle();
      if (leadErr) throw new Error(leadErr.message);
      if (!lead) return { error: `Lead not found with identifier '${leadId}'` };

      // Fetch recent message history
      const { data: messages } = await supabase
        .from('messages')
        .select('direction, sender, content, created_at, message_type')
        .eq('lead_id', lead.id)
        .order('created_at', { ascending: true })
        .limit(15);

      return {
        lead,
        recent_messages: messages || [],
      };
    }

    case 'search_properties': {
      let query = supabase
        .from('properties')
        .select(
          'id, title, community, bedrooms, bathrooms, price_aed, category, market_type, images, video_url'
        )
        .limit(15);

      if (args.community) {
        query = query.ilike('community', `%${args.community}%`);
      }
      if (args.max_budget_aed && Number(args.max_budget_aed) > 0) {
        query = query.lte('price_aed', Number(args.max_budget_aed));
      }
      if (args.bedrooms !== undefined && args.bedrooms !== null && args.bedrooms !== -1) {
        query = query.eq('bedrooms', Number(args.bedrooms));
      }
      if (args.category) {
        query = query.eq('category', String(args.category).toUpperCase());
      }
      if (args.market_type) {
        query = query.eq('market_type', String(args.market_type).toUpperCase());
      }

      const { data, error } = await query;
      if (error) throw new Error(error.message);
      return {
        count: data?.length || 0,
        properties: data || [],
      };
    }

    case 'get_roi_summary': {
      const { data: leads, error } = await supabase
        .from('leads')
        .select('id, stage, temperature, lead_score, created_at');

      if (error) throw new Error(error.message);

      const totalLeads = leads?.length || 0;
      const hotLeads = leads?.filter((l) => l.temperature === 'HOT').length || 0;
      const qualifiedLeads = leads?.filter((l) => l.stage === 'QUALIFIED').length || 0;
      const viewingsBooked =
        leads?.filter((l) => l.stage === 'VIEWING_SCHEDULED').length || 0;
      const closedWon = leads?.filter((l) => l.stage === 'CLOSED_WON').length || 0;

      const { data: bookings } = await supabase
        .from('bookings')
        .select('id, status')
        .eq('status', 'CONFIRMED');

      return {
        total_leads: totalLeads,
        pipeline_breakdown: {
          hot_leads: hotLeads,
          qualified_leads: qualifiedLeads,
          viewings_scheduled: viewingsBooked,
          closed_won: closedWon,
        },
        active_confirmed_bookings: bookings?.length || 0,
        lead_to_viewing_conversion: totalLeads
          ? `${Math.round((viewingsBooked / totalLeads) * 100)}%`
          : '0%',
      };
    }

    case 'list_viewings': {
      let query = supabase
        .from('bookings')
        .select(
          'id, lead_id, property_id, viewing_type, scheduled_at, status, meeting_link, notes, leads(full_name, e164_phone), properties(title, community)'
        )
        .order('scheduled_at', { ascending: true })
        .limit(20);

      if (args.status) {
        query = query.eq('status', args.status);
      }

      const { data, error } = await query;
      if (error) throw new Error(error.message);
      return {
        count: data?.length || 0,
        viewings: data || [],
      };
    }

    case 'update_lead_status': {
      const leadId = args.lead_id;
      const status = args.status;
      if (!leadId || !status) throw new Error('Missing lead_id or status');

      const { data, error } = await supabase
        .from('leads')
        .update({ stage: status, updated_at: new Date().toISOString() })
        .eq('id', leadId)
        .select();

      if (error) throw new Error(error.message);
      return {
        success: true,
        updated_lead: data?.[0] || null,
      };
    }

    case 'send_whatsapp_message': {
      const leadId = args.lead_id;
      const message = String(args.message || '').trim();
      if (!leadId || !message) throw new Error('Missing lead_id or message');

      const { data: lead, error: leadErr } = await supabase
        .from('leads')
        .select('id, whatsapp_id, e164_phone')
        .eq('id', leadId)
        .single();

      if (leadErr || !lead) throw new Error('Lead not found');

      const phone = lead.e164_phone || lead.whatsapp_id;
      const cleanPhone = String(phone).replace(/\D/g, '');
      if (!cleanPhone) throw new Error('Lead has no valid phone number');

      // Call WAHA
      let wahaDelivered = false;
      try {
        const wahaRes = await fetch(`${WAHA_BASE_URL}/api/sendText`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            session: 'default',
            chatId: `${cleanPhone}@c.us`,
            text: message,
          }),
        });
        wahaDelivered = wahaRes.ok;
      } catch {
        wahaDelivered = false;
      }

      // Log in messages table
      await supabase.from('messages').insert({
        lead_id: lead.id,
        direction: 'OUTGOING',
        sender: 'AGENT',
        content: message,
        created_at: new Date().toISOString(),
      });

      return {
        success: true,
        delivered: wahaDelivered,
        lead_id: lead.id,
        phone: cleanPhone,
        message,
      };
    }

    default:
      throw new Error(`Tool '${name}' is not recognized.`);
  }
}
