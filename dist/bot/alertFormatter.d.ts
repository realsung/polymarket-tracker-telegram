import type { Trade, TradeRecord } from "../types/index.js";
import type { Position } from "../services/positionsService.js";
export interface PositionWithDiff extends Position {
    isNew?: boolean;
    isClosed?: boolean;
    sizeDiff?: number;
    valueDiff?: number;
    pnlDiff?: number;
}
export declare function formatTradeAlert(trade: Trade, label?: string): string;
export declare function formatTradeHistory(trades: TradeRecord[]): string;
export declare function formatPositions(positions: PositionWithDiff[], address: string, label?: string, closedPositions?: Position[]): string;
