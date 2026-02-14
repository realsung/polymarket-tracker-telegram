"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatTradeAlert = formatTradeAlert;
exports.formatTradeHistory = formatTradeHistory;
function escapeHtml(text) {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}
function shortenAddress(address) {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
function formatNumber(n, decimals = 2) {
    return n.toLocaleString("en-US", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    });
}
function formatTradeAlert(trade, label) {
    const emoji = trade.side === "BUY" ? "🟢" : "🔴";
    const action = trade.side === "BUY" ? "BOUGHT" : "SOLD";
    const outcome = escapeHtml(trade.outcome);
    const question = escapeHtml(trade.question);
    const walletDisplay = label
        ? `${escapeHtml(label)} (${shortenAddress(trade.walletAddress)})`
        : shortenAddress(trade.walletAddress);
    const total = formatNumber(trade.usdcAmount);
    const shares = formatNumber(trade.tokenAmount);
    const price = formatNumber(trade.price, 4);
    const marketUrl = trade.eventSlug
        ? `https://polymarket.com/event/${trade.eventSlug}`
        : trade.slug
            ? `https://polymarket.com/event/${trade.slug}`
            : "";
    const txUrl = `https://polygonscan.com/tx/${trade.txHash}`;
    let msg = `${emoji} <b>${action} ${outcome}</b>\n`;
    msg += `\n📊 <b>Market:</b> "${question}"\n`;
    msg += `💰 <b>Amount:</b> ${shares} shares @ $${price}\n`;
    msg += `💵 <b>Total:</b> $${total}\n`;
    msg += `\n👛 <b>Wallet:</b> ${walletDisplay}\n`;
    msg += "\n";
    if (marketUrl) {
        msg += `<a href="${marketUrl}">View Market</a> | `;
    }
    msg += `<a href="${txUrl}">View Tx</a>`;
    return msg;
}
function formatTradeHistory(trades) {
    if (trades.length === 0) {
        return "No trades found.";
    }
    let msg = `📜 <b>Recent Trades</b> (${trades.length})\n\n`;
    for (const t of trades) {
        const emoji = t.side === "BUY" ? "🟢" : "🔴";
        const date = new Date(t.timestamp * 1000)
            .toISOString()
            .slice(0, 16)
            .replace("T", " ");
        const shortAddr = shortenAddress(t.wallet_address);
        msg += `${emoji} <b>${t.side}</b> ${escapeHtml(t.outcome)} — $${formatNumber(t.usdc_amount)}\n`;
        msg += `   ${escapeHtml(t.question).slice(0, 60)}${t.question.length > 60 ? "..." : ""}\n`;
        msg += `   ${shortAddr} · ${date}\n\n`;
    }
    return msg;
}
//# sourceMappingURL=alertFormatter.js.map