const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
require('dotenv').config();

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.REACT_APP_SUPABASE_SERVICE_ROLE_KEY;

const RESTORE_TABLES = [
  'companies',
  'doctors',
  'products',
  'visits',
  'sales',
  'stock_transactions',
  'cash_flow',
  'ledger_entries',
  'cycle_plans',
  'kol_notes',
  'doctor_important_dates',
  'profiles'
];

const BACKUP_DIR = path.join(__dirname, 'backups');

function createSupabaseClient() {
  if (!SUPABASE_URL) {
    throw new Error('REACT_APP_SUPABASE_URL not found in .env');
  }

  const key = SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY;

  if (!key) {
    throw new Error('Missing Supabase key. Set REACT_APP_SUPABASE_SERVICE_ROLE_KEY for complete restores or REACT_APP_SUPABASE_ANON_KEY for limited restores.');
  }

  if (!SUPABASE_SERVICE_ROLE_KEY) {
    console.warn('⚠️  REACT_APP_SUPABASE_SERVICE_ROLE_KEY is not set. Restore may miss RLS-protected tables.');
  }

  return createClient(SUPABASE_URL, key);
}

const supabase = createSupabaseClient();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

function listBackups() {
  if (!fs.existsSync(BACKUP_DIR)) {
    console.log('❌ No backups directory found');
    return [];
  }

  const files = fs.readdirSync(BACKUP_DIR)
    .filter(f => f.startsWith('backup_') && f.endsWith('.json'))
    .map(f => ({
      name: f,
      path: path.join(BACKUP_DIR, f),
      time: fs.statSync(path.join(BACKUP_DIR, f)).mtime
    }))
    .sort((a, b) => b.time - a.time);

  return files;
}

async function restoreTable(tableName, data) {
  console.log(`   📥 Restoring ${tableName} (${data.length} records)...`);

  try {
    // Delete existing data
    const { error: deleteError } = await supabase
      .from(tableName)
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (deleteError) {
      console.log(`   ⚠️  Could not clear ${tableName}: ${deleteError.message}`);
    }

    // Insert backup data in batches of 100
    const batchSize = 100;
    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
      const { error: insertError } = await supabase
        .from(tableName)
        .insert(batch);

      if (insertError) {
        console.error(`   ❌ Error inserting batch ${i / batchSize + 1}:`, insertError.message);
      }
    }

    console.log(`   ✅ ${tableName} restored successfully`);
    return { success: true, count: data.length };
  } catch (error) {
    console.error(`   ❌ Error restoring ${tableName}:`, error.message);
    return { success: false, error: error.message };
  }
}

async function performRestore(backupFile) {
  console.log(`\n🔄 Restoring from: ${path.basename(backupFile)}\n`);

  // Read backup file
  const backup = JSON.parse(fs.readFileSync(backupFile, 'utf8'));

  console.log(`📅 Backup created: ${new Date(backup.timestamp).toLocaleString()}`);
  console.log(`📦 Backup version: ${backup.version}\n`);

  // Confirm restoration
  const confirm = await question('⚠️  This will DELETE all current data and restore from backup. Continue? (yes/no): ');
  
  if (confirm.toLowerCase() !== 'yes') {
    console.log('❌ Restore cancelled');
    return;
  }

  console.log('\n🚀 Starting restoration...\n');

  // Restore tables in dependency-safe order, then any future tables not in the core list.
  const backupTableNames = Object.keys(backup.tables || {});
  const restoreOrder = [
    ...RESTORE_TABLES.filter(tableName => backupTableNames.includes(tableName)),
    ...backupTableNames.filter(tableName => !RESTORE_TABLES.includes(tableName))
  ];

  for (const tableName of restoreOrder) {
    if (backup.tables[tableName] && backup.tables[tableName].data) {
      await restoreTable(tableName, backup.tables[tableName].data);
    }
  }

  console.log('\n✅ Restoration completed!');
}

async function main() {
  console.log('🔧 DS Medical Agencies Database Restore Utility\n');

  const backups = listBackups();

  if (backups.length === 0) {
    console.log('❌ No backup files found');
    rl.close();
    return;
  }

  console.log('📁 Available backups:\n');
  backups.forEach((backup, index) => {
    console.log(`${index + 1}. ${backup.name}`);
    console.log(`   Created: ${backup.time.toLocaleString()}\n`);
  });

  const selection = await question('Select backup number to restore (or 0 to cancel): ');
  const index = parseInt(selection) - 1;

  if (index < 0 || index >= backups.length) {
    console.log('❌ Invalid selection');
    rl.close();
    return;
  }

  await performRestore(backups[index].path);
  rl.close();
}

// Run restore if called directly
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('❌ Restore failed:', error);
      rl.close();
      process.exit(1);
    });
}

module.exports = { performRestore, restoreTable };