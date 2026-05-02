import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { getColleges, getLeaderboard, getCollegeStats } from "../api/colleges";
import { useCompareStore } from "../store/compareStore";
import { useToastStore } from "../store/toastStore";
import CollegeCard from "../components/college/CollegeCard";
import LoadingSpinner from "../components/ui/LoadingSpinner";

// ─── tiny debounce hook ──────────────────────────────────────────────────────
function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

const TYPE_FILTERS = ["All", "IIT", "NIT", "IIIT", "BITS"];
const TAB_CATEGORIES = ["overall", "placements", "teaching", "research"];
const TAB_LABELS = ["Overall", "Placements", "Teaching", "Research"];

export default function Home() {
  const navigate = useNavigate();
  const { colleges: compareColleges, clearAll } = useCompareStore();
  const { addToast } = useToastStore();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("All");
  const [sortBy, setSortBy] = useState("overall");
  const [colleges, setColleges] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState({});
  const [statsLoading, setStatsLoading] = useState(true);
  const [leaderboardTab, setLeaderboardTab] = useState(0);

  const leaderboardCache = useRef({});
  const debouncedSearch = useDebounce(searchTerm, 300);

  const month = new Date().getMonth() + 1;
  const showAdmissionBanner = month >= 5 && month <= 7;

  // ── on mount: stats + default leaderboard ───────────────────────────────
  useEffect(() => {
    setStatsLoading(true);
    getCollegeStats()
      .then((s) => setStats(s))
      .finally(() => setStatsLoading(false));

    fetchLeaderboard(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── leaderboard tab fetch (cached) ───────────────────────────────────────
  const fetchLeaderboard = useCallback(async (tabIdx) => {
    const cat = TAB_CATEGORIES[tabIdx];
    if (leaderboardCache.current[cat]) {
      setColleges(leaderboardCache.current[cat]);
      return;
    }
    setIsLoading(true);
    try {
      const data = await getLeaderboard({ category: cat });
      leaderboardCache.current[cat] = data;
      setColleges(data);
    } catch {
      addToast("Failed to load leaderboard", "error");
    } finally {
      setIsLoading(false);
    }
  }, [addToast]);

  // ── debounced search ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!debouncedSearch && selectedType === "All") return;
    setIsLoading(true);
    getColleges({ search: debouncedSearch, type: selectedType === "All" ? undefined : selectedType })
      .then(setColleges)
      .catch(() => addToast("Search failed", "error"))
      .finally(() => setIsLoading(false));
  }, [debouncedSearch]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── type filter change ───────────────────────────────────────────────────
  const handleTypeChange = (type) => {
    setSelectedType(type);
    setIsLoading(true);
    getColleges({
      type: type === "All" ? undefined : type,
      search: searchTerm,
    })
      .then(setColleges)
      .catch(() => addToast("Filter failed", "error"))
      .finally(() => setIsLoading(false));
  };

  // ── leaderboard tab change ───────────────────────────────────────────────
  const handleTabChange = (idx) => {
    setLeaderboardTab(idx);
    fetchLeaderboard(idx);
  };

  return (
    <div style={{ fontFamily: "'Sora', 'DM Sans', sans-serif", minHeight: "100vh", background: "#faf9f7" }}>

      {/* ── Admission Season Banner ─────────────────────────────────────── */}
      {showAdmissionBanner && (
        <div style={{
          background: "linear-gradient(90deg, #f97316, #ef4444)",
          color: "#fff",
          textAlign: "center",
          padding: "10px 16px",
          fontSize: "0.92rem",
          fontWeight: 600,
          letterSpacing: "0.01em",
        }}>
          🎯 JEE Results Season! Predict your college →{" "}
          <Link to="/jee" style={{ color: "#fff", textDecoration: "underline" }}>
            Check now
          </Link>
        </div>
      )}

      {/* ── Hero Section ────────────────────────────────────────────────── */}
      <section style={{
        background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 40%, #4f46e5 70%, #7c3aed 100%)",
        padding: "64px 24px 80px",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* decorative circles */}
        <div style={{
          position: "absolute", top: "-60px", right: "-60px",
          width: 280, height: 280, borderRadius: "50%",
          background: "rgba(251,191,36,0.12)", pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute", bottom: "-80px", left: "-40px",
          width: 220, height: 220, borderRadius: "50%",
          background: "rgba(167,139,250,0.15)", pointerEvents: "none",
        }} />

        <div style={{ maxWidth: 720, margin: "0 auto", position: "relative", zIndex: 1 }}>
          {/* badge */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.25)",
            borderRadius: 99, padding: "4px 14px", marginBottom: 20,
            fontSize: "0.78rem", color: "#e0e7ff", fontWeight: 600, letterSpacing: "0.06em",
            textTransform: "uppercase",
          }}>
            <span>⭐</span> India's #1 College Review Platform
          </div>

          <h1 style={{
            fontSize: "clamp(2rem, 5vw, 3.2rem)", fontWeight: 800,
            color: "#fff", lineHeight: 1.15, marginBottom: 12,
            letterSpacing: "-0.02em",
          }}>
            Real Reviews from<br />
            <span style={{ color: "#fbbf24" }}>Real Students</span>
          </h1>
          <p style={{ color: "#c7d2fe", fontSize: "1.05rem", marginBottom: 32, maxWidth: 520 }}>
            Honest insights on placements, faculty, hostel life, and more — from students who've been there.
          </p>

          {/* Search input */}
          <div style={{ position: "relative", maxWidth: 560 }}>
            <span style={{
              position: "absolute", left: 18, top: "50%", transform: "translateY(-50%)",
              fontSize: "1.2rem", pointerEvents: "none",
            }}>🔍</span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search IITs, NITs, BITS..."
              style={{
                width: "100%", boxSizing: "border-box",
                padding: "16px 20px 16px 50px",
                borderRadius: 16, border: "none",
                fontSize: "1rem", fontWeight: 500,
                background: "#fff",
                boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
                outline: "none", color: "#1e1b4b",
              }}
            />
          </div>
        </div>
      </section>

      {/* ── Stats Bar ───────────────────────────────────────────────────── */}
      <div style={{
        background: "#fff", borderBottom: "1px solid #e5e7eb",
        padding: "14px 24px", textAlign: "center",
        fontSize: "0.9rem", fontWeight: 600, color: "#4b5563",
        letterSpacing: "0.01em",
      }}>
        {statsLoading ? (
          <div style={{ display: "flex", gap: 8, justifyContent: "center", alignItems: "center" }}>
            {[100, 80, 120].map((w, i) => (
              <div key={i} style={{
                height: 16, width: w, borderRadius: 8,
                background: "linear-gradient(90deg,#e5e7eb 25%,#f3f4f6 50%,#e5e7eb 75%)",
                backgroundSize: "200% 100%",
                animation: "shimmer 1.2s infinite",
              }} />
            ))}
          </div>
        ) : (
          <span>
            🏛️ <strong>{stats.totalColleges ?? "—"}</strong> Colleges &nbsp;·&nbsp;
            💬 <strong>{stats.totalReviews ?? "—"}</strong> Reviews &nbsp;·&nbsp;
            👨‍🏫 <strong>{stats.totalProfessors ?? "—"}</strong> Professors Rated
          </span>
        )}
      </div>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 16px 120px" }}>

        {/* ── AI Insight Card ─────────────────────────────────────────── */}
        <div style={{
          background: "linear-gradient(135deg, #1e1b4b, #4338ca)",
          borderRadius: 16, padding: "20px 24px",
          marginBottom: 32, position: "relative", overflow: "hidden",
          border: "1px solid rgba(167,139,250,0.4)",
        }}>
          <div style={{
            position: "absolute", top: -20, right: -20, width: 120, height: 120,
            borderRadius: "50%", background: "rgba(251,191,36,0.1)",
          }} />
          <div style={{ display: "flex", alignItems: "flex-start", gap: 14, position: "relative", zIndex: 1 }}>
            <span style={{ fontSize: "1.6rem", flexShrink: 0 }}>✨</span>
            <div>
              <div style={{ color: "#fbbf24", fontWeight: 700, fontSize: "0.82rem", letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 4 }}>
                Oracle AI Insight
              </div>
              <p style={{ color: "#e0e7ff", fontSize: "0.95rem", lineHeight: 1.6, margin: 0 }}>
                This week, <strong style={{ color: "#fff" }}>IIT Bombay</strong> leads in placement ratings while{" "}
                <strong style={{ color: "#fff" }}>NIT Trichy</strong> sees a surge in teaching reviews.{" "}
                <Link to="/oracle" style={{ color: "#fbbf24", fontWeight: 600 }}>Ask Oracle for details →</Link>
              </p>
            </div>
          </div>
        </div>

        {/* ── Type Filter Chips ────────────────────────────────────────── */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 24 }}>
          {TYPE_FILTERS.map((t) => (
            <button
              key={t}
              onClick={() => handleTypeChange(t)}
              style={{
                padding: "8px 18px", borderRadius: 99,
                border: selectedType === t ? "2px solid #4f46e5" : "2px solid #e5e7eb",
                background: selectedType === t ? "#4f46e5" : "#fff",
                color: selectedType === t ? "#fff" : "#374151",
                fontWeight: 600, fontSize: "0.88rem", cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              {t}
            </button>
          ))}
        </div>

        {/* ── Leaderboard Tabs ─────────────────────────────────────────── */}
        <div style={{
          background: "#fff", borderRadius: 16, overflow: "hidden",
          border: "1px solid #e5e7eb", marginBottom: 32,
          boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
        }}>
          <div style={{ display: "flex", borderBottom: "1px solid #e5e7eb" }}>
            {TAB_LABELS.map((label, idx) => (
              <button
                key={label}
                onClick={() => handleTabChange(idx)}
                style={{
                  flex: 1, padding: "14px 8px",
                  background: "none", border: "none",
                  cursor: "pointer", fontWeight: 700,
                  fontSize: "0.88rem",
                  color: leaderboardTab === idx ? "#4f46e5" : "#6b7280",
                  borderBottom: leaderboardTab === idx ? "3px solid #4f46e5" : "3px solid transparent",
                  transition: "all 0.15s",
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* ── College Grid ─────────────────────────────────────────── */}
          <div style={{ padding: "24px" }}>
            {isLoading ? (
              <div style={{ textAlign: "center", padding: "48px 0" }}>
                <LoadingSpinner />
              </div>
            ) : colleges.length === 0 ? (
              <div style={{ textAlign: "center", padding: "64px 0", color: "#9ca3af" }}>
                <div style={{ fontSize: "3rem", marginBottom: 12 }}>🏫</div>
                <div style={{ fontWeight: 600, fontSize: "1rem" }}>No colleges found</div>
                <div style={{ fontSize: "0.88rem", marginTop: 4 }}>Try a different search or filter</div>
              </div>
            ) : (
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                gap: 20,
              }}>
                {colleges.slice(0, 12).map((college) => (
                  <CollegeCard key={college.id} college={college} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Floating Compare Bar ─────────────────────────────────────────── */}
      {compareColleges.length > 0 && (
        <div style={{
          position: "fixed", bottom: 72, left: "50%", transform: "translateX(-50%)",
          background: "#1e1b4b", color: "#fff", borderRadius: 16,
          padding: "12px 20px", display: "flex", alignItems: "center", gap: 12,
          boxShadow: "0 8px 32px rgba(0,0,0,0.35)",
          zIndex: 50, maxWidth: "92vw", whiteSpace: "nowrap",
          border: "1px solid rgba(167,139,250,0.3)",
        }}>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {compareColleges.map((c) => (
              <span key={c.id} style={{
                background: "rgba(255,255,255,0.15)", borderRadius: 99,
                padding: "3px 10px", fontSize: "0.8rem", fontWeight: 600,
              }}>
                {c.shortName}
              </span>
            ))}
          </div>
          <button
            onClick={() => navigate("/compare")}
            style={{
              background: "#fbbf24", color: "#1e1b4b", border: "none",
              borderRadius: 10, padding: "8px 16px", fontWeight: 700,
              fontSize: "0.88rem", cursor: "pointer",
            }}
          >
            Compare Now →
          </button>
          <button
            onClick={clearAll}
            style={{
              background: "rgba(255,255,255,0.1)", color: "#d1d5db",
              border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: 10, padding: "8px 12px", fontWeight: 600,
              fontSize: "0.82rem", cursor: "pointer",
            }}
          >
            Clear
          </button>
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&display=swap');
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </div>
  );
}

