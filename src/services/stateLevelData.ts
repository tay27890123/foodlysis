import type { StateStatus } from "@/components/MalaysiaMap";

const BASE_URL = "https://api.data.gov.my/opendosm/";

// ── Types ──────────────────────────────────────────────────────────────────────

export type DataLayer = "production" | "cpi" | "surplus" | "ssl" | "weather";

export type WeatherRisk = "normal" | "advisory" | "warning" | "danger";

export type FoodCategory = "crops" | "livestock" | "fisheries" | "dairy" | "fruitsVeg" | "processed";

export interface CategoryMetrics {
  production: number; // tonnes
  demand: number;     // tonnes
}

export const FOOD_CATEGORIES: { id: FoodCategory; label: string; icon: string }[] = [
  { id: "crops", label: "Crops & Grains", icon: "🌾" },
  { id: "livestock", label: "Livestock & Poultry", icon: "🐄" },
  { id: "fisheries", label: "Fisheries & Aquaculture", icon: "🐟" },
  { id: "dairy", label: "Dairy & Eggs", icon: "🥚" },
  { id: "fruitsVeg", label: "Fruits & Vegetables", icon: "🥬" },
  { id: "processed", label: "Processed Food", icon: "🏭" },
];

export interface StateMetrics {
  id: string;
  name: string;
  production: number;        // total tonnes (sum of categories)
  demand: number;             // total tonnes
  cpiIndex: number;
  cpiChange: number;
  surplusListings: number;
  mainCrops: string[];        // key commodities across all categories
  notes: string;
  status: StateStatus;
  weatherRisk: WeatherRisk;
  weatherLabel: string;
  categories: Record<FoodCategory, CategoryMetrics>;
}

interface CropRecord {
  date: string;
  state: string;
  crop_type: string;
  production: number;
  planted_area: number;
}

// ── State name mapping ─────────────────────────────────────────────────────────

const STATE_ID_MAP: Record<string, string> = {
  "Perlis": "perlis",
  "Kedah": "kedah",
  "Pulau Pinang": "penang",
  "Perak": "perak",
  "Kelantan": "kelantan",
  "Terengganu": "terengganu",
  "Pahang": "pahang",
  "Selangor": "selangor",
  "W.P. Kuala Lumpur": "kl",
  "Negeri Sembilan": "negeriSembilan",
  "Melaka": "melaka",
  "Johor": "johor",
  "Sabah": "sabah",
  "Sarawak": "sarawak",
  "W.P. Labuan": "labuan",
};

// ── Fallback / mock data ───────────────────────────────────────────────────────

function cat(crops: number, cropsDem: number, livestock: number, livestockDem: number, fish: number, fishDem: number, dairy: number, dairyDem: number, fv: number, fvDem: number, proc: number, procDem: number): Record<FoodCategory, CategoryMetrics> {
  return {
    crops: { production: crops, demand: cropsDem },
    livestock: { production: livestock, demand: livestockDem },
    fisheries: { production: fish, demand: fishDem },
    dairy: { production: dairy, demand: dairyDem },
    fruitsVeg: { production: fv, demand: fvDem },
    processed: { production: proc, demand: procDem },
  };
}

