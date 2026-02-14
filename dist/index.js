"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_js_1 = require("./config.js");
const database_js_1 = require("./db/database.js");
const queries_js_1 = require("./db/queries.js");
const activityMonitor_js_1 = require("./services/activityMonitor.js");
const telegramBot_js_1 = require("./bot/telegramBot.js");
async function main() {
    console.log("🚀 Starting Polymarket Wallet Tracker Bot...");
    // 1. Load config
    const config = (0, config_js_1.loadConfig)();
    // 2. Initialize database
    const db = (0, database_js_1.initDatabase)(config.dbPath);
    const queries = new queries_js_1.Queries(db);
    // 3. Create services
    const monitor = new activityMonitor_js_1.ActivityMonitor(queries, config.pollIntervalMs);
    const bot = new telegramBot_js_1.TelegramBot(config.telegramBotToken, queries);
    // 4. Register trade callback
    monitor.onTrade(async (trade) => {
        const subscribers = queries.getChatIdsForAddress(trade.walletAddress);
        for (const { chat_id, label } of subscribers) {
            // Check duplicate
            if (queries.isTradeProcessed(trade.txHash, trade.walletAddress)) {
                continue;
            }
            // Save to DB
            queries.insertTrade(chat_id, trade.walletAddress, trade);
            // Send alert
            await bot.sendTradeAlert(trade, chat_id, label);
        }
    });
    // 5. Start services
    await monitor.start();
    await bot.startPolling();
    console.log("✅ Bot is fully operational");
    // 6. Graceful shutdown
    const shutdown = () => {
        console.log("\n🛑 Shutting down...");
        monitor.stop();
        bot.stop();
        db.close();
        process.exit(0);
    };
    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
}
main().catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
});
//# sourceMappingURL=index.js.map