export function ContinuityMark({ size = 24, color = "var(--brand)" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <circle cx="20" cy="20" r="18" stroke={color} strokeWidth="2" strokeDasharray="8 6" opacity="0.5" />
      <circle cx="20" cy="20" r="12" stroke={color} strokeWidth="2.5" strokeDasharray="14 5" opacity="0.85" />
      <circle cx="20" cy="20" r="5" fill={color} />
    </svg>
  );
}
