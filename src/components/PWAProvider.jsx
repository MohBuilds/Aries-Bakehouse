'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Download, Share, X } from 'lucide-react';
import Image from 'next/image';
import { toast } from './ui/toast.jsx';

const DISMISSED_KEY = 'aries11_install_prompt_dismissed_at';
const VIEWS_KEY = 'aries11_page_views';
const SNOOZE_DAYS = 14;
const SHOW_AFTER_MS = 5000;
// Never interrupt someone who is paying or managing an order.
const QUIET_PATHS = ['/cart', '/checkout', '/order', '/account', '/admin', '/offline'];

function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
}

// iPhones and iPads never fire `beforeinstallprompt`; installing there is the
// Share sheet's "Add to Home Screen", so we show instructions instead.
function isIosSafari() {
  const ua = window.navigator.userAgent;
  const ios = /iPad|iPhone|iPod/.test(ua) || (ua.includes('Mac') && window.navigator.maxTouchPoints > 1);
  return ios && /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua);
}

function snoozed() {
  const at = Number(window.localStorage.getItem(DISMISSED_KEY) || 0);
  return at && Date.now() - at < SNOOZE_DAYS * 86400000;
}

export default function PWAProvider() {
  const pathname = usePathname();
  const [mode, setMode] = useState(null); // 'android' | 'ios' | null
  const deferred = useRef(null);
  const [ready, setReady] = useState(false); // engaged enough to be asked

  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {
        // The storefront remains fully usable when service-worker registration is unavailable.
      });
    }

    const handleInstallPrompt = (event) => {
      event.preventDefault();
      deferred.current = event;
    };
    const handleInstalled = () => {
      deferred.current = null;
      setMode(null);
      window.localStorage.removeItem(DISMISSED_KEY);
      toast.success('Aries 11 installed', { description: 'Find the bakehouse on your home screen.' });
    };
    const handleOffline = () => toast.warning('You are offline', { description: 'Saved pages still open. Ordering needs a connection.' });
    const handleOnline = () => toast.success('Back online', { description: 'Ordering and account updates are available again.' });

    window.addEventListener('beforeinstallprompt', handleInstallPrompt);
    window.addEventListener('appinstalled', handleInstalled);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleInstallPrompt);
      window.removeEventListener('appinstalled', handleInstalled);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  // "Engaged" = looked at a second page in this visit. Ask then, not on arrival.
  useEffect(() => {
    try {
      const views = Number(window.sessionStorage.getItem(VIEWS_KEY) || 0) + 1;
      window.sessionStorage.setItem(VIEWS_KEY, String(views));
      if (views >= 2) setReady(true);
    } catch {
      /* storage blocked: simply never prompt */
    }
  }, [pathname]);

  useEffect(() => {
    if (!ready || isStandalone() || snoozed()) return undefined;
    if (QUIET_PATHS.some((path) => pathname.startsWith(path))) {
      setMode(null);
      return undefined;
    }
    const timer = window.setTimeout(() => {
      if (deferred.current) setMode('android');
      else if (isIosSafari()) setMode('ios');
    }, SHOW_AFTER_MS);
    return () => window.clearTimeout(timer);
  }, [ready, pathname]);

  if (!mode) return null;

  const install = async () => {
    const event = deferred.current;
    if (!event) return;
    await event.prompt();
    const choice = await event.userChoice;
    if (choice.outcome === 'accepted') {
      deferred.current = null;
      setMode(null);
    } else {
      dismiss();
    }
  };

  function dismiss() {
    window.localStorage.setItem(DISMISSED_KEY, String(Date.now()));
    setMode(null);
  }

  return (
    <aside className="pwa-install-prompt" aria-label="Install Aries 11 Bakehouse">
      <Image src="/pwa-icon-192.png" alt="" width={44} height={44} />
      <div className="pwa-install-prompt__copy">
        <strong>Add Aries 11 to your home screen</strong>
        {mode === 'ios' ? (
          <span>
            Tap <Share size={13} aria-label="Share" className="pwa-install-prompt__share" /> then &ldquo;Add to Home Screen&rdquo;.
          </span>
        ) : (
          <span>Order in two taps, even on a weak connection.</span>
        )}
      </div>
      {mode === 'android' && (
        <button type="button" className="btn btn-primary btn-sm" onClick={install}>
          <Download size={15} aria-hidden="true" /> Install
        </button>
      )}
      <button type="button" className="pwa-install-prompt__close" onClick={dismiss} aria-label="Not now">
        <X size={17} aria-hidden="true" />
      </button>
    </aside>
  );
}
