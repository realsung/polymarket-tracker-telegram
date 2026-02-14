"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatDiscordEmbed = formatDiscordEmbed;
exports.sendDiscordWebhook = sendDiscordWebhook;
function formatNumber(n, decimals = 2) {
    return n.toLocaleString("en-US", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    });
}
function shortenAddress(address) {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
function formatDiscordEmbed(trade, label) {
    const emoji = trade.side === "BUY" ? "🟢" : "🔴";
    const action = trade.side === "BUY" ? "BOUGHT" : "SOLD";
    const color = trade.side === "BUY" ? 0x00ff00 : 0xff0000;
    const walletDisplay = label
        ? `${label} (${shortenAddress(trade.walletAddress)})`
        : shortenAddress(trade.walletAddress);
    const fields = [
        {
            name: "Market",
            value: trade.question,
            inline: false,
        },
        {
            name: "Amount",
            value: `${formatNumber(trade.tokenAmount)} shares @ $${formatNumber(trade.price, 4)}`,
            inline: true,
        },
        {
            name: "Total",
            value: `$${formatNumber(trade.usdcAmount)}`,
            inline: true,
        },
    ];
    if (trade.currentPrice != null) {
        const diff = trade.currentPrice - trade.price;
        const pct = trade.price > 0 ? (diff / trade.price) * 100 : 0;
        const sign = diff >= 0 ? "+" : "";
        const arrow = diff > 0 ? "📈" : diff < 0 ? "📉" : "➡️";
        fields.push({
            name: `${arrow} Current Price`,
            value: `$${formatNumber(trade.currentPrice, 4)} (${sign}${pct.toFixed(1)}%)`,
            inline: true,
        });
    }
    fields.push({
        name: "Wallet",
        value: walletDisplay,
        inline: false,
    });
    const marketUrl = trade.eventSlug
        ? `https://polymarket.com/event/${trade.eventSlug}`
        : trade.slug
            ? `https://polymarket.com/event/${trade.slug}`
            : "";
    const txUrl = `https://polygonscan.com/tx/${trade.txHash}`;
    const links = [
        marketUrl ? `[View Market](${marketUrl})` : null,
        `[View Tx](${txUrl})`,
    ]
        .filter(Boolean)
        .join(" • ");
    if (links) {
        fields.push({
            name: "Links",
            value: links,
            inline: false,
        });
    }
    return {
        title: `${emoji} ${action} ${trade.outcome}`,
        color,
        fields,
        timestamp: new Date(trade.timestamp * 1000).toISOString(),
    };
}
async function sendDiscordWebhook(webhookUrl, trade, label) {
    try {
        const embed = formatDiscordEmbed(trade, label);
        const payload = {
            embeds: [embed],
        };
        const response = await fetch(webhookUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        });
        if (!response.ok) {
            console.error(`[Discord] Webhook failed: ${response.status} ${await response.text()}`);
        }
    }
    catch (err) {
        console.error("[Discord] Failed to send webhook:", err);
    }
}
//# sourceMappingURL=discordWebhook.js.map