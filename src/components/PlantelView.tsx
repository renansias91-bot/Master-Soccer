import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Award,
  ChevronRight,
  Trash2,
  Edit,
  Clock,
  Shield,
  Calendar,
  Users,
  CheckCircle2,
  Save,
  CheckSquare,
  Square,
  AlertCircle,
  Trophy,
} from 'lucide-react';
import { Atleta, AvaliacaoJogo, JogoAgenda, POSICOES_JOGO, AtletaEscalado } from '../types';
import { storageService } from '../services/storage';
import { formatarDataExibicao } from '../utils/dateUtils';

interface PlantelViewProps {
  atletas: Atleta[];
  avaliacoes: AvaliacaoJogo[];
  categorias: string[];
  categoriaSelecionada: string;
  onSelecionarCategoria: (cat: string) => void;
  onSelecionarAtleta: (atleta: Atleta) => void;
  onEditarAtleta: (atleta: Atleta) => void;
  onExcluirAtleta: (id: string) => void;
  jogos: JogoAgenda[];
  onSalvarJogo: (jogo: JogoAgenda) => Promise<void> | void;
  jogoSelecionadoId?: string;
  onSelecionarJogoId?: (id: string) => void;
}

// Mapeia posição original do atleta para uma das 10 posições oficiais do jogo
function inferirPosicaoJogoPadrao(posicaoOriginal?: string): string {
  if (!posicaoOriginal) return 'Meia (10)';
  const pos = posicaoOriginal.toLowerCase();
  if (pos.includes('goleiro')) return 'Goleiro';
  if (pos.includes('zagueiro')) return 'Zagueiro';
  if (pos.includes('lateral direito') || pos.includes('lateral direita')) return 'Lateral Direita';
  if (pos.includes('lateral esquerdo') || pos.includes('lateral esquerda')) return 'Lateral Esquerdo';
  if (pos.includes('volante')) return 'Volante (5)';
  if (pos.includes('meio') || pos.includes('meia')) return 'Meia (10)';
  if (pos.includes('centroavante') || pos.includes('ponta') || pos.includes('atacante')) return 'Atacante';
  return 'Atacante';
}

