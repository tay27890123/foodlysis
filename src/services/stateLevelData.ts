import type { StateStatus } from "@/components/MalaysiaMap";

const BASE_URL = "https://api.data.gov.my/opendosm/";

// ── Types ──────────────────────────────────────────────────────────────────────

export type DataLayer = "foodSupply" | "cpi" | "ppi" | "ssl";

export type WeatherRisk = "normal" | "advisory" | "warning" | "danger";

export type FoodCategory = "crops" | "livestock" | "fisheries" | "dairy" | "fruitsVeg" | "processed";

export interface CategoryData {
  production: number;   // tonnes
  demand: number;       // tonnes
  cpiIndex: number;
  cpiChange: number;    // month-on-month %
  ssl: number;          // self-sufficiency %
}

export interface StateMetrics {
  id: string;
  name: string;
  production: number;        // total tonnes
  demand: number;            // total tonnes
  cpiIndex: number;          // aggregate CPI food index
  cpiChange: number;         // month-on-month % change
  surplusListings: number;   // marketplace surplus items
  mainCrops: string[];
  notes: string;
  status: StateStatus;
  weatherRisk: WeatherRisk;
  weatherLabel: string;
  categories: Record<FoodCategory, CategoryData>;
}

export const FOOD_CATEGORIES: { id: FoodCategory; label: string; icon: string; color: string }[] = [
  { id: "crops", label: "Crops & Grains", icon: "🌾", color: "hsl(45 80% 55%)" },
  { id: "livestock", label: "Livestock & Poultry", icon: "🐄", color: "hsl(15 70% 50%)" },
  { id: "fisheries", label: "Fisheries & Aquaculture", icon: "🐟", color: "hsl(200 70% 50%)" },
  { id: "dairy", label: "Dairy & Eggs", icon: "🥛", color: "hsl(30 60% 60%)" },
  { id: "fruitsVeg", label: "Fruits & Vegetables", icon: "🥬", color: "hsl(130 60% 45%)" },
  { id: "processed", label: "Processed Food", icon: "🏭", color: "hsl(270 50% 55%)" },
];

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

// ── Category data generator (realistic simulated values) ───────────────────

function generateCategories(totalProd: number, totalDemand: number, cpiBase: number, cpiChange: number, profile: "agri" | "urban" | "coastal" | "mixed"): Record<FoodCategory, CategoryData> {
  // Distribution ratios vary by state profile
  const dist: Record<string, Record<FoodCategory, [number, number]>> = {
    agri:    { crops: [0.40, 0.25], livestock: [0.20, 0.20], fisheries: [0.08, 0.12], dairy: [0.07, 0.13], fruitsVeg: [0.18, 0.15], processed: [0.07, 0.15] },
    urban:   { crops: [0.05, 0.20], livestock: [0.15, 0.25], fisheries: [0.05, 0.12], dairy: [0.08, 0.15], fruitsVeg: [0.12, 0.13], processed: [0.55, 0.15] },
    coastal: { crops: [0.15, 0.20], livestock: [0.10, 0.18], fisheries: [0.40, 0.20], dairy: [0.05, 0.12], fruitsVeg: [0.15, 0.15], processed: [0.15, 0.15] },
    mixed:   { crops: [0.25, 0.22], livestock: [0.20, 0.20], fisheries: [0.15, 0.15], dairy: [0.08, 0.13], fruitsVeg: [0.20, 0.15], processed: [0.12, 0.15] },
  };
  const d = dist[profile];
  const cpiOffsets: Record<FoodCategory, number> = { crops: -2.1, livestock: 1.8, fisheries: 0.5, dairy: 3.2, fruitsVeg: -1.5, processed: 2.0 };
  const changeOffsets: Record<FoodCategory, number> = { crops: -0.3, livestock: 0.5, fisheries: 0.2, dairy: 0.8, fruitsVeg: -0.5, processed: 0.3 };

  const result = {} as Record<FoodCategory, CategoryData>;
  for (const cat of FOOD_CATEGORIES) {
    const [prodRatio, demRatio] = d[cat.id];
    const prod = Math.round(totalProd * prodRatio);
    const dem = Math.round(totalDemand * demRatio);
    const cpi = +(cpiBase + cpiOffsets[cat.id]).toFixed(1);
    const change = +(cpiChange + changeOffsets[cat.id]).toFixed(1);
    result[cat.id] = { production: prod, demand: dem, cpiIndex: cpi, cpiChange: change, ssl: dem > 0 ? +((prod / dem) * 100).toFixed(1) : 0 };
  }
  return result;
}

