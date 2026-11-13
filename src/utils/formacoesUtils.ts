import { Atleta, AtletaEscalado } from '../types';

export interface SlotPosicaoCampinho {
  id: string; // Ex: 'GOL', 'LE', 'ZAG-E', 'ZAG-D', 'LD', 'VOL', 'MEI-E', 'MEI-C', etc.
  label: string; // Ex: 'GOL', 'LE', 'ZAG-E', 'MEI-C / 10', etc.
  nomeCompleto: string; // Ex: 'Goleiro', 'Lateral Esquerdo', etc.
  linha: 'gol' | 'def' | 'mei' | 'ata';
  left: number; // % (0 a 100)
  top: number; // % (0 a 100)
}

/**
 * Normaliza qualquer chave de vaga ou slot para a chave fixa canônica
 */
export function normalizarSlotId(id?: string): string {
  if (!id) return '';
  const clean = id.trim();
  if (clean === 'MEI-C / 10' || clean === 'MEI_C' || clean === 'MEI (10)' || clean === 'MEI-C') return 'MEI-C';
  if (clean === 'ZAG1') return 'ZAG-E';
  if (clean === 'ZAG2') return 'ZAG-D';
  if (clean === 'VOL1') return 'VOL-E';
  if (clean === 'VOL2') return 'VOL-D';
  if (clean === 'MEI_E') return 'MEI-E';
  if (clean === 'MEI_D') return 'MEI-D';
  if (clean === 'ATA_E') return 'ATA-E';
  if (clean === 'ATA_D') return 'ATA-D';
  if (clean === 'ATA_C') return 'ATA-C';
  return clean;
}

