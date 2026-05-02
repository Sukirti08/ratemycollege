import { useEffect, useRef, useState } from "react";

const COLOR_MAP = {
  primary: "bg-[#FF6B35]",
  accent: "bg-[#00B4D8]",
  green: "bg-green-500",
};

export default function RatingBar({
  label,
  score,
  maxScore = 5,
  color = "primary",
  animate = true,
  showScore = true,
}) {
  const [width, setWidth] = useState(animate ? 0 : (score / maxScore) * 100);
  const mounted = useRef(false);

  useEffect(() => {
    if (!animate) return;
    const id = requestAnimationFrame(() => {
      mounted.current = true;
      setWidth((score / maxScore) * 100);
    });
    return () => cancelAnimationFrame(id);
  }, [score, maxScore, animate]);

  const barColor = COLOR_MAP[color] || COLOR_MAP.primary;
  const pct = Math.min(100, Math.max(0, (score / maxScore) * 100));

  return (
    <div className="flex items-center gap-3 w-full">
      <span className="text-sm text-gray-600 w-32 shrink-0 font-medium">{label}</span>
      <div className="flex-1 bg-gray-100 rounded-full h-2.5 overflow-hidden">
        <div
          className={`h-full rounded-full ${barColor}`}
          style={{
            width: `${animate ? width : pct}%`,
            transition: animate ? "width 0.8s cubic-bezier(0.4,0,0.2,1)" : "none",
          }}
        />
      </div>
      {showScore && (
        <span className="text-sm font-bold text-gray-700 w-10 text-right tabular-nums">
          {score != null ? score.toFixed(1) : "N/A"}
          <span className="text-xs font-normal text-gray-400">/{maxScore}</span>
        </span>
      )}
    </div>
  );
}
