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
  nome: string;
  apelido?: string;
  categoria: CategoriaBase;
  posicao: PosicaoAtleta;
  numeroCamisa?: number;
  dataNascimento: string; // YYYY-MM-DD
  pernaDominante: PernaDominante;
  altura?: number; // em cm
  peso?: number; // em kg
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

export interface AvaliacaoJogo {
  id: string;
  atletaId: string;
  categoria: CategoriaBase;
  dataJogo: string; // YYYY-MM-DD
  adversario: string;
  competicao: string;
  minutosJogados: number; // total somado (1º tempo + 2º tempo)
  minutos1Tempo?: number; // minutos jogados no 1º tempo
  minutos2Tempo?: number; // minutos jogados no 2º tempo
  resultado?: string; // ex: "3 x 1" ou "V 2x0"
  titular: boolean;
  notas: NotasPilares;
  notaGeral: number; // média calculada (1 a 10)
  observacoes: string; // detalhes adicionais de progresso e desenvolvimento
  pontosFortes?: string[];
  pontosMelhoria?: string[];
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
