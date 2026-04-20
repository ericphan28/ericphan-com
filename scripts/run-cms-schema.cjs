const fs = require('fs');
const sql = fs.readFileSync('supabase/cms-schema.sql', 'utf8');

// Split SQL into individual statements and run via Supabase SQL API
const PROJECT_REF = 'sqewvfasihjiibyhjxbk';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNxZXd2ZmFzaWhqaWlieWhqeGJrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzY1NzE0MywiZXhwIjoyMDY5MjMzMTQzfQ.hods61hrEyrKnqPK2AWJWzdwwVnFjlwaK6z4gk9wh5s';
const DB_URL = 'postgresql://postgres.sqewvfasihjiibyhjxbk:jHkBndZLYuplpCY7@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres';

async function run() {
  // Try pg module first
  try {
    const { Client } = require('pg');
    const client = new Client({ connectionString: DB_URL, ssl: { rejectUnauthorized: false } });
    await client.connect();
    console.log('✅ Connected to Supabase PostgreSQL');
    await client.query(sql);
    console.log('✅ CMS schema created successfully!');
    await client.end();
  } catch (e) {
    if (e.code === 'MODULE_NOT_FOUND') {
      console.log('pg module not found, installing...');
      const { execSync } = require('child_process');
      execSync('npm install pg --no-save', { stdio: 'inherit' });
      // retry
      const { Client } = require('pg');
      const client = new Client({ connectionString: DB_URL });
      await client.connect();
      console.log('✅ Connected to Supabase PostgreSQL');
      await client.query(sql);
      console.log('✅ CMS schema created successfully!');
      await client.end();
    } else {
      console.error('❌ Error:', e.message);
    }
  }
}

run();