export const PlantelView: React.FC<PlantelViewProps> = ({
  atletas,
  avaliacoes,
  categorias,
  categoriaSelecionada,
  onSelecionarCategoria,
  onSelecionarAtleta,
  onEditarAtleta,
  onExcluirAtleta,
  jogos,
  onSalvarJogo,
  jogoSelecionadoId,
  onSelecionarJogoId,
}) => {
  const [busca, setBusca] = useState('');
  const [jogoAtivoId, setJogoAtivoId] = useState<string>(() => {
    if (jogoSelecionadoId) return jogoSelecionadoId;
    return jogos.length > 0 ? jogos[0].id : '';
  });

  // Mapa local de atletas escalados para o jogo ativo: { [atletaId]: AtletaEscalado }
  const [escalacaoMap, setEscalacaoMap] = useState<Record<string, AtletaEscalado>>({});
  const [salvandoFeedback, setSalvandoFeedback] = useState<string | null>(null);

  // Sincroniza quando jogos ou jogoAtivoId mudarem
  useEffect(() => {
    if (jogoSelecionadoId && jogoSelecionadoId !== jogoAtivoId) {
      setJogoAtivoId(jogoSelecionadoId);
    }
  }, [jogoSelecionadoId]);

  useEffect(() => {
    const jogo = jogos.find((j) => j.id === jogoAtivoId);
    if (jogo) {
      setEscalacaoMap(jogo.escalacao || {});
    } else {
      setEscalacaoMap({});
    }
    setSalvandoFeedback(null);
  }, [jogoAtivoId, jogos]);

  const jogoAtivo = jogos.find((j) => j.id === jogoAtivoId) || null;

  const handleTrocarJogo = (novoId: string) => {
    setJogoAtivoId(novoId);
    if (onSelecionarJogoId) onSelecionarJogoId(novoId);
    const j = jogos.find((item) => item.id === novoId);
    if (j) {
      setEscalacaoMap(j.escalacao || {});
    } else {
      setEscalacaoMap({});
    }
    setSalvandoFeedback(null);
  };

  // Toggle de convocação do atleta
  const handleToggleConvocacao = (atleta: Atleta) => {
    setEscalacaoMap((prev) => {
      const copy = { ...prev };
      if (copy[atleta.id]) {
        delete copy[atleta.id];
      } else {
        copy[atleta.id] = {
          atletaId: atleta.id,
          titular: true,
          posicaoJogo: inferirPosicaoJogoPadrao(atleta.posicao),
        };
      }
      return copy;
    });
  };

  // Alterar titular/reserva
  const handleSetTitular = (atletaId: string, titular: boolean) => {
    setEscalacaoMap((prev) => {
      const atual = prev[atletaId];
      if (!atual) return prev;
      return {
        ...prev,
        [atletaId]: {
          ...atual,
          titular,
        },
      };
    });
  };

  // Alterar posição no jogo
  const handleSetPosicaoJogo = (atletaId: string, posicao: string) => {
    setEscalacaoMap((prev) => {
      const atual = prev[atletaId];
      if (!atual) return prev;
      return {
        ...prev,
        [atletaId]: {
          ...atual,
          posicaoJogo: posicao,
        },
      };
    });
  };

  // Salvar Escalação do Jogo
  const handleSalvarEscalacao = async () => {
    if (!jogoAtivo) return;

    const jogoAtualizado: JogoAgenda = {
      ...jogoAtivo,
      escalacao: escalacaoMap,
    };

    try {
      await onSalvarJogo(jogoAtualizado);
      const total = Object.keys(escalacaoMap).length;
      const titulares = Object.values(escalacaoMap).filter((e) => e.titular).length;
      const reservas = total - titulares;
      setSalvandoFeedback(
        `✓ Escalação salva com sucesso: ${titulares} titulares + ${reservas} reservas (${total} convocados)!`
      );
      setTimeout(() => setSalvandoFeedback(null), 4000);
    } catch (err: any) {
      alert(`Erro ao salvar escalação: ${err?.message || err}`);
    }
  };

  // Contagem de escalados
  const totalConvocados = Object.keys(escalacaoMap).length;
  const titularesCount = Object.values(escalacaoMap).filter((e) => e.titular).length;
  const reservasCount = totalConvocados - titularesCount;

  // Filtragem dos atletas para montagem
  const filtrarAtletas = (lista: Atleta[]) => {
    return lista.filter((a) => {
      if (!busca.trim()) return true;
      const b = busca.toLowerCase();
      return (
        a.nome.toLowerCase().includes(b) ||
        (a.apelido && a.apelido.toLowerCase().includes(b)) ||
        a.posicao.toLowerCase().includes(b)
      );
    });
  };

  // Divisão em dois grupos conforme instrução do usuário:
  // 1. Primeiro Grupo: Categoria do Jogo (ex: SUB-15)
  // 2. Segundo Grupo: Outras Categorias (SUB-16, SUB-17, etc.)
  const categoriaDoJogo = jogoAtivo?.categoria || 'SUB-15';
  const atletasCategoriaJogo = filtrarAtletas(
    atletas.filter((a) => a.categoria === categoriaDoJogo)
  );
  const atletasOutrasCategorias = filtrarAtletas(
    atletas.filter((a) => a.categoria !== categoriaDoJogo)
  );

  return (
    <div className="space-y-6 pb-[120px] w-full max-w-full box-border">
      {/* ========================================================= */}
      {/* 1. SELETOR DE JOGO NO TOPO DA ESCALAÇÃO */}
      {/* ========================================================= */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                Escalação da Partida
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Selecione o jogo na agenda, convoque os titulares e reservas e defina a posição de cada atleta
            </p>
          </div>

          {/* Botão Salvar Escalação do Jogo */}
          {jogoAtivo && (
            <button
              onClick={handleSalvarEscalacao}
              style={{ backgroundColor: '#2563eb' }}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-bold text-white hover:bg-blue-700 active:scale-98 rounded-xl shadow-xs transition-all shrink-0"
            >
              <Save className="w-4 h-4 text-amber-300" />
              <span>Salvar Escalação do Jogo</span>
            </button>
          )}
        </div>

        {/* Dropdown de Seleção de Jogo */}
        <div className="pt-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span>Escolher Jogo para Montar a Escalação:</span>
          </label>

          <select
            value={jogoAtivoId}
            onChange={(e) => handleTrocarJogo(e.target.value)}
            className="w-full h-11 px-3.5 py-2 text-sm font-bold bg-slate-50 dark:bg-slate-800 border-2 border-blue-500/50 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer shadow-xs"
          >
            <option value="">Selecione um jogo...</option>
            {jogos.map((j) => (
              <option key={j.id} value={j.id}>
                {j.adversario} · {formatarDataExibicao(j.dataJogo)} · {j.categoria} ({j.tipo})
              </option>
            ))}
          </select>
        </div>

        {/* Resumo da Escalação do Jogo Selecionado */}
        {jogoAtivo && (
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-extrabold text-slate-900 dark:text-white">
                {jogoAtivo.adversario}
              </span>
              <span className="text-slate-400">·</span>
              <span className="text-blue-600 dark:text-blue-400 font-bold">
                {jogoAtivo.categoria}
              </span>
              <span className="text-slate-400">·</span>
              <span className="text-slate-600 dark:text-slate-300">
                {formatarDataExibicao(jogoAtivo.dataJogo)} {jogoAtivo.hora ? `às ${jogoAtivo.hora}` : ''}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold border border-blue-200/50">
                {titularesCount} titulares
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">
                {reservasCount} reservas
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 font-extrabold">
                Total: {totalConvocados} convocados
              </span>
            </div>
          </div>
        )}

        {/* Feedback de salvamento */}
        {salvandoFeedback && (
          <div className="p-3 text-xs text-emerald-800 dark:text-emerald-200 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 rounded-xl flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-bold">{salvandoFeedback}</span>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* 2. MENSAGEM SE NENHUM JOGO FOR ESCOLHIDO */}
      {/* ========================================================= */}
      {!jogoAtivo ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-800 space-y-3">
          <Calendar className="w-10 h-10 text-blue-600 mx-auto opacity-70" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            Escolha um jogo acima para montar a escalação
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Assim que você selecionar uma partida na caixa acima, você poderá marcar os jogadores convocados, escolher titulares, reservas e a posição tática de cada atleta.
          </p>
        </div>
      ) : (
        <>
          {/* Campo de Busca Rápida de Atleta */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar atleta por nome, apelido ou posição..."
              className="w-full pl-10 pr-4 py-2.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          {/* ========================================================= */}
          {/* GRUPO 1: CATEGORIA DO JOGO (Ex: SUB-15 - Categoria do Jogo) */}
          {/* ========================================================= */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-1">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-900 dark:text-white">
                  {categoriaDoJogo} - Categoria do Jogo
                </h3>
              </div>
              <span className="text-xs text-slate-500 font-semibold">
                {atletasCategoriaJogo.length} atletas disponíveis
              </span>
            </div>

            {atletasCategoriaJogo.length === 0 ? (
              <div className="p-6 text-center bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-xs text-slate-400">
                Nenhum atleta encontrado nesta categoria.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {atletasCategoriaJogo.map((atleta) => {
                  const escalado = escalacaoMap[atleta.id];
                  const estaConvocado = Boolean(escalado);
                  const titular = escalado ? escalado.titular : false;
                  const posicaoAtual = escalado
                    ? escalado.posicaoJogo
                    : inferirPosicaoJogoPadrao(atleta.posicao);

                  return (
                    <div
                      key={atleta.id}
                      className={`rounded-2xl p-4 transition-all border ${
                        estaConvocado
                          ? 'bg-blue-50/40 dark:bg-blue-950/20 border-blue-500 shadow-xs'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        {/* Checkbox de Convocação + Dados do Atleta */}
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => handleToggleConvocacao(atleta)}
                            className="cursor-pointer p-0.5 text-blue-600 focus:outline-none"
                            title={estaConvocado ? 'Desmarcar da partida' : 'Convocar para partida'}
                          >
                            {estaConvocado ? (
                              <CheckSquare className="w-5 h-5 text-blue-600 fill-blue-100 dark:fill-blue-950" />
                            ) : (
                              <Square className="w-5 h-5 text-slate-400 hover:text-slate-600" />
                            )}
                          </button>

                          {/* Foto / Iniciais */}
                          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0 overflow-hidden flex items-center justify-center font-bold text-xs text-slate-700 dark:text-slate-300">
                            {atleta.fotoUrl ? (
                              <img src={atleta.fotoUrl} alt={atleta.nome} className="w-full h-full object-cover" />
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
                              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                                {atleta.nome}
                              </h4>
                              {atleta.apelido && (
                                <span className="text-xs text-slate-400">"{atleta.apelido}"</span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500">
                              Posição: <strong className="text-slate-700 dark:text-slate-300">{atleta.posicao}</strong> · Pé: {atleta.pernaDominante}
                            </p>
                          </div>
                        </div>

                        {/* Ações: Editar, Excluir e Relatório */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => onEditarAtleta(atleta)}
                            title="Editar dados do atleta"
                            className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onExcluirAtleta(atleta.id)}
                            title="Excluir atleta"
                            className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onSelecionarAtleta(atleta)}
                            className="px-2 py-1 text-[11px] font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition"
                          >
                            Ficha
                          </button>
                        </div>
                      </div>

                      {/* Configurações de Convocação se marcado */}
                      {estaConvocado && (
                        <div className="mt-3 pt-3 border-t border-blue-200/50 dark:border-blue-900/50 flex flex-wrap items-center justify-between gap-3 text-xs animate-in fade-in">
                          {/* Titular vs Reserva */}
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-slate-700 dark:text-slate-300 mr-1">
                              Status:
                            </span>
                            <button
                              type="button"
                              onClick={() => handleSetTitular(atleta.id, true)}
                              className={`px-3 py-1 rounded-lg font-bold transition-all ${
                                titular
                                  ? 'bg-blue-600 text-white shadow-xs'
                                  : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300'
                              }`}
                            >
                              Titular
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSetTitular(atleta.id, false)}
                              className={`px-3 py-1 rounded-lg font-bold transition-all ${
                                !titular
                                  ? 'bg-amber-500 text-white shadow-xs'
                                  : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300'
                              }`}
                            >
                              Reserva
                            </button>
                          </div>

                          {/* Seletor "Jogou de:" com as 10 posições exatas */}
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-slate-700 dark:text-slate-300">
                              Jogou de:
                            </span>
                            <select
                              value={posicaoAtual}
                              onChange={(e) => handleSetPosicaoJogo(atleta.id, e.target.value)}
                              className="h-8 px-2.5 text-xs font-bold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              {POSICOES_JOGO.map((pos) => (
                                <option key={pos} value={pos}>
                                  {pos}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ========================================================= */}
          {/* GRUPO 2: OUTRAS CATEGORIAS - PODE CONVOCAR */}
          {/* ========================================================= */}
          <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between pb-1">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-900 dark:text-white">
                  Outras Categorias - Pode convocar
                </h3>
              </div>
              <span className="text-xs text-slate-500 font-semibold">
                {atletasOutrasCategorias.length} atletas de outras categorias
              </span>
            </div>

            {atletasOutrasCategorias.length === 0 ? (
              <div className="p-6 text-center bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-xs text-slate-400">
                Nenhum atleta de outras categorias cadastrado.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {atletasOutrasCategorias.map((atleta) => {
                  const escalado = escalacaoMap[atleta.id];
                  const estaConvocado = Boolean(escalado);
                  const titular = escalado ? escalado.titular : false;
                  const posicaoAtual = escalado
                    ? escalado.posicaoJogo
                    : inferirPosicaoJogoPadrao(atleta.posicao);

                  return (
                    <div
                      key={atleta.id}
                      className={`rounded-2xl p-4 transition-all border ${
                        estaConvocado
                          ? 'bg-blue-50/40 dark:bg-blue-950/20 border-blue-500 shadow-xs'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        {/* Checkbox de Convocação + Dados do Atleta */}
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => handleToggleConvocacao(atleta)}
                            className="cursor-pointer p-0.5 text-blue-600 focus:outline-none"
                            title={estaConvocado ? 'Desmarcar da partida' : 'Convocar para partida'}
                          >
                            {estaConvocado ? (
                              <CheckSquare className="w-5 h-5 text-blue-600 fill-blue-100 dark:fill-blue-950" />
                            ) : (
                              <Square className="w-5 h-5 text-slate-400 hover:text-slate-600" />
                            )}
                          </button>

                          {/* Foto / Iniciais */}
                          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0 overflow-hidden flex items-center justify-center font-bold text-xs text-slate-700 dark:text-slate-300">
                            {atleta.fotoUrl ? (
                              <img src={atleta.fotoUrl} alt={atleta.nome} className="w-full h-full object-cover" />
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
                              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300">
                                {atleta.categoria}
                              </span>
                              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                                {atleta.nome}
                              </h4>
                            </div>
                            <p className="text-[11px] text-slate-500">
                              Posição: <strong className="text-slate-700 dark:text-slate-300">{atleta.posicao}</strong> · Pé: {atleta.pernaDominante}
                            </p>
                          </div>
                        </div>

                        {/* Ações: Editar, Excluir e Relatório */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => onEditarAtleta(atleta)}
                            title="Editar dados do atleta"
                            className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onExcluirAtleta(atleta.id)}
                            title="Excluir atleta"
                            className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onSelecionarAtleta(atleta)}
                            className="px-2 py-1 text-[11px] font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition"
                          >
                            Ficha
                          </button>
                        </div>
                      </div>

                      {/* Configurações de Convocação se marcado */}
                      {estaConvocado && (
                        <div className="mt-3 pt-3 border-t border-blue-200/50 dark:border-blue-900/50 flex flex-wrap items-center justify-between gap-3 text-xs animate-in fade-in">
                          {/* Titular vs Reserva */}
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-slate-700 dark:text-slate-300 mr-1">
                              Status:
                            </span>
                            <button
                              type="button"
                              onClick={() => handleSetTitular(atleta.id, true)}
                              className={`px-3 py-1 rounded-lg font-bold transition-all ${
                                titular
                                  ? 'bg-blue-600 text-white shadow-xs'
                                  : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300'
                              }`}
                            >
                              Titular
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSetTitular(atleta.id, false)}
                              className={`px-3 py-1 rounded-lg font-bold transition-all ${
                                !titular
                                  ? 'bg-amber-500 text-white shadow-xs'
                                  : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300'
                              }`}
                            >
                              Reserva
                            </button>
                          </div>

                          {/* Seletor "Jogou de:" com as 10 posições exatas */}
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-slate-700 dark:text-slate-300">
                              Jogou de:
                            </span>
                            <select
                              value={posicaoAtual}
                              onChange={(e) => handleSetPosicaoJogo(atleta.id, e.target.value)}
                              className="h-8 px-2.5 text-xs font-bold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              {POSICOES_JOGO.map((pos) => (
                                <option key={pos} value={pos}>
                                  {pos}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Botão Inferior Salvar Escalação do Jogo */}
          <div className="pt-4 flex justify-end">
            <button
              onClick={handleSalvarEscalacao}
              style={{ backgroundColor: '#2563eb' }}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-bold text-white hover:bg-blue-700 active:scale-98 rounded-xl shadow-md transition-all"
            >
              <Save className="w-4 h-4 text-amber-300" />
              <span>Salvar Escalação do Jogo ({totalConvocados} convocados)</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
};
