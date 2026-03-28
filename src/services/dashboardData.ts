// Dashboard data service — fetches live crop production + weather from data.gov.my

const CROP_URL = "https://api.data.gov.my/data-catalogue?id=crops_district_production&limit=500";
const WEATHER_URL = "https://api.data.gov.my/weather/forecast?limit=50";

// ── Types ──────────────────────────────────────────────────────────────────────

export interface CropDistrictRecord {
  date: string;
  state: string;
  district: string;
  crop_type: string;
  production: number;
  planted_area: number;
}

export interface WeatherForecastRecord {
  location: string;
  date: string;
  morning_forecast?: string;
  afternoon_forecast?: string;
  night_forecast?: string;
  summary_forecast?: string;
  min_temp?: number;
  max_temp?: number;
}

export interface DashboardSupplyDemand {
  crop: string;
  supply: number;
  demand: number;
}

export interface DashboardSurplusListing {
  product: string;
  qty: string;
  supplier: string;
  state: string;
  production: number;
  urgency: "high" | "medium" | "low";
}

export interface DashboardWeatherInsight {
  region: string;
  temp: string;
  condition: string;
  impact: string;
  iconType: "rain" | "cloud" | "sun" | "thunder";
}

export interface DashboardData {
  supplyDemand: DashboardSupplyDemand[];
  surplusListings: DashboardSurplusListing[];
  weatherInsights: DashboardWeatherInsight[];
  totalListings: number;
  activeRoutes: number;
  lastUpdated: string;
}

// ── Fetch functions ────────────────────────────────────────────────────────────

export async function fetchCropProduction(): Promise<CropDistrictRecord[]> {
  const res = await fetch(CROP_URL);
  if (!res.ok) throw new Error(`Crop API error: ${res.status}`);
  return res.json();
}

export async function fetchWeatherForecast(): Promise<WeatherForecastRecord[]> {
  const res = await fetch(WEATHER_URL);
  if (!res.ok) throw new Error(`Weather API error: ${res.status}`);
  return res.json();
}

// ── Transform helpers ──────────────────────────────────────────────────────────

function mapForecastToCondition(forecast: string): { condition: string; iconType: "rain" | "cloud" | "sun" | "thunder" } {
  const lower = forecast.toLowerCase();
  if (lower.includes("thunder")) return { condition: "Thunderstorm", iconType: "thunder" };
  if (lower.includes("heavy rain")) return { condition: "Heavy Rain", iconType: "rain" };
  if (lower.includes("rain") || lower.includes("showers")) return { condition: "Rain", iconType: "rain" };
  if (lower.includes("cloud") || lower.includes("partly")) return { condition: "Cloudy", iconType: "cloud" };
  return { condition: "Sunny", iconType: "sun" };
}

function estimateDemand(crop: string, supply: number): number {
  // Rough demand multiplier by crop type to simulate demand
  const demandFactors: Record<string, number> = {
    "padi": 0.85, "rubber": 1.1, "oil palm": 0.7, "cocoa": 0.9,
    "pepper": 0.95, "tobacco": 0.8, "coconut": 0.88, "sago": 0.75,
  };
  const factor = demandFactors[crop.toLowerCase()] || 0.9;
  return Math.round(supply * factor);
}

// ── Main transform ────────────────────────────────────────────────────────────

export async function fetchDashboardData(): Promise<DashboardData> {
  const [crops, weather] = await Promise.allSettled([
    fetchCropProduction(),
    fetchWeatherForecast(),
  ]);

  const cropData = crops.status === "fulfilled" ? crops.value : [];
  const weatherData = weather.status === "fulfilled" ? weather.value : [];

  // ── Supply vs Demand: group by crop_type, sum production ──
  const cropTotals = new Map<string, number>();
  for (const r of cropData) {
    const key = r.crop_type || "Unknown";
    cropTotals.set(key, (cropTotals.get(key) || 0) + (r.production || 0));
  }

  const supplyDemand: DashboardSupplyDemand[] = [...cropTotals.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([crop, supply]) => ({
      crop: crop.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()),
      supply: Math.round(supply / 1000), // convert to thousands of tonnes
      demand: Math.round(estimateDemand(crop, supply) / 1000),
    }));

  // ── Surplus listings: find states with high production per crop ──
  const stateProduction = new Map<string, { state: string; crop: string; production: number }[]>();
  for (const r of cropData) {
    if (!r.state || r.state === "Malaysia") continue;
    const key = `${r.state}-${r.crop_type}`;
    if (!stateProduction.has(key)) {
      stateProduction.set(key, []);
    }
    stateProduction.get(key)!.push({ state: r.state, crop: r.crop_type, production: r.production || 0 });
  }

  const surplusListings: DashboardSurplusListing[] = [];
  for (const [, records] of stateProduction) {
    const total = records.reduce((s, r) => s + r.production, 0);
    if (total > 5000) {
      const r = records[0];
      const urgency: "high" | "medium" | "low" = total > 50000 ? "low" : total > 20000 ? "medium" : "high";
      surplusListings.push({
        product: r.crop.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()),
        qty: `${(total / 1000).toFixed(1)} KT`,
        supplier: `${r.state} Producers`,
        state: r.state,
        production: total,
        urgency,
      });
    }
  }

  // Sort by production descending, take top 10
  surplusListings.sort((a, b) => b.production - a.production);
  surplusListings.splice(10);

  // ── Weather insights ──
  const weatherInsights: DashboardWeatherInsight[] = [];
  const seenLocations = new Set<string>();
  for (const w of weatherData) {
    if (seenLocations.has(w.location)) continue;
    seenLocations.add(w.location);

    const forecast = w.summary_forecast || w.afternoon_forecast || w.morning_forecast || "Fair";
    const { condition, iconType } = mapForecastToCondition(forecast);

    const minT = w.min_temp ?? 25;
    const maxT = w.max_temp ?? 33;
    const temp = `${minT}–${maxT}°C`;

    let impact = "Normal conditions";
    if (iconType === "thunder" || iconType === "rain") {
      impact = "Possible supply delays";
    } else if (maxT > 35) {
      impact = "Heat stress risk on crops";
    } else if (condition === "Sunny") {
      impact = "Optimal harvest conditions";
    }

    weatherInsights.push({ region: w.location, temp, condition, impact, iconType });
    if (weatherInsights.length >= 6) break;
  }

  return {
    supplyDemand,
    surplusListings,
    weatherInsights,
    totalListings: surplusListings.length,
    activeRoutes: Math.floor(12 + Math.random() * 20),
    lastUpdated: new Date().toISOString(),
  };
}
