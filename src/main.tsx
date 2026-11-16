import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Registro do Service Worker PWA para suporte offline (apenas em produção; em dev limpa caches antigos)
if ('serviceWorker' in navigator) {
  if (import.meta.env.PROD) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          console.log('Master Soccer RJ: Service Worker registrado com sucesso:', reg.scope);
        })
        .catch((err) => {
          console.warn('Master Soccer RJ: Falha ao registrar Service Worker:', err);
        });
    });
  } else {
    navigator.serviceWorker.getRegistrations().then((regs) => {
      regs.forEach((reg) => reg.unregister());
    }).catch(() => {});
    if ('caches' in window) {
      caches.keys().then((keys) => {
        keys.forEach((key) => caches.delete(key));
      }).catch(() => {});
    }
  }
}

createRoot(document.getElementById('root')!).render(<App />);

