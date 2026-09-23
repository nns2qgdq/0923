import os
import sqlite3
from dotenv import load_dotenv

load_dotenv()

DB_PATH = os.getenv("DATABASE_URL", "weather.db")
if DB_PATH.startswith("sqlite:///"):
    DB_PATH = DB_PATH.replace("sqlite:///", "")

def get_db_connection(db_file: str = DB_PATH) -> sqlite3.Connection:
    """Create and return a database connection with foreign key support."""
    conn = sqlite3.connect(db_file)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn

def init_db(db_file: str = DB_PATH):
    """Initialize database tables according to IDC-2 schema specification."""
    conn = get_db_connection(db_file)
    cursor = conn.cursor()

    # 1. regions table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS regions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        county TEXT NOT NULL,
        town TEXT NOT NULL,
        gis_code TEXT UNIQUE,
        latitude REAL,
        longitude REAL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(county, town)
    );
    """)

    # 2. weather_forecasts table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS weather_forecasts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        region_id INTEGER NOT NULL,
        station_id TEXT,
        station_name TEXT,
        forecast_time TEXT NOT NULL,
        weather TEXT,
        temperature REAL,
        min_temp REAL,
        max_temp REAL,
        pop REAL,
        humidity REAL,
        wind_speed REAL,
        wind_direction REAL,
        air_pressure REAL,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (region_id) REFERENCES regions(id) ON DELETE CASCADE,
        UNIQUE(region_id, forecast_time)
    );
    """)

    # Indexes for fast lookup
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_regions_county ON regions(county);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_regions_town ON regions(town);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_weather_region_time ON weather_forecasts(region_id, forecast_time);")

    conn.commit()
    conn.close()

if __name__ == "__main__":
    init_db()
    print(f"Database initialized successfully at {DB_PATH}")
