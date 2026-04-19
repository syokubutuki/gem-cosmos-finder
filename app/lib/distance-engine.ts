import { DistanceDisplay } from "./types";
import { formatDistance } from "./distance-format";

const EARTH_DIAMETER_M = 1.2742e7;
const SHINKANSEN_SPEED_MS = 300 * 1000 / 3600; // 300 km/h in m/s
const C = 2.998e8; // speed of light m/s

/**
 * 距離(メートル)をlog10に変換
 * スケールバー用: 5.6 (ISS 408km) 〜 26.6 (観測可能宇宙の端)
 */
export function distanceToLog(distanceM: number): number {
  return Math.log10(Math.max(distanceM, 1));
}

export const LOG_SCALE_MIN = 5.6;
export const LOG_SCALE_MAX = 26.7;

/**
 * ログスケール値 → 0〜1 の正規化値
 */
export function logToNormalized(logVal: number): number {
  return (logVal - LOG_SCALE_MIN) / (LOG_SCALE_MAX - LOG_SCALE_MIN);
}

/**
 * 距離 → 表示用データ生成（単位自動選択 + 比喩）
 */
export function getDistanceDisplay(distanceM: number): DistanceDisplay {
  const formatted = formatDistance(distanceM);
  const metaphor = generateMetaphor(distanceM);
  const lightTravel = getLightTravelTime(distanceM);

  return {
    ...formatted,
    metaphor,
    lightTravel,
  };
}

function getLightTravelTime(distanceM: number): string {
  const seconds = distanceM / C;

  if (seconds < 1) return "光は一瞬で到達";
  if (seconds < 60) return `光で${seconds.toFixed(1)}秒`;
  if (seconds < 3600) return `光で${(seconds / 60).toFixed(1)}分`;
  if (seconds < 86400) return `光で${(seconds / 3600).toFixed(1)}時間`;
  if (seconds < 86400 * 365.25) return `光で${(seconds / 86400).toFixed(1)}日`;

  const years = seconds / (86400 * 365.25);
  if (years < 1e4) return `光で${years.toFixed(0)}年前に出発した光`;
  if (years < 1e6) return `${(years / 1e4).toFixed(1)}万年前に出発した光`;
  if (years < 1e8) return `${(years / 1e6).toFixed(0)}百万年前に出発した光`;
  if (years < 1e9) return `${(years / 1e8).toFixed(1)}億年前に出発した光`;
  return `${(years / 1e9).toFixed(1)}0億年前に出発した光`;
}

function generateMetaphor(distanceM: number): string | undefined {
  // 新幹線換算（太陽系内のみ）
  if (distanceM < 1e13) {
    const hours = distanceM / SHINKANSEN_SPEED_MS / 3600;
    if (hours < 24) return `新幹線で${hours.toFixed(1)}時間`;
    const days = hours / 24;
    if (days < 365) return `新幹線で${days.toFixed(0)}日`;
    const years = days / 365.25;
    if (years < 1e4) return `新幹線で${years.toFixed(0)}年`;
    if (years < 1e6) return `新幹線で${(years / 1e4).toFixed(0)}万年`;
    return `新幹線で${(years / 1e6).toFixed(0)}百万年`;
  }

  // 地球何個分（太陽系内）
  if (distanceM < 1e14) {
    const earths = distanceM / EARTH_DIAMETER_M;
    if (earths < 1e4) return `地球${earths.toFixed(0)}個分`;
    return `地球${(earths / 1e4).toFixed(0)}万個分`;
  }

  return undefined;
}

/**
 * ランドマーク距離一覧（スケールバーのティックマーク用）
 */
export const DISTANCE_LANDMARKS = [
  { label: "ISS", logVal: distanceToLog(4.08e5) },
  { label: "月", logVal: distanceToLog(3.84e8) },
  { label: "太陽", logVal: distanceToLog(1.5e11) },
  { label: "海王星", logVal: distanceToLog(4.5e12) },
  { label: "最寄り恒星", logVal: distanceToLog(4.0e16) },
  { label: "銀河中心", logVal: distanceToLog(2.5e20) },
  { label: "アンドロメダ", logVal: distanceToLog(2.4e22) },
  { label: "宇宙の端", logVal: distanceToLog(4.4e26) },
];
