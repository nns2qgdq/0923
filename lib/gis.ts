export async function fetchTownsGeoJSON() {
  const res = await fetch("/gis/towns.geojson");
  if (!res.ok) {
    throw new Error(`Failed to fetch towns GeoJSON: ${res.statusText}`);
  }
  return await res.json();
}

export async function fetchCountiesGeoJSON() {
  const res = await fetch("/gis/counties.geojson");
  if (!res.ok) {
    throw new Error(`Failed to fetch counties GeoJSON: ${res.statusText}`);
  }
  return await res.json();
}
