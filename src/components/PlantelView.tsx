import React, { useState, useEffect, useMemo } from 'react';
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
  Check,
  AlertCircle,
  Trophy,
  ArrowLeftRight,
  X,
  ChevronDown,
  ArrowLeft,
  FileText,
} from 'lucide-react';
import { Atleta, AvaliacaoJogo, JogoAgenda, POSICOES_JOGO, AtletaEscalado } from '../types';
import { storageService } from '../services/storage';
import { formatarDataExibicao } from '../utils/dateUtils';
import { obterIniciaisApelido } from '../utils/apelidoUtils';
import {
  SlotPosicaoCampinho,
  normalizarSlotId,
  FORMACOES_CAMPINHO,
  BLOQUINHOS_FORMACAO,
  detectarFormacaoDaEscalacao,
  GrupoPosicaoFormacao,
  obterGruposEscalacaoDaFormacao,
  remapearEscalacaoParaFormacao,
} from '../utils/formacoesUtils';
import { ModalSumulaArbitragem, ModalEstrategiaJogo } from './DocumentosJogoModals';

export { FORMACOES_CAMPINHO, BLOQUINHOS_FORMACAO, normalizarSlotId };
export type { SlotPosicaoCampinho };

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
  onVoltarParaAgenda?: () => void;
}



/**
 * Funções auxiliares para pé e posições
 */
function isPeEsquerdo(perna?: string): boolean {
  if (!perna) return false;
  const p = perna.toLowerCase();
  return p.includes('canhoto') || p.includes('esquerd') || p.includes('ambidestr');
}

function isPeDireito(perna?: string): boolean {
  if (!perna) return false;
  const p = perna.toLowerCase();
  return p.includes('destro') || p.includes('direit') || p.includes('ambidestr');
}

function formatarPe(perna?: string): string {
  if (!perna) return 'Direito';
  const p = perna.toLowerCase();
  if (p.includes('ambidestr')) return 'Ambidestro';
  if (p.includes('canhoto') || p.includes('esquerd')) return 'Esquerdo';
  return 'Direito';
}

/**
 * Calcula score numérico de priorização do atleta para a vaga selecionada (menor número = maior prioridade).
 * Dentro de cada tier de pontuação, desempata em ordem alfabética A-Z.
 * Ambidestro conta como prioritário tanto para pé esquerdo quanto direito.
 */
function calcularScoreAtleta(atleta: Atleta, vaga: string, categoriaJogo: string): number {
  const mesmaCat = atleta.categoria === categoriaJogo;
  const catPenalty = mesmaCat ? 0 : 1000;
  const pos = (atleta.posicao || '').toLowerCase();
  const peEsq = isPeEsquerdo(atleta.pernaDominante);
  const peDir = isPeDireito(atleta.pernaDominante);

  const isGol = pos.includes('gol');
  const isLE = pos.includes('lateral') && (pos.includes('esquerd') || pos.includes('le'));
  const isLD = pos.includes('lateral') && (pos.includes('direit') || pos.includes('ld'));
  const isZag = pos.includes('zag') || pos.includes('def');
  const isVol = pos.includes('vol');
  const isMei = pos.includes('mei') || pos.includes('meio');
  const isAta = pos.includes('ata') || pos.includes('pon') || pos.includes('cent') || pos.includes('ext');

  switch (vaga) {
    case 'ZAG-E':
      // 1º Zagueiros SUB-15 pé esquerdo, 2º Zagueiros SUB-15 pé direito, 3º Outras posições SUB-15, 4º Outras categorias
      if (isZag && peEsq) return catPenalty + 10;
      if (isZag && peDir) return catPenalty + 20;
      if (isZag) return catPenalty + 25;
      return catPenalty + 50;

    case 'ZAG-D':
      if (isZag && peDir) return catPenalty + 10;
      if (isZag && peEsq) return catPenalty + 20;
      if (isZag) return catPenalty + 25;
      return catPenalty + 50;

    case 'LE':
      // 1º LE pé esquerdo, 2º LE pé direito, 3º LD, 4º Outras posições, 5º Outras categorias
      if (isLE && peEsq) return catPenalty + 10;
      if (isLE && peDir) return catPenalty + 20;
      if (isLE) return catPenalty + 25;
      if (isLD) return catPenalty + 30;
      return catPenalty + 50;

    case 'LD':
      if (isLD && peDir) return catPenalty + 10;
      if (isLD && peEsq) return catPenalty + 20;
      if (isLD) return catPenalty + 25;
      if (isLE) return catPenalty + 30;
      return catPenalty + 50;

    case 'GOL':
      if (isGol) return catPenalty + 10;
      return catPenalty + 50;

    case 'VOL':
      if (isVol) return catPenalty + 10;
      if (isMei) return catPenalty + 20;
      return catPenalty + 50;

    case 'VOL-E':
      if (isVol && peEsq) return catPenalty + 10;
      if (isVol && peDir) return catPenalty + 20;
      if (isVol) return catPenalty + 25;
      if (isMei) return catPenalty + 30;
      return catPenalty + 50;

    case 'VOL-D':
      if (isVol && peDir) return catPenalty + 10;
      if (isVol && peEsq) return catPenalty + 20;
      if (isVol) return catPenalty + 25;
      if (isMei) return catPenalty + 30;
      return catPenalty + 50;

    case 'MEI-E':
      if (isMei && peEsq) return catPenalty + 10;
      if (isMei && peDir) return catPenalty + 20;
      if (isMei) return catPenalty + 25;
      if (isVol || isAta) return catPenalty + 35;
      return catPenalty + 50;

    case 'MEI-D':
      if (isMei && peDir) return catPenalty + 10;
      if (isMei && peEsq) return catPenalty + 20;
      if (isMei) return catPenalty + 25;
      if (isVol || isAta) return catPenalty + 35;
      return catPenalty + 50;

    case 'MEI-C':
    case 'MEI-C / 10':
    case 'MEI-CE':
    case 'MEI-CD':
      if (isMei) return catPenalty + 10;
      if (isVol || isAta) return catPenalty + 25;
      return catPenalty + 50;

    case 'ATA-E':
      if (isAta && peEsq) return catPenalty + 10;
      if (isAta && peDir) return catPenalty + 20;
      if (isAta) return catPenalty + 25;
      if (isMei) return catPenalty + 35;
      return catPenalty + 50;

    case 'ATA-D':
      if (isAta && peDir) return catPenalty + 10;
      if (isAta && peEsq) return catPenalty + 20;
      if (isAta) return catPenalty + 25;
      if (isMei) return catPenalty + 35;
      return catPenalty + 50;

    case 'ATA':
    case 'ATA-C':
      if (isAta) return catPenalty + 10;
      if (isMei) return catPenalty + 25;
      return catPenalty + 50;

    case 'TODOS':
    default:
      // Ordem ao tocar em [TODOS]: GOL, LE, ZAG-E, ZAG-D, LD, VOL, MEI-E, MEI-C / 10, MEI-D, ATA-E, ATA-D
      if (isGol) return catPenalty + 10;
      if (isLE) return catPenalty + (peEsq ? 20 : 25);
      if (isZag) return catPenalty + (peEsq ? 30 : 35);
      if (isLD) return catPenalty + (peDir ? 40 : 45);
      if (isVol) return catPenalty + 50;
      if (isMei) {
        if (peEsq) return catPenalty + 60;
        if (peDir) return catPenalty + 70;
        return catPenalty + 65;
      }
      if (isAta) {
        if (peEsq) return catPenalty + 80;
        if (pos.includes('cent')) return catPenalty + 85;
        if (peDir) return catPenalty + 90;
        return catPenalty + 88;
      }
      return catPenalty + 99;
  }
}

