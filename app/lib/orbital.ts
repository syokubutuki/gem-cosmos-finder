/**
 * ケプラー軌道要素から惑星の赤経・赤緯を計算
 * 精度は1°程度（視覚的に十分）
 */

const DEG = Math.PI / 180;
const RAD = 180 / Math.PI;

// J2000.0 元期からの経過日数
function daysSinceJ2000(date: Date): number {
  const j2000 = Date.UTC(2000, 0, 1, 12, 0, 0); // 2000-01-01 12:00 UTC
  return (date.getTime() - j2000) / 86400000;
}

// 軌道要素: [a(AU), e, I(deg), L(deg), ω̃(deg), Ω(deg)]
// + 世紀あたりの変化率
interface OrbitalElements {
  a0: number; aDot: number;   // 長半径 AU
  e0: number; eDot: number;   // 離心率
  I0: number; IDot: number;   // 傾斜角 deg
  L0: number; LDot: number;   // 平均黄経 deg
  w0: number; wDot: number;   // 近日点黄経 deg
  O0: number; ODot: number;   // 昇交点黄経 deg
}

// NASA JPL 近似軌道要素 (J2000.0 + 世紀変化率)
const PLANETS: Record<string, OrbitalElements> = {
  mercury: { a0: 0.38710, aDot: 0, e0: 0.20563, eDot: 0.00002, I0: 7.005, IDot: -0.0060, L0: 252.251, LDot: 149472.675, w0: 77.456, wDot: 0.160, O0: 48.331, ODot: -0.125 },
  venus:   { a0: 0.72333, aDot: 0, e0: 0.00677, eDot: -0.00005, I0: 3.395, IDot: -0.0008, L0: 181.980, LDot: 58517.816, w0: 131.564, wDot: 0.300, O0: 76.680, ODot: -0.278 },
  mars:    { a0: 1.52368, aDot: 0, e0: 0.09340, eDot: 0.00009, I0: 1.850, IDot: -0.0023, L0: 355.453, LDot: 19140.300, w0: 336.061, wDot: 0.444, O0: 49.558, ODot: -0.293 },
  jupiter: { a0: 5.20261, aDot: 0, e0: 0.04849, eDot: 0.00016, I0: 1.303, IDot: -0.0020, L0: 34.351, LDot: 3034.906, w0: 14.331, wDot: 0.216, O0: 100.464, ODot: 0.132 },
  saturn:  { a0: 9.55491, aDot: 0, e0: 0.05551, eDot: -0.00035, I0: 2.489, IDot: 0.0025, L0: 50.077, LDot: 1222.114, w0: 93.057, wDot: 0.566, O0: 113.666, ODot: -0.251 },
  uranus:  { a0: 19.18797, aDot: 0, e0: 0.04686, eDot: -0.00002, I0: 0.773, IDot: -0.0016, L0: 314.055, LDot: 428.467, w0: 173.005, wDot: 0.095, O0: 74.006, ODot: 0.040 },
  neptune: { a0: 30.06952, aDot: 0, e0: 0.00895, eDot: 0.00001, I0: 1.770, IDot: 0.0003, L0: 304.349, LDot: 218.486, w0: 48.124, wDot: 0.060, O0: 131.784, ODot: -0.006 },
};

// 太陽の黄経（地球の軌道要素から）
const EARTH: OrbitalElements = {
  a0: 1.00000, aDot: 0, e0: 0.01671, eDot: -0.00004,
  I0: 0, IDot: 0, L0: 100.466, LDot: 35999.373,
  w0: 102.937, wDot: 0.324, O0: 0, ODot: 0,
};

function solveKepler(M: number, e: number): number {
  // ケプラー方程式 M = E - e*sin(E) をニュートン法で解く
  let E = M;
  for (let i = 0; i < 10; i++) {
    const dE = (M - (E - e * Math.sin(E))) / (1 - e * Math.cos(E));
    E += dE;
    if (Math.abs(dE) < 1e-8) break;
  }
  return E;
}

