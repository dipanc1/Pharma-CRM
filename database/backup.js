const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.REACT_APP_SUPABASE_SERVICE_ROLE_KEY;

const BACKUP_TABLES = [
  'doctors',
  'visits',
  'products',
  'sales',
  'stock_transactions',
  'cash_flow',
  'ledger_entries',
  'cycle_plans',
  'kol_notes',
  'companies',
  'profiles',
  'doctor_important_dates'
];

const BACKUP_DIR = path.join(__dirname, 'backups');

function createSupabaseClient() {
  if (!SUPABASE_URL) {
    throw new Error('REACT_APP_SUPABASE_URL not found in .env');
  }

  const key = SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY;

  if (!key) {
    throw new Error('Missing Supabase key. Set REACT_APP_SUPABASE_SERVICE_ROLE_KEY for complete backups or REACT_APP_SUPABASE_ANON_KEY for limited backups.');
  }

  if (!SUPABASE_SERVICE_ROLE_KEY) {
    console.warn('⚠️  REACT_APP_SUPABASE_SERVICE_ROLE_KEY is not set. Backup may miss RLS-protected tables.');
  }

  return createClient(SUPABASE_URL, key);
}

const supabase = createSupabaseClient();

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

async function backupSchema() {
  console.log('\n📋 Backing up database schema...');

  const schemaFile = await exportSchemaSQL();

  if (!schemaFile) {
    return {
      type: 'sql',
      exported: false,
      file: null,
      path: null,
      note: 'Schema export skipped because no migrations directory was found.'
    };
  }

  return {
    type: 'sql',
    exported: true,
    file: path.basename(schemaFile),
    path: schemaFile,
    note: 'Schema exported from local migration files.'
  };
}

async function backupMigrations() {
  console.log('\n📜 Backing up migration files...');
  
  const migrationsDir = path.join(__dirname, 'migrations');
  const migrations = {};

  if (fs.existsSync(migrationsDir)) {
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    files.forEach(file => {
      const content = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      migrations[file] = content;
      console.log(`   ✅ ${file}`);
    });
  } else {
    console.log('   ⚠️  No migrations directory found');
  }

  return migrations;
}

async function performBackup(options = {}) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFile = path.join(BACKUP_DIR, `backup_${timestamp}.json`);
  const includeSchema = options.includeSchema !== false; // Default true

  console.log('🚀 Starting database backup...\n');
  console.log(`   Schema backup: ${includeSchema ? 'Enabled' : 'Disabled'}\n`);

  const backup = {
    timestamp: new Date().toISOString(),
    version: '2.1',
    type: includeSchema ? 'full' : 'data-only',
    tables: {},
    schema: null,
    migrations: null
  };

  // Backup table data
  console.log('📊 Backing up table data...');
  for (const table of BACKUP_TABLES) {
    const result = await backupTable(table);
    backup.tables[table] = result;
    console.log(`   ✅ ${table}: ${result.count} records`);
  }

  // Backup schema information
  if (includeSchema) {
    backup.schema = await backupSchema();
    console.log('   ✅ Schema information captured');
    backup.migrations = await backupMigrations();
  }

  // Save backup file
  fs.writeFileSync(backupFile, JSON.stringify(backup, null, 2));

  console.log(`\n✅ Backup completed successfully!`);
  console.log(`📁 Backup saved to: ${backupFile}`);

  // Calculate total records
  const totalRecords = Object.values(backup.tables)
    .reduce((sum, table) => sum + table.count, 0);
  console.log(`📊 Total records backed up: ${totalRecords}`);

  if (includeSchema) {
    const migrationCount = Object.keys(backup.migrations || {}).length;
    console.log(`📜 Migration files backed up: ${migrationCount}`);
  }

  // Clean old backups (keep last 10)
  cleanOldBackups();

  return backupFile;
}

async function exportSchemaSQL() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const schemaFile = path.join(BACKUP_DIR, `schema_${timestamp}.sql`);

  console.log('\n📋 Exporting complete schema as SQL...');

  // Read all migration files and combine them
  const migrationsDir = path.join(__dirname, 'migrations');
  let fullSchema = `-- Database Schema Export
-- Generated: ${new Date().toISOString()}
-- DS Medical Agencies CRM Complete Schema

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

`;

  if (fs.existsSync(migrationsDir)) {
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    for (const file of files) {
      const content = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      fullSchema += `\n-- From: ${file}\n`;
      fullSchema += content;
      fullSchema += '\n\n';
    }

    fs.writeFileSync(schemaFile, fullSchema);
    console.log(`✅ Schema SQL exported to: ${schemaFile}`);
    return schemaFile;
  } else {
    console.log('❌ No migrations directory found');
    return null;
  }
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

  // Also clean old schema exports (keep last 5)
  const schemaFiles = fs.readdirSync(BACKUP_DIR)
    .filter(f => f.startsWith('schema_') && f.endsWith('.sql'))
    .map(f => ({
      name: f,
      path: path.join(BACKUP_DIR, f),
      time: fs.statSync(path.join(BACKUP_DIR, f)).mtime.getTime()
    }))
    .sort((a, b) => b.time - a.time);

  if (schemaFiles.length > 5) {
    console.log(`🧹 Cleaning old schema exports (keeping last 5)...`);
    schemaFiles.slice(5).forEach(file => {
      fs.unlinkSync(file.path);
      console.log(`   🗑️  Deleted: ${file.name}`);
    });
  }
}

// Run backup if called directly
if (require.main === module) {
  const args = process.argv.slice(2);
  const schemaOnly = args.includes('--schema-only');
  const noSchema = args.includes('--no-schema');

  if (schemaOnly) {
    exportSchemaSQL()
      .then(() => process.exit(0))
      .catch(error => {
        console.error('❌ Schema export failed:', error);
        process.exit(1);
      });
  } else {
    performBackup({ includeSchema: !noSchema })
      .then(() => process.exit(0))
      .catch(error => {
        console.error('❌ Backup failed:', error);
        process.exit(1);
      });
  }
}

module.exports = { performBackup, backupTable, exportSchemaSQL };