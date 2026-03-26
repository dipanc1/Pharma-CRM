const fs = require('fs');
const path = require('path');

console.log('🚀 DS Medical Agencies Setup');
console.log('===================\n');

// Check if .env file exists
const envPath = path.join(__dirname, '.env');
const envExamplePath = path.join(__dirname, 'env.example');

if (!fs.existsSync(envPath)) {
  console.log('📝 Creating .env file from template...');
  
  if (fs.existsSync(envExamplePath)) {
    fs.copyFileSync(envExamplePath, envPath);
    console.log('✅ .env file created successfully!');
  } else {
    console.log('❌ env.example file not found. Creating basic .env file...');
    const envContent = `# Supabase Configuration
# Get these values from your Supabase project dashboard
REACT_APP_SUPABASE_URL=your_supabase_project_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
`;
    fs.writeFileSync(envPath, envContent);
    console.log('✅ .env file created successfully!');
  }
} else {
  console.log('✅ .env file already exists');
}

console.log('\n📋 Next Steps:');
console.log('1. Edit the .env file and add your Supabase credentials');
console.log('2. Set up your Supabase database using the SQL commands in README.md');
console.log('3. Run "npm start" to start the development server');
console.log('\n🔗 Supabase Setup:');
console.log('- Go to https://supabase.com');
console.log('- Create a new project');
console.log('- Copy your project URL and anon key from Settings > API');
console.log('- Update the .env file with these values');
console.log('\n📚 For detailed instructions, see README.md');
