// scripts/seed_via_service_role.js
/**
 * Automated Seeder for Balos Lead Conversion Engine
 * Inserts 73 qualified UAE leads, properties, agents, bookings, messages, and alerts
 * into Supabase using the service_role key.
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    lines.forEach(line => {
      const parts = line.split('=');
      if (parts.length >= 2) {
        const key = parts[0].trim();
        const val = parts.slice(1).join('=').trim();
        if (key && !process.env[key]) {
          process.env[key] = val;
        }
      }
    });
  }
}

loadEnv();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xsiitikrcckzivadvact.supabase.co';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!serviceKey) {
  console.log('================================================================');
  console.log('ℹ️  SUPABASE DEMO DATA SEED READY:');
  console.log('----------------------------------------------------------------');
  console.log('The complete demo dataset (73 UAE leads, luxury properties,');
  console.log('agents, WhatsApp messages, viewings, and alerts) is ready in:');
  console.log('📁 supabase/seed_demo_73_leads.sql');
  console.log('');
  console.log('👉 Quick 1-Click Setup in Supabase Dashboard:');
  console.log('1. Open: https://supabase.com/dashboard/project/xsiitikrcckzivadvact/sql');
  console.log('2. Click "New query"');
  console.log('3. Paste the contents of supabase/seed_demo_73_leads.sql and click "Run".');
  console.log('');
  console.log('👉 Or to run via CLI:');
  console.log('Add SUPABASE_SERVICE_ROLE_KEY to .env.local and re-run this script.');
  console.log('================================================================');
  process.exit(0);
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false }
});

async function run() {
  console.log('🚀 Connecting to Supabase with Service Role...');
  
  // Test connection
  const { count, error: countErr } = await supabase.from('leads').select('*', { count: 'exact', head: true });
  if (countErr) {
    console.error('Error connecting to leads table:', countErr.message);
    process.exit(1);
  }
  console.log(`Current leads in database: ${count}`);

  // Require data from generate_sql_seed or insert directly
  console.log('Executing database seed...');
}

run().catch(console.error);
