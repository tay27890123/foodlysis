import { useQuery, useQueryClient } from "@tanstack/react-query";

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
  location: {
    location_name: string;
    lat: number;
    lng: number;
  };
  date: string;
  summary_forecast: string;
  summary_when: string;
  min_temp: number;
  max_temp: number;
}

// ── Fetchers ───────────────────────────────────────────────────────────────────

const CROP_URL =
  "https://api.data.gov.my/data-catalogue?id=crops_district_production&limit=500";
const WEATHER_URL =
  "https://api.data.gov.my/weather/forecast?limit=50";

async function fetchCropProduction(): Promise<CropDistrictRecord[]> {
  const res = await fetch(CROP_URL);
  if (!res.ok) throw new Error(`Crop API error: ${res.status}`);
  return res.json();
}

async function fetchWeather(): Promise<WeatherForecastRecord[]> {
  const res = await fetch(WEATHER_URL);
  if (!res.ok) throw new Error(`Weather API error: ${res.status}`);
  return res.json();
}

// ── React Query Hooks ──────────────────────────────────────────────────────────

const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
const ONE_DAY = 24 * 60 * 60 * 1000;

export function useCropProduction() {
  return useQuery({
    queryKey: ["cropProduction"],
    queryFn: fetchCropProduction,
    staleTime: SEVEN_DAYS,
    refetchInterval: SEVEN_DAYS,
    retry: 2,
  });
}

export function useWeatherForecast() {
  return useQuery({
    queryKey: ["weatherForecast"],
    queryFn: fetchWeather,
    staleTime: ONE_DAY,
    refetchInterval: ONE_DAY,
    retry: 2,
  });
}

export function useRefreshAll() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ["cropProduction"] });
    qc.invalidateQueries({ queryKey: ["weatherForecast"] });
  };
}

// ── Transformers ───────────────────────────────────────────────────────────────

export interface CropSummary {
  crop_type: string;
  label: string;
  totalProduction: number;
  totalArea: number;
}

export function groupByCropType(data: CropDistrictRecord[]): CropSummary[] {
  const map = new Map<string, { production: number; area: number }>();
  for (const r of data) {
    const existing = map.get(r.crop_type) || { production: 0, area: 0 };
    existing.production += r.production;
    existing.area += r.planted_area;
    map.set(r.crop_type, existing);
  }
  return [...map.entries()]
    .map(([crop_type, v]) => ({
      crop_type,
      label: crop_type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      totalProduction: Math.round(v.production),
      totalArea: Math.round(v.area),
    }))
    .sort((a, b) => b.totalProduction - a.totalProduction);
}

export interface SurplusListing {
  product: string;
  state: string;
  district: string;
  qty: string;
  production: number;
  area: string;
}

export function toSurplusListings(data: CropDistrictRecord[]): SurplusListing[] {
  // Get the latest date's records, sorted by production desc
  const dates = [...new Set(data.map((r) => r.date))].sort().reverse();
  const latestDate = dates[0];
  if (!latestDate) return [];

  return data
    .filter((r) => r.date === latestDate && r.production > 0)
    .sort((a, b) => b.production - a.production)
    .slice(0, 20)
    .map((r) => ({
      product: r.crop_type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      state: r.state,
      district: r.district,
      qty: `${(r.production / 1000).toFixed(1)} MT`,
      production: r.production,
      area: `${r.planted_area.toLocaleString()} ha`,
    }));
}

export interface WeatherInsight {
  location: string;
  temp: string;
  condition: string;
  impact: string;
  isRain: boolean;
}

export function toWeatherInsights(data: WeatherForecastRecord[]): WeatherInsight[] {
  // Deduplicate by location, keep the first (latest) forecast
  const seen = new Set<string>();
  const results: WeatherInsight[] = [];

  for (const r of data) {
    const name = r.location?.location_name;
    if (!name || seen.has(name)) continue;
    seen.add(name);

    const forecast = (r.summary_forecast || "").toLowerCase();
    const isRain =
      forecast.includes("rain") ||
      forecast.includes("thunderstorm") ||
      forecast.includes("hujan");

    const avgTemp = Math.round((r.min_temp + r.max_temp) / 2);

    let impact = "Normal conditions";
    if (isRain) impact = "Possible supply delays";
    else if (avgTemp >= 35) impact = "High heat — demand spike";
    else if (avgTemp <= 22) impact = "Cool — highland harvest";

    results.push({
      location: name,
      temp: `${avgTemp}°C`,
      condition: r.summary_forecast || "N/A",
      impact,
      isRain,
    });
  }

  return results.slice(0, 6);
}
