"use client";

import React from "react";
import { RegionWeather } from "@/lib/types";
import {
  Sun,
  CloudSun,
  Cloud,
  CloudRain,
  CloudLightning,
  Wind,
  Droplets,
  Gauge,
  ThermometerSnowflake,
  ThermometerSun,
  Clock,
  Radio,
} from "lucide-react";

interface WeatherCardProps {
  weatherData?: RegionWeather | null;
  county: string;
  town: string;
  nationalStats?: {
    avgTemp: number;
    maxTempRecord: { name: string; temp: number };
    minTempRecord: { name: string; temp: number };
    rainStationsCount: number;
  };
}

export const WeatherCard: React.FC<WeatherCardProps> = ({
  weatherData,
  county,
  town,
  nationalStats,
}) => {
  const getWeatherIcon = (desc?: string | null) => {
    if (!desc) return <Sun size={38} color="#f59e0b" />;
    if (desc.includes("雷")) return <CloudLightning size={38} color="#8b5cf6" />;
    if (desc.includes("雨")) return <CloudRain size={38} color="#38bdf8" />;
    if (desc.includes("陰")) return <Cloud size={38} color="#94a3b8" />;
    if (desc.includes("多雲")) return <CloudSun size={38} color="#38bdf8" />;
    return <Sun size={38} color="#f59e0b" />;
  };

  // If specific town is selected with weather data
  if (weatherData && weatherData.temperature !== null) {
    return (
      <div className="glass-panel" style={{ padding: "24px", height: "100%", display: "flex", flexDirection: "column" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: 700,
                  padding: "3px 8px",
                  borderRadius: "6px",
                  background: "rgba(56, 189, 248, 0.15)",
                  color: "var(--accent-cyan)",
                  border: "1px solid rgba(56, 189, 248, 0.25)",
                }}
              >
                {weatherData.county}
              </span>
              {weatherData.gis_code && (
                <span style={{ fontSize: "11px", color: "var(--text-dim)", fontFamily: "JetBrains Mono" }}>
                  #{weatherData.gis_code}
                </span>
              )}
            </div>
            <h2 style={{ fontSize: "26px", fontWeight: 800, color: "var(--text-main)" }}>
              {weatherData.town || weatherData.county}
            </h2>
          </div>

          <div style={{ textAlign: "right" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--text-dim)", fontSize: "12px" }}>
              <Clock size={12} />
              <span>{weatherData.forecast_time ? new Date(weatherData.forecast_time).toLocaleTimeString("zh-TW", { hour: "2-digit", minute: "2-digit" }) : "即時"}</span>
            </div>
            {weatherData.station_name && (
              <div style={{ display: "flex", alignItems: "center", gap: "4px", color: "var(--accent-cyan)", fontSize: "11px", marginTop: "2px" }}>
                <Radio size={11} />
                <span>測站: {weatherData.station_name}</span>
              </div>
            )}
          </div>
        </div>

        {/* Temperature & Weather Hero */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "20px",
            borderRadius: "14px",
            background: "linear-gradient(135deg, rgba(30, 41, 59, 0.5) 0%, rgba(15, 23, 42, 0.7) 100%)",
            border: "1px solid rgba(255, 255, 255, 0.05)",
            marginBottom: "20px",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "baseline" }}>
              <span style={{ fontSize: "52px", fontWeight: 800, letterSpacing: "-1px", color: "#ffffff" }}>
                {weatherData.temperature?.toFixed(1) ?? "--"}
              </span>
              <span style={{ fontSize: "28px", fontWeight: 600, color: "var(--accent-cyan)", marginLeft: "4px" }}>
                °C
              </span>
            </div>
            <div style={{ fontSize: "15px", color: "var(--text-muted)", fontWeight: 500, marginTop: "2px" }}>
              {weatherData.weather || "觀測正常"}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
            {getWeatherIcon(weatherData.weather)}
            <div style={{ display: "flex", gap: "8px", fontSize: "12px", marginTop: "6px" }}>
              {weatherData.max_temp !== null && (
                <span style={{ color: "var(--accent-amber)", display: "flex", alignItems: "center", gap: "2px" }}>
                  <ThermometerSun size={12} /> {weatherData.max_temp?.toFixed(1)}°
                </span>
              )}
              {weatherData.min_temp !== null && (
                <span style={{ color: "var(--accent-cyan)", display: "flex", alignItems: "center", gap: "2px" }}>
                  <ThermometerSnowflake size={12} /> {weatherData.min_temp?.toFixed(1)}°
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Metrics Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginTop: "auto" }}>
          {/* Precipitation */}
          <div
            style={{
              padding: "12px 14px",
              borderRadius: "10px",
              background: "rgba(15, 23, 42, 0.6)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--text-dim)", fontSize: "12px" }}>
              <CloudRain size={14} color="var(--accent-blue)" />
              <span>降水量</span>
            </div>
            <div style={{ fontSize: "18px", fontWeight: 700, marginTop: "4px", color: "var(--text-main)" }}>
              {weatherData.pop !== null && weatherData.pop !== undefined ? `${weatherData.pop} mm` : "--"}
            </div>
          </div>

          {/* Humidity */}
          <div
            style={{
              padding: "12px 14px",
              borderRadius: "10px",
              background: "rgba(15, 23, 42, 0.6)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--text-dim)", fontSize: "12px" }}>
              <Droplets size={14} color="var(--accent-cyan)" />
              <span>相對濕度</span>
            </div>
            <div style={{ fontSize: "18px", fontWeight: 700, marginTop: "4px", color: "var(--text-main)" }}>
              {weatherData.humidity !== null && weatherData.humidity !== undefined ? `${weatherData.humidity}%` : "--"}
            </div>
          </div>

          {/* Wind Speed */}
          <div
            style={{
              padding: "12px 14px",
              borderRadius: "10px",
              background: "rgba(15, 23, 42, 0.6)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--text-dim)", fontSize: "12px" }}>
              <Wind size={14} color="var(--accent-emerald)" />
              <span>風速</span>
            </div>
            <div style={{ fontSize: "18px", fontWeight: 700, marginTop: "4px", color: "var(--text-main)" }}>
              {weatherData.wind_speed !== null && weatherData.wind_speed !== undefined ? `${weatherData.wind_speed} m/s` : "--"}
            </div>
          </div>

          {/* Air Pressure */}
          <div
            style={{
              padding: "12px 14px",
              borderRadius: "10px",
              background: "rgba(15, 23, 42, 0.6)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--text-dim)", fontSize: "12px" }}>
              <Gauge size={14} color="var(--accent-purple)" />
              <span>大氣壓力</span>
            </div>
            <div style={{ fontSize: "18px", fontWeight: 700, marginTop: "4px", color: "var(--text-main)" }}>
              {weatherData.air_pressure !== null && weatherData.air_pressure !== undefined ? `${weatherData.air_pressure} hPa` : "--"}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Fallback: When no specific region is selected, show general status & hint
  return (
    <div
      className="glass-panel"
      style={{
        padding: "24px",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
          <span className="pulse-indicator" />
          <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--accent-emerald)", letterSpacing: "0.5px" }}>
            全台即時觀測概況
          </span>
        </div>
        <h2 style={{ fontSize: "24px", fontWeight: 800, color: "var(--text-main)", marginBottom: "12px" }}>
          {county ? `${county} 氣象概覽` : "點選地圖行政區"}
        </h2>
        <p style={{ fontSize: "14px", color: "var(--text-muted)", lineHeight: "1.6" }}>
          請在左側 GIS 互動地圖中直接<strong>點擊任意鄉鎮市區</strong>，或利用上方下拉選單，即可查看該區域詳細溫度、高低溫、降雨與氣壓觀測。
        </p>
      </div>

      {nationalStats && (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", margin: "20px 0" }}>
          <div
            style={{
              padding: "14px",
              borderRadius: "10px",
              background: "rgba(15, 23, 42, 0.5)",
              border: "1px solid var(--border-subtle)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span style={{ fontSize: "13px", color: "var(--text-dim)" }}>全台平均氣溫</span>
            <span style={{ fontSize: "20px", fontWeight: 700, color: "var(--accent-cyan)" }}>
              {nationalStats.avgTemp.toFixed(1)} °C
            </span>
          </div>

          <div
            style={{
              padding: "14px",
              borderRadius: "10px",
              background: "rgba(15, 23, 42, 0.5)",
              border: "1px solid var(--border-subtle)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span style={{ fontSize: "13px", color: "var(--text-dim)" }}>全台最高溫測站</span>
            <span style={{ fontSize: "15px", fontWeight: 700, color: "var(--accent-amber)" }}>
              {nationalStats.maxTempRecord.name} ({nationalStats.maxTempRecord.temp.toFixed(1)}°C)
            </span>
          </div>

          <div
            style={{
              padding: "14px",
              borderRadius: "10px",
              background: "rgba(15, 23, 42, 0.5)",
              border: "1px solid var(--border-subtle)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span style={{ fontSize: "13px", color: "var(--text-dim)" }}>全台最低溫測站</span>
            <span style={{ fontSize: "15px", fontWeight: 700, color: "var(--accent-cyan)" }}>
              {nationalStats.minTempRecord.name} ({nationalStats.minTempRecord.temp.toFixed(1)}°C)
            </span>
          </div>
        </div>
      )}

      <div style={{ fontSize: "12px", color: "var(--text-dim)", textAlign: "center" }}>
        資料來源：交通部中央氣象署 Open Data (O-A0003-001)
      </div>
    </div>
  );
};
