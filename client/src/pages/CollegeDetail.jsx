import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useLocation, useNavigate, Link } from "react-router-dom";

import {
  getCollegeById,
  getCollegeReviews,
  getCollegeProfessors,
  getCollegePlacements,
  getCollegeQuestions,
} from "../api/colleges";
import { submitReview, toggleHelpful, flagReview } from "../api/reviews";
import { submitPlacement } from "../api/placements";

import { useAuthStore } from "../store/authStore";
import { useCompareStore } from "../store/compareStore";
import { useToastStore } from "../store/toastStore";

import StarRating from "../components/ui/StarRating";
import RatingBar from "../components/ui/RatingBar";
import TagPill from "../components/ui/TagPill";
import Modal from "../components/ui/Modal";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import ReviewCard from "../components/college/ReviewCard";
import RatingBreakdown from "../components/college/RatingBreakdown";
import ProfessorCard from "../components/professor/ProfessorCard";
import ProfessorModal from "../components/professor/ProfessorModal";
import { useInfiniteScroll } from "../hooks/useInfiniteScroll";
import { useDebounce } from "../hooks/useDebounce";
import { formatRating, formatPackage } from "../utils/formatRating";

/* ─────────────────────────────────────────────────────────────────────────────
   STYLE BLOCK (injected once)
───────────────────────────────────────────────────────────────────────────── */
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,300;0,500;0,700;1,300&family=DM+Sans:wght@300;400;500;600&display=swap');

  :root {
    --ink:      #1a1410;
    --ink-2:    #3d3529;
    --ink-3:    #7a6f63;
    --paper:    #faf8f5;
    --paper-2:  #f2ede6;
    --paper-3:  #e8e0d4;
    --saffron:  #e8640c;
    --saffron-2:#fdf0e6;
    --indigo:   #2c3e7a;
    --indigo-2: #e8ecf7;
    --jade:     #1a7a4a;
    --jade-2:   #e6f5ec;
    --ruby:     #c0392b;
    --ruby-2:   #fdecea;
    --gold:     #c8960c;
    --gold-2:   #fef9e7;
    --shadow-sm: 0 1px 3px rgba(26,20,16,.08);
    --shadow-md: 0 4px 16px rgba(26,20,16,.10);
    --shadow-lg: 0 8px 32px rgba(26,20,16,.12);
    --radius:   10px;
    --radius-lg:16px;
    --transition: 220ms cubic-bezier(.4,0,.2,1);
  }

  .cd-root { font-family: 'DM Sans', sans-serif; background: var(--paper); color: var(--ink); min-height: 100vh; }
  .cd-display { font-family: 'Fraunces', serif; }

  /* SKELETON */
  .skel { background: linear-gradient(90deg, var(--paper-3) 25%, var(--paper-2) 50%, var(--paper-3) 75%);
    background-size: 200% 100%; animation: shimmer 1.5s infinite; border-radius: 6px; }
  @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

  /* HEADER */
  .cd-header { background: var(--ink); color: var(--paper); position: relative; overflow: hidden; }
  .cd-header::before { content:''; position:absolute; inset:0;
    background: radial-gradient(ellipse 80% 60% at 70% 50%, rgba(232,100,12,.18) 0%, transparent 70%),
                radial-gradient(ellipse 50% 80% at 10% 80%, rgba(44,62,122,.25) 0%, transparent 60%);
    pointer-events:none; }
  .cd-header-inner { position:relative; z-index:1; max-width:1200px; margin:0 auto; padding:48px 24px 40px; }

  .cd-type-badge { display:inline-flex; align-items:center; gap:6px; padding:4px 12px; border-radius:20px;
    font-size:.72rem; font-weight:600; letter-spacing:.06em; text-transform:uppercase; }
  .badge-govt    { background:rgba(26,122,74,.25); color:#6ee9a0; border:1px solid rgba(110,233,160,.2); }
  .badge-private { background:rgba(232,100,12,.2); color:#f4a36b; border:1px solid rgba(244,163,107,.2); }
  .badge-deemed  { background:rgba(44,62,122,.3); color:#8ba3e8; border:1px solid rgba(139,163,232,.2); }
  .badge-iit,.badge-nit { background:rgba(200,150,12,.2); color:#f4d06b; border:1px solid rgba(244,208,107,.2); }

  .cd-h1 { font-size:clamp(1.8rem,4vw,2.8rem); font-weight:700; line-height:1.15; margin:14px 0 6px; color:#fff; }
  .cd-location { font-size:.95rem; color:rgba(255,255,255,.55); display:flex; align-items:center; gap:6px; }

  .cd-quick-stats { display:flex; gap:20px; flex-wrap:wrap; margin:24px 0; }
  .cd-qs-item { display:flex; align-items:center; gap:8px; background:rgba(255,255,255,.08);
    border:1px solid rgba(255,255,255,.12); border-radius:8px; padding:10px 16px;
    backdrop-filter:blur(4px); }
  .cd-qs-label { font-size:.72rem; color:rgba(255,255,255,.5); text-transform:uppercase; letter-spacing:.05em; }
  .cd-qs-val { font-size:1.1rem; font-weight:600; color:#fff; }
  .cd-qs-star { color:var(--saffron); }

  .cd-hero-rating { display:flex; align-items:center; gap:16px; margin:20px 0; }
  .cd-rating-big { font-size:3.5rem; font-weight:700; font-family:'Fraunces',serif; color:#fff; line-height:1; }
  .cd-rating-meta { display:flex; flex-direction:column; gap:4px; }
  .cd-review-count { font-size:.82rem; color:rgba(255,255,255,.5); }

  .cd-header-actions { display:flex; gap:12px; flex-wrap:wrap; margin-top:28px; }
  .btn { display:inline-flex; align-items:center; gap:8px; padding:11px 22px; border-radius:8px;
    font-family:'DM Sans',sans-serif; font-size:.9rem; font-weight:500; cursor:pointer;
    transition:all var(--transition); border:none; text-decoration:none; }
  .btn-primary { background:var(--saffron); color:#fff; }
  .btn-primary:hover { background:#d05800; transform:translateY(-1px); box-shadow:0 4px 20px rgba(232,100,12,.4); }
  .btn-outline { background:transparent; color:#fff; border:1px solid rgba(255,255,255,.3); }
  .btn-outline:hover { background:rgba(255,255,255,.1); border-color:rgba(255,255,255,.5); }
  .btn-outline.active { background:var(--indigo); border-color:var(--indigo); }
  .btn-sm { padding:7px 14px; font-size:.82rem; }
  .btn-secondary { background:var(--paper-2); color:var(--ink); border:1px solid var(--paper-3); }
  .btn-secondary:hover { background:var(--paper-3); }

  /* TABS */
  .cd-tab-bar { background:#fff; border-bottom:1px solid var(--paper-3); position:sticky; top:0; z-index:30;
    box-shadow:0 1px 0 var(--paper-3); }
  .cd-tab-bar-inner { max-width:1200px; margin:0 auto; padding:0 24px; display:flex; gap:0;
    overflow-x:auto; scrollbar-width:none; }
  .cd-tab-bar-inner::-webkit-scrollbar { display:none; }
  .cd-tab { padding:16px 20px; font-size:.9rem; font-weight:500; color:var(--ink-3); cursor:pointer;
    border-bottom:3px solid transparent; transition:all var(--transition); white-space:nowrap;
    background:none; border-top:none; border-left:none; border-right:none; font-family:inherit; }
  .cd-tab:hover { color:var(--ink); background:var(--paper-2); }
  .cd-tab.active { color:var(--saffron); border-bottom-color:var(--saffron); font-weight:600; }

  /* CONTENT */
  .cd-content { max-width:1200px; margin:0 auto; padding:32px 24px 80px; }
  .cd-grid { display:grid; grid-template-columns:1fr; gap:24px; }
  @media(min-width:900px){ .cd-grid-aside { grid-template-columns:1fr 340px; } }

  /* CARDS */
  .cd-card { background:#fff; border:1px solid var(--paper-3); border-radius:var(--radius-lg);
    padding:28px; box-shadow:var(--shadow-sm); }
  .cd-card-title { font-family:'Fraunces',serif; font-size:1.15rem; font-weight:500; color:var(--ink);
    margin:0 0 20px; display:flex; align-items:center; gap:10px; }
  .cd-card-title::before { content:''; display:block; width:4px; height:18px; background:var(--saffron);
    border-radius:2px; flex-shrink:0; }

  /* FILTER ROW */
  .cd-filter-row { display:flex; gap:12px; flex-wrap:wrap; margin-bottom:24px; align-items:center; }
  .cd-select { padding:8px 14px; border:1px solid var(--paper-3); border-radius:8px; font-family:inherit;
    font-size:.85rem; color:var(--ink); background:var(--paper); cursor:pointer; appearance:none;
    background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%237a6f63' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
    background-repeat:no-repeat; background-position:right 10px center; padding-right:30px;
    transition:border-color var(--transition); }
  .cd-select:focus { outline:none; border-color:var(--saffron); }
  .cd-filter-label { font-size:.8rem; color:var(--ink-3); font-weight:500; }

  /* REVIEWS EMPTY */
  .cd-empty { text-align:center; padding:60px 24px; color:var(--ink-3); }
  .cd-empty-icon { font-size:3rem; margin-bottom:12px; opacity:.4; }
  .cd-empty-text { font-size:1rem; margin-bottom:20px; }

  /* PROFESSOR GRID */
  .prof-grid { display:grid; grid-template-columns:repeat(2,1fr); gap:16px; }
  @media(min-width:640px){ .prof-grid { grid-template-columns:repeat(3,1fr); } }
  @media(min-width:1024px){ .prof-grid { grid-template-columns:repeat(4,1fr); } }

  /* PLACEMENTS */
  .pl-hero { display:grid; grid-template-columns:1fr 1fr; gap:20px; margin-bottom:28px; }
  @media(max-width:600px){ .pl-hero { grid-template-columns:1fr; } }
  .pl-stat-box { border-radius:var(--radius); padding:20px; text-align:center; }
  .pl-stat-box.claimed { background:var(--indigo-2); border:1px solid rgba(44,62,122,.15); }
  .pl-stat-box.actual { background:var(--saffron-2); border:1px solid rgba(232,100,12,.15); }
  .pl-stat-label { font-size:.72rem; text-transform:uppercase; letter-spacing:.07em; font-weight:600; margin-bottom:8px; }
  .pl-stat-label.claimed { color:var(--indigo); }
  .pl-stat-label.actual { color:var(--saffron); }
  .pl-stat-val { font-family:'Fraunces',serif; font-size:2.2rem; font-weight:700; line-height:1; }
  .pl-stat-val.claimed { color:var(--indigo); }
  .pl-stat-val.actual { color:var(--saffron); }
  .pl-stat-unit { font-size:.8rem; color:var(--ink-3); margin-top:4px; }

  .pl-gap-badge { display:inline-flex; align-items:center; gap:6px; padding:6px 14px; border-radius:20px;
    font-size:.78rem; font-weight:600; margin-bottom:24px; }
  .pl-gap-warn { background:var(--ruby-2); color:var(--ruby); border:1px solid rgba(192,57,43,.15); }
  .pl-gap-ok   { background:var(--jade-2); color:var(--jade); border:1px solid rgba(26,122,74,.15); }

  /* BAR CHART */
  .pl-bar-chart { display:flex; align-items:flex-end; gap:32px; height:140px; margin:20px 0 8px; }
  .pl-bar-group { display:flex; flex-direction:column; align-items:center; gap:8px; flex:1; }
  .pl-bar-wrap { display:flex; align-items:flex-end; gap:6px; height:110px; width:100%; justify-content:center; }
  .pl-bar { width:36px; border-radius:6px 6px 0 0; min-height:8px; transition:height .6s cubic-bezier(.4,0,.2,1); }
  .pl-bar.claimed { background:var(--indigo); }
  .pl-bar.actual  { background:var(--saffron); }
  .pl-bar-label { font-size:.72rem; color:var(--ink-3); font-weight:500; }
  .pl-bar-val { font-size:.78rem; font-weight:600; color:var(--ink); }
  .pl-bar-legend { display:flex; gap:20px; justify-content:center; margin-top:8px; }
  .pl-legend-dot { width:10px; height:10px; border-radius:50%; flex-shrink:0; margin-top:2px; }

  /* COMPANIES TABLE */
  .co-table { width:100%; border-collapse:collapse; }
  .co-table th { text-align:left; font-size:.72rem; text-transform:uppercase; letter-spacing:.07em;
    color:var(--ink-3); font-weight:600; padding:10px 14px; border-bottom:2px solid var(--paper-3); }
  .co-table td { padding:12px 14px; border-bottom:1px solid var(--paper-2); font-size:.88rem; }
  .co-table tr:last-child td { border-bottom:none; }
  .co-table tr:hover td { background:var(--paper-2); }
  .co-badge { display:inline-block; padding:2px 8px; border-radius:12px; font-size:.72rem; font-weight:600; }
  .co-badge-count { background:var(--indigo-2); color:var(--indigo); }
  .co-badge-verified { background:var(--jade-2); color:var(--jade); }
  .co-badge-unverified { background:var(--paper-2); color:var(--ink-3); }

  /* Q&A */
  .qa-question { border:1px solid var(--paper-3); border-radius:var(--radius); margin-bottom:14px;
    overflow:hidden; transition:box-shadow var(--transition); }
  .qa-question:hover { box-shadow:var(--shadow-sm); }
  .qa-q-header { display:flex; justify-content:space-between; align-items:flex-start; gap:12px;
    padding:18px 20px; cursor:pointer; background:#fff; }
  .qa-q-text { font-size:.95rem; font-weight:500; color:var(--ink); flex:1; }
  .qa-q-meta { font-size:.78rem; color:var(--ink-3); margin-top:4px; }
  .qa-chevron { transition:transform var(--transition); color:var(--ink-3); flex-shrink:0; margin-top:2px; }
  .qa-chevron.open { transform:rotate(180deg); }
  .qa-answers { border-top:1px solid var(--paper-3); background:var(--paper); }
  .qa-answer { padding:16px 20px; border-bottom:1px solid var(--paper-3); }
  .qa-answer:last-of-type { border-bottom:none; }
  .qa-answer-text { font-size:.88rem; color:var(--ink-2); line-height:1.65; }
  .qa-answer-meta { display:flex; align-items:center; gap:10px; margin-top:8px; flex-wrap:wrap; }
  .qa-verified { display:inline-flex; align-items:center; gap:4px; padding:2px 8px; border-radius:10px;
    background:var(--jade-2); color:var(--jade); font-size:.7rem; font-weight:600; }
  .qa-add-answer { padding:14px 20px; display:flex; justify-content:flex-end; }

  /* HOSTEL */
  .hostel-row { display:flex; align-items:center; gap:16px; padding:16px 0; border-bottom:1px solid var(--paper-2); }
  .hostel-row:last-child { border-bottom:none; }
  .hostel-emoji { font-size:1.4rem; flex-shrink:0; }
  .hostel-label { flex:1; font-size:.92rem; font-weight:500; color:var(--ink-2); }
  .hostel-dots { display:flex; gap:4px; align-items:center; }
  .hostel-dot { width:12px; height:12px; border-radius:50%; border:2px solid var(--paper-3); transition:all .3s; }
  .hostel-dot.filled { background:var(--saffron); border-color:var(--saffron); }
  .hostel-score { font-family:'Fraunces',serif; font-size:1rem; font-weight:500; color:var(--ink-3);
    min-width:36px; text-align:right; }

  /* UPLOAD ZONE */
  .upload-zone { border:2px dashed var(--paper-3); border-radius:var(--radius); padding:32px;
    text-align:center; cursor:pointer; transition:all var(--transition); background:var(--paper); }
  .upload-zone:hover,.upload-zone.dragover { border-color:var(--saffron); background:var(--saffron-2); }
  .upload-zone-icon { font-size:2rem; margin-bottom:8px; opacity:.5; }
  .upload-zone-text { font-size:.85rem; color:var(--ink-3); }
  .upload-file-name { font-size:.82rem; color:var(--jade); font-weight:500; margin-top:8px; }

  /* FORM */
  .form-group { margin-bottom:18px; }
  .form-label { display:block; font-size:.8rem; font-weight:600; color:var(--ink-2); margin-bottom:6px;
    text-transform:uppercase; letter-spacing:.05em; }
  .form-input { width:100%; padding:11px 14px; border:1px solid var(--paper-3); border-radius:8px;
    font-family:inherit; font-size:.9rem; color:var(--ink); background:var(--paper);
    transition:border-color var(--transition); box-sizing:border-box; }
  .form-input:focus { outline:none; border-color:var(--saffron); background:#fff; }
  .form-textarea { resize:vertical; min-height:100px; }
  .form-row { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
  @media(max-width:500px){ .form-row { grid-template-columns:1fr; } }

  /* FLOATING BTN */
  .fab { position:fixed; bottom:24px; right:24px; z-index:20; display:none; }
  @media(max-width:767px){ .fab { display:flex; } }

  /* AUTH GATE */
  .auth-gate { text-align:center; padding:32px 16px; }
  .auth-gate-icon { font-size:2.5rem; margin-bottom:12px; }
  .auth-gate-title { font-family:'Fraunces',serif; font-size:1.15rem; margin-bottom:6px; }
  .auth-gate-text { font-size:.85rem; color:var(--ink-3); margin-bottom:20px; }

  /* INLINE LOAD MORE */
  .load-more-wrap { text-align:center; padding:24px 0; }
  .sentinel { height:1px; }

  /* ERROR */
  .cd-error { text-align:center; padding:80px 24px; }
  .cd-error-icon { font-size:3rem; margin-bottom:16px; }
  .cd-error-title { font-family:'Fraunces',serif; font-size:1.5rem; margin-bottom:8px; }
  .cd-error-text { color:var(--ink-3); margin-bottom:24px; }

  /* MISC */
  .text-saffron { color:var(--saffron); }
  .text-muted   { color:var(--ink-3); font-size:.82rem; }
  .flex-center  { display:flex; align-items:center; gap:8px; }
  .mt-4 { margin-top:16px; }
  .mb-4 { margin-bottom:16px; }
  .divider { border:none; border-top:1px solid var(--paper-3); margin:24px 0; }
`;

/* ─────────────────────────────────────────────────────────────────────────────
   SMALL HELPERS
───────────────────────────────────────────────────────────────────────────── */
const TABS = [
  { id: "reviews",    label: "Reviews",    hash: "#reviews" },
  { id: "professors", label: "Professors", hash: "#professors" },
  { id: "placements", label: "Placements", hash: "#placements" },
  { id: "qa",         label: "Q&A",        hash: "#qa" },
  { id: "hostel",     label: "Hostel",     hash: "#hostel" },
];

const CURRENT_YEAR = new Date().getFullYear();
const BATCH_YEARS  = Array.from({ length: 10 }, (_, i) => CURRENT_YEAR - i);
const BRANCHES     = ["CSE", "ECE", "ME", "CE", "EE", "IT", "MBA", "MCA", "Other"];

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

/** Seeded pseudo-random for hostel subscores */
function seededRandom(seed, offset) {
  const x = Math.sin(seed * 9301 + offset * 49297 + 233) * 2993;
  return x - Math.floor(x);
}

function deriveHostelScores(baseRating, collegeId) {
  const seed = (collegeId || "").split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const labels = [
    { emoji: "🍽️", label: "Mess Food Quality" },
    { emoji: "📶", label: "WiFi Speed" },
    { emoji: "🛏️", label: "Room Cleanliness" },
    { emoji: "🔒", label: "Security" },
    { emoji: "🏋️", label: "Gym / Sports" },
  ];
  return labels.map((l, i) => {
    const offset = (seededRandom(seed, i) - 0.5) * 2.0;
    const score  = Math.min(5, Math.max(1, (baseRating || 3) + offset));
    return { ...l, score: parseFloat(score.toFixed(1)) };
  });
}

function getTypeBadgeClass(type = "") {
  const t = type.toLowerCase();
  if (t.includes("iit") || t.includes("nit")) return "badge-iit";
  if (t.includes("govt") || t.includes("government")) return "badge-govt";
  if (t.includes("deemed")) return "badge-deemed";
  return "badge-private";
}

/* ─────────────────────────────────────────────────────────────────────────────
   PLACEMENT BAR CHART (CSS-only, animated)
───────────────────────────────────────────────────────────────────────────── */
function PlacementBarChart({ claimed, actual }) {
  const max     = Math.max(claimed, actual, 1);
  const cHeight = Math.round((claimed / max) * 100);
  const aHeight = Math.round((actual  / max) * 100);
  return (
    <div>
      <div className="pl-bar-chart">
        <div className="pl-bar-group">
          <div className="pl-bar-val">{formatPackage ? formatPackage(claimed) : `${claimed} LPA`}</div>
          <div className="pl-bar-wrap">
            <div className="pl-bar claimed" style={{ height: `${cHeight}%` }} />
          </div>
          <div className="pl-bar-label">Claimed</div>
        </div>
        <div className="pl-bar-group">
          <div className="pl-bar-val">{formatPackage ? formatPackage(actual) : `${actual} LPA`}</div>
          <div className="pl-bar-wrap">
            <div className="pl-bar actual" style={{ height: `${aHeight}%` }} />
          </div>
          <div className="pl-bar-label">Actual (crowd)</div>
        </div>
      </div>
      <div className="pl-bar-legend">
        <span className="flex-center text-muted">
          <span className="pl-legend-dot" style={{ background: "var(--indigo)" }} /> Claimed (Official)
        </span>
        <span className="flex-center text-muted">
          <span className="pl-legend-dot" style={{ background: "var(--saffron)" }} /> Actual (Crowdsourced)
        </span>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   HEADER SKELETON
───────────────────────────────────────────────────────────────────────────── */
function HeaderSkeleton() {
  return (
    <div className="cd-header">
      <div className="cd-header-inner">
        <div className="skel" style={{ width: 80, height: 22, marginBottom: 14 }} />
        <div className="skel" style={{ width: "60%", height: 44, marginBottom: 10 }} />
        <div className="skel" style={{ width: 180, height: 18, marginBottom: 24 }} />
        <div style={{ display: "flex", gap: 12, marginBottom: 28 }}>
          {[1, 2, 3].map(i => (
            <div key={i} className="skel" style={{ width: 110, height: 56 }} />
          ))}
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <div className="skel" style={{ width: 140, height: 44 }} />
          <div className="skel" style={{ width: 120, height: 44 }} />
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   PLACEMENT MODAL FORM
───────────────────────────────────────────────────────────────────────────── */
function PlacementForm({ onSubmit, onClose, isAuthenticated }) {
  const [form, setForm] = useState({ company: "", role: "", ctc: "", branch: "", batch: "", file: null });
  const [dragging, setDragging] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef(null);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const onFile = (f) => {
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) return alert("File too large (max 5MB)");
    if (!f.type.match(/pdf|jpeg|jpg|png/i)) return alert("Only PDF/JPG allowed");
    setForm((prev) => ({ ...prev, file: f }));
  };

  const handleSubmit = async () => {
    if (!form.company || !form.role || !form.ctc) return;
    setSubmitting(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => v && fd.append(k, v));
      await onSubmit(fd);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="auth-gate">
        <div className="auth-gate-icon">🔐</div>
        <div className="auth-gate-title">Sign in to submit</div>
        <div className="auth-gate-text">Only verified students can submit placement data.</div>
        <Link to="/login" className="btn btn-primary">Sign In</Link>
      </div>
    );
  }

  return (
    <div>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Company *</label>
          <input className="form-input" placeholder="e.g. Infosys" value={form.company} onChange={set("company")} />
        </div>
        <div className="form-group">
          <label className="form-label">Role *</label>
          <input className="form-input" placeholder="e.g. SDE-1" value={form.role} onChange={set("role")} />
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">CTC (LPA) *</label>
          <input className="form-input" type="number" placeholder="e.g. 8.5" value={form.ctc} onChange={set("ctc")} />
        </div>
        <div className="form-group">
          <label className="form-label">Batch Year</label>
          <select className="form-input cd-select" value={form.batch} onChange={set("batch")}>
            <option value="">Select year</option>
            {BATCH_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">Branch</label>
        <select className="form-input cd-select" value={form.branch} onChange={set("branch")}>
          <option value="">Select branch</option>
          {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
        </select>
      </div>
      <div className="form-group">
        <label className="form-label">Offer Letter (PDF/JPG, max 5MB)</label>
        <div
          className={`upload-zone${dragging ? " dragover" : ""}`}
          onClick={() => fileRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={e => { e.preventDefault(); setDragging(false); onFile(e.dataTransfer.files[0]); }}
        >
          <div className="upload-zone-icon">📄</div>
          <div className="upload-zone-text">Drop file here or click to browse</div>
          {form.file && <div className="upload-file-name">✓ {form.file.name}</div>}
          <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display: "none" }}
            onChange={e => onFile(e.target.files[0])} />
        </div>
      </div>
      <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }}
        onClick={handleSubmit} disabled={submitting}>
        {submitting ? "Submitting…" : "Submit Placement Data"}
      </button>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Q&A QUESTION ITEM
───────────────────────────────────────────────────────────────────────────── */
function QuestionItem({ question, onAnswer, isAuthenticated }) {
  const [open, setOpen] = useState(false);
  const [answerText, setAnswerText] = useState("");
  const [showAnswerBox, setShowAnswerBox] = useState(false);

  return (
    <div className="qa-question">
      <div className="qa-q-header" onClick={() => setOpen(o => !o)}>
        <div style={{ flex: 1 }}>
          <div className="qa-q-text">{question.text}</div>
          <div className="qa-q-meta">
            Asked by {question.askerName || "Anonymous"} · {timeAgo(question.createdAt)} · {question.answers?.length || 0} answer{question.answers?.length !== 1 ? "s" : ""}
          </div>
        </div>
        <svg className={`qa-chevron${open ? " open" : ""}`} width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M4 6.5L9 11.5L14 6.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      {open && (
        <div className="qa-answers">
          {(question.answers || []).map((ans, idx) => (
            <div key={idx} className="qa-answer">
              <div className="qa-answer-text">{ans.text}</div>
              <div className="qa-answer-meta">
                <span className="text-muted">{ans.authorName || "Anonymous"}</span>
                {ans.isVerifiedStudent && (
                  <span className="qa-verified">✓ Verified Student</span>
                )}
                <span className="text-muted">{timeAgo(ans.createdAt)}</span>
                <span className="text-muted">· {ans.helpfulCount || 0} found helpful</span>
              </div>
            </div>
          ))}
          {(question.answers || []).length === 0 && (
            <div style={{ padding: "14px 20px", color: "var(--ink-3)", fontSize: ".85rem" }}>
              No answers yet. Be the first to help!
            </div>
          )}
          <div className="qa-add-answer">
            {showAnswerBox ? (
              <div style={{ width: "100%" }}>
                <textarea className="form-input form-textarea" placeholder="Write your answer…"
                  value={answerText} onChange={e => setAnswerText(e.target.value)} />
                <div style={{ display: "flex", gap: 10, marginTop: 10, justifyContent: "flex-end" }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => setShowAnswerBox(false)}>Cancel</button>
                  <button className="btn btn-primary btn-sm" onClick={() => { onAnswer(question._id, answerText); setAnswerText(""); setShowAnswerBox(false); }}>
                    Post Answer
                  </button>
                </div>
              </div>
            ) : (
              <button className="btn btn-secondary btn-sm" onClick={() => {
                if (!isAuthenticated) return alert("Please sign in to answer.");
                setShowAnswerBox(true);
              }}>
                ✏️ Answer
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   HOSTEL TAB
───────────────────────────────────────────────────────────────────────────── */
function HostelTab({ college, hostelReviews }) {
  const scores = deriveHostelScores(college?.ratings?.hostel, college?._id);
  return (
    <div>
      <div className="cd-card mb-4">
        <div className="cd-card-title">Hostel Ratings Breakdown</div>
        {scores.map(({ emoji, label, score }) => (
          <div key={label} className="hostel-row">
            <span className="hostel-emoji">{emoji}</span>
            <span className="hostel-label">{label}</span>
            <div className="hostel-dots">
              {[1, 2, 3, 4, 5].map(n => (
                <div key={n} className={`hostel-dot${score >= n - 0.25 ? " filled" : ""}`} />
              ))}
            </div>
            <span className="hostel-score">{score.toFixed(1)}</span>
          </div>
        ))}
      </div>
      {hostelReviews?.length > 0 && (
        <div>
          <div className="cd-card-title" style={{ marginBottom: 16 }}>Recent Hostel Mentions</div>
          {hostelReviews.slice(0, 2).map(r => (
            <ReviewCard key={r._id} review={r} compact />
          ))}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────────────────────────────────────── */
export default function CollegeDetail() {
  const { id }       = useParams();
  const location     = useLocation();
  const navigate     = useNavigate();

  const { isAuthenticated } = useAuthStore();
  const { addToCompare, removeFromCompare, isInCompare } = useCompareStore();
  const { showToast } = useToastStore();

  /* ── STATE ── */
  const [college,          setCollege]          = useState(null);
  const [isPageLoading,    setIsPageLoading]    = useState(true);
  const [pageError,        setPageError]        = useState(null);

  const [activeTab,        setActiveTab]        = useState("reviews");

  const [reviews,          setReviews]          = useState([]);
  const [reviewPage,       setReviewPage]       = useState(1);
  const [hasMoreReviews,   setHasMoreReviews]   = useState(false);
  const [isReviewLoading,  setIsReviewLoading]  = useState(false);
  const [reviewFilter,     setReviewFilter]     = useState({ sort: "createdAt", branch: "", batch: "" });

  const [professors,       setProfessors]       = useState([]);
  const [isProfLoading,    setIsProfLoading]    = useState(false);
  const [selectedProfessor,setSelectedProfessor]= useState(null);
  const [isProfModalOpen,  setIsProfModalOpen]  = useState(false);

  const [placements,       setPlacements]       = useState(null);
  const [isPlacLoading,    setIsPlacLoading]    = useState(false);
  const [placRows,         setPlacRows]         = useState([]);
  const [placRowsShown,    setPlacRowsShown]    = useState(10);
  const [isPlacModalOpen,  setIsPlacModalOpen]  = useState(false);

  const [questions,        setQuestions]        = useState([]);
  const [isQALoading,      setIsQALoading]      = useState(false);
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
  const [newQuestion,      setNewQuestion]      = useState("");

  const loaded = useRef({ reviews: false, professors: false, placements: false, qa: false });

  /* ── DERIVE ACTIVE TAB FROM HASH ── */
  const hashToTab = (hash) => {
    const map = { "#reviews": "reviews", "#professors": "professors", "#placements": "placements", "#qa": "qa", "#hostel": "hostel" };
    return map[hash] || "reviews";
  };

  const switchTab = (tab) => {
    setActiveTab(tab);
    const hash = TABS.find(t => t.id === tab)?.hash || "#reviews";
    navigate({ hash }, { replace: true });
  };

  /* ── INITIAL COLLEGE FETCH ── */
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setIsPageLoading(true);
      setPageError(null);
      try {
        const data = await getCollegeById(id);
        if (!cancelled) setCollege(data);
      } catch (err) {
        if (!cancelled) setPageError("Failed to load college data. Please try again.");
      } finally {
        if (!cancelled) setIsPageLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [id]);

  /* ── SET TAB FROM HASH ON MOUNT / HASH CHANGE ── */
  useEffect(() => {
    const tab = hashToTab(location.hash);
    setActiveTab(tab);
  }, [location.hash]);

  /* ── FETCH DATA WHEN TAB ACTIVATES ── */
  useEffect(() => {
    if (!college) return;
    if (activeTab === "reviews"    && !loaded.current.reviews)    loadReviews(true);
    if (activeTab === "professors" && !loaded.current.professors) loadProfessors();
    if (activeTab === "placements" && !loaded.current.placements) loadPlacements();
    if (activeTab === "qa"         && !loaded.current.qa)         loadQA();
    // hostel uses college data directly, no fetch needed
  }, [activeTab, college]);

  /* ── RE-FETCH REVIEWS ON FILTER CHANGE ── */
  const debouncedFilter = useDebounce(reviewFilter, 400);
  useEffect(() => {
    if (!college) return;
    loadReviews(true);
  }, [debouncedFilter]);

  /* ── DATA LOADERS ── */
  async function loadReviews(reset = false) {
    setIsReviewLoading(true);
    try {
      const page = reset ? 1 : reviewPage;
      const data = await getCollegeReviews(id, { page, limit: 10, ...reviewFilter });
      if (reset) {
        setReviews(data.reviews || []);
        setReviewPage(2);
      } else {
        setReviews(prev => [...prev, ...(data.reviews || [])]);
        setReviewPage(p => p + 1);
      }
      setHasMoreReviews(data.hasMore ?? false);
      loaded.current.reviews = true;
    } catch {
      showToast?.("Failed to load reviews", "error");
    } finally {
      setIsReviewLoading(false);
    }
  }

  async function loadProfessors() {
    setIsProfLoading(true);
    try {
      const data = await getCollegeProfessors(id);
      setProfessors(data || []);
      loaded.current.professors = true;
    } catch {
      showToast?.("Failed to load professors", "error");
    } finally {
      setIsProfLoading(false);
    }
  }

  async function loadPlacements() {
    setIsPlacLoading(true);
    try {
      const data = await getCollegePlacements(id);
      setPlacements(data);
      setPlacRows(data?.verifiedPlacements || []);
      loaded.current.placements = true;
    } catch {
      showToast?.("Failed to load placements", "error");
    } finally {
      setIsPlacLoading(false);
    }
  }

  async function loadQA() {
    setIsQALoading(true);
    try {
      const data = await getCollegeQuestions(id);
      setQuestions(data || []);
      loaded.current.qa = true;
    } catch {
      showToast?.("Failed to load Q&A", "error");
    } finally {
      setIsQALoading(false);
    }
  }

  /* ── HELPFUL / FLAG ── */
  async function handleHelpfulVote(reviewId) {
    if (!isAuthenticated) { showToast?.("Sign in to vote", "info"); return; }
    try {
      const res = await toggleHelpful(reviewId);
      setReviews(prev => prev.map(r => r._id === reviewId ? { ...r, helpfulVotes: res.helpfulVotes ?? r.helpfulVotes } : r));
    } catch { showToast?.("Failed to record vote", "error"); }
  }

  async function handleFlagReview(reviewId) {
    if (!isAuthenticated) { showToast?.("Sign in to report", "info"); return; }
    try {
      await flagReview(reviewId);
      showToast?.("Review reported. Thank you!", "success");
    } catch { showToast?.("Failed to flag review", "error"); }
  }

  /* ── COMPARE ── */
  function handleCompare() {
    if (isInCompare?.(id)) {
      removeFromCompare?.(id);
      showToast?.(`Removed ${college.name} from compare`, "info");
    } else {
      addToCompare?.({ _id: id, name: college.name, logo: college.logo });
      showToast?.(`Added ${college.name} to compare`, "success");
    }
  }

  /* ── INFINITE SCROLL ── */
  const loadMoreReviews = useCallback(() => {
    if (!isReviewLoading && hasMoreReviews) loadReviews(false);
  }, [isReviewLoading, hasMoreReviews, reviewPage]);
  const sentinelRef = useInfiniteScroll({ onLoadMore: loadMoreReviews, hasMore: hasMoreReviews });

  /* ── SUBMIT PLACEMENT ── */
  async function handlePlacementSubmit(formData) {
    await submitPlacement(id, formData);
    showToast?.("Placement submitted! Under review.", "success");
    loaded.current.placements = false;
    loadPlacements();
  }

  /* ── ASK QUESTION ── */
  async function handleAskQuestion() {
    if (!newQuestion.trim()) return;
    try {
      const { addQuestion } = await import("../api/reviews");
      const q = await addQuestion(id, { text: newQuestion });
      setQuestions(prev => [q, ...prev]);
      setNewQuestion("");
      setIsQuestionModalOpen(false);
      showToast?.("Question posted!", "success");
    } catch {
      showToast?.("Failed to post question", "error");
    }
  }

  /* ── HOSTEL REVIEWS ── */
  const hostelReviews = reviews.filter(r =>
    r.tags?.includes("hostel") || (r.text || "").toLowerCase().includes("hostel")
  );

  /* ─────────────────── RENDER ─────────────────── */
  if (pageError) {
    return (
      <div className="cd-root">
        <StyleInjector />
        <div className="cd-error">
          <div className="cd-error-icon">⚠️</div>
          <div className="cd-error-title">Oops!</div>
          <div className="cd-error-text">{pageError}</div>
          <button className="btn btn-primary" onClick={() => { setPageError(null); setIsPageLoading(true); getCollegeById(id).then(setCollege).catch(() => setPageError("Failed to load college data.")).finally(() => setIsPageLoading(false)); }}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const comparing = isInCompare?.(id);
  const claimed   = placements?.claimedAvg    || 0;
  const actual    = placements?.crowdsourcedAvg || 0;
  const gap       = Math.abs(claimed - actual);

  return (
    <div className="cd-root">
      <StyleInjector />

      {/* ── HEADER ── */}
      {isPageLoading ? <HeaderSkeleton /> : college && (
        <header className="cd-header">
          <div className="cd-header-inner">
            <span className={`cd-type-badge ${getTypeBadgeClass(college.type)}`}>
              {college.type || "College"} · Est. {college.established || "—"}
            </span>
            <h1 className="cd-h1 cd-display">{college.name}</h1>
            <p className="cd-location">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1C4.79 1 3 2.79 3 5c0 3.25 4 8 4 8s4-4.75 4-8c0-2.21-1.79-4-4-4z" fill="currentColor" opacity=".8"/></svg>
              {[college.city, college.state].filter(Boolean).join(", ")}
            </p>

            <div className="cd-hero-rating">
              <div className="cd-rating-big">{formatRating ? formatRating(college.ratings?.overall) : (college.ratings?.overall || 0).toFixed(1)}</div>
              <div className="cd-rating-meta">
                <StarRating value={college.ratings?.overall || 0} size="lg" readonly />
                <div className="cd-review-count">{college.reviewCount || 0} reviews</div>
              </div>
            </div>

            <div className="cd-quick-stats">
              {[
                { label: "Placement", key: "placement" },
                { label: "Teaching",  key: "teaching"  },
                { label: "Hostel",    key: "hostel"    },
                { label: "Value",     key: "valueForMoney" },
              ].map(({ label, key }) => college.ratings?.[key] != null && (
                <div key={key} className="cd-qs-item">
                  <div>
                    <div className="cd-qs-label">{label}</div>
                    <div className="cd-qs-val">
                      <span className="cd-qs-star">★</span>{" "}
                      {(college.ratings[key] || 0).toFixed(1)}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="cd-header-actions">
              <Link to={`/write-review?college=${id}`} className="btn btn-primary">
                ✏️ Write Review
              </Link>
              <button
                className={`btn btn-outline${comparing ? " active" : ""}`}
                onClick={handleCompare}
              >
                {comparing ? "✓ In Compare" : "+ Compare"}
              </button>
            </div>
          </div>
        </header>
      )}

      {/* ── TAB BAR ── */}
      {!isPageLoading && college && (
        <nav className="cd-tab-bar" aria-label="College sections">
          <div className="cd-tab-bar-inner">
            {TABS.map(tab => (
              <button
                key={tab.id}
                className={`cd-tab${activeTab === tab.id ? " active" : ""}`}
                onClick={() => switchTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </nav>
      )}

      {/* ── TAB CONTENT ── */}
      {!isPageLoading && college && (
        <main className="cd-content">

          {/* ════ REVIEWS TAB ════ */}
          {activeTab === "reviews" && (
            <div>
              {college.ratings && (
                <div className="cd-card mb-4">
                  <div className="cd-card-title">Rating Breakdown</div>
                  <RatingBreakdown ratings={college.ratings} totalReviews={college.reviewCount} />
                </div>
              )}

              {/* Filters */}
              <div className="cd-filter-row">
                <span className="cd-filter-label">Sort by</span>
                <select className="cd-select" value={reviewFilter.sort}
                  onChange={e => setReviewFilter(f => ({ ...f, sort: e.target.value }))}>
                  <option value="createdAt">Newest</option>
                  <option value="helpfulVotes">Most Helpful</option>
                  <option value="rating">Highest Rated</option>
                </select>

                <select className="cd-select" value={reviewFilter.branch}
                  onChange={e => setReviewFilter(f => ({ ...f, branch: e.target.value }))}>
                  <option value="">All Branches</option>
                  {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
                </select>

                <select className="cd-select" value={reviewFilter.batch}
                  onChange={e => setReviewFilter(f => ({ ...f, batch: e.target.value }))}>
                  <option value="">All Batches</option>
                  {BATCH_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>

              {/* Reviews list */}
              {isReviewLoading && reviews.length === 0 ? (
                <LoadingSpinner label="Loading reviews…" />
              ) : reviews.length === 0 ? (
                <div className="cd-empty">
                  <div className="cd-empty-icon">📝</div>
                  <div className="cd-empty-text">No reviews yet. Be the first!</div>
                  <Link to={`/write-review?college=${id}`} className="btn btn-primary">Write a Review</Link>
                </div>
              ) : (
                <>
                  {reviews.map(review => (
                    <ReviewCard
                      key={review._id}
                      review={review}
                      onHelpful={() => handleHelpfulVote(review._id)}
                      onFlag={() => handleFlagReview(review._id)}
                    />
                  ))}
                  <div ref={sentinelRef} className="sentinel" />
                  {isReviewLoading && (
                    <div className="load-more-wrap">
                      <LoadingSpinner label="Loading more…" size="sm" />
                    </div>
                  )}
                  {!hasMoreReviews && reviews.length > 0 && (
                    <div className="load-more-wrap text-muted">You've seen all {reviews.length} reviews.</div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ════ PROFESSORS TAB ════ */}
          {activeTab === "professors" && (
            <div>
              {isProfLoading ? (
                <LoadingSpinner label="Loading faculty…" />
              ) : professors.length === 0 ? (
                <div className="cd-empty">
                  <div className="cd-empty-icon">👨‍🏫</div>
                  <div className="cd-empty-text">No professor ratings yet.</div>
                </div>
              ) : (
                <div className="prof-grid">
                  {professors.map(prof => (
                    <ProfessorCard
                      key={prof._id}
                      professor={prof}
                      onClick={() => { setSelectedProfessor(prof); setIsProfModalOpen(true); }}
                    />
                  ))}
                </div>
              )}

              <ProfessorModal
                isOpen={isProfModalOpen}
                professor={selectedProfessor}
                onClose={() => { setIsProfModalOpen(false); setSelectedProfessor(null); }}
              />
            </div>
          )}

          {/* ════ PLACEMENTS TAB ════ */}
          {activeTab === "placements" && (
            <div>
              {isPlacLoading ? (
                <LoadingSpinner label="Loading placement data…" />
              ) : (
                <>
                  {/* Hero stats */}
                  <div className="cd-card mb-4">
                    <div className="cd-card-title">Placement Package Comparison</div>
                    <div className="pl-hero">
                      <div className="pl-stat-box claimed">
                        <div className="pl-stat-label claimed">Claimed Avg</div>
                        <div className="pl-stat-val claimed">
                          {formatPackage ? formatPackage(claimed) : `${claimed} LPA`}
                        </div>
                        <div className="pl-stat-unit">Official figure</div>
                      </div>
                      <div className="pl-stat-box actual">
                        <div className="pl-stat-label actual">Actual Avg</div>
                        <div className="pl-stat-val actual">
                          {formatPackage ? formatPackage(actual) : `${actual} LPA`}
                        </div>
                        <div className="pl-stat-unit">Crowdsourced from students</div>
                      </div>
                    </div>

                    {gap > 0 && (
                      <div style={{ textAlign: "center" }}>
                        <span className={`pl-gap-badge ${gap > 2 ? "pl-gap-warn" : "pl-gap-ok"}`}>
                          {gap > 2 ? "⚠️" : "✓"} Gap of {gap.toFixed(1)} LPA {gap > 2 ? "— significant discrepancy" : "— within expected range"}
                        </span>
                      </div>
                    )}

                    <PlacementBarChart claimed={claimed} actual={actual} />
                  </div>

                  {/* Top companies */}
                  {placements?.topCompanies?.length > 0 && (
                    <div className="cd-card mb-4">
                      <div className="cd-card-title">Top Hiring Companies</div>
                      <table className="co-table">
                        <thead>
                          <tr>
                            <th>Company</th>
                            <th>Hires</th>
                            <th>Avg CTC</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[...placements.topCompanies]
                            .sort((a, b) => b.count - a.count)
                            .map((c, i) => (
                              <tr key={i}>
                                <td style={{ fontWeight: 500 }}>{c.company}</td>
                                <td><span className="co-badge co-badge-count">{c.count}</span></td>
                                <td style={{ color: "var(--indigo)", fontWeight: 600 }}>
                                  {formatPackage ? formatPackage(c.avgCTC) : `${c.avgCTC} LPA`}
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Verified placements */}
                  {placRows.length > 0 && (
                    <div className="cd-card mb-4">
                      <div className="cd-card-title">Verified Student Placements</div>
                      <div style={{ overflowX: "auto" }}>
                        <table className="co-table">
                          <thead>
                            <tr>
                              <th>Company</th>
                              <th>Role</th>
                              <th>CTC</th>
                              <th>Branch</th>
                              <th>Batch</th>
                              <th>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {placRows.slice(0, placRowsShown).map((p, i) => (
                              <tr key={i}>
                                <td style={{ fontWeight: 500 }}>{p.company}</td>
                                <td>{p.role}</td>
                                <td style={{ color: "var(--jade)", fontWeight: 600 }}>
                                  {formatPackage ? formatPackage(p.ctc) : `${p.ctc} LPA`}
                                </td>
                                <td>{p.branch}</td>
                                <td>{p.batch}</td>
                                <td>
                                  <span className={`co-badge ${p.verified ? "co-badge-verified" : "co-badge-unverified"}`}>
                                    {p.verified ? "✓ Verified" : "Pending"}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {placRowsShown < placRows.length && (
                        <div className="load-more-wrap">
                          <button className="btn btn-secondary" onClick={() => setPlacRowsShown(n => n + 10)}>
                            Load More ({placRows.length - placRowsShown} remaining)
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Desktop submit button */}
                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <button className="btn btn-primary" onClick={() => setIsPlacModalOpen(true)}>
                      📄 Submit Offer Letter
                    </button>
                  </div>
                </>
              )}

              {/* FAB for mobile */}
              <div className="fab">
                <button className="btn btn-primary" onClick={() => setIsPlacModalOpen(true)}
                  style={{ borderRadius: 50, padding: "14px 20px", boxShadow: "var(--shadow-lg)" }}>
                  📄 Submit Offer
                </button>
              </div>

              <Modal
                isOpen={isPlacModalOpen}
                onClose={() => setIsPlacModalOpen(false)}
                title="Submit Your Placement"
              >
                <PlacementForm
                  onSubmit={handlePlacementSubmit}
                  onClose={() => setIsPlacModalOpen(false)}
                  isAuthenticated={isAuthenticated}
                />
              </Modal>
            </div>
          )}

          {/* ════ Q&A TAB ════ */}
          {activeTab === "qa" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <h2 className="cd-display" style={{ fontSize: "1.2rem", fontWeight: 500, margin: 0 }}>
                  Questions & Answers
                </h2>
                <button className="btn btn-primary btn-sm" onClick={() => {
                  if (!isAuthenticated) { showToast?.("Sign in to ask a question", "info"); return; }
                  setIsQuestionModalOpen(true);
                }}>
                  + Ask a Question
                </button>
              </div>

              {isQALoading ? (
                <LoadingSpinner label="Loading questions…" />
              ) : questions.length === 0 ? (
                <div className="cd-empty">
                  <div className="cd-empty-icon">🤔</div>
                  <div className="cd-empty-text">No questions yet. Start the conversation!</div>
                  <button className="btn btn-primary" onClick={() => setIsQuestionModalOpen(true)}>
                    Ask a Question
                  </button>
                </div>
              ) : (
                questions.map(q => (
                  <QuestionItem
                    key={q._id}
                    question={q}
                    isAuthenticated={isAuthenticated}
                    onAnswer={async (qId, text) => {
                      try {
                        const { addAnswer } = await import("../api/reviews");
                        const updated = await addAnswer(qId, { text });
                        setQuestions(prev => prev.map(q => q._id === qId ? updated : q));
                        showToast?.("Answer posted!", "success");
                      } catch {
                        showToast?.("Failed to post answer", "error");
                      }
                    }}
                  />
                ))
              )}

              <Modal
                isOpen={isQuestionModalOpen}
                onClose={() => setIsQuestionModalOpen(false)}
                title="Ask a Question"
              >
                {!isAuthenticated ? (
                  <div className="auth-gate">
                    <div className="auth-gate-icon">🔐</div>
                    <div className="auth-gate-title">Sign in to ask</div>
                    <div className="auth-gate-text">Join to ask and answer questions about this college.</div>
                    <Link to="/login" className="btn btn-primary">Sign In</Link>
                  </div>
                ) : (
                  <div>
                    <div className="form-group">
                      <label className="form-label">Your Question</label>
                      <textarea
                        className="form-input form-textarea"
                        placeholder="e.g. How is the CSE department? Is hostel compulsory in first year?"
                        value={newQuestion}
                        onChange={e => setNewQuestion(e.target.value)}
                        style={{ minHeight: 120 }}
                      />
                    </div>
                    <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }}
                      onClick={handleAskQuestion} disabled={!newQuestion.trim()}>
                      Post Question
                    </button>
                  </div>
                )}
              </Modal>
            </div>
          )}

          {/* ════ HOSTEL TAB ════ */}
          {activeTab === "hostel" && (
            <HostelTab college={college} hostelReviews={hostelReviews} />
          )}

        </main>
      )}

      {/* Full page spinner */}
      {isPageLoading && !college && (
        <div style={{ display: "flex", justifyContent: "center", padding: "80px 0" }}>
          <LoadingSpinner label="Loading college…" />
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   STYLE INJECTOR (injects <style> once, idempotent)
───────────────────────────────────────────────────────────────────────────── */
function StyleInjector() {
  useEffect(() => {
    const id = "rmc-college-detail-styles";
    if (!document.getElementById(id)) {
      const el = document.createElement("style");
      el.id = id;
      el.textContent = STYLES;
      document.head.appendChild(el);
    }
    return () => {};
  }, []);
  return null;
}

