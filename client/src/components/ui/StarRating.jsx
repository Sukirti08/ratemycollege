import { useState } from "react";

const SIZES = {
  sm: 16,
  md: 20,
  lg: 28,
};

const COLORS = {
  primary: "#FF6B35",
  accent: "#00B4D8",
};

function Star({ filled, half, size, color }) {
  const px = SIZES[size] || SIZES.md;
  const fill = filled ? color : "none";
  const stroke = filled || half ? color : "#D1D5DB";

  return (
    <svg
      width={px}
      height={px}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "inline-block", flexShrink: 0 }}
    >
      {half ? (
        <>
          <defs>
            <linearGradient id={`half-${size}`} x1="0" x2="1" y1="0" y2="0">
              <stop offset="50%" stopColor={color} />
              <stop offset="50%" stopColor="none" stopOpacity="0" />
            </linearGradient>
          </defs>
          <polygon
            points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"
            fill={`url(#half-${size})`}
            stroke={color}
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </>
      ) : (
        <polygon
          points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"
          fill={fill}
          stroke={stroke}
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      )}
    </svg>
  );
}

export default function StarRating({
  rating = 0,
  max = 5,
  size = "md",
  interactive = false,
  onRate = null,
  color = "primary",
}) {
  const [hovered, setHovered] = useState(null);
  const resolvedColor = COLORS[color] || COLORS.primary;
  const displayRating = interactive && hovered !== null ? hovered : rating;

  const handleClick = (val) => {
    if (interactive && onRate) onRate(val);
  };

  return (
    <span className="inline-flex items-center gap-1">
      {Array.from({ length: max }, (_, i) => {
        const val = i + 1;
        const filled = displayRating >= val;
        const half = !filled && displayRating >= val - 0.5;
        return (
          <span
            key={i}
            onClick={() => handleClick(val)}
            onMouseEnter={() => interactive && setHovered(val)}
            onMouseLeave={() => interactive && setHovered(null)}
            className={interactive ? "cursor-pointer transition-transform hover:scale-110" : ""}
            style={{ lineHeight: 0 }}
          >
            <Star filled={filled} half={half} size={size} color={resolvedColor} />
          </span>
        );
      })}
      {rating > 0 && (
        <span
          className="ml-1 font-semibold tabular-nums"
          style={{
            fontSize: SIZES[size] * 0.75,
            color: resolvedColor,
          }}
        >
          {rating.toFixed(1)}
        </span>
      )}
    </span>
  );
}
