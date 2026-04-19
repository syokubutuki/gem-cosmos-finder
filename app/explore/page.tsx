"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useCamera } from "../hooks/useCamera";
import { useDeviceOrientation } from "../hooks/useDeviceOrientation";
import { useGeolocation } from "../hooks/useGeolocation";
import { useISS } from "../hooks/useISS";
import { gnomonicProject, normalizedToScreen } from "../lib/projection";
import { deviceOrientationToAzAlt, azAltToRaDec } from "../lib/coordinates";
import { formatDistance } from "../lib/distance-format";

export default function ExplorePage() {
  const { videoRef, active: cameraActive, error: cameraError } = useCamera();
  const { position: userPosition, error: geoError } = useGeolocation();
  const {
    alpha,
    beta,
    gamma,
    isIOS,
    permissionGranted: orientationPermission,
    requestPermission,
  } = useDeviceOrientation();
  
  const iss = useISS(userPosition);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

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

  // ISSの画面上の座標を計算
  const issProjected = useMemo(() => {
    if (!iss.ra || !iss.dec || !windowSize.width) return null;

    const projected = gnomonicProject(iss.ra, iss.dec, centerCoords.ra, centerCoords.dec);
    if (!projected.visible) return { ...projected, sx: 0, sy: 0 };

    const { sx, sy } = normalizedToScreen(projected.x, projected.y, windowSize.width, windowSize.height, 60);
    return { ...projected, sx, sy };
  }, [iss, centerCoords, windowSize]);

  // 距離表示のフォーマット
  const formattedDistance = useMemo(() => {
    if (iss.distanceM == null) return null;
    return formatDistance(iss.distanceM);
  }, [iss.distanceM]);

  if (!orientationPermission) {
    return (
      <div style={styles.container}>
        <div style={styles.modal}>
          <h1 style={styles.title}>観測準備</h1>
          <p style={styles.text}>
            AR体験のためにデバイスのセンサー（方位・傾き）とカメラへのアクセス許可が必要です。
          </p>
          <button style={styles.button} onClick={requestPermission}>
            センサーを許可する
          </button>
          <Link href="/" style={styles.link}>戻る</Link>
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
        {issProjected?.visible && (
          <g transform={`translate(${issProjected.sx}, ${issProjected.sy})`}>
            {/* ターゲットマーク */}
            <circle r="40" fill="none" stroke="#67d8ef" strokeWidth="2" strokeDasharray="4 4" className="animate-spin-slow">
              <animateTransform attributeName="transform" type="rotate" from="0 0 0" to="360 0 0" dur="10s" repeatCount="indefinite" />
            </circle>
            <circle r="5" fill="#67d8ef" />
            
            {/* 情報ラベル */}
            <g transform="translate(50, -20)">
              <rect x="-5" y="-20" width="140" height="60" rx="5" fill="rgba(0,0,0,0.6)" />
              <text x="5" y="5" fill="#fff" fontSize="16" fontWeight="bold">ISS</text>
              <text x="5" y="25" fill="#67d8ef" fontSize="12">国際宇宙ステーション</text>
              <text x="5" y="40" fill="#ae81ff" fontSize="14" fontFamily="monospace">
                {formattedDistance?.full}
              </text>
            </g>
          </g>
        )}
      </svg>

      {/* デバッグ・ステータス表示 */}
      <div style={styles.statusPanel}>
        <div style={styles.statusItem}>
          <span style={styles.label}>方向:</span> {Math.floor(alpha)}°
        </div>
        <div style={styles.statusItem}>
          <span style={styles.label}>ISS 可視:</span> {iss.visible ? "地平線上" : "地平線下"}
        </div>
        {!issProjected?.visible && (
          <div style={styles.guide}>
            ISSを探しています... スマホを空へ向けてください
          </div>
        )}
      </div>

      <Link href="/" style={styles.backButton}>×</Link>

      <style jsx global>{`
        .animate-spin-slow {
          transform-origin: center;
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
  guide: {
    marginTop: "1rem",
    padding: "0.5rem 1rem",
    background: "rgba(0,0,0,0.5)",
    borderRadius: "1rem",
    fontSize: "0.9rem",
    textAlign: "center",
    border: "1px solid rgba(103, 216, 239, 0.3)",
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
