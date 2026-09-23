import sys
import os
import json
import logging

# Ensure scripts directory is in sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from database import get_db_connection

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

def query_all_weather(limit: int = 10):
    """基本查詢：讀取 weather_forecasts 資料表。"""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT *
        FROM weather_forecasts
        ORDER BY forecast_time DESC
        LIMIT ?;
    """, (limit,))
    rows = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return rows

def query_weather_by_county(county: str):
    """
    依縣市查詢：使用 JOIN 整合行政區與天氣資料。
    符合 myplan.md 中的標準查詢規範。
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT
            r.county,
            r.town,
            r.gis_code,
            r.latitude,
            r.longitude,
            w.station_id,
            w.station_name,
            w.forecast_time,
            w.weather,
            w.temperature,
            w.min_temp,
            w.max_temp,
            w.pop,
            w.humidity,
            w.wind_speed,
            w.air_pressure
        FROM weather_forecasts AS w
        JOIN regions AS r
            ON w.region_id = r.id
        WHERE r.county = ?
        ORDER BY w.forecast_time DESC, r.town ASC;
    """, (county,))
    rows = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return rows

def query_weather_by_town(county: str, town: str):
    """依特定縣市與鄉鎮區查詢即時天氣詳情。"""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT
            r.county,
            r.town,
            r.gis_code,
            r.latitude,
            r.longitude,
            w.station_id,
            w.station_name,
            w.forecast_time,
            w.weather,
            w.temperature,
            w.min_temp,
            w.max_temp,
            w.pop,
            w.humidity,
            w.wind_speed,
            w.wind_direction,
            w.air_pressure
        FROM weather_forecasts AS w
        JOIN regions AS r
            ON w.region_id = r.id
        WHERE r.county = ? AND r.town = ?
        ORDER BY w.forecast_time DESC
        LIMIT 1;
    """, (county, town))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

def query_all_regions_latest():
    """
    整合全台所有行政區與其最新氣象觀測（Web GIS 地圖渲染專用）。
    使用 LEFT JOIN 確保即便特定山區或離島無專屬測站，行政區仍可完整呈現。
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT
            r.id AS region_id,
            r.county,
            r.town,
            r.gis_code,
            r.latitude,
            r.longitude,
            w.station_id,
            w.station_name,
            w.forecast_time,
            w.weather,
            w.temperature,
            w.min_temp,
            w.max_temp,
            w.pop,
            w.humidity,
            w.wind_speed
        FROM regions AS r
        LEFT JOIN (
            -- 取得每個 region 最新的天氣紀錄
            SELECT wf.*
            FROM weather_forecasts wf
            INNER JOIN (
                SELECT region_id, MAX(forecast_time) AS max_time
                FROM weather_forecasts
                GROUP BY region_id
            ) latest ON wf.region_id = latest.region_id AND wf.forecast_time = latest.max_time
        ) AS w ON r.id = w.region_id
        ORDER BY r.county, r.town;
    """)
    rows = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return rows

def query_counties_list():
    """取得現有縣市清單及各縣市鄉鎮列表（供下拉選單使用）。"""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT county, town
        FROM regions
        ORDER BY county, town;
    """)
    rows = cursor.fetchall()
    conn.close()

    result = {}
    for row in rows:
        c = row["county"]
        t = row["town"]
        if c not in result:
            result[c] = []
        result[c].append(t)
    return result

if __name__ == "__main__":
    print("==================================================")
    print("1. 執行基本 SELECT 查詢 (weather_forecasts limit 3)")
    print("==================================================")
    basic_sample = query_all_weather(limit=3)
    print(json.dumps(basic_sample, ensure_ascii=False, indent=2))

    print("\n==================================================")
    print("2. 執行 SQL JOIN 查詢：查詢臺中市所有行政區天氣")
    print("==================================================")
    taichung_sample = query_weather_by_county("臺中市")
    print(f"臺中市有測站資料的行政區數量: {len(taichung_sample)}")
    if taichung_sample:
        print("前 2 筆範例：")
        print(json.dumps(taichung_sample[:2], ensure_ascii=False, indent=2))

    print("\n==================================================")
    print("3. 依特定鄉鎮查詢：臺中市 西屯區")
    print("==================================================")
    xitun_weather = query_weather_by_town("臺中市", "西屯區")
    print(json.dumps(xitun_weather, ensure_ascii=False, indent=2))

    print("\n==================================================")
    print("4. 全台 368 鄉鎮區整合查詢 (Web GIS 用)")
    print("==================================================")
    all_gis_weather = query_all_regions_latest()
    print(f"全台行政區總數: {len(all_gis_weather)}")
    with_weather_count = sum(1 for r in all_gis_weather if r["temperature"] is not None)
    print(f"具備即時氣象資訊的行政區: {with_weather_count} 區")

    # 輸出成 API JSON 測試檔案
    with open("data/sample_api_output.json", "w", encoding="utf-8") as f:
        json.dump(taichung_sample, f, ensure_ascii=False, indent=2)
    print("已成功將查詢結果轉換並儲存為 JSON 檔案: data/sample_api_output.json")
