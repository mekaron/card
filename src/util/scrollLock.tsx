import * as React from 'react';

function lockBodyScroll() {
  const docEl = document.documentElement;
  const body = document.body;
  const scrollY = window.scrollY || docEl.scrollTop;

  body.dataset.scrollLock = '1';
  body.style.overflow = 'hidden';
  body.style.position = 'fixed';
  body.style.width = '100%';
  body.style.top = `-${scrollY}px`;
}

function unlockBodyScroll() {
  const body = document.body;
  if (!body.dataset.scrollLock) return;

  const top = parseInt(body.style.top || '0', 10);
  body.style.removeProperty('overflow');
  body.style.removeProperty('position');
  body.style.removeProperty('width');
  body.style.removeProperty('top');
  delete body.dataset.scrollLock;
  window.scrollTo(0, -top);
}

export function PageScrollLock() {
  React.useEffect(() => {
    lockBodyScroll();
    return () => unlockBodyScroll();
  }, []);

  return null;
}

export const ScrollLock = { lock: lockBodyScroll, unlock: unlockBodyScroll };
