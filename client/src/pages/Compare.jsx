import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { getColleges } from "../api/colleges";
import { useCompareStore } from "../store/compareStore";
import { useToastStore } from "../store/toastStore";
import StarRating from "../components/ui/StarRating";
import LoadingSpinner from "../components/ui/LoadingSpinner";

function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

// Row definitions: label + accessor key (for numeric winner calc) + formatter
const ROWS = [
  { label: "Overall Rating",          key: "overallRating",        type: "number", format: (v) => v?.toFixed(1) ?? "—" },
  { label: "Teaching Quality",        key: "teachingRating",       type: "number", format: (v) => v?.toFixed(1) ?? "—" },
  { label: "Placements Rating",       key: "placementsRating",     type: "number", format: (v) => v?.toFixed(1) ?? "—" },
  { label: "Research Rating",         key: "researchRating",       type: "number", format: (v) => v?.toFixed(1) ?? "—" },
  { label: "Hostel & Mess",           key: "hostelRating",         type: "number", format: (v) => v?.toFixed(1) ?? "—" },
  { label: "Infrastructure",          key: "infraRating",          type: "number", format: (v) => v?.toFixed(1) ?? "—" },
  { label: "Faculty Accessibility",   key: "facultyAccessibility", type: "number", format: (v) => v?.toFixed(1) ?? "—" },
  { label: "Claimed Avg Package",     key: "claimedAvgPackage",    type: "number", format: (v) => v ? `${v} LPA` : "—" },
  { label: "Actual Avg Package",      key: "actualAvgPackage",     type: "number", format: (v) => v ? `${v} LPA` : "—" },
  { label: "Total Reviews",           key: "reviewCount",          type: "number", format: (v) => v?.toLocaleString() ?? "—" },
  { label: "Location",                key: "location",             type: "text",   format: (v) => v ?? "—" },
];

function getCellStyle(colleges, rowKey, colIdx, rowType) {
  if (rowType !== "number" || colleges.length < 2) return {};
  const values = colleges.map((c) => c?.[rowKey] ?? null);
  const nums = values.filter((v) => v !== null);
  if (nums.length < 2) return {};

  const max = Math.max(...nums);
  const min = Math.min(...nums);
  const val = values[colIdx];

  if (val === null) return {};
  if (max === min) return {}; // tie — no highlight

  if (val === max) return { background: "#f0fdf4", color: "#15803d", fontWeight: 700 };
  if (colleges.length === 3 && val === min)
    return { background: "#fff1f2", color: "#dc2626" };
  return {};
}

