import { loadConfig } from "./config.js";
import { initDatabase } from "./db/database.js";
import { Queries } from "./db/queries.js";
import { ActivityMonitor } from "./services/activityMonitor.js";
import { getCurrentPrice } from "./services/priceService.js";
import { TelegramBot } from "./bot/telegramBot.js";
import type { Trade } from "./types/index.js";

async function main() {
  console.log("🚀 Starting Polymarket Wallet Tracker Bot...");

  // 1. Load config
  const config = loadConfig();

  // 2. Initialize database
  const db = initDatabase(config.dbPath);
  const queries = new Queries(db);

  // 3. Create services
  const monitor = new ActivityMonitor(queries, config.pollIntervalMs);
  const bot = new TelegramBot(config.telegramBotToken, queries);

  // 4. Register trade callback
  monitor.onTrade(async (trade: Trade) => {
    const subscribers = queries.getChatIdsForAddress(trade.walletAddress);

    for (const { chat_id, label } of subscribers) {
      // Check duplicate
      if (queries.isTradeProcessed(trade.txHash, trade.walletAddress)) {
        continue;
      }

      // Fetch current market price
      const currentPrice = await getCurrentPrice(trade.asset);
      const enrichedTrade = { ...trade, currentPrice: currentPrice ?? undefined };

      // Save to DB
      queries.insertTrade(chat_id, trade.walletAddress, trade);

      // Send alert
      await bot.sendTradeAlert(enrichedTrade, chat_id, label);
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
