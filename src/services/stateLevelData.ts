import type { StateStatus } from "@/components/MalaysiaMap";

const BASE_URL = "https://api.data.gov.my/opendosm/";

// ── Types ──────────────────────────────────────────────────────────────────────

export type DataLayer = "production" | "cpi" | "surplus" | "ssl" | "weather";

export type WeatherRisk = "normal" | "advisory" | "warning" | "danger";

export interface StateMetrics {
  id: string;
  name: string;
  production: number;        // tonnes
  demand: number;             // tonnes
  cpiIndex: number;           // CPI food index value
  cpiChange: number;          // month-on-month % change
  surplusListings: number;    // marketplace surplus items
  mainCrops: string[];
  notes: string;
  status: StateStatus;
  weatherRisk: WeatherRisk;
  weatherLabel: string;
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

const MOCK_STATE_DATA: StateMetrics[] = [
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
