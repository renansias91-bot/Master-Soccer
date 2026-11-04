import { ATLETAS_INICIAIS, AVALIACOES_INICIAIS } from '../data/initialData';
import { Atleta, AvaliacaoJogo, EstatisticasAtleta, NotasPilares } from '../types';

const STORAGE_KEY_ATLETAS = 'mastersoccer_atletas_v2';
const STORAGE_KEY_AVALIACOES = 'mastersoccer_avaliacoes_v2';
const STORAGE_KEY_CATEGORIAS = 'mastersoccer_categorias_v2';

export const CATEGORIAS_PADRAO = ['SUB-15', 'SUB-16', 'SUB-17'];

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

  // Reset para dados de fábrica
  restaurarDadosFabrica(): void {
    localStorage.removeItem(STORAGE_KEY_ATLETAS);
    localStorage.removeItem(STORAGE_KEY_AVALIACOES);
    localStorage.removeItem(STORAGE_KEY_CATEGORIAS);
    this.salvarAtletas(ATLETAS_INICIAIS);
    this.salvarAvaliacoes(AVALIACOES_INICIAIS);
    this.salvarCategorias(CATEGORIAS_PADRAO);
  },
};