export const FORMACOES_CAMPINHO: Record<string, SlotPosicaoCampinho[]> = {
  // FORMAÇÃO 4-4-2 LOSANGO
  '4-4-2 Losango': [
    { id: 'GOL', label: 'GOL', nomeCompleto: 'Goleiro', linha: 'gol', left: 50, top: 92 },
    { id: 'LE', label: 'LE', nomeCompleto: 'Lateral Esquerdo', linha: 'def', left: 15, top: 72 },
    { id: 'ZAG-E', label: 'ZAG-E', nomeCompleto: 'Zagueiro Esquerdo', linha: 'def', left: 38, top: 76 },
    { id: 'ZAG-D', label: 'ZAG-D', nomeCompleto: 'Zagueiro Direito', linha: 'def', left: 62, top: 76 },
    { id: 'LD', label: 'LD', nomeCompleto: 'Lateral Direito', linha: 'def', left: 85, top: 72 },
    { id: 'VOL', label: 'VOL', nomeCompleto: 'Volante', linha: 'mei', left: 50, top: 58 },
    { id: 'MEI-E', label: 'MEI-E', nomeCompleto: 'Meio-Campo Esquerdo', linha: 'mei', left: 22, top: 42 },
    { id: 'MEI-C', label: 'MEI-C / 10', nomeCompleto: 'Meio-Campo Central (10)', linha: 'mei', left: 50, top: 32 },
    { id: 'MEI-D', label: 'MEI-D', nomeCompleto: 'Meio-Campo Direito', linha: 'mei', left: 78, top: 42 },
    { id: 'ATA-E', label: 'ATA-E', nomeCompleto: 'Atacante Esquerdo', linha: 'ata', left: 35, top: 14 },
    { id: 'ATA-D', label: 'ATA-D', nomeCompleto: 'Atacante Direito', linha: 'ata', left: 65, top: 14 },
  ],

  // FORMAÇÃO 4-2-3-1
  '4-2-3-1': [
    { id: 'GOL', label: 'GOL', nomeCompleto: 'Goleiro', linha: 'gol', left: 50, top: 92 },
    { id: 'LE', label: 'LE', nomeCompleto: 'Lateral Esquerdo', linha: 'def', left: 15, top: 72 },
    { id: 'ZAG-E', label: 'ZAG-E', nomeCompleto: 'Zagueiro Esquerdo', linha: 'def', left: 38, top: 76 },
    { id: 'ZAG-D', label: 'ZAG-D', nomeCompleto: 'Zagueiro Direito', linha: 'def', left: 62, top: 76 },
    { id: 'LD', label: 'LD', nomeCompleto: 'Lateral Direito', linha: 'def', left: 85, top: 72 },
    { id: 'VOL-E', label: 'VOL-E', nomeCompleto: 'Volante Esquerdo', linha: 'mei', left: 38, top: 58 },
    { id: 'VOL-D', label: 'VOL-D', nomeCompleto: 'Volante Direito', linha: 'mei', left: 62, top: 58 },
    { id: 'MEI-E', label: 'MEI-E', nomeCompleto: 'Meio-Campo Esquerdo', linha: 'mei', left: 20, top: 38 },
    { id: 'MEI-C', label: 'MEI-C / 10', nomeCompleto: 'Meio-Campo Central (10)', linha: 'mei', left: 50, top: 34 },
    { id: 'MEI-D', label: 'MEI-D', nomeCompleto: 'Meio-Campo Direito', linha: 'mei', left: 80, top: 38 },
    { id: 'ATA', label: 'ATA', nomeCompleto: 'Centroavante', linha: 'ata', left: 50, top: 12 },
  ],

  // FORMAÇÃO 4-3-3
  '4-3-3': [
    { id: 'GOL', label: 'GOL', nomeCompleto: 'Goleiro', linha: 'gol', left: 50, top: 92 },
    { id: 'LE', label: 'LE', nomeCompleto: 'Lateral Esquerdo', linha: 'def', left: 15, top: 72 },
    { id: 'ZAG-E', label: 'ZAG-E', nomeCompleto: 'Zagueiro Esquerdo', linha: 'def', left: 38, top: 76 },
    { id: 'ZAG-D', label: 'ZAG-D', nomeCompleto: 'Zagueiro Direito', linha: 'def', left: 62, top: 76 },
    { id: 'LD', label: 'LD', nomeCompleto: 'Lateral Direito', linha: 'def', left: 85, top: 72 },
    { id: 'VOL', label: 'VOL', nomeCompleto: 'Volante', linha: 'mei', left: 50, top: 58 },
    { id: 'MEI-E', label: 'MEI-E', nomeCompleto: 'Meio-Campo Esquerdo', linha: 'mei', left: 30, top: 42 },
    { id: 'MEI-D', label: 'MEI-D', nomeCompleto: 'Meio-Campo Direito', linha: 'mei', left: 70, top: 42 },
    { id: 'ATA-E', label: 'ATA-E', nomeCompleto: 'Ponta Esquerda', linha: 'ata', left: 20, top: 16 },
    { id: 'ATA-C', label: 'ATA-C', nomeCompleto: 'Centroavante', linha: 'ata', left: 50, top: 12 },
    { id: 'ATA-D', label: 'ATA-D', nomeCompleto: 'Ponta Direita', linha: 'ata', left: 80, top: 16 },
  ],

  // FORMAÇÃO 4-2-4 LINHAS BAIXAS
  '4-2-4 linhas baixas': [
    { id: 'GOL', label: 'GOL', nomeCompleto: 'Goleiro', linha: 'gol', left: 50, top: 92 },
    { id: 'LE', label: 'LE', nomeCompleto: 'Lateral Esquerdo', linha: 'def', left: 15, top: 72 },
    { id: 'ZAG-E', label: 'ZAG-E', nomeCompleto: 'Zagueiro Esquerdo', linha: 'def', left: 38, top: 76 },
    { id: 'ZAG-D', label: 'ZAG-D', nomeCompleto: 'Zagueiro Direito', linha: 'def', left: 62, top: 76 },
    { id: 'LD', label: 'LD', nomeCompleto: 'Lateral Direito', linha: 'def', left: 85, top: 72 },
    { id: 'VOL-E', label: 'VOL-E', nomeCompleto: 'Volante Esquerdo', linha: 'mei', left: 35, top: 56 },
    { id: 'VOL-D', label: 'VOL-D', nomeCompleto: 'Volante Direito', linha: 'mei', left: 65, top: 56 },
    { id: 'MEI-E', label: 'MEI-E', nomeCompleto: 'Meia Esquerdo', linha: 'mei', left: 16, top: 36 },
    { id: 'MEI-D', label: 'MEI-D', nomeCompleto: 'Meia Direito', linha: 'mei', left: 84, top: 36 },
    { id: 'ATA-E', label: 'ATA-E', nomeCompleto: 'Atacante Esquerdo', linha: 'ata', left: 38, top: 30 },
    { id: 'ATA-D', label: 'ATA-D', nomeCompleto: 'Atacante Direito', linha: 'ata', left: 62, top: 30 },
  ],

  // FORMAÇÃO 4-1-4-1
  '4-1-4-1': [
    { id: 'GOL', label: 'GOL', nomeCompleto: 'Goleiro', linha: 'gol', left: 50, top: 92 },
    { id: 'LE', label: 'LE', nomeCompleto: 'Lateral Esquerdo', linha: 'def', left: 15, top: 72 },
    { id: 'ZAG-E', label: 'ZAG-E', nomeCompleto: 'Zagueiro Esquerdo', linha: 'def', left: 38, top: 76 },
    { id: 'ZAG-D', label: 'ZAG-D', nomeCompleto: 'Zagueiro Direito', linha: 'def', left: 62, top: 76 },
    { id: 'LD', label: 'LD', nomeCompleto: 'Lateral Direito', linha: 'def', left: 85, top: 72 },
    { id: 'VOL', label: 'VOL', nomeCompleto: 'Volante', linha: 'mei', left: 50, top: 60 },
    { id: 'MEI-E', label: 'MEI-E', nomeCompleto: 'Meio-Campista Esquerdo', linha: 'mei', left: 16, top: 40 },
    { id: 'MEI-CE', label: 'MEI-CE', nomeCompleto: 'Meio-Campista Central Esquerdo', linha: 'mei', left: 38, top: 42 },
    { id: 'MEI-CD', label: 'MEI-CD', nomeCompleto: 'Meio-Campista Central Direito', linha: 'mei', left: 62, top: 42 },
    { id: 'MEI-D', label: 'MEI-D', nomeCompleto: 'Meio-Campista Direito', linha: 'mei', left: 84, top: 40 },
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
    { id: 'MEI-C', label: 'MEI-C / 10' },
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
    { id: 'MEI-C', label: 'MEI-C / 10' },
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
    { id: 'MEI-D', label: 'MEI-D' },
    { id: 'ATA', label: 'ATA' },
  ],
};
BLOQUINHOS_FORMACAO['4-4-2'] = BLOQUINHOS_FORMACAO['4-4-2 Losango'];
BLOQUINHOS_FORMACAO['4-2-4'] = BLOQUINHOS_FORMACAO['4-2-4 linhas baixas'];

