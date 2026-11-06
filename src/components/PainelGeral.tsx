import React from 'react';
import {
  Users,
  Award,
  Calendar,
  Activity,
  ArrowRight,
  TrendingUp,
  FileSpreadsheet,
  Download,
  Plus,
} from 'lucide-react';
import { Atleta, AvaliacaoJogo, NotasPilares } from '../types';
import { RadarChart } from './RadarChart';
import { storageService } from '../services/storage';
import { formatarDataExibicao, dataParaValorOrdenacao } from '../utils/dateUtils';

import { MasterSoccerEscudo } from './MasterSoccerEscudo';

interface PainelGeralProps {
  atletas: Atleta[];
  avaliacoes: AvaliacaoJogo[];
  categorias: string[];
  onNavegarPlantel: (categoria?: string) => void;
  onSelecionarAtleta: (atleta: Atleta) => void;
  onNovaAvaliacao: () => void;
  onNovoAtleta: () => void;
}

export const PainelGeral: React.FC<PainelGeralProps> = ({
  atletas,
  avaliacoes,
  categorias,
  onNavegarPlantel,
  onSelecionarAtleta,
  onNovaAvaliacao,
  onNovoAtleta,
}) => {
  // Médias gerais da base inteira
  const calcularMediasBase = (): NotasPilares => {
    if (avaliacoes.length === 0) {
      return { tecnica: 0, tatica: 0, fisica: 0, mental: 0, disciplinar: 0 };
    }
    const soma = avaliacoes.reduce(
      (acc, av) => {
        acc.tecnica += av.notas.tecnica;
        acc.tatica += av.notas.tatica;
        acc.fisica += av.notas.fisica;
        acc.mental += av.notas.mental;
        acc.disciplinar += av.notas.disciplinar;
        return acc;
      },
      { tecnica: 0, tatica: 0, fisica: 0, mental: 0, disciplinar: 0 }
    );
    const n = avaliacoes.length;
    return {
      tecnica: Number((soma.tecnica / n).toFixed(1)),
      tatica: Number((soma.tatica / n).toFixed(1)),
      fisica: Number((soma.fisica / n).toFixed(1)),
      mental: Number((soma.mental / n).toFixed(1)),
      disciplinar: Number((soma.disciplinar / n).toFixed(1)),
    };
  };

  const mediasBase = calcularMediasBase();

  // Destaques da temporada (ordenados por média geral com pelo menos 1 jogo avaliado)
  const destaques = atletas
    .map((atleta) => {
      const stats = storageService.getEstatisticasAtleta(atleta.id);
      return { atleta, stats };
    })
    .filter((item) => item.stats.totalJogos > 0)
    .sort((a, b) => b.stats.mediaGeral - a.stats.mediaGeral)
    .slice(0, 4);

  // Últimas avaliações cadastradas
  const ultimasAvaliacoes = [...avaliacoes]
    .sort((a, b) => dataParaValorOrdenacao(b.dataJogo) - dataParaValorOrdenacao(a.dataJogo))
    .slice(0, 5);

  const getCorNota = (nota: number) => {
    if (nota >= 8.5) return 'text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border-blue-300 dark:border-blue-800';
    if (nota >= 7.0) return 'text-cyan-700 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/40 border-cyan-300 dark:border-cyan-800';
    if (nota >= 5.0) return 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800';
    return 'text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800';
  };

  return (
    <div className="space-y-6 pb-[120px]">
      {/* Banner de Boas-Vindas Master Soccer (Azul e Amarelo com Escudo Oficial) */}
      <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-blue-900 text-white rounded-2xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-blue-900/60 relative overflow-hidden">
        {/* Glow sutil de fundo dourado */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center gap-5 z-10">
          <MasterSoccerEscudo size={72} className="drop-shadow-lg shrink-0" />
          <div className="space-y-1 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-amber-400 tracking-wider uppercase font-mono bg-blue-950/80 px-2 py-0.5 rounded border border-amber-400/30">
                Master Soccer · Rio de Janeiro
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Controle & Avaliação das Categorias de Base
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Monitoramento dos atletas no Sub-15, Sub-16 e Sub-17 com notas estruturadas nos 5 pilares fundamentais e pareceres detalhados pós-jogo.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0 z-10">
          <button
            onClick={onNovoAtleta}
            className="px-4 py-2.5 text-xs font-bold text-slate-900 bg-amber-400 hover:bg-amber-300 active:scale-98 rounded-xl transition-all shadow-sm"
          >
            + Cadastrar Atleta
          </button>
          <button
            onClick={onNovaAvaliacao}
            className="px-4 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 active:scale-98 rounded-xl transition-all shadow-sm border border-blue-400/30"
          >
            + Avaliar Jogo
          </button>
        </div>
      </div>

      {/* Cards de Métricas e Categorias */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Atletas */}
        <div
          onClick={() => onNavegarPlantel('TODAS')}
          className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:border-blue-500/50 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span>Plantel Total</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-3xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
            {atletas.length}
          </p>
          <div className="flex items-center gap-2 mt-2 text-[11px] text-slate-500">
            <span>{atletas.filter((a) => a.status === 'Ativo').length} ativos</span>
            <span aria-hidden="true">·</span>
            <span className="text-blue-600 font-semibold">Ver lista →</span>
          </div>
        </div>

        {/* Categorias e contagem */}
        {categorias.slice(0, 3).map((cat) => {
          const count = atletas.filter((a) => a.categoria === cat).length;
          const avaliacoesCat = avaliacoes.filter((av) => av.categoria === cat).length;
          return (
            <div
              key={cat}
              onClick={() => onNavegarPlantel(cat)}
              className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:border-amber-500/50 cursor-pointer transition-all"
            >
              <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
                <span className="font-bold text-slate-700 dark:text-slate-300">{cat}</span>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200/50">
                  {avaliacoesCat} jogos
                </span>
              </div>
              <p className="text-3xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
                {count} <span className="text-sm font-normal text-slate-400">atletas</span>
              </p>
              <div className="mt-2 text-[11px] text-blue-600 dark:text-blue-400 font-semibold">
                Abrir categoria →
              </div>
            </div>
          );
        })}
      </div>

      {/* Grid de 2 Colunas: Radar Médio da Base + Atletas Destaques */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Radar Médio da Base */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col items-center justify-between">
          <div className="w-full flex items-center justify-between mb-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Média Geral dos 5 Pilares
              </h3>
              <p className="text-xs text-slate-500">
                Balanço consolidado de todas as partidas avaliadas
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 dark:bg-blue-950/50 px-2.5 py-1 rounded-lg border border-blue-200 dark:border-blue-800">
              {avaliacoes.length} Jogos
            </span>
          </div>

          <div className="py-2">
            <RadarChart notas={mediasBase} size={280} />
          </div>

          <div className="w-full grid grid-cols-5 gap-1 text-center pt-3 border-t border-slate-100 dark:border-slate-800">
            <div>
              <span className="text-[10px] text-slate-400 block">TÉC</span>
              <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200 tabular-nums">
                {mediasBase.tecnica.toFixed(1)}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">TÁT</span>
              <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200 tabular-nums">
                {mediasBase.tatica.toFixed(1)}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">FÍS</span>
              <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200 tabular-nums">
                {mediasBase.fisica.toFixed(1)}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">MEN</span>
              <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200 tabular-nums">
                {mediasBase.mental.toFixed(1)}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">DISC</span>
              <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200 tabular-nums">
                {mediasBase.disciplinar.toFixed(1)}
              </span>
            </div>
          </div>
        </div>

        {/* Atletas Destaques da Temporada */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Destaques da Temporada
              </h3>
              <p className="text-xs text-slate-500">
                Atletas com melhor rendimento acumulado nos jogos
              </p>
            </div>
            <button
              onClick={() => onNavegarPlantel('TODAS')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <span>Ver Todos</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {destaques.map(({ atleta, stats }) => (
              <div
                key={atleta.id}
                onClick={() => onSelecionarAtleta(atleta)}
                className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800 transition-all cursor-pointer flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-700 overflow-hidden shrink-0 flex items-center justify-center font-bold text-xs text-slate-600 dark:text-slate-300">
                    {atleta.fotoUrl ? (
                      <img src={atleta.fotoUrl} alt={atleta.nome} className="w-full h-full object-cover" />
                    ) : (
                      atleta.nome
                        .split(' ')
                        .slice(0, 2)
                        .map((n) => n[0])
                        .join('')
                        .toUpperCase()
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/50 px-1.5 py-0.2 rounded border border-blue-200/40">
                        {atleta.categoria}
                      </span>
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {atleta.nome}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                      <span>{atleta.posicao}</span>
                      <span aria-hidden="true">·</span>
                      <span>{stats.totalJogos} {stats.totalJogos === 1 ? 'partida' : 'partidas'}</span>
                      <span aria-hidden="true">·</span>
                      <span className="text-blue-600 font-medium">Ponto forte: {stats.melhorPilar.nome}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block font-medium">Média</span>
                    <span
                      className={`text-xs font-mono font-bold px-2 py-0.5 rounded border tabular-nums ${getCorNota(
                        stats.mediaGeral
                      )}`}
                    >
                      {stats.mediaGeral.toFixed(1)}
                    </span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 mt-3 flex items-center justify-between text-xs text-slate-500">
            <span>Avaliações com critérios técnicos padronizados de 1 a 10</span>
            <button
              onClick={() => storageService.exportarAvaliacoesCsv()}
              className="inline-flex items-center gap-1.5 text-xs text-blue-600 font-semibold hover:underline"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Baixar Planilha CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Feed de Últimas Avaliações Registradas */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Últimas Avaliações Pós-Jogo Registradas
            </h3>
            <p className="text-xs text-slate-500">
              Pareceres e notas técnicas mais recentes da comissão
            </p>
          </div>
          <button
            onClick={onNovaAvaliacao}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5 text-amber-500" />
            <span>Avaliar Nova Partida</span>
          </button>
        </div>

        <div className="space-y-3">
          {ultimasAvaliacoes.map((av) => {
            const atleta = atletas.find((a) => a.id === av.atletaId);
            return (
              <div
                key={av.id}
                className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-2.5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      {atleta ? atleta.nome : 'Atleta'}
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 border border-blue-200/40">
                      {av.categoria}
                    </span>
                    <span className="text-xs text-slate-400">·</span>
                    <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                      vs {av.adversario}
                    </span>
                    {av.resultado && (
                      <span className="text-xs font-mono font-semibold px-1.5 py-0.2 bg-slate-200 dark:bg-slate-700 rounded text-slate-700 dark:text-slate-300">
                        {av.resultado}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-slate-400">
                      {formatarDataExibicao(av.dataJogo)}
                    </span>
                    <span
                      className={`text-xs font-mono font-bold px-2 py-0.5 rounded border tabular-nums ${getCorNota(
                        av.notaGeral
                      )}`}
                    >
                      Nota {av.notaGeral.toFixed(1)}
                    </span>
                  </div>
                </div>

                {/* 5 Notas rápidas */}
                <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-600 dark:text-slate-400">
                  <span>Téc: <strong className="font-mono text-slate-800 dark:text-slate-200">{av.notas.tecnica.toFixed(1)}</strong></span>
                  <span>Tát: <strong className="font-mono text-slate-800 dark:text-slate-200">{av.notas.tatica.toFixed(1)}</strong></span>
                  <span>Fís: <strong className="font-mono text-slate-800 dark:text-slate-200">{av.notas.fisica.toFixed(1)}</strong></span>
                  <span>Men: <strong className="font-mono text-slate-800 dark:text-slate-200">{av.notas.mental.toFixed(1)}</strong></span>
                  <span>Disc: <strong className="font-mono text-slate-800 dark:text-slate-200">{av.notas.disciplinar.toFixed(1)}</strong></span>
                </div>

                {/* Parecer / Observação */}
                <p className="text-xs text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900/60 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 leading-relaxed italic">
                  "{av.observacoes}"
                </p>

                {atleta && (
                  <div className="flex justify-end">
                    <button
                      onClick={() => onSelecionarAtleta(atleta)}
                      className="text-[11px] font-semibold text-blue-600 hover:underline"
                    >
                      Ver histórico e ficha completa de {atleta.nome.split(' ')[0]} →
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
