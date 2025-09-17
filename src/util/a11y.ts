export function announce(text: string) {
  const element = document.getElementById('live-region');
  if (!(element instanceof HTMLElement)) return;

  element.textContent = '';
  void element.offsetHeight;
  element.textContent = text;
}

export function vibrate(pattern: number | number[] = 15) {
  if ('vibrate' in navigator) {
    try {
      navigator.vibrate?.(pattern);
    } catch {
      // ignore unsupported vibration errors
    }
  }
}
