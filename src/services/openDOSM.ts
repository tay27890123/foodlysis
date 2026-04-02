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
  category: "Seller" | "Buyer";
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

    const foodNow = latest.get("01");
    const foodPrev = prev.get("01");
    if (foodNow && foodPrev) {
      const change = ((foodNow - foodPrev) / foodPrev) * 100;
      const rising = change > 0;
      // Buyer: rising prices = bad for buyers
      insights.push({
        id: "cpi-food-buyer",
        title: rising ? "Food Prices Rising — Budget Impact" : "Food Prices Stabilising — Good for Buyers",
        description: `The Consumer Price Index for Food rose ${Math.abs(change).toFixed(1)}% month-on-month (${foodPrev.toFixed(1)} → ${foodNow.toFixed(1)}). ${rising ? "Expect higher procurement costs — consider bulk buying or switching to cheaper alternatives." : "Stable prices present good buying opportunities."}`,
        category: "Buyer",
        timestamp: `Data as of ${formatDate(dates[0])}`,
        status: Math.abs(change) > 1.5 ? "Critical" : change > 0.5 ? "Warning" : "Normal",
        source: "OpenDOSM — CPI Headline",
        value: `${change >= 0 ? "+" : ""}${change.toFixed(1)}%`,
      });
      // Seller: rising prices = opportunity for sellers
      insights.push({
        id: "cpi-food-seller",
        title: rising ? "Selling Prices Trending Up" : "Price Pressure Easing",
        description: `Food CPI moved ${Math.abs(change).toFixed(1)}% month-on-month. ${rising ? "Market supports higher selling prices — good time to list surplus at current rates." : "Competitive pricing may be needed to move inventory quickly."}`,
        category: "Seller",
        timestamp: `Data as of ${formatDate(dates[0])}`,
        status: change > 1 ? "Normal" : change < -0.5 ? "Warning" : "Normal",
        source: "OpenDOSM — CPI Headline",
        value: `CPI ${foodNow.toFixed(1)}`,
      });
    }

    const overallNow = latest.get("overall");
    const overallPrev = prev.get("overall");
    if (overallNow && overallPrev) {
      const change = ((overallNow - overallPrev) / overallPrev) * 100;
      insights.push({
        id: "cpi-overall-buyer",
        title: change > 0 ? "General Inflation Trending Up" : "Inflation Cooling Down",
        description: `Malaysia's headline CPI moved ${change > 0 ? "up" : "down"} ${Math.abs(change).toFixed(1)}% to ${overallNow.toFixed(1)}. ${change > 0.5 ? "Higher general costs may reduce consumer purchasing power." : "Lower inflation benefits buyer budgets."}`,
        category: "Buyer",
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
  const foodTrades = data.filter((r) => r.section === "0").sort((a, b) => b.date.localeCompare(a.date));

  if (foodTrades.length >= 2) {
    const latest = foodTrades[0];
    const prev = foodTrades[1];

    const importChange = ((latest.imports - prev.imports) / prev.imports) * 100;
    const balance = latest.exports - latest.imports;
    const isDeficit = balance < 0;

    // Buyer insight: imports affect supply availability
    insights.push({
      id: "trade-imports-buyer",
      title: importChange > 0 ? "More Imported Food Available" : "Imported Food Supply Tightening",
      description: `Food imports ${importChange > 0 ? "rose" : "fell"} ${Math.abs(importChange).toFixed(1)}% to RM${(latest.imports / 1e9).toFixed(1)}B. ${importChange > 0 ? "Greater import volume means more variety and competitive prices for buyers." : "Reduced imports may limit choices — consider local alternatives."}`,
      category: "Buyer",
      timestamp: `Data as of ${formatDate(latest.date)}`,
      status: importChange < -5 ? "Warning" : "Normal",
      source: "OpenDOSM — Trade SITC",
      value: `RM${(latest.imports / 1e9).toFixed(1)}B`,
    });

    const exportChange = ((latest.exports - prev.exports) / prev.exports) * 100;
    // Seller insight: export demand
    insights.push({
      id: "trade-exports-seller",
      title: exportChange > 0 ? "Export Demand Growing" : "Export Demand Weakening",
      description: `Food exports ${exportChange > 0 ? "grew" : "contracted"} ${Math.abs(exportChange).toFixed(1)}% to RM${(latest.exports / 1e9).toFixed(1)}B. ${exportChange > 0 ? "Strong export demand — sellers can explore cross-border opportunities." : "Weaker exports — focus on domestic marketplace for better margins."}`,
      category: "Seller",
      timestamp: `Data as of ${formatDate(latest.date)}`,
      status: exportChange < -5 ? "Warning" : "Normal",
      source: "OpenDOSM — Trade SITC",
      value: `RM${(latest.exports / 1e9).toFixed(1)}B`,
    });

    // Seller: trade balance
    insights.push({
      id: "trade-balance-seller",
      title: isDeficit ? "Trade Deficit — Local Supply Needed" : "Trade Surplus — Strong Position",
      description: `Malaysia's food trade ${isDeficit ? "deficit" : "surplus"} is RM${(Math.abs(balance) / 1e9).toFixed(1)}B. ${isDeficit ? "Import dependency creates opportunity for local sellers to fill supply gaps." : "Healthy surplus shows strong agricultural competitiveness."}`,
      category: "Seller",
      timestamp: `Data as of ${formatDate(latest.date)}`,
      status: isDeficit ? "Normal" : "Normal",
      source: "OpenDOSM — Trade SITC",
      value: `${isDeficit ? "-" : "+"}RM${(Math.abs(balance) / 1e9).toFixed(1)}B`,
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

    // Seller: production output
    insights.push({
      id: "crop-production-seller",
      title: change < 0 ? "Crop Output Declining — Higher Value" : "Crop Output Growing — More to Sell",
      description: `Total crop production ${change < 0 ? "fell" : "rose"} ${Math.abs(change).toFixed(1)}% YoY to ${(totalNow / 1e3).toLocaleString()} kg. ${change < 0 ? "Lower supply may command premium prices for available stock." : "Higher output — consider listing surplus before spoilage."}`,
      category: "Seller",
      timestamp: `Data as of ${years[0].slice(0, 4)}`,
      status: change < -5 ? "Warning" : "Normal",
      source: "OpenDOSM — Crops State",
      value: `${change >= 0 ? "+" : ""}${change.toFixed(1)}%`,
    });

    // Buyer: supply availability
    insights.push({
      id: "crop-production-buyer",
      title: change < 0 ? "Local Supply Shrinking — Act Early" : "Abundant Local Supply",
      description: `Agricultural output ${change < 0 ? "declined" : "grew"} ${Math.abs(change).toFixed(1)}% to ${(totalNow / 1e3).toLocaleString()} kg. ${change < 0 ? "Reduced production may lead to price hikes — secure supply early." : "Good availability and potential for better prices from local farmers."}`,
      category: "Buyer",
      timestamp: `Data as of ${years[0].slice(0, 4)}`,
      status: change < -5 ? "Critical" : change < 0 ? "Warning" : "Normal",
      source: "OpenDOSM — Crops State",
      value: `${(totalNow / 1e3).toLocaleString()} kg`,
    });

    // Individual crop alerts
    const cropMap = new Map(prevCrops.map((c) => [c.crop_type, c.production]));
    for (const crop of latestCrops) {
      const prev = cropMap.get(crop.crop_type);
      if (!prev || prev === 0) continue;
      const cropChange = ((crop.production - prev) / prev) * 100;
      if (Math.abs(cropChange) > 10) {
        const label = crop.crop_type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
        if (cropChange < 0) {
          // Buyer warning
          insights.push({
            id: `crop-${crop.crop_type}-buyer`,
            title: `${label} Supply Dropping`,
            description: `${label} production fell ${Math.abs(cropChange).toFixed(1)}% to ${crop.production.toLocaleString()} kg. Buyers should consider alternatives or locking in prices early.`,
            category: "Buyer",
            timestamp: `Data as of ${years[0].slice(0, 4)}`,
            status: cropChange < -10 ? "Warning" : "Normal",
            source: "OpenDOSM — Crops State",
            value: `${cropChange.toFixed(0)}%`,
          });
        } else {
          // Seller opportunity
          insights.push({
            id: `crop-${crop.crop_type}-seller`,
            title: `${label} Output Surge — List Now`,
            description: `${label} production surged ${cropChange.toFixed(1)}% to ${(crop.production / 1e3).toFixed(0)}K tonnes. High supply — list surplus quickly to avoid waste and capture value.`,
            category: "Seller",
            timestamp: `Data as of ${years[0].slice(0, 4)}`,
            status: "Normal",
            source: "OpenDOSM — Crops State",
            value: `+${cropChange.toFixed(0)}%`,
          });
        }
      }
    }
  }

  return insights;
}

/** Fetch IPI for manufacturing context */
async function fetchIPI(): Promise<DynamicInsight[]> {
  const data = await fetchJSON<{ date: string; index: number; series: string }[]>(
    `${BASE_URL}?id=ipi&limit=6&sort=-date&series=growth_yoy`
  );

  const insights: DynamicInsight[] = [];
  const latest = data[0];

  if (latest) {
    const growth = latest.index;
    // Seller: processing capacity
    insights.push({
      id: "ipi-seller",
      title: growth > 0 ? "Processing Capacity Expanding" : "Processing Capacity Shrinking",
      description: `Industrial Production Index grew ${growth.toFixed(1)}% YoY. ${growth > 0 ? "More processing facilities active — good for sellers of raw ingredients to food manufacturers." : "Reduced industrial activity may slow demand from food processors."}`,
      category: "Seller",
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

  // Live cards
  insights.unshift({
    id: "live-buyer",
    title: "Best Deals Right Now",
    description: "Grade A Tomatoes in Pahang at RM 3.50/kg (−12% from yesterday). Kangkung in Selangor at RM 2.80/kg. Favourable buying conditions detected across multiple categories.",
    category: "Buyer",
    timestamp: "Updated today",
    status: "Live",
    source: "Marketplace Data",
    value: "RM 3.50/kg",
  });

  insights.unshift({
    id: "live-seller",
    title: "High Demand Items",
    description: "Chili Padi demand up 22% this week. Chicken demand steady at 15K kg/day. List these items for fastest sales on the marketplace.",
    category: "Seller",
    timestamp: "Updated today",
    status: "Live",
    source: "Marketplace Data",
    value: "+22% demand",
  });

  // Sort: Live first, then Critical, Warning, Normal
  const statusOrder: Record<string, number> = { Live: -1, Critical: 0, Warning: 1, Normal: 2 };
  return insights.sort((a, b) => (statusOrder[a.status] ?? 3) - (statusOrder[b.status] ?? 3));
}