export default function Compare() {
  const navigate = useNavigate();
  const { colleges, addCollege, removeCollege, clearAll } = useCompareStore();
  const { addToast } = useToastStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const debouncedQuery = useDebounce(searchQuery, 300);

  useEffect(() => {
    if (!debouncedQuery) { setSearchResults([]); return; }
    setSearchLoading(true);
    getColleges({ search: debouncedQuery })
      .then((res) => {
        setSearchResults(res.filter((r) => !colleges.find((c) => c.id === r.id)));
        setShowDropdown(true);
      })
      .catch(() => addToast("Search failed", "error"))
      .finally(() => setSearchLoading(false));
  }, [debouncedQuery]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleShare = async () => {
    const names = colleges.map((c) => c.shortName).join(" vs ");
    try {
      if (navigator.share) {
        await navigator.share({ title: "Compare Colleges", text: `${names} comparison`, url: window.location.href });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        addToast("Link copied to clipboard!", "success");
      }
    } catch {
      await navigator.clipboard.writeText(window.location.href);
      addToast("Link copied to clipboard!", "success");
    }
  };

  return (
    <div style={{ fontFamily: "'Sora', 'DM Sans', sans-serif", minHeight: "100vh", background: "#faf9f7" }}>

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div style={{
        background: "linear-gradient(135deg, #1e1b4b, #4f46e5)",
        padding: "28px 24px 32px",
      }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div>
              <Link to="/" style={{ color: "#a5b4fc", fontSize: "0.85rem", textDecoration: "none", fontWeight: 600 }}>
                ← Back to Home
              </Link>
              <h1 style={{ color: "#fff", fontSize: "1.8rem", fontWeight: 800, margin: "6px 0 4px", letterSpacing: "-0.02em" }}>
                Compare Colleges
              </h1>
              <p style={{ color: "#c7d2fe", fontSize: "0.92rem", margin: 0 }}>
                Side-by-side comparison across all key metrics
              </p>
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {colleges.length >= 2 && (
                <button
                  onClick={handleShare}
                  style={{
                    background: "rgba(255,255,255,0.15)", color: "#fff",
                    border: "1px solid rgba(255,255,255,0.3)",
                    borderRadius: 10, padding: "9px 18px", fontWeight: 600,
                    fontSize: "0.88rem", cursor: "pointer",
                  }}
                >
                  🔗 Share
                </button>
              )}
              {colleges.length > 0 && (
                <button
                  onClick={clearAll}
                  style={{
                    background: "rgba(239,68,68,0.2)", color: "#fca5a5",
                    border: "1px solid rgba(239,68,68,0.3)",
                    borderRadius: 10, padding: "9px 18px", fontWeight: 600,
                    fontSize: "0.88rem", cursor: "pointer",
                  }}
                >
                  Clear All
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 16px 80px" }}>

        {/* ── Empty state ───────────────────────────────────────────────── */}
        {colleges.length < 2 && (
          <div style={{
            background: "#fff", borderRadius: 20, padding: "48px 32px",
            textAlign: "center", border: "2px dashed #e5e7eb", marginBottom: 28,
          }}>
            <div style={{ fontSize: "3rem", marginBottom: 12 }}>⚖️</div>
            <h2 style={{ color: "#1e1b4b", fontWeight: 800, fontSize: "1.3rem", marginBottom: 8 }}>
              Add at least 2 colleges to compare
            </h2>
            <p style={{ color: "#6b7280", fontSize: "0.95rem", marginBottom: 24 }}>
              You currently have <strong>{colleges.length}</strong> college{colleges.length !== 1 ? "s" : ""} selected.
            </p>
            <Link to="/" style={{
              display: "inline-block", background: "#4f46e5", color: "#fff",
              borderRadius: 10, padding: "10px 24px", fontWeight: 700,
              textDecoration: "none", fontSize: "0.92rem",
            }}>
              ← Browse Colleges
            </Link>
          </div>
        )}

        {/* ── Add College Search (show when < 3) ───────────────────────── */}
        {colleges.length < 3 && (
          <div style={{ marginBottom: 28, position: "relative" }}>
            <label style={{ display: "block", fontWeight: 700, color: "#374151", marginBottom: 8, fontSize: "0.92rem" }}>
              ➕ Add a college to compare
            </label>
            <div style={{ position: "relative" }}>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setShowDropdown(true); }}
                onFocus={() => setShowDropdown(true)}
                placeholder="Search for a college..."
                style={{
                  width: "100%", boxSizing: "border-box",
                  padding: "12px 16px", borderRadius: 12,
                  border: "2px solid #e5e7eb", fontSize: "0.95rem",
                  outline: "none", background: "#fff",
                }}
              />
              {searchLoading && (
                <span style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)" }}>
                  <LoadingSpinner size="sm" />
                </span>
              )}
            </div>

            {showDropdown && searchResults.length > 0 && (
              <div style={{
                position: "absolute", top: "100%", left: 0, right: 0, zIndex: 30,
                background: "#fff", borderRadius: 12, boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
                border: "1px solid #e5e7eb", maxHeight: 260, overflowY: "auto", marginTop: 4,
              }}>
                {searchResults.map((college) => (
                  <div
                    key={college.id}
                    onClick={() => {
                      addCollege(college);
                      setSearchQuery("");
                      setSearchResults([]);
                      setShowDropdown(false);
                    }}
                    style={{
                      padding: "12px 16px", cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      borderBottom: "1px solid #f3f4f6",
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "#f9fafb"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                  >
                    <div>
                      <div style={{ fontWeight: 700, color: "#1e1b4b", fontSize: "0.92rem" }}>{college.name}</div>
                      <div style={{ color: "#6b7280", fontSize: "0.8rem" }}>{college.location}</div>
                    </div>
                    <span style={{
                      background: "#ede9fe", color: "#4f46e5",
                      borderRadius: 99, padding: "3px 10px", fontSize: "0.75rem", fontWeight: 700,
                    }}>
                      {college.type}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Compare Table ─────────────────────────────────────────────── */}
        {colleges.length >= 2 && (
          <div style={{ overflowX: "auto", borderRadius: 20, boxShadow: "0 4px 32px rgba(0,0,0,0.08)" }}>
            <table style={{
              width: "100%", minWidth: 640,
              borderCollapse: "collapse", background: "#fff",
              borderRadius: 20, overflow: "hidden",
            }}>
              {/* ── College header row ──────────────────────────────────── */}
              <thead>
                <tr>
                  <th style={{
                    background: "#f8f7ff", padding: "20px 20px",
                    textAlign: "left", color: "#6b7280", fontSize: "0.8rem",
                    fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase",
                    width: "22%", borderBottom: "2px solid #e5e7eb",
                  }}>
                    Metric
                  </th>
                  {colleges.map((college, colIdx) => (
                    <th key={college.id} style={{
                      background: "#f8f7ff", padding: "20px 16px",
                      borderBottom: "2px solid #e5e7eb",
                      borderLeft: "1px solid #e5e7eb",
                      minWidth: 180,
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                        <div>
                          <div style={{ fontWeight: 800, color: "#1e1b4b", fontSize: "0.95rem", lineHeight: 1.3 }}>
                            {college.name}
                          </div>
                          <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
                            <span style={{
                              background: "#1e1b4b", color: "#fff",
                              borderRadius: 99, padding: "2px 10px", fontSize: "0.72rem", fontWeight: 700,
                            }}>
                              {college.shortName}
                            </span>
                            <span style={{
                              background: "#ede9fe", color: "#4f46e5",
                              borderRadius: 99, padding: "2px 10px", fontSize: "0.72rem", fontWeight: 700,
                            }}>
                              {college.type}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => removeCollege(college.id)}
                          style={{
                            background: "none", border: "1px solid #e5e7eb",
                            borderRadius: 6, padding: "3px 7px", cursor: "pointer",
                            color: "#9ca3af", fontSize: "0.8rem", flexShrink: 0,
                          }}
                          title="Remove"
                        >
                          ✕
                        </button>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>

              {/* ── Data rows ──────────────────────────────────────────── */}
              <tbody>
                {ROWS.map((row, rowIdx) => (
                  <tr key={row.key} style={{ background: rowIdx % 2 === 0 ? "#fff" : "#fafafa" }}>
                    <td style={{
                      padding: "14px 20px", fontWeight: 600,
                      color: "#374151", fontSize: "0.88rem",
                      borderBottom: "1px solid #f3f4f6",
                    }}>
                      {row.label}
                    </td>
                    {colleges.map((college, colIdx) => {
                      const cellStyle = getCellStyle(colleges, row.key, colIdx, row.type);
                      return (
                        <td key={college.id} style={{
                          padding: "14px 16px",
                          borderBottom: "1px solid #f3f4f6",
                          borderLeft: "1px solid #f3f4f6",
                          fontSize: "0.95rem",
                          transition: "background 0.2s",
                          ...cellStyle,
                        }}>
                          {row.format(college[row.key])}
                          {cellStyle.background === "#f0fdf4" && (
                            <span style={{ marginLeft: 4, fontSize: "0.8rem" }}>🏆</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}

                {/* ── View College buttons row ────────────────────────── */}
                <tr>
                  <td style={{ padding: "18px 20px", borderTop: "2px solid #e5e7eb" }} />
                  {colleges.map((college) => (
                    <td key={college.id} style={{
                      padding: "18px 16px", borderTop: "2px solid #e5e7eb",
                      borderLeft: "1px solid #e5e7eb",
                    }}>
                      <button
                        onClick={() => navigate(`/college/${college.id}`)}
                        style={{
                          background: "#4f46e5", color: "#fff", border: "none",
                          borderRadius: 10, padding: "9px 18px", fontWeight: 700,
                          fontSize: "0.85rem", cursor: "pointer", width: "100%",
                          transition: "opacity 0.15s",
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.opacity = "0.88"}
                        onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
                      >
                        View College →
                      </button>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&display=swap');
      `}</style>
    </div>
  );
}

