export function ChevronRightIcon({ size = 14, expanded = false }: { size?: number; expanded?: boolean }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ transform: expanded ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.1s ease" }}
    >
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}
