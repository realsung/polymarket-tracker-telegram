"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Queries = void 0;
class Queries {
    db;
    stmts;
    constructor(db) {
        this.db = db;
        this.stmts = this.prepareStatements();
    }
    prepareStatements() {
        return {
            addWallet: this.db.prepare(`INSERT OR IGNORE INTO watched_wallets (chat_id, address, label) VALUES (?, ?, ?)`),
            removeWallet: this.db.prepare(`DELETE FROM watched_wallets WHERE chat_id = ? AND address = ?`),
            listWallets: this.db.prepare(`SELECT * FROM watched_wallets WHERE chat_id = ? ORDER BY added_at DESC`),
            getAllWatchedAddresses: this.db.prepare(`SELECT DISTINCT lower(address) as address FROM watched_wallets`),
            getChatIdsForAddress: this.db.prepare(`SELECT chat_id, label FROM watched_wallets WHERE lower(address) = lower(?)`),
            insertTrade: this.db.prepare(`INSERT INTO trades (chat_id, wallet_address, tx_hash, timestamp, side, outcome, question, slug, token_amount, usdc_amount, price)
         VALUES (@chat_id, @wallet_address, @tx_hash, @timestamp, @side, @outcome, @question, @slug, @token_amount, @usdc_amount, @price)`),
            getTradeHistory: this.db.prepare(`SELECT * FROM trades WHERE chat_id = ? ORDER BY timestamp DESC LIMIT ?`),
            getTradeHistoryByWallet: this.db.prepare(`SELECT * FROM trades WHERE chat_id = ? AND lower(wallet_address) = lower(?) ORDER BY timestamp DESC LIMIT ?`),
            isTradeProcessed: this.db.prepare(`SELECT 1 FROM trades WHERE tx_hash = ? AND lower(wallet_address) = lower(?) LIMIT 1`),
            getLastTimestamp: this.db.prepare(`SELECT last_timestamp FROM poll_cursor WHERE key = ?`),
            setLastTimestamp: this.db.prepare(`INSERT INTO poll_cursor (key, last_timestamp) VALUES (?, ?)
         ON CONFLICT(key) DO UPDATE SET last_timestamp = excluded.last_timestamp`),
        };
    }
    addWallet(chatId, address, label) {
        const result = this.stmts.addWallet.run(chatId, address.toLowerCase(), label);
        return result.changes > 0;
    }
    removeWallet(chatId, address) {
        const result = this.stmts.removeWallet.run(chatId, address.toLowerCase());
        return result.changes > 0;
    }
    listWallets(chatId) {
        return this.stmts.listWallets.all(chatId);
    }
    getAllWatchedAddresses() {
        const rows = this.stmts.getAllWatchedAddresses.all();
        return rows.map((r) => r.address);
    }
    getChatIdsForAddress(address) {
        return this.stmts.getChatIdsForAddress.all(address.toLowerCase());
    }
    insertTrade(chatId, walletAddress, trade) {
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
    getTradeHistory(chatId, walletAddress, limit = 10) {
        if (walletAddress) {
            return this.stmts.getTradeHistoryByWallet.all(chatId, walletAddress, limit);
        }
        return this.stmts.getTradeHistory.all(chatId, limit);
    }
    isTradeProcessed(txHash, walletAddress) {
        const row = this.stmts.isTradeProcessed.get(txHash, walletAddress.toLowerCase());
        return !!row;
    }
    getLastTimestamp(key) {
        const row = this.stmts.getLastTimestamp.get(key);
        return row?.last_timestamp ?? null;
    }
    setLastTimestamp(key, timestamp) {
        this.stmts.setLastTimestamp.run(key, timestamp);
    }
}
exports.Queries = Queries;
//# sourceMappingURL=queries.js.map