"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActivityMonitor = void 0;
const POLYMARKET_DATA_API = "https://data-api.polymarket.com";
class ActivityMonitor {
    queries;
    pollIntervalMs;
    callbacks = [];
    timer = null;
    isProcessing = false;
    backoffMs = 2000;
    running = false;
    constructor(queries, pollIntervalMs) {
        this.queries = queries;
        this.pollIntervalMs = pollIntervalMs;
    }
    onTrade(callback) {
        this.callbacks.push(callback);
    }
    async start() {
        this.running = true;
        console.log("[ActivityMonitor] Starting polling...");
        // Initial poll
        await this.poll();
        // Schedule recurring polls
        this.timer = setInterval(() => {
            if (!this.isProcessing) {
                this.poll().catch((err) => console.error("[ActivityMonitor] Poll error:", err));
            }
        }, this.pollIntervalMs);
    }
    stop() {
        this.running = false;
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
        console.log("[ActivityMonitor] Stopped");
    }
    async poll() {
        if (this.isProcessing || !this.running)
            return;
        this.isProcessing = true;
        try {
            const watchedAddresses = this.queries.getAllWatchedAddresses();
            if (watchedAddresses.length === 0) {
                this.isProcessing = false;
                return;
            }
            for (const address of watchedAddresses) {
                if (!this.running)
                    break;
                await this.pollAddress(address);
            }
            // Reset backoff on success
            this.backoffMs = 2000;
        }
        catch (err) {
            console.error("[ActivityMonitor] Error during poll:", err);
            console.log(`[ActivityMonitor] Backing off for ${this.backoffMs / 1000}s...`);
            await this.sleep(this.backoffMs);
            this.backoffMs = Math.min(this.backoffMs * 2, 60000);
        }
        finally {
            this.isProcessing = false;
        }
    }
    async pollAddress(address) {
        const cursorKey = `activity_${address}`;
        let lastTimestamp = this.queries.getLastTimestamp(cursorKey);
        if (lastTimestamp === null) {
            // First run: set cursor to now, don't flood with old trades
            lastTimestamp = Math.floor(Date.now() / 1000);
            this.queries.setLastTimestamp(cursorKey, lastTimestamp);
            console.log(`[ActivityMonitor] Initialized cursor for ${address.slice(0, 10)}... at ${lastTimestamp}`);
            return;
        }
        const activities = await this.fetchActivities(address, lastTimestamp);
        if (activities.length === 0)
            return;
        console.log(`[ActivityMonitor] Found ${activities.length} activities for ${address.slice(0, 10)}...`);
        let maxTimestamp = lastTimestamp;
        for (const activity of activities) {
            // Only process TRADE type
            if (activity.type !== "TRADE")
                continue;
            const trade = this.activityToTrade(activity, address);
            if (!trade)
                continue;
            // Deduplicate
            if (this.queries.isTradeProcessed(trade.txHash, address))
                continue;
            await this.emitTrade(trade);
            if (activity.timestamp > maxTimestamp) {
                maxTimestamp = activity.timestamp;
            }
        }
        // Update cursor
        if (maxTimestamp > lastTimestamp) {
            this.queries.setLastTimestamp(cursorKey, maxTimestamp);
        }
    }
    async fetchActivities(address, startTimestamp) {
        const params = new URLSearchParams({
            user: address,
            type: "TRADE",
            start: startTimestamp.toString(),
            sortBy: "TIMESTAMP",
            sortDirection: "ASC",
            limit: "100",
        });
        const url = `${POLYMARKET_DATA_API}/activity?${params}`;
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Polymarket Data API returned ${response.status}: ${await response.text()}`);
        }
        return (await response.json());
    }
    activityToTrade(activity, walletAddress) {
        try {
            const side = activity.side;
            if (side !== "BUY" && side !== "SELL")
                return null;
            return {
                txHash: activity.transactionHash,
                timestamp: activity.timestamp,
                walletAddress,
                side,
                outcome: activity.outcome || "Unknown",
                question: activity.title || "Unknown Market",
                slug: activity.slug || "",
                eventSlug: activity.eventSlug || "",
                tokenAmount: activity.size,
                usdcAmount: activity.usdcSize,
                price: activity.price,
                conditionId: activity.conditionId,
                activityType: activity.type,
                asset: activity.asset || "",
            };
        }
        catch {
            return null;
        }
    }
    async emitTrade(trade) {
        for (const cb of this.callbacks) {
            try {
                await cb(trade);
            }
            catch (err) {
                console.error("[ActivityMonitor] Callback error:", err);
            }
        }
    }
    sleep(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}
exports.ActivityMonitor = ActivityMonitor;
//# sourceMappingURL=activityMonitor.js.map