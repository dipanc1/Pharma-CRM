const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

const BACKUP_DIR = path.join(__dirname, 'backups');

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

async function backupTable(tableName) {
  console.log(`📦 Backing up ${tableName}...`);
  
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*');

    if (error) throw error;

    return {
      table: tableName,
      count: data.length,
      data: data
    };
  } catch (error) {
    console.error(`❌ Error backing up ${tableName}:`, error.message);
    return { table: tableName, count: 0, data: [], error: error.message };
  }
}

async function performBackup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFile = path.join(BACKUP_DIR, `backup_${timestamp}.json`);

  console.log('🚀 Starting database backup...\n');

  const tables = [
    'doctors',
    'visits',
    'products',
    'sales',
    'stock_transactions'
  ];

  const backup = {
    timestamp: new Date().toISOString(),
    version: '1.0',
    tables: {}
  };

  for (const table of tables) {
    const result = await backupTable(table);
    backup.tables[table] = result;
    console.log(`   ✅ ${table}: ${result.count} records`);
  }

  // Save backup file
  fs.writeFileSync(backupFile, JSON.stringify(backup, null, 2));

  console.log(`\n✅ Backup completed successfully!`);
  console.log(`📁 Backup saved to: ${backupFile}`);

  // Calculate total records
  const totalRecords = Object.values(backup.tables)
    .reduce((sum, table) => sum + table.count, 0);
  console.log(`📊 Total records backed up: ${totalRecords}`);

  // Clean old backups (keep last 10)
  cleanOldBackups();

  return backupFile;
}

function cleanOldBackups() {
  const files = fs.readdirSync(BACKUP_DIR)
    .filter(f => f.startsWith('backup_') && f.endsWith('.json'))
    .map(f => ({
      name: f,
      path: path.join(BACKUP_DIR, f),
      time: fs.statSync(path.join(BACKUP_DIR, f)).mtime.getTime()
    }))
    .sort((a, b) => b.time - a.time);

  // Keep only the 10 most recent backups
  if (files.length > 10) {
    console.log(`\n🧹 Cleaning old backups (keeping last 10)...`);
    files.slice(10).forEach(file => {
      fs.unlinkSync(file.path);
      console.log(`   🗑️  Deleted: ${file.name}`);
    });
  }
}

// Run backup if called directly
if (require.main === module) {
  performBackup()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('❌ Backup failed:', error);
      process.exit(1);
    });
}

module.exports = { performBackup, backupTable };