const MOCK_STATE_DATA: StateMetrics[] = [
  { id: "perlis", name: "Perlis", production: 520, demand: 480, cpiIndex: 132.1, cpiChange: 0.3, surplusListings: 4, mainCrops: ["Rice", "Sugar Cane", "Chicken", "Freshwater Fish"], notes: "Small state with balanced food supply across categories.", status: "balanced", weatherRisk: "normal", weatherLabel: "Clear skies",
    categories: cat(180, 140, 90, 85, 60, 55, 40, 50, 100, 100, 50, 50) },
  { id: "kedah", name: "Kedah", production: 6200, demand: 3800, cpiIndex: 128.4, cpiChange: -0.1, surplusListings: 23, mainCrops: ["Rice", "Rubber", "Chicken", "Tilapia", "Vegetables"], notes: "Malaysia's rice bowl with strong livestock sector.", status: "surplus", weatherRisk: "advisory", weatherLabel: "Thunderstorm advisory",
    categories: cat(3200, 1400, 1100, 800, 650, 500, 250, 300, 700, 500, 300, 300) },
  { id: "penang", name: "Penang", production: 680, demand: 1800, cpiIndex: 138.7, cpiChange: 1.8, surplusListings: 2, mainCrops: ["Vegetables", "Prawns", "Processed Seafood"], notes: "High urban demand — relies on interstate supply for most categories.", status: "shortage", weatherRisk: "normal", weatherLabel: "Partly cloudy",
    categories: cat(80, 350, 120, 380, 180, 400, 60, 200, 140, 320, 100, 150) },
  { id: "perak", name: "Perak", production: 5400, demand: 3600, cpiIndex: 130.2, cpiChange: 0.4, surplusListings: 18, mainCrops: ["Palm Oil", "Vegetables", "Fruits", "Freshwater Fish", "Poultry"], notes: "Diversified agri output — strong in fisheries and fruits.", status: "surplus", weatherRisk: "normal", weatherLabel: "Fair weather",
    categories: cat(1800, 1000, 900, 700, 800, 500, 200, 300, 1200, 800, 500, 300) },
  { id: "kelantan", name: "Kelantan", production: 2800, demand: 3200, cpiIndex: 136.5, cpiChange: 2.1, surplusListings: 5, mainCrops: ["Rice", "Tobacco", "Cattle", "River Fish"], notes: "Flood risk disrupts livestock and fisheries supply chains.", status: "warning", weatherRisk: "danger", weatherLabel: "Heavy rain & flood warning",
    categories: cat(1200, 900, 500, 700, 350, 500, 150, 300, 400, 500, 200, 300) },
  { id: "terengganu", name: "Terengganu", production: 2000, demand: 2200, cpiIndex: 134.8, cpiChange: 1.5, surplusListings: 3, mainCrops: ["Fish", "Rice", "Prawns", "Goat"], notes: "Strong marine fisheries but monsoon disrupts seasonal supply.", status: "warning", weatherRisk: "warning", weatherLabel: "Heavy rain warning",
    categories: cat(500, 500, 350, 400, 600, 400, 100, 200, 300, 450, 150, 250) },
  { id: "pahang", name: "Pahang", production: 6000, demand: 3400, cpiIndex: 129.1, cpiChange: 0.2, surplusListings: 15, mainCrops: ["Palm Oil", "Durian", "Rubber", "Cattle", "Freshwater Fish"], notes: "Large agri base — durian export boom lifts fruits category.", status: "surplus", weatherRisk: "advisory", weatherLabel: "Scattered showers",
    categories: cat(1500, 800, 1000, 600, 700, 400, 300, 300, 1800, 900, 700, 400) },
  { id: "selangor", name: "Selangor", production: 3200, demand: 7500, cpiIndex: 140.3, cpiChange: 2.4, surplusListings: 8, mainCrops: ["Vegetables", "Poultry", "Eggs", "Processed Food"], notes: "Major population center — deficit across most categories.", status: "shortage", weatherRisk: "normal", weatherLabel: "Clear skies",
    categories: cat(400, 1500, 800, 1800, 300, 1200, 500, 900, 700, 1200, 500, 900) },
  { id: "kl", name: "KL", production: 150, demand: 4500, cpiIndex: 142.6, cpiChange: 2.8, surplusListings: 1, mainCrops: ["Processed Food"], notes: "Fully dependent on imports — some processed food manufacturing.", status: "shortage", weatherRisk: "normal", weatherLabel: "Partly cloudy",
    categories: cat(10, 800, 20, 1200, 10, 600, 10, 500, 20, 800, 80, 600) },
  { id: "negeriSembilan", name: "N. Sembilan", production: 2800, demand: 2400, cpiIndex: 131.0, cpiChange: 0.5, surplusListings: 10, mainCrops: ["Palm Oil", "Rubber", "Poultry", "Eggs", "Vegetables"], notes: "Self-sufficient with growing poultry and dairy sector.", status: "balanced", weatherRisk: "normal", weatherLabel: "Fair weather",
    categories: cat(800, 600, 650, 500, 350, 300, 300, 250, 500, 550, 200, 200) },
  { id: "melaka", name: "Melaka", production: 1200, demand: 1100, cpiIndex: 130.5, cpiChange: 0.4, surplusListings: 6, mainCrops: ["Pineapple", "Fish", "Poultry", "Processed Seafood"], notes: "Tourism-driven demand balanced by diverse local production.", status: "balanced", weatherRisk: "normal", weatherLabel: "Clear skies",
    categories: cat(250, 200, 250, 220, 250, 230, 100, 120, 200, 200, 150, 130) },
  { id: "johor", name: "Johor", production: 7500, demand: 5200, cpiIndex: 131.8, cpiChange: 0.6, surplusListings: 28, mainCrops: ["Palm Oil", "Pineapple", "Poultry", "Aquaculture", "Processed Food"], notes: "Major food exporter to Singapore — strong across all categories.", status: "surplus", weatherRisk: "advisory", weatherLabel: "Thunderstorm advisory",
    categories: cat(2200, 1200, 1500, 1000, 1200, 800, 500, 500, 1300, 900, 800, 800) },
  { id: "sabah", name: "Sabah", production: 5500, demand: 4800, cpiIndex: 135.2, cpiChange: 1.7, surplusListings: 12, mainCrops: ["Palm Oil", "Cocoa", "Rice", "Marine Fish", "Cattle"], notes: "Rich resources but logistics costs create local shortages.", status: "warning", weatherRisk: "warning", weatherLabel: "Strong winds warning",
    categories: cat(1500, 1200, 1000, 900, 1200, 1000, 200, 400, 1100, 900, 500, 400) },
  { id: "sarawak", name: "Sarawak", production: 5800, demand: 3600, cpiIndex: 129.8, cpiChange: 0.3, surplusListings: 16, mainCrops: ["Palm Oil", "Pepper", "Rice", "Freshwater Fish", "Poultry"], notes: "Largest state — strong agri output with growing aquaculture.", status: "surplus", weatherRisk: "normal", weatherLabel: "Fair weather",
    categories: cat(1800, 900, 1000, 700, 1100, 600, 200, 300, 1200, 700, 500, 400) },
  { id: "labuan", name: "Labuan", production: 80, demand: 200, cpiIndex: 137.4, cpiChange: 1.9, surplusListings: 0, mainCrops: ["Marine Fish"], notes: "Island territory — marine fisheries only significant local production.", status: "shortage", weatherRisk: "normal", weatherLabel: "Clear skies",
    categories: cat(5, 30, 5, 40, 50, 50, 2, 20, 10, 40, 8, 20) },
];

