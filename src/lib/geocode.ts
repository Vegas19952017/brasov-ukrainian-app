import { BRASOV_CENTER } from "./utils";

export interface GeocodeResult {
  latitude: number;
  longitude: number;
  displayName: string;
}

export async function geocodeAddress(address: string): Promise<GeocodeResult | null> {
  const q = `${address.trim()}, Brașov, Romania`;
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`;
  try {
    const res = await fetch(url, { headers: { "Accept-Language": "uk,ro,en" } });
    if (!res.ok) return null;
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) {
      return { latitude: BRASOV_CENTER[0], longitude: BRASOV_CENTER[1], displayName: address };
    }
    const hit = data[0];
    return { latitude: parseFloat(hit.lat), longitude: parseFloat(hit.lon), displayName: hit.display_name ?? address };
  } catch {
    return null;
  }
}
