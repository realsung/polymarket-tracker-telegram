export interface Config {
    telegramBotToken: string;
    adminChatId: string;
    pollIntervalMs: number;
    dbPath: string;
}
export type TradeSide = "BUY" | "SELL";
/** Raw response from Polymarket Data API /activity endpoint */
export interface PolymarketActivity {
    proxyWallet: string;
    timestamp: number;
    conditionId: string;
    type: string;
    size: number;
    usdcSize: number;
    transactionHash: string;
    price: number;
    asset: string;
    side: string;
    outcomeIndex: number;
    title: string;
    slug: string;
    icon: string;
    eventSlug: string;
    outcome: string;
    name: string;
    pseudonym: string;
}
/** Normalized trade from API activity */
export interface Trade {
    txHash: string;
    timestamp: number;
    walletAddress: string;
    side: TradeSide;
    outcome: string;
    question: string;
    slug: string;
    eventSlug: string;
    tokenAmount: number;
    usdcAmount: number;
    price: number;
    conditionId: string;
    activityType: string;
}
export interface WatchedWallet {
    id: number;
    chat_id: string;
    address: string;
    label: string;
    added_at: string;
}
export interface TradeRecord {
    id: number;
    chat_id: string;
    wallet_address: string;
    tx_hash: string;
    timestamp: number;
    side: string;
    outcome: string;
    question: string;
    slug: string;
    token_amount: number;
    usdc_amount: number;
    price: number;
    created_at: string;
}
export interface PollCursor {
    key: string;
    last_timestamp: number;
}