/**
 * Detecta a formação usada caso não esteja salva explicitamente no jogo (somente leitura)
 */
export function detectarFormacaoDaEscalacao(
  escalacaoMap: Record<string, AtletaEscalado> | undefined,
  formacaoSalva?: string
): string {
  if (formacaoSalva && FORMACOES_CAMPINHO[formacaoSalva]) {
    return formacaoSalva;
  }
  if (!escalacaoMap) return '4-4-2 Losango';

  const slotsPresentes = new Set(
    Object.values(escalacaoMap)
      .filter((e) => e.titular && e.posicaoSlot)
      .map((e) => normalizarSlotId(e.posicaoSlot))
  );

  if (slotsPresentes.has('MEI-CE') || slotsPresentes.has('MEI-CD')) return '4-1-4-1';
  if (slotsPresentes.has('ATA-C')) return '4-3-3';
  if ((slotsPresentes.has('VOL-E') || slotsPresentes.has('VOL-D')) && slotsPresentes.has('ATA')) {
    return '4-2-3-1';
  }
  if ((slotsPresentes.has('VOL-E') || slotsPresentes.has('VOL-D')) && (slotsPresentes.has('ATA-E') || slotsPresentes.has('ATA-D'))) {
    return '4-2-4 linhas baixas';
  }
  return '4-4-2 Losango';
}