// ── Fallback / mock data ───────────────────────────────────────────────────────

const PROFILES: Record<string, "agri" | "urban" | "coastal" | "mixed"> = {
  perlis: "agri", kedah: "agri", penang: "urban", perak: "mixed", kelantan: "coastal",
  terengganu: "coastal", pahang: "agri", selangor: "urban", kl: "urban",
  negeriSembilan: "mixed", melaka: "coastal", johor: "mixed", sabah: "mixed", sarawak: "agri", labuan: "coastal",
};

const MOCK_BASE: Omit<StateMetrics, "categories">[] = [
  { id: "perlis", name: "Perlis", production: 320, demand: 300, cpiIndex: 132.1, cpiChange: 0.3, surplusListings: 4, mainCrops: ["Rice", "Sugar Cane"], notes: "Stable rice output.", status: "balanced", weatherRisk: "normal", weatherLabel: "Clear skies" },
  { id: "kedah", name: "Kedah", production: 4800, demand: 2900, cpiIndex: 128.4, cpiChange: -0.1, surplusListings: 23, mainCrops: ["Rice", "Rubber"], notes: "Major rice bowl — surplus exported.", status: "surplus", weatherRisk: "advisory", weatherLabel: "Thunderstorm advisory" },
  { id: "penang", name: "Penang", production: 280, demand: 1200, cpiIndex: 138.7, cpiChange: 1.8, surplusListings: 2, mainCrops: ["Vegetables"], notes: "High urban demand outstrips local production.", status: "shortage", weatherRisk: "normal", weatherLabel: "Partly cloudy" },
  { id: "perak", name: "Perak", production: 3600, demand: 2800, cpiIndex: 130.2, cpiChange: 0.4, surplusListings: 18, mainCrops: ["Palm Oil", "Vegetables", "Fruits"], notes: "Strong palm oil and vegetable output.", status: "surplus", weatherRisk: "normal", weatherLabel: "Fair weather" },
  { id: "kelantan", name: "Kelantan", production: 1800, demand: 2100, cpiIndex: 136.5, cpiChange: 2.1, surplusListings: 5, mainCrops: ["Rice", "Tobacco"], notes: "Flood risk affecting monsoon rice crop.", status: "warning", weatherRisk: "danger", weatherLabel: "Heavy rain & flood warning" },
  { id: "terengganu", name: "Terengganu", production: 1200, demand: 1500, cpiIndex: 134.8, cpiChange: 1.5, surplusListings: 3, mainCrops: ["Fish", "Rice"], notes: "East coast monsoon disrupting supply chains.", status: "warning", weatherRisk: "warning", weatherLabel: "Heavy rain warning" },
  { id: "pahang", name: "Pahang", production: 4200, demand: 2400, cpiIndex: 129.1, cpiChange: 0.2, surplusListings: 15, mainCrops: ["Palm Oil", "Durian", "Rubber"], notes: "Large agricultural base with durian export boom.", status: "surplus", weatherRisk: "advisory", weatherLabel: "Scattered showers" },
  { id: "selangor", name: "Selangor", production: 1500, demand: 5800, cpiIndex: 140.3, cpiChange: 2.4, surplusListings: 8, mainCrops: ["Vegetables", "Poultry"], notes: "Densely populated — relies on inter-state supply.", status: "shortage", weatherRisk: "normal", weatherLabel: "Clear skies" },
  { id: "kl", name: "KL", production: 50, demand: 3200, cpiIndex: 142.6, cpiChange: 2.8, surplusListings: 1, mainCrops: [], notes: "Fully dependent on imports from neighbouring states.", status: "shortage", weatherRisk: "normal", weatherLabel: "Partly cloudy" },
  { id: "negeriSembilan", name: "N. Sembilan", production: 1800, demand: 1600, cpiIndex: 131.0, cpiChange: 0.5, surplusListings: 10, mainCrops: ["Palm Oil", "Rubber"], notes: "Self-sufficient with moderate palm oil.", status: "balanced", weatherRisk: "normal", weatherLabel: "Fair weather" },
  { id: "melaka", name: "Melaka", production: 800, demand: 750, cpiIndex: 130.5, cpiChange: 0.4, surplusListings: 6, mainCrops: ["Pineapple", "Fish"], notes: "Tourism-driven demand met by local produce.", status: "balanced", weatherRisk: "normal", weatherLabel: "Clear skies" },
  { id: "johor", name: "Johor", production: 5200, demand: 3800, cpiIndex: 131.8, cpiChange: 0.6, surplusListings: 28, mainCrops: ["Palm Oil", "Pineapple", "Poultry"], notes: "Major exporter to Singapore.", status: "surplus", weatherRisk: "advisory", weatherLabel: "Thunderstorm advisory" },
  { id: "sabah", name: "Sabah", production: 3800, demand: 3500, cpiIndex: 135.2, cpiChange: 1.7, surplusListings: 12, mainCrops: ["Palm Oil", "Cocoa", "Rice"], notes: "Logistics costs create pockets of shortage.", status: "warning", weatherRisk: "warning", weatherLabel: "Strong winds warning" },
  { id: "sarawak", name: "Sarawak", production: 4100, demand: 2600, cpiIndex: 129.8, cpiChange: 0.3, surplusListings: 16, mainCrops: ["Palm Oil", "Pepper", "Rice"], notes: "Largest state with strong agri output.", status: "surplus", weatherRisk: "normal", weatherLabel: "Fair weather" },
  { id: "labuan", name: "Labuan", production: 30, demand: 120, cpiIndex: 137.4, cpiChange: 1.9, surplusListings: 0, mainCrops: [], notes: "Island territory — fully import-dependent.", status: "shortage", weatherRisk: "normal", weatherLabel: "Clear skies" },
];

