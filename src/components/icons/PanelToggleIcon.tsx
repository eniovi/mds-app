export function PanelToggleIcon({ size = 15, collapsed }: { size?: number; collapsed: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M9.5 4v16" />
      <path d={collapsed ? "M13.5 9.5l2.5 2.5-2.5 2.5" : "M17 9.5 14.5 12l2.5 2.5"} />
    </svg>
  );
}
