export function WorkoutIllustration({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <circle cx="32" cy="12" r="6" fill="currentColor" opacity="0.9" />
      <path
        d="M32 18v14M32 32l-9 16M32 32l9 16"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        d="M20 24l-6-4M44 24l6-4"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  );
}
