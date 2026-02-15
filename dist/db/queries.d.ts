import type Database from "better-sqlite3";
import type { WatchedWallet, TradeRecord, Trade } from "../types/index.js";
import type { Position } from "../services/positionsService.js";
export declare class Queries {
    private db;
    private stmts;
    constructor(db: Database.Database);
    private prepareStatements;
    addWallet(chatId: string, address: string, label: string): boolean;
    removeWallet(chatId: string, address: string): boolean;
    listWallets(chatId: string): WatchedWallet[];
    getAllWatchedAddresses(): string[];
    getChatIdsForAddress(address: string): {
        chat_id: string;
        label: string;
    }[];
    insertTrade(chatId: string, walletAddress: string, trade: Trade): void;
    getTradeHistory(chatId: string, walletAddress?: string, limit?: number): TradeRecord[];
    isTradeProcessed(txHash: string, walletAddress: string): boolean;
    getLastTimestamp(key: string): number | null;
    setLastTimestamp(key: string, timestamp: number): void;
    getPositionSnapshots(chatId: string, walletAddress: string): Map<string, Position>;
    savePositionSnapshots(chatId: string, walletAddress: string, positions: Position[]): void;
}
