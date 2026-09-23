import os
import sys
import logging

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from fetch_cwa import fetch_cwa_weather, parse_station_observation
from database import get_db_connection, init_db

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

def update_weather_records():
    """
    Fetch latest weather observation data from CWA O-A0003-001,
    associate each station with a region_id from regions table,
    and UPSERT into weather_forecasts table.
    """
    init_db()
    conn = get_db_connection()
    cursor = conn.cursor()

    # Preload regions mapping: (county, town) -> region_id
    cursor.execute("SELECT id, county, town FROM regions;")
    region_map = {(row["county"], row["town"]): row["id"] for row in cursor.fetchall()}
    logger.info(f"Loaded {len(region_map)} region mappings from database.")

    # Fetch CWA data
    raw_cwa = fetch_cwa_weather()
    stations = raw_cwa.get("records", {}).get("Station", [])
    logger.info(f"Fetched {len(stations)} stations from CWA O-A0003-001.")

    upsert_sql = """
    INSERT INTO weather_forecasts (
        region_id,
        station_id,
        station_name,
        forecast_time,
        weather,
        temperature,
        min_temp,
        max_temp,
        pop,
        humidity,
        wind_speed,
        wind_direction,
        air_pressure,
        updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(region_id, forecast_time) DO UPDATE SET
        station_id = excluded.station_id,
        station_name = excluded.station_name,
        weather = excluded.weather,
        temperature = excluded.temperature,
        min_temp = excluded.min_temp,
        max_temp = excluded.max_temp,
        pop = excluded.pop,
        humidity = excluded.humidity,
        wind_speed = excluded.wind_speed,
        wind_direction = excluded.wind_direction,
        air_pressure = excluded.air_pressure,
        updated_at = CURRENT_TIMESTAMP;
    """

    inserted_or_updated = 0
    unmatched_stations = 0

    for station_raw in stations:
        obs = parse_station_observation(station_raw)
        county = obs.get("county")
        town = obs.get("town")
        forecast_time = obs.get("obs_time")

        region_id = region_map.get((county, town))
        if not region_id:
            logger.warning(f"No matching region found in DB for station {obs.get('station_name')} ({county} {town})")
            unmatched_stations += 1
            continue

        cursor.execute(
            upsert_sql,
            (
                region_id,
                obs.get("station_id"),
                obs.get("station_name"),
                forecast_time,
                obs.get("weather"),
                obs.get("temperature"),
                obs.get("min_temp"),
                obs.get("max_temp"),
                obs.get("precipitation"),  # mapped to pop (precipitation in mm)
                obs.get("humidity"),
                obs.get("wind_speed"),
                obs.get("wind_direction"),
                obs.get("air_pressure"),
            ),
        )
        inserted_or_updated += 1

    conn.commit()

    # Query total records
    cursor.execute("SELECT COUNT(*) AS total FROM weather_forecasts;")
    total_forecasts = cursor.fetchone()["total"]
    logger.info(f"Weather update complete: {inserted_or_updated} records UPSERTed. (Unmatched: {unmatched_stations}). Total in DB: {total_forecasts}")

    # Query a sample joined result to verify
    cursor.execute("""
    SELECT
        r.county,
        r.town,
        r.gis_code,
        w.station_name,
        w.forecast_time,
        w.weather,
        w.temperature,
        w.min_temp,
        w.max_temp,
        w.pop,
        w.humidity
    FROM weather_forecasts AS w
    JOIN regions AS r ON w.region_id = r.id
    WHERE r.county = '臺中市'
    ORDER BY w.forecast_time DESC
    LIMIT 3;
    """)
    samples = [dict(row) for row in cursor.fetchall()]
    logger.info(f"Sample Taichung weather query verification:\n{samples}")

    conn.close()

    # Automatically export fresh public data
    try:
        from query_weather import query_all_regions_latest, query_counties_list
        import json
        os.makedirs("public/data", exist_ok=True)
        all_data = query_all_regions_latest()
        with open("public/data/weather_summary.json", "w", encoding="utf-8") as f:
            json.dump(all_data, f, ensure_ascii=False, indent=2)
        hierarchy = query_counties_list()
        with open("public/data/regions_hierarchy.json", "w", encoding="utf-8") as f:
            json.dump(hierarchy, f, ensure_ascii=False, indent=2)
        logger.info("Exported fresh data to public/data/weather_summary.json & regions_hierarchy.json")
    except Exception as e:
        logger.warning(f"Public data export failed: {e}")

if __name__ == "__main__":
    update_weather_records()