/**
 * Função SOMENTE LEITURA para mapear titulares aos slots exatos da formação tática.
 * Nunca modifica nem reorganiza nenhum atleta.
 */
export function mapearTitularesNosSlots(
  titularesList: Atleta[],
  slots: SlotPosicaoCampinho[],
  escalacaoMap: Record<string, AtletaEscalado>
): Array<{ slot: SlotPosicaoCampinho; atleta: Atleta | null }> {
  return slots.map((slot) => {
    const targetId = normalizarSlotId(slot.id);
    const atleta =
      titularesList.find((a) => {
        const info = escalacaoMap[a.id];
        return info && info.titular && normalizarSlotId(info.posicaoSlot || '') === targetId;
      }) || null;

    return { slot, atleta };
  });
}

export interface GrupoPosicaoFormacao {
  key: string;
  sigla: string;
  titulo: string;
  slots: string[]; // Slots exatos do Campinho cobertos por este grupo (vazio para TODOS)
  subtituloVagas?: string;
}

export const GRUPOS_ESCALACAO_POR_FORMACAO: Record<string, GrupoPosicaoFormacao[]> = {
  '4-4-2 Losango': [
    { key: 'TODOS', sigla: 'TODOS', titulo: 'TODOS OS ATLETAS', slots: [] },
    { key: 'GOL', sigla: 'GOL', titulo: 'GOLEIRO', slots: ['GOL'] },
    { key: 'LD', sigla: 'LD', titulo: 'LATERAL DIREITO', slots: ['LD'] },
    { key: 'LE', sigla: 'LE', titulo: 'LATERAL ESQUERDO', slots: ['LE'] },
    { key: 'ZAG', sigla: 'ZAG', titulo: 'ZAGUEIRO', slots: ['ZAG-E', 'ZAG-D'], subtituloVagas: 'ZAG-E e ZAG-D' },
    { key: 'VOL', sigla: 'VOL', titulo: 'VOLANTE', slots: ['VOL'] },
    { key: 'MEI-E', sigla: 'MEI-E', titulo: 'MEIO-CAMPISTA ESQUERDO', slots: ['MEI-E'] },
    { key: 'MEI-C', sigla: 'MEI-C', titulo: 'MEIO-CAMPISTA CENTRAL (10)', slots: ['MEI-C'] },
    { key: 'MEI-D', sigla: 'MEI-D', titulo: 'MEIO-CAMPISTA DIREITO', slots: ['MEI-D'] },
    { key: 'ATA', sigla: 'ATA', titulo: 'ATACANTE', slots: ['ATA-E', 'ATA-D'], subtituloVagas: 'ATA-E e ATA-D' },
  ],
  '4-2-3-1': [
    { key: 'TODOS', sigla: 'TODOS', titulo: 'TODOS OS ATLETAS', slots: [] },
    { key: 'GOL', sigla: 'GOL', titulo: 'GOLEIRO', slots: ['GOL'] },
    { key: 'LD', sigla: 'LD', titulo: 'LATERAL DIREITO', slots: ['LD'] },
    { key: 'LE', sigla: 'LE', titulo: 'LATERAL ESQUERDO', slots: ['LE'] },
    { key: 'ZAG', sigla: 'ZAG', titulo: 'ZAGUEIRO', slots: ['ZAG-E', 'ZAG-D'], subtituloVagas: 'ZAG-E e ZAG-D' },
    { key: 'VOL', sigla: 'VOL', titulo: 'VOLANTE', slots: ['VOL-E', 'VOL-D'], subtituloVagas: 'VOL-E e VOL-D' },
    { key: 'MEI-E', sigla: 'MEI-E', titulo: 'MEIO-CAMPISTA ESQUERDO', slots: ['MEI-E'] },
    { key: 'MEI-C', sigla: 'MEI-C', titulo: 'MEIO-CAMPISTA CENTRAL (10)', slots: ['MEI-C'] },
    { key: 'MEI-D', sigla: 'MEI-D', titulo: 'MEIO-CAMPISTA DIREITO', slots: ['MEI-D'] },
    { key: 'ATA', sigla: 'ATA', titulo: 'ATACANTE', slots: ['ATA'] },
  ],
  '4-3-3': [
    { key: 'TODOS', sigla: 'TODOS', titulo: 'TODOS OS ATLETAS', slots: [] },
    { key: 'GOL', sigla: 'GOL', titulo: 'GOLEIRO', slots: ['GOL'] },
    { key: 'LD', sigla: 'LD', titulo: 'LATERAL DIREITO', slots: ['LD'] },
    { key: 'LE', sigla: 'LE', titulo: 'LATERAL ESQUERDO', slots: ['LE'] },
    { key: 'ZAG', sigla: 'ZAG', titulo: 'ZAGUEIRO', slots: ['ZAG-E', 'ZAG-D'], subtituloVagas: 'ZAG-E e ZAG-D' },
    { key: 'VOL', sigla: 'VOL', titulo: 'VOLANTE', slots: ['VOL'] },
    { key: 'MEI', sigla: 'MEI', titulo: 'MEIO-CAMPISTA', slots: ['MEI-E', 'MEI-D'], subtituloVagas: 'MEI-E e MEI-D' },
    { key: 'PD', sigla: 'PD', titulo: 'PONTA DIREITA', slots: ['ATA-D'] },
    { key: 'PE', sigla: 'PE', titulo: 'PONTA ESQUERDA', slots: ['ATA-E'] },
    { key: 'ATA', sigla: 'ATA', titulo: 'CENTROAVANTE', slots: ['ATA-C'] },
  ],
  '4-2-4 linhas baixas': [
    { key: 'TODOS', sigla: 'TODOS', titulo: 'TODOS OS ATLETAS', slots: [] },
    { key: 'GOL', sigla: 'GOL', titulo: 'GOLEIRO', slots: ['GOL'] },
    { key: 'LD', sigla: 'LD', titulo: 'LATERAL DIREITO', slots: ['LD'] },
    { key: 'LE', sigla: 'LE', titulo: 'LATERAL ESQUERDO', slots: ['LE'] },
    { key: 'ZAG', sigla: 'ZAG', titulo: 'ZAGUEIRO', slots: ['ZAG-E', 'ZAG-D'], subtituloVagas: 'ZAG-E e ZAG-D' },
    { key: 'VOL', sigla: 'VOL', titulo: 'VOLANTE', slots: ['VOL-E', 'VOL-D'], subtituloVagas: 'VOL-E e VOL-D' },
    { key: 'MEI-E', sigla: 'MEI-E', titulo: 'MEIO-CAMPISTA ESQUERDO', slots: ['MEI-E'] },
    { key: 'MEI-D', sigla: 'MEI-D', titulo: 'MEIO-CAMPISTA DIREITO', slots: ['MEI-D'] },
    { key: 'ATA', sigla: 'ATA', titulo: 'ATACANTE', slots: ['ATA-E', 'ATA-D'], subtituloVagas: 'ATA-E e ATA-D' },
  ],
  '4-1-4-1': [
    { key: 'TODOS', sigla: 'TODOS', titulo: 'TODOS OS ATLETAS', slots: [] },
    { key: 'GOL', sigla: 'GOL', titulo: 'GOLEIRO', slots: ['GOL'] },
    { key: 'LD', sigla: 'LD', titulo: 'LATERAL DIREITO', slots: ['LD'] },
    { key: 'LE', sigla: 'LE', titulo: 'LATERAL ESQUERDO', slots: ['LE'] },
    { key: 'ZAG', sigla: 'ZAG', titulo: 'ZAGUEIRO', slots: ['ZAG-E', 'ZAG-D'], subtituloVagas: 'ZAG-E e ZAG-D' },
    { key: 'VOL', sigla: 'VOL', titulo: 'VOLANTE', slots: ['VOL'] },
    { key: 'MEI-E', sigla: 'MEI-E', titulo: 'MEIO-CAMPISTA ESQUERDO', slots: ['MEI-E'] },
    { key: 'MEI-C', sigla: 'MEI-C', titulo: 'MEIO-CAMPISTA CENTRAL', slots: ['MEI-CE', 'MEI-CD'], subtituloVagas: 'MEI-CE e MEI-CD' },
    { key: 'MEI-D', sigla: 'MEI-D', titulo: 'MEIO-CAMPISTA DIREITO', slots: ['MEI-D'] },
    { key: 'ATA', sigla: 'ATA', titulo: 'ATACANTE', slots: ['ATA'] },
  ],
};

