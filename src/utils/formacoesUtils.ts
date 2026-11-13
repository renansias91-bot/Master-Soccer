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
