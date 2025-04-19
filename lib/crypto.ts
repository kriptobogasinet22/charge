// Kripto para fiyatlarını çekmek için CoinGecko API kullanıyoruz
const COINGECKO_API_URL = "https://api.coingecko.com/api/v3"

// CoinGecko API'deki ID'ler
const COIN_IDS: Record<string, string> = {
  btc: "bitcoin",
  usdt: "tether",
  trx: "tron",
  xmr: "monero",
  doge: "dogecoin",
}

export async function getCoinPrices(coins: string[]): Promise<Record<string, number>> {
  try {
    const coinIds = coins
      .map((coin) => COIN_IDS[coin.toLowerCase()])
      .filter(Boolean)
      .join(",")
    const response = await fetch(
      `${COINGECKO_API_URL}/simple/price?ids=${coinIds}&vs_currencies=try`,
      { next: { revalidate: 60 } }, // 60 saniyede bir yenile
    )

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    const prices: Record<string, number> = {}

    // API yanıtını işle
    for (const [coinId, priceData] of Object.entries(data)) {
      const coin = Object.keys(COIN_IDS).find((key) => COIN_IDS[key] === coinId)
      if (coin && priceData.try) {
        prices[coin] = priceData.try
      }
    }

    return prices
  } catch (error) {
    console.error("Error fetching coin prices:", error)
    throw error
  }
}

export async function convertCryptoToTRY(amount: number, coin: string): Promise<number> {
  const prices = await getCoinPrices([coin])
  const price = prices[coin.toLowerCase()]

  if (!price) {
    throw new Error(`Price not available for ${coin}`)
  }

  return amount * price
}

export async function convertTRYToCrypto(amount: number, coin: string): Promise<number> {
  const prices = await getCoinPrices([coin])
  const price = prices[coin.toLowerCase()]

  if (!price) {
    throw new Error(`Price not available for ${coin}`)
  }

  return amount / price
}
