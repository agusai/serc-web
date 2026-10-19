import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.SUPABASE_PUBLIC_URL || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_ANON || '';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_ANON_KEY. Set them in environment or in a .env file.');
  console.error('Example .env:\n  SUPABASE_URL=https://mtopqypcrmzihmfueujy.supabase.co\n  SUPABASE_ANON_KEY=public:eyJ...');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false }
});

const tables = [
  'users',
  'user_links',
  'players',
  'player_profile',
  'player_guardians',
  'player_stats',
  'player_metrics',
  'matches',
  'match_details',
  'match_stats',
  'trainings',
  'training_details',
  'fees',
  'events',
  'announcements'
];

async function exportTable(table) {
  try {
    console.log(`Fetching ${table}...`);
    const { data, error, status } = await supabase.from(table).select('*');
    if (error) {
      console.error(`Error fetching ${table}:`, error.message || JSON.stringify(error));
      return;
    }
    const dir = path.resolve('data');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);
    fs.writeFileSync(path.join(dir, `${table}.json`), JSON.stringify(data ?? [], null, 2));
    console.log(`Saved data/${table}.json (${(data || []).length} rows)`);
  } catch (err) {
    console.error(`Unexpected error exporting ${table}:`, err.message || err);
  }
}

(async function main() {
  console.log('Supabase export started');
  for (const t of tables) {
    await exportTable(t);
  }
  console.log('Supabase export finished. Check the data/ directory.');
})();
