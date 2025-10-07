const fs = require('fs');
const path = require('path');
const readline = require('readline');

const BACKUP_DIR = path.join(__dirname, 'backups');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

function listSchemaBackups() {
  if (!fs.existsSync(BACKUP_DIR)) {
    console.log('❌ No backups directory found');
    return [];
  }

  const files = fs.readdirSync(BACKUP_DIR)
    .filter(f => f.startsWith('schema_') && f.endsWith('.sql'))
    .map(f => ({
      name: f,
      path: path.join(BACKUP_DIR, f),
      time: fs.statSync(path.join(BACKUP_DIR, f)).mtime
    }))
    .sort((a, b) => b.time - a.time);

  return files;
}

async function displaySchema(schemaFile) {
  console.log(`\n📋 Schema from: ${path.basename(schemaFile)}\n`);
  console.log('='.repeat(80));

  const content = fs.readFileSync(schemaFile, 'utf8');
  console.log(content);

  console.log('='.repeat(80));
  console.log('\n💡 Copy this SQL and run it in your Supabase SQL Editor');
  console.log('   to restore the complete database schema.\n');
}

async function main() {
  console.log('📋 Pharma CRM Schema Viewer\n');

  const schemas = listSchemaBackups();

  if (schemas.length === 0) {
    console.log('❌ No schema backup files found');
    console.log('💡 Run: npm run backup:schema to create one\n');
    rl.close();
    return;
  }

  console.log('📁 Available schema backups:\n');
  schemas.forEach((schema, index) => {
    console.log(`${index + 1}. ${schema.name}`);
    console.log(`   Created: ${schema.time.toLocaleString()}\n`);
  });

  const selection = await question('Select schema number to view (or 0 to cancel): ');
  const index = parseInt(selection) - 1;

  if (index < 0 || index >= schemas.length) {
    console.log('❌ Invalid selection');
    rl.close();
    return;
  }

  await displaySchema(schemas[index].path);
  
  const saveOption = await question('\nSave to file? (yes/no): ');
  if (saveOption.toLowerCase() === 'yes') {
    const filename = await question('Enter filename (or press Enter for default): ');
    const outputFile = filename.trim() || 'restored-schema.sql';
    const outputPath = path.join(process.cwd(), outputFile);
    
    fs.copyFileSync(schemas[index].path, outputPath);
    console.log(`✅ Schema saved to: ${outputPath}`);
  }

  rl.close();
}

// Run if called directly
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('❌ Error:', error);
      rl.close();
      process.exit(1);
    });
}

module.exports = { listSchemaBackups, displaySchema };