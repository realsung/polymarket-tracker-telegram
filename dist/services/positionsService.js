"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserPositions = getUserPositions;
const POLYMARKET_DATA_API = "https://data-api.polymarket.com";
async function getUserPositions(address, fetchAll = true) {
    const positions = [];
    let offset = 0;
    const batchSize = 500; // API maximum
    while (true) {
        const params = new URLSearchParams({
            user: address,
            limit: batchSize.toString(),
            offset: offset.toString(),
            sortBy: "CASHPNL",
            sortDirection: "DESC",
        });
        const url = `${POLYMARKET_DATA_API}/positions?${params}`;
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Polymarket Data API returned ${response.status}: ${await response.text()}`);
        }
        const batch = (await response.json());
        positions.push(...batch);
        // If we got less than batchSize, we've reached the end
        if (batch.length < batchSize || !fetchAll) {
            break;
        }
        offset += batchSize;
    }
    return positions;
}
//# sourceMappingURL=positionsService.js.map