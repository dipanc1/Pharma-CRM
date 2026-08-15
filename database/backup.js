const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const { dumpLiveSchema } = require('./schema-dump');
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

const PAGE_SIZE = 1000;

async function backupTable(tableName) {
  console.log(`📦 Backing up ${tableName}...`);

  try {
    const { count: expected, error: countError } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true });

    if (countError) throw countError;

    const rows = [];

    for (let from = 0; ; from += PAGE_SIZE) {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .range(from, from + PAGE_SIZE - 1);

      if (error) throw error;

      rows.push(...data);

      if (data.length < PAGE_SIZE) break;
    }

    if (typeof expected === 'number' && rows.length !== expected) {
      throw new Error(`expected ${expected} rows, read ${rows.length}`);
    }

    return {
      table: tableName,
      count: rows.length,
      data: rows
    };
  } catch (error) {
    console.error(`❌ Error backing up ${tableName}:`, error.message);
    return { table: tableName, count: 0, data: [], error: error.message };
  }
}

async function backupSchema() {
  console.log('\n📋 Backing up database schema...');

  const migrationsFile = await exportSchemaSQL();

  const result = {
    type: 'sql',
    migrations_combined: migrationsFile
      ? { exported: true, file: path.basename(migrationsFile), path: migrationsFile }
      : { exported: false, file: null, path: null, note: 'No migrations directory found.' },
    live: { exported: false, file: null, path: null, note: null }
  };

  try {
    const dump = await dumpLiveSchema();
    result.live = { exported: true, file: dump.file, path: dump.path, note: null };
    console.log(`✅ Live schema read from Postgres: ${dump.file}`);
  } catch (error) {
    result.live.note = error.code === 'NO_DATABASE_URL'
      ? 'Skipped: DATABASE_URL is not set in .env, so the live schema could not be read.'
      : `Skipped: ${error.message}`;
    console.warn(`⚠️  Live schema not captured. ${result.live.note}`);
  }

  return result;
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
  const failedTables = [];

  for (const table of BACKUP_TABLES) {
    const result = await backupTable(table);
    backup.tables[table] = result;

    if (result.error) {
      failedTables.push(table);
      console.log(`   ❌ ${table}: FAILED — ${result.error}`);
    } else {
      console.log(`   ✅ ${table}: ${result.count} records`);
    }
  }

  backup.complete = failedTables.length === 0;
  backup.failedTables = failedTables;

  // Backup schema information
  if (includeSchema) {
    backup.schema = await backupSchema();
    console.log('   ✅ Schema information captured');
    backup.migrations = await backupMigrations();
  }

  // Save backup file
  fs.writeFileSync(backupFile, JSON.stringify(backup, null, 2));

  // Calculate total records
  const totalRecords = Object.values(backup.tables)
    .reduce((sum, table) => sum + table.count, 0);

  if (backup.complete) {
    console.log(`\n✅ Backup completed successfully!`);
  } else {
    console.log(`\n⚠️  BACKUP IS INCOMPLETE — do not rely on it.`);
    console.log(`   These tables were NOT captured: ${failedTables.join(', ')}`);
    console.log(`   Restoring from this file would delete those tables' rows and put nothing back.`);
  }

  console.log(`📁 Backup saved to: ${backupFile}`);
  console.log(`📊 Total records backed up: ${totalRecords}`);

  if (includeSchema) {
    const migrationCount = Object.keys(backup.migrations || {}).length;
    console.log(`📜 Migration files backed up: ${migrationCount}`);
  }

  if (backup.complete) {
    cleanOldBackups();
  } else {
    console.log(`\n🛑 Old backups left untouched — the last good one is still your fallback.`);
  }

  return { file: backupFile, complete: backup.complete, failedTables };
}

async function exportSchemaSQL() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const schemaFile = path.join(BACKUP_DIR, `migrations_combined_${timestamp}.sql`);

  console.log('\n📋 Combining migration files into a rebuild script...');

  // Read all migration files and combine them
  const migrationsDir = path.join(__dirname, 'migrations');
  let fullSchema = `-- Combined migrations — a rebuild script, NOT a live schema dump.
-- Generated: ${new Date().toISOString()}
-- DS Medical Agencies CRM
--
-- This is every file in database/migrations concatenated in order. It shows
-- what the schema SHOULD be. To see what the database actually contains,
-- run: npm run schema:dump  (produces live_schema_*.sql)

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
    console.log(`✅ Rebuild script written to: ${schemaFile}`);
    return schemaFile;
  } else {
    console.log('❌ No migrations directory found');
    return null;
  }
}

function pruneByName(prefix, extension, keep, label) {
  const files = fs.readdirSync(BACKUP_DIR)
    .filter(f => f.startsWith(prefix) && f.endsWith(extension))
    .sort()
    .reverse();

  if (files.length <= keep) return;

  console.log(`\n🧹 Cleaning old ${label} (keeping last ${keep})...`);
  files.slice(keep).forEach(name => {
    fs.unlinkSync(path.join(BACKUP_DIR, name));
    console.log(`   🗑️  Deleted: ${name}`);
  });
}

function cleanOldBackups() {
  pruneByName('backup_', '.json', 10, 'data backups');
  pruneByName('migrations_combined_', '.sql', 5, 'rebuild scripts');
  pruneByName('live_schema_', '.sql', 5, 'live schema dumps');
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
      .then(result => process.exit(result.complete ? 0 : 1))
      .catch(error => {
        console.error('❌ Backup failed:', error);
        process.exit(1);
      });
  }
}

module.exports = { performBackup, backupTable, exportSchemaSQL };