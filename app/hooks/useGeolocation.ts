"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { GeoPosition } from "../lib/types";

interface GeoState {
  position: GeoPosition | null;
  error: string | null;
  loading: boolean;
}

export function useGeolocation() {
  const [state, setState] = useState<GeoState>({
    position: null,
    error: null,
    loading: false,
  });

  const watchId = useRef<number | null>(null);

  const startWatching = useCallback(() => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      setState({ position: null, error: "位置情報がサポートされていません", loading: false });
      return;
    }

    setState((s) => ({ ...s, loading: true }));

    // 既存の監視があれば停止
    if (watchId.current !== null) {
      navigator.geolocation.clearWatch(watchId.current);
    }

    watchId.current = navigator.geolocation.watchPosition(
      (pos) => {
        const position: GeoPosition = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        };
        setState({ position, error: null, loading: false });
      },
      (err) => {
        let msg = "位置情報の取得に失敗しました";
        if (err.code === 1) msg = "位置情報の使用が許可されていません。設定から許可してください。";
        if (err.code === 2) msg = "位置信号を特定できません（屋内や地下など）";
        if (err.code === 3) msg = "位置情報の取得中にタイムアウトしました";
        
        setState((s) => ({ ...s, error: msg, loading: false }));
      },
      { 
        enableHighAccuracy: true, 
        timeout: 20000, // 20秒に延長
        maximumAge: 0 
      }
    );
  }, []);

  useEffect(() => {
    startWatching();
    return () => {
      if (watchId.current !== null) {
        navigator.geolocation.clearWatch(watchId.current);
      }
    };
  }, [startWatching]);

  return { ...state, requestPosition: startWatching };
}
