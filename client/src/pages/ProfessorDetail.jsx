import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getProfessor, submitProfessorReview } from "../api/professors";
import { useAuthStore } from "../store/authStore";
import { useToastStore } from "../store/toastStore";
import StarRating from "../components/ui/StarRating";
import RatingBar from "../components/ui/RatingBar";
import TagPill from "../components/ui/TagPill";
import Modal from "../components/ui/Modal";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import { formatRating } from "../utils/formatRating";

const RATING_BARS = [
  { key: "teachingClarity", label: "Teaching Clarity" },
  { key: "examDifficulty", label: "Exam Difficulty", inverse: true },
  { key: "accessibility", label: "Accessibility" },
  { key: "researchSupport", label: "Research Support" },
  { key: "gradingFairness", label: "Grading Fairness" },
];

const PROF_TAGS = [
  "📖 Very Clear Explanations", "💡 Conceptually Strong", "📝 Fair Grader",
  "⏰ Always Available", "🔬 Research Mentor", "📚 Heavy Assignments",
  "😰 Tough Exams", "🎯 Exam-Focused", "💬 Approachable", "⚡ Fast Paced",
];

const BRANCHES = ["CSE", "ECE", "ME", "CE", "EE", "Chemical", "Metallurgy", "Physics", "Maths & Computing", "Other"];
const BATCH_YEARS = [2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025];
const PAGE_SIZE = 5;

const DESIGNATION_STYLES = {
  Professor: { bg: "#dbeafe", color: "#1d4ed8" },
  HOD: { bg: "#f3e8ff", color: "#7c3aed" },
  Visiting: { bg: "#f3f4f6", color: "#6b7280" },
};

