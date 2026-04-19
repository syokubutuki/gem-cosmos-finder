interface ISSPosition {
  latitude: number;
  longitude: number;
  timestamp: number;
}

/**
 * Open Notify APIからISS位置を取得
 */
export async function fetchISSPosition(): Promise<ISSPosition | null> {
  try {
    const res = await fetch("http://api.open-notify.org/iss-now.json", {
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return {
      latitude: parseFloat(data.iss_position.latitude),
      longitude: parseFloat(data.iss_position.longitude),
      timestamp: data.timestamp,
    };
  } catch {
    return null;
  }
}

/**
 * ISS位置（緯度経度）+ 観測者位置 → 方位角・仰角に変換
 */
export function issToAzAlt(
  issLat: number,
  issLon: number,
  obsLat: number,
  obsLon: number,
  issAltKm: number = 408
): { azimuth: number; altitude: number } {
  const DEG = Math.PI / 180;
  const R = 6371; // 地球半径 km

  const lat1 = obsLat * DEG;
  const lat2 = issLat * DEG;
  const dLon = (issLon - obsLon) * DEG;

  // 地心角
  const cosC =
    Math.sin(lat1) * Math.sin(lat2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.cos(dLon);
  const C = Math.acos(Math.max(-1, Math.min(1, cosC)));

  // 仰角
  const altitude =
    Math.atan2(
      Math.cos(C) - R / (R + issAltKm),
      Math.sin(C)
    ) / DEG;

  // 方位角
  const y = Math.sin(dLon) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  let azimuth = Math.atan2(y, x) / DEG;
  if (azimuth < 0) azimuth += 360;

  return { azimuth, altitude };
}