function computeHeliocentricEcliptic(
  elem: OrbitalElements,
  T: number
): { x: number; y: number; z: number } {
  const a = elem.a0 + elem.aDot * T;
  const e = elem.e0 + elem.eDot * T;
  const I = (elem.I0 + elem.IDot * T) * DEG;
  const L = (elem.L0 + elem.LDot * T) * DEG;
  const wp = (elem.w0 + elem.wDot * T) * DEG;
  const O = (elem.O0 + elem.ODot * T) * DEG;

  const w = wp - O;
  const M = L - wp;
  const E = solveKepler(M, e);

  const xp = a * (Math.cos(E) - e);
  const yp = a * Math.sqrt(1 - e * e) * Math.sin(E);

  const cosO = Math.cos(O), sinO = Math.sin(O);
  const cosI = Math.cos(I), sinI = Math.sin(I);
  const cosw = Math.cos(w), sinw = Math.sin(w);

  const x = (cosO * cosw - sinO * sinw * cosI) * xp +
            (-cosO * sinw - sinO * cosw * cosI) * yp;
  const y = (sinO * cosw + cosO * sinw * cosI) * xp +
            (-sinO * sinw + cosO * cosw * cosI) * yp;
  const z = (sinw * sinI) * xp + (cosw * sinI) * yp;

  return { x, y, z };
}

/**
 * 惑星のRA/Dec（度）を返す
 */
export function getPlanetPosition(
  planetId: string,
  date: Date
): { ra: number; dec: number; distanceAU: number } | null {
  const elem = PLANETS[planetId];
  if (!elem) return null;

  const d = daysSinceJ2000(date);
  const T = d / 36525; // 世紀

  // 惑星の日心黄道座標
  const planet = computeHeliocentricEcliptic(elem, T);
  // 地球の日心黄道座標
  const earth = computeHeliocentricEcliptic(EARTH, T);

  // 地心黄道座標
  const dx = planet.x - earth.x;
  const dy = planet.y - earth.y;
  const dz = planet.z - earth.z;

  // 黄道→赤道座標変換（黄道傾斜角 ε ≈ 23.4393°）
  const eps = 23.4393 * DEG;
  const xeq = dx;
  const yeq = dy * Math.cos(eps) - dz * Math.sin(eps);
  const zeq = dy * Math.sin(eps) + dz * Math.cos(eps);

  const distanceAU = Math.sqrt(xeq * xeq + yeq * yeq + zeq * zeq);
  let ra = Math.atan2(yeq, xeq) * RAD;
  if (ra < 0) ra += 360;
  const dec = Math.asin(zeq / distanceAU) * RAD;

  return { ra, dec, distanceAU };
}

/**
 * 太陽のRA/Decを返す（地球から見た太陽方向）
 */
export function getSunPosition(date: Date): { ra: number; dec: number } {
  const d = daysSinceJ2000(date);
  const T = d / 36525;

  const earth = computeHeliocentricEcliptic(EARTH, T);
  // 太陽は地球の反対側
  const dx = -earth.x;
  const dy = -earth.y;
  const dz = -earth.z;

  const eps = 23.4393 * DEG;
  const xeq = dx;
  const yeq = dy * Math.cos(eps) - dz * Math.sin(eps);
  const zeq = dy * Math.sin(eps) + dz * Math.cos(eps);

  const dist = Math.sqrt(xeq * xeq + yeq * yeq + zeq * zeq);
  let ra = Math.atan2(yeq, xeq) * RAD;
  if (ra < 0) ra += 360;
  const dec = Math.asin(zeq / dist) * RAD;

  return { ra, dec };
}

/**
 * 月の概算位置（精度数度）
 */
export function getMoonPosition(date: Date): { ra: number; dec: number } {
  const d = daysSinceJ2000(date);

  // 簡易月軌道
  const L = (218.316 + 13.176396 * d) % 360; // 平均黄経
  const M = (134.963 + 13.064993 * d) % 360; // 平均近点角
  const F = (93.272 + 13.229350 * d) % 360;  // 平均距角

  const Lr = L * DEG, Mr = M * DEG, Fr = F * DEG;

  const lon = L + 6.289 * Math.sin(Mr);
  const lat = 5.128 * Math.sin(Fr);

  const lonR = lon * DEG;
  const latR = lat * DEG;

  // 黄道→赤道
  const eps = 23.4393 * DEG;
  const ra = Math.atan2(
    Math.sin(lonR) * Math.cos(eps) - Math.tan(latR) * Math.sin(eps),
    Math.cos(lonR)
  ) * RAD;
  const dec = Math.asin(
    Math.sin(latR) * Math.cos(eps) + Math.cos(latR) * Math.sin(eps) * Math.sin(lonR)
  ) * RAD;

  return { ra: ((ra % 360) + 360) % 360, dec };
}
