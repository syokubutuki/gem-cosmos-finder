"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface OrientationState {
  alpha: number;
  beta: number;
  gamma: number;
  available: boolean;
  permissionGranted: boolean;
}

const ALPHA_FILTER = 0.15;

export function useDeviceOrientation() {
  const [state, setState] = useState<OrientationState>({
    alpha: 0,
    beta: 0,
    gamma: 0,
    available: false,
    permissionGranted: false,
  });

  const filteredRef = useRef({ alpha: 0, beta: 90, gamma: 0 });
  const isIOS = useRef(false);

  useEffect(() => {
    isIOS.current =
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  }, []);

  const handleOrientation = useCallback(
    (e: DeviceOrientationEvent) => {
      let alpha: number;

      // iOS: webkitCompassHeadingが真北基準
      if (
        isIOS.current &&
        (e as DeviceOrientationEvent & { webkitCompassHeading?: number })
          .webkitCompassHeading != null
      ) {
        alpha = (
          e as DeviceOrientationEvent & { webkitCompassHeading: number }
        ).webkitCompassHeading;
      } else {
        alpha = e.alpha ?? 0;
      }

      const beta = e.beta ?? 90;
      const gamma = e.gamma ?? 0;

      // ローパスフィルタ
      const f = filteredRef.current;

      // alpha は角度の循環を考慮
      let dAlpha = alpha - f.alpha;
      if (dAlpha > 180) dAlpha -= 360;
      if (dAlpha < -180) dAlpha += 360;

      f.alpha = ((f.alpha + dAlpha * ALPHA_FILTER) % 360 + 360) % 360;
      f.beta = f.beta + (beta - f.beta) * ALPHA_FILTER;
      f.gamma = f.gamma + (gamma - f.gamma) * ALPHA_FILTER;

      setState({
        alpha: f.alpha,
        beta: f.beta,
        gamma: f.gamma,
        available: true,
        permissionGranted: true,
      });
    },
    []
  );

  const requestPermission = useCallback(async (): Promise<boolean> => {
    // iOS 13+ requires explicit permission
    const DOE = DeviceOrientationEvent as typeof DeviceOrientationEvent & {
      requestPermission?: () => Promise<string>;
    };

    if (typeof DOE.requestPermission === "function") {
      try {
        const result = await DOE.requestPermission();
        if (result === "granted") {
          window.addEventListener("deviceorientation", handleOrientation, true);
          setState((s) => ({ ...s, permissionGranted: true }));
          return true;
        }
        return false;
      } catch {
        return false;
      }
    }

    // Android / non-iOS: just listen
    window.addEventListener("deviceorientation", handleOrientation, true);

    // Check if events actually fire
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        setState((s) => ({ ...s, available: false }));
        resolve(false);
      }, 1000);

      const check = () => {
        clearTimeout(timeout);
        setState((s) => ({ ...s, available: true, permissionGranted: true }));
        window.removeEventListener("deviceorientation", check);
        resolve(true);
      };
      window.addEventListener("deviceorientation", check, { once: true });
    });
  }, [handleOrientation]);

  useEffect(() => {
    return () => {
      window.removeEventListener("deviceorientation", handleOrientation, true);
    };
  }, [handleOrientation]);

  return {
    ...state,
    isIOS: isIOS.current,
    requestPermission,
  };
}
