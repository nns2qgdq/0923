import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { RegionsHierarchy } from "@/lib/types";

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), "public", "data", "regions_hierarchy.json");
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: "Regions hierarchy file not found" }, { status: 404 });
    }

    const fileContent = fs.readFileSync(filePath, "utf-8");
    const data: RegionsHierarchy = JSON.parse(fileContent);

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch regions hierarchy", details: String(error) },
      { status: 500 }
    );
  }
}
