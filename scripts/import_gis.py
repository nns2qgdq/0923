import os
import sys
import json
import logging
from shapely.geometry import shape

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from database import get_db_connection, init_db

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

GIS_TOWNS_FILE = "public/gis/towns.geojson"

def normalize_name(name: str) -> str:
    """Normalize Taiwanese administrative names ('台' -> '臺')."""
    if not name:
        return ""
    return name.strip().replace("台", "臺")

def import_towns_to_db(geojson_path: str = GIS_TOWNS_FILE):
    """
    Parse Taiwan township GeoJSON, compute center coordinates,
    and populate the regions table.
    """
    if not os.path.exists(geojson_path):
        raise FileNotFoundError(f"GeoJSON file not found at {geojson_path}")

    init_db()
    conn = get_db_connection()
    cursor = conn.cursor()

    logger.info(f"Loading GIS township data from {geojson_path}...")
    with open(geojson_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    features = data.get("features", [])
    logger.info(f"Found {len(features)} township features. Importing into database...")

    upsert_sql = """
    INSERT INTO regions (county, town, gis_code, latitude, longitude)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(county, town) DO UPDATE SET
        gis_code = excluded.gis_code,
        latitude = excluded.latitude,
        longitude = excluded.longitude;
    """

    count = 0
    for feat in features:
        props = feat.get("properties", {})
        geometry = feat.get("geometry", {})

        county = normalize_name(props.get("COUNTYNAME", ""))
        town = normalize_name(props.get("TOWNNAME", ""))
        gis_code = props.get("TOWNCODE") or props.get("TOWNID")

        if not county or not town:
            continue

        # Calculate geometric centroid
        lat = None
        lon = None
        if geometry:
            try:
                geom = shape(geometry)
                centroid = geom.centroid
                lat = round(centroid.y, 6)
                lon = round(centroid.x, 6)
            except Exception as e:
                logger.warning(f"Could not compute centroid for {county} {town}: {e}")

        cursor.execute(upsert_sql, (county, town, gis_code, lat, lon))
        count += 1

    conn.commit()

    # Query total records
    cursor.execute("SELECT COUNT(*) AS total FROM regions;")
    total_regions = cursor.fetchone()["total"]
    logger.info(f"Successfully imported/updated {count} township records. Total regions in DB: {total_regions}")

    # Display sample records
    cursor.execute("SELECT id, county, town, gis_code, latitude, longitude FROM regions ORDER BY id LIMIT 5;")
    samples = [dict(row) for row in cursor.fetchall()]
    logger.info(f"Sample imported regions: {json.dumps(samples, ensure_ascii=False, indent=2)}")

    conn.close()

if __name__ == "__main__":
    import_towns_to_db()
