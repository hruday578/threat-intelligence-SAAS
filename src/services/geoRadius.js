// ─── Geo-Radius Expansion Service ────────────────────────────────────────────
// Uses free, no-key-required APIs to resolve a city name into coordinates,
// then discovers all cities/towns within the analyst's specified radius.

/**
 * Converts a city name string into lat/lon coordinates.
 * Uses Nominatim (OpenStreetMap) — free, no API key required.
 * Proxied through /nominatim to avoid CORS.
 * @param {string} cityName - e.g. "Bangalore"
 * @returns {Promise<{lat: number, lon: number} | null>}
 */
export async function geocodeCity(cityName) {
  try {
    const encoded = encodeURIComponent(cityName);
    const res = await fetch(`/nominatim/search?q=${encoded}&format=json&limit=1`, {
      headers: { 'Accept-Language': 'en' }
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data || !data.length) return null;
    return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
  } catch (e) {
    console.error('[GeoRadius] Geocoding failed:', e);
    return null;
  }
}

/**
 * Returns a list of city/town names within a given radius of a coordinate.
 * Uses the Overpass API (OpenStreetMap) — free, no API key required.
 * Proxied through /overpass to avoid CORS.
 * @param {number} lat - Latitude of center point
 * @param {number} lon - Longitude of center point
 * @param {number} radiusKm - Search radius in kilometers
 * @returns {Promise<string[]>} - Array of city name strings
 */
export async function getCitiesInRadius(lat, lon, radiusKm) {
  // Cap at 500km to avoid overloading the query
  const safeRadius = Math.min(radiusKm, 500);
  const radiusMeters = safeRadius * 1000;

  const query = `
    [out:json][timeout:25];
    (
      node(around:${radiusMeters},${lat},${lon})[place~"^(city|town|suburb)$"];
    );
    out body;
  `;

  try {
    const res = await fetch(`/overpass`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `data=${encodeURIComponent(query)}`
    });
    if (!res.ok) return [];
    const data = await res.json();
    const cities = (data.elements || [])
      .map(el => el.tags?.name)
      .filter(Boolean)
      .filter((name, i, arr) => arr.indexOf(name) === i); // dedupe
    return cities;
  } catch (e) {
    console.error('[GeoRadius] Overpass query failed:', e);
    return [];
  }
}
