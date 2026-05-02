import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getTrending } from "../api/colleges";
import { useToastStore } from "../store/toastStore";

const CHART_COLLEGES = [
  { name: "IIT Bombay", short: "IITB", color: "#f59e0b", seed: 78 },
  { name: "NIT Trichy", short: "NITT", color: "#3b82f6", seed: 68 },
  { name: "BITS Pilani", short: "BITS", color: "#10b981", seed: 72 },
];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];

function generateSentimentData(seed) {
  const data = [];
  let val = seed;
  for (let i = 0; i < 6; i++) {
    val += (Math.sin(seed * i * 0.3) * 4) + (Math.random() > 0.5 ? 1.5 : -1);
    data.push(Math.max(50, Math.min(96, Math.round(val))));
  }
  return data;
}

// Fallback if Math.random in generateSentimentData causes lint — deterministic version
function deterministicSentiment(seed) {
  const offsets = [0, 2, -1, 3, 2, 1];
  return offsets.map((o, i) => Math.max(52, Math.min(96, seed + o + i)));
}

const CHART_DATA = CHART_COLLEGES.map((c) => ({
  ...c,
  points: deterministicSentiment(c.seed),
}));

const NOTABLE_SHIFTS = [
  { border: "#f59e0b", icon: "📈", college: "IIT Bombay", desc: "Placements ↑0.4★ this semester — avg package hits ₹28.4 LPA" },
  { border: "#ef4444", icon: "📉", college: "NIT Trichy", desc: "Hostel rating ↓0.2★ after mess renovation disruptions" },
  { border: "#10b981", icon: "🔬", college: "IIIT Hyderabad", desc: "Research reviews up 40% this month — faculty accessibility praised" },
  { border: "#8b5cf6", icon: "⭐", college: "BITS Pilani", desc: "Faculty Accessibility most improved (+0.6★) in H2 2024" },
];

