export type CategoriaBase = 'SUB-15' | 'SUB-16' | 'SUB-17' | string;

export type PosicaoAtleta =
  | 'Goleiro'
  | 'Zagueiro'
  | 'Lateral Direito'
  | 'Lateral Esquerdo'
  | 'Volante'
  | 'Meio-Campista'
  | 'Ponta Direita'
  | 'Ponta Esquerda'
  | 'Centroavante';

export type PernaDominante = 'Destro' | 'Canhoto' | 'Ambidestro';

export type StatusAtleta = 'Ativo' | 'Departamento Médico' | 'Transição' | 'Suspenso';

export interface Atleta {
  id: string;
  nome: string; // Nome Completo do atleta
  nomeCompleto?: string; // Nome civil completo para documentos oficiais / súmula
  apelido?: string; // Apelido para campinho e estratégia
  documento?: string; // Identidade / RG / CPF (compatibilidade com súmula)
  rg?: string; // Identidade / RG
  cpf?: string; // CPF do atleta
  categoria: CategoriaBase;
  posicao: PosicaoAtleta;
  numeroCamisa?: number;
  dataNascimento: string; // YYYY-MM-DD
  pernaDominante: PernaDominante;
  altura?: number; // em cm
  peso?: number; // em kg
  nomeResponsavel?: string; // Nome do Responsável Financeiro
  telefoneResponsavel?: string; // Telefone do Responsável
  status: StatusAtleta;
  dataCadastro: string;
  fotoUrl?: string;
}

export interface NotasPilares {
  tecnica: number; // 1 a 10
  tatica: number; // 1 a 10
  fisica: number; // 1 a 10
  mental: number; // 1 a 10
  disciplinar: number; // 1 a 10
}

export interface ObservacoesPilares {
  tecnica?: string;
  tatica?: string;
  fisica?: string;
  mental?: string;
  disciplinar?: string;
}

export const POSICOES_JOGO = [
  'Goleiro',
  'Zagueiro',
  'Lateral Direita',
  'Lateral Esquerdo',
  'Volante (5)',
  'Linha de 2',
  'Lado de Losango',
  'Linha de 3',
  'Meia (10)',
  'Atacante',
] as const;

export type PosicaoJogo = (typeof POSICOES_JOGO)[number] | string;

export interface AtletaEscalado {
  atletaId: string;
  titular: boolean; // true = Titular, false = Reserva
  posicaoJogo: string; // Ex: 'Goleiro', 'Volante (5)', etc.
  posicaoSlot?: string; // Slot exato no campinho (ex: 'GOL', 'ZAG1', 'ATA_E', etc.)
}

export interface AvaliacaoJogo {
  id: string;
  atletaId: string;
  categoria: CategoriaBase;
  dataJogo: string; // YYYY-MM-DD ou DD/MM/AAAA
  adversario: string;
  competicao: string;
  minutosJogados: number; // total somado (1º tempo + 2º tempo)
  minutos1Tempo?: number; // minutos jogados no 1º tempo
  minutos2Tempo?: number; // minutos jogados no 2º tempo
  resultado?: string; // ex: "3 x 1" ou "V 2x0"
  titular: boolean;
  posicaoJogo?: string; // Posição que atuou na partida
  gols?: number;
  assistencias?: number;
  cartoesAmarelos?: number;
  cartaoVermelho?: boolean;
  notas: NotasPilares;
  notaGeral: number; // média calculada (1 a 10)
  observacoes: string; // detalhes adicionais de progresso e desenvolvimento
  observacoesPorPilar?: ObservacoesPilares; // observação isolada por quesito
  jogoAgendaId?: string; // ID do jogo vinculado na Agenda de Jogos
  pontosFortes?: string[];
  pontosMelhoria?: string[];
  pontosPositivosTexto?: string;
  pontosMelhorarTexto?: string;
  avaliador?: string;
}

export const TAGS_DESTAQUE_DISPONIVEIS = [
  'Visão de jogo',
  'Passe vertical',
  'Finalização precisa',
  'Velocidade e arranque',
  'Drible 1x1',
  'Força',
  'Bolas paradas',
  'Liderança',
  'Passe entre linhas',
  'Retorno defensivo',
  'Realizou pisada',
  'Terminou as jogadas',
] as const;

export const TAGS_ATENCAO_DISPONIVEIS = [
  'Uso do pé não dominante',
  'Paciência na linha de impedimento',
  'Intensidade no 2º tempo',
  'Controle emocional sob pressão',
  'Comunicação em campo',
  'Jogo aéreo / Cabeceio',
  'Proteção de bola de costas',
  'Perda de bola na saída',
  'Cobertura defensiva',
  'Concentração',
  'Fora da zona 14',
  'Pisar na área',
] as const;

export type TipoJogo = 'Amistoso' | 'Campeonato' | 'Torneio' | string;

