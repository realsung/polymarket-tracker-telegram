"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadConfig = loadConfig;
require("dotenv/config");
function loadConfig() {
    const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!telegramBotToken)
        throw new Error("TELEGRAM_BOT_TOKEN is required");
    const adminChatId = process.env.ADMIN_CHAT_ID ?? "";
    const pollIntervalMs = parseInt(process.env.POLL_INTERVAL_MS ?? "10000", 10);
    if (isNaN(pollIntervalMs) || pollIntervalMs < 1000) {
        throw new Error("POLL_INTERVAL_MS must be a number >= 1000");
    }
    const dbPath = process.env.DB_PATH ?? "./data/bot.db";
    return {
        telegramBotToken,
        adminChatId,
        pollIntervalMs,
        dbPath,
    };
}
//# sourceMappingURL=config.js.map