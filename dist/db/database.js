"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initDatabase = initDatabase;
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const node_path_1 = __importDefault(require("node:path"));
const node_fs_1 = __importDefault(require("node:fs"));
function initDatabase(dbPath) {
    const dir = node_path_1.default.dirname(dbPath);
    if (!node_fs_1.default.existsSync(dir)) {
        node_fs_1.default.mkdirSync(dir, { recursive: true });
    }
    const db = new better_sqlite3_1.default(dbPath);
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");
    db.exec(`
    CREATE TABLE IF NOT EXISTS watched_wallets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      chat_id TEXT NOT NULL,
      address TEXT NOT NULL,
      label TEXT NOT NULL DEFAULT '',
      added_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(chat_id, address)
    );

    CREATE TABLE IF NOT EXISTS trades (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      chat_id TEXT NOT NULL,
      wallet_address TEXT NOT NULL,
      tx_hash TEXT NOT NULL,
      timestamp INTEGER NOT NULL,
      side TEXT NOT NULL,
      outcome TEXT NOT NULL DEFAULT '',
      question TEXT NOT NULL DEFAULT '',
      slug TEXT NOT NULL DEFAULT '',
      token_amount REAL NOT NULL,
      usdc_amount REAL NOT NULL,
      price REAL NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS poll_cursor (
      key TEXT PRIMARY KEY,
      last_timestamp INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS position_snapshots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      chat_id TEXT NOT NULL,
      wallet_address TEXT NOT NULL,
      asset TEXT NOT NULL,
      condition_id TEXT NOT NULL,
      size REAL NOT NULL,
      avg_price REAL NOT NULL,
      current_value REAL NOT NULL,
      cash_pnl REAL NOT NULL,
      percent_pnl REAL NOT NULL,
      cur_price REAL NOT NULL,
      outcome TEXT NOT NULL,
      title TEXT NOT NULL,
      fetched_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(chat_id, wallet_address, asset)
    );

    CREATE INDEX IF NOT EXISTS idx_wallets_address ON watched_wallets(address);
    CREATE INDEX IF NOT EXISTS idx_wallets_chat_id ON watched_wallets(chat_id);
    CREATE INDEX IF NOT EXISTS idx_trades_tx_hash ON trades(tx_hash);
    CREATE INDEX IF NOT EXISTS idx_trades_chat_id ON trades(chat_id);
    CREATE INDEX IF NOT EXISTS idx_trades_wallet ON trades(wallet_address);
    CREATE INDEX IF NOT EXISTS idx_snapshots_wallet ON position_snapshots(chat_id, wallet_address);
  `);
    return db;
}
//# sourceMappingURL=database.js.map