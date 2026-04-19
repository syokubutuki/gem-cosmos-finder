import Link from "next/link";

export default function Home() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background:
          "radial-gradient(ellipse at 50% 50%, #1a1a3e 0%, #0a0a12 70%)",
        padding: "2rem",
        textAlign: "center",
      }}
    >
      <div className="animate-fade-in" style={{ maxWidth: 480 }}>
        <h1
          style={{
            fontSize: "2.2rem",
            fontWeight: 700,
            marginBottom: "0.5rem",
            background: "linear-gradient(135deg, #67d8ef, #ae81ff, #f92672)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Cosmos Finder
        </h1>
        <p
          style={{
            fontSize: "1rem",
            color: "#8888aa",
            marginBottom: "2rem",
            lineHeight: 1.7,
          }}
        >
          スマホを向けた方向にある宇宙の天体と距離を
          <br />
          AR風に可視化するWebアプリ
        </p>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
            marginBottom: "2.5rem",
          }}
        >
          {[
            {
              layer: "地球圏",
              range: "〜36,000km",
              example: "ISS・静止衛星",
              color: "#67d8ef",
            },
            {
              layer: "太陽系",
              range: "〜5.5光時",
              example: "太陽・惑星",
              color: "#e6db74",
            },
            {
              layer: "銀河",
              range: "〜10万光年",
              example: "恒星・星雲・銀河中心",
              color: "#ae81ff",
            },
            {
              layer: "深宇宙",
              range: "〜460億光年",
              example: "銀河団・クエーサー",
              color: "#f92672",
            },
          ].map((item) => (
            <div
              key={item.layer}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                textAlign: "left",
              }}
            >
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  backgroundColor: item.color,
                  flexShrink: 0,
                }}
              />
              <div>
                <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>
                  {item.layer}
                </span>
                <span style={{ color: "#8888aa", fontSize: "0.8rem" }}>
                  {" "}
                  {item.range} — {item.example}
                </span>
              </div>
            </div>
          ))}
        </div>

        <Link
          href="/explore"
          style={{
            display: "inline-block",
            padding: "0.9rem 2.5rem",
            borderRadius: "2rem",
            background: "linear-gradient(135deg, #ae81ff, #f92672)",
            color: "#fff",
            fontWeight: 700,
            fontSize: "1.1rem",
            textDecoration: "none",
            boxShadow: "0 4px 20px rgba(174, 129, 255, 0.3)",
          }}
        >
          宇宙を覗く
        </Link>

        <p
          style={{
            fontSize: "0.75rem",
            color: "#666",
            marginTop: "1.5rem",
            lineHeight: 1.5,
          }}
        >
          カメラ・方位センサー・位置情報の許可が必要です
          <br />
          PCブラウザでもフォールバックUIで動作します
        </p>
      </div>
    </main>
  );
}
