import React, { useState } from 'react';
import {
  ArrowLeft,
  ChevronDown,
  HelpCircle,
  CalendarPlus,
  Users,
  ClipboardCheck,
  Layers,
  Play,
} from 'lucide-react';
import { IconeQuadrinhoTatico, IconeExtraCampo } from './IconesPilares';
import { TipoTourGuiado } from './TourGuiadoOverlay';

interface CentralAjudaModalProps {
  isOpen: boolean;
  onVoltarParaMenu: () => void;
  onFecharTudo: () => void;
  onIniciarTour: (tipo: TipoTourGuiado) => void;
}

const TOURS_DISPONIVEIS: {
  id: TipoTourGuiado;
  titulo: string;
  subtitulo: string;
  icone: React.ReactNode;
}[] = [
  {
    id: 'criar-jogo',
    titulo: 'Como criar um jogo',
    subtitulo: 'Mostra passo a passo na tela de JOGO onde apertar e preencher.',
    icone: <CalendarPlus className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />,
  },
  {
    id: 'montar-escalacao',
    titulo: 'Como montar a escalação',
    subtitulo: 'Leva até a ESCALAÇÃO e mostra posição, jogador e botão salvar.',
    icone: <Users className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />,
  },
  {
    id: 'avaliar-jogador',
    titulo: 'Como avaliar um jogador',
    subtitulo: 'Leva até AVALIAR e aponta atleta, os 5 pilares e salvar avaliação.',
    icone: <ClipboardCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0" />,
  },
];

const PILARES_REFERENCIA = [
  {
    nome: 'FÍSICO',
    icone: <span className="text-base leading-none">⚡</span>,
    descricao: 'Velocidade, arranque, força, resistência e intensidade durante o jogo.',
  },
  {
    nome: 'TÉCNICO',
    icone: <span className="text-base leading-none">⚽</span>,
    descricao: 'Passe, domínio, condução, drible e finalização.',
  },
  {
    nome: 'TÁTICO',
    icone: <IconeQuadrinhoTatico className="w-4 h-4 text-purple-600 dark:text-purple-400" />,
    descricao: 'Posicionamento, leitura de jogo, movimentação e cumprimento da função.',
  },
  {
    nome: 'MENTAL',
    icone: <span className="text-base leading-none">🧠</span>,
    descricao: 'Concentração, tomada de decisão, confiança e controle emocional sob pressão.',
  },
  {
    nome: 'EXTRA-CAMPO',
    icone: <IconeExtraCampo className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />,
    descricao: 'Pontualidade, comportamento, respeito, comprometimento e disciplina.',
  },
];

export const CentralAjudaModal: React.FC<CentralAjudaModalProps> = ({
  isOpen,
  onVoltarParaMenu,
  onFecharTudo,
  onIniciarTour,
}) => {
  const [pilaresAberto, setPilaresAberto] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-50 dark:bg-slate-950 flex flex-col animate-in fade-in duration-150">
      {/* Cabeçalho fixo com botão ← Voltar para o menu */}
      <header className="sticky top-0 z-10 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-2xs">
        <div className="max-w-3xl mx-auto px-4 py-3.5 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => {
              setPilaresAberto(false);
              onVoltarParaMenu();
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 text-sm font-bold transition-colors shrink-0 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar</span>
          </button>

          <div className="flex items-center gap-2 min-w-0">
            <HelpCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
            <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white truncate">
              Central de Ajuda - Como Usar
            </h2>
          </div>

          <button
            type="button"
            onClick={() => {
              setPilaresAberto(false);
              onFecharTudo();
            }}
            className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </header>

      {/* Lista de Tours Guiados Interativos */}
      <main className="flex-1 overflow-y-auto px-4 py-5">
        <div className="max-w-3xl mx-auto space-y-3 pb-10">
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 px-1 pb-1">
            Escolha o que você quer aprender. O app vai te levar até a tela e mostrar onde apertar:
          </p>

          {TOURS_DISPONIVEIS.map((tour) => (
            <button
              key={tour.id}
              type="button"
              onClick={() => {
                setPilaresAberto(false);
                onIniciarTour(tour.id);
              }}
              className="w-full p-4 rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 shadow-2xs flex items-center justify-between gap-3 text-left transition-all active:scale-99 cursor-pointer"
            >
              <div className="flex items-start gap-3 min-w-0">
                <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 shrink-0 mt-0.5">
                  {tour.icone}
                </div>
                <div className="min-w-0">
                  <div className="text-sm sm:text-base font-black text-slate-900 dark:text-white leading-snug">
                    {tour.titulo}
                  </div>
                  <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                    {tour.subtitulo}
                  </div>
                </div>
              </div>

              <span className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-blue-600 text-white text-xs font-black shrink-0 shadow-2xs">
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Ver Tour</span>
              </span>
            </button>
          ))}

          {/* Consulta rápida dos 5 pilares */}
          <div className="pt-2">
            <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
              <button
                type="button"
                onClick={() => setPilaresAberto((prev) => !prev)}
                className="w-full px-4 py-3.5 flex items-center justify-between gap-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 shrink-0">
                    <Layers className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <span className="text-sm font-extrabold text-slate-900 dark:text-white leading-snug">
                    O que são os 5 pilares (Físico, Técnico, Tático, Mental, Extra-Campo)
                  </span>
                </div>
                <ChevronDown
                  className={`w-5 h-5 text-slate-400 shrink-0 transition-transform ${
                    pilaresAberto ? 'rotate-180 text-blue-600' : ''
                  }`}
                />
              </button>

              {pilaresAberto && (
                <div className="px-4 pb-4 pt-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 space-y-2">
                  {PILARES_REFERENCIA.map((pilar) => (
                    <div
                      key={pilar.nome}
                      className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800"
                    >
                      <div className="mt-0.5 shrink-0">{pilar.icone}</div>
                      <div className="text-xs sm:text-sm leading-snug">
                        <span className="font-black text-slate-900 dark:text-white">
                          {pilar.nome}:{' '}
                        </span>
                        <span className="font-medium text-slate-700 dark:text-slate-300">
                          {pilar.descricao}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
