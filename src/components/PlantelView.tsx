import React, { useState } from 'react';
import {
  Search,
  Filter,
  UserPlus,
  Award,
  ChevronRight,
  TrendingUp,
  Trash2,
  Edit,
  Clock,
  Shield,
} from 'lucide-react';
import { Atleta, AvaliacaoJogo } from '../types';
import { storageService } from '../services/storage';

interface PlantelViewProps {
  atletas: Atleta[];
  avaliacoes: AvaliacaoJogo[];
  categorias: string[];
  categoriaSelecionada: string;
  onSelecionarCategoria: (cat: string) => void;
  onSelecionarAtleta: (atleta: Atleta) => void;
  onNovoAtleta: () => void;
  onNovaAvaliacao: (atletaId: string) => void;
  onEditarAtleta: (atleta: Atleta) => void;
  onExcluirAtleta: (id: string) => void;
}

export const PlantelView: React.FC<PlantelViewProps> = ({
  atletas,
  avaliacoes,
  categorias,
  categoriaSelecionada,
  onSelecionarCategoria,
  onNovoAtleta,
  onSelecionarAtleta,
  onNovaAvaliacao,
  onEditarAtleta,
  onExcluirAtleta,
}) => {
  const [busca, setBusca] = useState('');
  const [filtroPosicao, setFiltroPosicao] = useState('TODAS');
  const [filtroStatus, setFiltroStatus] = useState('TODOS');
  const [visualizacao, setVisualizacao] = useState<'cards' | 'tabela'>('cards');

  // Filtros aplicados
  const atletasFiltrados = atletas.filter((a) => {
    const matchCategoria =
      categoriaSelecionada === 'TODAS' || a.categoria === categoriaSelecionada;

    const matchBusca =
      !busca.trim() ||
      a.nome.toLowerCase().includes(busca.toLowerCase()) ||
      (a.apelido && a.apelido.toLowerCase().includes(busca.toLowerCase())) ||
      a.posicao.toLowerCase().includes(busca.toLowerCase());

    const matchPosicao =
      filtroPosicao === 'TODAS' ||
      a.posicao.toLowerCase().includes(filtroPosicao.toLowerCase());

    const matchStatus = filtroStatus === 'TODOS' || a.status === filtroStatus;

    return matchCategoria && matchBusca && matchPosicao && matchStatus;
  });

  const getCorNota = (nota: number) => {
    if (nota >= 8.5) return 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800';
    if (nota >= 7.0) return 'text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40 border-teal-300 dark:border-teal-800';
    if (nota >= 5.0) return 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800';
    return 'text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800';
  };

  return (
    <div className="space-y-6 pb-[120px]">
      {/* Barra de Filtro de Categorias (SUB-15, SUB-16, SUB-17, TODAS) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => onSelecionarCategoria('TODAS')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              categoriaSelecionada === 'TODAS'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            Todas as Categorias ({atletas.length})
          </button>
          {categorias.map((cat) => {
            const qtd = atletas.filter((a) => a.categoria === cat).length;
            const ativo = categoriaSelecionada === cat;
            return (
              <button
                key={cat}
                onClick={() => onSelecionarCategoria(cat)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  ativo
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {cat} ({qtd})
              </button>
            );
          })}
        </div>

        <button
          onClick={onNovoAtleta}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 active:scale-98 rounded-lg shadow-xs transition-all shrink-0"
        >
          <UserPlus className="w-4 h-4 text-slate-950" />
          <span>Cadastrar Atleta</span>
        </button>
      </div>

      {/* Barra de Busca e Filtros Secundários */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Campo de Busca */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome, apelido ou posição..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Filtro Posição & Status */}
        <div className="flex items-center gap-2">
          <select
            value={filtroPosicao}
            onChange={(e) => setFiltroPosicao(e.target.value)}
            className="px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="TODAS">Todas Posições</option>
            <option value="Goleiro">Goleiros</option>
            <option value="Zagueiro">Zagueiros</option>
            <option value="Lateral">Laterais</option>
            <option value="Volante">Volantes</option>
            <option value="Meio-Campista">Meias</option>
            <option value="Ponta">Pontas</option>
            <option value="Centroavante">Centroavantes</option>
          </select>

          <select
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
            className="px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="TODOS">Todos Status</option>
            <option value="Ativo">Ativo</option>
            <option value="Departamento Médico">Departamento Médico</option>
            <option value="Transição">Transição</option>
          </select>

          {/* Alternador Cards / Tabela */}
          <div className="hidden sm:flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setVisualizacao('cards')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${
                visualizacao === 'cards'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Cards
            </button>
            <button
              onClick={() => setVisualizacao('tabela')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${
                visualizacao === 'tabela'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Tabela
            </button>
          </div>
        </div>
      </div>

      {/* Conteúdo: Lista Vazia ou Grid de Atletas */}
      {atletasFiltrados.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800">
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
            Nenhum atleta encontrado com os filtros atuais.
          </p>
          <button
            onClick={() => {
              setBusca('');
              setFiltroPosicao('TODAS');
              setFiltroStatus('TODOS');
              onSelecionarCategoria('TODAS');
            }}
            className="mt-3 text-xs text-emerald-600 hover:underline font-semibold"
          >
            Limpar filtros de busca
          </button>
        </div>
      ) : visualizacao === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {atletasFiltrados.map((atleta) => {
            const stats = storageService.getEstatisticasAtleta(atleta.id);
            return (
              <div
                key={atleta.id}
                className="group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-500/50 dark:hover:border-blue-500/50 rounded-2xl p-5 shadow-xs transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  {/* Cabeçalho do Card */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      {/* Avatar do Atleta */}
                      <div className="relative w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0 overflow-hidden flex items-center justify-center font-bold text-xs text-slate-600 dark:text-slate-300">
                        {atleta.fotoUrl ? (
                          <img
                            src={atleta.fotoUrl}
                            alt={atleta.nome}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span>
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
                          <span className="text-[11px] font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/50 px-1.5 py-0.5 rounded border border-blue-200/40">
                            {atleta.categoria}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            {atleta.status}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">
                          {atleta.nome}
                        </h4>
                        {atleta.apelido && (
                          <p className="text-xs text-slate-400">"{atleta.apelido}"</p>
                        )}
                      </div>
                    </div>

                    {/* Média da Temporada */}
                    <div className="text-right shrink-0">
                      <span className="text-[10px] text-slate-400 block font-medium">Média</span>
                      <span
                        className={`text-xs font-mono font-bold px-2 py-0.5 rounded border tabular-nums ${getCorNota(
                          stats.mediaGeral
                        )}`}
                      >
                        {stats.totalJogos > 0 ? stats.mediaGeral.toFixed(1) : '-'}
                      </span>
                    </div>
                  </div>

                  {/* Informações Complementares */}
                  <div className="grid grid-cols-2 gap-2 py-2 text-xs text-slate-600 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Posição</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {atleta.posicao}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Pé Dominante</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {atleta.pernaDominante}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Jogos Avaliados</span>
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200 tabular-nums">
                        {stats.totalJogos} {stats.totalJogos === 1 ? 'jogo' : 'jogos'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Destaque</span>
                      <span className="font-semibold text-blue-600 dark:text-blue-400 truncate block">
                        {stats.melhorPilar.nome}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Ações Rápidas do Atleta */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 mt-2">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onEditarAtleta(atleta)}
                      title="Editar dados"
                      className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onExcluirAtleta(atleta.id)}
                      title="Excluir atleta"
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onNovaAvaliacao(atleta.id)}
                      className="px-2.5 py-1 text-xs font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 rounded-lg transition-colors border border-blue-200/40"
                    >
                      + Avaliar Jogo
                    </button>
                    <button
                      onClick={() => onSelecionarAtleta(atleta)}
                      className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs"
                    >
                      <span>Relatório</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Visualização em Tabela */
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold">
                <tr>
                  <th className="py-3 px-4">Atleta</th>
                  <th className="py-3 px-4">Categoria</th>
                  <th className="py-3 px-4">Posição</th>
                  <th className="py-3 px-4">Pé</th>
                  <th className="py-3 px-4">Jogos</th>
                  <th className="py-3 px-4">Média Geral</th>
                  <th className="py-3 px-4">Melhor Pilar</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {atletasFiltrados.map((atleta) => {
                  const stats = storageService.getEstatisticasAtleta(atleta.id);
                  return (
                    <tr
                      key={atleta.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-[10px] text-slate-600 dark:text-slate-300 shrink-0">
                            {atleta.fotoUrl ? (
                              <img src={atleta.fotoUrl} alt={atleta.nome} className="w-full h-full object-cover rounded-lg" />
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
                            <span className="font-bold text-slate-900 dark:text-white block">
                              {atleta.nome}
                            </span>
                            {atleta.apelido && (
                              <span className="text-[11px] text-slate-400">
                                "{atleta.apelido}"
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-semibold text-blue-600 dark:text-blue-400">
                        {atleta.categoria}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-700 dark:text-slate-300">
                        {atleta.posicao}
                      </td>
                      <td className="py-3 px-4 text-slate-500">{atleta.pernaDominante}</td>
                      <td className="py-3 px-4 font-mono tabular-nums text-slate-700 dark:text-slate-300">
                        {stats.totalJogos}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`font-mono font-bold px-2 py-0.5 rounded border tabular-nums ${getCorNota(
                            stats.mediaGeral
                          )}`}
                        >
                          {stats.totalJogos > 0 ? stats.mediaGeral.toFixed(1) : '-'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                        {stats.melhorPilar.nome}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onNovaAvaliacao(atleta.id)}
                            className="px-2.5 py-1 text-xs font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 rounded-lg border border-blue-200/40"
                          >
                            Avaliar
                          </button>
                          <button
                            onClick={() => onSelecionarAtleta(atleta)}
                            className="px-2.5 py-1 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs"
                          >
                            Ficha
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