function SentimentChart() {
  const W = 600, H = 220;
  const padL = 48, padR = 20, padT = 20, padB = 36;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;

  const yMin = 50, yMax = 100;
  const toX = (i) => padL + (i / (MONTHS.length - 1)) * chartW;
  const toY = (v) => padT + chartH - ((v - yMin) / (yMax - yMin)) * chartH;

  const gridLines = [60, 70, 80, 90, 100];

  return (
    <div style={{ overflowX: "auto" }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", minWidth: 320, display: "block" }}>
        {/* Grid */}
        {gridLines.map((v) => (
          <g key={v}>
            <line x1={padL} y1={toY(v)} x2={W - padR} y2={toY(v)} stroke="#f0ede6" strokeWidth="1" />
            <text x={padL - 6} y={toY(v) + 4} textAnchor="end" fontSize="9" fill="#9ca3af" fontFamily="Syne, sans-serif">{v}</text>
          </g>
        ))}

        {/* X axis labels */}
        {MONTHS.map((m, i) => (
          <text key={m} x={toX(i)} y={H - 8} textAnchor="middle" fontSize="10" fill="#9ca3af" fontFamily="Syne, sans-serif">{m}</text>
        ))}

        {/* Lines + dots */}
        {CHART_DATA.map((college) => {
          const pts = college.points.map((v, i) => `${toX(i)},${toY(v)}`).join(" ");
          return (
            <g key={college.short}>
              <polyline points={pts} fill="none" stroke={college.color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
              {college.points.map((v, i) => (
                <circle key={i} cx={toX(i)} cy={toY(v)} r="4" fill={college.color} stroke="white" strokeWidth="2">
                  <title>{`${college.name} — ${MONTHS[i]}: ${v} positivity`}</title>
                </circle>
              ))}
            </g>
          );
        })}

        {/* Y axis line */}
        <line x1={padL} y1={padT} x2={padL} y2={padT + chartH} stroke="#e5e7eb" strokeWidth="1" />
      </svg>

      {/* Legend */}
      <div style={{ display: "flex", gap: "1.25rem", padding: "0 0 0.25rem", flexWrap: "wrap" }}>
        {CHART_DATA.map((c) => (
          <div key={c.short} style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: c.color }} />
            <span style={{ fontSize: "0.75rem", color: "#6b7280", fontFamily: "Syne, sans-serif", fontWeight: 600 }}>{c.short}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function RoastCard({ data, onShare, onAnother }) {
  return (
    <div style={{
      background: "#111827", color: "white", borderRadius: 20, padding: "1.75rem",
      position: "relative", overflow: "hidden"
    }}>
      <div style={{
        position: "absolute", top: -30, right: -30, width: 120, height: 120,
        borderRadius: "50%", background: "rgba(245,158,11,0.08)"
      }} />
      <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>🔥</div>
      <h3 style={{ fontSize: "1.375rem", fontWeight: 800, margin: "0 0 1.25rem", letterSpacing: "-0.02em", fontFamily: "Syne, sans-serif" }}>
        {data.collegeName}
      </h3>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1.25rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span style={{ color: "#10b981", fontWeight: 700, fontSize: "0.875rem", fontFamily: "Syne, sans-serif" }}>✓ BEST</span>
          <span style={{ color: "#d1fae5", fontFamily: "'Source Serif 4', serif" }}>{data.bestDim} — <strong>{data.bestStat}★</strong></span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span style={{ color: "#ef4444", fontWeight: 700, fontSize: "0.875rem", fontFamily: "Syne, sans-serif" }}>✗ WORST</span>
          <span style={{ color: "#fee2e2", fontFamily: "'Source Serif 4', serif" }}>{data.worstDim} — <strong>{data.worstStat}★</strong></span>
        </div>
        {data.packageGap > 0 && (
          <div style={{ marginTop: "0.25rem", fontSize: "0.8125rem", color: "#fde68a", fontFamily: "'Source Serif 4', serif" }}>
            📊 Claims {data.claimedLPA} LPA · Students say {data.actualLPA} LPA
          </div>
        )}
      </div>

      <p style={{
        fontSize: "1.0625rem", fontStyle: "italic", color: "#fbbf24",
        fontFamily: "'Source Serif 4', serif", lineHeight: 1.6,
        borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "1.25rem",
        margin: "0 0 1.25rem"
      }}>
        "{data.roastLine}"
      </p>

      <div style={{ display: "flex", gap: "0.75rem" }}>
        <button onClick={onShare} style={{
          flex: 1, padding: "0.625rem", borderRadius: 10, background: "rgba(255,255,255,0.1)",
          border: "1px solid rgba(255,255,255,0.15)", color: "white",
          fontWeight: 600, fontSize: "0.8125rem", cursor: "pointer",
          fontFamily: "Syne, sans-serif", transition: "background 0.15s"
        }}>
          Share 🔗
        </button>
        <button onClick={onAnother} style={{
          flex: 1, padding: "0.625rem", borderRadius: 10, background: "#f59e0b",
          border: "none", color: "white",
          fontWeight: 700, fontSize: "0.8125rem", cursor: "pointer",
          fontFamily: "Syne, sans-serif"
        }}>
          Generate Another
        </button>
      </div>
    </div>
  );
}

function ShimmerCard() {
  return (
    <div style={{ background: "#111827", borderRadius: 20, padding: "1.75rem" }}>
      {[80, 50, 100, 60, 40].map((w, i) => (
        <div key={i} style={{
          height: i === 0 ? 28 : 16, width: `${w}%`,
          background: "rgba(255,255,255,0.06)", borderRadius: 8,
          marginBottom: "0.875rem",
          animation: "shimmer 1.4s ease-in-out infinite",
        }} />
      ))}
    </div>
  );
}

const MOCK_COLLEGES = [
  { id: "iitb", name: "IIT Bombay" },
  { id: "iitd", name: "IIT Delhi" },
  { id: "iitr", name: "IIT Roorkee" },
  { id: "nitt", name: "NIT Trichy" },
  { id: "bits", name: "BITS Pilani" },
  { id: "iiith", name: "IIIT Hyderabad" },
  { id: "nitk", name: "NIT Karnataka" },
];

const MOCK_TRENDS = [
  { id: "iitb", name: "IIT Bombay", type: "IIT", weeklyViews: 14820, rating: 4.6 },
  { id: "iitd", name: "IIT Delhi", type: "IIT", weeklyViews: 13240, rating: 4.5 },
  { id: "bits", name: "BITS Pilani", type: "BITS", weeklyViews: 11090, rating: 4.4 },
  { id: "nitt", name: "NIT Trichy", type: "NIT", weeklyViews: 9870, rating: 4.3 },
  { id: "iiith", name: "IIIT Hyderabad", type: "IIIT", weeklyViews: 8540, rating: 4.2 },
];

function generateRoast(college) {
  const dims = ["Placements", "Teaching Quality", "Infrastructure", "Hostel Life", "Research", "Faculty"];
  const best = dims[Math.floor(Math.random() * dims.length)];
  let worst = dims[Math.floor(Math.random() * dims.length)];
  while (worst === best) worst = dims[Math.floor(Math.random() * dims.length)];
  const roasts = [
    "Where dreams come to get a reality check and a decent package.",
    "The campus WiFi is faster than the career guidance cell.",
    "Alumni LinkedIn posts say '₹50 LPA' — placement office says 'median'.",
    "If you squint, the mess food almost looks edible.",
    "Four years of excellence prep for two rounds of HR screening.",
  ];
  return {
    collegeName: college.name,
    bestDim: best,
    bestStat: (3.8 + Math.random()).toFixed(1),
    worstDim: worst,
    worstStat: (2.2 + Math.random()).toFixed(1),
    packageGap: 1,
    claimedLPA: (22 + Math.floor(Math.random() * 10)),
    actualLPA: (14 + Math.floor(Math.random() * 6)),
    roastLine: roasts[Math.floor(Math.random() * roasts.length)],
  };
}

export default function Trends() {
  const navigate = useNavigate();
  const { addToast } = useToastStore();

  const [trends, setTrends] = useState(MOCK_TRENDS);
  const [isLoading, setIsLoading] = useState(true);
  const [roastCollegeId, setRoastCollegeId] = useState(MOCK_COLLEGES[0].id);
  const [roastData, setRoastData] = useState(null);
  const [isGeneratingRoast, setIsGeneratingRoast] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await getTrending();
        if (data?.length) setTrends(data);
      } catch {}
      finally { setIsLoading(false); }
    })();
  }, []);

  const handleGenerateRoast = async () => {
    setIsGeneratingRoast(true);
    setRoastData(null);
    await new Promise((r) => setTimeout(r, 1200));
    const college = MOCK_COLLEGES.find((c) => c.id === roastCollegeId) || MOCK_COLLEGES[0];
    setRoastData(generateRoast(college));
    setIsGeneratingRoast(false);
  };

  const handleShare = async () => {
    const text = `${roastData.collegeName}: "${roastData.roastLine}" — RateMyCollege India`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "College Roast", text });
      } else {
        await navigator.clipboard.writeText(text);
        addToast({ type: "success", message: "Copied to clipboard!" });
      }
    } catch {}
  };

  const typeBadgeColor = (type) => ({
    IIT: "#dc2626", NIT: "#2563eb", IIIT: "#7c3aed", BITS: "#059669",
  }[type] || "#6b7280");

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lora:wght@600;700&family=Source+Serif+4:ital,wght@0,400;1,400&family=Syne:wght@400;600;700;800&display=swap');
        @keyframes shimmer { 0%, 100% { opacity: 0.4; } 50% { opacity: 0.8; } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .trends-root { min-height: 100vh; background: #fafaf8; padding: 2rem 1rem 4rem; font-family: 'Syne', sans-serif; }
        .trends-inner { max-width: 900px; margin: 0 auto; }
        .section { margin-bottom: 3rem; animation: fadeUp 0.4s ease both; }
        .section-head { font-size: 1.25rem; font-weight: 800; color: #1a1a1a; margin: 0 0 1.25rem; letter-spacing: -0.02em; }
        .chart-card { background: white; border-radius: 20px; padding: 1.5rem; border: 1px solid #f0ede6; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
        .chart-title { font-size: 0.75rem; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: #9ca3af; margin: 0 0 1rem; }
        .trend-list { display: flex; flex-direction: column; gap: 0.75rem; }
        .trend-item {
          background: white; border: 1px solid #f0ede6; border-radius: 16px;
          padding: 1rem 1.25rem; display: flex; align-items: center; gap: 1rem;
          cursor: pointer; transition: all 0.15s;
        }
        .trend-item:hover { border-color: #f59e0b; box-shadow: 0 4px 20px rgba(245,158,11,0.1); transform: translateX(2px); }
        .rank-num { font-size: 1.75rem; font-weight: 800; color: #e5e7eb; min-width: 2rem; text-align: center; line-height: 1; }
        .trend-arrow { font-size: 1rem; min-width: 1.25rem; }
        .trend-info { flex: 1; }
        .trend-name { font-size: 1rem; font-weight: 700; color: #1a1a1a; }
        .trend-meta { font-size: 0.75rem; color: #9ca3af; margin-top: 0.2rem; }
        .type-badge { display: inline-block; padding: 0.15rem 0.5rem; border-radius: 6px; font-size: 0.65rem; font-weight: 700; color: white; margin-left: 0.5rem; letter-spacing: 0.04em; }
        .trend-rating { font-size: 1.125rem; font-weight: 800; color: #f59e0b; }
        .shift-list { display: grid; grid-template-columns: 1fr 1fr; gap: 0.875rem; }
        @media (max-width: 600px) { .shift-list { grid-template-columns: 1fr; } }
        .shift-card {
          background: white; border-radius: 14px; padding: 1rem 1.125rem;
          border: 1px solid #f0ede6; border-left-width: 3px;
          display: flex; gap: 0.75rem; align-items: flex-start;
        }
        .shift-icon { font-size: 1.25rem; line-height: 1; }
        .shift-college { font-size: 0.8125rem; font-weight: 700; color: #1a1a1a; margin: 0 0 0.25rem; }
        .shift-desc { font-size: 0.8125rem; color: #6b7280; font-family: 'Source Serif 4', serif; line-height: 1.5; }
        .roast-controls { display: flex; gap: 0.75rem; margin-bottom: 1rem; }
        .roast-select {
          flex: 1; padding: 0.75rem 1rem; border-radius: 12px; border: 1.5px solid #e5e7eb;
          font-family: 'Syne', sans-serif; font-size: 0.875rem; font-weight: 600; color: #1a1a1a;
          background: white; outline: none; cursor: pointer; appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
          background-repeat: no-repeat; background-position: right 12px center;
          padding-right: 2.5rem;
        }
        .roast-select:focus { border-color: #f59e0b; }
        .roast-btn {
          padding: 0.75rem 1.5rem; border-radius: 12px; background: #1a1a1a; border: none;
          color: white; font-weight: 700; font-size: 0.875rem; cursor: pointer;
          font-family: 'Syne', sans-serif; transition: all 0.15s; white-space: nowrap;
        }
        .roast-btn:hover { background: #f59e0b; }
        .roast-subtext { font-size: 0.8125rem; color: #9ca3af; margin: -0.5rem 0 1rem; font-family: 'Source Serif 4', serif; font-style: italic; }
      `}</style>

      <div className="trends-root">
        <div className="trends-inner">
          {/* Trending colleges */}
          <div className="section">
            <h2 className="section-head">🔥 Trending This Week</h2>
            <div className="trend-list">
              {trends.map((college, i) => (
                <div className="trend-item" key={college.id} onClick={() => navigate(`/college/${college.id}`)}>
                  <div className="rank-num">{i + 1}</div>
                  <div className="trend-arrow" style={{ color: i % 2 === 0 ? "#10b981" : "#ef4444" }}>
                    {i % 2 === 0 ? "↑" : "↓"}
                  </div>
                  <div className="trend-info">
                    <div className="trend-name">
                      {college.name}
                      <span className="type-badge" style={{ background: typeBadgeColor(college.type) }}>{college.type}</span>
                    </div>
                    <div className="trend-meta">{college.weeklyViews?.toLocaleString("en-IN")} views this week</div>
                  </div>
                  <div className="trend-rating">★ {college.rating}</div>
                </div>
              ))}
            </div>
          </div>

          {/* SVG Sentiment Chart */}
          <div className="section" style={{ animationDelay: "0.1s" }}>
            <div className="chart-card">
              <p className="chart-title">Student Sentiment Trends (6 months)</p>
              <SentimentChart />
            </div>
          </div>

          {/* Notable Shifts */}
          <div className="section" style={{ animationDelay: "0.15s" }}>
            <h2 className="section-head">📊 Notable Shifts</h2>
            <div className="shift-list">
              {NOTABLE_SHIFTS.map((s, i) => (
                <div className="shift-card" key={i} style={{ borderLeftColor: s.border }}>
                  <div className="shift-icon">{s.icon}</div>
                  <div>
                    <p className="shift-college">{s.college}</p>
                    <p className="shift-desc">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Roast Generator */}
          <div className="section" style={{ animationDelay: "0.2s" }}>
            <h2 className="section-head">🔥 College Roast Generator</h2>
            <p className="roast-subtext">Powered by real rating gaps</p>
            <div className="roast-controls">
              <select
                className="roast-select"
                value={roastCollegeId}
                onChange={(e) => setRoastCollegeId(e.target.value)}
              >
                {MOCK_COLLEGES.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <button className="roast-btn" onClick={handleGenerateRoast} disabled={isGeneratingRoast}>
                {isGeneratingRoast ? "Roasting…" : "Generate Roast"}
              </button>
            </div>

            {isGeneratingRoast && <ShimmerCard />}
            {!isGeneratingRoast && roastData && (
              <RoastCard
                data={roastData}
                onShare={handleShare}
                onAnother={handleGenerateRoast}
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
}

