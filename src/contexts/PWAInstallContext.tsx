'use client';

import { createContext, ReactNode, useContext, useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface PWAInstallContextType {
  installPrompt: BeforeInstallPromptEvent | null;
  isStandalone: boolean;
  isIOS: boolean;
  handleInstallClick: () => void;
}

const PWAInstallContext = createContext<PWAInstallContextType | undefined>(undefined);

export const usePWAInstall = () => {
  const context = useContext(PWAInstallContext);
  if (context === undefined) {
    throw new Error('usePWAInstall must be used within a PWAInstallProvider');
  }
  return context;
};

export const PWAInstallProvider = ({ children }: { children: ReactNode }) => {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const registration of registrations) {
          registration.unregister();
        }
      });
      caches.keys().then((keys) => {
        keys.forEach((key) => {
          if (key.startsWith('meera-os-cache')) {
            caches.delete(key);
          }
        });
      });
    }

    if (typeof window !== 'undefined') {
      setIsStandalone(window.matchMedia('(display-mode: standalone)').matches);
      setIsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent));
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = () => {
    if (installPrompt) {
      installPrompt.prompt();
      installPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted the A2HS prompt');
        } else {
          console.log('User dismissed the A2HS prompt');
        }
        setInstallPrompt(null);
      });
    } else if (isIOS) {
      alert("To install, tap the share button and then 'Add to Home Screen'.");
    }
  };

  const value = {
    installPrompt,
    isStandalone,
    isIOS,
    handleInstallClick,
  };

  return <PWAInstallContext.Provider value={value}>{children}</PWAInstallContext.Provider>;
};