// ── Fetch state-level crop data ────────────────────────────────────────────────

async function fetchStateCrops(): Promise<Map<string, number>> {
  try {
    const data = await fetch(
      `${BASE_URL}?id=crops_state&limit=200&sort=-date`
    ).then((r) => r.ok ? r.json() as Promise<CropRecord[]> : Promise.reject());

    // Get latest year
    const years = [...new Set(data.map((r) => r.date))].sort().reverse();
    const latestYear = years[0];
    const latestData = data.filter((r) => r.date === latestYear && r.state !== "Malaysia");

    const stateProduction = new Map<string, number>();
    for (const r of latestData) {
      const stateId = STATE_ID_MAP[r.state];
      if (!stateId) continue;
      stateProduction.set(stateId, (stateProduction.get(stateId) || 0) + r.production);
    }
    return stateProduction;
  } catch {
    return new Map();
  }
}

// ── Main fetch function ────────────────────────────────────────────────────────

export async function fetchStateMetrics(): Promise<StateMetrics[]> {
  const liveProduction = await fetchStateCrops();

  // Merge live data into mock base
  return MOCK_STATE_DATA.map((state) => {
    const liveProd = liveProduction.get(state.id);
    const production = liveProd ? Math.round(liveProd / 1000) : state.production; // convert to approx tonnes

    // Recalculate status based on live data
    const ratio = production / state.demand;
    let status: StateStatus = state.status;
    if (liveProd) {
      if (ratio >= 1.3) status = "surplus";
      else if (ratio >= 0.9) status = "balanced";
      else if (ratio >= 0.7) status = "warning";
      else status = "shortage";
    }

    // Determine status from CPI for warning zones
    if (state.cpiChange > 2.0 && status !== "shortage") {
      status = "warning";
    }

    return { ...state, production, status };
  });
}

