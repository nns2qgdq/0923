import { RegionWeather, WeatherMetric } from "./types";

export function getMetricColor(value: number | null | undefined, metric: WeatherMetric): string {
  if (value === null || value === undefined) {
    return "#334155"; // slate-700 fallback for no data
  }

  if (metric === "temperature") {
    if (value < 20) return "#3b82f6"; // Blue (<20°C)
    if (value < 24) return "#06b6d4"; // Cyan (20-24°C)
    if (value < 28) return "#10b981"; // Emerald (24-28°C)
    if (value < 31) return "#f59e0b"; // Amber (28-31°C)
    return "#ef4444"; // Red (>31°C)
  }

  if (metric === "pop") {
    if (value <= 0) return "#64748b"; // No rain
    if (value < 2) return "#38bdf8"; // Light rain
    if (value < 10) return "#2563eb"; // Moderate rain
    if (value < 30) return "#7c3aed"; // Heavy rain
    return "#ec4899"; // Extreme rain
  }

  if (metric === "humidity") {
    if (value < 60) return "#fde047"; // Dry
    if (value < 75) return "#34d399"; // Comfortable
    if (value < 85) return "#38bdf8"; // Humid
    return "#818cf8"; // Very humid
  }

  return "#475569";
}

export function getWeatherIconName(weather?: string | null): string {
  if (!weather) return "Sun";
  if (weather.includes("雷")) return "CloudLightning";
  if (weather.includes("雨")) return "CloudRain";
  if (weather.includes("陰")) return "Cloud";
  if (weather.includes("多雲")) return "CloudSun";
  if (weather.includes("晴")) return "Sun";
  if (weather.includes("霧")) return "CloudFog";
  return "Sun";
}