GRUPOS_ESCALACAO_POR_FORMACAO['4-4-2'] = GRUPOS_ESCALACAO_POR_FORMACAO['4-4-2 Losango'];
GRUPOS_ESCALACAO_POR_FORMACAO['4-2-4'] = GRUPOS_ESCALACAO_POR_FORMACAO['4-2-4 linhas baixas'];

export function obterGruposEscalacaoDaFormacao(formacao: string): GrupoPosicaoFormacao[] {
  return GRUPOS_ESCALACAO_POR_FORMACAO[formacao] || GRUPOS_ESCALACAO_POR_FORMACAO['4-4-2 Losango'];
}

const PREFERENCIAS_REMAPEAMENTO: Record<string, string[]> = {
  GOL: ['GOL'],
  LE: ['LE', 'LD', 'ZAG-E'],
  LD: ['LD', 'LE', 'ZAG-D'],
  'ZAG-E': ['ZAG-E', 'ZAG-D'],
  'ZAG-D': ['ZAG-D', 'ZAG-E'],
  VOL: ['VOL', 'VOL-E', 'VOL-D', 'MEI-CE', 'MEI-CD', 'MEI-C'],
  'VOL-E': ['VOL-E', 'VOL', 'VOL-D', 'MEI-CE', 'MEI-E', 'MEI-C'],
  'VOL-D': ['VOL-D', 'VOL', 'VOL-E', 'MEI-CD', 'MEI-D', 'MEI-C'],
  'MEI-E': ['MEI-E', 'MEI-CE', 'ATA-E', 'MEI-C', 'MEI-D'],
  'MEI-D': ['MEI-D', 'MEI-CD', 'ATA-D', 'MEI-C', 'MEI-E'],
  'MEI-C': ['MEI-C', 'MEI-CE', 'MEI-CD', 'VOL', 'MEI-E', 'MEI-D', 'ATA', 'ATA-C'],
  'MEI-CE': ['MEI-CE', 'MEI-C', 'MEI-E', 'VOL-E', 'VOL', 'MEI-CD'],
  'MEI-CD': ['MEI-CD', 'MEI-C', 'MEI-D', 'VOL-D', 'VOL', 'MEI-CE'],
  ATA: ['ATA', 'ATA-C', 'ATA-E', 'ATA-D', 'MEI-C'],
  'ATA-C': ['ATA-C', 'ATA', 'ATA-E', 'ATA-D', 'MEI-C'],
  'ATA-E': ['ATA-E', 'ATA', 'ATA-C', 'MEI-E', 'ATA-D'],
  'ATA-D': ['ATA-D', 'ATA', 'ATA-C', 'MEI-D', 'ATA-E'],
  PD: ['ATA-D', 'MEI-D', 'ATA-E', 'ATA'],
  PE: ['ATA-E', 'MEI-E', 'ATA-D', 'ATA'],
};

