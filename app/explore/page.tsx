"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useCamera } from "../hooks/useCamera";
import { useDeviceOrientation } from "../hooks/useDeviceOrientation";
import { useGeolocation } from "../hooks/useGeolocation";
import { useISS } from "../hooks/useISS";
import { useCelestialSearch } from "../hooks/useCelestialSearch";
import { gnomonicProject, normalizedToScreen } from "../lib/projection";
import { deviceOrientationToAzAlt, azAltToRaDec } from "../lib/coordinates";
import { formatDistance } from "../lib/distance-format";
import { DistanceLayer } from "../lib/types";
import { LAYER_COLORS } from "../lib/celestial-objects";

export default function ExplorePage() {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const { stream, available: cameraActive, error: cameraError, startCamera } = useCamera();
  const { position: userPosition, error: geoError, requestPosition, log: geoLog } = useGeolocation();
  const {
    alpha,
    beta,
    gamma,
    isIOS,
    permissionGranted: orientationPermission,
    requestPermission: requestOrientationPermission,
  } = useDeviceOrientation();
  
  const iss = useISS(userPosition);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  const [permissionStep, setPermissionStep] = useState<"camera" | "orientation" | "location" | "ready">("camera");

  // 画面サイズ取得
  useEffect(() => {
    const updateSize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  // スマホが向いているRA/Decを計算
  const centerCoords = useMemo(() => {
    if (!userPosition) return { ra: 0, dec: 0 };
    const { azimuth, altitude } = deviceOrientationToAzAlt(alpha, beta, gamma, isIOS);
    return azAltToRaDec(azimuth, altitude, userPosition.latitude, userPosition.longitude, new Date());
  }, [alpha, beta, gamma, isIOS, userPosition]);

  // 動的な位置情報（ISSなど）
  const dynamicPositions = useMemo(() => {
    const map = new Map();
    if (iss.ra != null && iss.dec != null) {
      map.set("iss", { ra: iss.ra, dec: iss.dec, distanceM: iss.distanceM });
    }
    return map;
  }, [iss]);

  // 天体検索
  const activeLayers = useMemo(() => new Set<DistanceLayer>(["earth-orbit", "solar-system", "galaxy", "deep-universe"]), []);
  const visibleObjects = useCelestialSearch({
    centerRA: centerCoords.ra,
    centerDec: centerCoords.dec,
    canvasWidth: windowSize.width,
    canvasHeight: windowSize.height,
    activeLayers,
    dynamicPositions
  });

  // カメラストリームのセット
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  // ステップ1: カメラ
  const handleCamera = async () => {
    const ok = await startCamera();
    if (ok) setPermissionStep("orientation");
  };

  // ステップ2: センサー (iOS要件: タップから直接呼ぶ)
  const handleOrientation = async () => {
    const ok = await requestOrientationPermission();
    if (ok) setPermissionStep("location");
  };

  // ステップ3: 位置情報
  const handleLocation = async () => {
    await requestPosition();
    setPermissionStep("ready");
  };

  // すべて許可済みならreadyにする
  useEffect(() => {
    if (cameraActive && orientationPermission && userPosition && permissionStep !== "ready") {
      setPermissionStep("ready");
    }
  }, [cameraActive, orientationPermission, userPosition, permissionStep]);

  if (permissionStep !== "ready") {
    return (
      <div style={styles.container}>
        <div style={styles.modal}>
          <h1 style={styles.title}>観測準備 ({
            permissionStep === "camera" ? "1/3" : 
            permissionStep === "orientation" ? "2/3" : "3/3"
          })</h1>
          
          <p style={styles.text}>
            {permissionStep === "camera" && "まず、背景に映し出すカメラを許可してください。"}
            {permissionStep === "orientation" && "次に、スマホの向きを検知するセンサーを許可してください。"}
            {permissionStep === "location" && "最後に、現在地のISSを計算するため位置情報を許可してください。"}
          </p>

          {permissionStep === "camera" && (
            <button style={styles.button} onClick={handleCamera}>カメラを許可</button>
          )}
          {permissionStep === "orientation" && (
            <button style={styles.button} onClick={handleOrientation}>センサーを許可</button>
          )}
          {permissionStep === "location" && (
            <button style={styles.button} onClick={handleLocation}>位置情報を許可</button>
          )}

          <Link href="/" style={styles.link}>戻る</Link>
          
          {cameraError && <p style={{color: "#ff4444", fontSize: "0.8rem", marginTop: "1rem"}}>{cameraError}</p>}
          {geoError && <p style={{color: "#ff4444", fontSize: "0.8rem", marginTop: "1rem"}}>{geoError}</p>}
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* カメラ背景 */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={styles.video}
      />

      {/* ARオーバーレイ (SVG) */}
      <svg style={styles.overlay} viewBox={`0 0 ${windowSize.width} ${windowSize.height}`}>
        {visibleObjects.map(({ object, screenX, screenY }) => {
          const color = LAYER_COLORS[object.layer] || "#fff";
          const isISS = object.id === "iss";

          return (
            <g key={object.id} transform={`translate(${screenX}, ${screenY})`}>
              {/* ターゲットマーク */}
              <circle
                r={isISS ? 40 : 20}
                fill="none"
                stroke={color}
                strokeWidth="1.5"
                strokeDasharray={isISS ? "4 4" : "2 2"}
                className={isISS ? "animate-spin-slow" : ""}
              />
              <circle r={isISS ? 5 : 3} fill={color} />
              
              {/* 情報ラベル */}
              <g transform={`translate(${isISS ? 50 : 30}, -20)`}>
                <rect x="-5" y="-18" width="160" height="55" rx="5" fill="rgba(0,0,0,0.6)" />
                <text x="5" y="0" fill="#fff" fontSize="14" fontWeight="bold">{object.nameEn}</text>
                <text x="5" y="16" fill={color} fontSize="10">{object.name}</text>
                <text x="5" y="30" fill="#aaa" fontSize="11" fontFamily="monospace">
                  {formatDistance(object.distanceM).full}
                </text>
              </g>
            </g>
          );
        })}
      </svg>

      {/* デバッグ・ステータス表示 */}
      <div style={styles.statusPanel}>
        <div style={styles.statusItem}>
          <span style={styles.label}>方向 (alpha):</span> {Math.floor(alpha)}° / <span style={styles.label}>傾き (beta):</span> {Math.floor(beta)}°
        </div>
        <div style={styles.statusItem}>
          <span style={styles.label}>現在地:</span> {userPosition ? `${userPosition.latitude.toFixed(2)}, ${userPosition.longitude.toFixed(2)}` : (geoError ? <span style={{color: "#ff4444"}}>{geoError}</span> : "取得中...")}
          <div style={{fontSize: "0.7rem", color: "#666"}}>{geoLog}</div>
        </div>
        <div style={styles.statusItem}>
          <span style={styles.label}>ISS位置:</span> {iss.ra ? `RA:${iss.ra.toFixed(1)} Dec:${iss.dec?.toFixed(1)}` : "計算中..."}
        </div>
        <div style={styles.statusItem}>
          <span style={styles.label}>表示中の天体:</span> {visibleObjects.length}
        </div>
      </div>

      <Link href="/" style={styles.backButton}>×</Link>

      <style jsx global>{`
        .animate-spin-slow {
          transform-origin: center;
          animation: spin 10s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: "relative",
    width: "100vw",
    height: "100vh",
    backgroundColor: "#000",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
    fontFamily: "sans-serif",
  },
  video: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    pointerEvents: "none",
    zIndex: 10,
  },
  modal: {
    zIndex: 100,
    padding: "2rem",
    textAlign: "center",
    background: "rgba(20, 20, 40, 0.9)",
    borderRadius: "1.5rem",
    border: "1px solid #333",
    maxWidth: "80%",
  },
  title: {
    fontSize: "1.5rem",
    marginBottom: "1rem",
    background: "linear-gradient(135deg, #67d8ef, #ae81ff)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  text: {
    fontSize: "0.9rem",
    color: "#aaa",
    marginBottom: "2rem",
    lineHeight: 1.6,
  },
  button: {
    padding: "0.8rem 2rem",
    borderRadius: "2rem",
    background: "#ae81ff",
    color: "#fff",
    border: "none",
    fontWeight: "bold",
    fontSize: "1rem",
    cursor: "pointer",
  },
  link: {
    display: "block",
    marginTop: "1.5rem",
    color: "#666",
    fontSize: "0.9rem",
  },
  statusPanel: {
    position: "absolute",
    bottom: "2rem",
    left: "1rem",
    right: "1rem",
    zIndex: 20,
    pointerEvents: "none",
  },
  statusItem: {
    fontSize: "0.8rem",
    color: "rgba(255,255,255,0.7)",
    marginBottom: "0.2rem",
    textShadow: "0 1px 2px rgba(0,0,0,0.8)",
  },
  label: {
    color: "#67d8ef",
    fontWeight: "bold",
  },
  backButton: {
    position: "absolute",
    top: "1.5rem",
    right: "1.5rem",
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    background: "rgba(0,0,0,0.5)",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    textDecoration: "none",
    fontSize: "1.5rem",
    zIndex: 30,
    border: "1px solid rgba(255,255,255,0.2)",
  },
};
