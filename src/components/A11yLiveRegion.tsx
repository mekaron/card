export default function A11yLiveRegion() {
  return (
    <div
      id="live-region"
      className="sr-only"
      role="status"
      aria-live="polite"
      aria-atomic="true"
    />
  );
}
