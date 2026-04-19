"use client";

import { useState, useRef, useCallback, useEffect } from "react";

interface CameraState {
  stream: MediaStream | null;
  available: boolean;
  error: string | null;
}

export function useCamera() {
  const [state, setState] = useState<CameraState>({
    stream: null,
    available: false,
    error: null,
  });

  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = useCallback(async (): Promise<boolean> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      });
      streamRef.current = stream;
      setState({ stream, available: true, error: null });
      return true;
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "カメラにアクセスできません";
      setState({ stream: null, available: false, error: msg });
      return false;
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      setState({ stream: null, available: false, error: null });
    }
  }, []);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  return { ...state, startCamera, stopCamera };
}
