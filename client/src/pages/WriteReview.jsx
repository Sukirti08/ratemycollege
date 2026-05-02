import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getColleges } from "../api/colleges";
import { submitReview } from "../api/reviews";
import { googleLogin } from "../api/auth";
import { useAuthStore } from "../store/authStore";
import { useToastStore } from "../store/toastStore";
import StarRating from "../components/ui/StarRating";
import TagPill from "../components/ui/TagPill";

const RATING_FIELDS = [
  { key: "overall", label: "Overall Experience", desc: "Your holistic experience at this institution" },
  { key: "teaching", label: "Teaching Quality", desc: "Faculty quality, course depth, and curriculum design" },
  { key: "placements", label: "Placements", desc: "Campus recruitment, packages, and career support" },
  { key: "research", label: "Research", desc: "Labs, publications, and research opportunities" },
  { key: "hostel", label: "Hostel & Mess", desc: "Accommodation quality, food, and living conditions" },
  { key: "infrastructure", label: "Infrastructure", desc: "Buildings, classrooms, labs, and campus facilities" },
  { key: "facultyAccessibility", label: "Faculty Accessibility", desc: "How approachable and responsive are professors" },
];

const TAGS = [
  "🎓 Strong Academics", "💼 Excellent Placements", "🔬 Research Focus",
  "🤝 Helpful Faculty", "🏠 Good Hostel", "🎉 Active Clubs",
  "💻 Good Infrastructure", "📶 Poor WiFi", "🏃 Strict Attendance",
  "🌍 Diverse Culture", "💰 Worth the Fee", "⚡ Industry Connections",
  "📚 Heavy Workload", "🎯 Competitive Environment",
];

const BATCH_YEARS = [2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025];
const BRANCHES = ["CSE", "ECE", "ME", "CE", "EE", "Chemical", "Metallurgy", "Physics", "Maths & Computing", "Other"];
const STEP_LABELS = ["College", "Verify", "Rate", "Tags", "Write"];

const initialFormData = {
  collegeId: "", ratings: { overall: 0, teaching: 0, placements: 0, research: 0, hostel: 0, infrastructure: 0, facultyAccessibility: 0 },
  text: "", tags: [], batchYear: "", branch: "", isAnonymous: true,
};

