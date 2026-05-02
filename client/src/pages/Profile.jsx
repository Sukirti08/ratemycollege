import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { deleteReview } from "../api/reviews";
import { useAuthStore } from "../store/authStore";
import { useToastStore } from "../store/toastStore";
import StarRating from "../components/ui/StarRating";
import TagPill from "../components/ui/TagPill";
import Modal from "../components/ui/Modal";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import { formatRating } from "../utils/formatRating";

const KARMA_TIERS = [
  { label: "Bronze", max: 49, color: "#c97b2e", bg: "#fff8f0", border: "#f5ddb8" },
  { label: "Silver", max: 149, color: "#7a8fa6", bg: "#f0f4f8", border: "#c8d8e8" },
  { label: "Gold", max: Infinity, color: "#d4a017", bg: "#fffbf0", border: "#f5e4a0" },
];

const KARMA_REASONS = [
  { icon: "✍️", action: "Writing a review", points: "+10" },
  { icon: "📊", action: "Submitting verified placement", points: "+5" },
  { icon: "👍", action: "Your review gets a helpful vote", points: "+2" },
  { icon: "📋", action: "Insider semester report", points: "+5" },
];

const BATCH_YEARS = [2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025];
const BRANCHES = ["CSE", "ECE", "ME", "CE", "EE", "Chemical", "Metallurgy", "Physics", "Maths & Computing", "Other"];

