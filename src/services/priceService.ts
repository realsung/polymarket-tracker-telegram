const CLOB_API = "https://clob.polymarket.com";

export async function getCurrentPrice(tokenId: string): Promise<number | null> {
  if (!tokenId) return null;

  try {
    const url = `${CLOB_API}/price?token_id=${tokenId}&side=buy`;
    const response = await fetch(url);
    if (!response.ok) return null;

    const data = (await response.json()) as { price: string };
    const price = parseFloat(data.price);
    return isNaN(price) ? null : price;
  } catch {
    return null;
  }
}
