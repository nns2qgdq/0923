# IDC-2 Taiwan Weather GIS Dashboard 開發計畫

## 專案目標

建立一套整合 **中央氣象署（CWA）Open Data** 與 **GIS 開放資料**
的台灣天氣 Web App。

系統將透過 API 取得氣象資料，使用 Python
進行資料解析與整理，將資料寫入資料庫，再透過 SQL
讀取及整合氣象與行政區資料。前端以互動式 GIS
地圖呈現各地區天氣資訊，最後將原始碼上傳 GitHub，並部署至 Vercel。

### 核心技術

-   CWA Open Data API
-   GIS Open Data / GeoJSON
-   Python
-   JSON
-   SQL / Database
-   Next.js
-   Leaflet
-   Git / GitHub
-   Vercel

------------------------------------------------------------------------

# Workflow

``` text
① Open Data
CWA API + GIS
      ↓
② Data Processing
Python / JSON
      ↓
③ Database
INSERT → DB → SELECT / JOIN
      ↓
④ Web GIS
Next.js + Leaflet
      ↓
⑤ Deployment
GitHub → Vercel
```

------------------------------------------------------------------------

## Step 1 --- 取得 Open Data

### 目標

取得專案需要的兩類開放資料：

1.  中央氣象署 CWA 天氣預報資料
2.  台灣行政區 GIS 開放資料

### CWA 天氣資料

透過 CWA Open Data API 取得 JSON 格式的現在天氣觀測資料（**使用資料集：`O-A0003-001` 局屬氣象站-現在天氣觀測報告**）。

預計使用資料：

-   縣市 / 鄉鎮市區（CountyName, TownName）
-   觀測時間（ObsTime.DateTime）
-   天氣現象（Weather）
-   溫度（AirTemperature）
-   最高溫（DailyExtreme.DailyHigh）
-   最低溫（DailyExtreme.DailyLow）
-   降水量（Now.Precipitation）
-   相對濕度（RelativeHumidity）
-   風速 / 風向 / 氣壓等氣象資訊

API Key 不直接寫入前端程式碼，使用環境變數保存。

例如：

``` bash
CWA_API_KEY="YOUR_API_KEY"
```

### GIS 資料

取得台灣行政區 GIS Open Data，優先採用 GeoJSON 或可轉換成 GeoJSON
的資料格式。

主要欄位：

``` text
COUNTYNAME
TOWNNAME
行政區代碼 (TOWNCODE / COUNTYCODE)
Geometry
```

GIS 資料將用於：

-   顯示台灣行政區邊界
-   將行政區與 CWA 天氣資料對應
-   建立互動式 GIS 天氣地圖

### 完成條件

-   [x] 能成功呼叫 CWA API (`O-A0003-001`)
-   [x] 能取得並解析 JSON (`scripts/fetch_cwa.py`)
-   [x] 找到合適的 GIS Open Data (`public/gis/counties.geojson`, `public/gis/towns.geojson`)
-   [x] 能取得行政區名稱與 Geometry
-   [x] 確認 CWA 與 GIS 行政區名稱可建立對應關係（比對 363 測站對應率 100%）

------------------------------------------------------------------------

## Step 2 --- 資料解析與資料庫儲存

### 目標

使用 Python 將 CWA JSON 與 GIS 資料轉換成系統需要的結構，並寫入資料庫。

### 資料處理流程

``` text
CWA API
   │
   ├── JSON Parsing
   │
   ├── 欄位整理
   │
   └── 資料格式標準化
           │
           ▼
        Database

GIS Open Data
   │
   ├── 行政區名稱整理
   └── GIS Code / Geometry
           │
           ▼
        Database
```

### Python 處理內容

預計建立：

``` text
scripts/
├── fetch_cwa.py
├── import_gis.py
└── update_weather.py
```

功能：

-   呼叫 CWA API
-   解析 JSON
-   處理缺少值
-   統一日期時間格式
-   統一縣市 / 鄉鎮名稱
-   寫入 GIS 行政區資料
-   寫入 / 更新氣象資料

### Database 寫入

必須實作資料庫寫入動作，例如：

``` sql
INSERT INTO weather_forecasts (
    region_id,
    forecast_time,
    min_temp,
    max_temp,
    pop
)
VALUES (?, ?, ?, ?, ?);
```

重複取得相同預報資料時，可進一步使用 UPSERT 或 UPDATE 避免產生重複資料。

### 完成條件

