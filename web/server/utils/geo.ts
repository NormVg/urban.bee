/** Geo helpers for duplicate detection. Distances in metres. */

const EARTH_RADIUS_M = 6_371_000

export interface LatLng {
  latitude: number
  longitude: number
}

export function haversineM(a: LatLng, b: LatLng): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const dLat = toRad(b.latitude - a.latitude)
  const dLng = toRad(b.longitude - a.longitude)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLng / 2) ** 2
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h))
}

/** Lat/lng box that contains every point within `radiusM` of `center`. */
export function boundingBox(center: LatLng, radiusM: number) {
  const dLat = (radiusM / EARTH_RADIUS_M) * (180 / Math.PI)
  const dLng = dLat / Math.cos((center.latitude * Math.PI) / 180)
  return {
    minLat: center.latitude - dLat,
    maxLat: center.latitude + dLat,
    minLng: center.longitude - dLng,
    maxLng: center.longitude + dLng,
  }
}

/** Centroid and radius (max distance from centroid) of a set of points. */
export function extentOf(points: LatLng[]): { center: LatLng; radiusM: number } {
  const center = {
    latitude: points.reduce((sum, p) => sum + p.latitude, 0) / points.length,
    longitude: points.reduce((sum, p) => sum + p.longitude, 0) / points.length,
  }
  const radiusM = Math.max(0, ...points.map((p) => haversineM(center, p)))
  return { center, radiusM }
}
