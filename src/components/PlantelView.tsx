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
  CheckSquare,
  Square,
  AlertCircle,
  Trophy,
  ArrowLeftRight,
  X,
  ChevronDown,
  ArrowLeft,
} from 'lucide-react';
import { Atleta, AvaliacaoJogo, JogoAgenda, POSICOES_JOGO, AtletaEscalado } from '../types';
import { storageService } from '../services/storage';
import { formatarDataExibicao } from '../utils/dateUtils';
import { obterIniciaisApelido } from '../utils/apelidoUtils';

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

export interface SlotPosicaoCampinho {
  id: string;
  label: 'GOL' | 'LE' | 'ZAG' | 'LD' | 'VOL' | 'MEI' | 'ATA' | 'PE' | 'PD' | string;
  nomeCompleto: string;
  linha: 'ata' | 'mei' | 'def' | 'gol';
  left: number; // % (0 a 100)
  top: number;  // % (0 a 100)
}

export const FORMACOES_CAMPINHO: Record<string, SlotPosicaoCampinho[]> = {
  // FORMAÇÃO 4-4-2 LOSANGO
  '4-4-2 Losango': [
    { id: 'GOL', label: 'GOL', nomeCompleto: 'Goleiro', linha: 'gol', left: 50, top: 92 },
    { id: 'LE', label: 'LE', nomeCompleto: 'Lateral Esquerdo', linha: 'def', left: 15, top: 72 },
    { id: 'ZAG1', label: 'ZAG-E', nomeCompleto: 'Zagueiro Esquerdo', linha: 'def', left: 38, top: 76 },
    { id: 'ZAG2', label: 'ZAG-D', nomeCompleto: 'Zagueiro Direito', linha: 'def', left: 62, top: 76 },
    { id: 'LD', label: 'LD', nomeCompleto: 'Lateral Direito', linha: 'def', left: 85, top: 72 },
    { id: 'VOL', label: 'VOL', nomeCompleto: 'Volante', linha: 'mei', left: 50, top: 58 },
    { id: 'MEI_E', label: 'MEI-E', nomeCompleto: 'Meio-Campo Esquerdo', linha: 'mei', left: 22, top: 42 },
    { id: 'MEI_C', label: 'MEI-C / 10', nomeCompleto: 'Meio-Campo Central (10)', linha: 'mei', left: 50, top: 32 },
    { id: 'MEI_D', label: 'MEI-D', nomeCompleto: 'Meio-Campo Direito', linha: 'mei', left: 78, top: 42 },
    { id: 'ATA_E', label: 'ATA-E', nomeCompleto: 'Atacante Esquerdo', linha: 'ata', left: 35, top: 14 },
    { id: 'ATA_D', label: 'ATA-D', nomeCompleto: 'Atacante Direito', linha: 'ata', left: 65, top: 14 },
  ],

  // FORMAÇÃO 4-2-3-1
  '4-2-3-1': [
    { id: 'GOL', label: 'GOL', nomeCompleto: 'Goleiro', linha: 'gol', left: 50, top: 92 },
    { id: 'LE', label: 'LE', nomeCompleto: 'Lateral Esquerdo', linha: 'def', left: 15, top: 72 },
    { id: 'ZAG1', label: 'ZAG-E', nomeCompleto: 'Zagueiro Esquerdo', linha: 'def', left: 38, top: 76 },
    { id: 'ZAG2', label: 'ZAG-D', nomeCompleto: 'Zagueiro Direito', linha: 'def', left: 62, top: 76 },
    { id: 'LD', label: 'LD', nomeCompleto: 'Lateral Direito', linha: 'def', left: 85, top: 72 },
    { id: 'VOL1', label: 'VOL-E', nomeCompleto: 'Volante Esquerdo', linha: 'mei', left: 38, top: 58 },
    { id: 'VOL2', label: 'VOL-D', nomeCompleto: 'Volante Direito', linha: 'mei', left: 62, top: 58 },
    { id: 'MEI_E', label: 'MEI-E', nomeCompleto: 'Meio-Campo Esquerdo', linha: 'mei', left: 20, top: 38 },
    { id: 'MEI_C', label: 'MEI-C / 10', nomeCompleto: 'Meio-Campo Central (10)', linha: 'mei', left: 50, top: 34 },
    { id: 'MEI_D', label: 'MEI-D', nomeCompleto: 'Meio-Campo Direito', linha: 'mei', left: 80, top: 38 },
    { id: 'ATA', label: 'ATA', nomeCompleto: 'Centroavante', linha: 'ata', left: 50, top: 12 },
  ],

  // FORMAÇÃO 4-3-3
  '4-3-3': [
    { id: 'GOL', label: 'GOL', nomeCompleto: 'Goleiro', linha: 'gol', left: 50, top: 92 },
    { id: 'LE', label: 'LE', nomeCompleto: 'Lateral Esquerdo', linha: 'def', left: 15, top: 72 },
    { id: 'ZAG1', label: 'ZAG-E', nomeCompleto: 'Zagueiro Esquerdo', linha: 'def', left: 38, top: 76 },
    { id: 'ZAG2', label: 'ZAG-D', nomeCompleto: 'Zagueiro Direito', linha: 'def', left: 62, top: 76 },
    { id: 'LD', label: 'LD', nomeCompleto: 'Lateral Direito', linha: 'def', left: 85, top: 72 },
    { id: 'VOL', label: 'VOL', nomeCompleto: 'Volante', linha: 'mei', left: 50, top: 58 },
    { id: 'MEI_E', label: 'MEI-E', nomeCompleto: 'Meio-Campo Esquerdo', linha: 'mei', left: 30, top: 42 },
    { id: 'MEI_D', label: 'MEI-D', nomeCompleto: 'Meio-Campo Direito', linha: 'mei', left: 70, top: 42 },
    { id: 'ATA_E', label: 'ATA-E', nomeCompleto: 'Ponta Esquerda', linha: 'ata', left: 20, top: 16 },
    { id: 'ATA_C', label: 'ATA-C', nomeCompleto: 'Centroavante', linha: 'ata', left: 50, top: 12 },
    { id: 'ATA_D', label: 'ATA-D', nomeCompleto: 'Ponta Direita', linha: 'ata', left: 80, top: 16 },
  ],

  // FORMAÇÃO 4-2-4 LINHAS BAIXAS
  '4-2-4 linhas baixas': [
    { id: 'GOL', label: 'GOL', nomeCompleto: 'Goleiro', linha: 'gol', left: 50, top: 92 },
    { id: 'LE', label: 'LE', nomeCompleto: 'Lateral Esquerdo', linha: 'def', left: 15, top: 72 },
    { id: 'ZAG1', label: 'ZAG-E', nomeCompleto: 'Zagueiro Esquerdo', linha: 'def', left: 38, top: 76 },
    { id: 'ZAG2', label: 'ZAG-D', nomeCompleto: 'Zagueiro Direito', linha: 'def', left: 62, top: 76 },
    { id: 'LD', label: 'LD', nomeCompleto: 'Lateral Direito', linha: 'def', left: 85, top: 72 },
    { id: 'VOL1', label: 'VOL-E', nomeCompleto: 'Volante Esquerdo', linha: 'mei', left: 35, top: 56 },
    { id: 'VOL2', label: 'VOL-D', nomeCompleto: 'Volante Direito', linha: 'mei', left: 65, top: 56 },
    { id: 'MEI_E', label: 'MEI-E', nomeCompleto: 'Meia Esquerdo', linha: 'mei', left: 16, top: 36 },
    { id: 'MEI_D', label: 'MEI-D', nomeCompleto: 'Meia Direito', linha: 'mei', left: 84, top: 36 },
    { id: 'ATA_E', label: 'ATA-E', nomeCompleto: 'Atacante Esquerdo', linha: 'ata', left: 38, top: 30 },
    { id: 'ATA_D', label: 'ATA-D', nomeCompleto: 'Atacante Direito', linha: 'ata', left: 62, top: 30 },
  ],

  // FORMAÇÃO 4-1-4-1
  '4-1-4-1': [
    { id: 'GOL', label: 'GOL', nomeCompleto: 'Goleiro', linha: 'gol', left: 50, top: 92 },
    { id: 'LE', label: 'LE', nomeCompleto: 'Lateral Esquerdo', linha: 'def', left: 15, top: 72 },
    { id: 'ZAG1', label: 'ZAG-E', nomeCompleto: 'Zagueiro Esquerdo', linha: 'def', left: 38, top: 76 },
    { id: 'ZAG2', label: 'ZAG-D', nomeCompleto: 'Zagueiro Direito', linha: 'def', left: 62, top: 76 },
    { id: 'LD', label: 'LD', nomeCompleto: 'Lateral Direito', linha: 'def', left: 85, top: 72 },
    { id: 'VOL', label: 'VOL', nomeCompleto: 'Volante', linha: 'mei', left: 50, top: 60 },
    { id: 'MEI_E', label: 'MEI-E', nomeCompleto: 'Meio-Campista Esquerdo', linha: 'mei', left: 16, top: 40 },
    { id: 'MEI_CE', label: 'MEI-CE', nomeCompleto: 'Meio-Campista Central Esquerdo', linha: 'mei', left: 38, top: 42 },
    { id: 'MEI_CD', label: 'MEI-CD', nomeCompleto: 'Meio-Campista Central Direito', linha: 'mei', left: 62, top: 42 },
    { id: 'MEI_D', label: 'MEI-D', nomeCompleto: 'Meio-Campista Direito', linha: 'mei', left: 84, top: 40 },
    { id: 'ATA', label: 'ATA', nomeCompleto: 'Centroavante', linha: 'ata', left: 50, top: 14 },
  ],
};

