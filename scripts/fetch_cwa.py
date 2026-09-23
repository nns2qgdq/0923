import os
import sys
import json
import logging
import urllib3
import requests
from dotenv import load_dotenv

# Suppress SSL certificate verification warnings for CWA government API
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

CWA_API_BASE = "https://opendata.cwa.gov.tw/api/v1/rest/datastore"
DEFAULT_DATASET = "O-A0003-001"

def get_cwa_api_key() -> str:
    """Load and validate CWA API key from environment variables."""
    load_dotenv()
    api_key = os.getenv("CWA_API_KEY")
    if not api_key:
        logger.error("CWA_API_KEY environment variable is missing. Please set it in .env file.")
        sys.exit(1)
    return api_key

def fetch_cwa_weather(dataset_id: str = DEFAULT_DATASET) -> dict:
    """
    Fetch weather observation data from CWA Open Data API.
    By default fetches O-A0003-001 (局屬氣象站-現在天氣觀測報告).
    """
    api_key = get_cwa_api_key()
    url = f"{CWA_API_BASE}/{dataset_id}"
    params = {
        "Authorization": api_key
    }
    
    logger.info(f"Fetching CWA dataset {dataset_id}...")
    try:
        response = requests.get(url, params=params, verify=False, timeout=15)
        response.raise_for_status()
        data = response.json()
        
        if not data.get("success"):
            raise ValueError(f"CWA API returned failure: {data}")
            
        stations = data.get("records", {}).get("Station", [])
        logger.info(f"Successfully retrieved {len(stations)} weather stations from CWA {dataset_id}.")
        return data
    except Exception as e:
        logger.error(f"Failed to fetch CWA dataset {dataset_id}: {e}")
        raise

def parse_station_observation(station: dict) -> dict:
    """Extract and standardize station observation fields for database storage."""
    geo_info = station.get("GeoInfo", {})
    weather_elem = station.get("WeatherElement", {})
    obs_time = station.get("ObsTime", {}).get("DateTime")
    
    # Extract WGS84 coordinates if available, fallback to direct StationLatitude/Longitude
    lat = None
    lon = None
    for coord in geo_info.get("Coordinates", []):
        if coord.get("CoordinateName") == "WGS84":
            lat = float(coord.get("StationLatitude", 0))
            lon = float(coord.get("StationLongitude", 0))
            break
            
    # Extract extreme temperature info
    daily_extreme = weather_elem.get("DailyExtreme", {})
    max_temp = None
    min_temp = None
    try:
        max_t_str = daily_extreme.get("DailyHigh", {}).get("TemperatureInfo", {}).get("AirTemperature")
        if max_t_str and max_t_str != "-99":
            max_temp = float(max_t_str)
    except (ValueError, TypeError):
        pass

    try:
        min_t_str = daily_extreme.get("DailyLow", {}).get("TemperatureInfo", {}).get("AirTemperature")
        if min_t_str and min_t_str != "-99":
            min_temp = float(min_t_str)
    except (ValueError, TypeError):
        pass

    # Extract current temperature
    temp = None
    try:
        temp_str = weather_elem.get("AirTemperature")
        if temp_str and temp_str != "-99":
            temp = float(temp_str)
    except (ValueError, TypeError):
        pass

    # Extract precipitation
    precipitation = None
    try:
        precip_str = weather_elem.get("Now", {}).get("Precipitation")
        if precip_str and precip_str != "-99":
            precipitation = float(precip_str)
    except (ValueError, TypeError):
        pass

    # Extract relative humidity
    humidity = None
    try:
        hum_str = weather_elem.get("RelativeHumidity")
        if hum_str and hum_str != "-99":
            humidity = float(hum_str)
    except (ValueError, TypeError):
        pass

    # Normalize county name: '台' -> '臺'
    county = geo_info.get("CountyName", "")
    if county:
        county = county.replace("台", "臺")
        
    town = geo_info.get("TownName", "")
    if town:
        town = town.replace("台", "臺")

    return {
        "station_id": station.get("StationId"),
        "station_name": station.get("StationName"),
        "obs_time": obs_time,
        "county": county,
        "town": town,
        "town_code": geo_info.get("TownCode"),
        "county_code": geo_info.get("CountyCode"),
        "latitude": lat,
        "longitude": lon,
        "altitude": float(geo_info.get("StationAltitude", 0)) if geo_info.get("StationAltitude") else None,
        "weather": weather_elem.get("Weather"),
        "temperature": temp,
        "min_temp": min_temp,
        "max_temp": max_temp,
        "precipitation": precipitation,
        "humidity": humidity,
        "wind_speed": float(weather_elem.get("WindSpeed", 0)) if weather_elem.get("WindSpeed") not in [None, "-99"] else None,
        "wind_direction": float(weather_elem.get("WindDirection", 0)) if weather_elem.get("WindDirection") not in [None, "-99"] else None,
        "air_pressure": float(weather_elem.get("AirPressure", 0)) if weather_elem.get("AirPressure") not in [None, "-99"] else None,
    }

if __name__ == "__main__":
    raw_data = fetch_cwa_weather()
    stations = raw_data.get("records", {}).get("Station", [])
    if stations:
        sample = parse_station_observation(stations[0])
        print("\n--- Parsed Sample Station Observation ---")
        print(json.dumps(sample, ensure_ascii=False, indent=2))
        
        # Save a sample cache file in data/
        os.makedirs("data", exist_ok=True)
        with open("data/cwa_latest.json", "w", encoding="utf-8") as f:
            json.dump([parse_station_observation(s) for s in stations], f, ensure_ascii=False, indent=2)
        logger.info(f"Saved {len(stations)} parsed stations to data/cwa_latest.json")
