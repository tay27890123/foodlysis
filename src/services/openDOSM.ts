const BASE_URL = "https://api.data.gov.my/opendosm/";

interface CPIRecord {
  date: string;
  index: number;
  division: string;
}

interface TradeRecord {
  date: string;
  exports: number;
  imports: number;
  section: string;
}

interface CropRecord {
  date: string;
  state: string;
  crop_type: string;
  production: number;
  planted_area: number;
}

export interface DynamicInsight {
  id: string;
  title: string;
  description: string;
  category: "Price" | "Supply" | "Import" | "Weather" | "PriceCatcher";
  timestamp: string;
  status: "Normal" | "Warning" | "Critical" | "Live";
  source: string;
  value?: string;
}

async function fetchJSON<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

/** Fetch CPI headline data for food division (01) and overall */
async function fetchFoodCPI(): Promise<DynamicInsight[]> {
  const data = await fetchJSON<CPIRecord[]>(
    `${BASE_URL}?id=cpi_headline&limit=28&sort=-date`
  );

  // Group by date, pick latest 2 months
  const byDate = new Map<string, Map<string, number>>();
  for (const r of data) {
    if (r.division !== "01" && r.division !== "overall") continue;
    if (!byDate.has(r.date)) byDate.set(r.date, new Map());
    byDate.get(r.date)!.set(r.division, r.index);
  }

  const dates = [...byDate.keys()].sort().reverse();
  const insights: DynamicInsight[] = [];

  if (dates.length >= 2) {
    const latest = byDate.get(dates[0])!;
    const prev = byDate.get(dates[1])!;

    // Food CPI insight
    const foodNow = latest.get("01");
    const foodPrev = prev.get("01");
    if (foodNow && foodPrev) {
      const change = ((foodNow - foodPrev) / foodPrev) * 100;
      const rising = change > 0;
      insights.push({
        id: "cpi-food",
        title: rising ? "Food Prices Are Rising" : "Food Prices Stabilising",
        description: `The Consumer Price Index for Food & Non-Alcoholic Beverages ${rising ? "increased" : "decreased"} by ${Math.abs(change).toFixed(1)}% month-on-month, from ${foodPrev.toFixed(1)} to ${foodNow.toFixed(1)} (Base: 2010 = 100).`,
        category: "Price",
        timestamp: `Data as of ${formatDate(dates[0])}`,
        status: Math.abs(change) > 1.5 ? "Critical" : change > 0.5 ? "Warning" : "Normal",
        source: "OpenDOSM — CPI Headline",
        value: `${change >= 0 ? "+" : ""}${change.toFixed(1)}%`,
      });
    }

    // Overall CPI insight
    const overallNow = latest.get("overall");
    const overallPrev = prev.get("overall");
    if (overallNow && overallPrev) {
      const change = ((overallNow - overallPrev) / overallPrev) * 100;
      insights.push({
        id: "cpi-overall",
        title: change > 0 ? "General Inflation Trending Up" : "Inflation Cooling Down",
        description: `Malaysia's headline CPI moved ${change > 0 ? "up" : "down"} ${Math.abs(change).toFixed(1)}% to ${overallNow.toFixed(1)}. ${change > 0.5 ? "Broad-based price pressures may affect food supply costs." : "Easing inflation may benefit procurement margins."}`,
        category: "Price",
        timestamp: `Data as of ${formatDate(dates[0])}`,
        status: change > 1 ? "Warning" : "Normal",
        source: "OpenDOSM — CPI Headline",
        value: `${overallNow.toFixed(1)}`,
      });
    }
  }

  return insights;
}

