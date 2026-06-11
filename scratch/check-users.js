const { createClient } = require('c:/Users/akash/OneDrive/Documents/catacloud/node_modules/@supabase/supabase-js');
const fs = require('fs');

const envPath = 'c:/Users/akash/OneDrive/Documents/catacloud/.env.local';
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    env[parts[0].trim()] = parts.slice(1).join('=').trim();
  }
});

let supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
if (supabaseUrl.includes('/rest/v1')) {
  supabaseUrl = supabaseUrl.split('/rest/v1')[0];
}
if (supabaseUrl.endsWith('/')) {
  supabaseUrl = supabaseUrl.slice(0, -1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  try {
    const { data, error } = await supabase.from('users').select('*').limit(5);
    if (error) throw error;
    console.log('Users in database:', JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error fetching users:', err.message || err);
  }
}

run();
