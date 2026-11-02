export function LoadingBar({ label }: { label: string }) {
  return (
    <div role="progressbar" aria-label={label} className="fixed inset-x-0 top-0 z-50 h-1 overflow-hidden bg-muted">
      <div className="loading-bar h-full w-1/3 bg-foreground" />
    </div>
  );
}