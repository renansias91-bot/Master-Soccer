import React, { useState } from 'react';
import { Search, Plus, Trash2, Edit, Calendar, Download, Award } from 'lucide-react';
import { Atleta, AvaliacaoJogo } from '../types';
import { storageService } from '../services/storage';

interface HistoricoJogosViewProps {
  avaliacoes: AvaliacaoJogo[];
  atletas: Atleta[];
  categorias: string[];
  onNovaAvaliacao: () => void;
  onEditarAvaliacao: (avaliacao: AvaliacaoJogo) => void;
  onExcluirAvaliacao: (id: string) => void;
  onSelecionarAtleta: (atleta: Atleta) => void;
}

export const HistoricoJogosView: React.FC<HistoricoJogosViewProps> = ({
  avaliacoes,
  atletas,
  categorias,
  onNovaAvaliacao,
  onEditarAvaliacao,
  onExcluirAvaliacao,
  onSelecionarAtleta,
}) => {
  const [busca, setBusca] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState('TODAS');

  const avaliacoesFiltradas = avaliacoes
    .filter((av) => {
      const matchCat = categoriaFiltro === 'TODAS' || av.categoria === categoriaFiltro;
      const atleta = atletas.find((a) => a.id === av.atletaId);
      const matchBusca =
        !busca.trim() ||
        av.adversario.toLowerCase().includes(busca.toLowerCase()) ||
        av.competicao.toLowerCase().includes(busca.toLowerCase()) ||
        av.observacoes.toLowerCase().includes(busca.toLowerCase()) ||
        (atleta && atleta.nome.toLowerCase().includes(busca.toLowerCase()));
      return matchCat && matchBusca;
    })
    .sort((a, b) => new Date(b.dataJogo).getTime() - new Date(a.dataJogo).getTime());

  const getCorNota = (nota: number) => {
    if (nota >= 8.5) return 'text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border-blue-300 dark:border-blue-800';
    if (nota >= 7.0) return 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800';
    if (nota >= 5.0) return 'text-orange-700 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/40 border-orange-300 dark:border-orange-800';
    return 'text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800';
  };

  const getIniciais = (nome?: string) => {
    if (!nome) return 'MS';
    const parts = nome.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <div className="space-y-6">
      {/* Barra de Filtros e Ações */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setCategoriaFiltro('TODAS')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              categoriaFiltro === 'TODAS'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            Todas as Partidas ({avaliacoes.length})
          </button>
          {categorias.map((cat) => {
            const count = avaliacoes.filter((av) => av.categoria === cat).length;
            const ativo = categoriaFiltro === cat;
            return (
              <button
                key={cat}
                onClick={() => setCategoriaFiltro(cat)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  ativo
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {cat} ({count})
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => storageService.exportarAvaliacoesCsv()}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>CSV</span>
          </button>
          <button
            onClick={onNovaAvaliacao}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-98 rounded-lg shadow-xs transition-all shrink-0"
          >
            <Plus className="w-4 h-4 text-amber-300" />
            <span>Nova Avaliação</span>
          </button>
        </div>
      </div>

      {/* Busca */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar partida por adversário, competição, nome do atleta ou termos da observação..."
          className="w-full h-10 leading-normal pl-9 pr-4 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Lista de Avaliações */}
      {avaliacoesFiltradas.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800">
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
            Nenhuma avaliação encontrada para os critérios selecionados.
          </p>
          <button
            onClick={onNovaAvaliacao}
            className="mt-3 text-xs font-semibold text-blue-600 hover:underline"
          >
            + Registrar primeira avaliação
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {avaliacoesFiltradas.map((av) => {
            const atleta = atletas.find((a) => a.id === av.atletaId);
            return (
              <div
                key={av.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs hover:border-blue-500/40 transition-all space-y-4"
              >
                {/* Linha 1: Atleta + Adversário + Placar + Nota Geral */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200/60 dark:border-blue-800 flex items-center justify-center font-bold text-xs text-blue-700 dark:text-blue-300 shrink-0">
                      {atleta?.fotoUrl ? (
                        <img src={atleta.fotoUrl} alt={atleta.nome} className="w-full h-full object-cover rounded-xl" />
                      ) : (
                        getIniciais(atleta?.nome)
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => atleta && onSelecionarAtleta(atleta)}
                          className="font-bold text-sm text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 text-left transition-colors"
                        >
                          {atleta ? atleta.nome : 'Atleta Desconhecido'}
                        </button>
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800">
                          {av.categoria}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          vs {av.adversario}
                        </span>
                        {av.resultado && (
                          <span className="font-mono font-bold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {av.resultado}
                          </span>
                        )}
                        <span aria-hidden="true">·</span>
                        <span>{av.competicao}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono">{new Date(av.dataJogo).toLocaleDateString('pt-BR')}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono">
                          {av.minutosJogados}'
                          {av.minutos1Tempo !== undefined && av.minutos2Tempo !== undefined && (
                            <span className="text-[11px] text-slate-400 font-sans ml-1">
                              ({av.minutos1Tempo}'+{av.minutos2Tempo}')
                            </span>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Nota Geral e Ações */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block font-medium">Nota Geral</span>
                      <span
                        className={`text-sm font-mono font-bold px-2.5 py-0.5 rounded border tabular-nums ${getCorNota(
                          av.notaGeral
                        )}`}
                      >
                        {av.notaGeral.toFixed(1)} / 10
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onEditarAvaliacao(av)}
                        title="Editar avaliação"
                        className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onExcluirAvaliacao(av.id)}
                        title="Excluir avaliação"
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Notas dos 5 Pilares */}
                <div className="grid grid-cols-5 gap-2 text-center bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl text-xs">
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

                {/* Campo de Observação de Desenvolvimento */}
                <div className="space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Observação de Progresso & Desenvolvimento:
                  </span>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50/50 dark:bg-slate-900/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                    {av.observacoes}
                  </p>
                </div>

                {/* Tags de Pontos Fortes e Melhoria */}
                {((av.pontosFortes && av.pontosFortes.length > 0) ||
                  (av.pontosMelhoria && av.pontosMelhoria.length > 0)) && (
                  <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                    {av.pontosFortes?.map((pt, i) => (
                      <span
                        key={`f-${i}`}
                        className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-medium text-[11px]"
                      >
                        ✓ {pt}
                      </span>
                    ))}
                    {av.pontosMelhoria?.map((pt, i) => (
                      <span
                        key={`m-${i}`}
                        className="px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 font-medium text-[11px]"
                      >
                        △ {pt}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
