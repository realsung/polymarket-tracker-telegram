"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCurrentPrice = getCurrentPrice;
const CLOB_API = "https://clob.polymarket.com";
async function getCurrentPrice(tokenId) {
    if (!tokenId)
        return null;
    try {
        const url = `${CLOB_API}/price?token_id=${tokenId}&side=buy`;
        const response = await fetch(url);
        if (!response.ok)
            return null;
        const data = (await response.json());
        const price = parseFloat(data.price);
        return isNaN(price) ? null : price;
    }
    catch {
        return null;
    }
}
//# sourceMappingURL=priceService.js.map