export default function ProfessorDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { addToast } = useToastStore();

  const [professor, setProfessor] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [sortBy, setSortBy] = useState("recent");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const [modalForm, setModalForm] = useState({
    ratings: { teachingClarity: 0, examDifficulty: 0, accessibility: 0, researchSupport: 0, gradingFairness: 0 },
    tags: [], text: "", batchYear: "", branch: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadProfessor();
  }, [id]);

  const loadProfessor = async () => {
    setIsLoading(true);
    try {
      const data = await getProfessor(id);
      setProfessor(data?.professor || null);
      setReviews(data?.reviews || []);
    } catch { addToast({ type: "error", message: "Could not load professor data." }); }
    finally { setIsLoading(false); }
  };

  const handleSubmitReview = async () => {
    if (modalForm.text.length < 50 || !modalForm.batchYear || !modalForm.branch) return;
    if (!Object.values(modalForm.ratings).every((v) => v > 0)) return;
    setIsSubmitting(true);
    try {
      await submitProfessorReview(id, modalForm);
      addToast({ type: "success", message: "Review submitted! 🎉" });
      setIsSubmitModalOpen(false);
      setModalForm({ ratings: { teachingClarity: 0, examDifficulty: 0, accessibility: 0, researchSupport: 0, gradingFairness: 0 }, tags: [], text: "", batchYear: "", branch: "" });
      loadProfessor();
    } catch { addToast({ type: "error", message: "Could not submit review." }); }
    finally { setIsSubmitting(false); }
  };

  const toggleModalTag = (tag) => {
    setModalForm((p) => ({
      ...p,
      tags: p.tags.includes(tag) ? p.tags.filter((t) => t !== tag) : [...p.tags, tag],
    }));
  };

  const sortedReviews = [...reviews].sort((a, b) => {
    if (sortBy === "helpful") return (b.helpfulVotes || 0) - (a.helpfulVotes || 0);
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const timeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const d = Math.floor(diff / 86400000);
    if (d === 0) return "Today";
    if (d === 1) return "Yesterday";
    if (d < 30) return `${d}d ago`;
    return new Date(dateStr).toLocaleDateString("en-IN", { month: "short", year: "numeric" });
  };

  const desigStyle = professor ? (DESIGNATION_STYLES[professor.designation] || DESIGNATION_STYLES.Visiting) : {};

  // Tag cloud logic
  const allTags = professor?.tags || [];
  const tagCounts = allTags.reduce((acc, tag) => { acc[tag] = (acc[tag] || 0) + 1; return acc; }, {});
  const sortedTags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]);

  const tagSize = (count) => {
    if (count >= 5) return { fontSize: "1.15rem", fontWeight: 700 };
    if (count >= 3) return { fontSize: "1rem", fontWeight: 600 };
    return { fontSize: "0.88rem", fontWeight: 500 };
  };

  if (isLoading) return (
    <div className="pd-root" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:wght@400;500;600&display=swap'); .pd-root { background: #faf7f2; font-family: 'DM Sans', sans-serif; }`}</style>
      <LoadingSpinner />
    </div>
  );

  if (!professor) return (
    <div className="pd-root" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", flexDirection: "column", gap: "1rem" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:wght@400;500;600&display=swap'); .pd-root { background: #faf7f2; font-family: 'DM Sans', sans-serif; }`}</style>
      <div style={{ fontSize: "3rem" }}>🎓</div>
      <p style={{ color: "#aaa" }}>Professor not found.</p>
    </div>
  );

  return (
    <div className="pd-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:wght@400;500;600&display=swap');

        .pd-root { min-height: 100vh; background: #faf7f2; font-family: 'DM Sans', sans-serif; padding: 2rem 1rem 4rem; }
        .pd-container { max-width: 820px; margin: 0 auto; }
        .pd-brand { font-family: 'Playfair Display', serif; color: #b5451b; font-size: 1.1rem; margin-bottom: 2rem; text-decoration: none; display: block; }

        /* Breadcrumb */
        .pd-breadcrumb { display: flex; align-items: center; gap: 0.5rem; font-size: 0.83rem; color: #bbb; margin-bottom: 1.5rem; flex-wrap: wrap; }
        .pd-breadcrumb a { color: #b5451b; text-decoration: none; font-weight: 500; }
        .pd-breadcrumb a:hover { text-decoration: underline; }
        .pd-breadcrumb-sep { color: #ddd; }

        /* Header */
        .pd-header { background: white; border-radius: 16px; padding: 2rem 2.5rem; box-shadow: 0 4px 24px rgba(0,0,0,0.06); border: 1px solid #f0ebe3; margin-bottom: 1.5rem; }
        .pd-prof-name { font-family: 'Playfair Display', serif; font-size: 2rem; font-weight: 700; color: #1a1a1a; margin: 0 0 0.75rem; line-height: 1.15; }
        .pd-header-meta { display: flex; flex-wrap: wrap; align-items: center; gap: 0.75rem; margin-bottom: 1.25rem; }
        .pd-desig { display: inline-flex; padding: 3px 12px; border-radius: 20px; font-size: 0.8rem; font-weight: 700; letter-spacing: 0.04em; }
        .pd-dept { font-size: 0.88rem; color: #888; font-weight: 500; }
        .pd-header-bottom { display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap; margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #f0ebe3; }
        .pd-rating-big { display: flex; align-items: center; gap: 0.75rem; }
        .pd-rating-num { font-family: 'Playfair Display', serif; font-size: 2.75rem; font-weight: 700; color: #b5451b; line-height: 1; }
        .pd-rating-sub { font-size: 0.8rem; color: #bbb; margin-top: 4px; }
        .pd-rate-btn { padding: 0.75rem 1.5rem; background: #b5451b; color: white; border: none; border-radius: 10px; font-size: 0.92rem; font-weight: 600; font-family: 'DM Sans', sans-serif; cursor: pointer; transition: all 0.2s; }
        .pd-rate-btn:hover { background: #9a3a15; transform: translateY(-1px); box-shadow: 0 4px 16px rgba(181,69,27,0.25); }

        /* Cards */
        .pd-card { background: white; border-radius: 16px; padding: 1.75rem 2rem; box-shadow: 0 4px 24px rgba(0,0,0,0.06); border: 1px solid #f0ebe3; margin-bottom: 1.5rem; }
        .pd-card-title { font-family: 'Playfair Display', serif; font-size: 1.15rem; font-weight: 700; color: #1a1a1a; margin: 0 0 1.25rem; }

        /* Rating bars */
        .pd-bar-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.9rem; gap: 1rem; }
        .pd-bar-label { font-size: 0.88rem; font-weight: 600; color: #444; min-width: 140px; flex-shrink: 0; }
        .pd-bar-track { flex: 1; height: 8px; background: #f0ebe3; border-radius: 99px; overflow: hidden; }
        .pd-bar-fill { height: 100%; border-radius: 99px; transition: width 0.6s; }
        .pd-bar-val { font-size: 0.82rem; font-weight: 700; color: #888; min-width: 28px; text-align: right; }

        /* Tag cloud */
        .pd-tag-cloud { display: flex; flex-wrap: wrap; gap: 0.6rem; }
        .pd-tag-cloud-pill {
          padding: 0.4rem 0.9rem; border-radius: 20px; background: #fdf3ee; border: 1.5px solid #f5cba7;
          color: #b5451b; cursor: default; transition: background 0.15s;
        }
        .pd-tag-cloud-pill.rank1 { background: #b5451b; color: white; border-color: #b5451b; }
        .pd-tag-cloud-pill.rank2 { background: #f5cba7; color: #7a2e0a; border-color: #f5cba7; }

        /* Reviews */
        .pd-reviews-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.25rem; flex-wrap: wrap; gap: 0.75rem; }
        .pd-sort { display: flex; gap: 0.5rem; }
        .pd-sort-btn { padding: 0.4rem 0.9rem; border-radius: 8px; font-size: 0.82rem; font-weight: 600; font-family: 'DM Sans', sans-serif; cursor: pointer; border: 1.5px solid #e8e0d5; background: white; color: #666; transition: all 0.15s; }
        .pd-sort-btn.active { background: #b5451b; color: white; border-color: #b5451b; }
        .pd-review-card { border: 1px solid #f0ebe3; border-radius: 12px; padding: 1.25rem; margin-bottom: 1rem; transition: box-shadow 0.15s; }
        .pd-review-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.06); }
        .pd-review-badges { display: flex; flex-wrap: wrap; gap: 0.4rem; margin-bottom: 0.75rem; }
        .pd-review-badge { padding: 2px 10px; border-radius: 20px; font-size: 0.75rem; font-weight: 600; }
        .pd-badge-year { background: #e3f2fd; color: #1565c0; }
        .pd-badge-branch { background: #f3e5f5; color: #6a1b9a; }
        .pd-mini-ratings { display: flex; flex-wrap: wrap; gap: 0.5rem 1rem; margin-bottom: 0.75rem; }
        .pd-mini-rating { display: flex; align-items: center; gap: 0.3rem; font-size: 0.77rem; color: #888; }
        .pd-mini-label { font-weight: 500; }
        .pd-review-text { font-size: 0.88rem; color: #555; line-height: 1.7; margin: 0.6rem 0; }
        .pd-review-tags { display: flex; flex-wrap: wrap; gap: 0.4rem; margin-bottom: 0.6rem; }
        .pd-rtag { font-size: 0.75rem; padding: 2px 9px; border-radius: 20px; background: #f5f0ea; color: #888; }
        .pd-review-footer { display: flex; align-items: center; justify-content: space-between; color: #bbb; font-size: 0.8rem; }
        .pd-load-more { display: block; width: 100%; padding: 0.875rem; background: none; border: 1.5px solid #e8e0d5; border-radius: 10px; font-size: 0.92rem; font-weight: 600; font-family: 'DM Sans', sans-serif; cursor: pointer; color: #666; margin-top: 0.5rem; transition: all 0.15s; }
        .pd-load-more:hover { border-color: #b5451b; color: #b5451b; }
        .pd-empty { text-align: center; padding: 2rem; color: #bbb; }

        /* Modal */
        .pd-modal-field { margin-bottom: 1rem; }
        .pd-modal-label { font-size: 0.8rem; font-weight: 600; color: #666; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px; display: block; }
        .pd-modal-rating-row { display: flex; align-items: center; justify-content: space-between; padding: 0.6rem 0; border-bottom: 1px solid #f0ebe3; }
        .pd-modal-rating-row:last-child { border-bottom: none; }
        .pd-modal-tags { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.5rem; }
        .pd-modal-tag { padding: 0.4rem 0.85rem; border-radius: 20px; font-size: 0.82rem; cursor: pointer; border: 1.5px solid #e8e0d5; background: white; font-family: 'DM Sans', sans-serif; transition: all 0.15s; color: #555; font-weight: 500; }
        .pd-modal-tag:hover { border-color: #b5451b; color: #b5451b; }
        .pd-modal-tag.active { background: #b5451b; border-color: #b5451b; color: white; }
        .pd-modal-textarea { width: 100%; padding: 0.75rem 1rem; border: 1.5px solid #e8e0d5; border-radius: 10px; font-size: 0.88rem; font-family: 'DM Sans', sans-serif; resize: vertical; min-height: 100px; outline: none; background: #fafaf8; box-sizing: border-box; line-height: 1.7; }
        .pd-modal-textarea:focus { border-color: #b5451b; }
        .pd-modal-select { width: 100%; padding: 0.7rem 1rem; border: 1.5px solid #e8e0d5; border-radius: 10px; font-size: 0.9rem; font-family: 'DM Sans', sans-serif; background: #fafaf8; outline: none; }
        .pd-modal-select:focus { border-color: #b5451b; }
        .pd-modal-row2 { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
        .pd-modal-btn-row { display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1.5rem; }
        .pd-modal-btn { padding: 0.75rem 1.5rem; border-radius: 10px; font-size: 0.9rem; font-weight: 600; font-family: 'DM Sans', sans-serif; cursor: pointer; border: none; }
        .pd-modal-submit { background: #b5451b; color: white; }
        .pd-modal-submit:disabled { opacity: 0.5; cursor: not-allowed; }
        .pd-modal-cancel { background: #f0ebe3; color: #666; }
        .pd-auth-gate { text-align: center; padding: 1.5rem; }
        .pd-auth-gate p { color: #888; margin-bottom: 1rem; }
        .pd-google-btn { padding: 0.75rem 1.5rem; border: 1.5px solid #e8e0d5; border-radius: 10px; background: white; font-size: 0.92rem; font-family: 'DM Sans', sans-serif; cursor: pointer; font-weight: 600; color: #333; }

        @media (max-width: 600px) {
          .pd-header { padding: 1.5rem; }
          .pd-card { padding: 1.25rem; }
          .pd-prof-name { font-size: 1.5rem; }
          .pd-modal-row2 { grid-template-columns: 1fr; }
          .pd-bar-label { min-width: 110px; }
        }
      `}</style>

      <div className="pd-container">
        <a href="/" className="pd-brand">RateMyCollege India</a>

        {/* Breadcrumb */}
        <div className="pd-breadcrumb">
          <a href={`/college/${professor.collegeId}`}>{professor.collegeName}</a>
          <span className="pd-breadcrumb-sep">›</span>
          <span>Professors</span>
          <span className="pd-breadcrumb-sep">›</span>
          <span style={{ color: "#555" }}>{professor.name}</span>
        </div>

        {/* Header */}
        <div className="pd-header">
          <h1 className="pd-prof-name">{professor.name}</h1>
          <div className="pd-header-meta">
            <span className="pd-desig" style={{ background: desigStyle.bg, color: desigStyle.color }}>
              {professor.designation || "Professor"}
            </span>
            <span className="pd-dept">{professor.department} · {professor.collegeName}</span>
          </div>
          <div className="pd-header-bottom">
            <div className="pd-rating-big">
              <div className="pd-rating-num">{formatRating(professor.overallRating) || "—"}</div>
              <div>
                <StarRating value={professor.overallRating || 0} interactive={false} size="md" />
                <div className="pd-rating-sub">{reviews.length} {reviews.length === 1 ? "review" : "reviews"}</div>
              </div>
            </div>
            <button className="pd-rate-btn" onClick={() => setIsSubmitModalOpen(true)}>
              ★ Rate this Professor
            </button>
          </div>
        </div>

        {/* Rating Breakdown */}
        <div className="pd-card">
          <h2 className="pd-card-title">Rating Breakdown</h2>
          {RATING_BARS.map((bar) => {
            const val = professor.ratings?.[bar.key] || 0;
            const pct = (val / 5) * 100;
            const fillColor = bar.inverse
              ? val > 3.5 ? "#ef4444" : val > 2 ? "#f59e0b" : "#22c55e"
              : val > 3.5 ? "#22c55e" : val > 2 ? "#f59e0b" : "#ef4444";
            return (
              <div key={bar.key} className="pd-bar-row">
                <span className="pd-bar-label">{bar.label}</span>
                <div className="pd-bar-track">
                  <div className="pd-bar-fill" style={{ width: `${pct}%`, background: fillColor }} />
                </div>
                <span className="pd-bar-val">{val > 0 ? val.toFixed(1) : "—"}</span>
              </div>
            );
          })}
        </div>

        {/* Tag Cloud */}
        {sortedTags.length > 0 && (
          <div className="pd-card">
            <h2 className="pd-card-title">Common Tags</h2>
            <div className="pd-tag-cloud">
              {sortedTags.map(([tag, count], idx) => (
                <span
                  key={tag}
                  className={`pd-tag-cloud-pill ${idx === 0 ? "rank1" : idx < 3 ? "rank2" : ""}`}
                  style={tagSize(count)}
                >
                  {tag}
                  <span style={{ opacity: 0.6, fontSize: "0.75em", marginLeft: "5px" }}>×{count}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Reviews */}
        <div className="pd-card">
          <div className="pd-reviews-header">
            <h2 className="pd-card-title" style={{ margin: 0 }}>Student Reviews ({reviews.length})</h2>
            <div className="pd-sort">
              <button className={`pd-sort-btn ${sortBy === "recent" ? "active" : ""}`} onClick={() => setSortBy("recent")}>Most Recent</button>
              <button className={`pd-sort-btn ${sortBy === "helpful" ? "active" : ""}`} onClick={() => setSortBy("helpful")}>Most Helpful</button>
            </div>
          </div>

          {sortedReviews.length === 0 ? (
            <div className="pd-empty">
              <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>🎓</div>
              <p>No reviews yet. Be the first to rate this professor!</p>
            </div>
          ) : (
            <>
              {sortedReviews.slice(0, visibleCount).map((review) => (
                <div key={review.id} className="pd-review-card">
                  <div className="pd-review-badges">
                    {review.batchYear && <span className="pd-review-badge pd-badge-year">Batch {review.batchYear}</span>}
                    {review.branch && <span className="pd-review-badge pd-badge-branch">{review.branch}</span>}
                  </div>
                  <div className="pd-mini-ratings">
                    {RATING_BARS.map((bar) => (
                      <div key={bar.key} className="pd-mini-rating">
                        <span className="pd-mini-label">{bar.label.split(" ")[0]}:</span>
                        <StarRating value={review.ratings?.[bar.key] || 0} interactive={false} size="xs" />
                      </div>
                    ))}
                  </div>
                  {review.tags?.length > 0 && (
                    <div className="pd-review-tags">
                      {review.tags.map((tag) => <span key={tag} className="pd-rtag">{tag}</span>)}
                    </div>
                  )}
                  <p className="pd-review-text">{review.text}</p>
                  <div className="pd-review-footer">
                    <span>👍 {review.helpfulVotes || 0} helpful</span>
                    <span>{timeAgo(review.createdAt)}</span>
                  </div>
                </div>
              ))}
              {visibleCount < sortedReviews.length && (
                <button className="pd-load-more" onClick={() => setVisibleCount((v) => v + PAGE_SIZE)}>
                  Load more reviews ({sortedReviews.length - visibleCount} remaining)
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Rate Professor Modal */}
      {isSubmitModalOpen && (
        <Modal onClose={() => setIsSubmitModalOpen(false)} title={`Rate ${professor.name}`}>
          {!user ? (
            <div className="pd-auth-gate">
              <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>🔐</div>
              <p>Sign in to submit a verified rating for this professor.</p>
              <button className="pd-google-btn" onClick={() => { setIsSubmitModalOpen(false); navigate("/login"); }}>
                Sign in to continue
              </button>
            </div>
          ) : (
            <div>
              <div className="pd-modal-field">
                <label className="pd-modal-label">Rate Each Category</label>
                {RATING_BARS.map((bar) => (
                  <div key={bar.key} className="pd-modal-rating-row">
                    <span style={{ fontSize: "0.88rem", fontWeight: 600, color: "#444" }}>{bar.label}</span>
                    <StarRating
                      value={modalForm.ratings[bar.key]}
                      onChange={(v) => setModalForm((p) => ({ ...p, ratings: { ...p.ratings, [bar.key]: v } }))}
                      interactive size="sm"
                    />
                  </div>
                ))}
              </div>

              <div className="pd-modal-field">
                <label className="pd-modal-label">Tags</label>
                <div className="pd-modal-tags">
                  {PROF_TAGS.map((tag) => (
                    <button
                      key={tag}
                      className={`pd-modal-tag ${modalForm.tags.includes(tag) ? "active" : ""}`}
                      onClick={() => toggleModalTag(tag)}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pd-modal-field">
                <label className="pd-modal-label">Your Experience</label>
                <textarea
                  className="pd-modal-textarea"
                  value={modalForm.text}
                  onChange={(e) => setModalForm((p) => ({ ...p, text: e.target.value }))}
                  placeholder="Share your experience with this professor (min. 50 characters)"
                />
                <div style={{ fontSize: "0.75rem", color: modalForm.text.length < 50 ? "#e53e3e" : "#ccc", textAlign: "right", marginTop: 2 }}>
                  {modalForm.text.length} chars {modalForm.text.length < 50 ? `(${50 - modalForm.text.length} more needed)` : "✓"}
                </div>
              </div>

              <div className="pd-modal-row2">
                <div className="pd-modal-field" style={{ margin: 0 }}>
                  <label className="pd-modal-label">Batch Year</label>
                  <select className="pd-modal-select" value={modalForm.batchYear} onChange={(e) => setModalForm((p) => ({ ...p, batchYear: e.target.value }))}>
                    <option value="">Select year</option>
                    {BATCH_YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                <div className="pd-modal-field" style={{ margin: 0 }}>
                  <label className="pd-modal-label">Branch</label>
                  <select className="pd-modal-select" value={modalForm.branch} onChange={(e) => setModalForm((p) => ({ ...p, branch: e.target.value }))}>
                    <option value="">Select branch</option>
                    {BRANCHES.map((b) => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
              </div>

              <div className="pd-modal-btn-row">
                <button className="pd-modal-btn pd-modal-cancel" onClick={() => setIsSubmitModalOpen(false)}>Cancel</button>
                <button
                  className="pd-modal-btn pd-modal-submit"
                  onClick={handleSubmitReview}
                  disabled={
                    isSubmitting ||
                    modalForm.text.length < 50 ||
                    !modalForm.batchYear ||
                    !modalForm.branch ||
                    !Object.values(modalForm.ratings).every((v) => v > 0)
                  }
                >
                  {isSubmitting ? "Submitting…" : "Submit Rating"}
                </button>
              </div>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}

