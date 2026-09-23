"use client";

import React, { useEffect, useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { RegionWeather, RegionsHierarchy, WeatherMetric } from "@/lib/types";
import { RegionSelector } from "@/components/RegionSelector";
import { WeatherCard } from "@/components/WeatherCard";
import { WeatherChart } from "@/components/WeatherChart";
import { CloudSun, Layers, ShieldCheck, Activity } from "lucide-react";

// Dynamically import TaiwanMap with SSR disabled to prevent Leaflet window reference errors
const TaiwanMap = dynamic(() => import("@/components/TaiwanMap"), {
  ssr: false,
  loading: () => (
    <div
      className="glass-panel"
      style={{
        height: "560px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "var(--accent-cyan)",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <div className="pulse-indicator" style={{ width: "16px", height: "16px", marginBottom: "12px" }} />
        <p style={{ fontSize: "14px", fontWeight: 600 }}>初始化 Leaflet GIS 引擎...</p>
      </div>
    </div>
  ),
});

export default function Home() {
  const [weatherList, setWeatherList] = useState<RegionWeather[]>([]);
  const [hierarchy, setHierarchy] = useState<RegionsHierarchy>({});
  const [selectedCounty, setSelectedCounty] = useState<string>("");
  const [selectedTown, setSelectedTown] = useState<string>("");
  const [selectedMetric, setSelectedMetric] = useState<WeatherMetric>("temperature");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [lastUpdated, setLastUpdated] = useState<string>("");

  // Load initial datasets
  useEffect(() => {
    async function loadData() {
      try {
        const [weatherRes, hierarchyRes] = await Promise.all([
          fetch("/api/weather"),
          fetch("/api/regions"),
        ]);

        if (weatherRes.ok && hierarchyRes.ok) {
          const wData: RegionWeather[] = await weatherRes.json();
          const hData: RegionsHierarchy = await hierarchyRes.json();
          setWeatherList(wData);
          setHierarchy(hData);

          // Find the latest forecast time
          const times = wData.map((d) => d.forecast_time).filter(Boolean);
          if (times.length > 0) {
            setLastUpdated(new Date(times[0]!).toLocaleString("zh-TW"));
          }
        }
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  // Selected weather item
  const selectedWeather = useMemo(() => {
    if (!selectedCounty && !selectedTown) return null;
    return weatherList.find((item) => {
      if (selectedTown) {
        return item.county === selectedCounty && item.town === selectedTown;
      }
      return item.county === selectedCounty;
    });
  }, [weatherList, selectedCounty, selectedTown]);

  // Compute National Overview Stats
  const nationalStats = useMemo(() => {
    const validTemps = weatherList.filter((w) => w.temperature !== null && w.temperature !== undefined);
    if (validTemps.length === 0) return undefined;

    const avg = validTemps.reduce((acc, cur) => acc + (cur.temperature || 0), 0) / validTemps.length;

    let maxRec = { name: `${validTemps[0].county} ${validTemps[0].town}`, temp: validTemps[0].temperature || 0 };
    let minRec = { name: `${validTemps[0].county} ${validTemps[0].town}`, temp: validTemps[0].temperature || 0 };

    validTemps.forEach((w) => {
      const t = w.temperature || 0;
      if (t > maxRec.temp) {
        maxRec = { name: `${w.county} ${w.town}`, temp: t };
      }
      if (t < minRec.temp) {
        minRec = { name: `${w.county} ${w.town}`, temp: t };
      }
    });

    const rainCount = weatherList.filter((w) => (w.pop || 0) > 0).length;

    return {
      avgTemp: avg,
      maxTempRecord: maxRec,
      minTempRecord: minRec,
      rainStationsCount: rainCount,
    };
  }, [weatherList]);

  const handleSelectRegionFromMap = (county: string, town: string) => {
    setSelectedCounty(county);
    setSelectedTown(town);
  };

  const handleResetView = () => {
    setSelectedCounty("");
    setSelectedTown("");
  };

  return (
    <main style={{ minHeight: "100vh", padding: "28px 24px 48px", maxWidth: "1440px", margin: "0 auto" }}>
      {/* Top Header */}
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px",
          marginBottom: "24px",
          paddingBottom: "18px",
          borderBottom: "1px solid var(--border-subtle)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "12px",
              background: "linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 0 20px rgba(56, 189, 248, 0.4)",
            }}
          >
            <CloudSun size={24} color="#ffffff" />
          </div>
          <div>
            <h1 style={{ fontSize: "24px", fontWeight: 800, letterSpacing: "-0.5px", color: "var(--text-main)" }}>
              Taiwan Weather GIS Dashboard
            </h1>
            <p style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "2px" }}>
              IDC-2 台灣氣象地理資訊儀表板 • CWA Open Data (O-A0003-001) 即時觀測
            </p>
          </div>
        </div>

        {/* Live Badges */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "6px 14px",
              borderRadius: "20px",
              background: "rgba(16, 185, 129, 0.12)",
              border: "1px solid rgba(16, 185, 129, 0.3)",
              fontSize: "12px",
              fontWeight: 600,
              color: "var(--accent-emerald)",
            }}
          >
            <span className="pulse-indicator" />
            <span>氣象署即時連線中</span>
          </div>

          <div
            style={{
              padding: "6px 14px",
              borderRadius: "20px",
              background: "rgba(30, 41, 59, 0.7)",
              border: "1px solid var(--border-subtle)",
              fontSize: "12px",
              color: "var(--text-muted)",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <Activity size={13} color="var(--accent-cyan)" />
            <span>368 行政區 / 363 氣象測站</span>
          </div>

          {lastUpdated && (
            <div style={{ fontSize: "12px", color: "var(--text-dim)", fontFamily: "JetBrains Mono" }}>
              更新時間: {lastUpdated}
            </div>
          )}
        </div>
      </header>

      {/* Region Selector Bar */}
      <RegionSelector
        hierarchy={hierarchy}
        selectedCounty={selectedCounty}
        selectedTown={selectedTown}
        onSelectCounty={(c) => {
          setSelectedCounty(c);
          setSelectedTown("");
        }}
        onSelectTown={setSelectedTown}
        selectedMetric={selectedMetric}
        onSelectMetric={setSelectedMetric}
        onResetView={handleResetView}
        totalRegions={weatherList.length}
      />

      {/* Main Grid: Left GIS Map, Right Detail Card */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
          gap: "20px",
          alignItems: "stretch",
        }}
      >
        {/* Left: Interactive GIS Map (Flex 1.8) */}
        <div style={{ flex: 1.8, minWidth: "320px" }}>
          <TaiwanMap
            weatherList={weatherList}
            selectedCounty={selectedCounty}
            selectedTown={selectedTown}
            selectedMetric={selectedMetric}
            onSelectRegion={handleSelectRegionFromMap}
          />
        </div>

        {/* Right: Weather Detail Card (Flex 1) */}
        <div style={{ flex: 1, minWidth: "320px" }}>
          <WeatherCard
            weatherData={selectedWeather}
            county={selectedCounty}
            town={selectedTown}
            nationalStats={nationalStats}
          />
        </div>
      </div>

      {/* Bottom: Weather Comparison & Trend Analysis */}
      <WeatherChart
        weatherList={weatherList}
        selectedCounty={selectedCounty}
        onSelectTown={(t) => setSelectedTown(t)}
      />

      {/* Footer */}
      <footer
        style={{
          marginTop: "36px",
          textAlign: "center",
          fontSize: "13px",
          color: "var(--text-dim)",
          paddingTop: "20px",
          borderTop: "1px solid var(--border-subtle)",
        }}
      >
        IDC-2 Taiwan Weather GIS Dashboard • Next.js + Leaflet + SQLite + CWA Open Data O-A0003-001
      </footer>
    </main>
  );
}
