export function EyeIcon({ size = 16, open = true }: { size?: number; open?: boolean }) {
  if (!open) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M6.5 6.7C4 8.3 2 12 2 12s3.5 7 10 7c1.8 0 3.4-.5 4.7-1.2M17.4 17.4C19.8 15.8 22 12 22 12s-1-2-2.7-3.9C17.7 6.3 15.1 5 12 5c-.9 0-1.8.1-2.6.4" />
        <path d="M10.6 10.6a3 3 0 0 0 4.24 4.24" />
        <path d="M3 3l18 18" />
      </svg>
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