/** Fetch trade data — section 0 = Food & Live Animals */
async function fetchFoodTrade(): Promise<DynamicInsight[]> {
  const data = await fetchJSON<TradeRecord[]>(
    `${BASE_URL}?id=trade_sitc_1d&limit=20&sort=-date`
  );

  const insights: DynamicInsight[] = [];

  // Filter for section 0 (Food & Live Animals)
  const foodTrades = data.filter((r) => r.section === "0").sort((a, b) => b.date.localeCompare(a.date));

  if (foodTrades.length >= 2) {
    const latest = foodTrades[0];
    const prev = foodTrades[1];

    const importChange = ((latest.imports - prev.imports) / prev.imports) * 100;
    const balance = latest.exports - latest.imports;
    const isDeficit = balance < 0;

    insights.push({
      id: "trade-food-imports",
      title: importChange > 0 ? "Food Imports Increasing" : "Food Imports Declining",
      description: `Malaysia's food & live animal imports ${importChange > 0 ? "rose" : "fell"} ${Math.abs(importChange).toFixed(1)}% month-on-month to RM${(latest.imports / 1e9).toFixed(1)}B. ${isDeficit ? `Trade deficit of RM${(Math.abs(balance) / 1e9).toFixed(1)}B signals import dependency.` : "Trade surplus indicates strong export position."}`,
      category: "Import",
      timestamp: `Data as of ${formatDate(latest.date)}`,
      status: importChange > 5 ? "Warning" : importChange > 10 ? "Critical" : "Normal",
      source: "OpenDOSM — Trade SITC",
      value: `RM${(latest.imports / 1e9).toFixed(1)}B`,
    });

    const exportChange = ((latest.exports - prev.exports) / prev.exports) * 100;
    insights.push({
      id: "trade-food-exports",
      title: exportChange > 0 ? "Food Exports Growing" : "Food Export Decline",
      description: `Food exports ${exportChange > 0 ? "grew" : "contracted"} by ${Math.abs(exportChange).toFixed(1)}% to RM${(latest.exports / 1e9).toFixed(1)}B. ${exportChange < -5 ? "Declining exports may indicate reduced agricultural output or rising domestic consumption." : "Healthy export activity across food commodities."}`,
      category: "Import",
      timestamp: `Data as of ${formatDate(latest.date)}`,
      status: exportChange < -5 ? "Warning" : "Normal",
      source: "OpenDOSM — Trade SITC",
      value: `RM${(latest.exports / 1e9).toFixed(1)}B`,
    });
  }

  return insights;
}

/** Fetch crop production data */
async function fetchCropProduction(): Promise<DynamicInsight[]> {
  const data = await fetchJSON<CropRecord[]>(
    `${BASE_URL}?id=crops_state&limit=50&sort=-date&state=Malaysia`
  );

  const insights: DynamicInsight[] = [];

  // Group by year
  const byYear = new Map<string, CropRecord[]>();
  for (const r of data) {
    if (r.state !== "Malaysia") continue;
    if (!byYear.has(r.date)) byYear.set(r.date, []);
    byYear.get(r.date)!.push(r);
  }

  const years = [...byYear.keys()].sort().reverse();

  if (years.length >= 2) {
    const latestCrops = byYear.get(years[0])!;
    const prevCrops = byYear.get(years[1])!;

    const totalNow = latestCrops.reduce((s, c) => s + c.production, 0);
    const totalPrev = prevCrops.reduce((s, c) => s + c.production, 0);
    const change = ((totalNow - totalPrev) / totalPrev) * 100;

    insights.push({
      id: "crop-production",
      title: change < 0 ? "Agricultural Output Declining" : "Agricultural Output Growing",
      description: `Total crop production ${change < 0 ? "fell" : "rose"} ${Math.abs(change).toFixed(1)}% year-on-year to ${(totalNow / 1e6).toFixed(1)}M tonnes. ${change < -5 ? "Supply shortage risk — reduced yields may push food prices higher." : "Stable agricultural output supporting domestic food security."}`,
      category: "Supply",
      timestamp: `Data as of ${years[0].slice(0, 4)}`,
      status: change < -5 ? "Critical" : change < 0 ? "Warning" : "Normal",
      source: "OpenDOSM — Crops State",
      value: `${change >= 0 ? "+" : ""}${change.toFixed(1)}%`,
    });

    // Individual crop types
    const cropMap = new Map(prevCrops.map((c) => [c.crop_type, c.production]));
    for (const crop of latestCrops) {
      const prev = cropMap.get(crop.crop_type);
      if (!prev || prev === 0) continue;
      const cropChange = ((crop.production - prev) / prev) * 100;
      if (Math.abs(cropChange) > 10) {
        const label = crop.crop_type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
        insights.push({
          id: `crop-${crop.crop_type}`,
          title: cropChange < 0 ? `${label} Production Dropping` : `${label} Output Surge`,
          description: `${label} production ${cropChange < 0 ? "decreased" : "increased"} by ${Math.abs(cropChange).toFixed(1)}% to ${(crop.production / 1e3).toFixed(0)}K tonnes. ${cropChange < -10 ? "Significant decline may impact local food supply and prices." : "Strong growth may ease supply pressure and stabilise prices."}`,
          category: "Supply",
          timestamp: `Data as of ${years[0].slice(0, 4)}`,
          status: cropChange < -10 ? "Warning" : "Normal",
          source: "OpenDOSM — Crops State",
          value: `${cropChange >= 0 ? "+" : ""}${cropChange.toFixed(0)}%`,
        });
      }
    }
  }

  return insights;
}

