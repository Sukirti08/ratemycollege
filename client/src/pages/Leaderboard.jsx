import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getLeaderboard } from "../api/colleges";
import { getTopProfessors } from "../api/professors";
import { formatRating } from "../utils/formatRating";
import TagPill from "../components/ui/TagPill";

const COLLEGE_TYPES = ["All", "IIT", "NIT", "IIIT", "BITS"];
const CATEGORIES = ["Overall", "Placements", "Teaching", "Research", "Hostel"];
const MEDALS = { 1: "🥇", 2: "🥈", 3: "🥉" };

const RANK_HIGHLIGHT = {
  1: { ring: "#f59e0b", bg: "rgba(245,158,11,0.04)", text: "#92400e" },
  2: { ring: "#94a3b8", bg: "rgba(148,163,184,0.04)", text: "#475569" },
  3: { ring: "#b45309", bg: "rgba(180,83,9,0.04)", text: "#92400e" },
};

function SkeletonItem() {
  return (
    <div style={{
      background: "white", borderRadius: 16, padding: "1rem 1.25rem",
      display: "flex", alignItems: "center", gap: "1rem",
      border: "1px solid #f0ede6", marginBottom: "0.75rem"
    }}>
      {[36, 120, 80, 48].map((w, i) => (
        <div key={i} style={{
          height: 18, width: w, borderRadius: 8,
          background: "#f3f4f6",
          animation: "pulse 1.4s ease-in-out infinite",
          animationDelay: `${i * 0.1}s`
        }} />
      ))}
    </div>
  );
}

function RatingBar({ value, max = 5 }) {
  const pct = Math.round((value / max) * 100);
  return (
    <div style={{ height: 4, background: "#f3f4f6", borderRadius: 2, width: 80, overflow: "hidden" }}>
      <div style={{
        height: "100%", width: `${pct}%`,
        background: value >= 4.2 ? "#10b981" : value >= 3.5 ? "#f59e0b" : "#ef4444",
        borderRadius: 2, transition: "width 0.6s ease"
      }} />
    </div>
  );
}

function CollegeRow({ college, rank }) {
  const navigate = useNavigate();
  const hl = RANK_HIGHLIGHT[rank];

  const typeBadgeColor = (type) => ({
    IIT: "#dc2626", NIT: "#2563eb", IIIT: "#7c3aed", BITS: "#059669",
  }[type] || "#6b7280");

  return (
    <div
      onClick={() => navigate(`/college/${college.id}`)}
      style={{
        background: hl ? hl.bg : "white",
        border: `1px solid ${hl ? hl.ring : "#f0ede6"}`,
        borderRadius: 16, padding: "1rem 1.25rem",
        display: "flex", alignItems: "center", gap: "1rem",
        cursor: "pointer", transition: "all 0.15s", marginBottom: "0.75rem",
        boxShadow: hl ? `0 0 0 1.5px ${hl.ring}30` : "none",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = "translateX(3px)"; e.currentTarget.style.boxShadow = `0 4px 20px rgba(0,0,0,0.06)`; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = hl ? `0 0 0 1.5px ${hl.ring}30` : "none"; }}
    >
      {/* Rank */}
      <div style={{ minWidth: 36, textAlign: "center" }}>
        {MEDALS[rank] ? (
          <span style={{ fontSize: "1.375rem" }}>{MEDALS[rank]}</span>
        ) : (
          <span style={{ fontSize: "1.25rem", fontWeight: 800, color: "#d1d5db", fontFamily: "Syne, sans-serif" }}>{rank}</span>
        )}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
          <span style={{ fontSize: "0.9375rem", fontWeight: 700, color: "#1a1a1a", fontFamily: "Syne, sans-serif" }}>
            {college.name}
          </span>
          {college.type && (
            <span style={{
              padding: "0.1rem 0.45rem", borderRadius: 5, fontSize: "0.625rem",
              fontWeight: 700, color: "white", background: typeBadgeColor(college.type),
              letterSpacing: "0.04em", fontFamily: "Syne, sans-serif"
            }}>
              {college.type}
            </span>
          )}
        </div>
        <div style={{ marginTop: "0.35rem", display: "flex", alignItems: "center", gap: "0.625rem" }}>
          <RatingBar value={college.rating || 0} />
          <span style={{ fontSize: "0.75rem", color: "#9ca3af", fontFamily: "Syne, sans-serif" }}>
            {(college.reviewCount || 0).toLocaleString("en-IN")} reviews
          </span>
        </div>
      </div>

      {/* Score */}
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <div style={{ fontSize: "1.375rem", fontWeight: 800, color: "#f59e0b", fontFamily: "Syne, sans-serif", lineHeight: 1 }}>
          {formatRating ? formatRating(college.rating) : (college.rating || 0).toFixed(1)}
        </div>
        <div style={{ fontSize: "0.6875rem", color: "#9ca3af", marginTop: 2 }}>/ 5.0</div>
      </div>

      {/* Arrow */}
      <div style={{ color: "#d1d5db", fontSize: "0.875rem", flexShrink: 0 }}>→</div>
    </div>
  );
}

