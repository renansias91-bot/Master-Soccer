import React, { useState } from 'react';
import { AvaliacaoJogo, NotasPilares } from '../types';
import { formatarDataExibicao, dataParaValorOrdenacao } from '../utils/dateUtils';

interface EvolucaoChartProps {
  avaliacoes: AvaliacaoJogo[];
}

type MetricaVisualizada = 'geral' | keyof NotasPilares;

export const EvolucaoChart: React.FC<EvolucaoChartProps> = ({ avaliacoes }) => {
  const [metrica, setMetrica] = useState<MetricaVisualizada>('geral');

  // Ordena cronologicamente
  const sorted = [...avaliacoes].sort(
    (a, b) => dataParaValorOrdenacao(a.dataJogo) - dataParaValorOrdenacao(b.dataJogo)
  );

  if (sorted.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-slate-500">
        Nenhum jogo registrado ainda para exibir evolução cronológica.
      </div>
    );
  }

  const width = 640;
  const height = 200;
  const paddingX = 40;
  const paddingY = 30;
  const graphWidth = width - paddingX * 2;
  const graphHeight = height - paddingY * 2;

  const getValor = (av: AvaliacaoJogo, m: MetricaVisualizada): number => {
    if (m === 'geral') return av.notaGeral;
    return av.notas[m] || 0;
  };

  const valores = sorted.map((av) => getValor(av, metrica));
  const minVal = 0;
  const maxVal = 10;

  const points = sorted.map((av, index) => {
    const val = getValor(av, metrica);
    const x =
      sorted.length === 1
        ? width / 2
        : paddingX + (index / (sorted.length - 1)) * graphWidth;
    const y = paddingY + graphHeight - ((val - minVal) / (maxVal - minVal)) * graphHeight;
    return { x, y, val, av };
  });

  const pathD = points.length === 1
    ? `M ${points[0].x - 20} ${points[0].y} L ${points[0].x + 20} ${points[0].y}`
    : points.reduce((acc, p, idx) => (idx === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`), '');

  const areaD = points.length > 1
    ? `${pathD} L ${points[points.length - 1].x} ${height - paddingY} L ${points[0].x} ${height - paddingY} Z`
    : '';

  return (
    <div className="w-full">
      {/* Seletor de métrica */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
          Evolução ao Longo da Temporada
        </span>
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg text-xs">
          {(
            [
              { key: 'geral', label: 'Geral' },
              { key: 'tecnica', label: 'Técnica' },
              { key: 'tatica', label: 'Tática' },
              { key: 'fisica', label: 'Física' },
              { key: 'mental', label: 'Mental' },
              { key: 'disciplinar', label: 'Disciplinar' },
            ] as const
          ).map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setMetrica(item.key)}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
                metrica === item.key
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Gráfico SVG */}
      <div className="relative w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-48 select-none overflow-visible"
        >
          {/* Linhas de grade horizontais (notas 2, 4, 6, 8, 10) */}
          {[2, 4, 6, 8, 10].map((level) => {
            const y = paddingY + graphHeight - ((level - minVal) / (maxVal - minVal)) * graphHeight;
            return (
              <g key={`lvl-${level}`}>
                <line
                  x1={paddingX}
                  y1={y}
                  x2={width - paddingX}
                  y2={y}
                  stroke="currentColor"
                  strokeWidth="1"
                  strokeDasharray="2,3"
                  className="text-slate-200 dark:text-slate-700/60"
                />
                <text
                  x={paddingX - 8}
                  y={y + 3}
                  textAnchor="end"
                  className="text-[9px] font-mono fill-slate-400 dark:fill-slate-500 tabular-nums"
                >
                  {level}
                </text>
              </g>
            );
          })}

          {/* Área preenchida */}
          {areaD && (
            <path
              d={areaD}
              fill="rgba(37, 99, 235, 0.15)"
              className="transition-all duration-300"
            />
          )}

          {/* Linha principal (Azul Real) */}
          <path
            d={pathD}
            fill="none"
            stroke="#2563EB"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="transition-all duration-300"
          />

          {/* Pontos nos jogos (Dourado com anel azul) */}
          {points.map((p, idx) => (
            <g key={`pt-${idx}`} className="group cursor-pointer">
              <circle
                cx={p.x}
                cy={p.y}
                r="5.5"
                className="fill-amber-400 stroke-blue-700 dark:stroke-slate-900 group-hover:scale-125 transition-transform"
                strokeWidth="2.5"
              />
              <text
                x={p.x}
                y={p.y - 10}
                textAnchor="middle"
                className="text-[10px] font-mono font-bold fill-blue-700 dark:fill-blue-400 tabular-nums opacity-90 group-hover:opacity-100"
              >
                {p.val.toFixed(1)}
              </text>
              <text
                x={p.x}
                y={height - paddingY + 16}
                textAnchor="middle"
                className="text-[9px] font-medium fill-slate-500 dark:fill-slate-400"
              >
                vs {p.av.adversario.split(' ')[0]}
              </text>
              <text
                x={p.x}
                y={height - paddingY + 28}
                textAnchor="middle"
                className="text-[8px] font-mono fill-slate-400 dark:fill-slate-500"
              >
                {formatarDataExibicao(p.av.dataJogo).substring(0, 5)}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
};