// ── Choropleth intensity calculation ───────────────────────────────────────────

const WEATHER_RISK_VALUE: Record<WeatherRisk, number> = { normal: 0, advisory: 1, warning: 2, danger: 3 };

export function getChoroplethValue(state: StateMetrics, layer: DataLayer): number {
  switch (layer) {
    case "production":
      return state.production;
    case "cpi":
      return state.cpiIndex;
    case "surplus":
      return state.surplusListings;
    case "ssl":
      return state.demand > 0 ? (state.production / state.demand) * 100 : 0;
    case "weather":
      return WEATHER_RISK_VALUE[state.weatherRisk];
  }
}

export function getChoroplethColor(value: number, min: number, max: number, layer: DataLayer): { fill: string; stroke: string } {
  const t = max === min ? 0.5 : (value - min) / (max - min);

  switch (layer) {
    case "production": {
      const l = 20 + t * 30;
      const s = 40 + t * 25;
      return {
        fill: `hsl(152 ${s}% ${l}% / 0.45)`,
        stroke: `hsl(152 ${s + 10}% ${l + 15}% / 0.85)`,
      };
    }
    case "cpi": {
      const hue = 152 - t * 152;
      return {
        fill: `hsl(${hue} 65% 35% / 0.45)`,
        stroke: `hsl(${hue} 65% 50% / 0.85)`,
      };
    }
    case "surplus": {
      const l = 18 + t * 28;
      return {
        fill: `hsl(165 55% ${l}% / 0.45)`,
        stroke: `hsl(165 55% ${l + 18}% / 0.85)`,
      };
    }
    case "ssl": {
      const hue = t < 0.5 ? t * 2 * 50 : 50 + (t - 0.5) * 2 * 102;
      return {
        fill: `hsl(${hue} 60% 30% / 0.45)`,
        stroke: `hsl(${hue} 60% 48% / 0.85)`,
      };
    }
    case "weather": {
      // 0=normal(green), 1=advisory(blue), 2=warning(amber), 3=danger(red)
      const hues = [152, 210, 40, 0];
      const idx = Math.round(value);
      const hue = hues[Math.min(idx, 3)];
      const pulse = idx >= 2;
      return {
        fill: `hsl(${hue} ${pulse ? 70 : 55}% ${pulse ? 35 : 28}% / ${pulse ? 0.55 : 0.4})`,
        stroke: `hsl(${hue} 70% ${pulse ? 55 : 45}% / 0.9)`,
      };
    }
  }
}

export function getLayerMetricLabel(state: StateMetrics, layer: DataLayer): string {
  switch (layer) {
    case "production":
      return `${state.production.toLocaleString()} t`;
    case "cpi":
      return `CPI ${state.cpiIndex.toFixed(1)} (${state.cpiChange >= 0 ? "+" : ""}${state.cpiChange.toFixed(1)}%)`;
    case "surplus":
      return `${state.surplusListings} listings`;
    case "ssl": {
      const ssl = state.demand > 0 ? (state.production / state.demand) * 100 : 0;
      return `SSL ${ssl.toFixed(1)}%`;
    }
    case "weather":
      return state.weatherLabel;
  }
}

export const WEATHER_RISK_CONFIG: Record<WeatherRisk, { label: string; color: string; icon: string }> = {
  normal: { label: "Normal", color: "hsl(152 60% 42%)", icon: "☀️" },
  advisory: { label: "Advisory", color: "hsl(210 60% 50%)", icon: "🌦️" },
  warning: { label: "Warning", color: "hsl(40 85% 55%)", icon: "⛈️" },
  danger: { label: "Danger", color: "hsl(0 72% 51%)", icon: "🌊" },
};