function ProfessorRow({ professor, rank }) {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`/professor/${professor.id}`)}
      style={{
        background: "white", border: "1px solid #f0ede6", borderRadius: 16,
        padding: "1rem 1.25rem", display: "flex", alignItems: "center", gap: "1rem",
        cursor: "pointer", transition: "all 0.15s", marginBottom: "0.75rem"
      }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = "translateX(3px)"; e.currentTarget.style.borderColor = "#f59e0b"; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = ""; e.currentTarget.style.borderColor = "#f0ede6"; }}
    >
      {/* Rank */}
      <div style={{ minWidth: 32, textAlign: "center" }}>
        {MEDALS[rank] ? (
          <span style={{ fontSize: "1.375rem" }}>{MEDALS[rank]}</span>
        ) : (
          <span style={{ fontSize: "1.125rem", fontWeight: 800, color: "#d1d5db", fontFamily: "Syne, sans-serif" }}>{rank}</span>
        )}
      </div>

      {/* Avatar */}
      <div style={{
        width: 40, height: 40, borderRadius: "50%", background: "#1a1a1a",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "1rem", flexShrink: 0, color: "#f59e0b", fontWeight: 700,
        fontFamily: "Syne, sans-serif"
      }}>
        {professor.name?.[0] || "P"}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
          <span style={{ fontSize: "0.9375rem", fontWeight: 700, color: "#1a1a1a", fontFamily: "Syne, sans-serif" }}>
            {professor.name}
          </span>
          {professor.collegeName && (
            <span style={{
              padding: "0.1rem 0.5rem", borderRadius: 5, fontSize: "0.65rem",
              fontWeight: 600, color: "#374151", background: "#f3f4f6",
              fontFamily: "Syne, sans-serif"
            }}>
              {professor.collegeName}
            </span>
          )}
        </div>
        <div style={{ fontSize: "0.75rem", color: "#9ca3af", margin: "0.2rem 0 0.375rem", fontFamily: "Syne, sans-serif" }}>
          {professor.department}
        </div>
        {professor.tags?.length > 0 && (
          <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
            {professor.tags.slice(0, 3).map((tag) => (
              <TagPill key={tag} tag={tag} small />
            ))}
          </div>
        )}
      </div>

      {/* Rating + reviews */}
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "#f59e0b", fontFamily: "Syne, sans-serif", lineHeight: 1 }}>
          ★ {(professor.rating || 0).toFixed(1)}
        </div>
        <div style={{ fontSize: "0.6875rem", color: "#9ca3af", marginTop: 2 }}>
          {(professor.reviewCount || 0)} reviews
        </div>
      </div>

      <div style={{ color: "#d1d5db", fontSize: "0.875rem", flexShrink: 0 }}>→</div>
    </div>
  );
}

