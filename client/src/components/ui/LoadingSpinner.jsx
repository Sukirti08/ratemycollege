const SIZE_MAP = {
  sm: "w-4 h-4 border-2",
  md: "w-8 h-8 border-[3px]",
  lg: "w-16 h-16 border-4",
};

const COLOR_MAP = {
  primary: "border-[#FF6B35]",
  accent: "border-[#00B4D8]",
  white: "border-white",
  gray: "border-gray-400",
};

export default function LoadingSpinner({
  size = "md",
  color = "primary",
  fullScreen = false,
  text = "",
}) {
  const sizeCls = SIZE_MAP[size] || SIZE_MAP.md;
  const colorCls = COLOR_MAP[color] || COLOR_MAP.primary;

  const spinner = (
    <div className="flex flex-col items-center gap-3">
      <div
        className={`${sizeCls} ${colorCls} border-t-transparent rounded-full animate-spin`}
        role="status"
        aria-label="Loading"
      />
      {text && (
        <p className="text-sm text-gray-500 font-medium animate-pulse">{text}</p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
        {spinner}
      </div>
    );
  }

  return spinner;
}
