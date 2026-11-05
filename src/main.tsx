import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Registro do Service Worker PWA para suporte offline
if ('serviceWorker' in navigator) {
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
}

createRoot(document.getElementById('root')!).render(<App />);

