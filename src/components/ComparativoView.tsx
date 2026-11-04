import React, { useState } from 'react';
import { Users2, Award, ArrowRightLeft } from 'lucide-react';
import { Atleta, AvaliacaoJogo } from '../types';
import { storageService } from '../services/storage';
import { RadarChart } from './RadarChart';

interface ComparativoViewProps {
  atletas: Atleta[];
  avaliacoes: AvaliacaoJogo[];
  onSelecionarAtleta: (atleta: Atleta) => void;
}

export const ComparativoView: React.FC<ComparativoViewProps> = ({
  atletas,
  onSelecionarAtleta,
}) => {
  const [atletaIdA, setAtletaIdA] = useState<string>(atletas[0]?.id || '');
  const [atletaIdB, setAtletaIdB] = useState<string>(atletas[1]?.id || '');

  const atletaA = atletas.find((a) => a.id === atletaIdA);
  const atletaB = atletas.find((a) => a.id === atletaIdB);

  const statsA = atletaA ? storageService.getEstatisticasAtleta(atletaA.id) : null;
  const statsB = atletaB ? storageService.getEstatisticasAtleta(atletaB.id) : null;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Cabeçalho */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400">
            <ArrowRightLeft className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Comparativo Direto de Desempenho
            </h2>
            <p className="text-xs text-slate-500">
              Analise dois atletas da base lado a lado no radar dos 5 pilares para apoiar a escalação e o plano de treino
            </p>
          </div>
        </div>

        {/* Seletores de Atletas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
          <div>
            <label className="block text-xs font-bold text-blue-700 dark:text-blue-400 mb-1">
              Atleta A (Azul Master)
            </label>
            <select
              value={atletaIdA}
              onChange={(e) => setAtletaIdA(e.target.value)}
              className="w-full h-10 leading-normal px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {atletas.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nome} ({a.categoria} · {a.posicao})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-amber-600 dark:text-amber-400 mb-1">
              Atleta B (Amarelo / Dourado)
            </label>
            <select
              value={atletaIdB}
              onChange={(e) => setAtletaIdB(e.target.value)}
              className="w-full h-10 leading-normal px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              {atletas.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nome} ({a.categoria} · {a.posicao})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {atletaA && atletaB && statsA && statsB && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Radar Sobreposto */}
          <div className="lg:col-span-5 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col items-center justify-center">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
              Radar de Sobreposição dos 5 Pilares
            </h3>
            <RadarChart
              notas={statsA.mediasPilares}
              notasComparativo={statsB.mediasPilares}
              nomeAtleta={atletaA.nome.split(' ')[0]}
              nomeComparativo={atletaB.nome.split(' ')[0]}
              size={290}
            />
          </div>

          {/* Tabela de Comparação Lado a Lado */}
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Quadro de Atributos Comparados
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800">
                    <th className="py-2.5 text-left text-slate-500 font-semibold">Atributo</th>
                    <th className="py-2.5 text-center font-bold text-blue-700 dark:text-blue-400">
                      {atletaA.nome}
                      <span className="block text-[10px] font-normal text-slate-400">
                        {atletaA.categoria}
                      </span>
                    </th>
                    <th className="py-2.5 text-center font-bold text-amber-600 dark:text-amber-400">
                      {atletaB.nome}
                      <span className="block text-[10px] font-normal text-slate-400">
                        {atletaB.categoria}
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  <tr>
                    <td className="py-2.5 text-slate-600 dark:text-slate-400 font-medium">Posição</td>
                    <td className="py-2.5 text-center font-semibold">{atletaA.posicao}</td>
                    <td className="py-2.5 text-center font-semibold">{atletaB.posicao}</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 text-slate-600 dark:text-slate-400 font-medium">Pé Dominante</td>
                    <td className="py-2.5 text-center">{atletaA.pernaDominante}</td>
                    <td className="py-2.5 text-center">{atletaB.pernaDominante}</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 text-slate-600 dark:text-slate-400 font-medium">Jogos Avaliados</td>
                    <td className="py-2.5 text-center font-mono font-bold tabular-nums">{statsA.totalJogos}</td>
                    <td className="py-2.5 text-center font-mono font-bold tabular-nums">{statsB.totalJogos}</td>
                  </tr>
                  <tr className="bg-slate-50/50 dark:bg-slate-800/30">
                    <td className="py-2.5 font-bold text-slate-900 dark:text-white">Média Geral</td>
                    <td className="py-2.5 text-center font-mono font-bold text-blue-700 dark:text-blue-400 text-sm tabular-nums">
                      {statsA.totalJogos > 0 ? statsA.mediaGeral.toFixed(1) : '-'}
                    </td>
                    <td className="py-2.5 text-center font-mono font-bold text-amber-600 dark:text-amber-400 text-sm tabular-nums">
                      {statsB.totalJogos > 0 ? statsB.mediaGeral.toFixed(1) : '-'}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 text-slate-600 dark:text-slate-400">1. Técnica</td>
                    <td className="py-2 text-center font-mono font-semibold tabular-nums">
                      {statsA.mediasPilares.tecnica.toFixed(1)}
                    </td>
                    <td className="py-2 text-center font-mono font-semibold tabular-nums">
                      {statsB.mediasPilares.tecnica.toFixed(1)}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 text-slate-600 dark:text-slate-400">2. Tática</td>
                    <td className="py-2 text-center font-mono font-semibold tabular-nums">
                      {statsA.mediasPilares.tatica.toFixed(1)}
                    </td>
                    <td className="py-2 text-center font-mono font-semibold tabular-nums">
                      {statsB.mediasPilares.tatica.toFixed(1)}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 text-slate-600 dark:text-slate-400">3. Física</td>
                    <td className="py-2 text-center font-mono font-semibold tabular-nums">
                      {statsA.mediasPilares.fisica.toFixed(1)}
                    </td>
                    <td className="py-2 text-center font-mono font-semibold tabular-nums">
                      {statsB.mediasPilares.fisica.toFixed(1)}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 text-slate-600 dark:text-slate-400">4. Mental</td>
                    <td className="py-2 text-center font-mono font-semibold tabular-nums">
                      {statsA.mediasPilares.mental.toFixed(1)}
                    </td>
                    <td className="py-2 text-center font-mono font-semibold tabular-nums">
                      {statsB.mediasPilares.mental.toFixed(1)}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 text-slate-600 dark:text-slate-400">5. Disciplinar</td>
                    <td className="py-2 text-center font-mono font-semibold tabular-nums">
                      {statsA.mediasPilares.disciplinar.toFixed(1)}
                    </td>
                    <td className="py-2 text-center font-mono font-semibold tabular-nums">
                      {statsB.mediasPilares.disciplinar.toFixed(1)}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 text-slate-600 dark:text-slate-400 font-medium">Maior Ponto Forte</td>
                    <td className="py-2.5 text-center font-medium text-blue-600 dark:text-blue-400">{statsA.melhorPilar.nome}</td>
                    <td className="py-2.5 text-center font-medium text-amber-600 dark:text-amber-400">{statsB.melhorPilar.nome}</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 text-slate-600 dark:text-slate-400 font-medium">Aprimoramento</td>
                    <td className="py-2.5 text-center font-medium text-amber-600">{statsA.pilarAtencao.nome}</td>
                    <td className="py-2.5 text-center font-medium text-amber-600">{statsB.pilarAtencao.nome}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => onSelecionarAtleta(atletaA)}
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
              >
                Abrir relatório de {atletaA.nome.split(' ')[0]} →
              </button>
              <button
                onClick={() => onSelecionarAtleta(atletaB)}
                className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline"
              >
                Abrir relatório de {atletaB.nome.split(' ')[0]} →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
