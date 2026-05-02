const COLOR_ACTIVE = {
  default: "bg-gray-200 text-gray-800 border-gray-200",
  primary: "bg-[#FF6B35] text-white border-[#FF6B35]",
  accent: "bg-[#00B4D8] text-white border-[#00B4D8]",
  green: "bg-green-500 text-white border-green-500",
  red: "bg-red-500 text-white border-red-500",
};

const COLOR_OUTLINE = {
  default: "bg-transparent text-gray-600 border-gray-300 hover:bg-gray-100",
  primary: "bg-transparent text-[#FF6B35] border-[#FF6B35] hover:bg-orange-50",
  accent: "bg-transparent text-[#00B4D8] border-[#00B4D8] hover:bg-sky-50",
  green: "bg-transparent text-green-600 border-green-500 hover:bg-green-50",
  red: "bg-transparent text-red-600 border-red-500 hover:bg-red-50",
};

const SIZE_CLS = {
  sm: "text-xs px-2.5 py-0.5 gap-1",
  md: "text-sm px-3 py-1 gap-1.5",
  lg: "text-base px-4 py-1.5 gap-2",
};

export default function TagPill({
  label,
  onRemove = null,
  onClick = null,
  active = false,
  color = "default",
  size = "sm",
}) {
  const colorCls = active ? COLOR_ACTIVE[color] || COLOR_ACTIVE.default : COLOR_OUTLINE[color] || COLOR_OUTLINE.default;
  const sizeCls = SIZE_CLS[size] || SIZE_CLS.sm;

  return (
    <span
      className={`inline-flex items-center rounded-full border font-medium transition-all duration-150 select-none
        ${colorCls} ${sizeCls}
        ${onClick ? "cursor-pointer" : ""}
      `}
      onClick={onClick}
    >
      {label}
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-0.5 flex items-center justify-center rounded-full w-3.5 h-3.5 hover:opacity-70 focus:outline-none transition-opacity"
          aria-label={`Remove ${label}`}
        >
          <svg viewBox="0 0 10 10" className="w-2.5 h-2.5" fill="currentColor">
            <path d="M8 2L5 5l3 3-1 1L4 6 1 9 0 8l3-3L0 2l1-1 3 3 3-3 1 1z" />
          </svg>
        </button>
      )}
    </span>
  );
}
