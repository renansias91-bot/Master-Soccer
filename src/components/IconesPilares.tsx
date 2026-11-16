import React from 'react';

interface IconePilarProps {
  className?: string;
}

/**
 * Quadrinho Tático / Prancheta Tática (campinho visto de cima com linhas, peças e setinhas)
 */
export const IconeQuadrinhoTatico: React.FC<IconePilarProps> = ({ className = 'w-5 h-5' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block shrink-0 ${className}`}
    aria-hidden="true"
  >
    {/* Moldura prancheta / campinho verde */}
    <rect x="2" y="3" width="20" height="18" rx="2.5" fill="#16A34A" stroke="#14532D" strokeWidth="1.5" />
    {/* Linhas brancas do campo */}
    <rect x="3.5" y="4.5" width="17" height="15" rx="1" stroke="#FFFFFF" strokeWidth="1" strokeOpacity="0.9" />
    <line x1="12" y1="4.5" x2="12" y2="19.5" stroke="#FFFFFF" strokeWidth="1" strokeOpacity="0.9" />
    <circle cx="12" cy="12" r="2.3" stroke="#FFFFFF" strokeWidth="1" strokeOpacity="0.9" />
    {/* Peças táticas (bolinhas / X) e setinha de movimentação */}
    <circle cx="7.2" cy="8.5" r="1.4" fill="#FACC15" stroke="#1E293B" strokeWidth="0.6" />
    <circle cx="7.2" cy="15.5" r="1.4" fill="#FACC15" stroke="#1E293B" strokeWidth="0.6" />
    <path d="M15.4 7.3L17.4 9.3M17.4 7.3L15.4 9.3" stroke="#FFFFFF" strokeWidth="1.3" strokeLinecap="round" />
    {/* Setinha de movimentação tática */}
    <path d="M9.3 9.8L14.3 13.8" stroke="#FFFFFF" strokeWidth="1.3" strokeLinecap="round" />
    <path d="M12.3 14.1L14.6 14.1L14.3 11.8" stroke="#FFFFFF" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/**
 * Ícone Extra-Campo (compromisso, pontualidade, uniforme e comportamento fora das quatro linhas: calendário com check)
 */
export const IconeExtraCampo: React.FC<IconePilarProps> = ({ className = 'w-5 h-5' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block shrink-0 ${className}`}
    aria-hidden="true"
  >
    {/* Corpo do calendário/compromisso */}
    <rect x="3" y="4.5" width="18" height="16.5" rx="2.5" fill="#FFFFFF" stroke="#1E3A8A" strokeWidth="1.5" />
    {/* Topo azul */}
    <path d="M3 7C3 5.61929 4.11929 4.5 5.5 4.5H18.5C19.8807 4.5 21 5.61929 21 7V9.5H3V7Z" fill="#2563EB" />
    {/* Argolas do calendário */}
    <line x1="8" y1="2.5" x2="8" y2="6" stroke="#1E3A8A" strokeWidth="1.8" strokeLinecap="round" />
    <line x1="16" y1="2.5" x2="16" y2="6" stroke="#1E3A8A" strokeWidth="1.8" strokeLinecap="round" />
    {/* Check verde de compromisso / pontualidade */}
    <circle cx="12" cy="15" r="4.3" fill="#DCFCE7" stroke="#16A34A" strokeWidth="1.2" />
    <path d="M9.9 15L11.4 16.5L14.3 13.5" stroke="#15803D" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
