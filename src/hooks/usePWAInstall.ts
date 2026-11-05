import { useEffect, useState } from 'react';

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  
  // Verifica se já está instalado usando window.matchMedia('(display-mode: standalone)').matches
  const [isInstalled, setIsInstalled] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
      document.referrer.startsWith('android-app://')
    );
  });

  useEffect(() => {
    const checkIsInstalled = () => {
      const standalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
        document.referrer.startsWith('android-app://');
      
      setIsInstalled(standalone);
      if (standalone) {
        setDeferredPrompt(null);
      }
    };

    checkIsInstalled();

    // Escuta alterações na media query (display-mode: standalone)
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleMediaChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        setIsInstalled(true);
        setDeferredPrompt(null);
      }
    };
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleMediaChange);
    }

    // Escuta evento beforeinstallprompt (só dispara se NÃO estiver instalado)
    const handleBeforeInstallPrompt = (e: Event) => {
      if (window.matchMedia('(display-mode: standalone)').matches) {
        setIsInstalled(true);
        setDeferredPrompt(null);
        return;
      }
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    // Escuta evento appinstalled para esconder imediatamente o botão
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleMediaChange);
      }
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const install = async () => {
    if (!deferredPrompt) return false;
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
        setDeferredPrompt(null);
        return true;
      }
    } catch (err) {
      console.warn('Erro ao disparar prompt de instalação:', err);
    }
    return false;
  };

  return {
    isInstallable: !!deferredPrompt,
    isInstalled,
    isIOS: typeof window !== 'undefined' ? /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase()) : false,
    install,
  };

}
