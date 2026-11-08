import { ATLETAS_INICIAIS, AVALIACOES_INICIAIS } from '../data/initialData';
import {
  Atleta,
  AvaliacaoJogo,
  EstatisticasAtleta,
  NotasPilares,
  ItemCompeticaoTaxa,
  RegistroFinanceiroAtleta,
  ResumoFinanceiroAtleta,
  MesAno,
  MESES_DO_ANO,
  JogoAgenda,
  TesteFisicoAtleta,
} from '../types';

const STORAGE_KEY_ATLETAS = 'mastersoccer_atletas_v2';
const STORAGE_KEY_AVALIACOES = 'mastersoccer_avaliacoes_v2';
const STORAGE_KEY_CATEGORIAS = 'mastersoccer_categorias_v2';
const STORAGE_KEY_COMPETICOES = 'mastersoccer_competicoes_v2';
const STORAGE_KEY_FINANCEIRO_ATLETAS = 'mastersoccer_financeiro_atletas_v2';
const STORAGE_KEY_VALOR_MENSALIDADE = 'mastersoccer_valor_mensalidade_v2';
const STORAGE_KEY_JOGOS_AGENDA = 'mastersoccer_jogos_agenda_v2';
const STORAGE_KEY_TESTES_FISICOS = 'mastersoccer_testes_fisicos_v2';

export const CATEGORIAS_PADRAO = ['SUB-15', 'SUB-16', 'SUB-17'];

export const COMPETICOES_PADRAO: ItemCompeticaoTaxa[] = [
  { id: 'comp-ferj', nome: 'FERJ', valor: 150, tipo: 'competicao', categoria: 'TODAS' },
  { id: 'comp-liga-metro', nome: 'LIGA METROPOLITANA', valor: 120, tipo: 'competicao', categoria: 'TODAS' },
  { id: 'comp-bs', nome: 'BS', valor: 100, tipo: 'competicao', categoria: 'TODAS' },
  { id: 'comp-spat', nome: 'SPAT', valor: 100, tipo: 'competicao', categoria: 'TODAS' },
  { id: 'taxa-jogo-padrao', nome: 'TAXA DE JOGO', valor: 50, tipo: 'taxa_jogo', categoria: 'TODAS' },
];

export const JOGOS_AGENDA_PADRAO: JogoAgenda[] = [
  // Próximos Jogos
  {
    id: 'jogo-brescia-prox',
    adversario: 'vs Brescia',
    dataJogo: '14/11/2026',
    hora: '09:00',
    categoria: 'SUB-15',
    local: 'CT Ninho do Galo',
    tipo: 'Campeonato',
    realizado: false,
  },
  {
    id: 'jogo-tigres-prox',
    adversario: 'vs Tigres',
    dataJogo: '21/11/2026',
    hora: '10:30',
    categoria: 'SUB-16',
    local: 'Estádio Municipal',
    tipo: 'Torneio',
    realizado: false,
  },
  {
    id: 'jogo-vila-prox',
    adversario: 'vs Atlético Vila',
    dataJogo: '28/11/2026',
    hora: '14:00',
    categoria: 'SUB-17',
    local: 'Arena Carioca',
    tipo: 'Amistoso',
    realizado: false,
  },
  // Jogos que já aconteceram
  {
    id: 'jogo-brescia-passado',
    adversario: 'vs Brescia',
    dataJogo: '04/11/2026',
    hora: '09:00',
    categoria: 'SUB-15',
    local: 'Campo Master Soccer',
    tipo: 'Campeonato',
    placar: '2 x 1',
    realizado: true,
  },
  {
    id: 'jogo-tigres-passado',
    adversario: 'vs Tigres',
    dataJogo: '28/10/2026',
    hora: '10:00',
    categoria: 'SUB-15',
    local: 'CT Tigres',
    tipo: 'Torneio',
    placar: '3 x 1',
    realizado: true,
  },
  {
    id: 'jogo-vila-passado',
    adversario: 'vs Atlético Vila',
    dataJogo: '21/10/2026',
    hora: '15:00',
    categoria: 'SUB-15',
    local: 'Arena Vila',
    tipo: 'Amistoso',
    placar: '1 x 0',
    realizado: true,
  },
];

