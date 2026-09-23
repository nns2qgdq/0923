import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { RegionWeather } from "@/lib/types";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const county = searchParams.get("county");
    const town = searchParams.get("town");

    const filePath = path.join(process.cwd(), "public", "data", "weather_summary.json");
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: "Weather data file not found" }, { status: 404 });
    }

    const fileContent = fs.readFileSync(filePath, "utf-8");
    let data: RegionWeather[] = JSON.parse(fileContent);

    if (county) {
      const normalizedCounty = county.replace("台", "臺");
      data = data.filter((item) => item.county === normalizedCounty);
    }

    if (town) {
      const normalizedTown = town.replace("台", "臺");
      data = data.filter((item) => item.town === normalizedTown);
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch weather data", details: String(error) },
      { status: 500 }
    );
  }
}