export default function Leaderboard() {
  const [activeView, setActiveView] = useState("colleges");
  const [collegeType, setCollegeType] = useState("All");
  const [collegeCategory, setCollegeCategory] = useState("Overall");
  const [colleges, setColleges] = useState([]);
  const [professors, setProfessors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [deptFilter, setDeptFilter] = useState("");
  const [hasMore, setHasMore] = useState(true);

  const PAGE_SIZE = 10;

  const fetchData = useCallback(async (reset = false) => {
    setIsLoading(true);
    const currentPage = reset ? 1 : page;
    try {
      if (activeView === "colleges") {
        const data = await getLeaderboard({
          type: collegeType === "All" ? undefined : collegeType,
          category: collegeCategory.toLowerCase(),
          page: currentPage,
          limit: PAGE_SIZE,
        });
        if (reset) {
          setColleges(data || []);
          setPage(1);
        } else {
          setColleges((prev) => [...prev, ...(data || [])]);
        }
        setHasMore((data || []).length === PAGE_SIZE);
      } else {
        const data = await getTopProfessors({ department: deptFilter, page: currentPage, limit: PAGE_SIZE });
        if (reset) {
          setProfessors(data || []);
          setPage(1);
        } else {
          setProfessors((prev) => [...prev, ...(data || [])]);
        }
        setHasMore((data || []).length === PAGE_SIZE);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [activeView, collegeType, collegeCategory, deptFilter, page]);

  // Reset and fetch when filters change
  useEffect(() => {
    setPage(1);
    fetchData(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeView, collegeType, collegeCategory, deptFilter]);

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchData(false);
  };

  const displayedColleges = colleges;
  const displayedProfessors = professors;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Source+Serif+4:ital,wght@0,400;1,400&family=Syne:wght@400;600;700;800&display=swap');
        @keyframes pulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 0.9; } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .lb-root { min-height: 100vh; background: #fafaf8; font-family: 'Syne', sans-serif; }
        .lb-header { background: white; border-bottom: 1px solid #f0ede6; padding: 1.5rem 1.5rem 0; position: sticky; top: 0; z-index: 20; }
        .lb-title { font-size: 1.5rem; font-weight: 800; color: #1a1a1a; margin: 0 0 1.25rem; letter-spacing: -0.03em; }
        .view-toggle { display: flex; background: #f3f4f6; border-radius: 12px; padding: 3px; width: fit-content; margin-bottom: 1.25rem; }
        .view-btn {
          padding: 0.5rem 1.125rem; border-radius: 9px; border: none; font-family: 'Syne', sans-serif;
          font-size: 0.875rem; font-weight: 600; cursor: pointer; transition: all 0.15s;
          background: transparent; color: #6b7280;
        }
        .view-btn.active { background: white; color: #1a1a1a; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
        .filter-row { display: flex; gap: 0.5rem; overflow-x: auto; padding-bottom: 1px; scrollbar-width: none; }
        .filter-row::-webkit-scrollbar { display: none; }
        .filter-chip {
          padding: 0.375rem 0.875rem; border-radius: 20px; border: 1.5px solid #e5e7eb;
          background: white; font-size: 0.8125rem; font-weight: 600; color: #374151;
          cursor: pointer; transition: all 0.15s; white-space: nowrap; font-family: 'Syne', sans-serif;
          flex-shrink: 0;
        }
        .filter-chip.active { background: #1a1a1a; color: white; border-color: #1a1a1a; }
        .filter-chip:not(.active):hover { border-color: #f59e0b; color: #92400e; }
        .category-row { display: flex; gap: 0; margin-top: 0.75rem; border-bottom: 1px solid #f0ede6; overflow-x: auto; scrollbar-width: none; }
        .category-row::-webkit-scrollbar { display: none; }
        .cat-tab {
          padding: 0.625rem 1rem; font-size: 0.875rem; font-weight: 600; color: #9ca3af;
          border: none; background: transparent; cursor: pointer; transition: all 0.15s;
          border-bottom: 2.5px solid transparent; margin-bottom: -1px; white-space: nowrap;
          font-family: 'Syne', sans-serif;
        }
        .cat-tab.active { color: #f59e0b; border-bottom-color: #f59e0b; }
        .cat-tab:hover:not(.active) { color: #374151; }
        .lb-content { max-width: 760px; margin: 0 auto; padding: 1.75rem 1rem; }
        .prof-filters { display: flex; gap: 0.75rem; margin-bottom: 1.25rem; }
        .dept-input {
          flex: 1; padding: 0.625rem 1rem; border-radius: 12px; border: 1.5px solid #e5e7eb;
          font-family: 'Syne', sans-serif; font-size: 0.875rem; color: #1a1a1a;
          outline: none; transition: border-color 0.15s;
        }
        .dept-input:focus { border-color: #f59e0b; }
        .load-more-btn {
          width: 100%; padding: 0.875rem; border-radius: 14px; border: 1.5px dashed #e5e7eb;
          background: transparent; font-family: 'Syne', sans-serif; font-size: 0.875rem;
          font-weight: 600; color: #6b7280; cursor: pointer; transition: all 0.15s; margin-top: 0.5rem;
        }
        .load-more-btn:hover { border-color: #f59e0b; color: #d97706; background: #fffbeb; }
        .empty-state { text-align: center; padding: 4rem 1rem; color: #9ca3af; }
        .empty-state p { font-size: 2rem; margin-bottom: 0.75rem; }
        .empty-state span { font-size: 0.9375rem; font-family: 'Source Serif 4', serif; font-style: italic; }
      `}</style>

      <div className="lb-root">
        {/* Sticky header */}
        <div className="lb-header">
          <h1 className="lb-title">Leaderboard</h1>

          {/* Toggle */}
          <div className="view-toggle">
            <button
              className={`view-btn ${activeView === "colleges" ? "active" : ""}`}
              onClick={() => setActiveView("colleges")}
            >
              🏛️ Colleges
            </button>
            <button
              className={`view-btn ${activeView === "professors" ? "active" : ""}`}
              onClick={() => setActiveView("professors")}
            >
              👨‍🏫 Professors
            </button>
          </div>

          {/* College filters */}
          {activeView === "colleges" && (
            <>
              <div className="filter-row">
                {COLLEGE_TYPES.map((t) => (
                  <button
                    key={t}
                    className={`filter-chip ${collegeType === t ? "active" : ""}`}
                    onClick={() => setCollegeType(t)}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <div className="category-row">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    className={`cat-tab ${collegeCategory === cat ? "active" : ""}`}
                    onClick={() => setCollegeCategory(cat)}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Content */}
        <div className="lb-content">
          {activeView === "colleges" ? (
            <>
              {isLoading && colleges.length === 0 ? (
                Array.from({ length: 5 }).map((_, i) => <SkeletonItem key={i} />)
              ) : colleges.length === 0 ? (
                <div className="empty-state">
                  <p>🏫</p>
                  <span>No colleges found for this filter.</span>
                </div>
              ) : (
                <>
                  {displayedColleges.map((college, i) => (
                    <div key={college.id} style={{ animation: `fadeUp 0.3s ease ${i * 0.04}s both` }}>
                      <CollegeRow college={college} rank={i + 1} />
                    </div>
                  ))}
                  {isLoading && colleges.length > 0 && Array.from({ length: 3 }).map((_, i) => <SkeletonItem key={i} />)}
                  {!isLoading && hasMore && (
                    <button className="load-more-btn" onClick={loadMore}>
                      Load more colleges ↓
                    </button>
                  )}
                </>
              )}
            </>
          ) : (
            <>
              <div className="prof-filters">
                <input
                  className="dept-input"
                  placeholder="Filter by department (e.g. CSE, ECE)…"
                  value={deptFilter}
                  onChange={(e) => setDeptFilter(e.target.value)}
                />
              </div>

              {isLoading && professors.length === 0 ? (
                Array.from({ length: 5 }).map((_, i) => <SkeletonItem key={i} />)
              ) : professors.length === 0 ? (
                <div className="empty-state">
                  <p>👨‍🏫</p>
                  <span>No professors found. Try a different department.</span>
                </div>
              ) : (
                <>
                  {displayedProfessors.map((prof, i) => (
                    <div key={prof.id} style={{ animation: `fadeUp 0.3s ease ${i * 0.04}s both` }}>
                      <ProfessorRow professor={prof} rank={i + 1} />
                    </div>
                  ))}
                  {isLoading && professors.length > 0 && Array.from({ length: 3 }).map((_, i) => <SkeletonItem key={i} />)}
                  {!isLoading && hasMore && (
                    <button className="load-more-btn" onClick={loadMore}>
                      Load more professors ↓
                    </button>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}

