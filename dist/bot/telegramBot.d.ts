import type { Queries } from "../db/queries.js";
import type { Trade } from "../types/index.js";
export declare class TelegramBot {
    private bot;
    private queries;
    private readonly MAX_MESSAGE_LENGTH;
    constructor(token: string, queries: Queries);
    private sendLongMessage;
    private registerCommands;
    sendTradeAlert(trade: Trade, chatId: string, label?: string): Promise<void>;
    startPolling(): Promise<void>;
    stop(): void;
}
