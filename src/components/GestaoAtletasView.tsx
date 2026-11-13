import React, { useEffect, useState, useMemo, useRef } from 'react';
import {
  Users,
  UserPlus,
  Search,
  ChevronDown,
  ChevronRight,
  Printer,
  FileSpreadsheet,
  Upload,
  Download,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Edit2,
  Trash2,
  FileText,
  Calendar,
  Clock,
  Award,
  Shield,
  Star,
  Check,
  X,
  Plus,
  Share2,
  RefreshCw,
  Link2,
  Copy,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import {
  compartilharArquivoPdfPronto,
  compartilharDocumentoPdf,
  MENSAGEM_SEM_SUPORTE_SHARE,
  navegadorSuportaCompartilharArquivoPdf,
} from '../utils/pdfShareUtils';
import {
  Atleta,
  AvaliacaoJogo,
  PernaDominante,
  PosicaoAtleta,
  StatusAtleta,
} from '../types';
import { obterIniciaisApelido } from '../utils/apelidoUtils';
import { formatarDataExibicao } from '../utils/dateUtils';
import { MasterSoccerEscudo } from './MasterSoccerEscudo';
import {
  FormularioAtletaCadastro,
  POSICOES_CAMPO_OPTIONS,
  PE_DOMINANTE_OPTIONS,
  formatarCpf,
  formatarTelefone,
} from './FormularioAtletaCadastro';

interface GestaoAtletasViewProps {
  atletas: Atleta[];
  avaliacoes: AvaliacaoJogo[];
  categorias: string[];
  subAbaInicial?: 'lista' | 'cadastro';
  onSalvarAtleta: (atleta: Atleta) => Promise<void> | void;
  onSalvarAtletasEmLote: (atletas: Atleta[]) => Promise<void> | void;
  onExcluirAtleta: (id: string) => Promise<void> | void;
  onVoltarParaPainel: () => void;
}

interface AtletaPreviaLote {
  tempId: string;
  nome: string;
  apelido: string;
  documento: string;
  categoria: string;
  posicao: PosicaoAtleta;
  pernaDominante: PernaDominante;
  altura?: number;
  peso?: number;
  dataNascimento: string;
  status: StatusAtleta;
  temErro: boolean;
  mensagemErro: string;
}

interface DadosDocumentoImpressao {
  tipo:
    | 'estatistica_atleta'
    | 'historico_atleta'
    | 'relatorio_atleta'
    | 'estatistica_categoria'
    | 'historico_categoria';
  titulo: string;
  subtitulo?: string;
  atleta?: Atleta;
  categoria?: string;
  conteudoHtml?: React.ReactNode;
}

const POSICOES_DISPONIVEIS: PosicaoAtleta[] = [
  'Goleiro',
  'Zagueiro',
  'Lateral Direito',
  'Lateral Esquerdo',
  'Volante',
  'Meio-Campista',
  'Ponta Direita',
  'Ponta Esquerda',
  'Centroavante',
];

const PERNAS_DISPONIVEIS: PernaDominante[] = ['Destro', 'Canhoto', 'Ambidestro'];

function normalizarPosicaoPlanilha(val: string): PosicaoAtleta {
  const s = val.toLowerCase().trim();
  if (s.includes('gol')) return 'Goleiro';
  if (s.includes('lat') && (s.includes('esq') || s.includes('le'))) return 'Lateral Esquerdo';
  if (s.includes('lat') && (s.includes('dir') || s.includes('ld'))) return 'Lateral Direito';
  if (s.includes('zag') || s.includes('def')) return 'Zagueiro';
  if (s.includes('vol')) return 'Volante';
  if (s.includes('pon') && (s.includes('esq') || s.includes('pe'))) return 'Ponta Esquerda';
  if (s.includes('pon') && (s.includes('dir') || s.includes('pd'))) return 'Ponta Direita';
  if (s.includes('cent') || s.includes('ata') || s.includes('ca')) return 'Centroavante';
  if (s.includes('mei')) return 'Meio-Campista';
  return 'Meio-Campista';
}

function normalizarPePlanilha(val: string): PernaDominante {
  const s = val.toLowerCase().trim();
  if (s.includes('ambi')) return 'Ambidestro';
  if (s.includes('canh') || s.includes('esq')) return 'Canhoto';
  return 'Destro';
}

function formatarDataPlanilha(val: any): string {
  if (!val) return '2011-01-01';
  if (typeof val === 'number') {
    // Excel serial number to date
    const date = new Date((val - (25567 + 2)) * 86400 * 1000);
    return date.toISOString().split('T')[0];
  }
  const str = String(val).trim();
  if (str.includes('/')) {
    const parts = str.split('/');
    if (parts.length === 3) {
      const dia = parts[0].padStart(2, '0');
      const mes = parts[1].padStart(2, '0');
      const ano = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
      return `${ano}-${mes}-${dia}`;
    }
  }
  return str;
}

export const GestaoAtletasView: React.FC<GestaoAtletasViewProps> = ({
  atletas,
  avaliacoes,
  categorias,
  subAbaInicial = 'lista',
  onSalvarAtleta,
  onSalvarAtletasEmLote,
  onExcluirAtleta,
  onVoltarParaPainel,
}) => {
  // 1. ABA PRINCIPAL DO TOPO: [Lista de Atletas] ou [Cadastrar Novo Atleta] (padrão 'lista')
  const [abaPrincipal, setAbaPrincipal] = useState<'lista' | 'cadastro'>(subAbaInicial);

  // 2. SUB-OPÇÕES NA ABA CADASTRAR: [Cadastrar Um por Um], [Cadastrar por Lote] ou [Link de Cadastro]
  const [modoCadastro, setModoCadastro] = useState<'unitario' | 'lote' | 'link'>('unitario');
  const [linkCopiado, setLinkCopiado] = useState(false);

  // 3. FILTRO DA LISTA: GERAL, SUB-15, SUB-16, SUB-17 (não usar mais TODOS, usar GERAL)
  const [filtroCategoria, setFiltroCategoria] = useState<string>('GERAL');
  const [busca, setBusca] = useState<string>('');

  // 4. ACCORDION DOS ATLETAS: ID do atleta expandido (ou null)
  const [atletaExpandidoId, setAtletaExpandidoId] = useState<string | null>(null);
  // Mini-aba ativa do atleta expandido: 'estatisticas' | 'historico' | 'relatorio' | 'editar'
  const [miniAbaAtiva, setMiniAbaAtiva] = useState<Record<string, 'estatisticas' | 'historico' | 'relatorio' | 'editar'>>({});
  // Nível 2 de estatísticas (expandido para ver gols, assistências, cartões)
  const [estatisticasNivel2, setEstatisticasNivel2] = useState<Record<string, boolean>>({});

  // 5. ESTADO DO CADASTRO UNITÁRIO
  const [feedbackUnitario, setFeedbackUnitario] = useState<string | null>(null);

  // 6. ESTADO DO CADASTRO POR LOTE
  const [atletasPreviaLote, setAtletasPreviaLote] = useState<AtletaPreviaLote[]>([]);
  const [feedbackLote, setFeedbackLote] = useState<string | null>(null);
  const [salvandoLote, setSalvandoLote] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // 7. MODAL DE IMPRESSÃO E COMPARTILHAMENTO
  const [documentoImpressao, setDocumentoImpressao] = useState<DadosDocumentoImpressao | null>(null);
  const documentoRef = useRef<HTMLDivElement | null>(null);
  const [compartilhando, setCompartilhando] = useState(false);
  const [erroShareDoc, setErroShareDoc] = useState<string | null>(null);
  const [arquivoProntoDoc, setArquivoProntoDoc] = useState<{
    file: File;
    titulo: string;
    texto: string;
  } | null>(null);

  useEffect(() => {
    setErroShareDoc(null);
    setArquivoProntoDoc(null);
  }, [documentoImpressao]);

  // 8. ESTADO DE EDIÇÃO INLINE DO ATLETA (na aba Editar Dados do card expandido)
  const [dadosEdicao, setDadosEdicao] = useState<Record<string, Atleta>>({});

  // Categorias disponíveis para filtro (GERAL, SUB-15, SUB-16, SUB-17, etc.)
  const categoriasFiltro = useMemo(() => {
    const setCats = new Set<string>();
    categorias.forEach((c) => setCats.add(c));
    atletas.forEach((a) => {
      if (a.categoria) setCats.add(a.categoria);
    });
    const lista = Array.from(setCats).filter((c) => c !== 'TODOS' && c !== 'GERAL');
    lista.sort();
    return ['GERAL', ...lista];
  }, [categorias, atletas]);

  // Lista de atletas filtrada e SEMPRE em ORDEM ALFABÉTICA A-Z pelo nome
  const atletasFiltrados = useMemo(() => {
    let list = [...atletas];

    // Filtro por categoria (GERAL = todas)
    if (filtroCategoria !== 'GERAL') {
      list = list.filter((a) => a.categoria === filtroCategoria);
    }

    // Filtro por busca de nome ou apelido
    if (busca.trim()) {
      const b = busca.toLowerCase();
      list = list.filter(
        (a) =>
          a.nome.toLowerCase().includes(b) ||
          (a.apelido && a.apelido.toLowerCase().includes(b)) ||
          a.posicao.toLowerCase().includes(b)
      );
    }

    // Regra estrita: ORDEM ALFABÉTICA A-Z pelo nome sempre!
    list.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));

    return list;
  }, [atletas, filtroCategoria, busca]);

  // Estatísticas calculadas por atleta
  const calcularEstatisticasAtleta = (atletaId: string) => {
    const avs = avaliacoes.filter((av) => av.atletaId === atletaId);
    const totalJogos = avs.length;
    const mediaNotas =
      totalJogos > 0
        ? avs.reduce((acc, curr) => acc + (curr.notaGeral || 0), 0) / totalJogos
        : 0;
    const minutagemTotal = avs.reduce((acc, curr) => acc + (curr.minutosJogados || 0), 0);
    const golsTotal = avs.reduce((acc, curr) => acc + (curr.gols || 0), 0);
    const assistenciasTotal = avs.reduce((acc, curr) => acc + (curr.assistencias || 0), 0);
    const amarelosTotal = avs.reduce((acc, curr) => acc + (curr.cartoesAmarelos || 0), 0);
    const vermelhosTotal = avs.reduce((acc, curr) => acc + (curr.cartaoVermelho ? 1 : 0), 0);

    return {
      totalJogos,
      mediaNotas,
      minutagemTotal,
      golsTotal,
      assistenciasTotal,
      amarelosTotal,
      vermelhosTotal,
      avaliacoes: avs,
    };
  };

  // Toggle do card accordion
  const handleToggleCard = (atletaId: string) => {
    if (atletaExpandidoId === atletaId) {
      setAtletaExpandidoId(null);
    } else {
      setAtletaExpandidoId(atletaId);
      if (!miniAbaAtiva[atletaId]) {
        setMiniAbaAtiva((prev) => ({ ...prev, [atletaId]: 'estatisticas' }));
      }
      // Inicializa dados de edição se não existirem
      const at = atletas.find((a) => a.id === atletaId);
      if (at && !dadosEdicao[atletaId]) {
        setDadosEdicao((prev) => ({ ...prev, [atletaId]: { ...at } }));
      }
    }
  };

  const linkCadastroPublico = useMemo(() => {
    if (typeof window !== 'undefined' && window.location?.origin) {
      const origin = window.location.origin;
      const ehPreviewInterno =
        origin.includes('run.app') ||
        origin.includes('localhost') ||
        origin.includes('127.0.0.1');
      if (ehPreviewInterno) {
        return 'https://master-soccer.vercel.app/cadastro-atleta';
      }
      return `${origin}/cadastro-atleta`;
    }
    return 'https://master-soccer.vercel.app/cadastro-atleta';
  }, []);

  const handleCopiarLinkCadastro = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(linkCadastroPublico);
      } else {
        throw new Error('Clipboard indisponível');
      }
    } catch {
      const textArea = document.createElement('textarea');
      textArea.value = linkCadastroPublico;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
      } catch {
        // Fallback silencioso
      }
      document.body.removeChild(textArea);
    }
    setLinkCopiado(true);
    setTimeout(() => setLinkCopiado(false), 4000);
  };

  // Baixar modelo de planilha
  const handleBaixarModelo = () => {
    const wsData = [
      [
        'Nome Completo',
        'Apelido',
        'Identidade / RG / CPF',
        'Categoria',
        'Posição',
        'Pé Dominante',
        'Altura',
        'Peso',
        'Data de Nascimento',
      ],
      [
        'João Pedro Santos',
        'Jota',
        '12.345.678-9',
        'SUB-15',
        'Goleiro',
        'Destro',
        182,
        74,
        '2011-04-10',
      ],
      [
        'Cauã Ferreira Lima',
        'Cauã',
        '23.456.789-0',
        'SUB-15',
        'Lateral Esquerdo',
        'Canhoto',
        172,
        63,
        '2011-07-22',
      ],
      [
        'Bryan Alencar Costa',
        'Bryan',
        '34.567.890-1',
        'SUB-15',
        'Zagueiro',
        'Canhoto',
        183,
        73,
        '2011-09-03',
      ],
      [
        'Felipe Augusto Rocha',
        'Lipe (10)',
        '45.678.901-2',
        'SUB-16',
        'Meio-Campista',
        'Destro',
        175,
        68,
        '2010-03-15',
      ],
      [
        'Marcos Vinicius Silva',
        'Markito',
        '56.789.012-3',
        'SUB-15',
        'Volante',
        'Destro',
        174,
        67,
        '2011-06-18',
      ],
    ];

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Modelo Atletas');
    XLSX.writeFile(wb, 'modelo_cadastro_atletas_master_soccer.xlsx');
  };

  // Importar planilha Excel / CSV
  const handleImportarPlanilha = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data: any[] = XLSX.utils.sheet_to_json(ws, { header: 1 });

        if (data.length <= 1) {
          alert('A planilha está vazia ou contém apenas o cabeçalho.');
          return;
        }

        const headers = (data[0] as string[]).map((h) =>
          String(h || '')
            .trim()
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
        );

        const idxNome = headers.findIndex((h) => h.includes('nome'));
        const idxApelido = headers.findIndex((h) => h.includes('apelido'));
        const idxDoc = headers.findIndex(
          (h) => h.includes('ident') || h.includes('rg') || h.includes('cpf') || h.includes('doc')
        );
        const idxCat = headers.findIndex((h) => h.includes('cat'));
        const idxPos = headers.findIndex((h) => h.includes('pos'));
        const idxPe = headers.findIndex((h) => h.includes('pe') || h.includes('perna'));
        const idxAlt = headers.findIndex((h) => h.includes('alt'));
        const idxPeso = headers.findIndex((h) => h.includes('peso'));
        const idxNasc = headers.findIndex((h) => h.includes('nasc') || h.includes('data'));

        const parseados: AtletaPreviaLote[] = [];

        for (let i = 1; i < data.length; i++) {
          const row = data[i] as any[];
          if (!row || row.length === 0 || !row.some((cell) => cell !== undefined && cell !== '')) {
            continue;
          }

          const nome = String(row[idxNome] || '').trim();
          const apelido = idxApelido >= 0 ? String(row[idxApelido] || '').trim() : '';
          const documento = idxDoc >= 0 ? String(row[idxDoc] || '').trim() : '';
          const categoriaBruta = idxCat >= 0 ? String(row[idxCat] || '').trim().toUpperCase() : '';
          const posicaoBruta = idxPos >= 0 ? String(row[idxPos] || '').trim() : '';
          const peBruto = idxPe >= 0 ? String(row[idxPe] || '').trim() : '';
          const altura = idxAlt >= 0 && row[idxAlt] ? Number(row[idxAlt]) : undefined;
          const peso = idxPeso >= 0 && row[idxPeso] ? Number(row[idxPeso]) : undefined;
          const dataNascimento = idxNasc >= 0 ? formatarDataPlanilha(row[idxNasc]) : '2011-01-01';

          let categoria: string = categoriaBruta;
          if (!categoria.startsWith('SUB-') && categoria.match(/\d+/)) {
            categoria = `SUB-${categoria.match(/\d+/)![0]}`;
          }
          if (!categoria) categoria = 'SUB-15';

          const posicao = normalizarPosicaoPlanilha(posicaoBruta);
          const pernaDominante = normalizarPePlanilha(peBruto);

          const erros: string[] = [];
          if (!nome || nome.length < 2) {
            erros.push('Nome inválido ou vazio');
          }
          if (!posicaoBruta) {
            erros.push('Posição não informada');
          }
          if (!categoriaBruta) {
            erros.push('Categoria não informada');
          }

          parseados.push({
            tempId: `lote-${i}-${Date.now()}-${Math.random()}`,
            nome,
            apelido,
            documento,
            categoria,
            posicao,
            pernaDominante,
            altura,
            peso,
            dataNascimento,
            status: 'Ativo',
            temErro: erros.length > 0,
            mensagemErro: erros.join(', '),
          });
        }

        // Ordena em ordem alfabética A-Z antes de exibir na prévia
        parseados.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
        setAtletasPreviaLote(parseados);
        setFeedbackLote(null);
      } catch (err: any) {
        alert('Erro ao processar planilha: ' + (err?.message || err));
      }
    };
    reader.readAsBinaryString(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Atualizar campo na prévia de lote
  const handleAtualizarPreviaLote = (tempId: string, campo: keyof AtletaPreviaLote, valor: any) => {
    setAtletasPreviaLote((prev) =>
      prev.map((item) => {
        if (item.tempId !== tempId) return item;
        const atualizado = { ...item, [campo]: valor };
        // Recalcula erro
        const erros: string[] = [];
        if (!atualizado.nome || atualizado.nome.trim().length < 2) {
          erros.push('Nome inválido ou vazio');
        }
        if (!atualizado.posicao) {
          erros.push('Posição não informada');
        }
        if (!atualizado.categoria) {
          erros.push('Categoria não informada');
        }
        atualizado.temErro = erros.length > 0;
        atualizado.mensagemErro = erros.join(', ');
        return atualizado;
      })
    );
  };

  // Remover atleta da prévia de lote
  const handleRemoverDaPrevia = (tempId: string) => {
    setAtletasPreviaLote((prev) => prev.filter((p) => p.tempId !== tempId));
  };

  // Confirmar cadastro em lote
  const handleConfirmarCadastroLote = async () => {
    const existemErros = atletasPreviaLote.some((a) => a.temErro);
    if (existemErros) {
      alert('Corrija os atletas marcados em vermelho antes de confirmar o cadastro em lote.');
      return;
    }

    if (atletasPreviaLote.length === 0) {
      alert('Nenhum atleta na prévia para cadastrar.');
      return;
    }

    setSalvandoLote(true);

    const atletasFormatados: Atleta[] = atletasPreviaLote.map((item) => ({
      id: '',
      nome: item.nome.trim(),
      apelido: item.apelido.trim() || undefined,
      documento: item.documento.trim() || undefined,
      categoria: item.categoria,
      posicao: item.posicao,
      pernaDominante: item.pernaDominante,
      altura: item.altura,
      peso: item.peso,
      dataNascimento: item.dataNascimento,
      status: 'Ativo',
      dataCadastro: new Date().toISOString().split('T')[0],
    }));

    try {
      await onSalvarAtletasEmLote(atletasFormatados);
      setFeedbackLote(`✓ ${atletasFormatados.length} atletas cadastrados com sucesso!`);
      setAtletasPreviaLote([]);
      setTimeout(() => {
        setFeedbackLote(null);
        setAbaPrincipal('lista');
      }, 2000);
    } catch (err: any) {
      alert('Erro ao cadastrar atletas em lote: ' + (err?.message || err));
    } finally {
      setSalvandoLote(false);
    }
  };

  // Salvar alterações inline na aba Editar Dados
  const handleSalvarEdicaoInline = async (atletaId: string) => {
    const atletaEditado = dadosEdicao[atletaId];
    if (!atletaEditado || !atletaEditado.nome.trim()) {
      alert('O nome do atleta não pode ficar vazio.');
      return;
    }

    const rgLimpo = (atletaEditado.rg ?? atletaEditado.documento ?? '').trim();
    const cpfLimpo = (atletaEditado.cpf ?? '').trim();
    const payload: Atleta = {
      ...atletaEditado,
      nome: atletaEditado.nome.trim(),
      nomeCompleto: atletaEditado.nome.trim(),
      rg: rgLimpo || undefined,
      cpf: cpfLimpo || undefined,
      documento: rgLimpo || cpfLimpo || undefined,
    };

    try {
      await onSalvarAtleta(payload);
      alert('✓ Alterações do atleta salvas com sucesso!');
    } catch (err: any) {
      alert('Erro ao salvar alterações: ' + (err?.message || err));
    }
  };

  // ==========================================
  // FUNÇÕES DE IMPRESSÃO
  // ==========================================

  // 1. Imprimir Estatística de UM atleta
  const handleImprimirEstatisticaAtleta = (atleta: Atleta) => {
    const stats = calcularEstatisticasAtleta(atleta.id);
    setDocumentoImpressao({
      tipo: 'estatistica_atleta',
      titulo: `Ficha Estatística Individual · ${atleta.nome}`,
      subtitulo: `${atleta.posicao} · Categoria ${atleta.categoria}`,
      atleta,
      conteudoHtml: (
        <div className="space-y-6">
          {/* Card Resumo */}
          <div className="grid grid-cols-3 gap-4 border border-slate-300 rounded-xl p-4 bg-slate-50">
            <div className="text-center">
              <div className="text-2xl font-black text-slate-900">{stats.totalJogos}</div>
              <div className="text-xs uppercase font-bold text-slate-500">Jogos Disputados</div>
            </div>
            <div className="text-center border-x border-slate-300">
              <div className="text-2xl font-black text-blue-700">{stats.mediaNotas.toFixed(1)}</div>
              <div className="text-xs uppercase font-bold text-slate-500">Média Geral</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-black text-emerald-700">{stats.minutagemTotal} min</div>
              <div className="text-xs uppercase font-bold text-slate-500">Minutagem Total</div>
            </div>
          </div>

          {/* Indicadores Detalhados */}
          <div className="grid grid-cols-4 gap-3">
            <div className="p-3 border border-slate-200 rounded-lg text-center">
              <div className="text-xl font-black text-emerald-700">{stats.golsTotal}</div>
              <div className="text-xs font-bold text-slate-600">Gols Marcados</div>
            </div>
            <div className="p-3 border border-slate-200 rounded-lg text-center">
              <div className="text-xl font-black text-blue-700">{stats.assistenciasTotal}</div>
              <div className="text-xs font-bold text-slate-600">Assistências</div>
            </div>
            <div className="p-3 border border-slate-200 rounded-lg text-center">
              <div className="text-xl font-black text-amber-600">{stats.amarelosTotal}</div>
              <div className="text-xs font-bold text-slate-600">Cartões Amarelos</div>
            </div>
            <div className="p-3 border border-slate-200 rounded-lg text-center">
              <div className="text-xl font-black text-red-600">{stats.vermelhosTotal}</div>
              <div className="text-xs font-bold text-slate-600">Cartões Vermelhos</div>
            </div>
          </div>
        </div>
      ),
    });
  };

  // 2. Imprimir Histórico de UM atleta
  const handleImprimirHistoricoAtleta = (atleta: Atleta) => {
    const stats = calcularEstatisticasAtleta(atleta.id);
    setDocumentoImpressao({
      tipo: 'historico_atleta',
      titulo: `Histórico Oficial de Partidas · ${atleta.nome}`,
      subtitulo: `${atleta.posicao} · Categoria ${atleta.categoria} · Total: ${stats.avaliacoes.length} jogos`,
      atleta,
      conteudoHtml: (
        <div className="space-y-4">
          <p className="text-xs text-slate-600 italic">
            Registro cronológico de partidas disputadas pelo atleta na base.
          </p>
          <div className="space-y-2">
            {stats.avaliacoes.length === 0 ? (
              <p className="text-sm text-slate-500 py-4 text-center border border-dashed rounded-lg">
                Nenhum jogo registrado para este atleta.
              </p>
            ) : (
              stats.avaliacoes.map((av, idx) => (
                <div
                  key={av.id || idx}
                  className="p-3 rounded-lg border border-slate-200 text-xs font-mono flex items-center justify-between"
                >
                  <span className="font-bold text-slate-800">
                    {formatarDataExibicao(av.dataJogo)} - {av.competicao || 'Jogo'} - {av.adversario}{' '}
                    {av.resultado ? `(${av.resultado})` : ''}
                  </span>
                  <span className="text-slate-600 font-semibold">
                    Nota: <b>{av.notaGeral?.toFixed(1) || '0.0'}</b> | Gol: {av.gols || 0} | Assist: {av.assistencias || 0} | Cartão:{' '}
                    {av.cartaoVermelho ? 'Vermelho' : av.cartoesAmarelos ? 'Amarelo' : 'Nenhum'} | {av.minutosJogados || 0} min
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      ),
    });
  };

  // 3. Imprimir Estatística de TODA a Categoria (Ordem A-Z)
  const handleImprimirEstatisticaCategoria = (cat: string) => {
    const atletasDaCat = atletas
      .filter((a) => (cat === 'GERAL' ? true : a.categoria === cat))
      .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));

    setDocumentoImpressao({
      tipo: 'estatistica_categoria',
      titulo: `Relatório Consolidado de Estatísticas · Categoria ${cat}`,
      subtitulo: `${atletasDaCat.length} atletas cadastrados · Ordenados de A a Z`,
      categoria: cat,
      conteudoHtml: (
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse border border-slate-300">
            <thead>
              <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                <th className="p-2.5 border-r border-slate-300">#</th>
                <th className="p-2.5 border-r border-slate-300">Atleta</th>
                <th className="p-2.5 border-r border-slate-300">Posição</th>
                <th className="p-2.5 border-r border-slate-300">Cat.</th>
                <th className="p-2.5 text-center border-r border-slate-300">Jogos</th>
                <th className="p-2.5 text-center border-r border-slate-300">Média</th>
                <th className="p-2.5 text-center border-r border-slate-300">Minutos</th>
                <th className="p-2.5 text-center border-r border-slate-300">Gols</th>
                <th className="p-2.5 text-center border-r border-slate-300">Assist.</th>
                <th className="p-2.5 text-center border-r border-slate-300">Amarelos</th>
                <th className="p-2.5 text-center">Vermelhos</th>
              </tr>
            </thead>
            <tbody>
              {atletasDaCat.map((atl, idx) => {
                const s = calcularEstatisticasAtleta(atl.id);
                return (
                  <tr key={atl.id} className="border-b border-slate-200 hover:bg-slate-50">
                    <td className="p-2 text-slate-400 font-mono border-r border-slate-200">
                      {idx + 1}
                    </td>
                    <td className="p-2 font-bold text-slate-900 border-r border-slate-200">
                      {atl.nome} {atl.apelido ? `(${atl.apelido})` : ''}
                    </td>
                    <td className="p-2 text-slate-700 border-r border-slate-200">{atl.posicao}</td>
                    <td className="p-2 font-bold text-slate-700 border-r border-slate-200">
                      {atl.categoria}
                    </td>
                    <td className="p-2 text-center font-bold text-slate-900 border-r border-slate-200">
                      {s.totalJogos}
                    </td>
                    <td className="p-2 text-center font-extrabold text-blue-700 border-r border-slate-200">
                      {s.mediaNotas > 0 ? s.mediaNotas.toFixed(1) : '-'}
                    </td>
                    <td className="p-2 text-center text-slate-700 border-r border-slate-200">
                      {s.minutagemTotal}
                    </td>
                    <td className="p-2 text-center font-bold text-emerald-700 border-r border-slate-200">
                      {s.golsTotal}
                    </td>
                    <td className="p-2 text-center text-slate-700 border-r border-slate-200">
                      {s.assistenciasTotal}
                    </td>
                    <td className="p-2 text-center text-amber-700 border-r border-slate-200">
                      {s.amarelosTotal}
                    </td>
                    <td className="p-2 text-center text-red-700">{s.vermelhosTotal}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ),
    });
  };

  // 4. Imprimir Histórico de TODA a Categoria (Ordem A-Z)
  const handleImprimirHistoricoCategoria = (cat: string) => {
    const atletasDaCat = atletas
      .filter((a) => (cat === 'GERAL' ? true : a.categoria === cat))
      .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));

    setDocumentoImpressao({
      tipo: 'historico_categoria',
      titulo: `Histórico Geral de Partidas · Categoria ${cat}`,
      subtitulo: `${atletasDaCat.length} atletas analisados · Ordenados de A a Z`,
      categoria: cat,
      conteudoHtml: (
        <div className="space-y-6">
          {atletasDaCat.map((atl, idx) => {
            const s = calcularEstatisticasAtleta(atl.id);
            return (
              <div key={atl.id} className="border-b border-slate-300 pb-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-black text-slate-900">
                    {idx + 1}. {atl.nome} {atl.apelido ? `(${atl.apelido})` : ''} — {atl.posicao} (
                    {atl.categoria})
                  </h4>
                  <span className="text-xs text-slate-500 font-bold">
                    {s.avaliacoes.length} jogos disputados
                  </span>
                </div>
                {s.avaliacoes.length === 0 ? (
                  <p className="text-xs text-slate-400 italic pl-3">
                    Nenhuma partida registrada até o momento.
                  </p>
                ) : (
                  <div className="space-y-1.5 pl-3">
                    {s.avaliacoes.map((av, avIdx) => (
                      <div
                        key={av.id || avIdx}
                        className="text-xs text-slate-700 font-mono py-1 border-l-2 border-blue-500 pl-2.5"
                      >
                        <b>{formatarDataExibicao(av.dataJogo)}</b> - {av.competicao || 'Jogo'} -{' '}
                        {av.adversario} {av.resultado ? `(${av.resultado})` : ''} | Nota:{' '}
                        <b>{av.notaGeral?.toFixed(1) || '0.0'}</b> | Gol: {av.gols || 0} | Assist:{' '}
                        {av.assistencias || 0} | Cartão:{' '}
                        {av.cartaoVermelho ? 'Vermelho' : av.cartoesAmarelos ? 'Amarelo' : 'Nenhum'}{' '}
                        | {av.minutosJogados || 0} min
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ),
    });
  };

  // 5. Compartilhar Documento via Web Share API gerando PDF em memória
  const handleCompartilharDocumento = async () => {
    setErroShareDoc(null);

    if (arquivoProntoDoc) {
      const resPronto = await compartilharArquivoPdfPronto(
        arquivoProntoDoc.file,
        arquivoProntoDoc.titulo,
        arquivoProntoDoc.texto
      );
      if (resPronto.sucesso) {
        setArquivoProntoDoc(null);
        return;
      }
      setErroShareDoc(resPronto.erro || MENSAGEM_SEM_SUPORTE_SHARE);
      return;
    }

    if (!navegadorSuportaCompartilharArquivoPdf()) {
      setErroShareDoc(MENSAGEM_SEM_SUPORTE_SHARE);
      return;
    }

    if (!documentoRef.current || !documentoImpressao) return;
    setCompartilhando(true);
    try {
      const dataHoje = new Date();
      const dd = String(dataHoje.getDate()).padStart(2, '0');
      const mm = String(dataHoje.getMonth() + 1).padStart(2, '0');
      const yyyy = dataHoje.getFullYear();
      const dataStr = `${dd}-${mm}-${yyyy}`;

      const limparSlug = (s: string) =>
        s
          .trim()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/\s+/g, '-')
          .replace(/[^a-zA-Z0-9-_]/g, '');

      let nomeArquivo = '';
      if (documentoImpressao.tipo === 'estatistica_categoria') {
        const cat = limparSlug(documentoImpressao.categoria || 'GERAL');
        nomeArquivo = `Relatorio-Estatisticas-${cat}-${dataStr}.pdf`;
      } else if (documentoImpressao.tipo === 'historico_categoria') {
        const cat = limparSlug(documentoImpressao.categoria || 'GERAL');
        nomeArquivo = `Historico-Categoria-${cat}-${dataStr}.pdf`;
      } else if (documentoImpressao.tipo === 'estatistica_atleta') {
        const apelidoOuNome = limparSlug(
          documentoImpressao.atleta?.apelido || documentoImpressao.atleta?.nome || 'Atleta'
        );
        nomeArquivo = `Estatistica-${apelidoOuNome}-${dataStr}.pdf`;
      } else if (documentoImpressao.tipo === 'historico_atleta') {
        const apelidoOuNome = limparSlug(
          documentoImpressao.atleta?.apelido || documentoImpressao.atleta?.nome || 'Atleta'
        );
        nomeArquivo = `Historico-${apelidoOuNome}-${dataStr}.pdf`;
      } else {
        nomeArquivo = `Documento-MasterSoccer-${dataStr}.pdf`;
      }

      const titulo = documentoImpressao.titulo;
      const texto = `Documento oficial Master Soccer RJ: ${documentoImpressao.titulo}`;

      const res = await compartilharDocumentoPdf({
        elemento: documentoRef.current,
        nomeArquivo,
        titulo,
        texto,
      });

      if (!res.sucesso) {
        if (res.precisaSegundoToque && res.arquivoPronto) {
          setArquivoProntoDoc({ file: res.arquivoPronto, titulo, texto });
        }
        setErroShareDoc(res.erro || MENSAGEM_SEM_SUPORTE_SHARE);
      }
    } catch (err: any) {
      console.error('Erro ao compartilhar documento:', err);
      setErroShareDoc('Não foi possível gerar o PDF do documento.');
    } finally {
      setCompartilhando(false);
    }
  };

  return (
    <div className="space-y-6 pb-24 max-w-5xl mx-auto px-3 sm:px-4">
      {/* ========================================================= */}
      {/* CABEÇALHO COM BOTÃO VOLTAR E TÍTULO */}
      {/* ========================================================= */}
      <div className="flex items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onVoltarParaPainel}
            className="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>← Voltar</span>
          </button>
          <div>
            <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
              Gestão de Atletas
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Lista, cadastros individuais ou por lote, histórico e relatórios oficiais
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-black px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/50">
            {atletas.length} Atletas
          </span>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 1. DUAS ABAS NO TOPO: [Lista de Atletas] e [Cadastrar Novo Atleta] */}
      {/* ========================================================= */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-1">
        <button
          type="button"
          onClick={() => setAbaPrincipal('lista')}
          className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-sm sm:text-base font-black transition-all cursor-pointer ${
            abaPrincipal === 'lista'
              ? 'bg-blue-600 text-white shadow-md border-2 border-blue-600'
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
          }`}
          style={abaPrincipal === 'lista' ? { backgroundColor: '#2563eb', color: '#ffffff' } : {}}
        >
          <Users className="w-4 h-4" />
          <span>Lista de Atletas</span>
        </button>

        <button
          type="button"
          onClick={() => setAbaPrincipal('cadastro')}
          className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-sm sm:text-base font-black transition-all cursor-pointer ${
            abaPrincipal === 'cadastro'
              ? 'bg-blue-600 text-white shadow-md border-2 border-blue-600'
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
          }`}
          style={abaPrincipal === 'cadastro' ? { backgroundColor: '#2563eb', color: '#ffffff' } : {}}
        >
          <UserPlus className="w-4 h-4" />
          <span>Cadastrar Novo Atleta</span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* ABA 1: LISTA DE ATLETAS */}
      {/* ========================================================= */}
      {abaPrincipal === 'lista' && (
        <div className="space-y-4">
          {/* Barra de Filtros: GERAL, SUB-15, SUB-16, SUB-17 + Busca */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              {/* Botões de Categoria */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {categoriasFiltro.map((cat) => {
                  const ativo = filtroCategoria === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setFiltroCategoria(cat)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
                        ativo
                          ? 'bg-blue-600 text-white shadow-sm border-2 border-blue-600'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                      }`}
                      style={ativo ? { backgroundColor: '#2563eb', color: '#ffffff' } : {}}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>

              {/* Busca por atleta */}
              <div className="relative flex-1 sm:max-w-xs">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Buscar por nome ou posição..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
                {busca && (
                  <button
                    type="button"
                    onClick={() => setBusca('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* BOTÕES DA CATEGORIA: Imprimir Estatística da Categoria e Imprimir Histórico da Categoria */}
            <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => handleImprimirEstatisticaCategoria(filtroCategoria)}
                className="px-3.5 py-2 rounded-xl text-xs font-black text-slate-800 dark:text-slate-100 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 border border-emerald-300/80 dark:border-emerald-800 flex items-center gap-2 cursor-pointer shadow-2xs active:scale-95 transition"
              >
                <Printer className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Imprimir Estatística da Categoria [{filtroCategoria}]</span>
              </button>

              <button
                type="button"
                onClick={() => handleImprimirHistoricoCategoria(filtroCategoria)}
                className="px-3.5 py-2 rounded-xl text-xs font-black text-slate-800 dark:text-slate-100 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 border border-blue-300/80 dark:border-blue-800 flex items-center gap-2 cursor-pointer shadow-2xs active:scale-95 transition"
              >
                <Printer className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                <span>Imprimir Histórico da Categoria [{filtroCategoria}]</span>
              </button>

              <span className="text-[11px] text-slate-400 font-bold ml-auto">
                {atletasFiltrados.length} atleta(s) em ordem alfabética A-Z
              </span>
            </div>
          </div>

          {/* LISTA DE ATLETAS: Cards em Accordion (Fechado / Abre um pouquinho) */}
          {atletasFiltrados.length === 0 ? (
            <div className="p-10 text-center bg-white dark:bg-slate-900 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 text-sm text-slate-400">
              Nenhum atleta encontrado para os critérios pesquisados.
            </div>
          ) : (
            <div className="space-y-2.5">
              {atletasFiltrados.map((atleta) => {
                const aberto = atletaExpandidoId === atleta.id;
                const miniAba = miniAbaAtiva[atleta.id] || 'estatisticas';
                const stats = calcularEstatisticasAtleta(atleta.id);
                const nivel2 = Boolean(estatisticasNivel2[atleta.id]);
                const dadosEdit = dadosEdicao[atleta.id] || { ...atleta };

                return (
                  <div
                    key={atleta.id}
                    className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                      aberto
                        ? 'bg-white dark:bg-slate-900 border-blue-500 dark:border-blue-500 shadow-md ring-1 ring-blue-500/30'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-2xs'
                    }`}
                  >
                    {/* TOPO DO CARD (ACCORDION FECHADO): Foto/iniciais, nome, posição, categoria + seta > */}
                    <div
                      onClick={() => handleToggleCard(atleta.id)}
                      className="p-3.5 sm:p-4 flex items-center justify-between gap-3 cursor-pointer select-none"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        {/* Foto / Iniciais */}
                        <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0 overflow-hidden flex items-center justify-center font-black text-sm text-slate-700 dark:text-slate-300">
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

                        {/* Nome, Apelido, Posição e Categoria */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-base sm:text-[17px] font-bold text-slate-900 dark:text-white uppercase tracking-tight truncate">
                              {atleta.nome}
                            </h3>
                            {atleta.apelido && (
                              <span className="text-xs font-extrabold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-md">
                                &quot;{atleta.apelido}&quot;
                              </span>
                            )}
                            <span className="text-[11px] font-black px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 border border-amber-300/60">
                              {atleta.categoria}
                            </span>
                          </div>
                          <p className="text-xs sm:text-[13px] text-slate-500 dark:text-slate-400 mt-0.5">
                            {atleta.posicao} · Pé: {atleta.pernaDominante || 'Direito'}
                            {atleta.dataNascimento && (
                              <span> · Nasc: {formatarDataExibicao(atleta.dataNascimento)}</span>
                            )}
                          </p>
                        </div>
                      </div>

                      {/* Seta > rotativa */}
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[11px] font-bold text-slate-400 hidden sm:inline">
                          {aberto ? 'Recolher' : 'Ver Detalhes'}
                        </span>
                        <div
                          className={`p-1.5 rounded-lg transition-transform duration-200 ${
                            aberto
                              ? 'rotate-90 bg-blue-50 dark:bg-blue-950/60 text-blue-600'
                              : 'text-slate-400 hover:text-slate-600'
                          }`}
                        >
                          <ChevronRight className="w-5 h-5" />
                        </div>
                      </div>
                    </div>

                    {/* CONTEÚDO EXPANDIDO (ACCORDION ABERTO SÓ UM POUQUINHO) */}
                    {aberto && (
                      <div className="border-t border-slate-100 dark:border-slate-800 p-4 sm:p-5 bg-slate-50/60 dark:bg-slate-900/60 space-y-4 animate-in fade-in">
                        {/* 4 MINI-ABAS: Estatísticas | Histórico | Relatório | Editar Dados */}
                        <div className="flex items-center gap-1.5 flex-wrap border-b border-slate-200 dark:border-slate-800 pb-2.5">
                          <button
                            type="button"
                            onClick={() =>
                              setMiniAbaAtiva((prev) => ({ ...prev, [atleta.id]: 'estatisticas' }))
                            }
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                              miniAba === 'estatisticas'
                                ? 'bg-blue-600 text-white shadow-2xs'
                                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                            }`}
                            style={miniAba === 'estatisticas' ? { backgroundColor: '#2563eb', color: '#ffffff' } : {}}
                          >
                            📊 Estatísticas
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              setMiniAbaAtiva((prev) => ({ ...prev, [atleta.id]: 'historico' }))
                            }
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                              miniAba === 'historico'
                                ? 'bg-blue-600 text-white shadow-2xs'
                                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                            }`}
                            style={miniAba === 'historico' ? { backgroundColor: '#2563eb', color: '#ffffff' } : {}}
                          >
                            📋 Histórico (Jogos)
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              setMiniAbaAtiva((prev) => ({ ...prev, [atleta.id]: 'relatorio' }))
                            }
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                              miniAba === 'relatorio'
                                ? 'bg-blue-600 text-white shadow-2xs'
                                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                            }`}
                            style={miniAba === 'relatorio' ? { backgroundColor: '#2563eb', color: '#ffffff' } : {}}
                          >
                            📝 Relatório (Pareceres)
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              setMiniAbaAtiva((prev) => ({ ...prev, [atleta.id]: 'editar' }))
                            }
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                              miniAba === 'editar'
                                ? 'bg-blue-600 text-white shadow-2xs'
                                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                            }`}
                            style={miniAba === 'editar' ? { backgroundColor: '#2563eb', color: '#ffffff' } : {}}
                          >
                            ✏️ Editar Dados
                          </button>
                        </div>

                        {/* MINI-ABA 1: ESTATÍSTICAS (EM 2 NÍVEIS) */}
                        {miniAba === 'estatisticas' && (
                          <div className="space-y-4">
                            {/* NÍVEL 1: SÓ 3 coisas bem resumidas (Jogos, Média das Notas, Minutagem total) */}
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                                  Resumo Oficial de Desempenho
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleImprimirEstatisticaAtleta(atleta)}
                                  className="px-3 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60 hover:bg-emerald-200 rounded-lg flex items-center gap-1.5 transition cursor-pointer"
                                >
                                  <Printer className="w-3.5 h-3.5" />
                                  <span>Imprimir Estatística</span>
                                </button>
                              </div>

                              <div
                                onClick={() =>
                                  setEstatisticasNivel2((prev) => ({
                                    ...prev,
                                    [atleta.id]: !prev[atleta.id],
                                  }))
                                }
                                className="grid grid-cols-3 gap-3 p-3.5 bg-white dark:bg-slate-800 rounded-2xl border-2 border-blue-200 dark:border-blue-900/60 shadow-xs cursor-pointer hover:border-blue-400 transition"
                                title="Clique para expandir e ver gols, assistências e cartões"
                              >
                                <div className="text-center">
                                  <div className="text-2xl font-black text-slate-900 dark:text-white">
                                    {stats.totalJogos}
                                  </div>
                                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                    Jogos
                                  </div>
                                </div>

                                <div className="text-center border-x border-slate-200 dark:border-slate-700">
                                  <div className="text-2xl font-black text-blue-600 dark:text-blue-400">
                                    {stats.mediaNotas > 0 ? stats.mediaNotas.toFixed(1) : '-'}
                                  </div>
                                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                    Média Notas
                                  </div>
                                </div>

                                <div className="text-center">
                                  <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                                    {stats.minutagemTotal}
                                    <span className="text-xs font-normal"> min</span>
                                  </div>
                                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                    Minutagem Total
                                  </div>
                                </div>
                              </div>

                              <div className="text-center mt-1.5">
                                <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">
                                  {nivel2
                                    ? '▲ Recolher detalhes extras'
                                    : '▼ Toque no resumo para ver Gols, Assistências e Cartões'}
                                </span>
                              </div>
                            </div>

                            {/* NÍVEL 2: Ao clicar no resumo, expande e mostra o geral: Gols, Assistências, Cartão Amarelo, Cartão Vermelho */}
                            {nivel2 && (
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 animate-in fade-in">
                                <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-center">
                                  <div className="text-lg font-black text-emerald-700 dark:text-emerald-300">
                                    {stats.golsTotal}
                                  </div>
                                  <div className="text-[10px] font-bold uppercase text-emerald-800 dark:text-emerald-200">
                                    Gols
                                  </div>
                                </div>

                                <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 text-center">
                                  <div className="text-lg font-black text-blue-700 dark:text-blue-300">
                                    {stats.assistenciasTotal}
                                  </div>
                                  <div className="text-[10px] font-bold uppercase text-blue-800 dark:text-blue-200">
                                    Assistências
                                  </div>
                                </div>

                                <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-center">
                                  <div className="text-lg font-black text-amber-600 dark:text-amber-400">
                                    {stats.amarelosTotal}
                                  </div>
                                  <div className="text-[10px] font-bold uppercase text-amber-800 dark:text-amber-200">
                                    Cartão Amarelo
                                  </div>
                                </div>

                                <div className="p-2.5 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 text-center">
                                  <div className="text-lg font-black text-red-600 dark:text-red-400">
                                    {stats.vermelhosTotal}
                                  </div>
                                  <div className="text-[10px] font-bold uppercase text-red-800 dark:text-red-200">
                                    Cartão Vermelho
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* MINI-ABA 2: HISTÓRICO (O QUE ACONTECEU - RESUMO DE TODOS OS JOGOS) */}
                        {miniAba === 'historico' && (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                                Histórico cronológico das partidas disputadas
                              </span>
                              <button
                                type="button"
                                onClick={() => handleImprimirHistoricoAtleta(atleta)}
                                className="px-3 py-1 text-xs font-bold text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-950/60 hover:bg-blue-200 rounded-lg flex items-center gap-1.5 transition cursor-pointer"
                              >
                                <Printer className="w-3.5 h-3.5" />
                                <span>Imprimir Histórico</span>
                              </button>
                            </div>

                            {stats.avaliacoes.length === 0 ? (
                              <div className="p-4 text-center text-xs text-slate-400 border border-dashed rounded-xl">
                                Nenhum jogo registrado para este atleta na Agenda.
                              </div>
                            ) : (
                              <div className="space-y-1.5">
                                {stats.avaliacoes.map((av, idx) => (
                                  <div
                                    key={av.id || idx}
                                    className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700/80 text-xs flex flex-wrap items-center justify-between gap-2"
                                  >
                                    <div className="font-extrabold text-slate-900 dark:text-white">
                                      {formatarDataExibicao(av.dataJogo)} - {av.competicao || 'Campeonato'} -{' '}
                                      {av.adversario} {av.resultado ? `(${av.resultado})` : ''}
                                    </div>
                                    <div className="text-slate-600 dark:text-slate-300 font-mono text-[11px] flex items-center gap-2">
                                      <span className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold">
                                        Nota: {av.notaGeral?.toFixed(1) || '0.0'}
                                      </span>
                                      <span>Gol: {av.gols || 0}</span>
                                      <span>Assistência: {av.assistencias || 0}</span>
                                      <span>
                                        Cartão:{' '}
                                        {av.cartaoVermelho
                                          ? 'Vermelho'
                                          : av.cartoesAmarelos
                                          ? 'Amarelo'
                                          : 'Nenhum'}
                                      </span>
                                      <span className="font-bold text-slate-700 dark:text-slate-200">
                                        {av.minutosJogados || 0} min
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {/* MINI-ABA 3: RELATÓRIO (O QUE O PROFESSOR ACHOU - UM POR UM, DETALHADO) */}
                        {miniAba === 'relatorio' && (
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                                Pareceres e avaliações técnicas da comissão (jogo a jogo)
                              </span>
                            </div>

                            {stats.avaliacoes.length === 0 ? (
                              <div className="p-4 text-center text-xs text-slate-400 border border-dashed rounded-xl">
                                Nenhuma avaliação com parecer cadastrada para este atleta.
                              </div>
                            ) : (
                              <div className="space-y-3">
                                {stats.avaliacoes.map((av, idx) => (
                                  <div
                                    key={av.id || idx}
                                    className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-3"
                                  >
                                    <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-100 dark:border-slate-700 pb-2">
                                      <div>
                                        <h4 className="text-sm font-black text-slate-900 dark:text-white">
                                          {formatarDataExibicao(av.dataJogo)} · {av.adversario}{' '}
                                          {av.resultado ? `(${av.resultado})` : ''}
                                        </h4>
                                        <p className="text-[11px] text-slate-500">
                                          {av.competicao || 'Competição'} · Professor: {av.avaliador || 'Comissão Técnica'}
                                        </p>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs font-black px-2.5 py-1 rounded-lg bg-blue-600 text-white">
                                          Nota Geral: {av.notaGeral?.toFixed(1) || '0.0'}
                                        </span>
                                      </div>
                                    </div>

                                    {/* Notas dos 5 Pilares */}
                                    {av.notas && (
                                      <div className="grid grid-cols-5 gap-1.5 text-center">
                                        <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900">
                                          <div className="text-xs font-black text-slate-800 dark:text-slate-200">
                                            {av.notas.tecnica}
                                          </div>
                                          <div className="text-[9px] font-bold uppercase text-slate-400">
                                            Técnica
                                          </div>
                                        </div>
                                        <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900">
                                          <div className="text-xs font-black text-slate-800 dark:text-slate-200">
                                            {av.notas.tatica}
                                          </div>
                                          <div className="text-[9px] font-bold uppercase text-slate-400">
                                            Tática
                                          </div>
                                        </div>
                                        <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900">
                                          <div className="text-xs font-black text-slate-800 dark:text-slate-200">
                                            {av.notas.fisica}
                                          </div>
                                          <div className="text-[9px] font-bold uppercase text-slate-400">
                                            Física
                                          </div>
                                        </div>
                                        <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900">
                                          <div className="text-xs font-black text-slate-800 dark:text-slate-200">
                                            {av.notas.mental}
                                          </div>
                                          <div className="text-[9px] font-bold uppercase text-slate-400">
                                            Mental
                                          </div>
                                        </div>
                                        <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900">
                                          <div className="text-xs font-black text-slate-800 dark:text-slate-200">
                                            {av.notas.disciplinar}
                                          </div>
                                          <div className="text-[9px] font-bold uppercase text-slate-400">
                                            Disciplinar
                                          </div>
                                        </div>
                                      </div>
                                    )}

                                    {/* Parecer do Professor */}
                                    {av.observacoes ? (
                                      <div className="p-3 bg-slate-50 dark:bg-slate-900/80 rounded-xl border border-slate-200/60 dark:border-slate-800">
                                        <span className="text-[10px] font-black uppercase text-blue-700 dark:text-blue-400 block mb-1">
                                          Parecer Técnico do Professor:
                                        </span>
                                        <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed italic">
                                          &quot;{av.observacoes}&quot;
                                        </p>
                                      </div>
                                    ) : (
                                      <p className="text-xs text-slate-400 italic">
                                        Sem parecer descritivo registrado nesta partida.
                                      </p>
                                    )}

                                    {/* Destaques e Atenção */}
                                    {(av.pontosFortes?.length || av.pontosMelhoria?.length) ? (
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                        {av.pontosFortes && av.pontosFortes.length > 0 && (
                                          <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200">
                                            <span className="font-bold block mb-1">✓ Pontos Positivos:</span>
                                            <span className="text-[11px]">{av.pontosFortes.join(', ')}</span>
                                          </div>
                                        )}
                                        {av.pontosMelhoria && av.pontosMelhoria.length > 0 && (
                                          <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200">
                                            <span className="font-bold block mb-1">⚠️ Pontos a Melhorar:</span>
                                            <span className="text-[11px]">{av.pontosMelhoria.join(', ')}</span>
                                          </div>
                                        )}
                                      </div>
                                    ) : null}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {/* MINI-ABA 4: EDITAR DADOS */}
                        {miniAba === 'editar' && (
                          <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {/* 1. Nome Completo */}
                              <div className="sm:col-span-2">
                                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                                  Nome Completo do Atleta *
                                </label>
                                <input
                                  type="text"
                                  value={dadosEdit.nome}
                                  onChange={(e) =>
                                    setDadosEdicao((prev) => ({
                                      ...prev,
                                      [atleta.id]: { ...dadosEdit, nome: e.target.value },
                                    }))
                                  }
                                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                                />
                              </div>

                              {/* 2. Apelido */}
                              <div className="sm:col-span-2">
                                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                                  Apelido (Campinho / Estratégia)
                                </label>
                                <input
                                  type="text"
                                  value={dadosEdit.apelido || ''}
                                  onChange={(e) =>
                                    setDadosEdicao((prev) => ({
                                      ...prev,
                                      [atleta.id]: { ...dadosEdit, apelido: e.target.value },
                                    }))
                                  }
                                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
                                />
                              </div>

                              {/* 3. Identidade / RG */}
                              <div>
                                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                                  Identidade / RG
                                </label>
                                <input
                                  type="text"
                                  placeholder="Ex: 12.345.678-9"
                                  value={dadosEdit.rg ?? dadosEdit.documento ?? ''}
                                  onChange={(e) =>
                                    setDadosEdicao((prev) => ({
                                      ...prev,
                                      [atleta.id]: {
                                        ...dadosEdit,
                                        rg: e.target.value,
                                        documento: e.target.value,
                                      },
                                    }))
                                  }
                                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
                                />
                              </div>

                              {/* 4. CPF */}
                              <div>
                                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                                  CPF
                                </label>
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  placeholder="000.000.000-00"
                                  value={dadosEdit.cpf ?? ''}
                                  onChange={(e) =>
                                    setDadosEdicao((prev) => ({
                                      ...prev,
                                      [atleta.id]: {
                                        ...dadosEdit,
                                        cpf: formatarCpf(e.target.value),
                                      },
                                    }))
                                  }
                                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
                                />
                              </div>

                              {/* 5. Categoria */}
                              <div className="sm:col-span-2">
                                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                                  Categoria *
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                  {categoriasFiltro
                                    .filter((c) => c !== 'GERAL')
                                    .map((c) => {
                                      const sel = dadosEdit.categoria === c;
                                      return (
                                        <button
                                          key={c}
                                          type="button"
                                          onClick={() =>
                                            setDadosEdicao((prev) => ({
                                              ...prev,
                                              [atleta.id]: { ...dadosEdit, categoria: c },
                                            }))
                                          }
                                          className={`py-2 px-2 rounded-xl text-xs font-black border transition cursor-pointer ${
                                            sel
                                              ? 'bg-blue-600 border-blue-600 text-white'
                                              : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                                          }`}
                                          style={
                                            sel
                                              ? { backgroundColor: '#2563eb', borderColor: '#2563eb', color: '#ffffff' }
                                              : {}
                                          }
                                        >
                                          {c}
                                        </button>
                                      );
                                    })}
                                </div>
                              </div>

                              {/* 6. Posição em Campo */}
                              <div>
                                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                                  Posição em Campo *
                                </label>
                                <select
                                  value={dadosEdit.posicao}
                                  onChange={(e) =>
                                    setDadosEdicao((prev) => ({
                                      ...prev,
                                      [atleta.id]: {
                                        ...dadosEdit,
                                        posicao: e.target.value as PosicaoAtleta,
                                      },
                                    }))
                                  }
                                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                                >
                                  {POSICOES_CAMPO_OPTIONS.map((p) => (
                                    <option key={p.value} value={p.value}>
                                      {p.label}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              {/* 7. Pé dominante */}
                              <div>
                                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                                  Pé dominante
                                </label>
                                <div className="grid grid-cols-3 gap-1.5">
                                  {PE_DOMINANTE_OPTIONS.map((op) => {
                                    const ativo = dadosEdit.pernaDominante === op.value;
                                    return (
                                      <button
                                        key={op.value}
                                        type="button"
                                        onClick={() =>
                                          setDadosEdicao((prev) => ({
                                            ...prev,
                                            [atleta.id]: {
                                              ...dadosEdit,
                                              pernaDominante: op.value,
                                            },
                                          }))
                                        }
                                        className={`py-2 px-1.5 rounded-xl text-[11px] font-black border transition cursor-pointer ${
                                          ativo
                                            ? 'bg-blue-600 border-blue-600 text-white'
                                            : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                                        }`}
                                        style={
                                          ativo
                                            ? { backgroundColor: '#2563eb', borderColor: '#2563eb', color: '#ffffff' }
                                            : {}
                                        }
                                      >
                                        {op.label}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>

                              {/* 8. Altura */}
                              <div>
                                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                                  Altura (cm)
                                </label>
                                <input
                                  type="number"
                                  value={dadosEdit.altura || ''}
                                  onChange={(e) =>
                                    setDadosEdicao((prev) => ({
                                      ...prev,
                                      [atleta.id]: {
                                        ...dadosEdit,
                                        altura: e.target.value ? Number(e.target.value) : undefined,
                                      },
                                    }))
                                  }
                                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
                                />
                              </div>

                              {/* 9. Peso */}
                              <div>
                                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                                  Peso (kg)
                                </label>
                                <input
                                  type="number"
                                  value={dadosEdit.peso || ''}
                                  onChange={(e) =>
                                    setDadosEdicao((prev) => ({
                                      ...prev,
                                      [atleta.id]: {
                                        ...dadosEdit,
                                        peso: e.target.value ? Number(e.target.value) : undefined,
                                      },
                                    }))
                                  }
                                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
                                />
                              </div>

                              {/* 10. Data de nascimento */}
                              <div className="sm:col-span-2">
                                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                                  Data de nascimento
                                </label>
                                <input
                                  type="date"
                                  value={dadosEdit.dataNascimento || ''}
                                  onChange={(e) =>
                                    setDadosEdicao((prev) => ({
                                      ...prev,
                                      [atleta.id]: { ...dadosEdit, dataNascimento: e.target.value },
                                    }))
                                  }
                                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                                />
                              </div>

                              {/* 11. Nome do Responsável Financeiro */}
                              <div>
                                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                                  Nome do Responsável Financeiro *
                                </label>
                                <input
                                  type="text"
                                  value={dadosEdit.nomeResponsavel || ''}
                                  onChange={(e) =>
                                    setDadosEdicao((prev) => ({
                                      ...prev,
                                      [atleta.id]: { ...dadosEdit, nomeResponsavel: e.target.value },
                                    }))
                                  }
                                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
                                />
                              </div>

                              {/* 12. Telefone do Responsável */}
                              <div>
                                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                                  Telefone do Responsável
                                </label>
                                <input
                                  type="tel"
                                  inputMode="tel"
                                  placeholder="(21) 99999-9999"
                                  value={dadosEdit.telefoneResponsavel || ''}
                                  onChange={(e) =>
                                    setDadosEdicao((prev) => ({
                                      ...prev,
                                      [atleta.id]: {
                                        ...dadosEdit,
                                        telefoneResponsavel: formatarTelefone(e.target.value),
                                      },
                                    }))
                                  }
                                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
                                />
                              </div>
                            </div>

                            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-700">
                              <button
                                type="button"
                                onClick={() => {
                                  if (
                                    confirm(
                                      `Tem certeza que deseja excluir o atleta "${atleta.nome}" e todas as suas avaliações?`
                                    )
                                  ) {
                                    onExcluirAtleta(atleta.id);
                                  }
                                }}
                                className="px-3 py-1.5 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition cursor-pointer flex items-center gap-1.5"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Excluir Atleta</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleSalvarEdicaoInline(atleta.id)}
                                className="px-5 py-2 rounded-xl text-xs font-black text-white bg-blue-600 hover:bg-blue-700 active:scale-95 shadow-sm transition cursor-pointer"
                                style={{ backgroundColor: '#2563eb' }}
                              >
                                Salvar Alterações
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* ABA 2: CADASTRAR NOVO ATLETA (UM POR UM, LOTE OU LINK) */}
      {/* ========================================================= */}
      {abaPrincipal === 'cadastro' && (
        <div className="space-y-6">
          {/* 3 Opções lado a lado: [Cadastrar Um por Um] [Cadastrar por Lote] [Link de Cadastro] */}
          <div className="bg-white dark:bg-slate-900 p-2 sm:p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs grid grid-cols-3 gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={() => setModoCadastro('unitario')}
              className={`min-h-[48px] py-2.5 px-2 sm:px-4 rounded-xl text-[11px] sm:text-sm font-black transition-all cursor-pointer text-center leading-tight flex items-center justify-center ${
                modoCadastro === 'unitario'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
              }`}
              style={modoCadastro === 'unitario' ? { backgroundColor: '#2563eb', color: '#ffffff' } : {}}
            >
              Cadastrar Um por Um
            </button>

            <button
              type="button"
              onClick={() => setModoCadastro('lote')}
              className={`min-h-[48px] py-2.5 px-2 sm:px-4 rounded-xl text-[11px] sm:text-sm font-black transition-all cursor-pointer text-center leading-tight flex items-center justify-center ${
                modoCadastro === 'lote'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
              }`}
              style={modoCadastro === 'lote' ? { backgroundColor: '#2563eb', color: '#ffffff' } : {}}
            >
              Cadastrar por Lote (Planilha Excel / CSV)
            </button>

            <button
              type="button"
              onClick={() => setModoCadastro('link')}
              className={`min-h-[48px] py-2.5 px-2 sm:px-4 rounded-xl text-[11px] sm:text-sm font-black transition-all cursor-pointer text-center leading-tight flex items-center justify-center ${
                modoCadastro === 'link'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
              }`}
              style={modoCadastro === 'link' ? { backgroundColor: '#2563eb', color: '#ffffff' } : {}}
            >
              Link de Cadastro
            </button>
          </div>

          {/* ======================================================= */}
          {/* 2.1 CADASTRAR UM POR UM: Igual ao formulario do link publico */}
          {/* ======================================================= */}
          {modoCadastro === 'unitario' && (
            <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-md">
              <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight mb-1">
                Ficha de Cadastro Individual
              </h2>
              <p className="text-xs text-slate-500 mb-6">
                Preencha os dados do atleta para adicionar à base do clube.
              </p>

              {feedbackUnitario && (
                <div className="mb-6 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 text-emerald-800 dark:text-emerald-200 text-sm font-bold flex items-center justify-between gap-2">
                  <span>{feedbackUnitario}</span>
                  <button
                    type="button"
                    onClick={() => setAbaPrincipal('lista')}
                    className="underline text-xs shrink-0 cursor-pointer"
                  >
                    Ver na Lista de Atletas →
                  </button>
                </div>
              )}

              <FormularioAtletaCadastro
                categorias={categorias}
                textoBotaoSalvar="Cadastrar Atleta"
                onSalvar={async (novoAtleta) => {
                  await onSalvarAtleta(novoAtleta);
                  setFeedbackUnitario(`✓ Atleta "${novoAtleta.nome}" cadastrado com sucesso!`);
                  setTimeout(() => setFeedbackUnitario(null), 5000);
                }}
              />
            </div>
          )}

          {/* ======================================================= */}
          {/* 2.3 LINK DE CADASTRO: Copiar link e enviar no WhatsApp */}
          {/* ======================================================= */}
          {modoCadastro === 'link' && (
            <div className="bg-white dark:bg-slate-900 p-5 sm:p-7 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-md space-y-5 max-w-2xl">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-center shrink-0">
                  <Link2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="space-y-1">
                  <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">
                    Link de Cadastro
                  </h2>
                  <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">
                    Copie o link e mande no grupo do WhatsApp para os atletas se cadastrarem sozinhos
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="campo-link-cadastro-publico"
                  className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide"
                >
                  Link público de cadastro
                </label>
                <div
                  id="campo-link-cadastro-publico"
                  onClick={(e) => {
                    const sel = window.getSelection();
                    const range = document.createRange();
                    range.selectNodeContents(e.currentTarget);
                    sel?.removeAllRanges();
                    sel?.addRange(range);
                  }}
                  className="w-full px-4 py-3.5 text-sm font-mono font-bold bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white break-all select-all cursor-text leading-relaxed"
                >
                  {linkCadastroPublico}
                </div>
              </div>

              <button
                type="button"
                onClick={handleCopiarLinkCadastro}
                className="w-full min-h-[52px] px-6 py-3.5 rounded-xl text-sm sm:text-base font-black text-white bg-blue-600 hover:bg-blue-700 active:scale-[0.99] shadow-md transition cursor-pointer flex items-center justify-center gap-2.5"
                style={{
                  backgroundColor: linkCopiado ? '#059669' : '#2563eb',
                  color: '#ffffff',
                }}
              >
                {linkCopiado ? (
                  <>
                    <Check className="w-5 h-5 shrink-0" />
                    <span>Link copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-5 h-5 shrink-0" />
                    <span>Copiar link de cadastro</span>
                  </>
                )}
              </button>

              {linkCopiado && (
                <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-sm font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  <span>Link copiado! Agora é só colar no grupo do WhatsApp.</span>
                </div>
              )}

              <div className="pt-1 text-center">
                <a
                  href="/cadastro-atleta"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Abrir formulário de cadastro neste navegador →
                </a>
              </div>
            </div>
          )}

          {/* ======================================================= */}
          {/* 2.2 CADASTRAR POR LOTE: Baixar modelo + Importar planilha + Prévia */}
          {/* ======================================================= */}
          {modoCadastro === 'lote' && (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-md space-y-6">
              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight mb-1">
                  Importação de Atletas em Lote
                </h2>
                <p className="text-xs text-slate-500">
                  Baixe a planilha modelo, preencha com quantos atletas desejar e envie o arquivo (Excel ou CSV) para cadastrar todos de uma vez.
                </p>
              </div>

              {/* Botões de Ação: Baixar Modelo & Importar Planilha */}
              <div className="flex flex-wrap items-center gap-4 p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={handleBaixarModelo}
                  className="px-5 py-3 rounded-xl text-xs sm:text-sm font-black text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 hover:bg-slate-100 shadow-2xs transition cursor-pointer flex items-center gap-2 active:scale-95"
                >
                  <Download className="w-4 h-4 text-blue-600" />
                  <span>Baixar Modelo / Planilha Exemplo (.xlsx)</span>
                </button>

                <label className="px-5 py-3 rounded-xl text-xs sm:text-sm font-black text-white bg-blue-600 hover:bg-blue-700 shadow-md transition cursor-pointer flex items-center gap-2 active:scale-95">
                  <Upload className="w-4 h-4" />
                  <span>Importar Planilha Preenchida</span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx, .xls, .csv"
                    onChange={handleImportarPlanilha}
                    className="hidden"
                  />
                </label>
              </div>

              {feedbackLote && (
                <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-300 text-sm font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span>{feedbackLote}</span>
                </div>
              )}

              {/* PRÉVIA / LISTA DE CONFERÊNCIA (ORDEM ALFABÉTICA A-Z) */}
              {atletasPreviaLote.length > 0 && (
                <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight">
                        Prévia de Conferência ({atletasPreviaLote.length} atletas)
                      </h3>
                      <p className="text-xs text-slate-500">
                        Atletas ordenados de A a Z. Verifique os dados antes de confirmar.
                      </p>
                    </div>

                    {atletasPreviaLote.some((a) => a.temErro) && (
                      <span className="text-xs font-black text-red-600 bg-red-50 dark:bg-red-950/60 px-3 py-1.5 rounded-xl border border-red-200">
                        ⚠️ Existem atletas com erros (marcados em vermelho). Corrija-os para liberar o cadastro.
                      </span>
                    )}
                  </div>

                  <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-2xl">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-100 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700">
                          <th className="p-3">Status</th>
                          <th className="p-3">Nome Completo *</th>
                          <th className="p-3">Apelido</th>
                          <th className="p-3">Identidade / RG / CPF</th>
                          <th className="p-3">Categoria *</th>
                          <th className="p-3">Posição *</th>
                          <th className="p-3">Pé</th>
                          <th className="p-3">Altura</th>
                          <th className="p-3">Peso</th>
                          <th className="p-3">Nascimento *</th>
                          <th className="p-3 text-center">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {atletasPreviaLote.map((item) => (
                          <tr
                            key={item.tempId}
                            className={`transition ${
                              item.temErro
                                ? 'bg-red-50/80 dark:bg-red-950/40 text-red-900 dark:text-red-200 font-bold'
                                : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                            }`}
                          >
                            <td className="p-3 whitespace-nowrap">
                              {item.temErro ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-black text-red-700 bg-red-100 dark:bg-red-950 px-2 py-0.5 rounded-md border border-red-300">
                                  <AlertTriangle className="w-3.5 h-3.5" />
                                  <span>{item.mensagemErro}</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded-md">
                                  <Check className="w-3.5 h-3.5" />
                                  <span>OK</span>
                                </span>
                              )}
                            </td>

                            <td className="p-3">
                              <input
                                type="text"
                                value={item.nome}
                                onChange={(e) =>
                                  handleAtualizarPreviaLote(item.tempId, 'nome', e.target.value)
                                }
                                className="w-full min-w-[160px] px-2 py-1 bg-white dark:bg-slate-900 border rounded font-bold text-xs"
                              />
                            </td>

                            <td className="p-3">
                              <input
                                type="text"
                                value={item.apelido}
                                onChange={(e) =>
                                  handleAtualizarPreviaLote(item.tempId, 'apelido', e.target.value)
                                }
                                className="w-24 px-2 py-1 bg-white dark:bg-slate-900 border rounded text-xs"
                              />
                            </td>

                            <td className="p-3">
                              <input
                                type="text"
                                placeholder="RG / CPF"
                                value={item.documento}
                                onChange={(e) =>
                                  handleAtualizarPreviaLote(item.tempId, 'documento', e.target.value)
                                }
                                className="w-28 px-2 py-1 bg-white dark:bg-slate-900 border rounded text-xs"
                              />
                            </td>

                            <td className="p-3">
                              <input
                                type="text"
                                value={item.categoria}
                                onChange={(e) =>
                                  handleAtualizarPreviaLote(
                                    item.tempId,
                                    'categoria',
                                    e.target.value.toUpperCase()
                                  )
                                }
                                className="w-20 px-2 py-1 bg-white dark:bg-slate-900 border rounded font-bold text-xs uppercase"
                              />
                            </td>

                            <td className="p-3">
                              <select
                                value={item.posicao}
                                onChange={(e) =>
                                  handleAtualizarPreviaLote(
                                    item.tempId,
                                    'posicao',
                                    e.target.value as PosicaoAtleta
                                  )
                                }
                                className="px-2 py-1 bg-white dark:bg-slate-900 border rounded text-xs font-bold"
                              >
                                {POSICOES_DISPONIVEIS.map((p) => (
                                  <option key={p} value={p}>
                                    {p}
                                  </option>
                                ))}
                              </select>
                            </td>

                            <td className="p-3">
                              <select
                                value={item.pernaDominante}
                                onChange={(e) =>
                                  handleAtualizarPreviaLote(
                                    item.tempId,
                                    'pernaDominante',
                                    e.target.value as PernaDominante
                                  )
                                }
                                className="px-2 py-1 bg-white dark:bg-slate-900 border rounded text-xs"
                              >
                                {PERNAS_DISPONIVEIS.map((p) => (
                                  <option key={p} value={p}>
                                    {p}
                                  </option>
                                ))}
                              </select>
                            </td>

                            <td className="p-3">
                              <input
                                type="number"
                                value={item.altura || ''}
                                onChange={(e) =>
                                  handleAtualizarPreviaLote(
                                    item.tempId,
                                    'altura',
                                    e.target.value ? Number(e.target.value) : undefined
                                  )
                                }
                                className="w-16 px-1.5 py-1 bg-white dark:bg-slate-900 border rounded text-xs text-center"
                              />
                            </td>

                            <td className="p-3">
                              <input
                                type="number"
                                value={item.peso || ''}
                                onChange={(e) =>
                                  handleAtualizarPreviaLote(
                                    item.tempId,
                                    'peso',
                                    e.target.value ? Number(e.target.value) : undefined
                                  )
                                }
                                className="w-16 px-1.5 py-1 bg-white dark:bg-slate-900 border rounded text-xs text-center"
                              />
                            </td>

                            <td className="p-3">
                              <input
                                type="date"
                                value={item.dataNascimento}
                                onChange={(e) =>
                                  handleAtualizarPreviaLote(
                                    item.tempId,
                                    'dataNascimento',
                                    e.target.value
                                  )
                                }
                                className="px-2 py-1 bg-white dark:bg-slate-900 border rounded text-xs font-bold"
                              />
                            </td>

                            <td className="p-3 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoverDaPrevia(item.tempId)}
                                className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                                title="Remover da prévia"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Botão Confirmar Cadastro em Lote */}
                  <div className="flex items-center justify-between pt-4">
                    <button
                      type="button"
                      onClick={() => setAtletasPreviaLote([])}
                      className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition"
                    >
                      Limpar Prévia
                    </button>

                    <button
                      type="button"
                      disabled={atletasPreviaLote.some((a) => a.temErro) || salvandoLote}
                      onClick={handleConfirmarCadastroLote}
                      className="px-6 py-3 rounded-2xl text-sm font-black text-white bg-blue-600 hover:bg-blue-700 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-md transition cursor-pointer flex items-center gap-2"
                      style={{ backgroundColor: '#2563eb' }}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>
                        {salvandoLote
                          ? 'Salvando no Firebase...'
                          : `Confirmar Cadastro em Lote (${atletasPreviaLote.length} Atletas)`}
                      </span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL DE IMPRESSÃO / VISUALIZAÇÃO DE DOCUMENTO OFICIAL */}
      {/* ========================================================= */}
      {documentoImpressao && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            {/* Topo do Modal */}
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/60">
              <div className="flex items-center gap-3">
                <MasterSoccerEscudo size={36} />
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight">
                    Documento de Impressão
                  </h3>
                  <p className="text-xs text-slate-500">{documentoImpressao.titulo}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setDocumentoImpressao(null);
                  setErroShareDoc(null);
                  setArquivoProntoDoc(null);
                }}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Conteúdo Imprimível */}
            <div
              ref={documentoRef}
              id="printable-document"
              style={{ backgroundColor: '#ffffff', color: '#0f172a' }}
              className="p-6 sm:p-8 overflow-y-auto space-y-6 flex-1 bg-white text-slate-900"
            >
              {/* Cabeçalho Oficial do Documento */}
              <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4">
                <div className="flex items-center gap-3">
                  <MasterSoccerEscudo size={48} />
                  <div>
                    <h2 className="text-xl font-black text-slate-950 uppercase tracking-tight">
                      MASTER SOCCER RJ
                    </h2>
                    <p className="text-xs text-slate-600 font-semibold">
                      Categorias de Base · Relatório Técnico Oficial
                    </p>
                  </div>
                </div>
                <div className="text-right text-xs text-slate-500">
                  <div>Data de Emissão: {new Date().toLocaleDateString('pt-BR')}</div>
                  <div className="font-bold text-slate-700">Sistema Base FC</div>
                </div>
              </div>

              {/* Título do Relatório */}
              <div>
                <h3 className="text-lg font-black text-slate-950 uppercase tracking-tight">
                  {documentoImpressao.titulo}
                </h3>
                {documentoImpressao.subtitulo && (
                  <p className="text-xs font-bold text-slate-600 mt-0.5">
                    {documentoImpressao.subtitulo}
                  </p>
                )}
              </div>

              {/* Conteúdo Dinâmico */}
              {documentoImpressao.conteudoHtml}

              {/* Rodapé do Documento */}
              <div className="pt-8 border-t border-slate-300 text-[11px] text-slate-500 flex items-center justify-between">
                <span>Master Soccer RJ · Gestão e Monitoramento de Atletas</span>
                <span>Página 1 de 1</span>
              </div>
            </div>

            {/* Aviso de Compartilhamento (quando navegador não suporta ou precisa de 2º toque) */}
            {erroShareDoc && (
              <div className="no-print px-4 py-2.5 bg-amber-50 dark:bg-amber-950/60 border-t border-amber-200 dark:border-amber-800 flex items-center justify-between gap-2 text-xs text-amber-900 dark:text-amber-200 shrink-0">
                <div className="flex items-center gap-2 font-bold">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>{erroShareDoc}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setErroShareDoc(null)}
                  className="p-1 text-amber-700 hover:text-amber-950 dark:text-amber-300 cursor-pointer"
                  aria-label="Fechar aviso"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Rodapé com Botão Fechar, Compartilhar e Imprimir */}
            <div className="no-print p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2.5 bg-slate-50 dark:bg-slate-800/60 flex-wrap">
              <button
                type="button"
                onClick={() => {
                  setDocumentoImpressao(null);
                  setErroShareDoc(null);
                  setArquivoProntoDoc(null);
                }}
                className="px-4 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition cursor-pointer"
              >
                Fechar
              </button>

              <button
                type="button"
                disabled={compartilhando}
                onClick={handleCompartilharDocumento}
                className="px-5 py-2.5 rounded-xl text-xs font-black text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 shadow-md flex items-center gap-2 cursor-pointer transition disabled:opacity-50"
                style={{ backgroundColor: '#059669' }}
              >
                {compartilhando ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    <span>Gerando PDF...</span>
                  </>
                ) : arquivoProntoDoc ? (
                  <>
                    <Share2 className="w-4 h-4 text-white" />
                    <span>Abrir Compartilhar PDF</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-4 h-4 text-white" />
                    <span>Compartilhar</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                className="px-5 py-2.5 rounded-xl text-xs font-black text-white bg-blue-600 hover:bg-blue-700 active:scale-95 shadow-md flex items-center gap-2 cursor-pointer transition"
                style={{ backgroundColor: '#2563eb' }}
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir Agora</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