-   [x] Python 能解析 CWA JSON (`scripts/fetch_cwa.py`)
-   [x] 能解析 GIS Open Data (`scripts/import_gis.py`)
-   [x] 建立 Database Schema (`scripts/database.py`)
-   [x] GIS 資料可寫入 DB (368 鄉鎮區寫入 `regions` 表，包含幾何中心經緯度)
-   [x] CWA 資料可 INSERT 至 DB (`scripts/update_weather.py`)
-   [x] 重複資料有適當處理機制 (使用 SQLite UPSERT `ON CONFLICT DO UPDATE SET`)

------------------------------------------------------------------------

## Step 3 --- SQL 查詢與資料整合

### 目標

透過 SQL 從資料庫讀取資料，並整合 GIS 行政區與 CWA 天氣資訊。

### Database Schema

初步規劃兩個主要資料表：

``` text
regions
────────────────────
id
county
town
gis_code
latitude
longitude


weather_forecasts
────────────────────
id
region_id
forecast_time
weather
temperature
min_temp
max_temp
pop
humidity
```

資料關聯：

``` text
regions
   │
   │ 1
   │
   │ N
   ▼
weather_forecasts
```

### SQL SELECT

基本查詢：

``` sql
SELECT *
FROM weather_forecasts
ORDER BY forecast_time;
```

### SQL JOIN

將行政區與天氣資料整合：

``` sql
SELECT
    r.county,
    r.town,
    r.gis_code,
    w.forecast_time,
    w.weather,
    w.min_temp,
    w.max_temp,
    w.pop
FROM weather_forecasts AS w
JOIN regions AS r
    ON w.region_id = r.id
WHERE r.county = '臺中市'
ORDER BY w.forecast_time;
```

### Web API 輸出

SQL 查詢結果轉換成 JSON：

``` json
[
  {
    "county": "臺中市",
    "town": "西屯區",
    "forecast_time": "2026-09-23T18:00:00",
    "min_temp": 25,
    "max_temp": 32,
    "pop": 60
  }
]
```

提供 Web GIS 使用。

### 完成條件

-   [x] 可以使用 SELECT 讀取資料 (`query_all_weather`)
-   [x] 可以依縣市 / 鄉鎮查詢 (`query_weather_by_county`, `query_weather_by_town`)
-   [x] 可以使用 JOIN 整合資料 (`JOIN regions AS r ON w.region_id = r.id`)
-   [x] 查詢結果可轉換成 JSON (`data/sample_api_output.json`, `public/data/weather_summary.json`)
-   [x] Web App 可以透過 API / 資料端點取得資料 (`public/data/weather_summary.json` & `public/data/regions_hierarchy.json`)

------------------------------------------------------------------------

## Step 4 --- 建立 GIS 天氣 Web App

### 目標

使用 Next.js 與 Leaflet 建立互動式台灣天氣 GIS Dashboard。

### 技術

``` text
Next.js
TypeScript
Leaflet
GeoJSON
REST API
```

### 主要功能

#### 1. 台灣 GIS 地圖

顯示：

-   縣市邊界
-   鄉鎮市區邊界
-   行政區名稱

#### 2. 天氣資料視覺化

GIS 地圖可依不同氣象資料呈現：

``` text
Temperature
Rain Probability
Humidity
Weather
```

例如溫度 Layer：

``` text
< 20°C
20 ~ 25°C
25 ~ 30°C
> 30°C
```

#### 3. 行政區互動

使用者點擊地圖上的行政區後顯示：

``` text
臺中市 / 西屯區

天氣：多雲
溫度：29°C
最高溫：32°C
最低溫：25°C
降雨機率：60%
```

#### 4. 天氣趨勢

以圖表呈現：

-   溫度趨勢
-   最高 / 最低溫
-   降雨機率

#### 5. 地區選擇

提供：

``` text
縣市 → 鄉鎮市區
```

下拉式選單，並與 GIS 地圖連動。

### 預計頁面

``` text
┌─────────────────────────────────────┐
│ Taiwan Weather GIS Dashboard        │
├─────────────────────────────────────┤
│ County [臺中市 ▼] Town [西屯區 ▼]   │
├───────────────────┬─────────────────┤
│                   │ Weather Detail  │
│                   │                 │
│    Taiwan GIS     │ Temp: 29°C      │
│       Map         │ Max : 32°C      │
│                   │ Min : 25°C      │
│                   │ PoP : 60%       │
├───────────────────┴─────────────────┤
│ Weather Trend Chart                 │
└─────────────────────────────────────┘
```

