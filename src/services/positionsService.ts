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
  fetchAll: boolean = true
): Promise<Position[]> {
  const positions: Position[] = [];
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
      throw new Error(
        `Polymarket Data API returned ${response.status}: ${await response.text()}`
      );
    }

    const batch = (await response.json()) as Position[];
    positions.push(...batch);

    // If we got less than batchSize, we've reached the end
    if (batch.length < batchSize || !fetchAll) {
      break;
    }

    offset += batchSize;
  }

  return positions;
}
