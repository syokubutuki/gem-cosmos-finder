export type DistanceLayer = "earth-orbit" | "solar-system" | "galaxy" | "deep-universe";

export type ObjectType =
  | "satellite"
  | "star"
  | "planet"
  | "nebula"
  | "star-cluster"
  | "galaxy"
  | "galaxy-cluster"
  | "quasar"
  | "cmb";

export interface CelestialObject {
  id: string;
  name: string;
  nameEn: string;
  ra: number;       // 赤経 (0-360度)
  dec: number;      // 赤緯 (-90〜+90度)
  distanceM: number; // 距離（メートル）
  type: ObjectType;
  layer: DistanceLayer;
  description: string;
  magnitude?: number;
  dynamic?: boolean;
}

export interface DeviceOrientation {
  alpha: number; // 0-360 (compass heading)
  beta: number;  // -180 to 180 (front-back tilt)
  gamma: number; // -90 to 90 (left-right tilt)
}

export interface GeoPosition {
  latitude: number;
  longitude: number;
}

export interface ScreenPoint {
  x: number;
  y: number;
  visible: boolean;
}

export interface VisibleObject {
  object: CelestialObject;
  screenX: number;
  screenY: number;
  angularDistance: number;
}

export interface DistanceDisplay {
  value: string;       // "4.2"
  unit: string;        // "光年"
  full: string;        // "4.2光年"
  metaphor?: string;   // 旅の比喩
  lightTravel?: string; // 光の旅行時間
}