### 完成條件

-   [x] Next.js 基本 Web App (Next.js 14 App Router + TypeScript)
-   [x] Leaflet GIS 地圖 (`components/TaiwanMap.tsx`)
-   [x] 載入 GeoJSON (`public/gis/towns.geojson` 全台 368 鄉鎮區向量多邊形)
-   [x] 顯示行政區 (支援溫度、累積降雨、相對濕度三種視覺化圖層)
-   [x] 從 Database API 取得天氣資料 (`/api/weather`, `/api/regions`)
-   [x] 點擊行政區顯示天氣 (`components/WeatherCard.tsx` 即時詳情)
-   [x] 地區下拉選單 (`components/RegionSelector.tsx` 縣市/鄉鎮連動)
-   [x] 天氣趨勢圖表 (`components/WeatherChart.tsx` 氣溫高低溫分布與降雨排行)

------------------------------------------------------------------------

## Step 5 --- GitHub 與 Vercel 部署

### 目標

將完整專案納入 Git 版本控制，上傳 GitHub，並透過 Vercel 建立公開 Web
App。

### GitHub Repository

預計專案結構：

``` text
taiwan-weather-gis/
│
├── app/
│   ├── page.tsx
│   └── api/
│
├── components/
│   ├── TaiwanMap.tsx
│   ├── WeatherCard.tsx
│   ├── WeatherChart.tsx
│   └── RegionSelector.tsx
│
├── lib/
│   ├── weather.ts
│   ├── database.ts
│   └── gis.ts
│
├── scripts/
│   ├── fetch_cwa.py
│   ├── import_gis.py
│   └── update_weather.py
│
├── public/
│   └── gis/
│
├── README.md
├── package.json
└── .gitignore
```

### Git Workflow

``` bash
git add .
git commit -m "Add CWA weather GIS dashboard"
git push origin main
```

流程：

``` text
Local Development
       │
       ▼
      Git
       │
       ▼
     GitHub
       │
       ▼
     Vercel
       │
       ▼
Production Web App
```

### Environment Variables

API Key 與資料庫連線資訊不可提交至 GitHub。

例如：

``` text
CWA_API_KEY=
DATABASE_URL=
```

加入 `.gitignore`：

``` text
.env
.env.local
```

並於 Vercel 設定 Production Environment Variables。

### Deployment

GitHub `main` branch 更新後：

``` text
git push
   ↓
GitHub
   ↓
Vercel Build
   ↓
Deploy
   ↓
Taiwan Weather GIS
```

### 完成條件

-   [x] 建立 GitHub Repository (已初始化 Git 並關聯 remote origin: `https://github.com/nns2qgdq/0923.git`)
-   [x] 完成 `.gitignore` (已妥善排除 `.env`, `.venv`, `node_modules`, `weather.db`, `.next`)
-   [x] API Key 不存在 Git Repository (僅提交 `.env.example` 範本)
-   [x] Vercel 連接 GitHub
-   [x] 設定 Environment Variables
-   [x] Production Build 成功 (`npm run build` 通過)
-   [x] Web App 可公開存取 (`https://taiwan-weather-al3c1yv90-r1-3876.vercel.app/`)
-   [x] GitHub Push 後可自動重新部署

------------------------------------------------------------------------

# 最終成果

完成後系統應具備以下完整資料流程：

``` text
CWA Open Data ────────┐
                      │
GIS Open Data ────────┤
                      ▼
               Python Processing
                      │
                      ▼
               Database INSERT
                      │
                      ▼
               SQL SELECT / JOIN
                      │
                      ▼
                  Web API
                      │
                      ▼
            Next.js + Leaflet GIS
                      │
                      ▼
                    GitHub
                      │
                      ▼
                    Vercel
```

## 最終展示項目

-   CWA Open Data API 資料取得
-   GIS Open Data
-   JSON 資料解析
-   Python 資料處理
-   Database INSERT / UPDATE
-   SQL SELECT / JOIN
-   REST API
-   GIS 互動式地圖
-   天氣資訊與趨勢圖
-   Git / GitHub 版本控制
-   Vercel Cloud Deployment

## 專案完成定義

使用者開啟部署於 Vercel 的 Taiwan Weather GIS
Dashboard，可選擇或點擊台灣行政區，系統從資料庫讀取已取得的 CWA
天氣資料，並在 GIS 地圖及圖表中呈現該地區的天氣預報資訊；後端具備從 Open
Data 取得、解析並寫入資料庫的完整資料處理流程。
