"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { GeoPosition } from "../lib/types";

interface GeoState {
  position: GeoPosition | null;
  error: string | null;
  loading: boolean;
  log: string; // デバッグ用ログ
}

export function useGeolocation() {
  const [state, setState] = useState<GeoState>({
    position: null,
    error: null,
    loading: false,
    log: "待機中",
  });

  const watchId = useRef<number | null>(null);

  const startWatching = useCallback(() => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      setState(s => ({ ...s, error: "位置情報非対応", log: "Error: No Geolocation API" }));
      return;
    }

    setState(s => ({ ...s, loading: true, log: "GPS起動試行中..." }));

    const onSuccess = (pos: GeolocationPosition) => {
      const position: GeoPosition = {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      };
      setState(s => ({ 
        ...s, 
        position, 
        error: null, 
        loading: false, 
        log: `取得成功 (${pos.coords.accuracy.toFixed(0)}m)` 
      }));
    };

    const onError = (err: GeolocationPositionError) => {
      let msg = "取得失敗";
      if (err.code === 1) msg = "許可が必要です";
      if (err.code === 2) msg = "信号なし";
      if (err.code === 3) msg = "タイムアウト";
      
      setState(s => ({ 
        ...s, 
        error: msg, 
        loading: false, 
        log: `Error(${err.code}): ${err.message}` 
      }));

      // 高精度で失敗した場合は低精度で一度試す
      if (err.code === 3) {
        setState(s => ({ ...s, log: "低精度モードで再試行中..." }));
        navigator.geolocation.getCurrentPosition(onSuccess, undefined, { enableHighAccuracy: false, timeout: 5000 });
      }
    };

    if (watchId.current !== null) {
      navigator.geolocation.clearWatch(watchId.current);
    }

    // 最初に一度 getCurrentPosition を呼んで許可ダイアログを確実に促す
    navigator.geolocation.getCurrentPosition(onSuccess, onError, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    });

    // その後継続的に監視
    watchId.current = navigator.geolocation.watchPosition(onSuccess, onError, {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0
    });
  }, []);

  useEffect(() => {
    return () => {
      if (watchId.current !== null) {
        navigator.geolocation.clearWatch(watchId.current);
      }
    };
  }, []);

  return { ...state, requestPosition: startWatching };
}
