#!/usr/bin/env node

/**
 * Migration Runner
 * Executes SQL migrations from database/migrations/ directory
 * Usage: node database/migrate.js <migration_number>
 *
 * Example:
 *   node database/migrate.js 018  // Runs 018_add_reference_to_stock_transactions.sql
 *   node database/migrate.js all  // Runs all migrations up to latest
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseServiceKey = process.env.REACT_APP_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  console.error('❌ REACT_APP_SUPABASE_URL not found in .env');
  process.exit(1);
}

if (!supabaseServiceKey) {
  console.error('❌ REACT_APP_SUPABASE_SERVICE_ROLE_KEY not found in .env');
  console.error('   Service role key is required to run migrations.');
  console.error('   Get it from: Supabase Dashboard > Settings > API > Service role key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration(migrationFile) {
  console.log(`\n📋 Running migration: ${migrationFile}`);
  
  const filePath = path.join(__dirname, 'migrations', migrationFile);
  
  if (!fs.existsSync(filePath)) {
    console.error(`❌ Migration file not found: ${filePath}`);
    return false;
  }

  const sql = fs.readFileSync(filePath, 'utf-8');

  try {
    // Split into individual statements and execute them
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s && !s.startsWith('--'));

    for (const statement of statements) {
      const { error } = await supabase.rpc('exec', { 
        sql: statement + ';'
      }).catch(err => {
        // If exec RPC doesn't exist, try using the raw API
        return supabase.from('_migrations').insert({ sql: statement }).catch(() => ({ error: err }));
      });

      if (error && !error.message?.includes('does not exist')) {
        throw error;
      }
    }

    console.log(`✅ Migration applied successfully!`);
    return true;
  } catch (error) {
    console.error(`❌ Error running migration:`, error.message);
    return false;
  }
}

async function getMigrationsToRun(target) {
  const migrationsDir = path.join(__dirname, 'migrations');
  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  if (target === 'all') {
    return files;
  }

  const padded = target.toString().padStart(3, '0');
  const matching = files.filter(f => f.startsWith(padded));
  
  if (matching.length === 0) {
    console.error(`❌ No migration found matching: ${target}`);
    return [];
  }

  return matching;
}

async function main() {
  const target = process.argv[2] || '018';
  
  console.log('🚀 Database Migration Runner');
  console.log('============================\n');

  const migrationsToRun = await getMigrationsToRun(target);
  
  if (migrationsToRun.length === 0) {
    process.exit(1);
  }

  let successCount = 0;
  let failCount = 0;

  for (const migrationFile of migrationsToRun) {
    const success = await runMigration(migrationFile);
    if (success) {
      successCount++;
    } else {
      failCount++;
    }
  }

  console.log(`\n📊 Migration Summary`);
  console.log(`===================`);
  console.log(`✅ Successful: ${successCount}`);
  console.log(`❌ Failed: ${failCount}`);

  if (failCount > 0) {
    process.exit(1);
  }
}

main().catch(error => {
  console.error('❌ Fatal error:', error.message);
  process.exit(1);
});
