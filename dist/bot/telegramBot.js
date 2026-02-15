"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TelegramBot = void 0;
const grammy_1 = require("grammy");
const ethers_1 = require("ethers");
const alertFormatter_js_1 = require("./alertFormatter.js");
const positionsService_js_1 = require("../services/positionsService.js");
class TelegramBot {
    bot;
    queries;
    MAX_MESSAGE_LENGTH = 4096;
    constructor(token, queries) {
        this.bot = new grammy_1.Bot(token);
        this.queries = queries;
        this.registerCommands();
    }
    async sendLongMessage(chatId, text) {
        if (text.length <= this.MAX_MESSAGE_LENGTH) {
            await this.bot.api.sendMessage(chatId, text, { parse_mode: "HTML" });
            return;
        }
        // Split by positions (looking for numbered list items)
        const lines = text.split("\n");
        let currentChunk = "";
        let chunkCount = 0;
        for (const line of lines) {
            // If adding this line would exceed limit, send current chunk
            if (currentChunk.length + line.length + 1 > this.MAX_MESSAGE_LENGTH) {
                if (currentChunk) {
                    chunkCount++;
                    await this.bot.api.sendMessage(chatId, currentChunk, {
                        parse_mode: "HTML",
                    });
                    currentChunk = "";
                }
            }
            currentChunk += line + "\n";
        }
        // Send remaining chunk
        if (currentChunk) {
            await this.bot.api.sendMessage(chatId, currentChunk, {
                parse_mode: "HTML",
            });
        }
    }
    registerCommands() {
        this.bot.command("start", (ctx) => {
            const msg = `👋 <b>Polymarket Wallet Tracker</b>\n\n` +
                `Track Polymarket trades from any wallet and get real-time alerts.\n\n` +
                `<b>Commands:</b>\n` +
                `/watch &lt;address&gt; [label] — Start tracking a wallet\n` +
                `/unwatch &lt;address&gt; — Stop tracking a wallet\n` +
                `/list — Show tracked wallets\n` +
                `/positions &lt;address&gt; — View current positions\n` +
                `/history [count] — Recent trade history\n` +
                `/status — Bot status`;
            return ctx.reply(msg, { parse_mode: "HTML" });
        });
        this.bot.command("watch", (ctx) => {
            const text = ctx.message?.text ?? "";
            const parts = text.split(/\s+/).slice(1);
            const address = parts[0];
            const label = parts.slice(1).join(" ") || "";
            if (!address) {
                return ctx.reply("Usage: /watch <address> [label]");
            }
            if (!ethers_1.ethers.isAddress(address)) {
                return ctx.reply("❌ Invalid Ethereum address.");
            }
            const chatId = ctx.chat.id.toString();
            const added = this.queries.addWallet(chatId, address, label);
            if (added) {
                const displayLabel = label ? ` (${label})` : "";
                return ctx.reply(`✅ Now watching <code>${address}</code>${displayLabel}`, { parse_mode: "HTML" });
            }
            return ctx.reply("ℹ️ This address is already being watched.");
        });
        this.bot.command("unwatch", (ctx) => {
            const text = ctx.message?.text ?? "";
            const address = text.split(/\s+/)[1];
            if (!address) {
                return ctx.reply("Usage: /unwatch <address>");
            }
            const chatId = ctx.chat.id.toString();
            const removed = this.queries.removeWallet(chatId, address);
            if (removed) {
                return ctx.reply(`✅ Stopped watching <code>${address}</code>`, { parse_mode: "HTML" });
            }
            return ctx.reply("ℹ️ This address was not being watched.");
        });
        this.bot.command("list", (ctx) => {
            const chatId = ctx.chat.id.toString();
            const wallets = this.queries.listWallets(chatId);
            if (wallets.length === 0) {
                return ctx.reply("No wallets being tracked. Use /watch to add one.");
            }
            let msg = `📋 <b>Watched Wallets</b> (${wallets.length})\n\n`;
            for (const w of wallets) {
                const label = w.label ? ` — ${w.label}` : "";
                msg += `• <code>${w.address}</code>${label}\n`;
            }
            return ctx.reply(msg, { parse_mode: "HTML" });
        });
        this.bot.command("history", (ctx) => {
            const text = ctx.message?.text ?? "";
            const countStr = text.split(/\s+/)[1];
            let count = parseInt(countStr || "10", 10);
            if (isNaN(count) || count < 1)
                count = 10;
            if (count > 50)
                count = 50;
            const chatId = ctx.chat.id.toString();
            const trades = this.queries.getTradeHistory(chatId, undefined, count);
            const msg = (0, alertFormatter_js_1.formatTradeHistory)(trades);
            return ctx.reply(msg, { parse_mode: "HTML" });
        });
        this.bot.command("status", (ctx) => {
            const chatId = ctx.chat.id.toString();
            const wallets = this.queries.listWallets(chatId);
            const msg = `🤖 <b>Bot Status</b>\n\n` +
                `Tracked wallets: ${wallets.length}\n` +
                `Status: Running`;
            return ctx.reply(msg, { parse_mode: "HTML" });
        });
        this.bot.command("positions", async (ctx) => {
            const text = ctx.message?.text ?? "";
            const address = text.split(/\s+/)[1];
            if (!address) {
                return ctx.reply("Usage: /positions <address>");
            }
            if (!ethers_1.ethers.isAddress(address)) {
                return ctx.reply("❌ Invalid Ethereum address.");
            }
            try {
                await ctx.reply("🔍 Fetching all positions...");
                const chatId = ctx.chat.id.toString();
                const allPositions = await (0, positionsService_js_1.getUserPositions)(address); // Fetch all positions
                // Filter out ended events
                const now = new Date();
                const positions = allPositions.filter((p) => {
                    if (!p.endDate)
                        return true;
                    const endDate = new Date(p.endDate);
                    return endDate > now;
                });
                // Get previous snapshots
                const previousSnapshots = this.queries.getPositionSnapshots(chatId, address);
                // Compare and create diffs
                const positionsWithDiff = [];
                const closedPositions = [];
                for (const pos of positions) {
                    const prev = previousSnapshots.get(pos.asset);
                    if (!prev) {
                        // New position
                        positionsWithDiff.push({ ...pos, isNew: true });
                    }
                    else {
                        // Existing position - calculate diffs
                        positionsWithDiff.push({
                            ...pos,
                            sizeDiff: pos.size - prev.size,
                            valueDiff: pos.currentValue - prev.currentValue,
                            pnlDiff: pos.cashPnl - prev.cashPnl,
                        });
                        previousSnapshots.delete(pos.asset);
                    }
                }
                // Remaining snapshots are closed positions
                for (const [, prev] of previousSnapshots) {
                    closedPositions.push(prev);
                }
                // Try to get label if this is a watched wallet
                const wallets = this.queries.listWallets(chatId);
                const wallet = wallets.find((w) => w.address.toLowerCase() === address.toLowerCase());
                const label = wallet?.label;
                const msg = (0, alertFormatter_js_1.formatPositions)(positionsWithDiff, address, label, closedPositions);
                // Save current positions as new snapshot
                this.queries.savePositionSnapshots(chatId, address, positions);
                // Send message (will split if too long)
                await this.sendLongMessage(chatId, msg);
            }
            catch (err) {
                console.error("[TelegramBot] Failed to fetch positions:", err);
                return ctx.reply("❌ Failed to fetch positions. Please try again later.");
            }
        });
    }
    async sendTradeAlert(trade, chatId, label) {
        const msg = (0, alertFormatter_js_1.formatTradeAlert)(trade, label);
        try {
            await this.bot.api.sendMessage(chatId, msg, {
                parse_mode: "HTML",
                link_preview_options: { is_disabled: true },
            });
        }
        catch (err) {
            console.error(`[TelegramBot] Failed to send alert to ${chatId}:`, err);
        }
    }
    async startPolling() {
        console.log("[TelegramBot] Starting bot polling...");
        this.bot.start({
            onStart: () => console.log("[TelegramBot] Bot is running"),
        });
    }
    stop() {
        this.bot.stop();
        console.log("[TelegramBot] Bot stopped");
    }
}
exports.TelegramBot = TelegramBot;
//# sourceMappingURL=telegramBot.js.map