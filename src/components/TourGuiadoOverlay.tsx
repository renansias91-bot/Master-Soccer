import React, { useEffect, useState, useCallback } from 'react';
import { ArrowRight, CheckCircle2, Sparkles, X } from 'lucide-react';

export type TipoTourGuiado = 'criar-jogo' | 'montar-escalacao' | 'avaliar-jogador';

export interface PassoTourGuiado {
  id: string;
  selector: string;
  titulo: string;
  descricao?: string;
}

interface TourGuiadoOverlayProps {
  ativo: boolean;
  concluido: boolean;
  passoAtual: PassoTourGuiado | null;
  indicePasso: number;
  totalPassos: number;
  onProximo: () => void;
  onPular: () => void;
  onTerminar: () => void;
}

interface RectBox {
  top: number;
  left: number;
  width: number;
  height: number;
}

export const TourGuiadoOverlay: React.FC<TourGuiadoOverlayProps> = ({
  ativo,
  concluido,
  passoAtual,
  indicePasso,
  totalPassos,
  onProximo,
  onPular,
  onTerminar,
}) => {
  const [rect, setRect] = useState<RectBox | null>(null);
  const [viewport, setViewport] = useState<{ w: number; h: number }>({
    w: typeof window !== 'undefined' ? window.innerWidth : 390,
    h: typeof window !== 'undefined' ? window.innerHeight : 844,
  });

  const medirElemento = useCallback(
    (deveRolar: boolean) => {
      if (!ativo || concluido || !passoAtual) {
        setRect(null);
        return;
      }

      const w = window.innerWidth;
      const h = window.innerHeight;
      setViewport({ w, h });

      const el = document.querySelector(passoAtual.selector) as HTMLElement | null;
      if (!el) {
        setRect(null);
        return;
      }

      if (deveRolar) {
        const rInicial = el.getBoundingClientRect();
        const muitoAlto = rInicial.height > h * 0.55;
        el.scrollIntoView({
          behavior: 'smooth',
          block: muitoAlto ? 'start' : 'center',
          inline: 'nearest',
        });
      }

      const r = el.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) {
        setRect(null);
        return;
      }

      const pad = 6;
      setRect({
        top: r.top - pad,
        left: Math.max(6, r.left - pad),
        width: Math.min(w - 12, r.width + pad * 2),
        height: r.height + pad * 2,
      });
    },
    [ativo, concluido, passoAtual]
  );

  useEffect(() => {
    if (!ativo || concluido || !passoAtual) {
      setRect(null);
      return;
    }

    // Mede imediatamente e novamente após animações de modal/acordeão e rolagem
    const t1 = setTimeout(() => medirElemento(true), 60);
    const t2 = setTimeout(() => medirElemento(false), 240);
    const t3 = setTimeout(() => medirElemento(false), 450);

    const handleAtualizar = () => medirElemento(false);
    window.addEventListener('resize', handleAtualizar);
    window.addEventListener('scroll', handleAtualizar, true);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      window.removeEventListener('resize', handleAtualizar);
      window.removeEventListener('scroll', handleAtualizar, true);
    };
  }, [ativo, concluido, passoAtual, medirElemento]);

  if (!ativo) return null;

  // Tela final após concluir todos os passos
  if (concluido) {
    return (
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200">
        <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border-2 border-amber-400 p-6 text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-100 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-800 flex items-center justify-center">
            <CheckCircle2 className="w-9 h-9 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-lg font-black text-slate-900 dark:text-white leading-snug">
              Pronto! Agora você já sabe usar.
            </h3>
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
              Quer tentar sozinho?
            </p>
          </div>
          <button
            type="button"
            onClick={onTerminar}
            style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
            className="w-full py-3.5 px-5 rounded-2xl text-base font-black shadow-md hover:opacity-95 active:scale-98 transition cursor-pointer"
          >
            Terminar
          </button>
        </div>
      </div>
    );
  }

  // Cálculo da posição do balãozinho com seta apontando para o elemento destacado
  const bubbleMaxWidth = Math.min(340, viewport.w - 24);
  const bubbleEstHeight = 185;
  const gap = 14;

  let spotlightVisivel: RectBox | null = null;
  let bubbleTop = Math.max(16, viewport.h / 2 - 90);
  let bubbleLeft = Math.max(12, (viewport.w - bubbleMaxWidth) / 2);
  let setaPosicao: 'top' | 'bottom' | 'none' = 'none';
  let setaLeftOffset = bubbleMaxWidth / 2;

  if (rect) {
    // Limita o recorte visível dentro da viewport caso o bloco seja muito alto
    const clampedTop = Math.max(8, rect.top);
    const clampedBottom = Math.min(viewport.h - 8, rect.top + rect.height);
    const clampedHeight = Math.max(44, clampedBottom - clampedTop);

    spotlightVisivel = {
      top: clampedTop,
      left: rect.left,
      width: rect.width,
      height: clampedHeight,
    };

    const espacoAbaixo = viewport.h - (clampedTop + clampedHeight);
    const espacoAcima = clampedTop;

    // Alinha horizontalmente perto do alvo sem sair da tela
    const targetCenterX = rect.left + rect.width / 2;
    bubbleLeft = Math.max(
      12,
      Math.min(viewport.w - bubbleMaxWidth - 12, targetCenterX - bubbleMaxWidth / 2)
    );
    setaLeftOffset = Math.max(22, Math.min(bubbleMaxWidth - 22, targetCenterX - bubbleLeft));

    if (espacoAbaixo >= bubbleEstHeight + gap) {
      // Balão embaixo com seta apontando PARA CIMA (para o alvo)
      bubbleTop = clampedTop + clampedHeight + gap;
      setaPosicao = 'top';
    } else if (espacoAcima >= bubbleEstHeight + gap) {
      // Balão em cima com seta apontando PARA BAIXO (para o alvo)
      bubbleTop = Math.max(12, clampedTop - bubbleEstHeight - gap);
      setaPosicao = 'bottom';
    } else {
      // Bloco alto ocupa a maior parte da tela: fixa o balão na base com destaque visível acima
      bubbleTop = Math.max(12, viewport.h - bubbleEstHeight - 16);
      setaPosicao = 'top';
    }
  }

  const ultimoPasso = indicePasso >= totalPassos - 1;

  return (
    <div className="fixed inset-0 z-[120] select-none">
      {/* Camada invisível que impede cliques acidentais fora do balão durante o tour */}
      <div
        className="fixed inset-0"
        style={{
          backgroundColor: spotlightVisivel ? 'transparent' : 'rgba(2, 6, 23, 0.78)',
        }}
      />

      {/* Recorte iluminado ao redor do elemento real */}
      {spotlightVisivel && (
        <div
          className="fixed pointer-events-none rounded-2xl transition-all duration-200 ease-out"
          style={{
            top: spotlightVisivel.top,
            left: spotlightVisivel.left,
            width: spotlightVisivel.width,
            height: spotlightVisivel.height,
            boxShadow: '0 0 0 9999px rgba(2, 6, 23, 0.78), 0 0 24px 4px rgba(250, 204, 21, 0.55)',
            border: '3px solid #facc15',
          }}
        />
      )}

      {/* Balãozinho com seta apontando */}
      <div
        className="fixed z-[130] transition-all duration-200 ease-out"
        style={{
          top: bubbleTop,
          left: bubbleLeft,
          width: bubbleMaxWidth,
        }}
      >
        {/* Seta apontando para cima */}
        {setaPosicao === 'top' && (
          <div
            className="w-4 h-4 bg-white dark:bg-slate-900 border-l-2 border-t-2 border-amber-400 rotate-45 -mb-2 relative z-10"
            style={{ marginLeft: setaLeftOffset - 8 }}
          />
        )}

        <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border-2 border-amber-400 p-4 space-y-3">
          {/* Topo: indicador de passo + Sair */}
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
              <Sparkles className="w-3 h-3" />
              Passo {indicePasso + 1} de {totalPassos}
            </span>

            <button
              type="button"
              onClick={onPular}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              title="Sair do tour"
            >
              <X className="w-3.5 h-3.5" />
              <span>Sair</span>
            </button>
          </div>

          {/* Texto do passo */}
          <div className="space-y-1">
            <p className="text-sm sm:text-[15px] font-black text-slate-900 dark:text-white leading-snug">
              {passoAtual?.titulo}
            </p>
            {passoAtual?.descricao && (
              <p className="text-xs font-medium text-slate-600 dark:text-slate-300 leading-relaxed">
                {passoAtual.descricao}
              </p>
            )}
          </div>

          {/* Botões: Pular Tour | Próximo */}
          <div className="flex items-center justify-between gap-2 pt-1">
            <button
              type="button"
              onClick={onPular}
              className="px-3 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition cursor-pointer"
            >
              Pular Tour
            </button>

            <button
              type="button"
              onClick={onProximo}
              style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
              className="flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-black shadow-sm hover:opacity-95 active:scale-98 transition inline-flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>{ultimoPasso ? 'Finalizar' : 'Próximo'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Seta apontando para baixo */}
        {setaPosicao === 'bottom' && (
          <div
            className="w-4 h-4 bg-white dark:bg-slate-900 border-r-2 border-b-2 border-amber-400 rotate-45 -mt-2 relative z-10"
            style={{ marginLeft: setaLeftOffset - 8 }}
          />
        )}
      </div>
    </div>
  );
};