/**
 * Remapeia os jogadores já escalados quando o técnico troca de formação tática.
 * Regra: nenhum atleta pode ser apagado. Titulares mantêm vaga idêntica ou migram
 * para a vaga mais parecida disponível na nova formação. Reservas ficam no banco.
 */
export function remapearEscalacaoParaFormacao(
  escalacaoAtual: Record<string, AtletaEscalado>,
  novaFormacao: string
): Record<string, AtletaEscalado> {
  const slotsDestino = FORMACOES_CAMPINHO[novaFormacao] || FORMACOES_CAMPINHO['4-4-2 Losango'];
  const idsDestino = slotsDestino.map((s) => normalizarSlotId(s.id));
  const mapSlotInfo = new Map<string, SlotPosicaoCampinho>(
    slotsDestino.map((s) => [normalizarSlotId(s.id), s])
  );

  const resultado: Record<string, AtletaEscalado> = {};
  const ocupados = new Set<string>();
  const pendentes: Array<{ id: string; item: AtletaEscalado; slotAntigo: string }> = [];

  // 1. Mantém reservas intactos e titulares que já possuem a mesma vaga exata na nova formação
  for (const [id, item] of Object.entries(escalacaoAtual || {})) {
    if (!item) continue;
    if (!item.titular) {
      resultado[id] = { ...item };
      continue;
    }

    const slotAntigo = normalizarSlotId(item.posicaoSlot || '');
    if (slotAntigo && mapSlotInfo.has(slotAntigo) && !ocupados.has(slotAntigo)) {
      ocupados.add(slotAntigo);
      const slotInfo = mapSlotInfo.get(slotAntigo)!;
      resultado[id] = {
        ...item,
        titular: true,
        posicaoSlot: slotAntigo,
        posicaoJogo: slotInfo.nomeCompleto || item.posicaoJogo,
      };
    } else {
      pendentes.push({ id, item, slotAntigo });
    }
  }

  // 2. Remapeia titulares restantes para a vaga mais parecida disponível na nova formação
  const aindaSemVaga: Array<{ id: string; item: AtletaEscalado }> = [];
  for (const { id, item, slotAntigo } of pendentes) {
    const preferencias = PREFERENCIAS_REMAPEAMENTO[slotAntigo] || [];
    const melhorVaga = preferencias.find((cand) => mapSlotInfo.has(cand) && !ocupados.has(cand));

    if (melhorVaga) {
      ocupados.add(melhorVaga);
      const slotInfo = mapSlotInfo.get(melhorVaga)!;
      resultado[id] = {
        ...item,
        titular: true,
        posicaoSlot: melhorVaga,
        posicaoJogo: slotInfo.nomeCompleto || item.posicaoJogo,
      };
    } else {
      aindaSemVaga.push({ id, item });
    }
  }

  // 3. Garante que nenhum titular suma: aloca em qualquer vaga vazia restante da nova formação
  // (e somente se já houver mais de 11 titulares, move excedente para o banco em vez de apagar)
  for (const { id, item } of aindaSemVaga) {
    const qualquerVagaLivre = idsDestino.find((sid) => !ocupados.has(sid));
    if (qualquerVagaLivre) {
      ocupados.add(qualquerVagaLivre);
      const slotInfo = mapSlotInfo.get(qualquerVagaLivre)!;
      resultado[id] = {
        ...item,
        titular: true,
        posicaoSlot: qualquerVagaLivre,
        posicaoJogo: slotInfo.nomeCompleto || item.posicaoJogo,
      };
    } else {
      resultado[id] = {
        ...item,
        titular: false,
        posicaoSlot: undefined,
        posicaoJogo: 'Reserva',
      };
    }
  }

  return resultado;
}

