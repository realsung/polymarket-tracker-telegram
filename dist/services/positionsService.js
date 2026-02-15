"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserPositions = getUserPositions;
const POLYMARKET_DATA_API = "https://data-api.polymarket.com";
async function getUserPositions(address, limit = 20) {
    const params = new URLSearchParams({
        user: address,
        limit: limit.toString(),
        sortBy: "CASHPNL",
        sortDirection: "DESC",
    });
    const url = `${POLYMARKET_DATA_API}/positions?${params}`;
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Polymarket Data API returned ${response.status}: ${await response.text()}`);
    }
    return (await response.json());
}
//# sourceMappingURL=positionsService.js.map