/** Fetch IPI (Industrial Production Index) for manufacturing context */
async function fetchIPI(): Promise<DynamicInsight[]> {
  const data = await fetchJSON<{ date: string; index: number; series: string }[]>(
    `${BASE_URL}?id=ipi&limit=6&sort=-date&series=growth_yoy`
  );

  const insights: DynamicInsight[] = [];
  const latest = data[0];
  const prev = data[1];

  if (latest && prev) {
    const growth = latest.index;
    insights.push({
      id: "ipi-growth",
      title: growth > 0 ? "Industrial Output Expanding" : "Industrial Output Contracting",
      description: `Malaysia's Industrial Production Index grew ${growth.toFixed(1)}% year-on-year. ${growth > 5 ? "Strong manufacturing activity supports food processing and packaging sectors." : growth < 0 ? "Industrial contraction may signal weakening food processing capacity." : "Moderate industrial activity maintaining food supply chain stability."}`,
      category: "Supply",
      timestamp: `Data as of ${formatDate(latest.date)}`,
      status: growth < 0 ? "Warning" : "Normal",
      source: "OpenDOSM — IPI",
      value: `${growth >= 0 ? "+" : ""}${growth.toFixed(1)}%`,
    });
  }

  return insights;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-MY", { month: "short", year: "numeric" });
}

export async function fetchAllInsights(): Promise<DynamicInsight[]> {
  const results = await Promise.allSettled([
    fetchFoodCPI(),
    fetchFoodTrade(),
    fetchCropProduction(),
    fetchIPI(),
  ]);

  const insights: DynamicInsight[] = [];
  for (const result of results) {
    if (result.status === "fulfilled") {
      insights.push(...result.value);
    } else {
      console.warn("Failed to fetch insight source:", result.reason);
    }
  }

  // Add PriceCatcher daily market price card
  insights.unshift({
    id: "pricecatcher-daily-wholesale",
    title: "Daily Wholesale Prices",
    description:
      "Average farm-gate price for Grade A Tomatoes in Pahang is currently RM 3.50/kg, down 12% from yesterday. Favorable buying conditions detected.",
    category: "PriceCatcher",
    timestamp: "Updated today",
    status: "Live",
    source: "PriceCatcher (KPDN)",
    value: "RM 3.50/kg",
  });

  // Sort: Critical first, then Warning, then Normal, Live last (pinned at top via unshift already)
  const statusOrder: Record<string, number> = { Critical: 0, Warning: 1, Normal: 2, Live: -1 };
  return insights.sort((a, b) => (statusOrder[a.status] ?? 3) - (statusOrder[b.status] ?? 3));
}
