import pg from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPassword = process.env.SUPABASE_DB_PASSWORD;
const projectRef = 'bkdmjuzibthcqjagyfci';

const connectionConfigs = [
  // Direct connection
  {
    connectionString: `postgres://postgres:${dbPassword}@db.${projectRef}.supabase.co:5432/postgres`,
    ssl: { rejectUnauthorized: false }
  },
  // Session pooler (IPv4 compatible)
  {
    connectionString: `postgres://postgres.${projectRef}:${dbPassword}@aws-0-ap-south-1.pooler.supabase.com:5432/postgres`,
    ssl: { rejectUnauthorized: false }
  },
  // Transaction pooler
  {
    connectionString: `postgres://postgres.${projectRef}:${dbPassword}@aws-0-ap-south-1.pooler.supabase.com:6543/postgres`,
    ssl: { rejectUnauthorized: false }
  }
];

async function applySchema() {
  const sqlPath = path.join(__dirname, '..', 'supabase', 'schema.sql');
  const sqlContent = fs.readFileSync(sqlPath, 'utf8');

  let client = null;
  let connected = false;

  for (const config of connectionConfigs) {
    try {
      console.log(`⚡ Attempting database connection...`);
      client = new pg.Client(config);
      await client.connect();
      connected = true;
      console.log('✅ Connected to Supabase PostgreSQL Database successfully!');
      break;
    } catch (err) {
      console.warn(` Connection attempt failed: ${err.message}`);
    }
  }

  if (!connected || !client) {
    console.error('❌ All connection attempts failed. Please run supabase/schema.sql manually in Supabase SQL Editor.');
    process.exit(1);
  }

  try {
    console.log('🚀 Executing Database Schema Migration...');
    await client.query(sqlContent);
    console.log('🎉 Database Schema Migration completed successfully!');
    console.log('Tables created: organizations, members, employees, risk_profiles, scan_history, usage, saved_configs, system_logs');
    console.log('Triggers created: handle_new_user_signup');
  } catch (err) {
    console.error('❌ Migration Error:', err.message);
  } finally {
    await client.end();
  }
}

applySchema();
