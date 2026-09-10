export function FileIcon({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6.5 2.5h7l4 4v14.5a1 1 0 0 1-1 1h-10a1 1 0 0 1-1-1v-17.5a1 1 0 0 1 1-1Z" />
      <path d="M13.5 2.5v4h4" />
    </svg>
  );
}
