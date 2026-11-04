import React from 'react';
import { NotasPilares } from '../types';

interface RadarChartProps {
  notas: NotasPilares;
  notasComparativo?: NotasPilares;
  nomeAtleta?: string;
  nomeComparativo?: string;
  size?: number;
  showLabels?: boolean;
}

const PILARES = [
  { key: 'tecnica', label: 'TÉCNICA', short: 'TÉC' },
  { key: 'tatica', label: 'TÁTICA', short: 'TÁT' },
  { key: 'fisica', label: 'FÍSICA', short: 'FÍS' },
  { key: 'mental', label: 'MENTAL', short: 'MEN' },
  { key: 'disciplinar', label: 'DISCIPLINAR', short: 'DISC' },
] as const;

export const RadarChart: React.FC<RadarChartProps> = ({
  notas,
  notasComparativo,
  nomeAtleta = 'Atleta',
  nomeComparativo = 'Referência',
  size = 320,
  showLabels = true,
}) => {
  const center = size / 2;
  const radius = (size / 2) * 0.72;
  const numSides = PILARES.length;
  const angleStep = (2 * Math.PI) / numSides;
  // Rotaciona para o primeiro ponto ficar no topo
  const startAngle = -Math.PI / 2;

  // Função para calcular coordenadas (x, y) dado valor (0 a 10) e índice
  const getCoordinates = (value: number, index: number, maxVal = 10) => {
    const angle = startAngle + index * angleStep;
    const r = (Math.max(0, Math.min(value, maxVal)) / maxVal) * radius;
    const x = center + r * Math.cos(angle);
    const y = center + r * Math.sin(angle);
    return { x, y };
  };

  // Coordenadas para os rótulos de texto (ligeiramente além do raio máximo)
  const getLabelCoordinates = (index: number) => {
    const angle = startAngle + index * angleStep;
    const labelRadius = radius + 26;
    const x = center + labelRadius * Math.cos(angle);
    const y = center + labelRadius * Math.sin(angle);
    return { x, y, angle };
  };

  // Níveis da grade (2, 4, 6, 8, 10)
  const gridLevels = [2, 4, 6, 8, 10];

  // Gera pontos do polígono do atleta
  const athletePoints = PILARES.map((p, i) => {
    const val = notas[p.key as keyof NotasPilares] || 0;
    const { x, y } = getCoordinates(val, i);
    return `${x},${y}`;
  }).join(' ');

  // Gera pontos do polígono de comparativo se existir
  const comparativePoints = notasComparativo
    ? PILARES.map((p, i) => {
        const val = notasComparativo[p.key as keyof NotasPilares] || 0;
        const { x, y } = getCoordinates(val, i);
        return `${x},${y}`;
      }).join(' ')
    : null;

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="overflow-visible select-none"
        >
          {/* Círculos / Polígonos de grade */}
          {gridLevels.map((level) => {
            const points = PILARES.map((_, i) => {
              const { x, y } = getCoordinates(level, i);
              return `${x},${y}`;
            }).join(' ');
            return (
              <g key={`grid-${level}`}>
                <polygon
                  points={points}
                  fill={level === 10 ? 'rgba(15, 23, 42, 0.02)' : 'none'}
                  stroke="currentColor"
                  strokeWidth={level === 10 ? '1.5' : '1'}
                  className={level === 10 ? 'text-slate-300 dark:text-slate-600' : 'text-slate-200 dark:text-slate-700/60'}
                  strokeDasharray={level < 10 ? '2,2' : undefined}
                />
                {/* Rótulo numérico sutil no eixo vertical */}
                <text
                  x={center + 4}
                  y={center - (level / 10) * radius + 3}
                  className="text-[9px] font-mono fill-slate-400 dark:fill-slate-500 tabular-nums"
                >
                  {level}
                </text>
              </g>
            );
          })}

          {/* Linhas de eixos radiantes */}
          {PILARES.map((_, i) => {
            const { x, y } = getCoordinates(10, i);
            return (
              <line
                key={`axis-${i}`}
                x1={center}
                y1={center}
                x2={x}
                y2={y}
                stroke="currentColor"
                strokeWidth="1"
                className="text-slate-200 dark:text-slate-700"
              />
            );
          })}

          {/* Polígono de Comparação / Referência (se houver - Dourado/Amarelo) */}
          {comparativePoints && (
            <polygon
              points={comparativePoints}
              fill="rgba(234, 179, 8, 0.22)"
              stroke="#EAB308"
              strokeWidth="2.5"
              strokeDasharray="4,4"
              className="transition-all duration-300"
            />
          )}

          {/* Polígono do Atleta Principal (Azul Master Soccer) */}
          <polygon
            points={athletePoints}
            fill="rgba(37, 99, 235, 0.28)"
            stroke="#2563EB"
            strokeWidth="2.5"
            className="transition-all duration-300"
          />

          {/* Pontos nas vértices do atleta (Amarelo Ouro com borda azul) */}
          {PILARES.map((p, i) => {
            const val = notas[p.key as keyof NotasPilares] || 0;
            const { x, y } = getCoordinates(val, i);
            return (
              <g key={`point-${p.key}`}>
                <circle
                  cx={x}
                  cy={y}
                  r="5"
                  className="fill-amber-400 stroke-blue-700 dark:stroke-slate-900"
                  strokeWidth="2"
                />
              </g>
            );
          })}

          {/* Rótulos dos eixos */}
          {showLabels &&
            PILARES.map((p, i) => {
              const { x, y } = getLabelCoordinates(i);
              const val = notas[p.key as keyof NotasPilares] || 0;
              let textAnchor: 'start' | 'middle' | 'end' = 'middle';
              if (i === 1) textAnchor = 'start';
              if (i === 2) textAnchor = 'start';
              if (i === 3) textAnchor = 'end';
              if (i === 4) textAnchor = 'end';

              return (
                <g key={`label-${p.key}`}>
                  <text
                    x={x}
                    y={y - 2}
                    textAnchor={textAnchor}
                    className="text-[11px] font-bold fill-slate-700 dark:fill-slate-200 tracking-wider"
                  >
                    {p.label}
                  </text>
                  <text
                    x={x}
                    y={y + 11}
                    textAnchor={textAnchor}
                    className="text-[11px] font-mono font-bold fill-blue-600 dark:fill-blue-400 tabular-nums"
                  >
                    {val.toFixed(1)}
                  </text>
                </g>
              );
            })}
        </svg>
      </div>

      {/* Legenda quando há comparativo */}
      {comparativePoints && (
        <div className="flex items-center gap-6 mt-3 text-xs text-slate-600 dark:text-slate-300">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-600 inline-block" />
            <span className="font-semibold text-slate-800 dark:text-slate-200">{nomeAtleta}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-amber-400 inline-block border border-dashed border-amber-600" />
            <span className="font-semibold text-slate-800 dark:text-slate-200">{nomeComparativo}</span>
          </div>
        </div>
      )}
    </div>
  );
};