export default function WriteReview() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuthStore();
  const { addToast } = useToastStore();

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState(initialFormData);
  const [collegeSearch, setCollegeSearch] = useState("");
  const [collegeResults, setCollegeResults] = useState([]);
  const [selectedCollege, setSelectedCollege] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [showDropdown, setShowDropdown] = useState(false);
  const [faqOpen, setFaqOpen] = useState(false);

  const debounceRef = useRef(null);
  const searchRef = useRef(null);

  // Auto-select college from URL param
  useEffect(() => {
    const collegeId = searchParams.get("college");
    if (collegeId) {
      getColleges({ id: collegeId }).then((res) => {
        if (res?.data?.[0]) {
          setSelectedCollege(res.data[0]);
          setFormData((p) => ({ ...p, collegeId }));
          setCurrentStep(2);
        }
      }).catch(() => {});
    }
  }, []);

  // Debounced college search
  useEffect(() => {
    if (!collegeSearch.trim()) { setCollegeResults([]); setShowDropdown(false); return; }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await getColleges({ search: collegeSearch });
        setCollegeResults(res?.data || []);
        setShowDropdown(true);
      } catch { setCollegeResults([]); }
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [collegeSearch]);

  const selectCollege = (college) => {
    setSelectedCollege(college);
    setFormData((p) => ({ ...p, collegeId: college.id }));
    setCollegeSearch(college.name);
    setShowDropdown(false);
    setCurrentStep(2);
  };

  const canProceedToStep = (step) => {
    if (step === 2) return !!formData.collegeId;
    if (step === 3) return true; // verified or anonymous
    if (step === 4) return Object.values(formData.ratings).every((v) => v > 0);
    if (step === 5) return formData.tags.length > 0;
    return true;
  };

  const handleNext = () => {
    if (currentStep === 3 && !canProceedToStep(4)) {
      setErrors({ ratings: "Please rate all categories before continuing." });
      return;
    }
    setErrors({});
    setCurrentStep((s) => Math.min(s + 1, 5));
  };

  const handleBack = () => setCurrentStep((s) => Math.max(s - 1, 1));

  const toggleTag = (tag) => {
    setFormData((p) => {
      const has = p.tags.includes(tag);
      if (!has && p.tags.length >= 5) return p;
      return { ...p, tags: has ? p.tags.filter((t) => t !== tag) : [...p.tags, tag] };
    });
  };

  const handleSubmit = async () => {
    if (formData.text.length < 100 || !formData.batchYear || !formData.branch) return;
    setIsSubmitting(true);
    try {
      await submitReview(formData);
      addToast({ type: "success", message: "Review submitted! +10 karma 🎉" });
      navigate(`/college/${formData.collegeId}`);
    } catch (e) {
      addToast({ type: "error", message: "Failed to submit. Please try again." });
    } finally { setIsSubmitting(false); }
  };

  return (
    <div className="wr-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:wght@400;500;600&display=swap');

        .wr-root {
          min-height: 100vh;
          background: #faf7f2;
          font-family: 'DM Sans', sans-serif;
          padding: 2rem 1rem 4rem;
        }
        .wr-container {
          max-width: 680px;
          margin: 0 auto;
        }
        .wr-brand {
          font-family: 'Playfair Display', serif;
          color: #b5451b;
          font-size: 1.1rem;
          letter-spacing: 0.02em;
          margin-bottom: 2rem;
          text-decoration: none;
          display: block;
        }
        .wr-progress {
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 2.5rem;
          gap: 0;
        }
        .wr-step-wrap {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
        }
        .wr-dot {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.8rem;
          font-weight: 600;
          border: 2px solid #ddd;
          background: white;
          color: #999;
          transition: all 0.3s;
          position: relative;
          z-index: 1;
        }
        .wr-dot.active { border-color: #b5451b; background: #b5451b; color: white; box-shadow: 0 0 0 4px rgba(181,69,27,0.15); }
        .wr-dot.done { border-color: #2a9d6b; background: #2a9d6b; color: white; }
        .wr-dot-label { font-size: 0.68rem; color: #999; font-weight: 500; }
        .wr-dot-label.active { color: #b5451b; font-weight: 600; }
        .wr-line { flex: 1; height: 2px; background: #e0e0e0; margin: 0 -2px; margin-bottom: 22px; transition: background 0.3s; min-width: 20px; max-width: 60px; }
        .wr-line.done { background: #2a9d6b; }
        .wr-card {
          background: white;
          border-radius: 16px;
          padding: 2.5rem;
          box-shadow: 0 4px 24px rgba(0,0,0,0.06), 0 1px 4px rgba(0,0,0,0.04);
          border: 1px solid #f0ebe3;
        }
        .wr-h1 {
          font-family: 'Playfair Display', serif;
          font-size: 1.75rem;
          color: #1a1a1a;
          margin: 0 0 0.5rem;
          line-height: 1.2;
        }
        .wr-sub { color: #888; font-size: 0.9rem; margin: 0 0 1.75rem; }
        .wr-search-wrap { position: relative; }
        .wr-input {
          width: 100%;
          padding: 0.875rem 1.1rem;
          border: 1.5px solid #e8e0d5;
          border-radius: 10px;
          font-size: 1rem;
          font-family: 'DM Sans', sans-serif;
          background: #fafaf8;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
          box-sizing: border-box;
        }
        .wr-input:focus { border-color: #b5451b; box-shadow: 0 0 0 3px rgba(181,69,27,0.1); background: white; }
        .wr-dropdown {
          position: absolute;
          top: calc(100% + 6px);
          left: 0; right: 0;
          background: white;
          border: 1.5px solid #e8e0d5;
          border-radius: 10px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.12);
          z-index: 50;
          overflow: hidden;
        }
        .wr-college-item {
          padding: 0.85rem 1.1rem;
          cursor: pointer;
          transition: background 0.15s;
          border-bottom: 1px solid #f5f0ea;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.75rem;
        }
        .wr-college-item:last-child { border-bottom: none; }
        .wr-college-item:hover { background: #fdf7f3; }
        .wr-college-name { font-weight: 600; color: #222; font-size: 0.95rem; }
        .wr-college-loc { font-size: 0.8rem; color: #999; margin-top: 2px; }
        .wr-badge {
          display: inline-flex;
          padding: 2px 10px;
          border-radius: 20px;
          font-size: 0.72rem;
          font-weight: 600;
          letter-spacing: 0.03em;
          white-space: nowrap;
          flex-shrink: 0;
        }
        .wr-badge-iit { background: #fff3e0; color: #e65100; }
        .wr-badge-nit { background: #e3f2fd; color: #1565c0; }
        .wr-badge-iiit { background: #f3e5f5; color: #6a1b9a; }
        .wr-badge-default { background: #f5f5f5; color: #555; }

        /* Step 2 */
        .wr-identity-card {
          display: flex; align-items: center; gap: 1rem;
          padding: 1.2rem; background: #f9fdf9; border: 1.5px solid #c8ecd8; border-radius: 12px;
          margin-bottom: 1.25rem;
        }
        .wr-avatar { width: 52px; height: 52px; border-radius: 50%; object-fit: cover; border: 2px solid #ddd; }
        .wr-avatar-fallback {
          width: 52px; height: 52px; border-radius: 50%; background: #b5451b;
          color: white; display: flex; align-items: center; justify-content: center;
          font-size: 1.2rem; font-weight: 700; font-family: 'Playfair Display', serif; flex-shrink: 0;
        }
        .wr-verified-badge { color: #2a9d6b; font-size: 0.82rem; font-weight: 600; margin-top: 2px; }
        .wr-faq { margin-top: 1rem; border: 1px solid #e8e0d5; border-radius: 10px; overflow: hidden; }
        .wr-faq-header { padding: 0.85rem 1rem; cursor: pointer; font-size: 0.88rem; color: #666; display: flex; justify-content: space-between; align-items: center; font-weight: 500; user-select: none; }
        .wr-faq-body { padding: 0 1rem 1rem; font-size: 0.85rem; color: #777; line-height: 1.6; }
        .wr-google-btn {
          width: 100%; padding: 0.875rem; border: 1.5px solid #e8e0d5; border-radius: 10px;
          background: white; font-size: 0.95rem; font-family: 'DM Sans', sans-serif;
          cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.75rem;
          font-weight: 600; color: #333; transition: border-color 0.2s, box-shadow 0.2s;
          margin-bottom: 0.75rem;
        }
        .wr-google-btn:hover { border-color: #b5451b; box-shadow: 0 2px 8px rgba(181,69,27,0.1); }
        .wr-anon-btn { background: none; border: none; color: #aaa; font-size: 0.85rem; cursor: pointer; font-family: 'DM Sans', sans-serif; text-decoration: underline; display: block; width: 100%; text-align: center; margin-top: 0.5rem; }

        /* Step 3 */
        .wr-rating-row {
          display: flex; align-items: flex-start; justify-content: space-between;
          padding: 1rem 0; border-bottom: 1px solid #f0ebe3;
          gap: 1rem;
        }
        .wr-rating-row:last-child { border-bottom: none; }
        .wr-rating-label { font-weight: 600; font-size: 0.95rem; color: #222; }
        .wr-rating-desc { font-size: 0.78rem; color: #aaa; margin-top: 2px; max-width: 220px; }
        .wr-error { color: #e53e3e; font-size: 0.83rem; margin-top: 0.75rem; font-weight: 500; }

        /* Step 4 */
        .wr-tags-grid { display: flex; flex-wrap: wrap; gap: 0.6rem; margin-bottom: 1rem; }
        .wr-tag-pill {
          padding: 0.45rem 0.9rem; border-radius: 20px; font-size: 0.85rem; cursor: pointer;
          border: 1.5px solid #e8e0d5; background: white; font-family: 'DM Sans', sans-serif;
          transition: all 0.15s; user-select: none; font-weight: 500; color: #555;
        }
        .wr-tag-pill:hover { border-color: #b5451b; color: #b5451b; }
        .wr-tag-pill.active { background: #b5451b; border-color: #b5451b; color: white; }
        .wr-tag-pill.disabled { opacity: 0.4; pointer-events: none; }
        .wr-tag-count { font-size: 0.83rem; color: #999; margin-bottom: 1.25rem; font-weight: 500; }

        /* Step 5 */
        .wr-textarea {
          width: 100%; padding: 1rem 1.1rem; border: 1.5px solid #e8e0d5; border-radius: 10px;
          font-size: 0.95rem; font-family: 'DM Sans', sans-serif; resize: vertical; min-height: 160px;
          outline: none; background: #fafaf8; transition: border-color 0.2s, box-shadow 0.2s;
          line-height: 1.7; box-sizing: border-box; color: #333;
        }
        .wr-textarea:focus { border-color: #b5451b; box-shadow: 0 0 0 3px rgba(181,69,27,0.1); background: white; }
        .wr-char-counter { text-align: right; font-size: 0.8rem; color: #aaa; margin-top: 4px; }
        .wr-char-counter.warn { color: #e53e3e; }
        .wr-select {
          width: 100%; padding: 0.75rem 1rem; border: 1.5px solid #e8e0d5; border-radius: 10px;
          font-size: 0.92rem; font-family: 'DM Sans', sans-serif; background: #fafaf8;
          outline: none; cursor: pointer; color: #333;
        }
        .wr-select:focus { border-color: #b5451b; }
        .wr-row2 { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 1rem; }
        .wr-field-label { font-size: 0.82rem; font-weight: 600; color: #666; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.05em; }
        .wr-toggle-row {
          display: flex; align-items: center; justify-content: space-between;
          padding: 1rem; background: #faf7f2; border-radius: 10px; margin-top: 1.25rem; border: 1.5px solid #f0ebe3;
        }
        .wr-toggle-label { font-weight: 600; font-size: 0.92rem; color: #333; }
        .wr-toggle-sub { font-size: 0.78rem; color: #aaa; margin-top: 2px; }
        .wr-switch { position: relative; width: 44px; height: 24px; }
        .wr-switch input { opacity: 0; width: 0; height: 0; }
        .wr-slider {
          position: absolute; inset: 0; background: #ccc; border-radius: 24px; cursor: pointer; transition: background 0.2s;
        }
        .wr-slider:before {
          content: ''; position: absolute; height: 18px; width: 18px; left: 3px; bottom: 3px;
          background: white; border-radius: 50%; transition: transform 0.2s; box-shadow: 0 1px 3px rgba(0,0,0,0.2);
        }
        input:checked + .wr-slider { background: #2a9d6b; }
        input:checked + .wr-slider:before { transform: translateX(20px); }

        /* Buttons */
        .wr-btn-row { display: flex; align-items: center; justify-content: space-between; margin-top: 2rem; gap: 1rem; }
        .wr-btn {
          padding: 0.875rem 2rem; border-radius: 10px; font-size: 0.95rem; font-weight: 600;
          font-family: 'DM Sans', sans-serif; cursor: pointer; transition: all 0.2s; border: none;
          display: flex; align-items: center; gap: 0.5rem;
        }
        .wr-btn-primary { background: #b5451b; color: white; }
        .wr-btn-primary:hover:not(:disabled) { background: #9a3a15; transform: translateY(-1px); box-shadow: 0 4px 16px rgba(181,69,27,0.3); }
        .wr-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
        .wr-btn-ghost { background: none; border: 1.5px solid #e8e0d5; color: #666; }
        .wr-btn-ghost:hover { border-color: #b5451b; color: #b5451b; }
        .wr-spinner { width: 18px; height: 18px; border: 2px solid rgba(255,255,255,0.4); border-top-color: white; border-radius: 50%; animation: wr-spin 0.7s linear infinite; }
        @keyframes wr-spin { to { transform: rotate(360deg); } }

        @media (max-width: 600px) {
          .wr-card { padding: 1.5rem; }
          .wr-h1 { font-size: 1.4rem; }
          .wr-rating-row { flex-direction: column; }
          .wr-row2 { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="wr-container">
        <a href="/" className="wr-brand">RateMyCollege India</a>

        {/* Progress Bar */}
        <div className="wr-progress">
          {STEP_LABELS.map((label, i) => {
            const stepNum = i + 1;
            const isDone = currentStep > stepNum;
            const isActive = currentStep === stepNum;
            return (
              <div key={label} style={{ display: "flex", alignItems: "center" }}>
                <div className="wr-step-wrap">
                  <div className={`wr-dot ${isDone ? "done" : isActive ? "active" : ""}`}>
                    {isDone ? "✓" : stepNum}
                  </div>
                  <span className={`wr-dot-label ${isActive ? "active" : ""}`}>{label}</span>
                </div>
                {i < STEP_LABELS.length - 1 && (
                  <div className={`wr-line ${isDone ? "done" : ""}`} />
                )}
              </div>
            );
          })}
        </div>

        <div className="wr-card">
          {/* STEP 1: SELECT COLLEGE */}
          {currentStep === 1 && (
            <div>
              <h1 className="wr-h1">Which college are you reviewing?</h1>
              <p className="wr-sub">Search by name, location, or university</p>
              <div className="wr-search-wrap" ref={searchRef}>
                <input
                  className="wr-input"
                  value={collegeSearch}
                  onChange={(e) => setCollegeSearch(e.target.value)}
                  placeholder="e.g. IIT Bombay, NIT Trichy…"
                  autoFocus
                />
                {showDropdown && collegeResults.length > 0 && (
                  <div className="wr-dropdown">
                    {collegeResults.map((c) => (
                      <div key={c.id} className="wr-college-item" onClick={() => selectCollege(c)}>
                        <div>
                          <div className="wr-college-name">{c.name}</div>
                          <div className="wr-college-loc">{c.location}</div>
                        </div>
                        <span className={`wr-badge wr-badge-${(c.type || "").toLowerCase().includes("iit") ? "iit" : (c.type || "").toLowerCase().includes("nit") ? "nit" : (c.type || "").toLowerCase().includes("iiit") ? "iiit" : "default"}`}>
                          {c.type || "University"}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                {showDropdown && collegeResults.length === 0 && collegeSearch.trim() && (
                  <div className="wr-dropdown">
                    <div style={{ padding: "1rem", color: "#aaa", fontSize: "0.88rem" }}>No colleges found. Try a different search.</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 2: VERIFY IDENTITY */}
          {currentStep === 2 && (
            <div>
              <h1 className="wr-h1">Verify your identity</h1>
              <p className="wr-sub">Verified reviews get more visibility and trust</p>
              {user ? (
                <div>
                  <div className="wr-identity-card">
                    {user.avatar
                      ? <img src={user.avatar} alt={user.name} className="wr-avatar" />
                      : <div className="wr-avatar-fallback">{(user.name || "U")[0]}</div>}
                    <div>
                      <div style={{ fontWeight: 700, color: "#222" }}>{user.name}</div>
                      <div style={{ fontSize: "0.85rem", color: "#777" }}>{user.email}</div>
                      <div className="wr-verified-badge">✓ Signed in as verified student</div>
                    </div>
                  </div>
                  <div className="wr-btn-row">
                    <button className="wr-btn wr-btn-ghost" onClick={handleBack}>← Back</button>
                    <button className="wr-btn wr-btn-primary" onClick={handleNext}>Continue →</button>
                  </div>
                </div>
              ) : (
                <div>
                  <p style={{ color: "#555", fontSize: "0.92rem", marginBottom: "1.25rem", lineHeight: 1.7 }}>
                    Sign in with your college Gmail to write a <strong>verified review</strong>.
                  </p>
                  <button className="wr-google-btn" onClick={() => googleLogin()}>
                    <svg width="20" height="20" viewBox="0 0 48 48">
                      <path fill="#EA4335" d="M24 9.5c3.5 0 6.4 1.2 8.8 3.2l6.6-6.6C35.4 2.4 30 0 24 0 14.6 0 6.5 5.5 2.5 13.5l7.7 6C12.4 13.1 17.7 9.5 24 9.5z"/>
                      <path fill="#4285F4" d="M46.5 24.5c0-1.7-.1-3.3-.4-4.9H24v9.3h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 6.9-10.1 6.9-17.4z"/>
                      <path fill="#FBBC05" d="M10.2 28.8a14.7 14.7 0 010-9.6l-7.7-6A24 24 0 000 24c0 3.9.9 7.6 2.5 10.9l7.7-6z"/>
                      <path fill="#34A853" d="M24 48c6 0 11.1-2 14.8-5.4l-7.5-5.8c-2 1.4-4.6 2.2-7.3 2.2-6.3 0-11.6-3.6-13.8-9l-7.7 6C6.5 42.5 14.6 48 24 48z"/>
                    </svg>
                    Sign in with Google
                  </button>
                  <div className="wr-faq">
                    <div className="wr-faq-header" onClick={() => setFaqOpen((v) => !v)}>
                      <span>Why do we require this?</span>
                      <span>{faqOpen ? "▲" : "▼"}</span>
                    </div>
                    {faqOpen && (
                      <div className="wr-faq-body">
                        We only allow reviews from <strong>.ac.in</strong> email addresses to ensure authenticity and prevent fake reviews.
                      </div>
                    )}
                  </div>
                  <p style={{ fontSize: "0.8rem", color: "#bbb", margin: "0.75rem 0 0", textAlign: "center" }}>
                    Reviews without sign-in will not show the 'Verified' badge
                  </p>
                  <div className="wr-btn-row">
                    <button className="wr-btn wr-btn-ghost" onClick={handleBack}>← Back</button>
                    <button
                      className="wr-btn wr-btn-ghost"
                      onClick={() => { setFormData((p) => ({ ...p, isAnonymous: true })); handleNext(); }}
                      style={{ color: "#aaa", fontSize: "0.85rem", padding: "0.875rem 1.25rem" }}
                    >
                      Continue Anonymously
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: RATE */}
          {currentStep === 3 && (
            <div>
              <h1 className="wr-h1">Rate {selectedCollege?.name}</h1>
              <p className="wr-sub">Be honest — your ratings help thousands of students decide</p>
              {RATING_FIELDS.map((field) => (
                <div key={field.key} className="wr-rating-row">
                  <div>
                    <div className="wr-rating-label">{field.label}</div>
                    <div className="wr-rating-desc">{field.desc}</div>
                  </div>
                  <StarRating
                    value={formData.ratings[field.key]}
                    onChange={(v) => setFormData((p) => ({ ...p, ratings: { ...p.ratings, [field.key]: v } }))}
                    interactive
                    size="lg"
                  />
                </div>
              ))}
              {errors.ratings && <p className="wr-error">{errors.ratings}</p>}
              <div className="wr-btn-row">
                <button className="wr-btn wr-btn-ghost" onClick={handleBack}>← Back</button>
                <button className="wr-btn wr-btn-primary" onClick={handleNext}>Next →</button>
              </div>
            </div>
          )}

          {/* STEP 4: TAGS */}
          {currentStep === 4 && (
            <div>
              <h1 className="wr-h1">What best describes this college?</h1>
              <p className="wr-sub">Pick up to 5 tags that match your experience</p>
              <div className="wr-tag-count">{formData.tags.length}/5 selected</div>
              <div className="wr-tags-grid">
                {TAGS.map((tag) => {
                  const active = formData.tags.includes(tag);
                  const maxed = formData.tags.length >= 5 && !active;
                  return (
                    <button key={tag} className={`wr-tag-pill ${active ? "active" : ""} ${maxed ? "disabled" : ""}`} onClick={() => toggleTag(tag)}>
                      {tag}
                    </button>
                  );
                })}
              </div>
              <div className="wr-btn-row">
                <button className="wr-btn wr-btn-ghost" onClick={handleBack}>← Back</button>
                <button className="wr-btn wr-btn-primary" onClick={handleNext} disabled={formData.tags.length === 0}>
                  Next →
                </button>
              </div>
            </div>
          )}

          {/* STEP 5: WRITE */}
          {currentStep === 5 && (
            <div>
              <h1 className="wr-h1">Tell your story</h1>
              <p className="wr-sub">Your honest experience helps future students make better decisions</p>
              <textarea
                className="wr-textarea"
                value={formData.text}
                onChange={(e) => setFormData((p) => ({ ...p, text: e.target.value.slice(0, 2000) }))}
                placeholder="Share your honest experience. What's great? What could be better? What do you wish you knew before joining?"
              />
              <div className={`wr-char-counter ${formData.text.length < 100 ? "warn" : ""}`}>
                {formData.text.length}/2000
                {formData.text.length < 100 && ` — ${100 - formData.text.length} more characters needed`}
              </div>
              <div className="wr-row2" style={{ marginTop: "1.5rem" }}>
                <div>
                  <div className="wr-field-label">Batch Year</div>
                  <select className="wr-select" value={formData.batchYear} onChange={(e) => setFormData((p) => ({ ...p, batchYear: e.target.value }))}>
                    <option value="">Select year</option>
                    {BATCH_YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                <div>
                  <div className="wr-field-label">Branch</div>
                  <select className="wr-select" value={formData.branch} onChange={(e) => setFormData((p) => ({ ...p, branch: e.target.value }))}>
                    <option value="">Select branch</option>
                    {BRANCHES.map((b) => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
              </div>
              <div className="wr-toggle-row">
                <div>
                  <div className="wr-toggle-label">Post anonymously</div>
                  <div className="wr-toggle-sub">Your name will not be shown publicly</div>
                </div>
                <label className="wr-switch">
                  <input type="checkbox" checked={formData.isAnonymous} onChange={(e) => setFormData((p) => ({ ...p, isAnonymous: e.target.checked }))} />
                  <span className="wr-slider"></span>
                </label>
              </div>
              <div className="wr-btn-row">
                <button className="wr-btn wr-btn-ghost" onClick={handleBack}>← Back</button>
                <button
                  className="wr-btn wr-btn-primary"
                  onClick={handleSubmit}
                  disabled={formData.text.length < 100 || !formData.batchYear || !formData.branch || isSubmitting}
                >
                  {isSubmitting ? <><div className="wr-spinner" /> Submitting…</> : "Submit Review ✓"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

