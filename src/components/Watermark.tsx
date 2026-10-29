/** Cozy, low-key signature. Sits in the page flow so it never covers anything. */
export function Watermark({ className = "" }: { className?: string }) {
  return (
    <p
      aria-hidden="true"
      className={`select-none text-center text-[10px] font-semibold uppercase leading-none tracking-[0.35em] text-muted-foreground/45 ${className}`}
    >
      made by lucky
      <span className="ml-[0.5em] align-middle text-primary/60">♥</span>
    </p>
  );
}
