import React from "react";

type SimpleGaugeProps = {
  value: number; // 0-100
  max?: number; // default 100
  startAngle?: number; // degrees, default -110
  endAngle?: number; // degrees, default 110
  width?: number; // px, default 520
  height?: number; // px, default 300
  strokeWidth?: number; // px, default 16
  color?: string; // stroke color, default blue-500
  trackColor?: string; // background arc color, default gray-200
  showText?: boolean; // center value
  textFormatter?: (value: number, max: number) => string;
  targetValue?: number; // optional target marker (0-100)
  targetColor?: string; // target tick color
};

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const angleRad = ((angleDeg - 90) * Math.PI) / 180.0;
  return {
    x: cx + r * Math.cos(angleRad),
    y: cy + r * Math.sin(angleRad),
  };
}

function describeArc(
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number
) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
  return [
    "M",
    start.x,
    start.y,
    "A",
    r,
    r,
    0,
    largeArcFlag,
    0,
    end.x,
    end.y,
  ].join(" ");
}

export const SimpleGauge: React.FC<SimpleGaugeProps> = ({
  value,
  max = 100,
  startAngle = -110,
  endAngle = 110,
  width = 520,
  height = 300,
  strokeWidth = 16,
  color = "#3b82f6",
  trackColor = "#e5e7eb",
  showText = true,
  textFormatter,
  targetValue,
  targetColor = "#111827",
}) => {
  const clamped = Math.max(0, Math.min(max, value));
  const pct = clamped / max;
  const cx = width / 2;
  const cy = height - strokeWidth; // leave bottom padding
  const r = Math.min(width, height * 2) / 2 - strokeWidth; // keep within view
  const totalSpan = endAngle - startAngle;
  const currentAngle = startAngle + totalSpan * pct;

  const trackPath = describeArc(cx, cy, r, startAngle, endAngle);
  const valuePath = describeArc(cx, cy, r, startAngle, currentAngle);

  const text = textFormatter
    ? textFormatter(clamped, max)
    : `${Math.round(clamped)} / ${max}`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {/* Track */}
      <path d={trackPath} fill="none" stroke={trackColor} strokeWidth={strokeWidth} strokeLinecap="round" />
      {/* Value */}
      <path d={valuePath} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      {/* Target tick */}
      {typeof targetValue === "number" && (
        (() => {
          const tPct = Math.max(0, Math.min(1, targetValue / max));
          const tAngle = startAngle + totalSpan * tPct;
          const inner = r - strokeWidth * 0.8;
          const outer = r + strokeWidth * 0.1;
          const p1 = polarToCartesian(cx, cy, inner, tAngle);
          const p2 = polarToCartesian(cx, cy, outer, tAngle);
          return <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke={targetColor} strokeWidth={2} />;
        })()
      )}
      {showText && (
        <text
          x={cx}
          y={cy - r * 0.5}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={40}
          fontWeight={700}
          fill="#111827"
        >
          {text}
        </text>
      )}
      {showText && typeof targetValue === "number" && (
        <text
          x={cx}
          y={cy - r * 0.5 + 34}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={14}
          fontWeight={600}
          fill="#6b7280"
        >
          {`Target ${Math.round(targetValue)}`}
        </text>
      )}
    </svg>
  );
};

export default SimpleGauge;


