const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const [key, ...rest] = trimmed.split("=");
    if (!process.env[key]) process.env[key] = rest.join("=").replace(/^["']|["']$/g, "");
  }
}

// Load env credentials from local workspace directory
loadEnvFile(path.join(__dirname, '.env.local'));

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Error: Supabase config missing from .env.local!");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function clean() {
  console.log('--- Cleaning Up Test Data for Production Go-Live ---');
  
  console.log('Logging in to authenticate...');
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'djpxndattt@gmail.com',
    password: 'Ojkiydbank0.2'
  });

  if (authError) {
    console.error('Login failed:', authError.message);
    process.exit(1);
  }

  const token = authData.session.access_token;
  const client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } }
  });

  console.log('Authenticated successfully. Starting transaction cleanup...\n');

  try {
    // 1. Warranty Claims
    console.log('Cleaning warranty claims...');
    await client.from('warranty_claim_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await client.from('warranty_claims').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await client.from('warranty_cards').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    // 2. Payments & Invoice Items
    console.log('Cleaning payments and invoice items...');
    await client.from('payments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await client.from('invoice_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await client.from('invoices').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    // 3. Stock Movements & POS Orders
    console.log('Cleaning stock movements and POS orders...');
    await client.from('stock_movements').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await client.from('pos_order_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await client.from('pos_orders').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await client.from('pos_sessions').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    // 4. Quotations
    console.log('Cleaning quotations...');
    await client.from('quotation_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await client.from('quotations').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    // 5. Repair Orders & Logs
    console.log('Cleaning repair logs, assignments, checklists...');
    await client.from('repair_labor_logs').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await client.from('repair_assignments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await client.from('repair_checklist_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await client.from('repair_checklists').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await client.from('repair_order_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await client.from('repair_orders').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    // 6. Bookings & Slots
    console.log('Cleaning bookings...');
    await client.from('bookings').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    // 7. Vehicles & Customers
    console.log('Cleaning vehicles and customers...');
    await client.from('vehicle_health_records').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await client.from('vehicle_ownership_history').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await client.from('vehicles').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    
    await client.from('customer_timeline').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await client.from('customers').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    console.log('\n✅ Database transaction tables successfully cleaned and ready for Go-Live!');
  } catch (err) {
    console.error('Cleanup failure:', err.message);
  }
}

clean();
