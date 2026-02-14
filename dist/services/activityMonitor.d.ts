import type { Trade } from "../types/index.js";
import type { Queries } from "../db/queries.js";
type TradeCallback = (trade: Trade) => void | Promise<void>;
export declare class ActivityMonitor {
    private queries;
    private pollIntervalMs;
    private callbacks;
    private timer;
    private isProcessing;
    private backoffMs;
    private running;
    constructor(queries: Queries, pollIntervalMs: number);
    onTrade(callback: TradeCallback): void;
    start(): Promise<void>;
    stop(): void;
    private poll;
    private pollAddress;
    private fetchActivities;
    private activityToTrade;
    private emitTrade;
    private sleep;
}
export {};
