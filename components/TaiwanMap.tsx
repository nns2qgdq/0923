"use client";

import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { RegionWeather, WeatherMetric } from "@/lib/types";
import { getMetricColor } from "@/lib/weather";

interface TaiwanMapProps {
  weatherList: RegionWeather[];
  selectedCounty: string;
  selectedTown: string;
  selectedMetric: WeatherMetric;
  onSelectRegion: (county: string, town: string) => void;
}

export const TaiwanMap: React.FC<TaiwanMapProps> = ({
  weatherList,
  selectedCounty,
  selectedTown,
  selectedMetric,
  onSelectRegion,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const geojsonLayerRef = useRef<L.GeoJSON | null>(null);
  const [geoData, setGeoData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Fast lookup index: "county_town" -> RegionWeather
  const weatherMap = useRef<Map<string, RegionWeather>>(new Map());

  useEffect(() => {
    const map = new Map<string, RegionWeather>();
    weatherList.forEach((w) => {
      map.set(`${w.county}_${w.town}`, w);
    });
    weatherMap.current = map;

    // Refresh styling if layer exists
    if (geojsonLayerRef.current) {
      geojsonLayerRef.current.eachLayer((layer: any) => {
        if (layer.feature) {
          const props = layer.feature.properties;
          const county = (props.COUNTYNAME || "").replace("台", "臺");
          const town = (props.TOWNNAME || "").replace("台", "臺");
          const w = weatherMap.current.get(`${county}_${town}`);

          const isSelected =
            (selectedCounty === county && !selectedTown) ||
            (selectedCounty === county && selectedTown === town);

          let metricVal: number | null | undefined = null;
          if (w) {
            if (selectedMetric === "temperature") metricVal = w.temperature;
            else if (selectedMetric === "pop") metricVal = w.pop;
            else if (selectedMetric === "humidity") metricVal = w.humidity;
          }

          layer.setStyle({
            fillColor: getMetricColor(metricVal, selectedMetric),
            fillOpacity: isSelected ? 0.85 : 0.65,
            weight: isSelected ? 2.5 : 0.8,
            color: isSelected ? "#38bdf8" : "rgba(255, 255, 255, 0.2)",
          });
        }
      });
    }
  }, [weatherList, selectedMetric, selectedCounty, selectedTown]);

  // 1. Fetch GeoJSON once on mount
  useEffect(() => {
    let isMounted = true;
    async function loadGIS() {
      try {
        const res = await fetch("/gis/towns.geojson");
        const json = await res.json();
        if (isMounted) {
          setGeoData(json);
          setIsLoading(false);
        }
      } catch (err) {
        console.error("Failed to load towns GeoJSON:", err);
        if (isMounted) setIsLoading(false);
      }
    }
    loadGIS();
    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Initialize map centered at Taiwan
    const map = L.map(mapContainerRef.current, {
      center: [23.8, 120.95],
      zoom: 7.5,
      zoomControl: true,
      minZoom: 6.5,
      maxZoom: 13,
      attributionControl: false,
    });

    // ESRI World Dark Gray Canvas Basemap (Free, high performance, zero API key required)
    L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}", {
      maxZoom: 16,
    }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // 3. Render GeoJSON Polygons onto Leaflet
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !geoData) return;

    if (geojsonLayerRef.current) {
      map.removeLayer(geojsonLayerRef.current);
    }

    const geoLayer = L.geoJSON(geoData, {
      style: (feature) => {
        const props = feature?.properties || {};
        const county = (props.COUNTYNAME || "").replace("台", "臺");
        const town = (props.TOWNNAME || "").replace("台", "臺");
        const w = weatherMap.current.get(`${county}_${town}`);

        const isSelected =
          (selectedCounty === county && !selectedTown) ||
          (selectedCounty === county && selectedTown === town);

        let metricVal: number | null | undefined = null;
        if (w) {
          if (selectedMetric === "temperature") metricVal = w.temperature;
          else if (selectedMetric === "pop") metricVal = w.pop;
          else if (selectedMetric === "humidity") metricVal = w.humidity;
        }

        return {
          fillColor: getMetricColor(metricVal, selectedMetric),
          fillOpacity: isSelected ? 0.85 : 0.65,
          weight: isSelected ? 2.5 : 0.8,
          color: isSelected ? "#38bdf8" : "rgba(255, 255, 255, 0.2)",
        };
      },
      onEachFeature: (feature, layer) => {
        const props = feature.properties || {};
        const county = (props.COUNTYNAME || "").replace("台", "臺");
        const town = (props.TOWNNAME || "").replace("台", "臺");

        // Interactive hover tooltip
        layer.on("mouseover", (e: any) => {
          const l = e.target;
          l.setStyle({
            weight: 2.2,
            color: "#ffffff",
            fillOpacity: 0.9,
          });
          l.bringToFront();

          const w = weatherMap.current.get(`${county}_${town}`);
          const weatherText = w?.weather ? ` | ${w.weather}` : "";
          const tempText = w?.temperature !== null && w?.temperature !== undefined ? `${w.temperature.toFixed(1)}°C` : "無測站";
          const rainText = w?.pop !== null && w?.pop !== undefined ? `降雨: ${w.pop}mm` : "";

          l.bindTooltip(
            `<strong>${county} ${town}</strong><br/>氣溫: ${tempText}${weatherText}<br/>${rainText}`,
            { sticky: true, className: "custom-leaflet-tooltip" }
          ).openTooltip();
        });

        layer.on("mouseout", (e: any) => {
          const l = e.target;
          const isSelected =
            (selectedCounty === county && !selectedTown) ||
            (selectedCounty === county && selectedTown === town);

          const w = weatherMap.current.get(`${county}_${town}`);
          let metricVal: number | null | undefined = null;
          if (w) {
            if (selectedMetric === "temperature") metricVal = w.temperature;
            else if (selectedMetric === "pop") metricVal = w.pop;
            else if (selectedMetric === "humidity") metricVal = w.humidity;
          }

          l.setStyle({
            fillColor: getMetricColor(metricVal, selectedMetric),
            fillOpacity: isSelected ? 0.85 : 0.65,
            weight: isSelected ? 2.5 : 0.8,
            color: isSelected ? "#38bdf8" : "rgba(255, 255, 255, 0.2)",
          });
        });

        // Click on region
        layer.on("click", (e: any) => {
          onSelectRegion(county, town);
          const poly = layer as any;
          if (poly.getBounds) {
            map.fitBounds(poly.getBounds(), { maxZoom: 11, padding: [40, 40] });
          }
        });
      },
    }).addTo(map);

    geojsonLayerRef.current = geoLayer;
  }, [geoData, selectedMetric]);

  // 4. Zoom to selected county/town when changed externally
  useEffect(() => {
    const map = mapInstanceRef.current;
    const geoLayer = geojsonLayerRef.current;
    if (!map || !geoLayer || (!selectedCounty && !selectedTown)) return;

    let targetBounds: L.LatLngBounds | null = null;
    geoLayer.eachLayer((layer: any) => {
      const props = layer.feature?.properties || {};
      const county = (props.COUNTYNAME || "").replace("台", "臺");
      const town = (props.TOWNNAME || "").replace("台", "臺");

      if (selectedTown) {
        if (county === selectedCounty && town === selectedTown) {
          targetBounds = layer.getBounds();
        }
      } else if (selectedCounty) {
        if (county === selectedCounty) {
          if (!targetBounds) targetBounds = layer.getBounds();
          else targetBounds.extend(layer.getBounds());
        }
      }
    });

    if (targetBounds) {
      map.fitBounds(targetBounds, { maxZoom: selectedTown ? 11 : 9.5, padding: [30, 30] });
    }
  }, [selectedCounty, selectedTown]);

  return (
    <div style={{ position: "relative", width: "100%", height: "560px" }}>
      {/* Loading Overlay */}
      {isLoading && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 1000,
            background: "rgba(9, 13, 22, 0.85)",
            backdropFilter: "blur(6px)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "var(--radius-lg)",
            color: "var(--accent-cyan)",
          }}
        >
          <div className="pulse-indicator" style={{ width: "16px", height: "16px", marginBottom: "12px" }} />
          <span style={{ fontSize: "14px", fontWeight: 600 }}>載入台灣 GIS 行政區邊界向量資料...</span>
        </div>
      )}

      {/* Map DOM Element */}
      <div ref={mapContainerRef} style={{ width: "100%", height: "100%" }} />

      {/* Floating Legend */}
      <div
        className="glass-panel"
        style={{
          position: "absolute",
          bottom: "16px",
          left: "16px",
          zIndex: 900,
          padding: "10px 14px",
          fontSize: "11px",
          fontWeight: 600,
          display: "flex",
          flexDirection: "column",
          gap: "6px",
          boxShadow: "0 4px 16px rgba(0,0,0,0.5)",
        }}
      >
        <span style={{ color: "var(--text-main)", fontSize: "12px", fontWeight: 700 }}>
          {selectedMetric === "temperature"
            ? "即時氣溫 (°C)"
            : selectedMetric === "pop"
            ? "累積雨量 (mm)"
            : "相對濕度 (%)"}
        </span>

        {selectedMetric === "temperature" && (
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <span style={{ width: "10px", height: "10px", borderRadius: "2px", background: "#3b82f6" }} /> &lt;20°
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <span style={{ width: "10px", height: "10px", borderRadius: "2px", background: "#06b6d4" }} /> 20-24°
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <span style={{ width: "10px", height: "10px", borderRadius: "2px", background: "#10b981" }} /> 24-28°
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <span style={{ width: "10px", height: "10px", borderRadius: "2px", background: "#f59e0b" }} /> 28-31°
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <span style={{ width: "10px", height: "10px", borderRadius: "2px", background: "#ef4444" }} /> &gt;31°
            </span>
          </div>
        )}

        {selectedMetric === "pop" && (
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <span style={{ width: "10px", height: "10px", borderRadius: "2px", background: "#64748b" }} /> 0mm
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <span style={{ width: "10px", height: "10px", borderRadius: "2px", background: "#38bdf8" }} /> 0-2mm
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <span style={{ width: "10px", height: "10px", borderRadius: "2px", background: "#2563eb" }} /> 2-10mm
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <span style={{ width: "10px", height: "10px", borderRadius: "2px", background: "#7c3aed" }} /> 10-30mm
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <span style={{ width: "10px", height: "10px", borderRadius: "2px", background: "#ec4899" }} /> &gt;30mm
            </span>
          </div>
        )}

        {selectedMetric === "humidity" && (
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <span style={{ width: "10px", height: "10px", borderRadius: "2px", background: "#fde047" }} /> &lt;60%
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <span style={{ width: "10px", height: "10px", borderRadius: "2px", background: "#34d399" }} /> 60-75%
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <span style={{ width: "10px", height: "10px", borderRadius: "2px", background: "#38bdf8" }} /> 75-85%
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <span style={{ width: "10px", height: "10px", borderRadius: "2px", background: "#818cf8" }} /> &gt;85%
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaiwanMap;
