/**
 * 天球座標 → 画面座標の射影変換 (Gnomonic projection)
 */

const DEG = Math.PI / 180;

export interface ProjectedPoint {
  x: number;
  y: number;
  visible: boolean;
}

/**
 * 接線面射影 (gnomonic projection)
 * 視野中心(centerRA, centerDec) と 天体(ra, dec) → 画面座標
 * 返り値: 正規化座標 (-1〜1 が視野内)
 */
export function gnomonicProject(
  ra: number,
  dec: number,
  centerRA: number,
  centerDec: number
): ProjectedPoint {
  const r = ra * DEG;
  const d = dec * DEG;
  const r0 = centerRA * DEG;
  const d0 = centerDec * DEG;

  const cosc =
    Math.sin(d0) * Math.sin(d) +
    Math.cos(d0) * Math.cos(d) * Math.cos(r - r0);

  // 視野の裏側にある天体
  if (cosc <= 0) {
    return { x: 0, y: 0, visible: false };
  }

  const x =
    (Math.cos(d) * Math.sin(r - r0)) / cosc;
  const y =
    (Math.cos(d0) * Math.sin(d) -
      Math.sin(d0) * Math.cos(d) * Math.cos(r - r0)) /
    cosc;

  return { x, y, visible: true };
}

/**
 * 正規化座標 → ピクセル座標に変換
 * fovDeg: 視野角（度）
 */
export function normalizedToScreen(
  nx: number,
  ny: number,
  canvasWidth: number,
  canvasHeight: number,
  fovDeg: number = 60
): { sx: number; sy: number } {
  const fovRad = fovDeg * DEG;
  const scale = canvasWidth / (2 * Math.tan(fovRad / 2));

  const sx = canvasWidth / 2 + nx * scale;
  const sy = canvasHeight / 2 - ny * scale; // Y軸反転

  return { sx, sy };
}
