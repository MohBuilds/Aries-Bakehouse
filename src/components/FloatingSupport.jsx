'use client';

import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Button } from './ui/button.jsx';

export default function FloatingSupport() {
  const { pathname } = useLocation();
  const [overFooter, setOverFooter] = useState(false);

  // The closing panel and footer carry their own WhatsApp links, and the
  // floating button would otherwise sit on top of them. Hide it while they show.
  useEffect(() => {
    const targets = document.querySelectorAll('[data-closing], [data-site-footer]');
    if (!targets.length || !('IntersectionObserver' in window)) return undefined;
    const visible = new Set();
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => (entry.isIntersecting ? visible.add(entry.target) : visible.delete(entry.target)));
        setOverFooter(visible.size > 0);
      },
      { rootMargin: '0px 0px -12% 0px' },
    );
    targets.forEach((target) => observer.observe(target));
    return () => observer.disconnect();
  }, [pathname]);

  if (pathname === '/contact') return null;

  return (
    <Button asChild variant="whatsapp" className={`floating-support${overFooter ? ' is-tucked' : ''}`}>
      <a href="https://wa.me/2348121145785" target="_blank" rel="noreferrer" aria-label="Open WhatsApp support">
        <WhatsAppIcon />
        <span>Support</span>
      </a>
    </Button>
  );
}

function WhatsAppIcon() {
  return (
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.5 2 2 6.5 2 12c0 1.8.5 3.5 1.3 5L2 22l5.2-1.3c1.5.8 3.1 1.2 4.8 1.2 5.5 0 10-4.5 10-10S17.5 2 12 2Zm0 18c-1.5 0-3-.4-4.3-1.1l-.3-.2-3 .8.8-2.9-.2-.3C4.4 15 4 13.5 4 12c0-4.4 3.6-8 8-8s8 3.6 8 8-3.6 8-8 8Z" />
    </svg>
  );
}
