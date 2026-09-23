"use client";

import React, { useState } from "react";
import { RegionWeather } from "@/lib/types";
import { BarChart3, TrendingUp, Layers } from "lucide-react";

interface WeatherChartProps {
  weatherList: RegionWeather[];
  selectedCounty: string;
  onSelectTown: (town: string) => void;
}

export const WeatherChart: React.FC<WeatherChartProps> = ({
  weatherList,
  selectedCounty,
  onSelectTown,
}) => {
  const [chartMode, setChartMode] = useState<"temperature" | "rain">("temperature");

  // Filter items: if county is selected, show towns in that county; otherwise show top 12 representative towns
  let displayItems = weatherList.filter((item) => item.temperature !== null);
  if (selectedCounty) {
    displayItems = displayItems.filter((item) => item.county === selectedCounty);
  }

  // Sort: by temperature descending or precipitation descending
  if (chartMode === "temperature") {
    displayItems = [...displayItems].sort((a, b) => (b.temperature || 0) - (a.temperature || 0));
  } else {
    displayItems = [...displayItems].sort((a, b) => (b.pop || 0) - (a.pop || 0));
  }

  // Take top 14 for clean readability
  const chartData = displayItems.slice(0, 14);

  const maxVal = chartMode === "temperature"
    ? Math.max(35, ...chartData.map((d) => d.max_temp || d.temperature || 0))
    : Math.max(5, ...chartData.map((d) => d.pop || 0));

  const minVal = chartMode === "temperature"
    ? Math.min(15, ...chartData.map((d) => d.min_temp || d.temperature || 20))
    : 0;

  return (
    <div className="glass-panel" style={{ padding: "20px 24px", marginTop: "20px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "18px",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              padding: "8px",
              borderRadius: "8px",
              background: "rgba(56, 189, 248, 0.15)",
              color: "var(--accent-cyan)",
            }}
          >
            <BarChart3 size={18} />
          </div>
          <div>
            <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-main)" }}>
              {selectedCounty ? `${selectedCounty} 各鄉鎮氣象比較` : "全台重點行政區氣象比較分析"}
            </h3>
            <span style={{ fontSize: "12px", color: "var(--text-dim)" }}>
              顯示前 {chartData.length} 個行政區實測數據
            </span>
          </div>
        </div>

        {/* Chart Metric Toggle */}
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            className={`btn-tab ${chartMode === "temperature" ? "active" : ""}`}
            onClick={() => setChartMode("temperature")}
            style={{ padding: "6px 12px", fontSize: "12px" }}
          >
            <TrendingUp size={13} />
            氣溫高低溫分布
          </button>
          <button
            className={`btn-tab ${chartMode === "rain" ? "active" : ""}`}
            onClick={() => setChartMode("rain")}
            style={{ padding: "6px 12px", fontSize: "12px" }}
          >
            <Layers size={13} />
            累積降雨排行
          </button>
        </div>
      </div>

      {/* Chart visualization */}
      {chartData.length === 0 ? (
        <div style={{ padding: "40px", textAlign: "center", color: "var(--text-dim)", fontSize: "14px" }}>
          此區域目前尚無觀測測站資料
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${chartData.length}, minmax(40px, 1fr))`,
            gap: "12px",
            alignItems: "flex-end",
            height: "170px",
            paddingTop: "24px",
            paddingBottom: "8px",
            overflowX: "auto",
          }}
        >
          {chartData.map((item, index) => {
            const val = chartMode === "temperature" ? (item.temperature || 0) : (item.pop || 0);
            const heightPercent = chartMode === "temperature"
              ? Math.max(15, Math.min(100, ((val - minVal) / (maxVal - minVal || 1)) * 100))
              : Math.max(8, Math.min(100, (val / (maxVal || 1)) * 100));

            return (
              <div
                key={`${item.county}-${item.town}-${index}`}
                onClick={() => onSelectTown(item.town)}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  height: "100%",
                  justifyContent: "flex-end",
                  cursor: "pointer",
                  transition: "transform 0.2s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-4px)")}
                onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
                title={`${item.county} ${item.town} - 氣溫: ${item.temperature}°C, 降雨: ${item.pop}mm, 濕度: ${item.humidity}%`}
              >
                {/* Value Label */}
                <div
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    marginBottom: "6px",
                    color: chartMode === "temperature" ? "var(--accent-amber)" : "var(--accent-cyan)",
                    fontFamily: "JetBrains Mono",
                  }}
                >
                  {chartMode === "temperature" ? `${val.toFixed(1)}°` : `${val}m`}
                </div>

                {/* Animated Bar */}
                <div
                  style={{
                    width: "100%",
                    maxWidth: "28px",
                    height: `${heightPercent}%`,
                    borderRadius: "6px 6px 2px 2px",
                    background:
                      chartMode === "temperature"
                        ? "linear-gradient(180deg, #f59e0b 0%, #3b82f6 100%)"
                        : "linear-gradient(180deg, #38bdf8 0%, #2563eb 100%)",
                    boxShadow: "0 0 10px rgba(56, 189, 248, 0.2)",
                    transition: "height 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
                  }}
                />

                {/* Town Name Label */}
                <div
                  style={{
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "var(--text-muted)",
                    marginTop: "8px",
                    whiteSpace: "nowrap",
                    textAlign: "center",
                  }}
                >
                  {item.town.length > 3 ? item.town.slice(0, 3) : item.town}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
