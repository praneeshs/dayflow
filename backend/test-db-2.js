import pg from 'pg';
const { Pool } = pg;

const db = new Pool({
  connectionString: 'postgresql://postgres:praneeshSK16@@db.ugaxfvcazdazkxbekifd.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function test() {
  try {
    const res = await db.query('SELECT NOW()');
    console.log('Success:', res.rows[0]);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    db.end();
  }
}

test();
