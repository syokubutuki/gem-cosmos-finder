"use client";

import { useState, useCallback } from "react";
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

  const requestPosition = useCallback(async (): Promise<GeoPosition | null> => {
    if (!navigator.geolocation) {
      setState({ position: null, error: "位置情報がサポートされていません", loading: false });
      return null;
    }

    setState((s) => ({ ...s, loading: true }));

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const position: GeoPosition = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          };
          setState({ position, error: null, loading: false });
          resolve(position);
        },
        (err) => {
          setState({ position: null, error: err.message, loading: false });
          resolve(null);
        },
        { enableHighAccuracy: false, timeout: 10000 }
      );
    });
  }, []);

  return { ...state, requestPosition };
}