// Aliases para compatibilidade
FORMACOES_CAMPINHO['4-4-2'] = FORMACOES_CAMPINHO['4-4-2 Losango'];
FORMACOES_CAMPINHO['4-2-4'] = FORMACOES_CAMPINHO['4-2-4 linhas baixas'];

/**
 * Bloquinhos de vagas gerados conforme a formação tática
 */
export const BLOQUINHOS_FORMACAO: Record<string, Array<{ id: string; label: string }>> = {
  '4-4-2 Losango': [
    { id: 'TODOS', label: 'TODOS' },
    { id: 'GOL', label: 'GOL' },
    { id: 'LE', label: 'LE' },
    { id: 'ZAG-E', label: 'ZAG-E' },
    { id: 'ZAG-D', label: 'ZAG-D' },
    { id: 'LD', label: 'LD' },
    { id: 'VOL', label: 'VOL' },
    { id: 'MEI-E', label: 'MEI-E' },
    { id: 'MEI-C / 10', label: 'MEI-C / 10' },
    { id: 'MEI-D', label: 'MEI-D' },
    { id: 'ATA-E', label: 'ATA-E' },
    { id: 'ATA-D', label: 'ATA-D' },
  ],
  '4-2-3-1': [
    { id: 'TODOS', label: 'TODOS' },
    { id: 'GOL', label: 'GOL' },
    { id: 'LE', label: 'LE' },
    { id: 'ZAG-E', label: 'ZAG-E' },
    { id: 'ZAG-D', label: 'ZAG-D' },
    { id: 'LD', label: 'LD' },
    { id: 'VOL-E', label: 'VOL-E' },
    { id: 'VOL-D', label: 'VOL-D' },
    { id: 'MEI-E', label: 'MEI-E' },
    { id: 'MEI-C / 10', label: 'MEI-C / 10' },
    { id: 'MEI-D', label: 'MEI-D' },
    { id: 'ATA', label: 'ATA' },
  ],
  '4-3-3': [
    { id: 'TODOS', label: 'TODOS' },
    { id: 'GOL', label: 'GOL' },
    { id: 'LE', label: 'LE' },
    { id: 'ZAG-E', label: 'ZAG-E' },
    { id: 'ZAG-D', label: 'ZAG-D' },
    { id: 'LD', label: 'LD' },
    { id: 'VOL', label: 'VOL' },
    { id: 'MEI-E', label: 'MEI-E' },
    { id: 'MEI-D', label: 'MEI-D' },
    { id: 'ATA-E', label: 'ATA-E' },
    { id: 'ATA-C', label: 'ATA-C' },
    { id: 'ATA-D', label: 'ATA-D' },
  ],
  '4-2-4 linhas baixas': [
    { id: 'TODOS', label: 'TODOS' },
    { id: 'GOL', label: 'GOL' },
    { id: 'LE', label: 'LE' },
    { id: 'ZAG-E', label: 'ZAG-E' },
    { id: 'ZAG-D', label: 'ZAG-D' },
    { id: 'LD', label: 'LD' },
    { id: 'VOL-E', label: 'VOL-E' },
    { id: 'VOL-D', label: 'VOL-D' },
    { id: 'MEI-E', label: 'MEI-E' },
    { id: 'MEI-D', label: 'MEI-D' },
    { id: 'ATA-E', label: 'ATA-E' },
    { id: 'ATA-D', label: 'ATA-D' },
  ],
  '4-1-4-1': [
    { id: 'TODOS', label: 'TODOS' },
    { id: 'GOL', label: 'GOL' },
    { id: 'LE', label: 'LE' },
    { id: 'ZAG-E', label: 'ZAG-E' },
    { id: 'ZAG-D', label: 'ZAG-D' },
    { id: 'LD', label: 'LD' },
    { id: 'VOL', label: 'VOL' },
    { id: 'MEI-E', label: 'MEI-E' },
    { id: 'MEI-CE', label: 'MEI-CE' },
    { id: 'MEI-CD', label: 'MEI-CD' },
    { id: 'ATA', label: 'ATA' },
  ],
};
BLOQUINHOS_FORMACAO['4-4-2'] = BLOQUINHOS_FORMACAO['4-4-2 Losango'];
BLOQUINHOS_FORMACAO['4-2-4'] = BLOQUINHOS_FORMACAO['4-2-4 linhas baixas'];

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
  const [filtroCategoriaLista, setFiltroCategoriaLista] = useState<string>('TODAS');
  const [abaSubEscalacao, setAbaSubEscalacao] = useState<'lista' | 'campinho'>('lista');
  const [formacao, setFormacao] = useState<string>('4-4-2 Losango');
  const [vagaSelecionada, setVagaSelecionada] = useState<string>('TODOS');
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

  // Sincroniza quando jogos ou jogoSelecionadoId mudarem
  useEffect(() => {
    setJogoAtivoId(jogoSelecionadoId || '');
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

  // Atribuição dos titulares aos slots da formação tática, respeitando slotId gravado
  const atribuirTitularesAosSlots = (
    titularesList: Atleta[],
    slots: SlotPosicaoCampinho[]
  ): Array<{ slot: SlotPosicaoCampinho; atleta: Atleta | null }> => {
    const resultado: Array<{ slot: SlotPosicaoCampinho; atleta: Atleta | null }> = [];
    const usados = new Set<string>();

    // 1ª Passagem: Atletas com slotId exato travado
    const slotsMap: Record<string, Atleta | null> = {};
    for (const slot of slots) {
      const matchExato = titularesList.find(
        (a) => !usados.has(a.id) && escalacaoMap[a.id]?.posicaoSlot === slot.id
      );
      if (matchExato) {
        usados.add(matchExato.id);
        slotsMap[slot.id] = matchExato;
      } else {
        slotsMap[slot.id] = null;
      }
    }

    // 2ª Passagem: Titulares restantes sem slotId vinculados por posição tática
    const titularesLivres = titularesList.filter((a) => !usados.has(a.id));
    for (const slot of slots) {
      if (slotsMap[slot.id]) continue;
      const match = titularesLivres.find((a) => {
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
        slotsMap[slot.id] = match;
      }
    }

    // 3ª Passagem: Preenche vagas ainda vazias com os titulares que sobraram
    const restantesFinais = titularesList.filter((a) => !usados.has(a.id));
    for (const slot of slots) {
      if (!slotsMap[slot.id] && restantesFinais.length > 0) {
        const proximo = restantesFinais.shift()!;
        slotsMap[slot.id] = proximo;
        usados.add(proximo.id);
      }
    }

    for (const slot of slots) {
      resultado.push({ slot, atleta: slotsMap[slot.id] || null });
    }

    return resultado;
  };

  // Colocar jogador exatamente no slot selecionado do campinho
  const handleColocarJogadorNoSlot = (atletaId: string, slotId: string) => {
    const slots = FORMACOES_CAMPINHO[formacao] || FORMACOES_CAMPINHO['4-4-2 Losango'];
    const slotObj = slots.find((s) => s.id === slotId);
    const nomePosicao = slotObj?.nomeCompleto || slotObj?.label || 'Titular';

    setEscalacaoMap((prev) => {
      const copy = { ...prev };

      // Se outro jogador já estava nesse slotId, remove ele desse slot e coloca no banco
      for (const id in copy) {
        if (copy[id].posicaoSlot === slotId && id !== atletaId) {
          copy[id] = {
            ...copy[id],
            titular: false,
            posicaoSlot: undefined,
          };
        }
      }

      // Coloca o atleta selecionado exatamente nesse slotId
      copy[atletaId] = {
        atletaId,
        titular: true,
        posicaoJogo: nomePosicao,
        posicaoSlot: slotId,
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

  const categoriaDoJogo = jogoAtivo?.categoria || 'SUB-15';

  const bloquinhosAtuais = useMemo(() => {
    return BLOQUINHOS_FORMACAO[formacao] || BLOQUINHOS_FORMACAO['4-4-2 Losango'];
  }, [formacao]);

  // Se a formação mudar e a vaga selecionada não existir mais na formação, reseta para TODOS
  useEffect(() => {
    if (vagaSelecionada !== 'TODOS') {
      const existe = bloquinhosAtuais.some((b) => b.id === vagaSelecionada);
      if (!existe) {
        setVagaSelecionada('TODOS');
      }
    }
  }, [bloquinhosAtuais, vagaSelecionada]);

  const catJogoNum = extrairNumeroCategoria(categoriaDoJogo);

  // Atletas elegíveis para convocação e substituição no modal: apenas mesma categoria ou inferior
  const atletasElegiveisParaModal = useMemo(() => {
    return atletas.filter((a) => extrairNumeroCategoria(a.categoria) <= catJogoNum);
  }, [atletas, catJogoNum]);

  // Separação em: Atletas da Categoria do Jogo e Outras Categorias (apenas inferiores)
  // ESTRITAMENTE PROIBIDO: mostrar categorias superiores à categoria do jogo!
  const { atletasDaCategoria, atletasOutrasCategorias } = useMemo(() => {
    // 1. Filtro de busca de texto
    let base = atletas;
    if (busca.trim()) {
      const b = busca.toLowerCase();
      base = base.filter(
        (a) =>
          a.nome.toLowerCase().includes(b) ||
          (a.apelido && a.apelido.toLowerCase().includes(b)) ||
          a.posicao.toLowerCase().includes(b)
      );
    }

    // 2. Filtro estrito: apenas mesma categoria ou inferior (catNum <= catJogoNum)
    const elegiveis = base.filter((a) => {
      const catNum = extrairNumeroCategoria(a.categoria);
      return catNum <= catJogoNum;
    });

    const principal: Atleta[] = [];
    const inferiores: Atleta[] = [];

    for (const atleta of elegiveis) {
      if (atleta.categoria === categoriaDoJogo) {
        principal.push(atleta);
      } else {
        inferiores.push(atleta);
      }
    }

    // 3. Ordena categoria principal por vaga/pé/posição e desempate por nome
    principal.sort((a, b) => {
      const scoreA = calcularScoreAtleta(a, vagaSelecionada, categoriaDoJogo);
      const scoreB = calcularScoreAtleta(b, vagaSelecionada, categoriaDoJogo);
      if (scoreA !== scoreB) {
        return scoreA - scoreB;
      }
      const nomeA = a.apelido || a.nome;
      const nomeB = b.apelido || b.nome;
      return nomeA.localeCompare(nomeB, 'pt-BR');
    });

    // 4. Ordena categorias inferiores: categoria decrescente (ex: SUB-16 depois SUB-15) e por vaga/pé
    inferiores.sort((a, b) => {
      const numA = extrairNumeroCategoria(a.categoria);
      const numB = extrairNumeroCategoria(b.categoria);
      if (numA !== numB) {
        return numB - numA;
      }
      const scoreA = calcularScoreAtleta(a, vagaSelecionada, a.categoria);
      const scoreB = calcularScoreAtleta(b, vagaSelecionada, b.categoria);
      if (scoreA !== scoreB) {
        return scoreA - scoreB;
      }
      const nomeA = a.apelido || a.nome;
      const nomeB = b.apelido || b.nome;
      return nomeA.localeCompare(nomeB, 'pt-BR');
    });

    return {
      atletasDaCategoria: principal,
      atletasOutrasCategorias: inferiores,
    };
  }, [atletas, busca, vagaSelecionada, categoriaDoJogo, catJogoNum]);

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
    <div className="space-y-4 pb-[170px] w-full max-w-full box-border">
      {/* ========================================================= */}
      {/* CABEÇALHO FIXO NO TOPO - NADA SOME AO ROLAR, SEM CORTE */}
      {/* ========================================================= */}
      <div className="sticky top-[72px] z-30 bg-white dark:bg-slate-900 -mx-3 sm:-mx-6 px-3 sm:px-6 py-3 border-b-2 border-slate-200 dark:border-slate-800 shadow-md flex flex-col gap-3">
        {/* BLOCO 1: PAINEL DO JOGO MAIOR (~92px) - TÍTULO EM DESTAQUE (20px), DATA/HORA/LOCAL (15px), BADGE E BOTÃO VOLTAR */}
        <div className="min-h-[88px] sm:min-h-[92px] p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="space-y-1.5 flex-1 min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-[20px] sm:text-[22px] font-black text-slate-900 dark:text-white leading-tight">
                {jogoAtivo.adversario.startsWith('vs') ? jogoAtivo.adversario : `vs ${jogoAtivo.adversario}`}
              </span>
              <span className="text-[13px] font-extrabold px-3 py-1 rounded-lg bg-blue-600 text-white shadow-xs shrink-0">
                {jogoAtivo.categoria}
              </span>
              {jogoAtivo.tipo && (
                <span className="text-[13px] font-extrabold px-3 py-1 rounded-lg bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 border border-amber-300/60 shrink-0">
                  {jogoAtivo.tipo}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 flex-wrap text-[14px] sm:text-[15px] font-semibold text-slate-600 dark:text-slate-300">
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

          {onVoltarParaAgenda && (
            <button
              type="button"
              onClick={onVoltarParaAgenda}
              className="self-start sm:self-center px-4 py-2.5 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 border border-slate-300 dark:border-slate-600 transition flex items-center gap-2 cursor-pointer shrink-0 shadow-xs active:scale-95"
              title="Voltar para a Agenda de Jogos"
            >
              <ArrowLeft className="w-4 h-4 text-slate-600 dark:text-slate-300" />
              <span>← Voltar</span>
            </button>
          )}
        </div>

        {/* BLOCO 2: Busca com altura confortável */}
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar atleta por nome, apelido ou posição..."
            className="w-full pl-10 pr-9 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-2xs"
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

        {/* BLOCO 3: Formação Tática + Contadores + Bloquinho [Lista] [Campinho] */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Esquerda: FORMAÇÃO TÁTICA + Contadores */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Botão FORMAÇÃO TÁTICA */}
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="text-xs font-black uppercase text-slate-600 dark:text-slate-300 whitespace-nowrap">
                FORMAÇÃO TÁTICA:
              </span>
              <div className="relative">
                <select
                  value={formacao}
                  onChange={(e) => setFormacao(e.target.value)}
                  className="appearance-none pl-3 pr-8 py-1.5 text-xs sm:text-sm font-black bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-400 border border-blue-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer"
                >
                  <option value="4-4-2 Losango">4-4-2 Losango</option>
                  <option value="4-2-3-1">4-2-3-1</option>
                  <option value="4-3-3">4-3-3</option>
                  <option value="4-2-4 linhas baixas">4-2-4 linhas baixas</option>
                  <option value="4-1-4-1">4-1-4-1</option>
                </select>
                <ChevronDown className="w-4 h-4 text-blue-600 pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {/* Contadores: X titulares | Y reservas | Total: Z */}
            <div className="flex items-center gap-1.5 text-xs font-bold">
              <span className="px-2.5 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/50">
                {titularesCount} titulares
              </span>
              <span className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                {reservasCount} reservas
              </span>
              <span className="px-2.5 py-1.5 rounded-lg bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 font-extrabold">
                Total: {totalConvocados}
              </span>
            </div>
          </div>

          {/* Direita: Bloquinho [Lista] [Campinho] */}
          <div className="flex items-center gap-2">
            {/* Botão [Lista] */}
            <button
              type="button"
              onClick={() => setAbaSubEscalacao('lista')}
              style={abaSubEscalacao === 'lista' ? { backgroundColor: '#2563eb', color: '#ffffff' } : {}}
              className={`h-12 px-5 rounded-xl text-[17px] font-bold flex items-center justify-center gap-2.5 transition-all cursor-pointer shadow-xs whitespace-nowrap ${
                abaSubEscalacao === 'lista'
                  ? 'bg-blue-600 text-white border-2 border-blue-600'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <Users className="w-5 h-5 shrink-0" />
              <span>Lista</span>
            </button>

            {/* Botão [Campinho] */}
            <button
              type="button"
              onClick={() => setAbaSubEscalacao('campinho')}
              style={abaSubEscalacao === 'campinho' ? { backgroundColor: '#2563eb', color: '#ffffff' } : {}}
              className={`h-12 px-5 rounded-xl text-[17px] font-bold flex items-center justify-center gap-2.5 transition-all cursor-pointer shadow-xs whitespace-nowrap ${
                abaSubEscalacao === 'campinho'
                  ? 'bg-blue-600 text-white border-2 border-blue-600'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <svg
                className="w-5 h-5 shrink-0"
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

        {/* BLOCO 4: Barra Grudada ESCOLHA A VAGA com Bloquinhos da Formação - APENAS NA ABA LISTA */}
        {abaSubEscalacao === 'lista' && (
          <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 overflow-x-auto pb-1 no-scrollbar animate-in fade-in">
            <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 shrink-0">
              ESCOLHA A VAGA:
            </span>
            <div className="flex items-center gap-1.5 shrink-0">
              {bloquinhosAtuais.map((b) => {
                const ativo = vagaSelecionada === b.id;
                return (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setVagaSelecionada(b.id)}
                    style={ativo ? { backgroundColor: '#2563eb', color: '#ffffff' } : {}}
                    className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap ${
                      ativo
                        ? 'shadow-xs border border-blue-600'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200/60 dark:border-slate-700'
                    }`}
                  >
                    {b.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Feedback de salvamento */}
        {salvandoFeedback && (
          <div className="p-2.5 text-xs text-emerald-800 dark:text-emerald-200 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 rounded-xl flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-bold">{salvandoFeedback}</span>
          </div>
        )}
      </div>

      {/* Conteúdo: Lista única de atletas ou Campinho */}
      {abaSubEscalacao === 'lista' ? (
        <div className="space-y-6 pt-2">
          {(() => {
            const renderCardAtleta = (atleta: Atleta) => {
              const escalado = escalacaoMap[atleta.id];
              const estaConvocado = Boolean(escalado);
              const titular = escalado ? escalado.titular : false;
              const ehOutraCategoria = atleta.categoria !== categoriaDoJogo;

              return (
                <div
                  key={atleta.id}
                  className={`rounded-2xl p-4 transition-all border min-h-[72px] flex flex-col justify-center ${
                    estaConvocado
                      ? 'bg-blue-50/40 dark:bg-blue-950/20 border-blue-500 shadow-xs'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    {/* Checkbox de Convocação (26px) + Avatar com sigla do APELIDO + Dados do Atleta */}
                    <div className="flex items-center gap-3.5 min-w-0 flex-1">
                      <button
                        type="button"
                        onClick={() => handleToggleConvocacao(atleta)}
                        className="cursor-pointer p-0.5 text-blue-600 focus:outline-none shrink-0"
                        title={estaConvocado ? 'Desmarcar da partida' : 'Convocar para partida'}
                      >
                        {estaConvocado ? (
                          <CheckSquare className="w-[26px] h-[26px] text-blue-600 fill-blue-100 dark:fill-blue-950" />
                        ) : (
                          <Square className="w-[26px] h-[26px] text-slate-400 hover:text-slate-600" />
                        )}
                      </button>

                      {/* Foto / Iniciais do APELIDO */}
                      <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0 overflow-hidden flex items-center justify-center font-black text-sm text-slate-700 dark:text-slate-300">
                        {atleta.fotoUrl ? (
                          <img src={atleta.fotoUrl} alt={atleta.nome} className="w-full h-full object-cover" />
                        ) : (
                          <span>{obterIniciaisApelido(atleta)}</span>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-[17px] font-bold text-slate-900 dark:text-white uppercase tracking-tight leading-snug truncate">
                            {atleta.apelido || atleta.nome.split(' ')[0]}
                          </h4>
                          {ehOutraCategoria && (
                            <span className="text-[11px] font-black px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 border border-amber-300/60 shrink-0">
                              {atleta.categoria}
                            </span>
                          )}
                        </div>
                        <p className="text-[14px] text-slate-600 dark:text-slate-300 mt-0.5 leading-snug">
                          Posição: <strong className="text-slate-900 dark:text-slate-100 font-bold">{atleta.posicao}</strong> · Pé: <span className="font-semibold">{formatarPe(atleta.pernaDominante)}</span>
                        </p>
                      </div>
                    </div>

                    {/* Botão Ficha maior e clicável */}
                    <button
                      type="button"
                      onClick={() => onSelecionarAtleta(atleta)}
                      className="px-4 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-95 rounded-xl transition shrink-0 cursor-pointer shadow-xs min-w-[72px] text-center"
                    >
                      Ficha
                    </button>
                  </div>

                  {/* Configurações de Convocação: APENAS Status: [ Titular ] [ Reserva ], sem selo de Titular */}
                  {estaConvocado && (
                    <div className="mt-3 pt-3 border-t border-blue-200/50 dark:border-blue-900/50 flex items-center gap-2 text-xs sm:text-sm animate-in fade-in">
                      <span className="font-bold text-slate-700 dark:text-slate-300 mr-1 text-sm">
                        Status:
                      </span>
                      <button
                        type="button"
                        onClick={() => handleSetTitular(atleta.id, true)}
                        className={`px-3.5 py-1.5 rounded-lg font-black transition-all cursor-pointer text-xs sm:text-sm ${
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
                        className={`px-3.5 py-1.5 rounded-lg font-black transition-all cursor-pointer text-xs sm:text-sm ${
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
            };

            if (atletasDaCategoria.length === 0 && atletasOutrasCategorias.length === 0) {
              return (
                <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-sm text-slate-400">
                  Nenhum atleta encontrado para os critérios pesquisados.
                </div>
              );
            }

            return (
              <>
                {/* 1. Atletas da Categoria Principal do Jogo */}
                {atletasDaCategoria.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {atletasDaCategoria.map(renderCardAtleta)}
                  </div>
                ) : (
                  <div className="p-4 text-center bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-xs text-slate-400">
                    Nenhum atleta da categoria {categoriaDoJogo} encontrado com o filtro atual.
                  </div>
                )}

                {/* 2. Seção OUTRAS CATEGORIAS - PODE CONVOCAR (Apenas categorias inferiores!) */}
                {atletasOutrasCategorias.length > 0 && (
                  <div className="pt-4 border-t-2 border-dashed border-slate-200 dark:border-slate-800 space-y-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-black uppercase tracking-wider text-amber-900 dark:text-amber-200 bg-amber-100 dark:bg-amber-950/70 px-3 py-1.5 rounded-xl border border-amber-300/80 shadow-2xs">
                        OUTRAS CATEGORIAS - PODE CONVOCAR
                      </span>
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                        ({atletasOutrasCategorias.length} atletas disponíveis de categorias inferiores)
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      {atletasOutrasCategorias.map(renderCardAtleta)}
                    </div>
                  </div>
                )}
              </>
            );
          })()}
        </div>
      ) : (
        /* ========================================================= */
        /* ABA 2: CAMPINHO TÁTICO VERTICAL COM 11 TITULARES */
        /* ========================================================= */
        <div className="space-y-6 pt-2">

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
      {/* BOTÃO ÚNICO SALVAR ESCALAÇÃO DO JOGO - FIXO NO RODAPÉ */}
      {/* Fixo acima das abas PAINEL / JOGO / ESCALAÇÃO / TROFÉUS */}
      {/* ========================================================= */}
      <div className="fixed bottom-20 left-0 right-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t-2 border-slate-200/90 dark:border-slate-800 p-2.5 sm:p-3 shadow-2xl">
        <div className="max-w-md sm:max-w-xl mx-auto">
          <button
            type="button"
            onClick={handleSalvarEscalacao}
            style={{ backgroundColor: '#2563eb' }}
            className="w-full inline-flex items-center justify-center gap-2.5 px-6 py-3.5 text-base sm:text-lg font-black text-white hover:bg-blue-700 active:scale-98 rounded-2xl shadow-lg transition-all cursor-pointer"
          >
            <Save className="w-5 h-5 text-amber-300 shrink-0" />
            <span>Salvar Escalação do Jogo ({totalConvocados} convocados)</span>
          </button>
        </div>
      </div>

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
    </div>
  );
};
