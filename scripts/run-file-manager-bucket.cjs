const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const sql = fs.readFileSync(
  path.join(__dirname, '..', 'supabase', 'file-manager-bucket.sql'),
  'utf8'
);

const DB_URL =
  'postgresql://postgres.sqewvfasihjiibyhjxbk:jHkBndZLYuplpCY7@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres';

(async () => {
  const client = new Client({
    connectionString: DB_URL,
    ssl: { rejectUnauthorized: false },
  });
  try {
    await client.connect();
    console.log('Connected to Supabase PostgreSQL');
    await client.query(sql);
    const { rows } = await client.query(
      "SELECT id, name, public FROM storage.buckets WHERE id = 'file-manager'"
    );
    console.log('Bucket row:', rows);
    const { rows: pols } = await client.query(
      "SELECT policyname FROM pg_policies WHERE tablename = 'objects' AND policyname LIKE 'file_manager_%'"
    );
    console.log('Policies:', pols.map((p) => p.policyname));
    console.log('DONE');
  } catch (e) {
    console.error('ERROR:', e.message);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
})();