export default function Profile() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { addToast } = useToastStore();

  const [myReviews, setMyReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInsiderModalOpen, setIsInsiderModalOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [showKarmaTooltip, setShowKarmaTooltip] = useState(false);
  const [insiderForm, setInsiderForm] = useState({ college: "", semesterRating: 0, highlights: "", concerns: "", batchYear: "" });
  const [isInsiderSubmitting, setIsInsiderSubmitting] = useState(false);

  useEffect(() => {
    if (!user) { navigate("/login"); return; }
    loadReviews();
  }, [user]);

  const loadReviews = async () => {
    setIsLoading(true);
    try {
      // getMyReviews() call — mocked as fetch pattern
      const res = await fetch("/api/users/me/reviews", { credentials: "include" });
      const data = await res.json();
      setMyReviews(data?.reviews || []);
    } catch { setMyReviews([]); }
    finally { setIsLoading(false); }
  };

  const handleDelete = async (id) => {
    try {
      await deleteReview(id);
      setMyReviews((prev) => prev.filter((r) => r.id !== id));
      setDeleteConfirmId(null);
      addToast({ type: "success", message: "Review deleted." });
    } catch { addToast({ type: "error", message: "Could not delete review." }); }
  };

  const handleInsiderSubmit = async () => {
    setIsInsiderSubmitting(true);
    try {
      await fetch("/api/users/insider-report", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(insiderForm),
      });
      addToast({ type: "success", message: "+5 karma earned! 📊" });
      setIsInsiderModalOpen(false);
      setInsiderForm({ college: "", semesterRating: 0, highlights: "", concerns: "", batchYear: "" });
    } catch { addToast({ type: "error", message: "Failed to submit report." }); }
    finally { setIsInsiderSubmitting(false); }
  };

  const karmaPoints = user?.karmaPoints ?? 0;
  const karmaTier = KARMA_TIERS.find((t) => karmaPoints <= t.max) || KARMA_TIERS[2];
  const initials = (user?.name || "?").split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  const timeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const d = Math.floor(diff / 86400000);
    if (d === 0) return "Today";
    if (d === 1) return "Yesterday";
    if (d < 30) return `${d}d ago`;
    return new Date(dateStr).toLocaleDateString("en-IN", { month: "short", year: "numeric" });
  };

  return (
    <div className="pf-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:wght@400;500;600&display=swap');

        .pf-root { min-height: 100vh; background: #faf7f2; font-family: 'DM Sans', sans-serif; padding: 2rem 1rem 4rem; }
        .pf-container { max-width: 780px; margin: 0 auto; }
        .pf-brand { font-family: 'Playfair Display', serif; color: #b5451b; font-size: 1.1rem; margin-bottom: 2rem; text-decoration: none; display: block; }

        /* Header Card */
        .pf-header {
          background: white; border-radius: 16px; padding: 2rem 2.5rem;
          box-shadow: 0 4px 24px rgba(0,0,0,0.06); border: 1px solid #f0ebe3;
          display: flex; align-items: flex-start; gap: 1.75rem; margin-bottom: 1.5rem;
          flex-wrap: wrap;
        }
        .pf-avatar-img { width: 80px; height: 80px; border-radius: 50%; object-fit: cover; border: 3px solid #f0ebe3; flex-shrink: 0; }
        .pf-avatar-fallback {
          width: 80px; height: 80px; border-radius: 50%; background: linear-gradient(135deg, #b5451b, #d4693e);
          color: white; font-size: 1.7rem; font-weight: 700; font-family: 'Playfair Display', serif;
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .pf-name { font-family: 'Playfair Display', serif; font-size: 1.65rem; font-weight: 700; color: #1a1a1a; margin: 0 0 0.25rem; }
        .pf-email { color: #aaa; font-size: 0.88rem; margin-bottom: 0.6rem; max-width: 280px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .pf-meta { display: flex; flex-wrap: wrap; gap: 0.5rem; align-items: center; }
        .pf-badge { display: inline-flex; padding: 3px 12px; border-radius: 20px; font-size: 0.76rem; font-weight: 600; letter-spacing: 0.04em; }
        .pf-badge-college { background: #fff3e0; color: #e65100; }
        .pf-badge-branch { background: #f3e5f5; color: #6a1b9a; }
        .pf-badge-year { background: #e3f2fd; color: #1565c0; }

        /* Karma */
        .pf-karma {
          border-radius: 14px; padding: 1.5rem 2rem; margin-bottom: 1.5rem;
          border: 1.5px solid; display: flex; align-items: center; justify-content: space-between;
          position: relative; flex-wrap: wrap; gap: 1rem;
        }
        .pf-karma-num { font-family: 'Playfair Display', serif; font-size: 2.5rem; font-weight: 700; line-height: 1; }
        .pf-karma-label { font-size: 0.8rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; opacity: 0.7; margin-top: 4px; }
        .pf-karma-tier { font-size: 1.1rem; font-weight: 700; }
        .pf-karma-info { cursor: pointer; font-size: 1rem; opacity: 0.6; hover: opacity 1; width: 28px; height: 28px; border-radius: 50%; border: 1.5px solid currentColor; display: flex; align-items: center; justify-content: center; font-size: 0.8rem; font-weight: 700; flex-shrink: 0; }
        .pf-karma-tooltip {
          position: absolute; top: calc(100% + 10px); right: 0; background: #1a1a1a; color: white;
          border-radius: 12px; padding: 1rem 1.25rem; font-size: 0.83rem; z-index: 20;
          min-width: 240px; box-shadow: 0 8px 24px rgba(0,0,0,0.2); line-height: 1.8;
        }
        .pf-karma-tooltip-row { display: flex; justify-content: space-between; gap: 1rem; }
        .pf-karma-tooltip-pts { font-weight: 700; color: #6ee7b7; }

        /* Sections */
        .pf-section { background: white; border-radius: 16px; padding: 1.75rem 2rem; box-shadow: 0 4px 24px rgba(0,0,0,0.06); border: 1px solid #f0ebe3; margin-bottom: 1.5rem; }
        .pf-section-title { font-family: 'Playfair Display', serif; font-size: 1.25rem; font-weight: 700; color: #1a1a1a; margin: 0 0 1.25rem; }

        /* Review cards */
        .pf-review-card { border: 1px solid #f0ebe3; border-radius: 12px; padding: 1.25rem; margin-bottom: 1rem; transition: box-shadow 0.15s; }
        .pf-review-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.06); }
        .pf-review-card:last-child { margin-bottom: 0; }
        .pf-review-college { font-weight: 700; color: #b5451b; text-decoration: none; font-size: 0.95rem; }
        .pf-review-college:hover { text-decoration: underline; }
        .pf-review-meta { display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; margin: 0.5rem 0; }
        .pf-review-date { font-size: 0.78rem; color: #bbb; }
        .pf-review-text { font-size: 0.88rem; color: #555; line-height: 1.6; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; margin: 0.6rem 0; }
        .pf-review-tags { display: flex; flex-wrap: wrap; gap: 0.4rem; margin-bottom: 0.75rem; }
        .pf-tag { font-size: 0.75rem; padding: 2px 9px; border-radius: 20px; background: #f5f0ea; color: #888; }
        .pf-review-footer { display: flex; align-items: center; justify-content: space-between; }
        .pf-helpful { font-size: 0.82rem; color: #aaa; }
        .pf-delete-btn { background: none; border: 1.5px solid #e8e0d5; color: #e53e3e; border-color: #fccac3; padding: 0.3rem 0.85rem; border-radius: 8px; font-size: 0.82rem; font-family: 'DM Sans', sans-serif; cursor: pointer; font-weight: 600; transition: all 0.15s; }
        .pf-delete-btn:hover { background: #fee2e2; }
        .pf-delete-confirm { display: flex; align-items: center; gap: 0.5rem; }
        .pf-confirm-text { font-size: 0.82rem; color: #e53e3e; font-weight: 600; }
        .pf-btn-sm { padding: 0.3rem 0.8rem; border-radius: 8px; font-size: 0.82rem; font-family: 'DM Sans', sans-serif; cursor: pointer; font-weight: 600; border: none; }
        .pf-btn-danger { background: #e53e3e; color: white; }
        .pf-btn-cancel { background: #f0ebe3; color: #666; }
        .pf-empty { text-align: center; padding: 2rem 0; color: #bbb; }
        .pf-empty-btn { display: inline-block; margin-top: 0.75rem; padding: 0.7rem 1.5rem; background: #b5451b; color: white; border-radius: 10px; font-size: 0.9rem; font-weight: 600; text-decoration: none; font-family: 'DM Sans', sans-serif; }

        /* Insider card */
        .pf-insider {
          border-radius: 16px; padding: 1.75rem 2rem; margin-bottom: 1.5rem;
          background: linear-gradient(135deg, #fff8f3 0%, #fdf3fb 100%);
          border: 1.5px solid #f5cba7; position: relative; overflow: hidden;
        }
        .pf-insider::before {
          content: ''; position: absolute; top: -40px; right: -40px; width: 160px; height: 160px;
          border-radius: 50%; background: rgba(181,69,27,0.05); pointer-events: none;
        }
        .pf-insider-title { font-family: 'Playfair Display', serif; font-size: 1.2rem; font-weight: 700; color: #1a1a1a; margin: 0 0 0.4rem; }
        .pf-insider-desc { font-size: 0.88rem; color: #888; margin: 0 0 1.25rem; line-height: 1.6; }
        .pf-insider-btn { padding: 0.75rem 1.5rem; background: #b5451b; color: white; border: none; border-radius: 10px; font-size: 0.92rem; font-weight: 600; font-family: 'DM Sans', sans-serif; cursor: pointer; transition: background 0.2s; }
        .pf-insider-btn:hover { background: #9a3a15; }

        /* Modal form */
        .pf-modal-field { margin-bottom: 1.1rem; }
        .pf-modal-label { font-size: 0.82rem; font-weight: 600; color: #666; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px; display: block; }
        .pf-modal-input { width: 100%; padding: 0.75rem 1rem; border: 1.5px solid #e8e0d5; border-radius: 10px; font-size: 0.92rem; font-family: 'DM Sans', sans-serif; background: #fafaf8; outline: none; box-sizing: border-box; }
        .pf-modal-input:focus { border-color: #b5451b; }
        .pf-modal-textarea { width: 100%; padding: 0.75rem 1rem; border: 1.5px solid #e8e0d5; border-radius: 10px; font-size: 0.88rem; font-family: 'DM Sans', sans-serif; background: #fafaf8; outline: none; resize: vertical; min-height: 90px; box-sizing: border-box; line-height: 1.6; }
        .pf-modal-textarea:focus { border-color: #b5451b; }
        .pf-modal-btn-row { display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1.5rem; }
        .pf-modal-btn { padding: 0.75rem 1.5rem; border-radius: 10px; font-size: 0.92rem; font-weight: 600; font-family: 'DM Sans', sans-serif; cursor: pointer; border: none; }
        .pf-modal-submit { background: #b5451b; color: white; }
        .pf-modal-submit:disabled { opacity: 0.5; cursor: not-allowed; }
        .pf-modal-cancel { background: #f0ebe3; color: #666; }

        @media (max-width: 600px) {
          .pf-header { padding: 1.5rem; gap: 1.25rem; }
          .pf-section { padding: 1.25rem 1.25rem; }
          .pf-karma { padding: 1.25rem; }
          .pf-insider { padding: 1.25rem; }
          .pf-karma-num { font-size: 2rem; }
        }
      `}</style>

      <div className="pf-container">
        <a href="/" className="pf-brand">RateMyCollege India</a>

        {isLoading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "4rem" }}>
            <LoadingSpinner />
          </div>
        ) : (
          <>
            {/* Profile Header */}
            <div className="pf-header">
              {user?.avatar
                ? <img src={user.avatar} alt={user.name} className="pf-avatar-img" />
                : <div className="pf-avatar-fallback">{initials}</div>}
              <div style={{ flex: 1, minWidth: 0 }}>
                <h1 className="pf-name">{user?.name || "Student"}</h1>
                <p className="pf-email">{user?.email}</p>
                <div className="pf-meta">
                  {user?.college && <span className="pf-badge pf-badge-college">{user.college.name}</span>}
                  {user?.college?.type && <span className="pf-badge pf-badge-branch">{user.college.type}</span>}
                  {user?.branch && <span className="pf-badge pf-badge-branch">{user.branch}</span>}
                  {user?.batchYear && <span className="pf-badge pf-badge-year">Batch {user.batchYear}</span>}
                </div>
              </div>
            </div>

            {/* Karma */}
            <div className="pf-karma" style={{ background: karmaTier.bg, borderColor: karmaTier.border, color: karmaTier.color }}>
              <div>
                <div className="pf-karma-num">{karmaPoints}</div>
                <div className="pf-karma-label">Karma Points</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div className="pf-karma-tier">
                  {karmaTier.label === "Bronze" ? "🥉" : karmaTier.label === "Silver" ? "🥈" : "🥇"} {karmaTier.label}
                </div>
                <div style={{ fontSize: "0.78rem", marginTop: 4, opacity: 0.7 }}>
                  {karmaTier.label !== "Gold" && `${karmaTier.max - karmaPoints + 1} pts to ${KARMA_TIERS[KARMA_TIERS.indexOf(karmaTier) + 1]?.label}`}
                </div>
              </div>
              <div style={{ position: "relative" }}>
                <div className="pf-karma-info" onClick={() => setShowKarmaTooltip((v) => !v)}>?</div>
                {showKarmaTooltip && (
                  <div className="pf-karma-tooltip">
                    <div style={{ fontWeight: 700, marginBottom: "0.5rem", color: "#eee" }}>How to earn karma</div>
                    {KARMA_REASONS.map((r) => (
                      <div key={r.action} className="pf-karma-tooltip-row">
                        <span>{r.icon} {r.action}</span>
                        <span className="pf-karma-tooltip-pts">{r.points}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* My Reviews */}
            <div className="pf-section">
              <h2 className="pf-section-title">My Reviews ({myReviews.length})</h2>
              {myReviews.length === 0 ? (
                <div className="pf-empty">
                  <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>📝</div>
                  <p>You haven't written any reviews yet</p>
                  <a href="/write-review" className="pf-empty-btn">Write Your First Review →</a>
                </div>
              ) : (
                myReviews.map((review) => (
                  <div key={review.id} className="pf-review-card">
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "0.5rem", flexWrap: "wrap" }}>
                      <a href={`/college/${review.collegeId}`} className="pf-review-college">
                        {review.collegeName}
                      </a>
                      {review.collegeType && <span className="pf-badge pf-badge-college" style={{ fontSize: "0.7rem" }}>{review.collegeType}</span>}
                    </div>
                    <div className="pf-review-meta">
                      <StarRating value={review.ratings?.overall || 0} interactive={false} size="sm" />
                      <span className="pf-review-date">{timeAgo(review.createdAt)}</span>
                    </div>
                    <p className="pf-review-text">{review.text}</p>
                    {review.tags?.length > 0 && (
                      <div className="pf-review-tags">
                        {review.tags.slice(0, 4).map((tag) => <span key={tag} className="pf-tag">{tag}</span>)}
                      </div>
                    )}
                    <div className="pf-review-footer">
                      <span className="pf-helpful">👍 {review.helpfulVotes || 0} found helpful</span>
                      {deleteConfirmId === review.id ? (
                        <div className="pf-delete-confirm">
                          <span className="pf-confirm-text">Are you sure?</span>
                          <button className="pf-btn-sm pf-btn-danger" onClick={() => handleDelete(review.id)}>Delete</button>
                          <button className="pf-btn-sm pf-btn-cancel" onClick={() => setDeleteConfirmId(null)}>Cancel</button>
                        </div>
                      ) : (
                        <button className="pf-delete-btn" onClick={() => setDeleteConfirmId(review.id)}>Delete</button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Insider Report */}
            <div className="pf-insider">
              <h2 className="pf-insider-title">📊 Share Your Semester Experience</h2>
              <p className="pf-insider-desc">Help future students with a quick semester survey. Earn +5 karma for every insider report!</p>
              <button className="pf-insider-btn" onClick={() => setIsInsiderModalOpen(true)}>Submit Report</button>
            </div>
          </>
        )}
      </div>

      {/* Insider Modal */}
      {isInsiderModalOpen && (
        <Modal onClose={() => setIsInsiderModalOpen(false)} title="Insider Semester Report">
          <div>
            <div className="pf-modal-field">
              <label className="pf-modal-label">College</label>
              <input
                className="pf-modal-input"
                value={insiderForm.college || user?.college?.name || ""}
                onChange={(e) => setInsiderForm((p) => ({ ...p, college: e.target.value }))}
                placeholder="Your college name"
              />
            </div>
            <div className="pf-modal-field">
              <label className="pf-modal-label">Semester Rating</label>
              <StarRating
                value={insiderForm.semesterRating}
                onChange={(v) => setInsiderForm((p) => ({ ...p, semesterRating: v }))}
                interactive size="md"
              />
            </div>
            <div className="pf-modal-field">
              <label className="pf-modal-label">Top Highlights</label>
              <textarea
                className="pf-modal-textarea"
                value={insiderForm.highlights}
                onChange={(e) => setInsiderForm((p) => ({ ...p, highlights: e.target.value.slice(0, 300) }))}
                placeholder="What went well this semester? (50–300 chars)"
              />
              <div style={{ fontSize: "0.75rem", color: "#ccc", textAlign: "right" }}>{insiderForm.highlights.length}/300</div>
            </div>
            <div className="pf-modal-field">
              <label className="pf-modal-label">Main Concerns</label>
              <textarea
                className="pf-modal-textarea"
                value={insiderForm.concerns}
                onChange={(e) => setInsiderForm((p) => ({ ...p, concerns: e.target.value.slice(0, 300) }))}
                placeholder="What could be improved? (50–300 chars)"
              />
              <div style={{ fontSize: "0.75rem", color: "#ccc", textAlign: "right" }}>{insiderForm.concerns.length}/300</div>
            </div>
            <div className="pf-modal-field">
              <label className="pf-modal-label">Current Batch Year</label>
              <select
                className="pf-modal-input"
                value={insiderForm.batchYear}
                onChange={(e) => setInsiderForm((p) => ({ ...p, batchYear: e.target.value }))}
              >
                <option value="">Select year</option>
                {BATCH_YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div className="pf-modal-btn-row">
              <button className="pf-modal-btn pf-modal-cancel" onClick={() => setIsInsiderModalOpen(false)}>Cancel</button>
              <button
                className="pf-modal-btn pf-modal-submit"
                onClick={handleInsiderSubmit}
                disabled={
                  isInsiderSubmitting ||
                  insiderForm.highlights.length < 50 ||
                  insiderForm.concerns.length < 50 ||
                  !insiderForm.batchYear
                }
              >
                {isInsiderSubmitting ? "Submitting…" : "Submit Report"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

