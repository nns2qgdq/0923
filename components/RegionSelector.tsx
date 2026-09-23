"use client";

import React from "react";
import { RegionsHierarchy, WeatherMetric } from "@/lib/types";
import { MapPin, Thermometer, CloudRain, Droplets, RefreshCw } from "lucide-react";

interface RegionSelectorProps {
  hierarchy: RegionsHierarchy;
  selectedCounty: string;
  selectedTown: string;
  onSelectCounty: (county: string) => void;
  onSelectTown: (town: string) => void;
  selectedMetric: WeatherMetric;
  onSelectMetric: (metric: WeatherMetric) => void;
  onResetView?: () => void;
  totalRegions: number;
}

export const RegionSelector: React.FC<RegionSelectorProps> = ({
  hierarchy,
  selectedCounty,
  selectedTown,
  onSelectCounty,
  onSelectTown,
  selectedMetric,
  onSelectMetric,
  onResetView,
  totalRegions,
}) => {
  const counties = Object.keys(hierarchy).sort((a, b) => a.localeCompare(b, "zh-Hant"));
  const availableTowns = selectedCounty && hierarchy[selectedCounty] ? hierarchy[selectedCounty] : [];

  return (
    <div className="glass-panel" style={{ padding: "16px 24px", marginBottom: "20px" }}>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "16px",
        }}
      >
        {/* Left: County & Town Dropdowns */}
        <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--accent-cyan)" }}>
            <MapPin size={18} />
            <span style={{ fontSize: "14px", fontWeight: 700, letterSpacing: "0.5px" }}>行政區選擇</span>
          </div>

          {/* County Selector */}
          <select
            className="select-custom"
            value={selectedCounty}
            onChange={(e) => {
              const newCounty = e.target.value;
              onSelectCounty(newCounty);
            }}
          >
            <option value="">全臺灣 (所有縣市)</option>
            {counties.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* Town Selector */}
          <select
            className="select-custom"
            value={selectedTown}
            disabled={!selectedCounty}
            onChange={(e) => onSelectTown(e.target.value)}
            style={{ opacity: selectedCounty ? 1 : 0.6 }}
          >
            <option value="">全部鄉鎮市區</option>
            {availableTowns.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          {/* Reset button */}
          {(selectedCounty || selectedTown) && onResetView && (
            <button
              onClick={onResetView}
              className="btn-tab"
              title="重設地圖視角至全台"
              style={{ padding: "8px 12px" }}
            >
              <RefreshCw size={14} />
              重設視角
            </button>
          )}
        </div>

        {/* Right: GIS Metric Visual Layers */}
        <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
          <span style={{ fontSize: "13px", color: "var(--text-dim)", fontWeight: 600, marginRight: "4px" }}>
            地圖圖層：
          </span>

          <button
            className={`btn-tab ${selectedMetric === "temperature" ? "active" : ""}`}
            onClick={() => onSelectMetric("temperature")}
          >
            <Thermometer size={14} />
            溫度 (°C)
          </button>

          <button
            className={`btn-tab ${selectedMetric === "pop" ? "active" : ""}`}
            onClick={() => onSelectMetric("pop")}
          >
            <CloudRain size={14} />
            降雨 (mm)
          </button>

          <button
            className={`btn-tab ${selectedMetric === "humidity" ? "active" : ""}`}
            onClick={() => onSelectMetric("humidity")}
          >
            <Droplets size={14} />
            相對濕度 (%)
          </button>
        </div>
      </div>
    </div>
  );
};
