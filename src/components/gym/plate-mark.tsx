export function PlateMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <circle cx="16" cy="16" r="13" className="fill-accent" />
      <circle cx="16" cy="16" r="5" className="fill-bg" />
    </svg>
  );
}
