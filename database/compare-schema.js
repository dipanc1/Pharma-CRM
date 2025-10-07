const fs = require('fs');
const path = require('path');

function compareBackups(backup1Path, backup2Path) {
  console.log('🔍 Comparing Database Backups\n');

  const backup1 = JSON.parse(fs.readFileSync(backup1Path, 'utf8'));
  const backup2 = JSON.parse(fs.readFileSync(backup2Path, 'utf8'));

  console.log(`Backup 1: ${path.basename(backup1Path)}`);
  console.log(`  Created: ${new Date(backup1.timestamp).toLocaleString()}`);
  console.log(`Backup 2: ${path.basename(backup2Path)}`);
  console.log(`  Created: ${new Date(backup2.timestamp).toLocaleString()}\n`);

  // Compare record counts
  console.log('📊 Record Count Comparison:\n');
  console.log('Table'.padEnd(25) + 'Backup 1'.padEnd(15) + 'Backup 2'.padEnd(15) + 'Difference');
  console.log('-'.repeat(70));

  const tables = Object.keys(backup1.tables);
  tables.forEach(table => {
    const count1 = backup1.tables[table]?.count || 0;
    const count2 = backup2.tables[table]?.count || 0;
    const diff = count2 - count1;
    const diffStr = diff > 0 ? `+${diff}` : diff.toString();
    
    console.log(
      table.padEnd(25) + 
      count1.toString().padEnd(15) + 
      count2.toString().padEnd(15) + 
      diffStr
    );
  });

  // Compare schema if available
  if (backup1.schema && backup2.schema) {
    console.log('\n📋 Schema Comparison:');
    
    if (backup1.schema.type === 'fallback' && backup2.schema.type === 'fallback') {
      const schema1 = backup1.schema.schema;
      const schema2 = backup2.schema.schema;

      tables.forEach(table => {
        const cols1 = schema1[table]?.columns || [];
        const cols2 = schema2[table]?.columns || [];
        
        const added = cols2.filter(c => !cols1.includes(c));
        const removed = cols1.filter(c => !cols2.includes(c));

        if (added.length > 0 || removed.length > 0) {
          console.log(`\n  ${table}:`);
          if (added.length > 0) console.log(`    ➕ Added columns: ${added.join(', ')}`);
          if (removed.length > 0) console.log(`    ➖ Removed columns: ${removed.length}  `);
        }
      });
    }
  }

  console.log('\n✅ Comparison complete\n');
}

// CLI usage
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log('Usage: node compare-schema.js <backup1> <backup2>');
    console.log('Example: node compare-schema.js backup_2025-01-07.json backup_2025-01-08.json');
    process.exit(1);
  }

  const backup1 = path.join(__dirname, 'backups', args[0]);
  const backup2 = path.join(__dirname, 'backups', args[1]);

  if (!fs.existsSync(backup1) || !fs.existsSync(backup2)) {
    console.log('❌ One or both backup files not found');
    process.exit(1);
  }

  compareBackups(backup1, backup2);
}

module.exports = { compareBackups };