export interface JogoAgenda {
  id: string;
  adversario: string; // ex: "vs Brescia" ou "Brescia"
  dataJogo: string; // YYYY-MM-DD ou DD/MM/AAAA
  hora?: string; // ex: "09:00"
  categoria: CategoriaBase;
  local?: string; // ex: "CT Ninho do Galo", "Campo 1"
  tipo: TipoJogo; // Amistoso, Campeonato, Torneio, Copa, etc. (livre para digitar)
  placar?: string; // ex: "2 x 1"
  realizado?: boolean; // true se o jogo já aconteceu
  observacoesGerais?: string;
  criadoEm?: string;
  escalacao?: Record<string, AtletaEscalado>; // atletaId -> escalação do atleta para este jogo
  formacao?: string; // ex: '4-4-2 Losango'
}

export interface TesteFisicoAtleta {
  id: string;
  atletaId: string;
  data: string; // DD/MM/AAAA
  categoria: CategoriaBase;
  velocidade30m?: number; // seg (ex: 3.95)
  saltoVertical?: number; // cm (ex: 46)
  resistenciaYoYo?: number; // metros (ex: 1200)
  agilidadeShuttle?: number; // seg (ex: 4.8)
  flexibilidadeBanco?: number; // cm (ex: 28)
  estatura?: number; // cm
  massaCorporal?: number; // kg
  observacoes?: string;
  avaliador?: string;
}

export interface EstatisticasAtleta {
  totalJogos: number;
  minutosTotais: number;
  mediaGeral: number;
  mediasPilares: NotasPilares;
  melhorPilar: { nome: string; nota: number };
  pilarAtencao: { nome: string; nota: number };
}

// ==========================================
// MÓDULO FINANCEIRO
// ==========================================

export type MesAno =
  | 'JAN'
  | 'FEV'
  | 'MAR'
  | 'ABR'
  | 'MAI'
  | 'JUN'
  | 'JUL'
  | 'AGO'
  | 'SET'
  | 'OUT'
  | 'NOV'
  | 'DEZ';

export const MESES_DO_ANO: { id: MesAno; label: string; nomeCompleto: string }[] = [
  { id: 'JAN', label: 'JAN', nomeCompleto: 'Janeiro' },
  { id: 'FEV', label: 'FEV', nomeCompleto: 'Fevereiro' },
  { id: 'MAR', label: 'MAR', nomeCompleto: 'Março' },
  { id: 'ABR', label: 'ABR', nomeCompleto: 'Abril' },
  { id: 'MAI', label: 'MAI', nomeCompleto: 'Maio' },
  { id: 'JUN', label: 'JUN', nomeCompleto: 'Junho' },
  { id: 'JUL', label: 'JUL', nomeCompleto: 'Julho' },
  { id: 'AGO', label: 'AGO', nomeCompleto: 'Agosto' },
  { id: 'SET', label: 'SET', nomeCompleto: 'Setembro' },
  { id: 'OUT', label: 'OUT', nomeCompleto: 'Outubro' },
  { id: 'NOV', label: 'NOV', nomeCompleto: 'Novembro' },
  { id: 'DEZ', label: 'DEZ', nomeCompleto: 'Dezembro' },
];

export interface ItemCompeticaoTaxa {
  id: string;
  nome: string;
  valor?: number; // mantido para compatibilidade retroativa
  valorInscricao: number; // Taxa de Inscrição (única por competição)
  valorJogo: number; // Taxa de Jogo (por jogo)
  tipo: 'competicao' | 'taxa_jogo';
  categoria?: string; // SUB-15, SUB-16, SUB-17 ou 'TODAS'
  descricao?: string;
  criadoEm?: string;
}

export interface DebitoInscricaoAtleta {
  id: string;
  competicaoId?: string;
  competicaoNome: string;
  valor: number; // valor congelado na geração do débito
  pago: boolean;
  jogoOrigemId?: string;
  criadoEm: string;
  pagoEm?: string;
}

export interface DebitoTaxaJogoAtleta {
  id: string;
  jogoId: string;
  competicaoId?: string;
  competicaoNome: string;
  dataJogo: string;
  adversario: string;
  valor: number; // valor congelado na geração do débito
  pago: boolean;
  criadoEm: string;
  pagoEm?: string;
}

export interface RegistroFinanceiroAtleta {
  atletaId: string;
  valorMensalidadePadrao?: number; // padrão ex: 150
  mensalidadesPagas: MesAno[]; // Meses pagos ex: ['JAN', 'FEV']
  competicoesPagas: Record<string, boolean>; // legado / compatibilidade
  inscricoes?: DebitoInscricaoAtleta[]; // 1 por competição (ao escalar pela 1ª vez)
  taxasJogo?: DebitoTaxaJogoAtleta[]; // 1 por jogo (ao escalar + avaliar)
  atualizadoEm?: string;
}

export interface ResumoFinanceiroAtleta {
  atletaId: string;
  mensalidadesPagasCount: number; // ex: 5
  mensalidadesTotalCount: number; // 12
  competicoesPagasCount: number; // ex: 2
  competicoesTotalCount: number; // ex: 4
  totalPago: number; // R$ soma
  totalDevendo: number; // R$ pendente
}

export interface Trofeu {
  id: string | number;
  campeonato: string;
  categoria: string;
  resultado: 'campeao' | 'vice';
  ano?: string;
  dataConquista?: string;
}

