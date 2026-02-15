const POLYMARKET_DATA_API = "https://data-api.polymarket.com";

export interface Position {
  proxyWallet: string;
  asset: string;
  conditionId: string;
  size: number;
  avgPrice: number;
  initialValue: number;
  currentValue: number;
  cashPnl: number;
  percentPnl: number;
  totalBought: number;
  realizedPnl: number;
  percentRealizedPnl: number;
  curPrice: number;
  redeemable: boolean;
  mergeable: boolean;
  title: string;
  slug: string;
  icon: string;
  eventSlug: string;
  outcome: string;
  outcomeIndex: number;
  oppositeOutcome: string;
  oppositeAsset: string;
  endDate: string;
  negativeRisk: boolean;
}

export async function getUserPositions(
  address: string,
  limit: number = 20
): Promise<Position[]> {
  const params = new URLSearchParams({
    user: address,
    limit: limit.toString(),
    sortBy: "CASHPNL",
    sortDirection: "DESC",
  });

  const url = `${POLYMARKET_DATA_API}/positions?${params}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `Polymarket Data API returned ${response.status}: ${await response.text()}`
    );
  }

  return (await response.json()) as Position[];
}
