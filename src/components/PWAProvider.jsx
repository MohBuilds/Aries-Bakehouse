'use client';

import { useEffect, useRef, useState } from 'react';
import { Download, X } from 'lucide-react';
import Image from 'next/image';
import { toast } from './ui/toast.jsx';

const DISMISSED_KEY = 'aries11_install_prompt_dismissed';

export default function PWAProvider() {
  const [installPrompt, setInstallPrompt] = useState(null);
  const pendingPrompt = useRef(null);

  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {
        // The storefront remains fully usable when service-worker registration is unavailable.
      });
    }

    const handleInstallPrompt = (event) => {
      event.preventDefault();
      if (window.localStorage.getItem(DISMISSED_KEY) === 'true') return;
      pendingPrompt.current = event;
      if (window.scrollY > window.innerHeight * 0.75) setInstallPrompt(event);
    };
    const handleScroll = () => {
      if (pendingPrompt.current && window.scrollY > window.innerHeight * 0.75) {
        setInstallPrompt(pendingPrompt.current);
      }
    };
    const handleInstalled = () => {
      pendingPrompt.current = null;
      setInstallPrompt(null);
      window.localStorage.removeItem(DISMISSED_KEY);
      toast.success('Aries 11 installed', { description: 'The bakehouse is now available from your home screen.' });
    };
    const handleOffline = () => toast.warning('You are offline', { description: 'Saved public pages remain available. Ordering needs a connection.' });
    const handleOnline = () => toast.success('Back online', { description: 'Ordering and account updates are available again.' });

    window.addEventListener('beforeinstallprompt', handleInstallPrompt);
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('appinstalled', handleInstalled);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleInstallPrompt);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('appinstalled', handleInstalled);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  if (!installPrompt) return null;

  const install = async () => {
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    if (choice.outcome === 'accepted') {
      pendingPrompt.current = null;
      setInstallPrompt(null);
    }
  };

  const dismiss = () => {
    pendingPrompt.current = null;
    window.localStorage.setItem(DISMISSED_KEY, 'true');
    setInstallPrompt(null);
  };

  return (
    <aside className="pwa-install-prompt" aria-label="Install Aries 11 Bakehouse">
      <Image src="/pwa-icon-192.png" alt="" width={44} height={44} />
      <div className="pwa-install-prompt__copy">
        <strong>Keep the bakehouse close</strong>
        <span>Install for quicker mobile access.</span>
      </div>
      <button type="button" className="btn btn-primary btn-sm" onClick={install}>
        <Download size={15} aria-hidden="true" /> Install
      </button>
      <button type="button" className="pwa-install-prompt__close" onClick={dismiss} aria-label="Dismiss install prompt">
        <X size={17} aria-hidden="true" />
      </button>
    </aside>
  );
}