export const TESTES_FISICOS_PADRAO: TesteFisicoAtleta[] = [
  {
    id: 'tf-1',
    atletaId: 'atl-1',
    data: '01/11/2026',
    categoria: 'SUB-15',
    velocidade30m: 3.92,
    saltoVertical: 47,
    resistenciaYoYo: 1420,
    agilidadeShuttle: 4.65,
    flexibilidadeBanco: 32,
    estatura: 174,
    massaCorporal: 64,
    observacoes: 'Excelente explosão muscular e tempo de reação.',
    avaliador: 'Prof. Carlos (Prep. Físico)',
  },
  {
    id: 'tf-2',
    atletaId: 'atl-2',
    data: '01/11/2026',
    categoria: 'SUB-15',
    velocidade30m: 4.1,
    saltoVertical: 42,
    resistenciaYoYo: 1680,
    agilidadeShuttle: 4.82,
    flexibilidadeBanco: 30,
    estatura: 178,
    massaCorporal: 68,
    observacoes: 'Destaque no teste de resistência aeróbica.',
    avaliador: 'Prof. Carlos (Prep. Físico)',
  },
];

export const VALOR_MENSALIDADE_PADRAO = 150;

export const storageService = {
  // Categorias
  getCategorias(): string[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY_CATEGORIAS);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.error('Erro ao ler categorias do localStorage', e);
    }
    return CATEGORIAS_PADRAO;
  },

  salvarCategorias(categorias: string[]): void {
    localStorage.setItem(STORAGE_KEY_CATEGORIAS, JSON.stringify(categorias));
  },

  // Atletas
  getAtletas(): Atleta[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY_ATLETAS);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.error('Erro ao ler atletas do localStorage', e);
    }
    // Semente inicial
    this.salvarAtletas(ATLETAS_INICIAIS);
    return ATLETAS_INICIAIS;
  },

  salvarAtletas(atletas: Atleta[]): void {
    localStorage.setItem(STORAGE_KEY_ATLETAS, JSON.stringify(atletas));
  },

  salvarAtleta(atleta: Atleta): void {
    const atletas = this.getAtletas();
    const index = atletas.findIndex((a) => a.id === atleta.id);
    if (index >= 0) {
      atletas[index] = atleta;
    } else {
      atletas.unshift(atleta);
    }
    this.salvarAtletas(atletas);
  },

  excluirAtleta(id: string): void {
    const atletas = this.getAtletas().filter((a) => a.id !== id);
    this.salvarAtletas(atletas);
    // Também remove avaliações do atleta
    const avaliacoes = this.getAvaliacoes().filter((av) => av.atletaId !== id);
    this.salvarAvaliacoes(avaliacoes);
  },

  // Avaliações de Jogos
  getAvaliacoes(): AvaliacaoJogo[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY_AVALIACOES);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.error('Erro ao ler avaliações do localStorage', e);
    }
    this.salvarAvaliacoes(AVALIACOES_INICIAIS);
    return AVALIACOES_INICIAIS;
  },

  salvarAvaliacoes(avaliacoes: AvaliacaoJogo[]): void {
    localStorage.setItem(STORAGE_KEY_AVALIACOES, JSON.stringify(avaliacoes));
  },

  salvarAvaliacao(avaliacao: AvaliacaoJogo): void {
    const avaliacoes = this.getAvaliacoes();
    const index = avaliacoes.findIndex((av) => av.id === avaliacao.id);
    if (index >= 0) {
      avaliacoes[index] = avaliacao;
    } else {
      avaliacoes.unshift(avaliacao);
    }
    this.salvarAvaliacoes(avaliacoes);
  },

  excluirAvaliacao(id: string): void {
    const avaliacoes = this.getAvaliacoes().filter((av) => av.id !== id);
    this.salvarAvaliacoes(avaliacoes);
  },

  // Estatísticas calculadas
  getEstatisticasAtleta(atletaId: string): EstatisticasAtleta {
    const avaliacoes = this.getAvaliacoes().filter((av) => av.atletaId === atletaId);

    if (avaliacoes.length === 0) {
      return {
        totalJogos: 0,
        minutosTotais: 0,
        mediaGeral: 0,
        mediasPilares: {
          tecnica: 0,
          tatica: 0,
          fisica: 0,
          mental: 0,
          disciplinar: 0,
        },
        melhorPilar: { nome: 'N/A', nota: 0 },
        pilarAtencao: { nome: 'N/A', nota: 0 },
      };
    }

    const totalJogos = avaliacoes.length;
    const minutosTotais = avaliacoes.reduce((acc, curr) => acc + (curr.minutosJogados || 0), 0);

    const soma = avaliacoes.reduce(
      (acc, curr) => {
        acc.tecnica += curr.notas.tecnica;
        acc.tatica += curr.notas.tatica;
        acc.fisica += curr.notas.fisica;
        acc.mental += curr.notas.mental;
        acc.disciplinar += curr.notas.disciplinar;
        acc.geral += curr.notaGeral;
        return acc;
      },
      { tecnica: 0, tatica: 0, fisica: 0, mental: 0, disciplinar: 0, geral: 0 }
    );

    const mediasPilares: NotasPilares = {
      tecnica: Number((soma.tecnica / totalJogos).toFixed(1)),
      tatica: Number((soma.tatica / totalJogos).toFixed(1)),
      fisica: Number((soma.fisica / totalJogos).toFixed(1)),
      mental: Number((soma.mental / totalJogos).toFixed(1)),
      disciplinar: Number((soma.disciplinar / totalJogos).toFixed(1)),
    };

    const mediaGeral = Number((soma.geral / totalJogos).toFixed(1));

    const listaPilares = [
      { nome: 'Técnica', nota: mediasPilares.tecnica },
      { nome: 'Tática', nota: mediasPilares.tatica },
      { nome: 'Física', nota: mediasPilares.fisica },
      { nome: 'Mental', nota: mediasPilares.mental },
      { nome: 'Disciplinar', nota: mediasPilares.disciplinar },
    ].sort((a, b) => b.nota - a.nota);

    return {
      totalJogos,
      minutosTotais,
      mediaGeral,
      mediasPilares,
      melhorPilar: listaPilares[0],
      pilarAtencao: listaPilares[listaPilares.length - 1],
    };
  },

  // Exportar Backup JSON
  exportarBackupJson(): void {
    const backup = {
      dataExportacao: new Date().toISOString(),
      categorias: this.getCategorias(),
      atletas: this.getAtletas(),
      avaliacoes: this.getAvaliacoes(),
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_mastersoccer_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },

  // Importar Backup JSON
  importarBackupJson(conteudoJson: string): boolean {
    try {
      const parsed = JSON.parse(conteudoJson);
      if (Array.isArray(parsed.atletas) && Array.isArray(parsed.avaliacoes)) {
        this.salvarAtletas(parsed.atletas);
        this.salvarAvaliacoes(parsed.avaliacoes);
        if (Array.isArray(parsed.categorias)) {
          this.salvarCategorias(parsed.categorias);
        }
        return true;
      }
      return false;
    } catch (e) {
      console.error('Erro ao importar JSON', e);
      return false;
    }
  },

  // Exportar CSV de Avaliações
  exportarAvaliacoesCsv(): void {
    const atletas = this.getAtletas();
    const avaliacoes = this.getAvaliacoes();

    const headers = [
      'ID Avaliação',
      'Atleta',
      'Categoria',
      'Posição',
      'Data do Jogo',
      'Adversário',
      'Competição',
      'Minutos',
      'Resultado',
      'Técnica',
      'Tática',
      'Física',
      'Mental',
      'Disciplinar',
      'Nota Geral',
      'Observações',
    ];

    const rows = avaliacoes.map((av) => {
      const atleta = atletas.find((a) => a.id === av.atletaId);
      return [
        av.id,
        `"${atleta ? atleta.nome : 'Atleta Desconhecido'}"`,
        av.categoria,
        `"${atleta ? atleta.posicao : ''}"`,
        av.dataJogo,
        `"${av.adversario}"`,
        `"${av.competicao}"`,
        av.minutosJogados,
        `"${av.resultado || ''}"`,
        av.notas.tecnica,
        av.notas.tatica,
        av.notas.fisica,
        av.notas.mental,
        av.notas.disciplinar,
        av.notaGeral,
        `"${(av.observacoes || '').replace(/"/g, '""')}"`,
      ].join(';');
    });

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `avaliacoes_mastersoccer_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  },

  // ==========================================
  // GESTÃO FINANCEIRA (LOCALSTORAGE + FALLBACK)
  // ==========================================

  getValorMensalidadePadrao(): number {
    try {
      const data = localStorage.getItem(STORAGE_KEY_VALOR_MENSALIDADE);
      if (data) {
        const val = Number(data);
        if (!isNaN(val) && val > 0) return val;
      }
    } catch (e) {
      console.warn('Erro ao ler valor da mensalidade do storage', e);
    }
    return VALOR_MENSALIDADE_PADRAO;
  },

  salvarValorMensalidadePadrao(valor: number): void {
    localStorage.setItem(STORAGE_KEY_VALOR_MENSALIDADE, String(valor));
  },

  getCompeticoes(): ItemCompeticaoTaxa[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY_COMPETICOES);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.warn('Erro ao ler competições do storage', e);
    }
    this.salvarCompeticoes(COMPETICOES_PADRAO);
    return COMPETICOES_PADRAO;
  },

  salvarCompeticoes(competicoes: ItemCompeticaoTaxa[]): void {
    localStorage.setItem(STORAGE_KEY_COMPETICOES, JSON.stringify(competicoes));
  },

  salvarCompeticao(comp: ItemCompeticaoTaxa): void {
    const lista = this.getCompeticoes();
    const index = lista.findIndex((c) => c.id === comp.id);
    if (index >= 0) {
      lista[index] = comp;
    } else {
      lista.push(comp);
    }
    this.salvarCompeticoes(lista);
  },

  excluirCompeticao(id: string): void {
    const lista = this.getCompeticoes().filter((c) => c.id !== id);
    this.salvarCompeticoes(lista);
  },

  getRegistrosFinanceiros(): Record<string, RegistroFinanceiroAtleta> {
    try {
      const data = localStorage.getItem(STORAGE_KEY_FINANCEIRO_ATLETAS);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.warn('Erro ao ler registros financeiros do storage', e);
    }
    return {};
  },

  salvarRegistrosFinanceiros(registros: Record<string, RegistroFinanceiroAtleta>): void {
    localStorage.setItem(STORAGE_KEY_FINANCEIRO_ATLETAS, JSON.stringify(registros));
  },

  getRegistroFinanceiroAtleta(atletaId: string): RegistroFinanceiroAtleta {
    const todos = this.getRegistrosFinanceiros();
    if (todos[atletaId]) {
      return todos[atletaId];
    }
    const novo: RegistroFinanceiroAtleta = {
      atletaId,
      valorMensalidadePadrao: this.getValorMensalidadePadrao(),
      mensalidadesPagas: [],
      competicoesPagas: {},
      atualizadoEm: new Date().toISOString(),
    };
    return novo;
  },

  salvarRegistroFinanceiroAtleta(registro: RegistroFinanceiroAtleta): void {
    const todos = this.getRegistrosFinanceiros();
    todos[registro.atletaId] = {
      ...registro,
      atualizadoEm: new Date().toISOString(),
    };
    this.salvarRegistrosFinanceiros(todos);
  },

  toggleMensalidadeAtleta(atletaId: string, mes: MesAno): RegistroFinanceiroAtleta {
    const registro = this.getRegistroFinanceiroAtleta(atletaId);
    const pagas = new Set(registro.mensalidadesPagas || []);
    if (pagas.has(mes)) {
      pagas.delete(mes);
    } else {
      pagas.add(mes);
    }
    registro.mensalidadesPagas = Array.from(pagas);
    this.salvarRegistroFinanceiroAtleta(registro);
    return registro;
  },

  toggleCompeticaoAtleta(atletaId: string, competicaoId: string): RegistroFinanceiroAtleta {
    const registro = this.getRegistroFinanceiroAtleta(atletaId);
    const atual = Boolean(registro.competicoesPagas?.[competicaoId]);
    registro.competicoesPagas = {
      ...(registro.competicoesPagas || {}),
      [competicaoId]: !atual,
    };
    this.salvarRegistroFinanceiroAtleta(registro);
    return registro;
  },

  calcularResumoAtleta(
    atleta: Atleta,
    competicoes: ItemCompeticaoTaxa[],
    registroParam?: RegistroFinanceiroAtleta
  ): ResumoFinanceiroAtleta {
    const registro = registroParam || this.getRegistroFinanceiroAtleta(atleta.id);
    const valorMensalidade =
      registro.valorMensalidadePadrao !== undefined && registro.valorMensalidadePadrao > 0
        ? registro.valorMensalidadePadrao
        : this.getValorMensalidadePadrao();

    // Filtra competições aplicáveis para esta categoria
    const compsAplicaveis = competicoes.filter(
      (c) => !c.categoria || c.categoria === 'TODAS' || c.categoria === atleta.categoria
    );

    const mensalidadesPagasCount = (registro.mensalidadesPagas || []).length;
    const mensalidadesTotalCount = 12;

    const competicoesTotalCount = compsAplicaveis.length;
    let competicoesPagasCount = 0;
    let totalPagoCompeticoes = 0;
    let totalDevendoCompeticoes = 0;

    for (const comp of compsAplicaveis) {
      const estaPago = Boolean(registro.competicoesPagas?.[comp.id]);
      if (estaPago) {
        competicoesPagasCount++;
        totalPagoCompeticoes += comp.valor || 0;
      } else {
        totalDevendoCompeticoes += comp.valor || 0;
      }
    }

    const totalPagoMensalidades = mensalidadesPagasCount * valorMensalidade;
    const totalDevendoMensalidades = (mensalidadesTotalCount - mensalidadesPagasCount) * valorMensalidade;

    const totalPago = totalPagoMensalidades + totalPagoCompeticoes;
    const totalDevendo = totalDevendoMensalidades + totalDevendoCompeticoes;

    return {
      atletaId: atleta.id,
      mensalidadesPagasCount,
      mensalidadesTotalCount,
      competicoesPagasCount,
      competicoesTotalCount,
      totalPago,
      totalDevendo,
    };
  },

  // ==========================================
  // AGENDA DE JOGOS
  // ==========================================
  getJogosAgenda(): JogoAgenda[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY_JOGOS_AGENDA);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.error('Erro ao ler jogos da agenda do localStorage', e);
    }
    this.salvarJogosAgenda(JOGOS_AGENDA_PADRAO);
    return JOGOS_AGENDA_PADRAO;
  },

  salvarJogosAgenda(jogos: JogoAgenda[]): void {
    localStorage.setItem(STORAGE_KEY_JOGOS_AGENDA, JSON.stringify(jogos));
  },

  salvarJogoAgenda(jogo: JogoAgenda): void {
    const jogos = this.getJogosAgenda();
    const index = jogos.findIndex((j) => j.id === jogo.id);
    if (index >= 0) {
      jogos[index] = jogo;
    } else {
      jogos.unshift(jogo);
    }
    this.salvarJogosAgenda(jogos);
  },

  excluirJogoAgenda(id: string): void {
    const jogos = this.getJogosAgenda().filter((j) => j.id !== id);
    this.salvarJogosAgenda(jogos);
    // Exclui todas as avaliações vinculadas a esse jogo
    const avaliacoes = this.getAvaliacoes().filter(
      (av) => av.jogoAgendaId !== id && (av as any).jogoId !== id
    );
    this.salvarAvaliacoes(avaliacoes);
  },

  // ==========================================
  // TESTES FÍSICOS
  // ==========================================
  getTestesFisicos(): TesteFisicoAtleta[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY_TESTES_FISICOS);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.error('Erro ao ler testes físicos do localStorage', e);
    }
    this.salvarTestesFisicos(TESTES_FISICOS_PADRAO);
    return TESTES_FISICOS_PADRAO;
  },

  salvarTestesFisicos(testes: TesteFisicoAtleta[]): void {
    localStorage.setItem(STORAGE_KEY_TESTES_FISICOS, JSON.stringify(testes));
  },

  salvarTesteFisico(teste: TesteFisicoAtleta): void {
    const testes = this.getTestesFisicos();
    const index = testes.findIndex((t) => t.id === teste.id);
    if (index >= 0) {
      testes[index] = teste;
    } else {
      testes.unshift(teste);
    }
    this.salvarTestesFisicos(testes);
  },

  excluirTesteFisico(id: string): void {
    const testes = this.getTestesFisicos().filter((t) => t.id !== id);
    this.salvarTestesFisicos(testes);
  },

  // Reset para dados de fábrica
  restaurarDadosFabrica(): void {
    localStorage.removeItem(STORAGE_KEY_ATLETAS);
    localStorage.removeItem(STORAGE_KEY_AVALIACOES);
    localStorage.removeItem(STORAGE_KEY_CATEGORIAS);
    localStorage.removeItem(STORAGE_KEY_COMPETICOES);
    localStorage.removeItem(STORAGE_KEY_FINANCEIRO_ATLETAS);
    localStorage.removeItem(STORAGE_KEY_VALOR_MENSALIDADE);
    localStorage.removeItem(STORAGE_KEY_JOGOS_AGENDA);
    localStorage.removeItem(STORAGE_KEY_TESTES_FISICOS);
    this.salvarAtletas(ATLETAS_INICIAIS);
    this.salvarAvaliacoes(AVALIACOES_INICIAIS);
    this.salvarCategorias(CATEGORIAS_PADRAO);
    this.salvarCompeticoes(COMPETICOES_PADRAO);
    this.salvarJogosAgenda(JOGOS_AGENDA_PADRAO);
    this.salvarTestesFisicos(TESTES_FISICOS_PADRAO);
  },
};
