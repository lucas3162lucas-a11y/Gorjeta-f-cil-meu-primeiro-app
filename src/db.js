const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');
const config = require('./config');

fs.mkdirSync(config.dataDir, { recursive: true });
const db = new DatabaseSync(path.join(config.dataDir, 'banco.sqlite'));

db.exec(`
  PRAGMA journal_mode = WAL;

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    callback_token TEXT UNIQUE NOT NULL,
    plan TEXT,
    paid_until INTEGER,           -- timestamp (ms) até quando está pago
    status TEXT NOT NULL DEFAULT 'pending', -- pending | active | canceled | blocked
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    expires_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS settings (
    user_id INTEGER PRIMARY KEY,
    bot_enabled INTEGER NOT NULL DEFAULT 1,
    business_name TEXT NOT NULL DEFAULT '',
    about TEXT NOT NULL DEFAULT '',
    catalog TEXT NOT NULL DEFAULT '',
    tone TEXT NOT NULL DEFAULT 'simpático e direto',
    hours_start TEXT NOT NULL DEFAULT '08:00',
    hours_end TEXT NOT NULL DEFAULT '18:00',
    hours_days TEXT NOT NULL DEFAULT '1,2,3,4,5,6',
    hours_enabled INTEGER NOT NULL DEFAULT 0,
    off_hours_message TEXT NOT NULL DEFAULT 'Olá! No momento estamos fora do horário de atendimento. Assim que voltarmos, respondemos você 😊',
    owner_phone TEXT NOT NULL DEFAULT '',
    nvidia_key TEXT NOT NULL DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS usage (
    user_id INTEGER NOT NULL,
    month TEXT NOT NULL,
    replies INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (user_id, month)
  );

  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    contact TEXT NOT NULL,
    role TEXT NOT NULL,           -- user | assistant | owner
    content TEXT NOT NULL,
    created_at INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_messages ON messages (user_id, contact, id);

  CREATE TABLE IF NOT EXISTS paused (
    user_id INTEGER NOT NULL,
    contact TEXT NOT NULL,
    until INTEGER NOT NULL,
    PRIMARY KEY (user_id, contact)
  );

  CREATE TABLE IF NOT EXISTS webhook_events (
    key TEXT PRIMARY KEY,
    received_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    event TEXT NOT NULL,
    plan TEXT,
    amount REAL,
    email TEXT,
    created_at INTEGER NOT NULL
  );
`);

module.exports = db;
