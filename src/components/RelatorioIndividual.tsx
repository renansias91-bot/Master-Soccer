import React from 'react';
import {
  Printer,
  Calendar,
  Clock,
  TrendingUp,
  Award,
  ArrowLeft,
  Plus,
  Shield,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';
import { Atleta, AvaliacaoJogo } from '../types';
import { storageService } from '../services/storage';
import { RadarChart } from './RadarChart';
import { EvolucaoChart } from './EvolucaoChart';
import { formatarDataExibicao, dataParaValorOrdenacao } from '../utils/dateUtils';

import { MasterSoccerEscudo } from './MasterSoccerEscudo';

interface RelatorioIndividualProps {
  atleta: Atleta;
  avaliacoes: AvaliacaoJogo[];
  onVoltar: () => void;
  onNovaAvaliacao: (atletaId: string) => void;
  onEditarAtleta: (atleta: Atleta) => void;
}

export const RelatorioIndividual: React.FC<RelatorioIndividualProps> = ({
  atleta,
  avaliacoes,
  onVoltar,
  onNovaAvaliacao,
  onEditarAtleta,
}) => {
  // Filtra as avaliações deste atleta
  const avaliacoesAtleta = avaliacoes
    .filter((av) => av.atletaId === atleta.id)
    .sort((a, b) => dataParaValorOrdenacao(b.dataJogo) - dataParaValorOrdenacao(a.dataJogo));

  const stats = storageService.getEstatisticasAtleta(atleta.id);

  // Calcula idade do atleta
  const calcularIdade = (dataNasc: string) => {
    const hoje = new Date();
    const nasc = new Date(dataNasc);
    let idade = hoje.getFullYear() - nasc.getFullYear();
    const m = hoje.getMonth() - nasc.getMonth();
    if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) {
      idade--;
    }
    return idade;
  };

  const idade = calcularIdade(atleta.dataNascimento);

  const handlePrint = () => {
    window.print();
  };

  const getCorNota = (nota: number) => {
    if (nota >= 8.5) return 'text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border-blue-300 dark:border-blue-800';
    if (nota >= 7.0) return 'text-cyan-700 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/40 border-cyan-300 dark:border-cyan-800';
    if (nota >= 5.0) return 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800';
    return 'text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800';
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Barra de Ações Superior (Escondida na impressão) */}
      <div className="flex flex-wrap items-center justify-between gap-3 no-print">
        <button
          onClick={onVoltar}
          className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar ao Plantel</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onEditarAtleta(atleta)}
            className="px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg transition-all"
          >
            Editar Atleta
          </button>
          <button
            onClick={() => onNovaAvaliacao(atleta.id)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-all"
          >
            <Plus className="w-4 h-4 text-amber-300" />
            <span>Avaliar Jogo</span>
          </button>
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg border border-amber-300 transition-all shadow-xs"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir / Salvar PDF</span>
          </button>
        </div>
      </div>

      {/* Relatório Documental (Estruturado para Tela e Impressão A4) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-6 sm:p-8 space-y-6 print:p-0 print:border-none print:shadow-none">
        {/* Cabeçalho do Relatório com Escudo Master Soccer */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-6 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-4">
            {/* Foto ou Avatar do Atleta */}
            <div className="relative w-20 h-20 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 border-2 border-blue-500/40 shrink-0 flex items-center justify-center">
              {atleta.fotoUrl ? (
                <img
                  src={atleta.fotoUrl}
                  alt={atleta.nome}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-xl font-extrabold text-blue-600 dark:text-blue-400">
                  {atleta.nome
                    .split(' ')
                    .slice(0, 2)
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()}
                </span>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 text-xs font-bold bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 rounded border border-blue-200/50">
                  {atleta.categoria}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  {atleta.status}
                </span>
              </div>
              <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1">
                {atleta.nome}
                {atleta.apelido && (
                  <span className="text-slate-500 dark:text-slate-400 font-normal ml-2">
                    "{atleta.apelido}"
                  </span>
                )}
              </h1>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 dark:text-slate-400 mt-1">
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {atleta.posicao}
                </span>
                <span aria-hidden="true">·</span>
                <span>{idade} anos ({new Date(atleta.dataNascimento).toLocaleDateString('pt-BR')})</span>
                <span aria-hidden="true">·</span>
                <span>Pé Dominante: <strong>{atleta.pernaDominante}</strong></span>
                {atleta.altura && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="tabular-nums">{atleta.altura} cm</span>
                  </>
                )}
                {atleta.peso && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="tabular-nums">{atleta.peso} kg</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Selo de Avaliação da Temporada & Escudo do Clube */}
          <div className="flex items-center gap-5">
            <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto p-3 sm:p-0 rounded-xl bg-slate-50 dark:bg-slate-800/40 sm:bg-transparent border sm:border-none border-slate-200 dark:border-slate-800">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">
                Média Geral da Temporada
              </span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-3xl sm:text-4xl font-extrabold font-mono text-blue-600 dark:text-blue-400 tabular-nums">
                  {stats.totalJogos > 0 ? stats.mediaGeral.toFixed(1) : '-'}
                </span>
                <span className="text-sm font-mono text-slate-400">/10</span>
              </div>
              <span className="text-[11px] text-slate-500 mt-0.5">
                Baseado em {stats.totalJogos} {stats.totalJogos === 1 ? 'partida' : 'partidas'}
              </span>
            </div>

            <MasterSoccerEscudo size={58} className="hidden sm:block drop-shadow-sm shrink-0" />
          </div>
        </div>

        {/* Faixa de KPIs e Destaques do Atleta */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 print-break-inside-avoid">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span>Partidas Avaliadas</span>
            </div>
            <p className="text-2xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
              {stats.totalJogos}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">Na temporada atual</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
              <Clock className="w-4 h-4 text-blue-600" />
              <span>Minutagem Total</span>
            </div>
            <p className="text-2xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
              {stats.minutosTotais}'
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              Média de {stats.totalJogos ? Math.round(stats.minutosTotais / stats.totalJogos) : 0}' por jogo
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
              <Award className="w-4 h-4 text-amber-500" />
              <span>Maior Ponto Forte</span>
            </div>
            <p className="text-lg font-bold text-slate-900 dark:text-white">
              {stats.melhorPilar.nome}
            </p>
            <p className="text-xs font-mono text-blue-600 dark:text-blue-400 font-semibold mt-1 tabular-nums">
              Nota {stats.melhorPilar.nota > 0 ? stats.melhorPilar.nota.toFixed(1) : '-'} / 10
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
              <TrendingUp className="w-4 h-4 text-amber-600" />
              <span>Oportunidade de Evolução</span>
            </div>
            <p className="text-lg font-bold text-slate-900 dark:text-white">
              {stats.pilarAtencao.nome}
            </p>
            <p className="text-xs font-mono text-amber-600 dark:text-amber-400 font-semibold mt-1 tabular-nums">
              Nota {stats.pilarAtencao.nota > 0 ? stats.pilarAtencao.nota.toFixed(1) : '-'} / 10
            </p>
          </div>
        </div>

        {/* Visão Técnica: Gráfico Radar dos 5 Pilares + Detalhamento das Dimensões */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center print-break-inside-avoid">
          {/* Radar Pentagonal */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center p-4 bg-slate-50/70 dark:bg-slate-800/30 rounded-2xl border border-slate-200/80 dark:border-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
              Pentágono de Habilidades (5 Pilares)
            </h3>
            {stats.totalJogos > 0 ? (
              <RadarChart notas={stats.mediasPilares} size={290} />
            ) : (
              <div className="py-12 text-center text-xs text-slate-400">
                Aguardando a primeira avaliação de jogo deste atleta.
              </div>
            )}
          </div>

          {/* Cards das 5 Dimensões Avaliadas */}
          <div className="lg:col-span-7 space-y-2.5">
            {[
              {
                nome: '1. Parte Técnica',
                desc: 'Qualidade do passe, primeiro toque orientado, drible, condução e finalização sob pressão.',
                nota: stats.mediasPilares.tecnica,
              },
              {
                nome: '2. Parte Tática',
                desc: 'Compreensão do modelo de jogo, posicionamento, temporização, ocupação de espaço e recomposição.',
                nota: stats.mediasPilares.tatica,
              },
              {
                nome: '3. Parte Física',
                desc: 'Velocidade de reação e deslocamento, vigor nos duelos corporais, explosão e resistência aeróbica.',
                nota: stats.mediasPilares.fisica,
              },
              {
                nome: '4. Parte Mental',
                desc: 'Foco competitivo, resiliência perante o placar adverso, coragem para arriscar e estabilidade emocional.',
                nota: stats.mediasPilares.mental,
              },
              {
                nome: '5. Parte Disciplinar',
                desc: 'Espírito de equipe, respeito irrestrito a árbitros e adversários, pontualidade e aplicação tática.',
                nota: stats.mediasPilares.disciplinar,
              },
            ].map((pilar, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4"
              >
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-slate-900 dark:text-white">
                    {pilar.nome}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                    {pilar.desc}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="w-24 sm:w-32 h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden hidden sm:block">
                    <div
                      className="h-full bg-blue-600 dark:bg-blue-500 rounded-full transition-all"
                      style={{ width: `${(pilar.nota / 10) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-bold font-mono text-blue-600 dark:text-blue-400 tabular-nums min-w-[2.5rem] text-right">
                    {pilar.nota > 0 ? pilar.nota.toFixed(1) : '-'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Gráfico de Evolução Cronológica na Temporada */}
        {avaliacoesAtleta.length > 1 && (
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/30 border border-slate-200/80 dark:border-slate-800 print-break-inside-avoid">
            <EvolucaoChart avaliacoes={avaliacoesAtleta} />
          </div>
        )}

        {/* Parecer Consolidado e Observações da Comissão Técnica */}
        <div className="space-y-4 print-break-inside-avoid">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              Histórico Detalhado dos Jogos & Observações de Progresso
            </h3>
            <span className="text-xs text-slate-500">
              {avaliacoesAtleta.length} {avaliacoesAtleta.length === 1 ? 'registro' : 'registros'}
            </span>
          </div>

          {avaliacoesAtleta.length === 0 ? (
            <div className="p-8 text-center rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-slate-500 text-sm">
              <p>Nenhuma avaliação pós-jogo foi registrada para este atleta ainda.</p>
              <button
                onClick={() => onNovaAvaliacao(atleta.id)}
                className="mt-3 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg inline-flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4 text-amber-300" />
                <span>Registrar Primeira Avaliação</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {avaliacoesAtleta.map((av) => (
                <div
                  key={av.id}
                  className="p-4 sm:p-5 rounded-xl bg-white dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/80 space-y-3 print-break-inside-avoid"
                >
                  {/* Cabeçalho do Jogo */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-700/50">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="font-bold text-slate-900 dark:text-white text-sm">
                        vs {av.adversario}
                      </span>
                      {av.resultado && (
                        <span className="px-2 py-0.5 font-mono font-bold text-xs bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded">
                          {av.resultado}
                        </span>
                      )}
                      <span className="text-slate-400">·</span>
                      <span className="text-slate-600 dark:text-slate-400">{av.competicao}</span>
                      <span className="text-slate-400">·</span>
                      <span className="font-mono text-slate-500">
                        {formatarDataExibicao(av.dataJogo)}
                      </span>
                      <span className="text-slate-400">·</span>
                      <span className="font-mono text-slate-500">{av.minutosJogados}' jogados</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500">Nota da Partida:</span>
                      <span
                        className={`text-sm font-mono font-bold px-2 py-0.5 rounded border tabular-nums ${getCorNota(
                          av.notaGeral
                        )}`}
                      >
                        {av.notaGeral.toFixed(1)}
                      </span>
                    </div>
                  </div>

                  {/* Notas dos 5 Pilares na Partida */}
                  <div className="grid grid-cols-5 gap-2 text-center py-1 bg-slate-50 dark:bg-slate-900/50 rounded-lg p-2 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">TÉCNICA</span>
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200 tabular-nums">
                        {av.notas.tecnica.toFixed(1)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">TÁTICA</span>
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200 tabular-nums">
                        {av.notas.tatica.toFixed(1)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">FÍSICA</span>
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200 tabular-nums">
                        {av.notas.fisica.toFixed(1)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">MENTAL</span>
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200 tabular-nums">
                        {av.notas.mental.toFixed(1)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">DISCIPLINAR</span>
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200 tabular-nums">
                        {av.notas.disciplinar.toFixed(1)}
                      </span>
                    </div>
                  </div>

                  {/* Observações de Progresso e Desenvolvimento */}
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                      Parecer & Observações de Desenvolvimento:
                    </span>
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50/50 dark:bg-slate-900/30 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                      {av.observacoes}
                    </p>
                  </div>

                  {/* Tags de Pontos Fortes e Atenção */}
                  {((av.pontosFortes && av.pontosFortes.length > 0) ||
                    (av.pontosMelhoria && av.pontosMelhoria.length > 0)) && (
                    <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                      {av.pontosFortes?.map((pt, i) => (
                        <span
                          key={`f-${i}`}
                          className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-medium"
                        >
                          ✓ {pt}
                        </span>
                      ))}
                      {av.pontosMelhoria?.map((pt, i) => (
                        <span
                          key={`m-${i}`}
                          className="px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 font-medium"
                        >
                          △ {pt}
                        </span>
                      ))}
                    </div>
                  )}

                  {av.avaliador && (
                    <div className="text-[11px] text-slate-400 text-right">
                      Avaliador responsável: {av.avaliador}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Rodapé da Ficha Oficial (Impressão) */}
        <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <span>Master Soccer · Rio de Janeiro - Brasil · Centro de Inteligência e Avaliação de Base</span>
          <span className="font-mono">
            Relatório emitido em {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
    </div>
  );
};
