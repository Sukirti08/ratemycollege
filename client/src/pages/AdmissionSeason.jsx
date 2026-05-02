import { useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { predictColleges } from "../utils/rankPredictor";
import { useCompareStore } from "../store/compareStore";
import { useToastStore } from "../store/toastStore";
import StarRating from "../components/ui/StarRating";

const BRANCH_OPTIONS = [
  "CSE", "ECE", "ME", "CE", "EE",
  "Chemical", "Metallurgy", "Physics", "Maths & Computing",
];

const MAX_BRANCHES = 3;

function MatchBadge({ percent }) {
  let bg, color;
  if (percent >= 80) { bg = "#f0fdf4"; color = "#15803d"; }
  else if (percent >= 60) { bg = "#fefce8"; color = "#a16207"; }
  else { bg = "#fff7ed"; color = "#c2410c"; }

  return (
    <div style={{
      background: bg, color, fontWeight: 800,
      fontSize: "1.6rem", padding: "10px 0",
      textAlign: "center", borderRadius: 12,
      marginBottom: 16, width: "100%",
      border: `1px solid ${color}22`,
    }}>
      {percent}% <span style={{ fontSize: "0.75rem", fontWeight: 600 }}>match</span>
    </div>
  );
}

export default function AdmissionSeason() {
  const navigate = useNavigate();
  const { addCollege } = useCompareStore();
  const { addToast } = useToastStore();

  const [rank, setRank] = useState("");
  const [preferredBranches, setPreferredBranches] = useState([]);
  const [results, setResults] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const resultsRef = useRef(null);

  const toggleBranch = (branch) => {
    setPreferredBranches((prev) => {
      if (prev.includes(branch)) return prev.filter((b) => b !== branch);
      if (prev.length >= MAX_BRANCHES) {
        addToast(`Max ${MAX_BRANCHES} branches allowed`, "warning");
        return prev;
      }
      return [...prev, branch];
    });
  };

  const handlePredict = async () => {
    if (!rank || isNaN(Number(rank)) || Number(rank) <= 0) {
      addToast("Please enter a valid JEE rank", "error");
      return;
    }
    setIsLoading(true);
    try {
      const data = predictColleges(Number(rank), preferredBranches);
      setResults(data);
      setHasSearched(true);
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    } catch (err) {
      addToast("Prediction failed. Please try again.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ fontFamily: "'Sora', 'DM Sans', sans-serif", minHeight: "100vh", background: "#faf9f7" }}>

      {/* ── Header / Hero ─────────────────────────────────────────────────── */}
      <section style={{
        background: "linear-gradient(135deg, #7c2d12 0%, #c2410c 45%, #f97316 100%)",
        padding: "52px 24px 64px",
        position: "relative", overflow: "hidden",
      }}>
        {/* decorative blobs */}
        <div style={{
          position: "absolute", top: -40, right: -40, width: 200, height: 200,
          borderRadius: "50%", background: "rgba(251,191,36,0.15)", pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute", bottom: -60, left: 20, width: 160, height: 160,
          borderRadius: "50%", background: "rgba(255,255,255,0.08)", pointerEvents: "none",
        }} />

        <div style={{ maxWidth: 640, margin: "0 auto", position: "relative", zIndex: 1, textAlign: "center" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)",
            borderRadius: 99, padding: "4px 14px", marginBottom: 16,
            fontSize: "0.78rem", color: "#fff", fontWeight: 700, letterSpacing: "0.06em",
            textTransform: "uppercase",
          }}>
            🎓 JEE Admission Predictor
          </div>

          <h1 style={{
            fontSize: "clamp(1.9rem, 4.5vw, 2.9rem)", fontWeight: 800,
            color: "#fff", lineHeight: 1.15, marginBottom: 10,
            letterSpacing: "-0.02em",
          }}>
            🎯 Find Your Dream College
          </h1>
          <p style={{ color: "#fed7aa", fontSize: "1rem", margin: 0 }}>
            Enter your JEE rank to see which top colleges you qualify for
          </p>
        </div>
      </section>

      <div style={{ maxWidth: 760, margin: "0 auto", padding: "36px 16px 80px" }}>

        {/* ── Prediction Form ───────────────────────────────────────────── */}
        <div style={{
          background: "#fff", borderRadius: 20, padding: "32px 28px",
          boxShadow: "0 4px 32px rgba(0,0,0,0.08)",
          border: "1px solid #f3f4f6", marginBottom: 32,
        }}>
          {/* Rank input */}
          <div style={{ marginBottom: 28 }}>
            <label style={{
              display: "block", fontWeight: 700, color: "#1e1b4b",
              marginBottom: 8, fontSize: "0.95rem",
            }}>
              Your JEE Main / Advanced Rank
            </label>
            <input
              type="number"
              value={rank}
              onChange={(e) => setRank(e.target.value)}
              placeholder="e.g. 4500"
              min={1}
              style={{
                width: "100%", boxSizing: "border-box",
                padding: "14px 18px", borderRadius: 12,
                border: "2px solid #e5e7eb",
                fontSize: "1.3rem", fontWeight: 700,
                color: "#1e1b4b", outline: "none",
                transition: "border-color 0.15s",
              }}
              onFocus={(e) => e.target.style.borderColor = "#f97316"}
              onBlur={(e) => e.target.style.borderColor = "#e5e7eb"}
            />
          </div>

          {/* Branch preference chips */}
          <div style={{ marginBottom: 28 }}>
            <label style={{
              display: "block", fontWeight: 700, color: "#1e1b4b",
              marginBottom: 4, fontSize: "0.95rem",
            }}>
              Branch Preferences{" "}
              <span style={{ color: "#9ca3af", fontWeight: 500, fontSize: "0.85rem" }}>
                (select up to {MAX_BRANCHES})
              </span>
            </label>
            <p style={{ color: "#6b7280", fontSize: "0.82rem", marginBottom: 12 }}>
              {preferredBranches.length}/{MAX_BRANCHES} selected
            </p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {BRANCH_OPTIONS.map((branch) => {
                const active = preferredBranches.includes(branch);
                return (
                  <button
                    key={branch}
                    onClick={() => toggleBranch(branch)}
                    style={{
                      padding: "8px 16px", borderRadius: 99,
                      border: active ? "2px solid #f97316" : "2px solid #e5e7eb",
                      background: active ? "#fff7ed" : "#fff",
                      color: active ? "#c2410c" : "#374151",
                      fontWeight: active ? 700 : 500,
                      fontSize: "0.85rem", cursor: "pointer",
                      transition: "all 0.12s",
                    }}
                  >
                    {active && "✓ "}{branch}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Submit button */}
          <button
            onClick={handlePredict}
            disabled={isLoading}
            style={{
              width: "100%", padding: "15px 24px",
              background: isLoading
                ? "#fed7aa"
                : "linear-gradient(135deg, #c2410c, #f97316)",
              color: "#fff", border: "none", borderRadius: 14,
              fontSize: "1.05rem", fontWeight: 800, cursor: isLoading ? "not-allowed" : "pointer",
              letterSpacing: "-0.01em",
              boxShadow: isLoading ? "none" : "0 4px 20px rgba(249,115,22,0.4)",
              transition: "all 0.15s",
            }}
          >
            {isLoading ? "⏳ Predicting..." : "🎯 Predict My College"}
          </button>
        </div>

        {/* ── Results ────────────────────────────────────────────────────── */}
        {hasSearched && (
          <div ref={resultsRef}>
            <h2 style={{
              fontWeight: 800, color: "#1e1b4b", fontSize: "1.4rem",
              marginBottom: 20, letterSpacing: "-0.02em",
            }}>
              {results.length > 0
                ? `🏛️ ${results.length} College${results.length !== 1 ? "s" : ""} Found for Rank ${Number(rank).toLocaleString()}`
                : "No matches found for this rank"}
            </h2>

            {results.length === 0 && (
              <div style={{
                background: "#fff", borderRadius: 16, padding: "40px",
                textAlign: "center", border: "2px dashed #e5e7eb",
              }}>
                <div style={{ fontSize: "2.5rem", marginBottom: 12 }}>😔</div>
                <p style={{ color: "#6b7280", fontSize: "0.95rem" }}>
                  No colleges matched for this rank. Try a different rank or fewer branch filters.
                </p>
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {results.map((result, idx) => (
                <div
                  key={result.college?.id ?? idx}
                  style={{
                    background: "#fff", borderRadius: 20,
                    border: "1px solid #e5e7eb",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
                    overflow: "hidden",
                    animation: `slideUp 0.35s ease ${idx * 0.08}s both`,
                  }}
                >
                  <div style={{ padding: "24px" }}>
                    {/* Match badge */}
                    <MatchBadge percent={result.matchPercent} />

                    {/* College name + type */}
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 14 }}>
                      <div>
                        <h3 style={{ fontWeight: 800, color: "#1e1b4b", fontSize: "1.1rem", margin: 0, lineHeight: 1.3 }}>
                          {result.college?.name}
                        </h3>
                        <div style={{ color: "#6b7280", fontSize: "0.85rem", marginTop: 3 }}>
                          {result.college?.location}
                        </div>
                      </div>
                      <span style={{
                        background: "#ede9fe", color: "#4f46e5",
                        borderRadius: 99, padding: "4px 12px",
                        fontSize: "0.78rem", fontWeight: 700, flexShrink: 0,
                      }}>
                        {result.college?.type}
                      </span>
                    </div>

                    {/* Matched branches */}
                    {result.matchedBranches?.length > 0 && (
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
                        {result.matchedBranches.map((b) => (
                          <span key={b} style={{
                            background: "#f0fdf4", color: "#15803d",
                            borderRadius: 99, padding: "3px 10px",
                            fontSize: "0.78rem", fontWeight: 700,
                            border: "1px solid #bbf7d0",
                          }}>
                            ✓ {b}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Star rating */}
                    {result.college?.overallRating && (
                      <div style={{ marginBottom: 12 }}>
                        <StarRating value={result.college.overallRating} readonly size="sm" />
                      </div>
                    )}

                    {/* Reason text */}
                    {result.reason && (
                      <p style={{
                        color: "#6b7280", fontSize: "0.88rem",
                        fontStyle: "italic", lineHeight: 1.6,
                        margin: "0 0 16px",
                      }}>
                        "{result.reason}"
                      </p>
                    )}

                    {/* Action buttons */}
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                      <button
                        onClick={() => navigate(`/college/${result.college?.id}`)}
                        style={{
                          flex: 1, minWidth: 140,
                          background: "linear-gradient(135deg, #c2410c, #f97316)",
                          color: "#fff", border: "none",
                          borderRadius: 10, padding: "10px 18px",
                          fontWeight: 700, fontSize: "0.88rem", cursor: "pointer",
                        }}
                      >
                        View College →
                      </button>
                      <button
                        onClick={() => {
                          addCollege(result.college);
                          addToast(`${result.college?.shortName} added to compare`, "success");
                        }}
                        style={{
                          flex: 1, minWidth: 140,
                          background: "#fff", color: "#4f46e5",
                          border: "2px solid #4f46e5",
                          borderRadius: 10, padding: "10px 18px",
                          fontWeight: 700, fontSize: "0.88rem", cursor: "pointer",
                        }}
                      >
                        ⚖️ Add to Compare
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* ── Disclaimer ──────────────────────────────────────────── */}
            {results.length > 0 && (
              <div style={{
                marginTop: 28,
                background: "#fffbeb", border: "1px solid #fde68a",
                borderRadius: 12, padding: "16px 20px",
                fontSize: "0.85rem", color: "#92400e", lineHeight: 1.6,
              }}>
                ⚠️ <strong>Disclaimer:</strong> Based on historical cutoff trends. Not official JEE counseling data.
                Always verify at{" "}
                <a href="https://josaa.nic.in" target="_blank" rel="noopener noreferrer" style={{ color: "#c2410c", fontWeight: 600 }}>
                  josaa.nic.in
                </a>
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&display=swap');
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
        input[type=number] { -moz-appearance: textfield; }
      `}</style>
    </div>
  );
}

