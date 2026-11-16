import React, { useState } from 'react';
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  HelpCircle,
  CalendarPlus,
  Users,
  ClipboardCheck,
  Layers,
  Trophy,
} from 'lucide-react';
import { IconeQuadrinhoTatico, IconeExtraCampo } from './IconesPilares';

interface CentralAjudaModalProps {
  isOpen: boolean;
  onVoltarParaMenu: () => void;
  onFecharTudo: () => void;
}

interface TopicoAjuda {
  id: string;
  titulo: string;
  icone: React.ReactNode;
  passos?: string[];
  pilares?: {
    nome: string;
    icone: React.ReactNode;
    descricao: string;
  }[];
}

const TOPICOS_AJUDA: TopicoAjuda[] = [
  {
    id: 'criar-jogo',
    titulo: 'Como criar um jogo',
    icone: <CalendarPlus className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />,
    passos: [
      '1. Toque na aba JOGO no menu inferior.',
      '2. Toque no botão azul "+ Novo Jogo".',
      '3. Preencha categoria, competição, adversário, data e horário.',
      '4. Toque em Salvar para adicionar a partida na agenda.',
    ],
  },
  {
    id: 'montar-escalacao',
    titulo: 'Como montar a escalação',
    icone: <Users className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />,
    passos: [
      '1. Vá na aba JOGO e encontre a partida desejada.',
      '2. Toque no botão "Escalação" dentro do card do jogo.',
      '3. Escolha a formação e selecione os titulares e reservas.',
      '4. Toque em "Salvar Escalação do Jogo" (ou em "← Voltar" para sair sem salvar).',
    ],
  },
  {
    id: 'avaliar-jogador',
    titulo: 'Como avaliar um jogador',
    icone: <ClipboardCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0" />,
    passos: [
      '1. Na aba JOGO, toque em "Avaliar >" no card da partida.',
      '2. Toque no nome do atleta para abrir a ficha dele.',
      '3. Preencha o Tempo de Jogo (1º e 2º tempo) e dê as notas nos 5 pilares.',
      '4. Marque Pontos em Destaque e Pontos de Atenção (se desejar) e toque em "Salvar Avaliação deste Atleta".',
    ],
  },
  {
    id: 'cinco-pilares',
    titulo: 'O que são os 5 pilares (Físico, Técnico, Tático, Mental, Extra-Campo)',
    icone: <Layers className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />,
    pilares: [
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
    ],
  },
  {
    id: 'ver-trofeus',
    titulo: 'Como ver os troféus',
    icone: <Trophy className="w-5 h-5 text-amber-500 shrink-0" />,
    passos: [
      '1. Toque na aba TROFÉUS no menu inferior.',
      '2. Veja o total de títulos de Ouro (Campeão), Prata (Vice) e a galeria completa.',
      '3. Para cadastrar uma nova conquista, toque em "+ Adicionar novo troféu".',
    ],
  },
];

export const CentralAjudaModal: React.FC<CentralAjudaModalProps> = ({
  isOpen,
  onVoltarParaMenu,
  onFecharTudo,
}) => {
  const [topicoAbertoId, setTopicoAbertoId] = useState<string | null>(null);

  if (!isOpen) return null;

  const toggleTopico = (id: string) => {
    setTopicoAbertoId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-50 dark:bg-slate-950 flex flex-col animate-in fade-in duration-150">
      {/* Cabeçalho fixo com botão ← Voltar para o menu */}
      <header className="sticky top-0 z-10 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-2xs">
        <div className="max-w-3xl mx-auto px-4 py-3.5 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => {
              setTopicoAbertoId(null);
              onVoltarParaMenu();
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 text-sm font-bold transition-colors shrink-0"
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
              setTopicoAbertoId(null);
              onFecharTudo();
            }}
            className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
          >
            Fechar
          </button>
        </div>
      </header>

      {/* Lista simples de tópicos */}
      <main className="flex-1 overflow-y-auto px-4 py-5">
        <div className="max-w-3xl mx-auto space-y-3 pb-10">
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400 px-1 pb-1">
            Toque em um tema abaixo para ver o passo a passo:
          </p>

          {TOPICOS_AJUDA.map((topico) => {
            const aberto = topicoAbertoId === topico.id;
            return (
              <div
                key={topico.id}
                className={`rounded-2xl border transition-all overflow-hidden ${
                  aberto
                    ? 'bg-white dark:bg-slate-900 border-blue-500 shadow-sm ring-1 ring-blue-500/20'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-2xs'
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggleTopico(topico.id)}
                  className="w-full px-4 py-4 flex items-center justify-between gap-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 shrink-0">
                      {topico.icone}
                    </div>
                    <span className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white leading-snug">
                      {topico.titulo}
                    </span>
                  </div>
                  {aberto ? (
                    <ChevronDown className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-slate-400 shrink-0" />
                  )}
                </button>

                {aberto && (
                  <div className="px-4 pb-4 pt-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40">
                    {topico.passos && (
                      <div className="space-y-2.5 pt-1">
                        {topico.passos.map((passo, idx) => (
                          <p
                            key={idx}
                            className="text-sm font-medium text-slate-700 dark:text-slate-200 leading-relaxed"
                          >
                            {passo}
                          </p>
                        ))}
                      </div>
                    )}

                    {topico.pilares && (
                      <div className="space-y-2.5 pt-1">
                        {topico.pilares.map((pilar) => (
                          <div
                            key={pilar.nome}
                            className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800"
                          >
                            <div className="mt-0.5 shrink-0">{pilar.icone}</div>
                            <div className="text-sm leading-snug">
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
                )}
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
};
