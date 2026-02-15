import type { Trade, TradeRecord } from "../types/index.js";
import type { Position } from "../services/positionsService.js";

export interface PositionWithDiff extends Position {
  isNew?: boolean;
  isClosed?: boolean;
  sizeDiff?: number;
  valueDiff?: number;
  pnlDiff?: number;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function shortenAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function formatNumber(n: number, decimals: number = 2): string {
  return n.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatTradeAlert(
  trade: Trade,
  label?: string
): string {
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

  if (trade.currentPrice != null) {
    const cur = formatNumber(trade.currentPrice, 4);
    const diff = trade.currentPrice - trade.price;
    const pct = trade.price > 0 ? (diff / trade.price) * 100 : 0;
    const sign = diff >= 0 ? "+" : "";
    const arrow = diff > 0 ? "📈" : diff < 0 ? "📉" : "➡️";
    msg += `${arrow} <b>Current:</b> $${cur} (${sign}${pct.toFixed(1)}%)\n`;
  }

  msg += `\n👛 <b>Wallet:</b> ${walletDisplay}\n`;

  msg += "\n";
  if (marketUrl) {
    msg += `<a href="${marketUrl}">View Market</a> | `;
  }
  msg += `<a href="${txUrl}">View Tx</a>`;

  return msg;
}

export function formatTradeHistory(trades: TradeRecord[]): string {
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

export function formatPositions(
  positions: PositionWithDiff[],
  address: string,
  label?: string,
  closedPositions?: Position[]
): string {
  if (positions.length === 0 && (!closedPositions || closedPositions.length === 0)) {
    return "No open positions found.";
  }

  const walletDisplay = label
    ? `${escapeHtml(label)} (${shortenAddress(address)})`
    : shortenAddress(address);

  let totalValue = 0;
  let totalPnl = 0;

  for (const p of positions) {
    totalValue += p.currentValue;
    totalPnl += p.cashPnl;
  }

  let msg = `💼 <b>Positions for ${walletDisplay}</b>\n\n`;
  msg += `📊 <b>Summary:</b>\n`;
  msg += `   Total Value: $${formatNumber(totalValue)}\n`;
  msg += `   Total P&L: ${totalPnl >= 0 ? "+" : ""}$${formatNumber(totalPnl)} (${totalPnl >= 0 ? "+" : ""}${((totalPnl / (totalValue - totalPnl)) * 100).toFixed(1)}%)\n`;
  msg += `   Positions: ${positions.length}\n\n`;

  // Show closed positions first if any
  if (closedPositions && closedPositions.length > 0) {
    msg += `<b>❌ Closed Positions:</b>\n\n`;
    for (const p of closedPositions.slice(0, 3)) {
      msg += `• <b>${escapeHtml(p.outcome)}</b> - ${escapeHtml(p.title).slice(0, 40)}...\n`;
      msg += `  Closed: ${formatNumber(p.size)} shares\n\n`;
    }
    if (closedPositions.length > 3) {
      msg += `... and ${closedPositions.length - 3} more closed\n\n`;
    }
  }

  msg += `<b>Top Positions:</b>\n\n`;

  for (let i = 0; i < Math.min(positions.length, 10); i++) {
    const p = positions[i];
    const pnlEmoji = p.cashPnl > 0 ? "📈" : p.cashPnl < 0 ? "📉" : "➡️";
    const sign = p.cashPnl >= 0 ? "+" : "";

    // Highlight new or changed positions
    let prefix = "";
    if (p.isNew) {
      prefix = "🆕 ";
    } else if (p.sizeDiff && Math.abs(p.sizeDiff) > 0.01) {
      prefix = "📊 ";
    }

    msg += `${i + 1}. ${prefix}<b>${escapeHtml(p.outcome)}</b>\n`;
    msg += `   ${escapeHtml(p.title).slice(0, 50)}${p.title.length > 50 ? "..." : ""}\n`;

    // Show size with diff if available
    if (p.sizeDiff && Math.abs(p.sizeDiff) > 0.01) {
      const sizeSign = p.sizeDiff > 0 ? "+" : "";
      msg += `   Size: ${formatNumber(p.size)} (${sizeSign}${formatNumber(p.sizeDiff)}) @ avg $${formatNumber(p.avgPrice, 4)}\n`;
    } else {
      msg += `   Size: ${formatNumber(p.size)} @ avg $${formatNumber(p.avgPrice, 4)}\n`;
    }

    // Show P&L with diff if available
    if (p.pnlDiff && Math.abs(p.pnlDiff) > 0.01) {
      const pnlDiffSign = p.pnlDiff > 0 ? "+" : "";
      msg += `   ${pnlEmoji} P&L: ${sign}$${formatNumber(p.cashPnl)} (${pnlDiffSign}$${formatNumber(p.pnlDiff)}) [${sign}${p.percentPnl.toFixed(1)}%]\n`;
    } else {
      msg += `   ${pnlEmoji} P&L: ${sign}$${formatNumber(p.cashPnl)} (${sign}${p.percentPnl.toFixed(1)}%)\n`;
    }

    msg += `   Current: $${formatNumber(p.currentValue)} @ $${formatNumber(p.curPrice, 4)}\n`;

    if (p.redeemable) {
      msg += `   ✅ Redeemable\n`;
    }

    msg += `\n`;
  }

  if (positions.length > 10) {
    msg += `... and ${positions.length - 10} more positions\n`;
  }

  return msg;
}
