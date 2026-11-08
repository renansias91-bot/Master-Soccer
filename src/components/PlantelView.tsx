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
  ArrowLeftRight,
  X,
  ChevronDown,
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

export interface SlotPosicaoCampinho {
  id: string;
  label: 'GOL' | 'LE' | 'ZAG' | 'LD' | 'VOL' | 'MEI' | 'ATA';
  nomeCompleto: string;
  linha: 'ata' | 'mei' | 'def' | 'gol';
  left: number; // % (0 a 100)
  top: number;  // % (0 a 100)
}

export const FORMACOES_CAMPINHO: Record<string, SlotPosicaoCampinho[]> = {
  // FORMAÇÃO 4-4-2 LOSANGO - 11 posições exatas solicitadas
  '4-4-2': [
    // GOL left 50% top 93%
    { id: 'gol', label: 'GOL', nomeCompleto: 'Goleiro', linha: 'gol', left: 50, top: 93 },
    // Defesa: LE left 10% top 78%, ZAG left 40% top 78%, ZAG left 60% top 78%, LD left 90% top 78%
    { id: 'le', label: 'LE', nomeCompleto: 'Lateral Esquerdo', linha: 'def', left: 10, top: 78 },
    { id: 'zage', label: 'ZAG', nomeCompleto: 'Zagueiro Esquerdo', linha: 'def', left: 40, top: 78 },
    { id: 'zagd', label: 'ZAG', nomeCompleto: 'Zagueiro Direito', linha: 'def', left: 60, top: 78 },
    { id: 'ld', label: 'LD', nomeCompleto: 'Lateral Direito', linha: 'def', left: 90, top: 78 },
    // VOL left 50% top 62% - sozinho na frente da defesa
    { id: 'vol', label: 'VOL', nomeCompleto: 'Volante', linha: 'mei', left: 50, top: 62 },
    // MEI left 18% top 48% - lado esquerdo
    { id: 'meie', label: 'MEI', nomeCompleto: 'Meio-Campo Esquerdo', linha: 'mei', left: 18, top: 48 },
    // MEI left 82% top 48% - lado direito
    { id: 'meid', label: 'MEI', nomeCompleto: 'Meio-Campo Direito', linha: 'mei', left: 82, top: 48 },
    // MEI left 50% top 37% - central, um pouco à frente, escrito APENAS "MEI"
    { id: 'meic', label: 'MEI', nomeCompleto: 'Meio-Campo Central', linha: 'mei', left: 50, top: 37 },
    // ATA left 42% top 24% - antes da grande área
    { id: 'ata1', label: 'ATA', nomeCompleto: 'Atacante 1', linha: 'ata', left: 42, top: 24 },
    // ATA left 58% top 24% - antes da grande área
    { id: 'ata2', label: 'ATA', nomeCompleto: 'Atacante 2', linha: 'ata', left: 58, top: 24 },
  ],

  // FORMAÇÃO 4-2-3-1 - 11 posições exatas solicitadas
  '4-2-3-1': [
    // GOL left 50% top 93%
    { id: 'gol', label: 'GOL', nomeCompleto: 'Goleiro', linha: 'gol', left: 50, top: 93 },
    // Defesa: LE left 10% top 78%, ZAG left 40% top 78%, ZAG left 60% top 78%, LD left 90% top 78%
    { id: 'le', label: 'LE', nomeCompleto: 'Lateral Esquerdo', linha: 'def', left: 10, top: 78 },
    { id: 'zage', label: 'ZAG', nomeCompleto: 'Zagueiro Esquerdo', linha: 'def', left: 40, top: 78 },
    { id: 'zagd', label: 'ZAG', nomeCompleto: 'Zagueiro Direito', linha: 'def', left: 60, top: 78 },
    { id: 'ld', label: 'LD', nomeCompleto: 'Lateral Direito', linha: 'def', left: 90, top: 78 },
    // VOL left 42% top 62% - abaixo da linha do meio-campo, no nosso campo
    { id: 'vol1', label: 'VOL', nomeCompleto: 'Volante 1', linha: 'mei', left: 42, top: 62 },
    // VOL left 58% top 62% - abaixo da linha do meio-campo, no nosso campo
    { id: 'vol2', label: 'VOL', nomeCompleto: 'Volante 2', linha: 'mei', left: 58, top: 62 },
    // MEI left 22% top 50% - EM CIMA da linha central
    { id: 'meie', label: 'MEI', nomeCompleto: 'Meio-Campo Esquerdo', linha: 'mei', left: 22, top: 50 },
    // MEI left 50% top 50% - EM CIMA da linha central
    { id: 'meic', label: 'MEI', nomeCompleto: 'Meio-Campo Central', linha: 'mei', left: 50, top: 50 },
    // MEI left 78% top 50% - EM CIMA da linha central
    { id: 'meid', label: 'MEI', nomeCompleto: 'Meio-Campo Direito', linha: 'mei', left: 78, top: 50 },
    // ATA left 50% top 24% - sozinho, antes da grande área adversária
    { id: 'ata', label: 'ATA', nomeCompleto: 'Centroavante', linha: 'ata', left: 50, top: 24 },
  ],

  // FORMAÇÃO 4-3-3
  '4-3-3': [
    { id: 'gol', label: 'GOL', nomeCompleto: 'Goleiro', linha: 'gol', left: 50, top: 93 },
    { id: 'le', label: 'LE', nomeCompleto: 'Lateral Esquerdo', linha: 'def', left: 10, top: 78 },
    { id: 'zage', label: 'ZAG', nomeCompleto: 'Zagueiro Esquerdo', linha: 'def', left: 40, top: 78 },
    { id: 'zagd', label: 'ZAG', nomeCompleto: 'Zagueiro Direito', linha: 'def', left: 60, top: 78 },
    { id: 'ld', label: 'LD', nomeCompleto: 'Lateral Direito', linha: 'def', left: 90, top: 78 },
    { id: 'vol', label: 'VOL', nomeCompleto: 'Volante', linha: 'mei', left: 50, top: 62 },
    { id: 'meie', label: 'MEI', nomeCompleto: 'Meio-Campista E', linha: 'mei', left: 28, top: 48 },
    { id: 'meid', label: 'MEI', nomeCompleto: 'Meio-Campista D', linha: 'mei', left: 72, top: 48 },
    { id: 'pe', label: 'ATA', nomeCompleto: 'Ponta Esquerda', linha: 'ata', left: 20, top: 24 },
    { id: 'ca', label: 'ATA', nomeCompleto: 'Centroavante', linha: 'ata', left: 50, top: 24 },
    { id: 'pd', label: 'ATA', nomeCompleto: 'Ponta Direita', linha: 'ata', left: 80, top: 24 },
  ],

  // FORMAÇÃO 3-5-2
  '3-5-2': [
    { id: 'gol', label: 'GOL', nomeCompleto: 'Goleiro', linha: 'gol', left: 50, top: 93 },
    { id: 'zag1', label: 'ZAG', nomeCompleto: 'Zagueiro Esquerdo', linha: 'def', left: 25, top: 78 },
    { id: 'zag2', label: 'ZAG', nomeCompleto: 'Zagueiro Central', linha: 'def', left: 50, top: 78 },
    { id: 'zag3', label: 'ZAG', nomeCompleto: 'Zagueiro Direito', linha: 'def', left: 75, top: 78 },
    { id: 'le', label: 'LE', nomeCompleto: 'Ala Esquerda', linha: 'mei', left: 10, top: 50 },
    { id: 'vol', label: 'VOL', nomeCompleto: 'Volante', linha: 'mei', left: 50, top: 62 },
    { id: 'mei1', label: 'MEI', nomeCompleto: 'Meia 1', linha: 'mei', left: 32, top: 44 },
    { id: 'mei2', label: 'MEI', nomeCompleto: 'Meia 2', linha: 'mei', left: 68, top: 44 },
    { id: 'ld', label: 'LD', nomeCompleto: 'Ala Direita', linha: 'mei', left: 90, top: 50 },
    { id: 'ata1', label: 'ATA', nomeCompleto: 'Atacante 1', linha: 'ata', left: 42, top: 24 },
    { id: 'ata2', label: 'ATA', nomeCompleto: 'Atacante 2', linha: 'ata', left: 58, top: 24 },
  ],
};

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
  const [abaSubEscalacao, setAbaSubEscalacao] = useState<'lista' | 'campinho'>('lista');
  const [formacao, setFormacao] = useState<string>('4-4-2');
  const [modalTrocaAberto, setModalTrocaAberto] = useState<boolean>(false);
  const [atletaParaTroca, setAtletaParaTroca] = useState<{
    atletaId: string;
    tipo: 'titular' | 'reserva';
    posicaoSlot?: string;
  } | null>(null);

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

  // Atribuição automática inteligente dos titulares aos slots da formação tática
  const atribuirTitularesAosSlots = (
    titularesList: Atleta[],
    slots: SlotPosicaoCampinho[]
  ): Array<{ slot: SlotPosicaoCampinho; atleta: Atleta | null }> => {
    const resultado: Array<{ slot: SlotPosicaoCampinho; atleta: Atleta | null }> = [];
    const atletasRestantes = [...titularesList];
    const usados = new Set<string>();

    for (const slot of slots) {
      const match = atletasRestantes.find((a) => {
        if (usados.has(a.id)) return false;
        const pos = (escalacaoMap[a.id]?.posicaoJogo || a.posicao || '').toLowerCase();
        if (slot.linha === 'gol') return pos.includes('gol');
        if (slot.linha === 'def') return pos.includes('zag') || pos.includes('lat') || pos.includes('def');
        if (slot.linha === 'mei') return pos.includes('vol') || pos.includes('mei') || pos.includes('meio');
        if (slot.linha === 'ata') return pos.includes('ata') || pos.includes('pon') || pos.includes('cent') || pos.includes('ext');
        return false;
      });

      if (match) {
        usados.add(match.id);
        resultado.push({ slot, atleta: match });
      } else {
        resultado.push({ slot, atleta: null });
      }
    }

    // Preenche slots vazios com titulares restantes que não encaixaram na posição padrão
    const unassigned = atletasRestantes.filter((a) => !usados.has(a.id));
    for (let i = 0; i < resultado.length && unassigned.length > 0; i++) {
      if (!resultado[i].atleta) {
        const proximo = unassigned.shift()!;
        resultado[i].atleta = proximo;
        usados.add(proximo.id);
      }
    }

    return resultado;
  };

  // Troca titular e reserva
  const handleTrocarTitularReserva = (titularId: string, reservaId: string) => {
    setEscalacaoMap((prev) => {
      const copy = { ...prev };
      const titAtual = copy[titularId];
      const resAtual = copy[reservaId];

      if (titAtual && resAtual) {
        copy[titularId] = {
          ...titAtual,
          titular: false,
        };
        copy[reservaId] = {
          ...resAtual,
          titular: true,
          posicaoJogo: titAtual.posicaoJogo || resAtual.posicaoJogo,
        };
      } else if (titAtual && !resAtual) {
        const atletaRes = atletas.find((a) => a.id === reservaId);
        copy[titularId] = { ...titAtual, titular: false };
        copy[reservaId] = {
          atletaId: reservaId,
          titular: true,
          posicaoJogo: atletaRes ? inferirPosicaoJogoPadrao(atletaRes.posicao) : titAtual.posicaoJogo,
        };
      } else if (!titAtual && resAtual) {
        copy[reservaId] = {
          ...resAtual,
          titular: true,
        };
      }
      return copy;
    });
    setModalTrocaAberto(false);
    setAtletaParaTroca(null);
  };

  // Mover titular para o banco
  const handleMoverParaBanco = (atletaId: string) => {
    setEscalacaoMap((prev) => {
      const atual = prev[atletaId];
      if (!atual) return prev;
      return {
        ...prev,
        [atletaId]: {
          ...atual,
          titular: false,
        },
      };
    });
    setModalTrocaAberto(false);
    setAtletaParaTroca(null);
  };

  // Promover atleta para titular
  const handlePromoverParaTitular = (atletaId: string, posicaoJogo?: string) => {
    setEscalacaoMap((prev) => {
      const atual = prev[atletaId];
      const atleta = atletas.find((a) => a.id === atletaId);
      return {
        ...prev,
        [atletaId]: {
          atletaId,
          titular: true,
          posicaoJogo:
            posicaoJogo ||
            (atual ? atual.posicaoJogo : atleta ? inferirPosicaoJogoPadrao(atleta.posicao) : 'Atacante'),
        },
      };
    });
    setModalTrocaAberto(false);
    setAtletaParaTroca(null);
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

        {/* ABAS SUB-ESCALAÇÃO: [ Lista | Campinho ] */}
        {jogoAtivo && (
          <div className="flex items-center gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setAbaSubEscalacao('lista')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-extrabold transition-all ${
                abaSubEscalacao === 'lista'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Lista</span>
            </button>
            <button
              type="button"
              onClick={() => setAbaSubEscalacao('campinho')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-extrabold transition-all ${
                abaSubEscalacao === 'campinho'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>Campinho</span>
            </button>
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
      ) : abaSubEscalacao === 'lista' ? (
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

                        {/* Botão Ficha */}
                        <button
                          type="button"
                          onClick={() => onSelecionarAtleta(atleta)}
                          className="px-2.5 py-1 text-[11px] font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition shrink-0"
                        >
                          Ficha
                        </button>
                      </div>

                      {/* Configurações de Convocação se marcado: APENAS Status: [ Titular ] [ Reserva ] */}
                      {estaConvocado && (
                        <div className="mt-3 pt-3 border-t border-blue-200/50 dark:border-blue-900/50 flex items-center gap-2 text-xs animate-in fade-in">
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

                        {/* Botão Ficha */}
                        <button
                          type="button"
                          onClick={() => onSelecionarAtleta(atleta)}
                          className="px-2.5 py-1 text-[11px] font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition shrink-0"
                        >
                          Ficha
                        </button>
                      </div>

                      {/* Configurações de Convocação se marcado: APENAS Status: [ Titular ] [ Reserva ] */}
                      {estaConvocado && (
                        <div className="mt-3 pt-3 border-t border-blue-200/50 dark:border-blue-900/50 flex items-center gap-2 text-xs animate-in fade-in">
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
      ) : (
        /* ========================================================= */
        /* ABA 2: CAMPINHO TÁTICO VERTICAL COM 11 TITULARES */
        /* ========================================================= */
        <div className="space-y-6">
          {/* Topo do Campinho: Seletor de Formação e Botão Salvar */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Formação Tática:
              </span>
              <div className="relative">
                <select
                  value={formacao}
                  onChange={(e) => setFormacao(e.target.value)}
                  className="appearance-none pl-4 pr-9 py-2 text-sm font-black bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-2 border-blue-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer shadow-xs"
                >
                  <option value="4-4-2">4-4-2 (Losango)</option>
                  <option value="4-2-3-1">4-2-3-1</option>
                  <option value="4-3-3">4-3-3</option>
                  <option value="3-5-2">3-5-2</option>
                </select>
                <ChevronDown className="w-4 h-4 text-blue-600 pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" />
              </div>
              <span
                className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
                  titularesCount === 11
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                }`}
              >
                {titularesCount} / 11 Titulares
              </span>
            </div>

            <button
              onClick={handleSalvarEscalacao}
              style={{ backgroundColor: '#2563eb' }}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-bold text-white hover:bg-blue-700 active:scale-98 rounded-xl shadow-xs transition-all shrink-0"
            >
              <Save className="w-4 h-4 text-amber-300" />
              <span>Salvar Escalação do Jogo</span>
            </button>
          </div>

          {/* O Campo de Futebol Vertical */}
          {(() => {
            const titularesList = atletas.filter((a) => escalacaoMap[a.id]?.titular);
            const reservas = atletas.filter((a) => escalacaoMap[a.id] && !escalacaoMap[a.id].titular);
            const slots = FORMACOES_CAMPINHO[formacao] || FORMACOES_CAMPINHO['4-4-2'];
            const slotsAtribuidos = atribuirTitularesAosSlots(titularesList, slots);

            const renderPlayerPin = (
              slot: SlotPosicaoCampinho,
              atleta: Atleta | null
            ) => {
              if (!atleta) {
                return (
                  <button
                    key={slot.id}
                    type="button"
                    onClick={() => {
                      setAtletaParaTroca({ atletaId: '', tipo: 'titular', posicaoSlot: slot.label });
                      setModalTrocaAberto(true);
                    }}
                    className="flex flex-col items-center group cursor-pointer transition-transform hover:scale-105 active:scale-95"
                  >
                    <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full border-2 border-dashed border-blue-400 bg-white/95 backdrop-blur-xs flex flex-col items-center justify-center text-blue-600 group-hover:bg-white group-hover:border-blue-600 transition-all shadow-md relative">
                      <span className="text-base font-black leading-none text-blue-600">+</span>
                      {/* Selo da sigla da posição */}
                      <span className="absolute -top-1.5 -right-1 text-[8.5px] font-black px-1.5 py-0.2 rounded-full shadow bg-blue-600 text-white border border-white leading-tight">
                        {slot.label}
                      </span>
                    </div>
                    <div className="mt-1 px-1.5 py-0.5 rounded bg-black/75 text-[9px] font-bold text-white shadow backdrop-blur-xs leading-tight">
                      Vazio
                    </div>
                  </button>
                );
              }

              const iniciais = atleta.nome
                .split(' ')
                .filter(Boolean)
                .slice(0, 2)
                .map((p) => p[0])
                .join('')
                .toUpperCase();

              return (
                <button
                  key={slot.id}
                  type="button"
                  onClick={() => {
                    setAtletaParaTroca({ atletaId: atleta.id, tipo: 'titular' });
                    setModalTrocaAberto(true);
                  }}
                  className="flex flex-col items-center group cursor-pointer transition-transform hover:scale-110 active:scale-95 relative"
                  title={`${atleta.nome} (${slot.label}) - Clique para trocar`}
                >
                  {/* Bolinha branca com borda azul (#2563eb) */}
                  <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white border-2 border-blue-600 shadow-xl relative flex items-center justify-center p-0.5 overflow-visible">
                    {atleta.fotoUrl ? (
                      <img
                        src={atleta.fotoUrl}
                        alt={atleta.nome}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full rounded-full bg-white flex items-center justify-center font-black text-xs sm:text-sm text-blue-700 tracking-tight">
                        {atleta.numeroCamisa ? `#${atleta.numeroCamisa}` : iniciais}
                      </div>
                    )}

                    {/* Selo com a sigla da posição (GOL, LE, ZAG, LD, VOL, MEI, ATA) */}
                    <span className="absolute -top-1.5 -right-1 text-[8.5px] sm:text-[9px] font-black px-1.5 py-0.2 rounded-full shadow bg-blue-600 text-white border border-white leading-tight pointer-events-none">
                      {slot.label}
                    </span>
                  </div>

                  {/* Nome do jogador legível embaixo */}
                  <div className="mt-1 px-1.5 py-0.5 rounded-md bg-black/85 text-[10px] sm:text-[11px] font-black text-white shadow border border-white/20 max-w-[85px] sm:max-w-[100px] truncate text-center leading-tight">
                    {atleta.apelido || atleta.nome.split(' ')[0]}
                  </div>
                </button>
              );
            };

            return (
              <div className="space-y-6">
                <div className="relative w-full max-w-xl mx-auto rounded-3xl overflow-hidden shadow-2xl border-4 border-emerald-950 bg-emerald-800 text-white select-none h-[620px] sm:h-[680px]">
                  {/* Gramado listrado em tons de verde */}
                  <div className="absolute inset-0 opacity-15 pointer-events-none flex flex-col">
                    {[...Array(8)].map((_, i) => (
                      <div key={i} className={`flex-1 ${i % 2 === 0 ? 'bg-black' : 'bg-white'}`} />
                    ))}
                  </div>

                  {/* Linhas de Marcação do Campo (SVG de Alta Fidelidade) */}
                  <svg
                    className="absolute inset-0 w-full h-full pointer-events-none stroke-white/50"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                  >
                    {/* Linha Externa do Campo */}
                    <rect x="3%" y="2%" width="94%" height="96%" strokeWidth="2.5" rx="8" />

                    {/* Linha do Meio de Campo (exatamente 50%) */}
                    <line x1="3%" y1="50%" x2="97%" y2="50%" strokeWidth="2.5" />

                    {/* Círculo Central */}
                    <circle cx="50%" cy="50%" r="52" strokeWidth="2.5" />
                    <circle cx="50%" cy="50%" r="3.5" fill="rgba(255,255,255,0.75)" />

                    {/* Grande Área Superior (Adversário) - termina em 18% para atacantes em top 24% ficarem fora */}
                    <rect x="22%" y="2%" width="56%" height="16%" strokeWidth="2.5" />
                    <rect x="35%" y="2%" width="30%" height="6%" strokeWidth="2" />
                    <circle cx="50%" cy="13%" r="3" fill="rgba(255,255,255,0.75)" />

                    {/* Gol adversário (indicador no topo) */}
                    <rect x="42%" y="0.5%" width="16%" height="1.5%" strokeWidth="2" fill="rgba(255,255,255,0.25)" />

                    {/* Grande Área Inferior (Nosso Goleiro) - começa em 82% para zagueiros e laterais em top 78% ficarem antes da área */}
                    <rect x="22%" y="82%" width="56%" height="16%" strokeWidth="2.5" />
                    <rect x="35%" y="92%" width="30%" height="6%" strokeWidth="2" />
                    <circle cx="50%" cy="87%" r="3" fill="rgba(255,255,255,0.75)" />

                    {/* Nosso Gol (indicador na base) */}
                    <rect x="42%" y="98%" width="16%" height="1.5%" strokeWidth="2" fill="rgba(255,255,255,0.25)" />
                  </svg>

                  {/* Posicionamento Absoluto dos 11 Jogadores com % Exatos (left% / top%) */}
                  {slotsAtribuidos.map(({ slot, atleta }) => (
                    <div
                      key={slot.id}
                      style={{
                        position: 'absolute',
                        left: `${slot.left}%`,
                        top: `${slot.top}%`,
                        transform: 'translate(-50%, -50%)',
                      }}
                      className="z-20 flex flex-col items-center pointer-events-auto"
                    >
                      {renderPlayerPin(slot, atleta)}
                    </div>
                  ))}
                </div>

                {/* BANCO DE RESERVAS */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-amber-500" />
                      <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                        Banco de Reservas ({reservas.length})
                      </h3>
                    </div>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Clique no reserva para colocá-lo como titular
                    </span>
                  </div>

                  {reservas.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                      Nenhum atleta no banco de reservas. Vá até a aba <b>Lista</b> para convocar atletas como reserva ou clique em um titular acima para movê-lo ao banco.
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                      {reservas.map((res) => {
                        const escalado = escalacaoMap[res.id];
                        return (
                          <button
                            key={res.id}
                            type="button"
                            onClick={() => {
                              setAtletaParaTroca({ atletaId: res.id, tipo: 'reserva' });
                              setModalTrocaAberto(true);
                            }}
                            className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/80 hover:border-amber-400 hover:bg-amber-50/50 dark:hover:bg-amber-950/30 transition-all text-left group"
                          >
                            {res.fotoUrl ? (
                              <img
                                src={res.fotoUrl}
                                alt={res.nome}
                                className="w-9 h-9 rounded-full object-cover border border-slate-300 dark:border-slate-600 shrink-0"
                              />
                            ) : (
                              <div className="w-9 h-9 rounded-full bg-amber-500 text-white font-black text-xs flex items-center justify-center shrink-0">
                                {res.numeroCamisa ? `#${res.numeroCamisa}` : res.nome.charAt(0)}
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <div className="text-xs font-extrabold text-slate-900 dark:text-white truncate group-hover:text-amber-700 dark:group-hover:text-amber-300">
                                {res.apelido || res.nome}
                              </div>
                              <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                <span>{escalado?.posicaoJogo || res.posicao}</span>
                              </div>
                            </div>
                            <ArrowLeftRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-600 shrink-0" />
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Botão Inferior Salvar Escalação do Jogo no Campinho */}
                <div className="pt-2 flex justify-end">
                  <button
                    onClick={handleSalvarEscalacao}
                    style={{ backgroundColor: '#2563eb' }}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-bold text-white hover:bg-blue-700 active:scale-98 rounded-xl shadow-md transition-all"
                  >
                    <Save className="w-4 h-4 text-amber-300" />
                    <span>Salvar Escalação do Jogo ({totalConvocados} convocados)</span>
                  </button>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL DE TROCA / SUBSTITUIÇÃO RÁPIDA ENTRE TITULAR E RESERVA */}
      {/* ========================================================= */}
      {modalTrocaAberto && atletaParaTroca && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full max-h-[85vh] overflow-hidden flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800">
            {/* Cabeçalho do Modal */}
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  {atletaParaTroca.tipo === 'titular'
                    ? atletaParaTroca.atletaId
                      ? `Substituir Titular: ${
                          atletas.find((a) => a.id === atletaParaTroca.atletaId)?.nome || ''
                        }`
                      : `Escalar Titular (${atletaParaTroca.posicaoSlot || 'Campo'})`
                    : `Promover a Titular: ${
                        atletas.find((a) => a.id === atletaParaTroca.atletaId)?.nome || ''
                      }`}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {atletaParaTroca.tipo === 'titular'
                    ? 'Escolha um atleta do banco para entrar no lugar dele:'
                    : 'Escolha qual titular sai de campo para ele entrar:'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setModalTrocaAberto(false);
                  setAtletaParaTroca(null);
                }}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Conteúdo do Modal com Opções de Troca */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
              {/* CASO 1: Clicou em um Titular (quer trocar por reserva ou mover para o banco) */}
              {atletaParaTroca.tipo === 'titular' && (
                <>
                  {atletaParaTroca.atletaId && (
                    <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-900 flex items-center justify-between">
                      <span className="text-xs font-bold text-blue-900 dark:text-blue-200">
                        Quer apenas tirar este atleta de campo?
                      </span>
                      <button
                        type="button"
                        onClick={() => handleMoverParaBanco(atletaParaTroca.atletaId)}
                        className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold transition-all shadow-xs"
                      >
                        Mover para o Banco
                      </button>
                    </div>
                  )}

                  <div>
                    <h4 className="text-xs font-extrabold uppercase text-slate-500 tracking-wider mb-2">
                      Opções no Banco de Reservas:
                    </h4>
                    {(() => {
                      const reservas = atletas.filter(
                        (a) => escalacaoMap[a.id] && !escalacaoMap[a.id].titular
                      );
                      if (reservas.length === 0) {
                        return (
                          <div className="p-4 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                            Nenhum reserva disponível no banco.
                          </div>
                        );
                      }
                      return (
                        <div className="space-y-2">
                          {reservas.map((r) => (
                            <button
                              key={r.id}
                              type="button"
                              onClick={() => {
                                if (atletaParaTroca.atletaId) {
                                  handleTrocarTitularReserva(atletaParaTroca.atletaId, r.id);
                                } else {
                                  handlePromoverParaTitular(r.id, atletaParaTroca.posicaoSlot);
                                }
                              }}
                              className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/50 border border-slate-200 dark:border-slate-700 hover:border-blue-500 transition-all group text-left"
                            >
                              <div className="flex items-center gap-3">
                                {r.fotoUrl ? (
                                  <img
                                    src={r.fotoUrl}
                                    alt={r.nome}
                                    className="w-9 h-9 rounded-full object-cover"
                                  />
                                ) : (
                                  <div className="w-9 h-9 rounded-full bg-amber-500 text-white font-black text-xs flex items-center justify-center">
                                    {r.nome.charAt(0)}
                                  </div>
                                )}
                                <div>
                                  <div className="text-xs font-extrabold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                                    {r.nome}
                                  </div>
                                  <div className="text-[10px] text-slate-500">
                                    {escalacaoMap[r.id]?.posicaoJogo || r.posicao} · {r.categoria}
                                  </div>
                                </div>
                              </div>
                              <span className="px-2.5 py-1 text-xs font-bold text-blue-600 bg-blue-100 dark:bg-blue-900/60 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-all">
                                Colocar no lugar
                              </span>
                            </button>
                          ))}
                        </div>
                      );
                    })()}
                  </div>

                  {/* Outros atletas do plantel que não foram convocados */}
                  <div className="pt-2">
                    <h4 className="text-xs font-extrabold uppercase text-slate-500 tracking-wider mb-2">
                      Outros Atletas do Plantel:
                    </h4>
                    <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                      {atletas
                        .filter((a) => !escalacaoMap[a.id])
                        .slice(0, 10)
                        .map((outro) => (
                          <button
                            key={outro.id}
                            type="button"
                            onClick={() => {
                              if (atletaParaTroca.atletaId) {
                                handleTrocarTitularReserva(atletaParaTroca.atletaId, outro.id);
                              } else {
                                handlePromoverParaTitular(outro.id, atletaParaTroca.posicaoSlot);
                              }
                            }}
                            className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-blue-50 dark:hover:bg-blue-950/40 border border-slate-200 dark:border-slate-700/60 text-left transition-all group"
                          >
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate group-hover:text-blue-600">
                              {outro.nome} ({outro.posicao})
                            </span>
                            <span className="text-[11px] font-bold text-blue-600 group-hover:underline">
                              Convocar e Escalar
                            </span>
                          </button>
                        ))}
                    </div>
                  </div>
                </>
              )}

              {/* CASO 2: Clicou em um Reserva (quer promover a titular) */}
              {atletaParaTroca.tipo === 'reserva' && (
                <>
                  {titularesCount < 11 && (
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                        O time tem menos de 11 titulares. Quer entrar direto?
                      </span>
                      <button
                        type="button"
                        onClick={() => handlePromoverParaTitular(atletaParaTroca.atletaId)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs"
                      >
                        Entrar Direto
                      </button>
                    </div>
                  )}

                  <div>
                    <h4 className="text-xs font-extrabold uppercase text-slate-500 tracking-wider mb-2">
                      Titulares em campo (escolha quem sai para o banco):
                    </h4>
                    {(() => {
                      const titularesList = atletas.filter(
                        (a) => escalacaoMap[a.id]?.titular
                      );
                      if (titularesList.length === 0) {
                        return (
                          <div className="p-4 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                            Nenhum titular escalado ainda.
                          </div>
                        );
                      }
                      return (
                        <div className="space-y-2">
                          {titularesList.map((tit) => (
                            <button
                              key={tit.id}
                              type="button"
                              onClick={() =>
                                handleTrocarTitularReserva(tit.id, atletaParaTroca.atletaId)
                              }
                              className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-amber-950/50 border border-slate-200 dark:border-slate-700 hover:border-amber-400 transition-all group text-left"
                            >
                              <div className="flex items-center gap-3">
                                {tit.fotoUrl ? (
                                  <img
                                    src={tit.fotoUrl}
                                    alt={tit.nome}
                                    className="w-9 h-9 rounded-full object-cover"
                                  />
                                ) : (
                                  <div className="w-9 h-9 rounded-full bg-blue-600 text-white font-black text-xs flex items-center justify-center">
                                    {tit.nome.charAt(0)}
                                  </div>
                                )}
                                <div>
                                  <div className="text-xs font-extrabold text-slate-900 dark:text-white group-hover:text-amber-600">
                                    {tit.nome}
                                  </div>
                                  <div className="text-[10px] text-slate-500">
                                    {escalacaoMap[tit.id]?.posicaoJogo || tit.posicao} · {tit.categoria}
                                  </div>
                                </div>
                              </div>
                              <span className="px-2.5 py-1 text-xs font-bold text-amber-600 bg-amber-100 dark:bg-amber-950/60 rounded-lg group-hover:bg-amber-500 group-hover:text-white transition-all">
                                Trocar por este
                              </span>
                            </button>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                </>
              )}
            </div>

            {/* Rodapé do Modal */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setModalTrocaAberto(false);
                  setAtletaParaTroca(null);
                }}
                className="px-5 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
