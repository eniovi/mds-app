export function PanelToggleIcon({ size = 15, collapsed }: { size?: number; collapsed: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M14.5 4v16" />
      <path d={collapsed ? "M10.5 9.5 8 12l2.5 2.5" : "M7 9.5 9.5 12 7 14.5"} />
    </svg>
  );
}