/**
 * Extrai o número da categoria (ex: SUB-15 -> 15, SUB-16 -> 16, SUB-17 -> 17)
 */
function extrairNumeroCategoria(cat?: string): number {
  if (!cat) return 999;
  const match = cat.match(/\d+/);
  return match ? parseInt(match[0], 10) : 999;
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

type PosicaoBaseKey = 'GOL' | 'LD' | 'LE' | 'ZAG' | 'VOL' | 'MEI' | 'ATA' | 'PD' | 'PE';

const ORDEM_POSICAO_TODOS: Record<PosicaoBaseKey, number> = {
  GOL: 1,
  LD: 2,
  LE: 3,
  ZAG: 4,
  VOL: 5,
  MEI: 6,
  ATA: 7,
  PD: 8,
  PE: 9,
};

function mapearPosicaoParaGrupo(posicao?: string): PosicaoBaseKey {
  const pos = (posicao || '').trim().toLowerCase();
  if (pos.includes('gol')) return 'GOL';
  if (pos.includes('lateral') && (pos.includes('direit') || pos === 'ld')) return 'LD';
  if (pos.includes('lateral') && (pos.includes('esquerd') || pos === 'le')) return 'LE';
  if (pos === 'ld') return 'LD';
  if (pos === 'le') return 'LE';
  if (pos.includes('zag') || pos.includes('def')) return 'ZAG';
  if (pos.includes('vol')) return 'VOL';
  if (pos.includes('mei') || pos.includes('meia')) return 'MEI';
  if (pos === 'pd' || (pos.includes('ponta') && pos.includes('dir'))) return 'PD';
  if (pos === 'pe' || (pos.includes('ponta') && pos.includes('esq'))) return 'PE';
  return 'ATA';
}

function atletaCombinaComGrupoFormacao(
  atleta: Atleta,
  grupoKey: string,
  possuiPD: boolean,
  possuiPE: boolean
): boolean {
  const base = mapearPosicaoParaGrupo(atleta.posicao);
  switch (grupoKey) {
    case 'GOL':
      return base === 'GOL';
    case 'LD':
      return base === 'LD';
    case 'LE':
      return base === 'LE';
    case 'ZAG':
      return base === 'ZAG';
    case 'VOL':
      return base === 'VOL';
    case 'MEI':
      return base === 'MEI' || (!possuiPE && base === 'PE') || (!possuiPD && base === 'PD');
    case 'PD':
      return base === 'PD';
    case 'PE':
      return base === 'PE';
    case 'ATA':
      if (!possuiPD && !possuiPE) {
        return base === 'ATA' || base === 'PD' || base === 'PE';
      }
      return base === 'ATA';
    default:
      return false;
  }
}

interface EstiloGrupoPosicao {
  badgeBg: string;
  closedBg: string;
  closedText: string;
  closedBorder: string;
  closedLeftBar: string;
  openBg: string;
  openBorder: string;
  chevronClosed: string;
}

function obterCoresGrupoPosicao(grupoKey: string): EstiloGrupoPosicao {
  if (grupoKey === 'TODOS') {
    return {
      badgeBg: 'rgba(255, 255, 255, 0.2)',
      closedBg: '#1e3a8a',
      closedText: '#ffffff',
      closedBorder: '#1e3a8a',
      closedLeftBar: '#facc15',
      openBg: '#0f295c',
      openBorder: '#0f295c',
      chevronClosed: '#ffffff',
    };
  }

  return {
    badgeBg: '#1e3a8a',
    closedBg: '#f0f6ff',
    closedText: '#1e3a8a',
    closedBorder: '#1e3a8a',
    closedLeftBar: '#1e3a8a',
    openBg: '#1d4ed8',
    openBorder: '#1e3a8a',
    chevronClosed: '#1e3a8a',
  };
}

function obterNomePosicaoPorSlot(slotId: string, formacaoAtual: string): string {
  const norm = normalizarSlotId(slotId);
  const slots = FORMACOES_CAMPINHO[formacaoAtual] || FORMACOES_CAMPINHO['4-4-2 Losango'];
  const slotObj = slots.find((s) => normalizarSlotId(s.id) === norm);
  if (slotObj?.nomeCompleto) return slotObj.nomeCompleto;

  const nomesFixos: Record<string, string> = {
    GOL: 'Goleiro',
    LD: 'Lateral Direito',
    LE: 'Lateral Esquerdo',
    'ZAG-E': 'Zagueiro Esquerdo',
    'ZAG-D': 'Zagueiro Direito',
    'VOL-E': 'Volante Esquerdo',
    'VOL-D': 'Volante Direito',
    'MEI-E': 'Meio-Campista Esquerdo',
    'MEI-D': 'Meio-Campista Direito',
    'MEI-C': 'Meio-Campo Central (10)',
    'ATA-E': 'Atacante Esquerdo',
    'ATA-D': 'Atacante Direito',
    PD: 'Ponta Direita',
    PE: 'Ponta Esquerda',
  };

  return nomesFixos[norm] || norm;
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
  onVoltarParaAgenda,
}) => {
  const [busca, setBusca] = useState('');
  const [filtroCategoriaLista, setFiltroCategoriaLista] = useState<string>(() => {
    try {
      return (
        localStorage.getItem('mastersoccer_escalacao_categoria_lista_v1') ||
        sessionStorage.getItem('mastersoccer_escalacao_categoria_lista_v1') ||
        'TODAS'
      );
    } catch {
      return 'TODAS';
    }
  });
  const [abaSubEscalacao, setAbaSubEscalacao] = useState<'lista' | 'campinho'>(() => {
    try {
      const saved =
        localStorage.getItem('mastersoccer_escalacao_subaba_v1') ||
        sessionStorage.getItem('mastersoccer_escalacao_subaba_v1');
      return saved === 'campinho' ? 'campinho' : 'lista';
    } catch {
      return 'lista';
    }
  });
  const [formacao, setFormacao] = useState<string>('4-4-2 Losango');
  const [posicaoAberta, setPosicaoAberta] = useState<string | null>(null);
  const [modalTrocaAberto, setModalTrocaAberto] = useState<boolean>(false);
  const [slotSelecionado, setSlotSelecionado] = useState<string | null>(null);
  const [atletaParaTroca, setAtletaParaTroca] = useState<{
    atletaId: string;
    tipo: 'titular' | 'reserva';
    posicaoSlot?: string;
  } | null>(null);

  const [jogoAtivoId, setJogoAtivoId] = useState<string>(jogoSelecionadoId || '');

  // Mapa local de atletas escalados para o jogo ativo: { [atletaId]: AtletaEscalado }
  const [escalacaoMap, setEscalacaoMap] = useState<Record<string, AtletaEscalado>>({});
  const [salvandoFeedback, setSalvandoFeedback] = useState<string | null>(null);

  // Estados para Modais de Súmula Oficial e Estratégia de Jogo
  const [modalSumulaAberto, setModalSumulaAberto] = useState(false);
  const [modalEstrategiaAberto, setModalEstrategiaAberto] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem('mastersoccer_escalacao_categoria_lista_v1', filtroCategoriaLista);
      sessionStorage.setItem('mastersoccer_escalacao_categoria_lista_v1', filtroCategoriaLista);
    } catch {}
  }, [filtroCategoriaLista]);

  useEffect(() => {
    try {
      localStorage.setItem('mastersoccer_escalacao_subaba_v1', abaSubEscalacao);
      sessionStorage.setItem('mastersoccer_escalacao_subaba_v1', abaSubEscalacao);
    } catch {}
  }, [abaSubEscalacao]);

  // Sincroniza quando jogos ou jogoSelecionadoId mudarem
  useEffect(() => {
    setJogoAtivoId(jogoSelecionadoId || '');
  }, [jogoSelecionadoId]);

  useEffect(() => {
    const jogo = jogos.find((j) => j.id === jogoAtivoId);
    if (jogo) {
      const formacaoDetectada = detectarFormacaoDaEscalacao(jogo.escalacao, jogo.formacao);
      const slotsValidos = new Set(
        (FORMACOES_CAMPINHO[formacaoDetectada] || FORMACOES_CAMPINHO['4-4-2 Losango']).map((s) =>
          normalizarSlotId(s.id)
        )
      );
      const escOriginal = jogo.escalacao || {};
      const precisaRemapear = Object.values(escOriginal).some(
        (item) => item?.titular && (!item.posicaoSlot || !slotsValidos.has(normalizarSlotId(item.posicaoSlot)))
      );
      setFormacao(formacaoDetectada);
      setEscalacaoMap(
        precisaRemapear ? remapearEscalacaoParaFormacao(escOriginal, formacaoDetectada) : escOriginal
      );
    } else {
      setEscalacaoMap({});
      setFormacao('4-4-2 Losango');
    }
    setSalvandoFeedback(null);
  }, [jogoAtivoId, jogos]);

  const handleTrocarFormacao = (novaFormacao: string) => {
    setFormacao(novaFormacao);
    setEscalacaoMap((prev) => remapearEscalacaoParaFormacao(prev, novaFormacao));
    const gruposNovos = obterGruposEscalacaoDaFormacao(novaFormacao);
    if (posicaoAberta && !gruposNovos.some((g) => g.key === posicaoAberta)) {
      setPosicaoAberta(null);
    }
  };

  const jogoAtivo = jogos.find((j) => j.id === jogoAtivoId) || null;

  // Encontra um slot vago EXCLUSIVAMENTE dentro da própria posição do atleta na formação atual.
  // Se todas as vagas daquela posição estiverem cheias, retorna a última vaga da MESMA posição (para substituir sem empurrar ninguém para outra posição).
  // Se aquela posição não existir na formação atual, retorna null.
  const encontrarSlotDaMesmaPosicao = (
    atleta: Atleta,
    formacaoAtual: string,
    escalacaoAtual: Record<string, AtletaEscalado>
  ): string | null => {
    const slots = FORMACOES_CAMPINHO[formacaoAtual] || FORMACOES_CAMPINHO['4-4-2 Losango'];
    const idsFormacao = new Set(slots.map((s) => normalizarSlotId(s.id)));
    const slotsOcupados = new Set<string>();

    for (const id in escalacaoAtual) {
      const item = escalacaoAtual[id];
      if (item?.titular && item.posicaoSlot && id !== atleta.id) {
        slotsOcupados.add(normalizarSlotId(item.posicaoSlot));
      }
    }

    const pos = (atleta.posicao || '').toLowerCase();
    const peEsq = isPeEsquerdo(atleta.pernaDominante);
    let candidatosMesmaPosicao: string[] = [];

    if (pos.includes('gol')) {
      candidatosMesmaPosicao = ['GOL'];
    } else if (pos.includes('lateral')) {
      if (pos.includes('esquerd') || pos === 'le') {
        candidatosMesmaPosicao = ['LE'];
      } else if (pos.includes('direit') || pos === 'ld') {
        candidatosMesmaPosicao = ['LD'];
      } else {
        candidatosMesmaPosicao = peEsq ? ['LE', 'LD'] : ['LD', 'LE'];
      }
    } else if (pos.includes('zag') || pos.includes('def')) {
      candidatosMesmaPosicao = ['ZAG-E', 'ZAG-D'];
    } else if (pos.includes('vol')) {
      candidatosMesmaPosicao = ['VOL', 'VOL-E', 'VOL-D'];
    } else if (pos.includes('mei') || pos.includes('meio')) {
      candidatosMesmaPosicao = ['MEI-E', 'MEI-C', 'MEI-CE', 'MEI-CD', 'MEI-D'];
    } else if (pos.includes('ponta')) {
      if (pos.includes('esquerd') || pos === 'pe') {
        candidatosMesmaPosicao = idsFormacao.has('ATA-E') ? ['ATA-E'] : [];
      } else {
        candidatosMesmaPosicao = idsFormacao.has('ATA-D') ? ['ATA-D'] : [];
      }
    } else if (pos.includes('ata') || pos.includes('cent') || pos.includes('ext')) {
      candidatosMesmaPosicao = ['ATA', 'ATA-C', 'ATA-E', 'ATA-D'];
    }

    const validos = candidatosMesmaPosicao.filter((sid) => idsFormacao.has(sid));
    if (validos.length === 0) return null;

    const primeiroLivre = validos.find((sid) => !slotsOcupados.has(sid));
    return primeiroLivre || validos[validos.length - 1];
  };

  // 1 CLIQUE JÁ CONVOCA / DESCONVOCA: [Titular]
  // Regra de travamento: cada jogador fica TRAVADO exatamente na vaga onde foi colocado.
  // Se a vaga daquela posição já estiver cheia, desmarca quem estava na vaga e coloca o novo no MESMO lugar, sem empurrar ninguém para outra posição.
  const handleToggleTitular = (atleta: Atleta, grupo?: GrupoPosicaoFormacao) => {
    setEscalacaoMap((prev) => {
      const copy = { ...prev };
      const escaladoAtual = copy[atleta.id];
      const slotAtual = escaladoAtual?.posicaoSlot
        ? normalizarSlotId(escaladoAtual.posicaoSlot)
        : '';

      // Se clicou dentro de um grupo específico da formação (não TODOS)
      if (grupo && grupo.key !== 'TODOS' && grupo.slots.length > 0) {
        // Se o atleta já está marcado como Titular, desmarca imediatamente sem mover ninguém
        if (escaladoAtual?.titular) {
          delete copy[atleta.id];
          return copy;
        }

        const slotsDoGrupo = grupo.slots.map((s) => normalizarSlotId(s));

        const slotsLivres = slotsDoGrupo.filter(
          (sid) =>
            !Object.entries(copy).some(
              ([id, info]) =>
                id !== atleta.id &&
                info?.titular &&
                normalizarSlotId(info.posicaoSlot || '') === sid
            )
        );

        let vagaLivre: string | undefined;
        if (slotsLivres.length > 0) {
          const posLower = (atleta.posicao || '').toLowerCase();
          const peLower = (atleta.pernaDominante || '').toLowerCase();
          const prefEsquerda =
            posLower.includes('esquerd') ||
            posLower === 'pe' ||
            peLower.includes('esquerd') ||
            peLower.includes('canhot');
          const prefDireita = posLower.includes('direit') || posLower === 'pd';

          if (prefEsquerda) {
            vagaLivre = slotsLivres.find((s) => s.endsWith('-E')) || slotsLivres[0];
          } else if (prefDireita) {
            vagaLivre = slotsLivres.find((s) => s.endsWith('-D')) || slotsLivres[0];
          } else {
            vagaLivre = slotsLivres[0];
          }
        }

        const targetSlotId = vagaLivre || slotsDoGrupo[slotsDoGrupo.length - 1];

        // Desmarca o jogador que estava naquela vaga específica (NUNCA empurra ele para outra posição)
        for (const id in copy) {
          if (
            id !== atleta.id &&
            copy[id]?.titular &&
            normalizarSlotId(copy[id].posicaoSlot || '') === targetSlotId
          ) {
            delete copy[id];
          }
        }

        copy[atleta.id] = {
          atletaId: atleta.id,
          titular: true,
          posicaoJogo: obterNomePosicaoPorSlot(targetSlotId, formacao),
          posicaoSlot: targetSlotId,
        };

        return copy;
      }

      // Clicou dentro de TODOS:
      if (escaladoAtual?.titular) {
        delete copy[atleta.id];
        return copy;
      }

      const targetSlotId = encontrarSlotDaMesmaPosicao(atleta, formacao, copy);
      if (!targetSlotId) {
        return copy;
      }

      for (const id in copy) {
        if (
          id !== atleta.id &&
          copy[id]?.titular &&
          normalizarSlotId(copy[id].posicaoSlot || '') === targetSlotId
        ) {
          delete copy[id];
        }
      }

      copy[atleta.id] = {
        atletaId: atleta.id,
        titular: true,
        posicaoJogo: obterNomePosicaoPorSlot(targetSlotId, formacao),
        posicaoSlot: targetSlotId,
      };

      return copy;
    });
  };

  // 1 CLIQUE JÁ CONVOCA / DESCONVOCA: [Reserva]
  const handleToggleReserva = (atleta: Atleta) => {
    setEscalacaoMap((prev) => {
      const copy = { ...prev };
      const escaladoAtual = copy[atleta.id];

      if (escaladoAtual && !escaladoAtual.titular) {
        // Clicou de novo no botão que já estava marcado -> DESMARCA o atleta sem mover ninguém
        delete copy[atleta.id];
        return copy;
      }

      // Convocado como reserva: vai direto para o Banco de Reservas e libera qualquer vaga de campo
      copy[atleta.id] = {
        atletaId: atleta.id,
        titular: false,
        posicaoJogo: 'Reserva',
        posicaoSlot: undefined,
      };
      return copy;
    });
  };

  // Atribuição 100% determinística dos titulares aos slots exatos da formação tática.
  // Cada jogador aparece APENAS no slot onde está travado, sem fallback nem pulo para outra posição.
  const atribuirTitularesAosSlots = (
    titularesList: Atleta[],
    slots: SlotPosicaoCampinho[]
  ): Array<{ slot: SlotPosicaoCampinho; atleta: Atleta | null }> => {
    const usados = new Set<string>();

    return slots.map((slot) => {
      const targetId = normalizarSlotId(slot.id);
      const atleta =
        titularesList.find((a) => {
          if (usados.has(a.id)) return false;
          const info = escalacaoMap[a.id];
          return info && info.titular && normalizarSlotId(info.posicaoSlot || '') === targetId;
        }) || null;

      if (atleta) usados.add(atleta.id);
      return { slot, atleta };
    });
  };

  // Colocar jogador exatamente no slot selecionado do campinho
  const handleColocarJogadorNoSlot = (atletaId: string, slotId: string) => {
    const normSlot = normalizarSlotId(slotId);
    const slots = FORMACOES_CAMPINHO[formacao] || FORMACOES_CAMPINHO['4-4-2 Losango'];
    const slotObj = slots.find((s) => normalizarSlotId(s.id) === normSlot);
    const nomePosicao = slotObj?.nomeCompleto || slotObj?.label || 'Titular';

    setEscalacaoMap((prev) => {
      const copy = { ...prev };

      // Se outro jogador já estava nessa vaga, ele é substituído nesta vaga
      for (const id in copy) {
        if (id !== atletaId && normalizarSlotId(copy[id].posicaoSlot || '') === normSlot) {
          delete copy[id];
        }
      }

      // Coloca o atleta selecionado exatamente nesse slotId
      copy[atletaId] = {
        atletaId,
        titular: true,
        posicaoJogo: nomePosicao,
        posicaoSlot: normSlot,
      };

      return copy;
    });

    setSlotSelecionado(null);
    setAtletaParaTroca(null);
    setModalTrocaAberto(false);
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
          posicaoSlot: undefined,
        };
        copy[reservaId] = {
          ...resAtual,
          titular: true,
          posicaoSlot: titAtual.posicaoSlot,
          posicaoJogo: titAtual.posicaoJogo || resAtual.posicaoJogo,
        };
      } else if (titAtual && !resAtual) {
        const atletaRes = atletas.find((a) => a.id === reservaId);
        copy[titularId] = { ...titAtual, titular: false, posicaoSlot: undefined };
        copy[reservaId] = {
          atletaId: reservaId,
          titular: true,
          posicaoSlot: titAtual.posicaoSlot,
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
    setSlotSelecionado(null);
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
          posicaoSlot: undefined,
        },
      };
    });
    setModalTrocaAberto(false);
    setAtletaParaTroca(null);
    setSlotSelecionado(null);
  };

  // Promover atleta para titular
  const handlePromoverParaTitular = (atletaId: string, posicaoJogo?: string) => {
    const atleta = atletas.find((a) => a.id === atletaId);
    if (!atleta) return;
    const targetSlotId = encontrarSlotDaMesmaPosicao(atleta, formacao, escalacaoMap);
    if (!targetSlotId) return;
    const slots = FORMACOES_CAMPINHO[formacao] || FORMACOES_CAMPINHO['4-4-2 Losango'];
    const slotObj = slots.find((s) => normalizarSlotId(s.id) === targetSlotId);
    const nomePosicao = posicaoJogo || slotObj?.nomeCompleto || slotObj?.label || 'Titular';

    setEscalacaoMap((prev) => {
      const copy = { ...prev };
      for (const id in copy) {
        if (id !== atletaId && copy[id]?.titular && normalizarSlotId(copy[id].posicaoSlot || '') === targetSlotId) {
          delete copy[id];
        }
      }
      copy[atletaId] = {
        atletaId,
        titular: true,
        posicaoJogo: nomePosicao,
        posicaoSlot: targetSlotId,
      };
      return copy;
    });
    setModalTrocaAberto(false);
    setAtletaParaTroca(null);
    setSlotSelecionado(null);
  };

  // Salvar Escalação do Jogo
  const handleSalvarEscalacao = async () => {
    if (!jogoAtivo) return;

    const jogoAtualizado: JogoAgenda = {
      ...jogoAtivo,
      escalacao: escalacaoMap,
      formacao,
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

  const categoriaDoJogo = jogoAtivo?.categoria || 'SUB-15';

  const catJogoNum = extrairNumeroCategoria(categoriaDoJogo);

  // Atletas elegíveis para convocação e substituição no modal: apenas mesma categoria ou inferior
  const atletasElegiveisParaModal = useMemo(() => {
    return atletas.filter((a) => extrairNumeroCategoria(a.categoria) <= catJogoNum);
  }, [atletas, catJogoNum]);

  // Atletas elegíveis ordenados para a Lista por Posição (apenas categoria do jogo ou inferior)
  const atletasElegiveisOrdenados = useMemo(() => {
    let base = atletas.filter((a) => extrairNumeroCategoria(a.categoria) <= catJogoNum);
    if (busca.trim()) {
      const b = busca.toLowerCase();
      base = base.filter(
        (a) =>
          a.nome.toLowerCase().includes(b) ||
          (a.apelido && a.apelido.toLowerCase().includes(b)) ||
          a.posicao.toLowerCase().includes(b)
      );
    }

    return [...base].sort((a, b) => {
      const mesmaCatA = a.categoria === categoriaDoJogo ? 0 : 1;
      const mesmaCatB = b.categoria === categoriaDoJogo ? 0 : 1;
      if (mesmaCatA !== mesmaCatB) return mesmaCatA - mesmaCatB;

      const numA = extrairNumeroCategoria(a.categoria);
      const numB = extrairNumeroCategoria(b.categoria);
      if (numA !== numB) return numB - numA;

      const ordA = ORDEM_POSICAO_TODOS[mapearPosicaoParaGrupo(a.posicao)];
      const ordB = ORDEM_POSICAO_TODOS[mapearPosicaoParaGrupo(b.posicao)];
      if (ordA !== ordB) return ordA - ordB;

      const nomeA = a.apelido || a.nome;
      const nomeB = b.apelido || b.nome;
      return nomeA.localeCompare(nomeB, 'pt-BR');
    });
  }, [atletas, busca, categoriaDoJogo, catJogoNum]);

  // Agrupamento dos atletas seguindo EXATAMENTE as vagas da FORMAÇÃO TÁTICA escolhida
  const gruposPosicaoVisiveis = useMemo(() => {
    const gruposDaFormacao = obterGruposEscalacaoDaFormacao(formacao);
    const possuiPD = gruposDaFormacao.some((g) => g.key === 'PD');
    const possuiPE = gruposDaFormacao.some((g) => g.key === 'PE');
    const temBusca = Boolean(busca.trim());

    return gruposDaFormacao
      .map((grupo) => {
        if (grupo.key === 'TODOS') {
          return {
            ...grupo,
            atletas: atletasElegiveisOrdenados,
            preenchidosCount: Object.values(escalacaoMap).filter((e) => e?.titular).length,
            totalVagas: 11,
          };
        }

        const slotsGrupoNorm = new Set(grupo.slots.map((s) => normalizarSlotId(s)));

        const listaFiltrada = atletasElegiveisOrdenados.filter((a) => {
          const esc = escalacaoMap[a.id];
          const slotAtual = esc?.titular && esc.posicaoSlot ? normalizarSlotId(esc.posicaoSlot) : '';
          const jaEscaladoAqui = Boolean(slotAtual && slotsGrupoNorm.has(slotAtual));
          return jaEscaladoAqui || atletaCombinaComGrupoFormacao(a, grupo.key, possuiPD, possuiPE);
        });

        // Ordem FIXA: primeiro atletas da categoria do jogo, depois categorias inferiores (desc), e em ordem alfabética (A-Z) dentro de cada grupo. Nunca reordena ao marcar Titular/Reserva.
        const listaOrdenada = [...listaFiltrada].sort((a, b) => {
          const mesmaCatA = a.categoria === categoriaDoJogo ? 0 : 1;
          const mesmaCatB = b.categoria === categoriaDoJogo ? 0 : 1;
          if (mesmaCatA !== mesmaCatB) return mesmaCatA - mesmaCatB;

          const numA = extrairNumeroCategoria(a.categoria);
          const numB = extrairNumeroCategoria(b.categoria);
          if (numA !== numB) return numB - numA;

          const nomeA = (a.apelido || a.nome).trim();
          const nomeB = (b.apelido || b.nome).trim();
          const cmp = nomeA.localeCompare(nomeB, 'pt-BR', { sensitivity: 'base' });
          if (cmp !== 0) return cmp;
          return a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' });
        });

        const preenchidosCount = Object.values(escalacaoMap).filter(
          (e) => e?.titular && e.posicaoSlot && slotsGrupoNorm.has(normalizarSlotId(e.posicaoSlot))
        ).length;

        return {
          ...grupo,
          atletas: listaOrdenada,
          preenchidosCount,
          totalVagas: grupo.slots.length,
        };
      })
      .filter((g) => {
        // Quando há busca digitada, mostra somente os grupos que encontraram resultados
        if (temBusca) return g.atletas.length > 0;
        // Sem busca, TODOS e TODAS as posições da formação aparecem na lista (espelho do campinho)
        return g.key !== 'TODOS' || g.atletas.length > 0;
      });
  }, [formacao, atletasElegiveisOrdenados, escalacaoMap, busca, categoriaDoJogo]);



  // Se o usuário entrar direto na aba ESCALAÇÃO sem ter selecionado um jogo antes na Agenda:
  if (!jogoAtivo) {
    return (
      <div className="space-y-6 pb-[120px] w-full max-w-full box-border">
        <div className="p-10 sm:p-14 text-center bg-white dark:bg-slate-900 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-800 space-y-4 max-w-lg mx-auto my-8 shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center mx-auto shadow-2xs">
            <Calendar className="w-8 h-8" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
              Selecione um jogo na Agenda para montar a escalação
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
              Abra a aba Jogo, encontre a partida desejada e clique no botão [Escalação] para escalar titulares e reservas.
            </p>
          </div>
          {onVoltarParaAgenda && (
            <button
              type="button"
              onClick={onVoltarParaAgenda}
              style={{ backgroundColor: '#2563eb' }}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white hover:bg-blue-700 active:scale-98 transition shadow-xs cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Ir para Agenda</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-full box-border pb-24 space-y-2.5">
      {/* 1. BLOCO DO JOGO - COLADO LOGO ABAIXO DO CABEÇALHO FININHO */}
      <div className="p-3 sm:p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-2xs space-y-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-lg sm:text-xl font-black text-slate-900 dark:text-white leading-tight">
            {jogoAtivo.adversario.startsWith('vs') ? jogoAtivo.adversario : `vs ${jogoAtivo.adversario}`}
          </span>
          <span className="text-xs font-black px-2.5 py-0.5 rounded-lg bg-blue-600 text-white shadow-2xs shrink-0">
            {jogoAtivo.categoria}
          </span>
          {jogoAtivo.tipo && (
            <span className="text-xs font-black px-2.5 py-0.5 rounded-lg bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 border border-amber-300/60 shrink-0">
              {jogoAtivo.tipo}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap text-xs sm:text-[13px] font-semibold text-slate-600 dark:text-slate-300">
          <span className="font-mono text-slate-800 dark:text-slate-200">
            📅 {formatarDataExibicao(jogoAtivo.dataJogo)}{jogoAtivo.hora ? ` às ${jogoAtivo.hora}` : ''}
          </span>
          {jogoAtivo.local && (
            <>
              <span className="text-slate-400">·</span>
              <span className="text-slate-600 dark:text-slate-400">
                📍 {jogoAtivo.local}
              </span>
            </>
          )}
        </div>
      </div>

      {/* 2. LINHA DE BOTÕES NO TOPO: [← Voltar] [Salvar Escalação do Jogo] [Estratégia de Jogo] [Súmula] */}
      <div className="flex items-center gap-2 w-full flex-wrap">
        {onVoltarParaAgenda && (
          <button
            type="button"
            onClick={onVoltarParaAgenda}
            className="px-3.5 sm:px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 transition flex items-center gap-1.5 cursor-pointer shrink-0 shadow-2xs active:scale-95"
            title="Voltar para a Agenda de Jogos"
          >
            <ArrowLeft className="w-4 h-4 text-slate-600 dark:text-slate-300" />
            <span>← Voltar</span>
          </button>
        )}

        <button
          type="button"
          onClick={handleSalvarEscalacao}
          style={{ backgroundColor: '#2563eb' }}
          className="flex-1 min-w-[210px] inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs sm:text-sm md:text-base font-black text-white hover:bg-blue-700 active:scale-98 rounded-xl shadow-md transition-all cursor-pointer whitespace-nowrap"
        >
          <Save className="w-4 h-4 text-amber-300 shrink-0" />
          <span>Salvar Escalação do Jogo ({totalConvocados} convocados)</span>
        </button>

        <button
          type="button"
          onClick={() => setModalEstrategiaAberto(true)}
          style={{ backgroundColor: '#059669', color: '#ffffff' }}
          className="px-3.5 sm:px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black text-white hover:opacity-95 active:scale-98 transition flex items-center gap-1.5 cursor-pointer shadow-sm shrink-0"
          title="Visualizar Estratégia de Jogo e Campinho da Comissão Técnica"
        >
          <Shield className="w-4 h-4 text-white shrink-0" />
          <span>Estratégia de Jogo</span>
        </button>

        <button
          type="button"
          onClick={() => setModalSumulaAberto(true)}
          className="px-3.5 sm:px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black text-slate-900 bg-amber-400 hover:bg-amber-300 active:scale-98 transition flex items-center gap-1.5 cursor-pointer shadow-sm shrink-0 border border-amber-300"
          title="Visualizar e Imprimir Súmula Oficial para Arbitragem"
        >
          <FileText className="w-4 h-4 text-slate-950 shrink-0" />
          <span>Súmula</span>
        </button>
      </div>

      {/* Feedback de salvamento */}
      {salvandoFeedback && (
        <div className="p-2.5 text-xs text-emerald-800 dark:text-emerald-200 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 rounded-xl flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-bold">{salvandoFeedback}</span>
        </div>
      )}

      {/* 3. BLOCO: Busca */}
      <div className="relative w-full">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar atleta por nome, apelido ou posição..."
          className="w-full pl-10 pr-9 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-2xs"
        />
        {busca && (
          <button
            type="button"
            onClick={() => setBusca('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* 4. BLOCO: Formação Tática + Contadores + Bloquinho [Lista] [Campinho] */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 bg-white dark:bg-slate-900 p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        {/* Esquerda: FORMAÇÃO TÁTICA + Contadores */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Botão FORMAÇÃO TÁTICA */}
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/80 px-2.5 py-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <span className="text-[11px] font-black uppercase text-slate-600 dark:text-slate-300 whitespace-nowrap">
              FORMAÇÃO TÁTICA:
            </span>
            <div className="relative">
              <select
                value={formacao}
                onChange={(e) => handleTrocarFormacao(e.target.value)}
                className="appearance-none pl-2.5 pr-7 py-1 text-xs sm:text-sm font-black bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-400 border border-blue-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer"
              >
                <option value="4-4-2 Losango">4-4-2 Losango</option>
                <option value="4-2-3-1">4-2-3-1</option>
                <option value="4-3-3">4-3-3</option>
                <option value="4-2-4 linhas baixas">4-2-4 linhas baixas</option>
                <option value="4-1-4-1">4-1-4-1</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-blue-600 pointer-events-none absolute right-2 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          {/* Contadores: X titulares | Y reservas | Total: Z */}
          <div className="flex flex-wrap items-center gap-1.5 text-[14px] font-bold">
            <span className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/50">
              {titularesCount} titulares
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              {reservasCount} reservas
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 font-extrabold">
              Total: {totalConvocados}
            </span>
          </div>
        </div>

        {/* Direita: Bloquinho [Lista] [Campinho] */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setAbaSubEscalacao('lista')}
            style={abaSubEscalacao === 'lista' ? { backgroundColor: '#2563eb', color: '#ffffff' } : {}}
            className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-[14px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs whitespace-nowrap ${
              abaSubEscalacao === 'lista'
                ? 'bg-blue-600 text-white border-2 border-blue-600'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <Users className="w-4 h-4 shrink-0" />
            <span>Lista</span>
          </button>

          <button
            type="button"
            onClick={() => setAbaSubEscalacao('campinho')}
            style={abaSubEscalacao === 'campinho' ? { backgroundColor: '#2563eb', color: '#ffffff' } : {}}
            className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-[14px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs whitespace-nowrap ${
              abaSubEscalacao === 'campinho'
                ? 'bg-blue-600 text-white border-2 border-blue-600'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <svg
              className="w-4 h-4 shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="2" y="3" width="20" height="18" rx="2" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <circle cx="12" cy="12" r="3.5" />
              <circle cx="6" cy="7.5" r="1" fill="currentColor" />
              <circle cx="18" cy="7.5" r="1" fill="currentColor" />
              <circle cx="8" cy="16.5" r="1" fill="currentColor" />
              <circle cx="16" cy="16.5" r="1" fill="currentColor" />
            </svg>
            <span>Campinho</span>
          </button>
        </div>
      </div>

      {/* Conteúdo: Lista Vertical por Posição (1 posição aberta por vez) ou Campinho */}
      {abaSubEscalacao === 'lista' ? (
        <div className="space-y-3">
          <div className="px-1 pt-1 flex items-center justify-between gap-2 flex-wrap">
            <span className="text-[15px] font-black uppercase tracking-wider text-slate-800 dark:text-slate-100">
              ESCOLHA A POSIÇÃO ({formacao}):
            </span>
            <span className="text-[14px] font-bold text-slate-600 dark:text-slate-300">
              {titularesCount}/11 vagas preenchidas
            </span>
          </div>

          {gruposPosicaoVisiveis.length === 0 ? (
            <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-[15px] text-slate-400">
              Nenhum atleta encontrado para os critérios pesquisados.
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {gruposPosicaoVisiveis.map((grupo) => {
                const aberto = posicaoAberta === grupo.key;
                const cores = obterCoresGrupoPosicao(grupo.key);
                const subtitulo = `${grupo.sigla} - ${grupo.titulo}`;

                return (
                  <div
                    key={grupo.key}
                    style={{
                      borderColor: aberto ? cores.openBorder : cores.closedBorder,
                    }}
                    className={`rounded-xl border-2 overflow-hidden transition-all ${
                      aberto ? 'shadow-md bg-white dark:bg-slate-900' : 'shadow-2xs'
                    }`}
                  >
                    {/* Cabeçalho da Posição: padrão único Master Soccer (TODOS em azul marinho e posições em fundo claro + borda azul) */}
                    <button
                      type="button"
                      onClick={() => setPosicaoAberta(aberto ? null : grupo.key)}
                      style={
                        aberto
                          ? {
                              backgroundColor: cores.openBg,
                              color: '#ffffff',
                            }
                          : {
                              backgroundColor: cores.closedBg,
                              color: cores.closedText,
                            }
                      }
                      className="w-full min-h-[50px] px-4 py-3 flex items-center justify-between gap-3 text-left font-black text-[15px] uppercase tracking-wide transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          style={{
                            backgroundColor: aberto ? 'rgba(255, 255, 255, 0.22)' : cores.badgeBg,
                            color: '#ffffff',
                          }}
                          className="px-2.5 py-0.5 rounded-md text-[13px] font-black tracking-wider shrink-0 shadow-2xs"
                        >
                          {grupo.sigla}
                        </span>
                        <span className="truncate">{subtitulo}</span>
                      </div>
                      <ChevronDown
                        style={{ color: aberto ? '#ffffff' : cores.chevronClosed }}
                        className={`w-5 h-5 shrink-0 transition-transform duration-200 ${
                          aberto ? 'rotate-180' : ''
                        }`}
                      />
                    </button>

                    {/* Lista vertical de atletas da posição aberta (um embaixo do outro) */}
                    {aberto && (
                      <div className="p-3 bg-white dark:bg-slate-900 flex flex-col gap-2.5">
                        {grupo.atletas.length === 0 ? (
                          <div className="p-4 text-center text-sm text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                            Nenhum atleta cadastrado nessa posição. Você pode escalar outro jogador nesta vaga pelo Campinho ou em TODOS.
                          </div>
                        ) : (
                          grupo.atletas.map((atleta) => {
                            const escalado = escalacaoMap[atleta.id];
                            const ehTitular = escalado ? escalado.titular : false;
                            const ehReserva = escalado ? !escalado.titular : false;
                            const slotAtual = escalado?.posicaoSlot
                              ? normalizarSlotId(escalado.posicaoSlot)
                              : null;
                            const ehOutraCategoria = atleta.categoria !== categoriaDoJogo;

                            return (
                              <div
                                key={atleta.id}
                                className={`rounded-2xl p-3.5 sm:p-4 transition-all border flex items-center justify-between gap-2.5 ${
                                  ehTitular
                                    ? 'bg-blue-50/70 dark:bg-blue-950/30 border-blue-500 shadow-2xs'
                                    : ehReserva
                                    ? 'bg-amber-50/60 dark:bg-amber-950/30 border-amber-400 shadow-2xs'
                                    : 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800'
                                }`}
                              >
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                  <div
                                    className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl shrink-0 overflow-hidden flex items-center justify-center font-black text-sm sm:text-base border ${
                                      ehTitular
                                        ? 'bg-blue-600 text-white border-blue-700'
                                        : ehReserva
                                        ? 'bg-amber-500 text-white border-amber-600'
                                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                                    }`}
                                  >
                                    {atleta.fotoUrl ? (
                                      <img
                                        src={atleta.fotoUrl}
                                        alt={atleta.nome}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <span>{obterIniciaisApelido(atleta)}</span>
                                    )}
                                  </div>

                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <h4 className="text-base sm:text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight leading-snug truncate">
                                        {atleta.apelido || atleta.nome.split(' ')[0]}
                                      </h4>
                                      {ehOutraCategoria && (
                                        <span className="text-xs font-black px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 border border-amber-300/60 shrink-0">
                                          {atleta.categoria}
                                        </span>
                                      )}
                                      {ehTitular && slotAtual && (
                                        <span className="text-xs font-black px-2 py-0.5 rounded-md bg-blue-600 text-white shadow-2xs shrink-0">
                                          {slotAtual}
                                        </span>
                                      )}
                                      {ehReserva && (
                                        <span className="text-xs font-black px-2 py-0.5 rounded-md bg-amber-500 text-white shadow-2xs shrink-0">
                                          Banco
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-sm sm:text-[15px] text-slate-600 dark:text-slate-300 mt-0.5 leading-snug">
                                      Posição:{' '}
                                      <strong className="text-slate-900 dark:text-slate-100 font-bold">
                                        {atleta.posicao}
                                      </strong>{' '}
                                      · Pé:{' '}
                                      <span className="font-semibold">
                                        {formatarPe(atleta.pernaDominante)}
                                      </span>
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => handleToggleTitular(atleta, grupo)}
                                    className={`px-3 sm:px-4 py-2.5 rounded-xl text-sm sm:text-[15px] font-black transition-all cursor-pointer whitespace-nowrap active:scale-95 flex items-center gap-1 shadow-2xs ${
                                      ehTitular
                                        ? 'bg-blue-600 hover:bg-blue-700 text-white border-2 border-blue-700 shadow-sm'
                                        : 'bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700'
                                    }`}
                                  >
                                    {ehTitular && <Check className="w-4 h-4 text-white stroke-[3]" />}
                                    <span>Titular</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleToggleReserva(atleta)}
                                    className={`px-3 sm:px-4 py-2.5 rounded-xl text-sm sm:text-[15px] font-black transition-all cursor-pointer whitespace-nowrap active:scale-95 flex items-center gap-1 shadow-2xs ${
                                      ehReserva
                                        ? 'bg-amber-500 hover:bg-amber-600 text-white border-2 border-amber-600 shadow-sm'
                                        : 'bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700'
                                    }`}
                                  >
                                    {ehReserva && <Check className="w-4 h-4 text-white stroke-[3]" />}
                                    <span>Reserva</span>
                                  </button>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* ========================================================= */
        /* ABA 2: CAMPINHO TÁTICO VERTICAL COM 11 TITULARES */
        /* ========================================================= */
        <div className="mt-0 pt-3 space-y-4 pb-[180px]" style={{ marginTop: 0 }}>

          {/* O Campo de Futebol Vertical */}
          {(() => {
            const titularesList = atletas.filter((a) => escalacaoMap[a.id]?.titular);
            const reservas = atletas.filter((a) => escalacaoMap[a.id] && !escalacaoMap[a.id].titular);
            const slots = FORMACOES_CAMPINHO[formacao] || FORMACOES_CAMPINHO['4-4-2 Losango'];
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
                      setSlotSelecionado(slot.id);
                      setAtletaParaTroca({ atletaId: '', tipo: 'titular', posicaoSlot: slot.id });
                      setModalTrocaAberto(true);
                    }}
                    className="flex flex-col items-center group cursor-pointer transition-transform hover:scale-105 active:scale-95"
                    title={`Vaga vazia (${slot.label}) - Toque para escolher jogador`}
                  >
                    <div
                      style={{
                        backgroundColor: '#FFFFFF',
                        color: '#000000',
                        borderColor: '#D1D5DB',
                        borderWidth: '2px',
                        borderStyle: 'solid',
                      }}
                      className="w-11 h-11 sm:w-12 sm:h-12 rounded-full flex flex-col items-center justify-center transition-all shadow-md relative"
                    >
                      <span style={{ color: '#000000', fontSize: '20px', fontWeight: 900, lineHeight: 1 }}>
                        +
                      </span>
                      {/* Selo da sigla da posição */}
                      <span className="absolute -top-1.5 -right-1 text-[8.5px] font-black px-1.5 py-0.2 rounded-full shadow bg-blue-600 text-white border border-white leading-tight">
                        {slot.label}
                      </span>
                    </div>
                    <div
                      style={{
                        backgroundColor: '#FFFFFF',
                        color: '#000000',
                        borderColor: '#D1D5DB',
                        borderWidth: '1px',
                        borderStyle: 'solid',
                      }}
                      className="mt-1 px-1.5 py-0.5 rounded text-[10px] font-extrabold shadow-xs leading-tight"
                    >
                      Vazio
                    </div>
                  </button>
                );
              }

              return (
                <button
                  key={slot.id}
                  type="button"
                  onClick={() => {
                    setSlotSelecionado(slot.id);
                    setAtletaParaTroca({ atletaId: atleta.id, tipo: 'titular', posicaoSlot: slot.id });
                    setModalTrocaAberto(true);
                  }}
                  className="flex flex-col items-center group cursor-pointer transition-transform hover:scale-110 active:scale-95 relative"
                  title={`${atleta.apelido || atleta.nome} (${slot.label}) - Toque para trocar`}
                >
                  {/* Bolinha preenchida verde #16A34A com borda #14532D */}
                  <div
                    style={{
                      backgroundColor: '#16A34A',
                      color: '#FFFFFF',
                      borderColor: '#14532D',
                      borderWidth: '2px',
                      borderStyle: 'solid',
                    }}
                    className="w-11 h-11 sm:w-12 sm:h-12 rounded-full shadow-xl relative flex items-center justify-center p-0.5 overflow-visible"
                  >
                    {atleta.fotoUrl ? (
                      <img
                        src={atleta.fotoUrl}
                        alt={atleta.nome}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <div
                        style={{ color: '#FFFFFF' }}
                        className="w-full h-full rounded-full flex items-center justify-center font-black text-xs sm:text-sm tracking-tight"
                      >
                        {atleta.numeroCamisa ? `#${atleta.numeroCamisa}` : obterIniciaisApelido(atleta)}
                      </div>
                    )}

                    {/* Selo com a sigla da posição (GOL, LE, ZAG, LD, VOL, MEI, ATA) */}
                    <span className="absolute -top-1.5 -right-1 text-[8.5px] sm:text-[9px] font-black px-1.5 py-0.2 rounded-full shadow bg-blue-600 text-white border border-white leading-tight pointer-events-none">
                      {slot.label}
                    </span>
                  </div>

                  {/* Nome do jogador legível embaixo em verde #16A34A */}
                  <div
                    style={{
                      backgroundColor: '#16A34A',
                      color: '#FFFFFF',
                      borderColor: '#14532D',
                      borderWidth: '1px',
                      borderStyle: 'solid',
                    }}
                    className="mt-1 px-1.5 py-0.5 rounded-md text-[10px] sm:text-[11px] font-black shadow-md max-w-[85px] sm:max-w-[100px] truncate text-center leading-tight"
                  >
                    {atleta.apelido || atleta.nome.split(' ')[0]}
                  </div>
                </button>
              );
            };

            return (
              <div className="space-y-6">
                <div className="relative w-full max-w-2xl sm:max-w-3xl mx-auto rounded-3xl overflow-hidden shadow-2xl border-4 border-emerald-950 bg-emerald-800 text-white select-none h-[720px] sm:h-[800px] md:h-[880px]">
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
                                if (slotSelecionado) {
                                  handleColocarJogadorNoSlot(r.id, slotSelecionado);
                                } else if (atletaParaTroca.atletaId) {
                                  handleTrocarTitularReserva(atletaParaTroca.atletaId, r.id);
                                } else if (atletaParaTroca.posicaoSlot) {
                                  handleColocarJogadorNoSlot(r.id, atletaParaTroca.posicaoSlot);
                                } else {
                                  handlePromoverParaTitular(r.id);
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
                                    {obterIniciaisApelido(r)}
                                  </div>
                                )}
                                <div>
                                  <div className="text-xs font-extrabold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                                    {r.apelido || r.nome}
                                  </div>
                                  <div className="text-[10px] text-slate-500">
                                    {escalacaoMap[r.id]?.posicaoJogo || r.posicao} · {r.categoria}
                                  </div>
                                </div>
                              </div>
                              <span className="px-2.5 py-1 text-xs font-bold text-blue-600 bg-blue-100 dark:bg-blue-900/60 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-all">
                                {slotSelecionado ? 'Colocar nesta vaga' : 'Colocar no lugar'}
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
                      {atletasElegiveisParaModal
                        .filter((a) => !escalacaoMap[a.id])
                        .slice(0, 15)
                        .map((outro) => (
                          <button
                            key={outro.id}
                            type="button"
                            onClick={() => {
                              if (slotSelecionado) {
                                handleColocarJogadorNoSlot(outro.id, slotSelecionado);
                              } else if (atletaParaTroca.atletaId) {
                                handleTrocarTitularReserva(atletaParaTroca.atletaId, outro.id);
                              } else if (atletaParaTroca.posicaoSlot) {
                                handleColocarJogadorNoSlot(outro.id, atletaParaTroca.posicaoSlot);
                              } else {
                                handlePromoverParaTitular(outro.id);
                              }
                            }}
                            className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-blue-50 dark:hover:bg-blue-950/40 border border-slate-200 dark:border-slate-700/60 text-left transition-all group"
                          >
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate group-hover:text-blue-600">
                              {outro.apelido ? `${outro.apelido} (${outro.nome})` : outro.nome} - {outro.posicao}
                            </span>
                            <span className="text-[11px] font-bold text-blue-600 group-hover:underline">
                              {slotSelecionado ? 'Escalar nesta vaga' : 'Convocar e Escalar'}
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

      {/* ========================================================= */}
      {/* MODAL DE SÚMULA OFICIAL DO JOGO (COM COMPARTILHAR E IMPRIMIR) */}
      {/* DOCUMENTO 1 - SÚMULA OFICIAL PARA ARBITRAGEM (SOMENTE LEITURA) */}
      <ModalSumulaArbitragem
        isOpen={modalSumulaAberto}
        onClose={() => setModalSumulaAberto(false)}
        jogo={jogoAtivo}
        atletas={atletas}
        escalacaoMap={escalacaoMap}
      />

      {/* DOCUMENTO 2 - ESTRATÉGIA DE JOGO (SOMENTE LEITURA) */}
      <ModalEstrategiaJogo
        isOpen={modalEstrategiaAberto}
        onClose={() => setModalEstrategiaAberto(false)}
        jogo={jogoAtivo}
        atletas={atletas}
        escalacaoMap={escalacaoMap}
        formacao={formacao}
      />
    </div>
  );
};
