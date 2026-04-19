"use client";

import { useMemo } from "react";
import { CelestialObject, DistanceLayer, VisibleObject } from "../lib/types";
import { CELESTIAL_OBJECTS } from "../lib/celestial-objects";
import { angularDistance } from "../lib/coordinates";
import { gnomonicProject, normalizedToScreen } from "../lib/projection";

const MAX_VISIBLE = 20;
const FOV_DEG = 60;

interface SearchParams {
  centerRA: number;
  centerDec: number;
  canvasWidth: number;
  canvasHeight: number;
  activeLayers: Set<DistanceLayer>;
  dynamicPositions: Map<string, { ra: number; dec: number; distanceM?: number }>;
}

export function useCelestialSearch(params: SearchParams): VisibleObject[] {
  const { centerRA, centerDec, canvasWidth, canvasHeight, activeLayers, dynamicPositions } =
    params;

  return useMemo(() => {
    const candidates: {
      object: CelestialObject;
      angDist: number;
      ra: number;
      dec: number;
    }[] = [];

    for (const obj of CELESTIAL_OBJECTS) {
      if (!activeLayers.has(obj.layer)) continue;

      let ra = obj.ra;
      let dec = obj.dec;
      let distanceM = obj.distanceM;

      // 動的天体の位置を上書き
      if (obj.dynamic) {
        const pos = dynamicPositions.get(obj.id);
        if (pos) {
          ra = pos.ra;
          dec = pos.dec;
          if (pos.distanceM !== undefined) distanceM = pos.distanceM;
        } else if (obj.id === "iss") {
          continue; // ISSでデータなしならスキップ
        }
      }

      // CMBは全方向にあるので常に表示
      if (obj.type === "cmb") {
        candidates.push({ object: { ...obj, ra: centerRA, dec: centerDec, distanceM }, angDist: 0, ra: centerRA, dec: centerDec });
        continue;
      }

      const angDist = angularDistance(centerRA, centerDec, ra, dec);
      if (angDist <= FOV_DEG) {
        candidates.push({
          object: { ...obj, ra, dec, distanceM },
          angDist,
          ra,
          dec,
        });
      }
    }

    // 中心近さ × 重要度（明るさ）でソート
    candidates.sort((a, b) => {
      const importanceA = a.object.magnitude !== undefined ? -a.object.magnitude : 0;
      const importanceB = b.object.magnitude !== undefined ? -b.object.magnitude : 0;
      const scoreA = importanceA - a.angDist * 0.5;
      const scoreB = importanceB - b.angDist * 0.5;
      return scoreB - scoreA;
    });

    return candidates.slice(0, MAX_VISIBLE).map(({ object, angDist, ra, dec }) => {
      const projected = gnomonicProject(ra, dec, centerRA, centerDec);
      const screen = normalizedToScreen(
        projected.x,
        projected.y,
        canvasWidth,
        canvasHeight,
        FOV_DEG
      );

      return {
        object,
        screenX: screen.sx,
        screenY: screen.sy,
        angularDistance: angDist,
      };
    });
  }, [centerRA, centerDec, canvasWidth, canvasHeight, activeLayers, dynamicPositions]);
}
