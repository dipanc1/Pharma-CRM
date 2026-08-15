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
  const notes = [];

  tables.forEach(table => {
    const entry1 = backup1.tables[table] || {};
    const entry2 = backup2.tables[table] || {};
    const count1 = entry1.count || 0;
    const count2 = entry2.count || 0;
    const diff = count2 - count1;
    const diffStr = diff > 0 ? `+${diff}` : diff.toString();

    let flag = '';
    if (entry1.error || entry2.error) {
      flag = '  ❌ failed to back up';
      notes.push(`${table} failed to back up in at least one of these runs — its 0 is not a real count.`);
    } else if (count1 === 1000 || count2 === 1000) {
      flag = '  ⚠️  truncated?';
      notes.push(`${table} sits at exactly 1000 — the pre-fix row cap. The real table is probably larger.`);
    }

    console.log(
      table.padEnd(25) +
      count1.toString().padEnd(15) +
      count2.toString().padEnd(15) +
      diffStr.padEnd(12) +
      flag
    );
  });

  if (notes.length > 0) {
    console.log('\n⚠️  Counts you should not trust:');
    notes.forEach(note => console.log(`   - ${note}`));
  }

  const resolveDump = (live) => {
    if (!live?.file && !live?.path) return null;
    return path.join(BACKUP_DIR, path.basename(live.file || live.path));
  };

  const dump1 = resolveDump(backup1.schema?.live);
  const dump2 = resolveDump(backup2.schema?.live);

  console.log('\n📋 Schema Comparison:');

  if (!dump1 || !dump2) {
    console.log('   Skipped — at least one of these backups has no live schema dump.');
    console.log('   (Backups taken before DATABASE_URL was configured only stored the');
    console.log('    combined migrations, which cannot show drift from the real database.)');
  } else if (!fs.existsSync(dump1) || !fs.existsSync(dump2)) {
    console.log('   Skipped — a referenced dump file has since been deleted:');
    if (!fs.existsSync(dump1)) console.log(`     missing ${path.basename(dump1)}`);
    if (!fs.existsSync(dump2)) console.log(`     missing ${path.basename(dump2)}`);
  } else {
    const lines1 = fs.readFileSync(dump1, 'utf8').split('\n');
    const lines2 = fs.readFileSync(dump2, 'utf8').split('\n');

    const set1 = new Set(lines1.map(l => l.trimEnd()));
    const set2 = new Set(lines2.map(l => l.trimEnd()));

    const removed = [...set1].filter(l => l.trim() && !set2.has(l));
    const added = [...set2].filter(l => l.trim() && !set1.has(l));

    if (!removed.length && !added.length) {
      console.log('   No schema changes between these two backups.');
    } else {
      if (removed.length) {
        console.log(`\n   ➖ Gone since backup 1 (${removed.length}):`);
        removed.forEach(l => console.log(`     ${l.trim()}`));
      }
      if (added.length) {
        console.log(`\n   ➕ New in backup 2 (${added.length}):`);
        added.forEach(l => console.log(`     ${l.trim()}`));
      }
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