const MOCK_STATE_DATA: StateMetrics[] = MOCK_BASE.map((s) => ({
  ...s,
  categories: generateCategories(s.production, s.demand, s.cpiIndex, s.cpiChange, PROFILES[s.id] || "mixed"),
}));

// ── Fetch state-level crop data ────────────────────────────────────────────────

async function fetchStateCrops(): Promise<Map<string, number>> {
  try {
    const data = await fetch(
      `${BASE_URL}?id=crops_state&limit=200&sort=-date`
    ).then((r) => r.ok ? r.json() as Promise<CropRecord[]> : Promise.reject());

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

  return MOCK_STATE_DATA.map((state) => {
    const liveProd = liveProduction.get(state.id);
    const production = liveProd ? Math.round(liveProd / 1000) : state.production;

    const ratio = production / state.demand;
    let status: StateStatus = state.status;
    if (liveProd) {
      if (ratio >= 1.3) status = "surplus";
      else if (ratio >= 0.9) status = "balanced";
      else if (ratio >= 0.7) status = "warning";
      else status = "shortage";
    }

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
    case "foodSupply":
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
    case "foodSupply": {
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
    case "foodSupply":
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

// ── Layer-specific summary cards ───────────────────────────────────────────────

export interface SummaryCard {
  key: string;
  label: string;
  count: number;
  fill: string;
  stroke: string;
  icon: string;
}

export function getLayerSummaryCards(states: StateMetrics[], layer: DataLayer): SummaryCard[] {
  switch (layer) {
    case "foodSupply":
      return [
        { key: "surplus", label: "Surplus", count: states.filter(s => s.status === "surplus").length, fill: "hsl(152 60% 42% / 0.35)", stroke: "hsl(152 60% 55%)", icon: "📈" },
        { key: "balanced", label: "Balanced", count: states.filter(s => s.status === "balanced").length, fill: "hsl(210 60% 50% / 0.3)", stroke: "hsl(210 60% 60%)", icon: "⚖️" },
        { key: "warning", label: "Warning", count: states.filter(s => s.status === "warning").length, fill: "hsl(40 85% 55% / 0.3)", stroke: "hsl(40 85% 60%)", icon: "⚠️" },
        { key: "shortage", label: "Shortage", count: states.filter(s => s.status === "shortage").length, fill: "hsl(0 72% 51% / 0.3)", stroke: "hsl(0 72% 58%)", icon: "📉" },
      ];
    case "cpi": {
      const low = states.filter(s => s.cpiIndex < 130).length;
      const mod = states.filter(s => s.cpiIndex >= 130 && s.cpiIndex < 135).length;
      const high = states.filter(s => s.cpiIndex >= 135 && s.cpiIndex < 140).length;
      const crit = states.filter(s => s.cpiIndex >= 140).length;
      return [
        { key: "low", label: "Low (<130)", count: low, fill: "hsl(152 55% 35% / 0.4)", stroke: "hsl(152 55% 50%)", icon: "💚" },
        { key: "moderate", label: "Moderate", count: mod, fill: "hsl(100 45% 40% / 0.35)", stroke: "hsl(100 45% 55%)", icon: "💛" },
        { key: "high", label: "High (135+)", count: high, fill: "hsl(30 70% 45% / 0.35)", stroke: "hsl(30 70% 55%)", icon: "🔶" },
        { key: "critical", label: "Critical (140+)", count: crit, fill: "hsl(0 65% 45% / 0.35)", stroke: "hsl(0 65% 55%)", icon: "🔴" },
      ];
    }
    case "ssl": {
      const high = states.filter(s => { const ssl = s.demand > 0 ? (s.production / s.demand) * 100 : 0; return ssl >= 100; }).length;
      const adequate = states.filter(s => { const ssl = s.demand > 0 ? (s.production / s.demand) * 100 : 0; return ssl >= 70 && ssl < 100; }).length;
      const low = states.filter(s => { const ssl = s.demand > 0 ? (s.production / s.demand) * 100 : 0; return ssl >= 40 && ssl < 70; }).length;
      const critical = states.filter(s => { const ssl = s.demand > 0 ? (s.production / s.demand) * 100 : 0; return ssl < 40; }).length;
      return [
        { key: "high", label: "Self-Sufficient", count: high, fill: "hsl(152 60% 35% / 0.4)", stroke: "hsl(152 60% 50%)", icon: "🟢" },
        { key: "adequate", label: "Adequate (70%+)", count: adequate, fill: "hsl(80 50% 40% / 0.35)", stroke: "hsl(80 50% 55%)", icon: "🟡" },
        { key: "low", label: "Low (40-70%)", count: low, fill: "hsl(30 65% 45% / 0.35)", stroke: "hsl(30 65% 55%)", icon: "🟠" },
        { key: "critical", label: "Critical (<40%)", count: critical, fill: "hsl(0 70% 45% / 0.35)", stroke: "hsl(0 70% 55%)", icon: "🔴" },
      ];
    }
    case "weather": {
      const normal = states.filter(s => s.weatherRisk === "normal").length;
      const advisory = states.filter(s => s.weatherRisk === "advisory").length;
      const warning = states.filter(s => s.weatherRisk === "warning").length;
      const danger = states.filter(s => s.weatherRisk === "danger").length;
      return [
        { key: "normal", label: "Clear", count: normal, fill: "hsl(152 55% 35% / 0.4)", stroke: "hsl(152 55% 50%)", icon: "☀️" },
        { key: "advisory", label: "Advisory", count: advisory, fill: "hsl(210 60% 45% / 0.35)", stroke: "hsl(210 60% 55%)", icon: "🌦️" },
        { key: "warning", label: "Warning", count: warning, fill: "hsl(40 80% 50% / 0.35)", stroke: "hsl(40 80% 58%)", icon: "⛈️" },
        { key: "danger", label: "Danger", count: danger, fill: "hsl(0 72% 48% / 0.35)", stroke: "hsl(0 72% 55%)", icon: "🌊" },
      ];
    }
    case "surplus": {
      const hot = states.filter(s => s.surplusListings >= 15).length;
      const active = states.filter(s => s.surplusListings >= 5 && s.surplusListings < 15).length;
      const low = states.filter(s => s.surplusListings >= 1 && s.surplusListings < 5).length;
      const none = states.filter(s => s.surplusListings === 0).length;
      return [
        { key: "hot", label: "Hot (15+)", count: hot, fill: "hsl(165 60% 38% / 0.4)", stroke: "hsl(165 60% 52%)", icon: "🔥" },
        { key: "active", label: "Active (5-14)", count: active, fill: "hsl(165 45% 35% / 0.35)", stroke: "hsl(165 45% 50%)", icon: "📦" },
        { key: "low", label: "Low (1-4)", count: low, fill: "hsl(200 40% 35% / 0.3)", stroke: "hsl(200 40% 50%)", icon: "📋" },
        { key: "none", label: "No Listings", count: none, fill: "hsl(220 20% 30% / 0.25)", stroke: "hsl(220 20% 45%)", icon: "🚫" },
      ];
    }
  }
}
