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

async function restoreTable(tableName, entry) {
  const data = entry.data || [];

  // The table failed to back up, so its rows were recorded as an empty array.
  // Wiping the live table and inserting that would destroy the only remaining
  // copy of the data. Skip it and leave the live rows alone.
  if (entry.error) {
    console.log(`   ⏭️  SKIPPED ${tableName} — it failed to back up (${entry.error}).`);
    console.log(`      Live rows left untouched; restoring 0 rows over them would lose them.`);
    return { success: false, skipped: true, count: 0 };
  }

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
    let inserted = 0;
    const failedBatches = [];

    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
      const { error: insertError } = await supabase
        .from(tableName)
        .insert(batch);

      if (insertError) {
        failedBatches.push(insertError.message);
        console.error(`   ❌ Error inserting batch ${i / batchSize + 1}:`, insertError.message);
      } else {
        inserted += batch.length;
      }
    }

    // The rows are already deleted at this point, so a failed insert is a real
    // loss and has to be reported as one rather than as a successful restore.
    if (failedBatches.length > 0) {
      console.error(`   ❌ ${tableName}: ${inserted} of ${data.length} rows restored — ${data.length - inserted} LOST.`);
      return { success: false, count: inserted, expected: data.length };
    }

    console.log(`   ✅ ${tableName} restored successfully (${inserted} rows)`);
    return { success: true, count: inserted, expected: data.length };
  } catch (error) {
    console.error(`   ❌ Error restoring ${tableName}:`, error.message);
    return { success: false, error: error.message, count: 0, expected: data.length };
  }
}

async function performRestore(backupFile) {
  console.log(`\n🔄 Restoring from: ${path.basename(backupFile)}\n`);

  // Read backup file
  const backup = JSON.parse(fs.readFileSync(backupFile, 'utf8'));

  console.log(`📅 Backup created: ${new Date(backup.timestamp).toLocaleString()}`);
  console.log(`📦 Backup version: ${backup.version}\n`);

  console.log('📊 Rows in this backup:');
  for (const [tableName, entry] of Object.entries(backup.tables || {})) {
    const flag = entry.error ? `  ❌ FAILED TO BACK UP: ${entry.error}`
      : entry.count === 1000 ? '  ⚠️  exactly 1000 — likely truncated by the old backup script'
        : '';
    console.log(`   ${tableName.padEnd(24)} ${String(entry.count).padStart(6)}${flag}`);
  }

  // Backups taken before the pagination fix stop at 1000 rows per table with no
  // error, so restoring one deletes every row past that point.
  const suspect = Object.entries(backup.tables || {}).filter(([, e]) => e.count === 1000);
  const failed = Object.entries(backup.tables || {}).filter(([, e]) => e.error);

  if (backup.complete === false || failed.length > 0) {
    console.log(`\n🛑 This backup is marked INCOMPLETE. Tables that failed will be SKIPPED,`);
    console.log(`   not wiped — but everything else will still be replaced.`);
  }

  if (suspect.length > 0) {
    console.log(`\n🛑 ${suspect.map(([t]) => t).join(', ')} sit at exactly 1000 rows.`);
    console.log(`   That is the old script's truncation limit. If this backup predates the`);
    console.log(`   fix, restoring it will PERMANENTLY DELETE every row past 1000.`);
  }

  // Confirm restoration
  const confirm = await question('\n⚠️  This will DELETE all current data and restore from backup. Continue? (yes/no): ');

  if (confirm.toLowerCase() !== 'yes') {
    console.log('❌ Restore cancelled');
    return;
  }

  if (backup.complete === false || suspect.length > 0) {
    const second = await question('   Type RESTORE ANYWAY to confirm you accept the data loss above: ');
    if (second.trim() !== 'RESTORE ANYWAY') {
      console.log('❌ Restore cancelled');
      return;
    }
  }

  console.log('\n🚀 Starting restoration...\n');

  // Restore tables in dependency-safe order, then any future tables not in the core list.
  const backupTableNames = Object.keys(backup.tables || {});
  const restoreOrder = [
    ...RESTORE_TABLES.filter(tableName => backupTableNames.includes(tableName)),
    ...backupTableNames.filter(tableName => !RESTORE_TABLES.includes(tableName))
  ];

  const results = {};

  for (const tableName of restoreOrder) {
    if (backup.tables[tableName] && backup.tables[tableName].data) {
      results[tableName] = await restoreTable(tableName, backup.tables[tableName]);
    }
  }

  const problems = Object.entries(results).filter(([, r]) => !r.success);

  if (problems.length === 0) {
    console.log('\n✅ Restoration completed!');
  } else {
    console.log('\n⚠️  Restoration finished with problems:');
    problems.forEach(([tableName, r]) => {
      console.log(r.skipped
        ? `   ⏭️  ${tableName}: skipped, live data left as-is`
        : `   ❌ ${tableName}: ${r.count} of ${r.expected} rows restored`);
    });
  }
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