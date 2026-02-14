import type Database from "better-sqlite3";
import type { WatchedWallet, TradeRecord, Trade } from "../types/index.js";

export class Queries {
  private stmts: ReturnType<typeof this.prepareStatements>;

  constructor(private db: Database.Database) {
    this.stmts = this.prepareStatements();
  }

  private prepareStatements() {
    return {
      addWallet: this.db.prepare<[string, string, string]>(
        `INSERT OR IGNORE INTO watched_wallets (chat_id, address, label) VALUES (?, ?, ?)`
      ),
      removeWallet: this.db.prepare<[string, string]>(
        `DELETE FROM watched_wallets WHERE chat_id = ? AND address = ?`
      ),
      listWallets: this.db.prepare<[string]>(
        `SELECT * FROM watched_wallets WHERE chat_id = ? ORDER BY added_at DESC`
      ),
      getAllWatchedAddresses: this.db.prepare(
        `SELECT DISTINCT lower(address) as address FROM watched_wallets`
      ),
      getChatIdsForAddress: this.db.prepare<[string]>(
        `SELECT chat_id, label FROM watched_wallets WHERE lower(address) = lower(?)`
      ),
      insertTrade: this.db.prepare(
        `INSERT INTO trades (chat_id, wallet_address, tx_hash, timestamp, side, outcome, question, slug, token_amount, usdc_amount, price)
         VALUES (@chat_id, @wallet_address, @tx_hash, @timestamp, @side, @outcome, @question, @slug, @token_amount, @usdc_amount, @price)`
      ),
      getTradeHistory: this.db.prepare<[string, number]>(
        `SELECT * FROM trades WHERE chat_id = ? ORDER BY timestamp DESC LIMIT ?`
      ),
      getTradeHistoryByWallet: this.db.prepare<[string, string, number]>(
        `SELECT * FROM trades WHERE chat_id = ? AND lower(wallet_address) = lower(?) ORDER BY timestamp DESC LIMIT ?`
      ),
      isTradeProcessed: this.db.prepare<[string, string]>(
        `SELECT 1 FROM trades WHERE tx_hash = ? AND lower(wallet_address) = lower(?) LIMIT 1`
      ),
      getLastTimestamp: this.db.prepare<[string]>(
        `SELECT last_timestamp FROM poll_cursor WHERE key = ?`
      ),
      setLastTimestamp: this.db.prepare<[string, number]>(
        `INSERT INTO poll_cursor (key, last_timestamp) VALUES (?, ?)
         ON CONFLICT(key) DO UPDATE SET last_timestamp = excluded.last_timestamp`
      ),
    };
  }

  addWallet(chatId: string, address: string, label: string): boolean {
    const result = this.stmts.addWallet.run(chatId, address.toLowerCase(), label);
    return result.changes > 0;
  }

  removeWallet(chatId: string, address: string): boolean {
    const result = this.stmts.removeWallet.run(chatId, address.toLowerCase());
    return result.changes > 0;
  }

  listWallets(chatId: string): WatchedWallet[] {
    return this.stmts.listWallets.all(chatId) as WatchedWallet[];
  }

  getAllWatchedAddresses(): string[] {
    const rows = this.stmts.getAllWatchedAddresses.all() as { address: string }[];
    return rows.map((r) => r.address);
  }

  getChatIdsForAddress(address: string): { chat_id: string; label: string }[] {
    return this.stmts.getChatIdsForAddress.all(address.toLowerCase()) as {
      chat_id: string;
      label: string;
    }[];
  }

  insertTrade(chatId: string, walletAddress: string, trade: Trade): void {
    this.stmts.insertTrade.run({
      chat_id: chatId,
      wallet_address: walletAddress.toLowerCase(),
      tx_hash: trade.txHash,
      timestamp: trade.timestamp,
      side: trade.side,
      outcome: trade.outcome,
      question: trade.question,
      slug: trade.slug,
      token_amount: trade.tokenAmount,
      usdc_amount: trade.usdcAmount,
      price: trade.price,
    });
  }

  getTradeHistory(
    chatId: string,
    walletAddress?: string,
    limit: number = 10
  ): TradeRecord[] {
    if (walletAddress) {
      return this.stmts.getTradeHistoryByWallet.all(
        chatId,
        walletAddress,
        limit
      ) as TradeRecord[];
    }
    return this.stmts.getTradeHistory.all(chatId, limit) as TradeRecord[];
  }

  isTradeProcessed(txHash: string, walletAddress: string): boolean {
    const row = this.stmts.isTradeProcessed.get(txHash, walletAddress.toLowerCase());
    return !!row;
  }

  getLastTimestamp(key: string): number | null {
    const row = this.stmts.getLastTimestamp.get(key) as
      | { last_timestamp: number }
      | undefined;
    return row?.last_timestamp ?? null;
  }

  setLastTimestamp(key: string, timestamp: number): void {
    this.stmts.setLastTimestamp.run(key, timestamp);
  }
}
