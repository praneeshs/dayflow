import { initSchema, db } from './db/database.js';

async function run() {
  try {
    console.log('Initializing schema...');
    await initSchema();
    console.log('Schema initialized successfully!');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    db.end();
  }
}

run();
