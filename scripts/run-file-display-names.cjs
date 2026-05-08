const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const sql = fs.readFileSync(
  path.join(__dirname, '..', 'supabase', 'file-display-names.sql'),
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
    await client.query(sql);
    const { rows } = await client.query(
      "SELECT to_regclass('public.file_display_names') as t"
    );
    console.log('Table:', rows[0].t);
    const { rows: pols } = await client.query(
      "SELECT policyname FROM pg_policies WHERE tablename = 'file_display_names'"
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
