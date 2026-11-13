import React, { useState, useEffect, useRef } from 'react';
import {
  Shield,
  Users,
  Award,
  Calendar,
  Plus,
  Download,
  Upload,
  RotateCcw,
  Menu,
  X,
  CheckCircle2,
  Settings,
  Smartphone,
  DollarSign,
  FileText,
  Activity,
  Trophy,
  ChevronRight,
  Flame,
} from 'lucide-react';
import {
  Atleta,
  AvaliacaoJogo,
  ItemCompeticaoTaxa,
  RegistroFinanceiroAtleta,
  JogoAgenda,
  TesteFisicoAtleta,
} from './types';
import { storageService, CATEGORIAS_PADRAO } from './services/storage';
import { firebaseService } from './services/firebase';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import { usePWAInstall } from './hooks/usePWAInstall';
import { PainelGeral } from './components/PainelGeral';
import { PlantelView } from './components/PlantelView';
import { GestaoAtletasView } from './components/GestaoAtletasView';
import { ComparativoView } from './components/ComparativoView';
import { FinanceiroView } from './components/FinanceiroView';
import { AgendaJogosView } from './components/AgendaJogosView';
import { JogoModal } from './components/JogoModal';
import { TesteFisicoView } from './components/TesteFisicoView';
import { AtletaModal } from './components/AtletaModal';
import { AvaliacaoModal } from './components/AvaliacaoModal';
import { GerenciarCategoriasModal } from './components/GerenciarCategoriasModal';
import { AbaTrofeus } from './components/AbaTrofeus';
import { ConfirmacaoApagarModal } from './components/ConfirmacaoApagarModal';
import { MasterSoccerEscudo } from './components/MasterSoccerEscudo';
import { CadastroPublicoAtletaView } from './components/CadastroPublicoAtletaView';

type AbaNavegacao =
  | 'painel'
  | 'jogo'
  | 'escalacao'
  | 'trofeus'
  | 'financeiro'
  | 'relatorio'
  | 'testefisico'
  | 'atletas';

const getChaveScrollAba = (aba: AbaNavegacao): string => {
  switch (aba) {
    case 'painel':
      return 'scroll_PAINEL';
    case 'jogo':
      return 'scroll_JOGO';
    case 'escalacao':
      return 'scroll_ESCALAÇÃO';
    case 'trofeus':
      return 'scroll_TROFÉUS';
    case 'financeiro':
      return 'scroll_FINANCEIRO';
    case 'relatorio':
      return 'scroll_RELATÓRIO';
    case 'testefisico':
      return 'scroll_TESTEFISICO';
    case 'atletas':
      return 'scroll_ATLETAS';
    default:
      return `scroll_${String(aba).toUpperCase()}`;
  }
};

export default function App() {
  const isOnline = useOnlineStatus();
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const isRotaCadastroPublico =
    typeof window !== 'undefined' &&
    (window.location.pathname.toLowerCase().replace(/\/+$/, '') === '/cadastro-atleta' ||
      window.location.hash.toLowerCase().startsWith('#/cadastro-atleta') ||
      new URLSearchParams(window.location.search).get('cadastro') === 'atleta');

  // Estados principais
  const [atletas, setAtletas] = useState<Atleta[]>([]);
  const [avaliacoes, setAvaliacoes] = useState<AvaliacaoJogo[]>([]);
  const [jogos, setJogos] = useState<JogoAgenda[]>(() => storageService.getJogosAgenda());
  const [testesFisicos, setTestesFisicos] = useState<TesteFisicoAtleta[]>(() =>
    storageService.getTestesFisicos()
  );
  const [categorias, setCategorias] = useState<string[]>(CATEGORIAS_PADRAO);

  // Navegação: Menu de Baixo (PAINEL, JOGO, ESCALAÇÃO, TROFÉUS) + Telas do Menu ☰ (Financeiro, Atletas, Teste Físico)
  const [abaAtiva, setAbaAtiva] = useState<AbaNavegacao>('painel');
  const [subAbaGestaoAtletas, setSubAbaGestaoAtletas] = useState<'lista' | 'cadastro'>('lista');
  const [categoriaAtiva, setCategoriaAtiva] = useState<string>('TODAS');
  const [jogoFocarInfo, setJogoFocarInfo] = useState<{
    jogoId?: string;
    categoria?: string;
    competicao?: string;
  } | null>(null);

  // Memória de rolagem independente por aba (sessionStorage + refs)
  const scrollTabsRef = useRef<Record<string, number>>({
    painel: Number(sessionStorage.getItem('scroll_PAINEL') || 0),
    jogo: Number(sessionStorage.getItem('scroll_JOGO') || 0),
    escalacao: Number(sessionStorage.getItem('scroll_ESCALAÇÃO') || 0),
    trofeus: Number(sessionStorage.getItem('scroll_TROFÉUS') || 0),
    financeiro: Number(sessionStorage.getItem('scroll_FINANCEIRO') || 0),
    relatorio: Number(sessionStorage.getItem('scroll_RELATÓRIO') || 0),
    testefisico: Number(sessionStorage.getItem('scroll_TESTEFISICO') || 0),
    atletas: Number(sessionStorage.getItem('scroll_ATLETAS') || 0),
  });
  const isRestoringScrollRef = useRef(false);
  const wrapperRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Módulo Financeiro
  const [competicoes, setCompeticoes] = useState<ItemCompeticaoTaxa[]>(() =>
    storageService.getCompeticoes()
  );
  const [registrosFinanceiros, setRegistrosFinanceiros] = useState<
    Record<string, RegistroFinanceiroAtleta>
  >(() => storageService.getRegistrosFinanceiros());

  // Modais e seleções
  const [atletaSelecionado, setAtletaSelecionado] = useState<Atleta | null>(null);
  const [isAtletaModalOpen, setIsAtletaModalOpen] = useState(false);
  const [atletaEditando, setAtletaEditando] = useState<Atleta | null>(null);

  const [isAvaliacaoModalOpen, setIsAvaliacaoModalOpen] = useState(false);
  const [avaliacaoEditando, setAvaliacaoEditando] = useState<AvaliacaoJogo | null>(null);
  const [atletaPreSelecionadoId, setAtletaPreSelecionadoId] = useState<string | undefined>();

  const [isJogoModalOpen, setIsJogoModalOpen] = useState(false);
  const [jogoEditando, setJogoEditando] = useState<JogoAgenda | null>(null);
  const [jogoSelecionadoParaEscalacaoId, setJogoSelecionadoParaEscalacaoId] = useState<string | undefined>();

  const [isCategoriasModalOpen, setIsCategoriasModalOpen] = useState(false);
  const [isInstalarModalOpen, setIsInstalarModalOpen] = useState(false);
  const [menuDrawerOpen, setMenuDrawerOpen] = useState(false);
  const [toastMensagem, setToastMensagem] = useState<string | null>(null);

  // Modal de Confirmação de Apagar (SIM / NÃO, sem digitação)
  const [itemParaExcluir, setItemParaExcluir] = useState<{
    tipo: 'atleta' | 'avaliacao' | 'jogo' | 'testefisico';
    id: string;
    nome?: string;
    titulo?: string;
    mensagem?: string;
    textoConfirmar?: string;
    textoCancelar?: string;
  } | null>(null);
  const [excluindoCarregando, setExcluindoCarregando] = useState(false);

  // Sincronização em tempo real via onSnapshot do Firestore
  useEffect(() => {
    if (isRotaCadastroPublico) return;
    // 1. Atletas e Avaliações
    const unsubDados = firebaseService.observarDados(
      (novosAtletas) => {
        setAtletas(novosAtletas);
        storageService.salvarAtletas(novosAtletas);
      },
      (novasAvaliacoes) => {
        setAvaliacoes(novasAvaliacoes);
        storageService.salvarAvaliacoes(novasAvaliacoes);
      }
    );

    // 2. Financeiro
    const unsubFinanceiro = firebaseService.observarFinanceiro(
      (novasComps) => {
        if (novasComps && novasComps.length > 0) {
          setCompeticoes(novasComps);
          storageService.salvarCompeticoes(novasComps);
        }
      },
      (novosRegistros) => {
        setRegistrosFinanceiros(novosRegistros);
        storageService.salvarRegistrosFinanceiros(novosRegistros);
      }
    );

    // 3. Jogos da Agenda
    const unsubJogos = firebaseService.observarJogos((novosJogos) => {
      if (novosJogos && novosJogos.length > 0) {
        setJogos(novosJogos);
        storageService.salvarJogosAgenda(novosJogos);
      }
    });

    // 4. Testes Físicos
    const unsubTestes = firebaseService.observarTestesFisicos((novosTestes) => {
      if (novosTestes && novosTestes.length > 0) {
        setTestesFisicos(novosTestes);
        storageService.salvarTestesFisicos(novosTestes);
      }
    });

    // Inicialização
    async function inicializarDadosNoFirestore() {
      try {
        const dadosRemotos = await firebaseService.buscarDados();
        if (dadosRemotos.atletas.length === 0) {
          const atlsLocais = storageService.getAtletas();
          for (const atl of atlsLocais) {
            await firebaseService.cadastrarAtleta(atl).catch(() => {});
          }
        }

        // Semeia jogos iniciais se necessário
        const jogosLocais = storageService.getJogosAgenda();
        for (const jg of jogosLocais) {
          await firebaseService.salvarJogo(jg).catch(() => {});
        }
      } catch (err) {
        console.warn('Conexão inicial com Firestore offline ou em segundo plano:', err);
      }
    }

    inicializarDadosNoFirestore();

    return () => {
      unsubDados();
      unsubFinanceiro();
      unsubJogos();
      unsubTestes();
    };
  }, []);

  const exibirToast = (msg: string) => {
    setToastMensagem(msg);
    setTimeout(() => setToastMensagem(null), 3500);
  };

  // Handlers para Atletas
  const handleSalvarAtleta = async (atleta: Atleta) => {
    try {
      if (atleta.id && !atleta.id.startsWith('temp-')) {
        await firebaseService.atualizarAtleta(atleta.id, atleta);
        const atualizados = atletas.map((a) => (a.id === atleta.id ? atleta : a));
        setAtletas(atualizados);
        storageService.salvarAtletas(atualizados);
      } else {
        const docId = await firebaseService.cadastrarAtleta(atleta);
        const novoAtleta = { ...atleta, id: docId || atleta.id || `atl-${Date.now()}` };
        const atualizados = [...atletas, novoAtleta];
        setAtletas(atualizados);
        storageService.salvarAtletas(atualizados);
      }
      if (atletaSelecionado && atletaSelecionado.id === atleta.id) {
        setAtletaSelecionado(atleta);
      }
      exibirToast(`Atleta ${atleta.nome.split(' ')[0]} salvo com sucesso!`);
    } catch (e: any) {
      console.error('Erro ao salvar atleta:', e);
      if (atleta.id) {
        const atualizados = atletas.map((a) => (a.id === atleta.id ? atleta : a));
        setAtletas(atualizados);
        storageService.salvarAtletas(atualizados);
      } else {
        const tempAtleta = { ...atleta, id: `atl-${Date.now()}` };
        const atualizados = [...atletas, tempAtleta];
        setAtletas(atualizados);
        storageService.salvarAtletas(atualizados);
      }
      exibirToast(`Atleta ${atleta.nome.split(' ')[0]} salvo localmente.`);
    }
  };

  const handleSalvarAtletasEmLote = async (novosAtletas: Atleta[]) => {
    try {
      const novosComId: Atleta[] = [];
      for (const atl of novosAtletas) {
        let atletaId = atl.id;
        try {
          atletaId = await firebaseService.cadastrarAtleta(atl);
        } catch (e) {
          console.warn('Fallback offline para atleta em lote:', e);
        }
        novosComId.push({
          ...atl,
          id: atletaId || `atl-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        });
      }
      const listaFinal = [...atletas, ...novosComId];
      setAtletas(listaFinal);
      storageService.salvarAtletas(listaFinal);
      exibirToast(`${novosAtletas.length} atletas cadastrados com sucesso!`);
    } catch (err: any) {
      console.error('Erro ao cadastrar atletas em lote:', err);
      exibirToast('Erro ao salvar lote de atletas.');
      throw err;
    }
  };

  const handleExcluirAtletaDireto = async (id: string) => {
    try {
      await firebaseService.excluirAtleta(id);
    } catch (e) {
      console.warn('Erro ao excluir do Firestore:', e);
    }
    const atualizados = atletas.filter((a) => a.id !== id);
    setAtletas(atualizados);
    storageService.salvarAtletas(atualizados);
    if (atletaSelecionado && atletaSelecionado.id === id) {
      setAtletaSelecionado(null);
    }
    exibirToast('Atleta removido com sucesso.');
  };

  const handleExcluirAtleta = (id: string) => {
    const atleta = atletas.find((a) => a.id === id);
    setItemParaExcluir({
      tipo: 'atleta',
      id,
      nome: atleta ? atleta.nome : undefined,
    });
  };

  const handleAbrirEditarAtleta = (atleta: Atleta) => {
    setAtletaEditando(atleta);
    setIsAtletaModalOpen(true);
  };

  const handleAbrirNovoAtleta = (subAba: 'lista' | 'cadastro' = 'lista') => {
    setSubAbaGestaoAtletas(subAba);
    mudarAbaComMemoriaScroll('atletas');
  };

  // Handlers para Gerenciamento de Categorias, Renomeação e Virada de Temporada
  const handleRenomearCategoria = async (
    antiga: string,
    nova: string,
    manterAntigaVazia: boolean = false
  ) => {
    try {
      const antigaUpper = antiga.trim().toUpperCase();
      const novaUpper = nova.trim().toUpperCase();
      if (!novaUpper || antigaUpper === novaUpper) return;

      // 1. Atualizar lista de categorias
      let novasCategorias: string[];
      if (categorias.includes(novaUpper)) {
        if (manterAntigaVazia) {
          novasCategorias = [...categorias];
        } else {
          novasCategorias = categorias.filter((c) => c !== antigaUpper);
        }
      } else {
        novasCategorias = categorias.map((c) => (c === antigaUpper ? novaUpper : c));
      }
      const catsUnicas = Array.from(new Set(novasCategorias));
      setCategorias(catsUnicas);
      storageService.salvarCategorias(catsUnicas);

      // 2. Atualizar todos os atletas que estavam na categoria antiga -> nova
      const atletasAfetados = atletas.filter(
        (a) => a.categoria?.trim().toUpperCase() === antigaUpper
      );
      if (atletasAfetados.length > 0) {
        const novosAtletas = atletas.map((a) =>
          a.categoria?.trim().toUpperCase() === antigaUpper ? { ...a, categoria: novaUpper } : a
        );
        setAtletas(novosAtletas);
        storageService.salvarAtletas(novosAtletas);

        for (const atl of atletasAfetados) {
          firebaseService.atualizarAtleta(atl.id, { categoria: novaUpper }).catch((err) => {
            console.warn('Erro ao atualizar categoria do atleta no Firestore:', err);
          });
        }
      }

      // 3. Atualizar jogos futuros (não realizados)
      const jogosAfetados = jogos.filter(
        (j) => !j.realizado && j.categoria?.trim().toUpperCase() === antigaUpper
      );
      if (jogosAfetados.length > 0) {
        const novosJogos = jogos.map((j) =>
          !j.realizado && j.categoria?.trim().toUpperCase() === antigaUpper
            ? { ...j, categoria: novaUpper }
            : j
        );
        setJogos(novosJogos);
        storageService.salvarJogosAgenda(novosJogos);

        for (const jg of jogosAfetados) {
          firebaseService.salvarJogo({ ...jg, categoria: novaUpper }).catch((err) => {
            console.warn('Erro ao atualizar categoria de jogo futuro:', err);
          });
        }
      }

      // 4. Se a categoria ativa filtrada for a antiga, atualizar
      if (categoriaAtiva === antigaUpper) {
        setCategoriaAtiva(novaUpper);
      }

      exibirToast(
        atletasAfetados.length > 0
          ? `Categoria alterada para ${novaUpper} (${atletasAfetados.length} atletas atualizados)!`
          : `Categoria renomeada para ${novaUpper} com sucesso!`
      );
    } catch (err: any) {
      console.error('Erro ao renomear categoria:', err);
      exibirToast('Erro ao renomear categoria.');
      throw err;
    }
  };

  const handleViradaDeAno = async (
    plano: { origem: string; destino: string; qtdAtletas: number }[]
  ) => {
    try {
      if (!plano || plano.length === 0) return;

      // 1. Monta mapa de migração (ex: SUB-17 -> SUB-20, SUB-16 -> SUB-17, SUB-15 -> SUB-16)
      const mapaMigracao: Record<string, string> = {};
      plano.forEach((p) => {
        mapaMigracao[p.origem.trim().toUpperCase()] = p.destino.trim().toUpperCase();
      });

      // 2. Atualiza lista de categorias: adiciona destinos superiores e mantém categorias originais
      const novasCatsSet = new Set(categorias);
      plano.forEach((p) => {
        novasCatsSet.add(p.destino.trim().toUpperCase());
        novasCatsSet.add(p.origem.trim().toUpperCase());
      });
      const novasCats = Array.from(novasCatsSet);
      setCategorias(novasCats);
      storageService.salvarCategorias(novasCats);

      // 3. Atualiza atletas (cada um sobe exatamente 1 categoria, sem salto duplo)
      const novosAtletas = atletas.map((a) => {
        const catOrig = a.categoria?.trim().toUpperCase();
        if (mapaMigracao[catOrig]) {
          return { ...a, categoria: mapaMigracao[catOrig] };
        }
        return a;
      });
      setAtletas(novosAtletas);
      storageService.salvarAtletas(novosAtletas);

      for (const atl of atletas) {
        const catOrig = atl.categoria?.trim().toUpperCase();
        const novaCat = mapaMigracao[catOrig];
        if (novaCat) {
          firebaseService.atualizarAtleta(atl.id, { categoria: novaCat }).catch((err) => {
            console.warn('Erro ao atualizar atleta no Firestore na virada de ano:', err);
          });
        }
      }

      // 4. Atualiza jogos futuros (não realizados)
      const novosJogos = jogos.map((j) => {
        if (!j.realizado) {
          const catOrig = j.categoria?.trim().toUpperCase();
          if (mapaMigracao[catOrig]) {
            return { ...j, categoria: mapaMigracao[catOrig] };
          }
        }
        return j;
      });
      setJogos(novosJogos);
      storageService.salvarJogosAgenda(novosJogos);

      for (const j of jogos) {
        if (!j.realizado) {
          const catOrig = j.categoria?.trim().toUpperCase();
          const novaCat = mapaMigracao[catOrig];
          if (novaCat) {
            firebaseService.salvarJogo({ ...j, categoria: novaCat }).catch(() => {});
          }
        }
      }

      exibirToast('Virada de ano aplicada com sucesso! Todos os atletas foram promovidos.');
    } catch (err: any) {
      console.error('Erro ao realizar virada de ano:', err);
      exibirToast('Erro ao realizar virada de ano.');
      throw err;
    }
  };

  const handleExcluirCategoriaComMigracao = async (
    catExcluir: string,
    catDestino: string
  ) => {
    try {
      const excluirUpper = catExcluir.trim().toUpperCase();
      const destinoUpper = catDestino.trim().toUpperCase();

      // 1. Move todos os atletas da categoria excluída para a categoria destino
      const afetados = atletas.filter(
        (a) => a.categoria?.trim().toUpperCase() === excluirUpper
      );
      if (afetados.length > 0) {
        const novosAtletas = atletas.map((a) =>
          a.categoria?.trim().toUpperCase() === excluirUpper
            ? { ...a, categoria: destinoUpper }
            : a
        );
        setAtletas(novosAtletas);
        storageService.salvarAtletas(novosAtletas);

        for (const atl of afetados) {
          firebaseService.atualizarAtleta(atl.id, { categoria: destinoUpper }).catch(() => {});
        }
      }

      // 2. Atualiza jogos futuros
      const jogosAfetados = jogos.filter(
        (j) => !j.realizado && j.categoria?.trim().toUpperCase() === excluirUpper
      );
      if (jogosAfetados.length > 0) {
        const novosJogos = jogos.map((j) =>
          !j.realizado && j.categoria?.trim().toUpperCase() === excluirUpper
            ? { ...j, categoria: destinoUpper }
            : j
        );
        setJogos(novosJogos);
        storageService.salvarJogosAgenda(novosJogos);

        for (const jg of jogosAfetados) {
          firebaseService.salvarJogo({ ...jg, categoria: destinoUpper }).catch(() => {});
        }
      }

      // 3. Remove a categoria da lista
      const novasCategorias = categorias.filter((c) => c !== excluirUpper);
      setCategorias(novasCategorias);
      storageService.salvarCategorias(novasCategorias);

      if (categoriaAtiva === excluirUpper) {
        setCategoriaAtiva(destinoUpper);
      }

      exibirToast(
        afetados.length > 0
          ? `${afetados.length} atleta(s) movidos para ${destinoUpper} e categoria ${excluirUpper} removida!`
          : `Categoria ${excluirUpper} removida com sucesso!`
      );
    } catch (err: any) {
      console.error('Erro ao excluir categoria com migração:', err);
      exibirToast('Erro ao excluir categoria.');
      throw err;
    }
  };

  // Handlers para Avaliações
  const handleSalvarAvaliacao = async (avaliacao: AvaliacaoJogo) => {
    storageService.salvarAvaliacao(avaliacao);
    setAvaliacoes(storageService.getAvaliacoes());

    const atleta = atletas.find((a) => a.id === atletaIdValido(avaliacao.atletaId));
    const nomeAtleta = atleta ? atleta.nome : '';

    try {
      await firebaseService.salvarAvaliacao(avaliacao, nomeAtleta);
      exibirToast(
        isOnline
          ? 'Avaliação salva e sincronizada com o Firebase!'
          : 'Avaliação salva offline no aparelho!'
      );
    } catch (e) {
      console.warn('Avaliação salva localmente:', e);
      exibirToast('Avaliação salva no aparelho.');
    }
  };

  const atletaIdValido = (id: string) => id;

  const handleExcluirAvaliacao = (id: string) => {
    const av = avaliacoes.find((a) => a.id === id);
    setItemParaExcluir({
      tipo: 'avaliacao',
      id,
      nome: av ? `Partida vs ${av.adversario} (${av.categoria})` : undefined,
    });
  };

  const handleExcluirAvaliacaoDireto = async (id: string) => {
    try {
      await firebaseService.excluirAvaliacao(id);
      storageService.excluirAvaliacao(id);
      setAvaliacoes(storageService.getAvaliacoes());
      exibirToast('Avaliação apagada com sucesso.');
    } catch (e: any) {
      console.error('Erro ao excluir avaliação:', e);
      storageService.excluirAvaliacao(id);
      setAvaliacoes(storageService.getAvaliacoes());
      exibirToast('Avaliação apagada localmente.');
    }
  };

  // Handlers para Jogos da Agenda
  const handleSalvarJogo = async (jogo: JogoAgenda) => {
    storageService.salvarJogoAgenda(jogo);
    setJogos(storageService.getJogosAgenda());

    try {
      await firebaseService.salvarJogo(jogo);
      exibirToast('Jogo salvo na agenda com sucesso!');
    } catch (e) {
      console.warn('Jogo salvo offline:', e);
      exibirToast('Jogo salvo na agenda (offline).');
    }
  };

  const handleAbrirNovoJogo = () => {
    setJogoEditando(null);
    setIsJogoModalOpen(true);
  };

  const handleAbrirEditarJogo = (jogo: JogoAgenda) => {
    setJogoEditando(jogo);
    setIsJogoModalOpen(true);
  };

  const handleExcluirJogo = (id: string, nome?: string) => {
    setItemParaExcluir({
      tipo: 'jogo',
      id,
      nome: nome || 'Jogo da Agenda',
      titulo: 'Excluir jogo?',
      mensagem: `Tem certeza que deseja excluir ${nome || 'este jogo'}? Essa ação apaga a escalação e as avaliações desse jogo e não pode ser desfeita.`,
      textoConfirmar: 'Excluir jogo',
      textoCancelar: 'Cancelar',
    });
  };

  // Handlers para Testes Físicos
  const handleSalvarTesteFisico = async (teste: TesteFisicoAtleta) => {
    storageService.salvarTesteFisico(teste);
    setTestesFisicos(storageService.getTestesFisicos());

    try {
      await firebaseService.salvarTesteFisico(teste);
      exibirToast('Teste físico salvo com sucesso!');
    } catch (e) {
      console.warn('Teste salvo offline:', e);
      exibirToast('Teste físico salvo no aparelho.');
    }
  };

  const handleExcluirTesteFisico = (id: string) => {
    setItemParaExcluir({
      tipo: 'testefisico',
      id,
      nome: 'Teste Físico',
    });
  };

  // Confirmação de Exclusão (SIM / NÃO)
  const handleConfirmarExclusao = async () => {
    if (!itemParaExcluir) return;
    setExcluindoCarregando(true);

    try {
      if (itemParaExcluir.tipo === 'atleta') {
        await firebaseService.excluirAtleta(itemParaExcluir.id);
        storageService.excluirAtleta(itemParaExcluir.id);
        setAvaliacoes(storageService.getAvaliacoes());
        if (atletaSelecionado && atletaSelecionado.id === itemParaExcluir.id) {
          setAtletaSelecionado(null);
        }
        exibirToast('Atleta e suas avaliações foram apagados com sucesso.');
      } else if (itemParaExcluir.tipo === 'avaliacao') {
        await firebaseService.excluirAvaliacao(itemParaExcluir.id);
        storageService.excluirAvaliacao(itemParaExcluir.id);
        setAvaliacoes(storageService.getAvaliacoes());
        exibirToast('Avaliação apagada com sucesso.');
      } else if (itemParaExcluir.tipo === 'jogo') {
        await firebaseService.excluirJogo(itemParaExcluir.id);
        storageService.excluirJogoAgenda(itemParaExcluir.id);
        setJogos(storageService.getJogosAgenda());
        setAvaliacoes(storageService.getAvaliacoes());
        exibirToast('Jogo, escalação e avaliações foram excluídos com sucesso.');
      } else if (itemParaExcluir.tipo === 'testefisico') {
        await firebaseService.excluirTesteFisico(itemParaExcluir.id);
        storageService.excluirTesteFisico(itemParaExcluir.id);
        setTestesFisicos(storageService.getTestesFisicos());
        exibirToast('Teste físico apagado.');
      }
    } catch (e: any) {
      console.error('Erro ao excluir:', e);
      alert(`Erro ao apagar: ${e?.message || e}`);
    } finally {
      setExcluindoCarregando(false);
      setItemParaExcluir(null);
    }
  };

  // Instalação do PWA
  const handleInstalarApp = async () => {
    if (isInstallable) {
      const instalado = await install();
      if (instalado) {
        exibirToast('Master Soccer RJ instalado com sucesso!');
      }
    } else if (isInstalled) {
      exibirToast('O aplicativo Master Soccer RJ já está instalado no seu dispositivo.');
    } else {
      setIsInstalarModalOpen(true);
    }
  };

  // Monitorar e salvar posição de rolagem contínua da aba atual
  useEffect(() => {
    const onScroll = () => {
      if (isRestoringScrollRef.current) return;
      const y = window.scrollY || document.documentElement.scrollTop || 0;
      const chave = getChaveScrollAba(abaAtiva);
      try {
        sessionStorage.setItem(chave, String(y));
      } catch {}
      scrollTabsRef.current[abaAtiva] = y;
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [abaAtiva]);

  // Transição de aba com memória de rolagem (sem window.scrollTo(0, 0))
  const mudarAbaComMemoriaScroll = (novaAba: AbaNavegacao) => {
    if (novaAba === abaAtiva) return;

    // 1. Salvar rolagem da aba atual que está saindo
    const currentY = window.scrollY || document.documentElement.scrollTop || 0;
    const chaveAtual = getChaveScrollAba(abaAtiva);
    try {
      sessionStorage.setItem(chaveAtual, String(currentY));
    } catch {}
    scrollTabsRef.current[abaAtiva] = currentY;

    // 2. Buscar posição salva da nova aba
    const chaveNova = getChaveScrollAba(novaAba);
    const savedYStr = sessionStorage.getItem(chaveNova);
    const targetY = savedYStr !== null ? Number(savedYStr) : (scrollTabsRef.current[novaAba] || 0);

    // Bloquear listener de scroll para evitar salvar 0 intermediário
    isRestoringScrollRef.current = true;

    // Garantir temporariamente minHeight se targetY for grande, para evitar corte antes de layout renderizado
    const targetWrapper = wrapperRefs.current[novaAba];
    if (targetWrapper && targetY > 0) {
      targetWrapper.style.minHeight = `${targetY + window.innerHeight + 100}px`;
    }

    setAbaAtiva(novaAba);

    // Restaurar a posição exata sem animação brusca
    requestAnimationFrame(() => {
      window.scrollTo({ top: targetY, left: 0, behavior: 'instant' as ScrollBehavior });
      if (targetWrapper) {
        targetWrapper.style.minHeight = '';
      }
      requestAnimationFrame(() => {
        window.scrollTo({ top: targetY, left: 0, behavior: 'instant' as ScrollBehavior });
        setTimeout(() => {
          isRestoringScrollRef.current = false;
        }, 50);
      });
    });
  };

  const handleNavegarJogoDoPainel = (jogoId?: string, categoria?: string, competicao?: string) => {
    if (jogoId || categoria || competicao) {
      setJogoFocarInfo({ jogoId, categoria, competicao });
    }
    mudarAbaComMemoriaScroll('jogo');
  };

  // Navegações
  const handleAbrirRelatorioAtleta = (atleta: Atleta) => {
    setAtletaSelecionado(atleta);
    setSubAbaGestaoAtletas('lista');
    mudarAbaComMemoriaScroll('atletas');
  };

  const handleNavegarPlantel = (categoria?: string) => {
    if (categoria) setCategoriaAtiva(categoria);
    mudarAbaComMemoriaScroll('escalacao');
  };

  const handleNavegarMenuTopo = (aba: AbaNavegacao) => {
    setMenuDrawerOpen(false);
    mudarAbaComMemoriaScroll(aba);
  };

  if (isRotaCadastroPublico) {
    return <CadastroPublicoAtletaView categorias={categorias} />;
  }

  return (
    <div className="min-h-screen bg-slate-100/70 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans w-full max-w-[100vw] overflow-x-hidden box-border">
      {/* Toast Notification */}
      {toastMensagem && (
        <div className="fixed bottom-24 sm:bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xl border border-slate-700 dark:border-slate-200 text-xs font-semibold animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-amber-400 dark:text-amber-500 shrink-0" />
          <span>{toastMensagem}</span>
        </div>
      )}

      {/* ========================================================= */}
      {/* MENU DE CIMA - SÓ OS 3 RISQUINHOS ☰ NO CANTO DIREITO */}
      {/* ========================================================= */}
      {/* ========================================================= */}
      {/* MENU DE CIMA - FININHO, COLADO NO TOPO */}
      {/* ========================================================= */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/90 dark:border-slate-800 shadow-2xs no-print w-full max-w-[100vw] overflow-x-hidden box-border">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-12 flex items-center justify-between gap-2.5 w-full max-w-full box-border">
          {/* Logo & Marca Master Soccer */}
          <div
            onClick={() => mudarAbaComMemoriaScroll('painel')}
            className="flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0 group select-none"
          >
            <MasterSoccerEscudo
              size={28}
              className="group-hover:scale-105 transition-transform drop-shadow-2xs shrink-0"
            />
            <div className="flex items-center gap-1.5">
              <span className="text-sm sm:text-base font-black tracking-tight text-slate-900 dark:text-white">
                Master <span className="text-blue-600 dark:text-blue-400">Soccer</span>
              </span>
              <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300/60 leading-tight">
                RJ
              </span>
              <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 hidden sm:inline">
                · Base Sub-15 · 16 · 17
              </span>
            </div>
          </div>

          {/* Zona Direita: Selo de Conexão + Botão Instalar + ☰ */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Selinho ONLINE / OFFLINE */}
            {isOnline ? (
              <span
                title="Conectado à internet. Sincronização em tempo real ativa."
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 shrink-0 shadow-2xs"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                ONLINE
              </span>
            ) : (
              <span
                title="Sem conexão. Modo offline com persistência IndexedDB."
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-orange-100 text-orange-800 dark:bg-orange-950/80 dark:text-orange-300 border border-orange-300 shrink-0 animate-pulse shadow-2xs"
              >
                <span className="w-2 h-2 rounded-full bg-orange-500 shrink-0" />
                OFFLINE
              </span>
            )}

            {/* Botão Instalar App */}
            {!isInstalled && isInstallable && (
              <button
                onClick={handleInstalarApp}
                className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 rounded-lg border border-emerald-300 transition-all shadow-xs shrink-0"
              >
                <Download className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Instalar</span>
              </button>
            )}

            {/* BOTÃO DOS 3 RISQUINHOS ☰ NO CANTO DIREITO */}
            <button
              onClick={() => setMenuDrawerOpen(!menuDrawerOpen)}
              className="h-8 w-8 sm:h-9 sm:w-9 flex items-center justify-center rounded-xl text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all border border-slate-200/90 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-2xs focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-blue-500 shrink-0 active:scale-95 cursor-pointer"
              aria-label="Abrir menu de opções"
              title="Menu: Financeiro, Histórico / Relatório e Teste Físico"
            >
              <Menu className="w-4 h-4 sm:w-5 sm:h-5 text-slate-800 dark:text-white" />
            </button>
          </div>
        </div>
      </header>

      {/* ========================================================= */}
      {/* DRAWER / MENU FLUTUANTE ABERTO PELOS 3 RISQUINHOS ☰ */}
      {/* Contém: Financeiro, Histórico / Relatório, Teste Físico */}
      {/* ========================================================= */}
      {menuDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end no-print animate-in fade-in duration-150">
          {/* Backdrop */}
          <div
            onClick={() => setMenuDrawerOpen(false)}
            className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs transition-opacity"
          />

          {/* Painel Lateral */}
          <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 h-full shadow-2xl border-l-2 border-slate-200 dark:border-slate-800 p-6 flex flex-col justify-between z-10 animate-in slide-in-from-right duration-200">
            <div>
              {/* Topo do Menu ☰ */}
              <div className="flex items-center justify-between pb-5 border-b-2 border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <MasterSoccerEscudo size={38} />
                  <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white">
                      Menu Master Soccer
                    </h3>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Opções & Gestão Integrada</p>
                  </div>
                </div>
                <button
                  onClick={() => setMenuDrawerOpen(false)}
                  className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Itens do Menu Solicitados: Cadastrar Atleta, Financeiro, Histórico / Relatório, Teste Físico */}
              <div className="py-5 space-y-2.5">
                {/* 0. Cadastrar Atleta */}
                <button
                  onClick={() => {
                    setMenuDrawerOpen(false);
                    handleAbrirNovoAtleta('lista');
                  }}
                  className={`w-full flex items-center justify-between p-4 rounded-2xl text-left transition-all border-2 active:scale-98 ${
                    abaAtiva === 'atletas'
                      ? 'bg-emerald-600 text-white font-extrabold border-emerald-600 shadow-md'
                      : 'hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-slate-900 dark:text-slate-100 font-bold border-emerald-300 dark:border-emerald-700 bg-emerald-50/60 dark:bg-emerald-950/20'
                  }`}
                  style={abaAtiva === 'atletas' ? { backgroundColor: '#059669', color: '#ffffff' } : {}}
                >
                  <div className="flex items-center gap-3.5">
                    <div
                      className={`p-2.5 rounded-xl ${
                        abaAtiva === 'atletas'
                          ? 'bg-emerald-700 text-white'
                          : 'bg-emerald-500 text-white shadow-xs'
                      }`}
                    >
                      <Plus className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="text-base font-extrabold">
                        Cadastrar Atleta
                      </div>
                      <div
                        className={`text-xs font-medium ${
                          abaAtiva === 'atletas' ? 'text-emerald-100' : 'text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        Lista de Atletas & Cadastro por Lote
                      </div>
                    </div>
                  </div>
                  <ChevronRight
                    className={`w-5 h-5 ${abaAtiva === 'atletas' ? 'text-white' : 'text-emerald-600'}`}
                  />
                </button>

                {/* 1. Financeiro */}
                <button
                  onClick={() => handleNavegarMenuTopo('financeiro')}
                  className={`w-full flex items-center justify-between p-4 rounded-2xl text-left transition-all border-2 active:scale-98 ${
                    abaAtiva === 'financeiro'
                      ? 'bg-blue-600 text-white font-extrabold border-blue-600 shadow-md'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold border-slate-200/80 dark:border-slate-800'
                  }`}
                  style={abaAtiva === 'financeiro' ? { backgroundColor: '#2563eb', color: '#ffffff' } : {}}
                >
                  <div className="flex items-center gap-3.5">
                    <div
                      className={`p-2.5 rounded-xl ${
                        abaAtiva === 'financeiro'
                          ? 'bg-blue-700 text-white'
                          : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600'
                      }`}
                    >
                      <DollarSign className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-base font-extrabold">Financeiro</div>
                      <div
                        className={`text-xs font-medium ${
                          abaAtiva === 'financeiro' ? 'text-blue-100' : 'text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        Mensalidades & Competições
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 opacity-70" />
                </button>

                {/* 2. Histórico / Relatório */}
                <button
                  onClick={() => {
                    setMenuDrawerOpen(false);
                    handleAbrirNovoAtleta('lista');
                  }}
                  className={`w-full flex items-center justify-between p-4 rounded-2xl text-left transition-all border-2 active:scale-98 ${
                    abaAtiva === 'relatorio'
                      ? 'bg-blue-600 text-white font-extrabold border-blue-600 shadow-md'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold border-slate-200/80 dark:border-slate-800'
                  }`}
                  style={abaAtiva === 'relatorio' ? { backgroundColor: '#2563eb', color: '#ffffff' } : {}}
                >
                  <div className="flex items-center gap-3.5">
                    <div
                      className={`p-2.5 rounded-xl ${
                        abaAtiva === 'relatorio'
                          ? 'bg-blue-700 text-white'
                          : 'bg-blue-50 dark:bg-blue-950/60 text-blue-600'
                      }`}
                    >
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-base font-extrabold">Histórico / Relatório</div>
                      <div
                        className={`text-xs font-medium ${
                          abaAtiva === 'relatorio' ? 'text-blue-100' : 'text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        Ficha do Atleta com estatísticas e jogos
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 opacity-70" />
                </button>

                {/* 3. Teste Físico */}
                <button
                  onClick={() => handleNavegarMenuTopo('testefisico')}
                  className={`w-full flex items-center justify-between p-4 rounded-2xl text-left transition-all border-2 active:scale-98 ${
                    abaAtiva === 'testefisico'
                      ? 'bg-blue-600 text-white font-extrabold border-blue-600 shadow-md'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold border-slate-200/80 dark:border-slate-800'
                  }`}
                  style={abaAtiva === 'testefisico' ? { backgroundColor: '#2563eb', color: '#ffffff' } : {}}
                >
                  <div className="flex items-center gap-3.5">
                    <div
                      className={`p-2.5 rounded-xl ${
                        abaAtiva === 'testefisico'
                          ? 'bg-blue-700 text-white'
                          : 'bg-amber-50 dark:bg-amber-950/60 text-amber-600'
                      }`}
                    >
                      <Activity className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-base font-extrabold">Teste Físico</div>
                      <div
                        className={`text-xs font-medium ${
                          abaAtiva === 'testefisico' ? 'text-blue-100' : 'text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        Velocidade, salto, Yo-Yo & flexibilidade
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 opacity-70" />
                </button>
              </div>
            </div>

            {/* Rodapé do Menu Drawer */}
            <div className="pt-4 border-t-2 border-slate-100 dark:border-slate-800 space-y-2">
              <button
                onClick={() => {
                  setIsCategoriasModalOpen(true);
                  setMenuDrawerOpen(false);
                }}
                className="w-full text-left px-3.5 py-2.5 text-sm font-bold text-slate-700 dark:text-slate-300 hover:text-blue-600 hover:bg-slate-50 dark:hover:bg-slate-800/60 rounded-xl flex items-center gap-2.5 transition"
              >
                <Settings className="w-4 h-4 text-slate-500" />
                <span>Gerenciar Categorias</span>
              </button>

              <button
                onClick={handleInstalarApp}
                className="w-full text-left px-3.5 py-2.5 text-sm font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-xl flex items-center gap-2.5 transition"
              >
                <Download className="w-4 h-4" />
                <span>Instalar Aplicativo (PWA)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* CONTEÚDO PRINCIPAL (COM PADDING-BOTTOM DE 96px) */}
      {/* ========================================================= */}
      <main
        className={`flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 pb-24 max-w-[100vw] overflow-x-hidden box-border ${
          abaAtiva === 'escalacao' ? 'pt-1.5 sm:pt-2' : 'py-3 sm:py-6'
        }`}
      >
        {/* ABA 1: PAINEL (Visão Geral de agora) */}
        <div
          ref={(el) => {
            wrapperRefs.current['painel'] = el;
          }}
          style={{ display: abaAtiva === 'painel' ? 'block' : 'none' }}
        >
          <PainelGeral
            atletas={atletas}
            avaliacoes={avaliacoes}
            categorias={categorias}
            jogos={jogos}
            onNavegarPlantel={handleNavegarPlantel}
            onSelecionarAtleta={handleAbrirRelatorioAtleta}
            onNavegarJogo={handleNavegarJogoDoPainel}
            onNovaAvaliacao={() => {
              handleAbrirNovoJogo();
              mudarAbaComMemoriaScroll('jogo');
            }}
            onNovoAtleta={handleAbrirNovoAtleta}
          />
        </div>

        {/* ABA 2: JOGO (Agenda de Jogos com avaliação dentro do jogo) */}
        <div
          ref={(el) => {
            wrapperRefs.current['jogo'] = el;
          }}
          style={{ display: abaAtiva === 'jogo' ? 'block' : 'none' }}
        >
          <AgendaJogosView
            jogos={jogos}
            atletas={atletas}
            avaliacoes={avaliacoes}
            categorias={categorias}
            jogoFocarInfo={jogoFocarInfo}
            onLimparJogoFocar={() => setJogoFocarInfo(null)}
            onNovoJogo={handleAbrirNovoJogo}
            onEditarJogo={handleAbrirEditarJogo}
            onExcluirJogo={handleExcluirJogo}
            onExcluirAvaliacao={handleExcluirAvaliacaoDireto}
            onSalvarAvaliacao={handleSalvarAvaliacao}
            onSelecionarAtleta={handleAbrirRelatorioAtleta}
            onNavegarEscalacao={(jogoId) => {
              setJogoSelecionadoParaEscalacaoId(jogoId);
              mudarAbaComMemoriaScroll('escalacao');
            }}
          />
        </div>

        {/* ABA 3: ESCALAÇÃO (onde monta o time / convocação do jogo) */}
        <div
          ref={(el) => {
            wrapperRefs.current['escalacao'] = el;
          }}
          style={{ display: abaAtiva === 'escalacao' ? 'block' : 'none' }}
        >
          <PlantelView
            key={jogoSelecionadoParaEscalacaoId || 'plantel-view'}
            atletas={atletas}
            avaliacoes={avaliacoes}
            categorias={categorias}
            categoriaSelecionada={categoriaAtiva}
            onSelecionarCategoria={setCategoriaAtiva}
            onSelecionarAtleta={handleAbrirRelatorioAtleta}
            onEditarAtleta={handleAbrirEditarAtleta}
            onExcluirAtleta={handleExcluirAtleta}
            jogos={jogos}
            onSalvarJogo={handleSalvarJogo}
            jogoSelecionadoId={jogoSelecionadoParaEscalacaoId}
            onSelecionarJogoId={setJogoSelecionadoParaEscalacaoId}
            onVoltarParaAgenda={() => mudarAbaComMemoriaScroll('jogo')}
          />
        </div>

        {/* ABA 4: TROFÉUS */}
        <div
          ref={(el) => {
            wrapperRefs.current['trofeus'] = el;
          }}
          style={{ display: abaAtiva === 'trofeus' ? 'block' : 'none' }}
        >
          <AbaTrofeus />
        </div>

        {/* TELAS DO MENU ☰ */}
        <div
          ref={(el) => {
            wrapperRefs.current['financeiro'] = el;
          }}
          style={{ display: abaAtiva === 'financeiro' ? 'block' : 'none' }}
        >
          <FinanceiroView
            atletas={atletas}
            categorias={categorias}
            competicoes={competicoes}
            registrosFinanceiros={registrosFinanceiros}
            onAtualizarCompeticoes={(novas) => setCompeticoes(novas)}
            onAtualizarRegistro={(novoReg) =>
              setRegistrosFinanceiros((prev) => ({
                ...prev,
                [novoReg.atletaId]: novoReg,
              }))
            }
            onExibirToast={exibirToast}
          />
        </div>

        {/* ABA: GESTÃO DE ATLETAS (LISTA DE ATLETAS + CADASTRAR NOVO ATLETA / LOTE) */}
        <div
          ref={(el) => {
            wrapperRefs.current['atletas'] = el;
            wrapperRefs.current['relatorio'] = el;
          }}
          style={{ display: abaAtiva === 'atletas' || abaAtiva === 'relatorio' ? 'block' : 'none' }}
        >
          <GestaoAtletasView
            atletas={atletas}
            avaliacoes={avaliacoes}
            categorias={categorias}
            subAbaInicial={subAbaGestaoAtletas}
            onSalvarAtleta={handleSalvarAtleta}
            onSalvarAtletasEmLote={handleSalvarAtletasEmLote}
            onExcluirAtleta={handleExcluirAtletaDireto}
            onVoltarParaPainel={() => mudarAbaComMemoriaScroll('painel')}
          />
        </div>

        <div
          ref={(el) => {
            wrapperRefs.current['testefisico'] = el;
          }}
          style={{ display: abaAtiva === 'testefisico' ? 'block' : 'none' }}
        >
          <TesteFisicoView
            atletas={atletas}
            testesFisicos={testesFisicos}
            categorias={categorias}
            onSalvarTeste={handleSalvarTesteFisico}
            onExcluirTeste={handleExcluirTesteFisico}
          />
        </div>
      </main>

      {/* ========================================================= */}
      {/* 1. MENU DE BAIXO: */}
      {/* PAINEL (Visão Geral) - JOGO - ESCALAÇÃO - TROFÉUS */}
      {/* Quando clicar, fica azul #2563eb */}
      {/* ========================================================= */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t-2 border-slate-200/90 dark:border-slate-800 shadow-xl no-print w-full max-w-[100vw] overflow-x-hidden box-border">
        <div className="max-w-md mx-auto grid grid-cols-4 items-center h-20 px-2">
          {/* 1. PAINEL */}
          <button
            onClick={() => mudarAbaComMemoriaScroll('painel')}
            className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-2xl transition-all ${
              abaAtiva === 'painel'
                ? 'font-black bg-blue-50/90 dark:bg-blue-950/50 shadow-2xs'
                : 'text-slate-500 dark:text-slate-400 font-bold hover:text-slate-800 dark:hover:text-slate-200'
            }`}
            style={abaAtiva === 'painel' ? { color: '#2563eb' } : {}}
          >
            <Shield className="w-6 h-6 mb-1 drop-shadow-2xs" />
            <span className="text-xs tracking-tight uppercase font-black">PAINEL</span>
          </button>

          {/* 2. JOGO */}
          <button
            onClick={() => mudarAbaComMemoriaScroll('jogo')}
            className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-2xl transition-all ${
              abaAtiva === 'jogo'
                ? 'font-black bg-blue-50/90 dark:bg-blue-950/50 shadow-2xs'
                : 'text-slate-500 dark:text-slate-400 font-bold hover:text-slate-800 dark:hover:text-slate-200'
            }`}
            style={abaAtiva === 'jogo' ? { color: '#2563eb' } : {}}
          >
            <Calendar className="w-6 h-6 mb-1 drop-shadow-2xs" />
            <span className="text-xs tracking-tight uppercase font-black">JOGO</span>
          </button>

          {/* 3. ESCALAÇÃO */}
          <button
            onClick={() => mudarAbaComMemoriaScroll('escalacao')}
            className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-2xl transition-all ${
              abaAtiva === 'escalacao'
                ? 'font-black bg-blue-50/90 dark:bg-blue-950/50 shadow-2xs'
                : 'text-slate-500 dark:text-slate-400 font-bold hover:text-slate-800 dark:hover:text-slate-200'
            }`}
            style={abaAtiva === 'escalacao' ? { color: '#2563eb' } : {}}
          >
            <Users className="w-6 h-6 mb-1 drop-shadow-2xs" />
            <span className="text-xs tracking-tight uppercase font-black">ESCALAÇÃO</span>
          </button>

          {/* 4. TROFÉUS */}
          <button
            onClick={() => mudarAbaComMemoriaScroll('trofeus')}
            className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-2xl transition-all ${
              abaAtiva === 'trofeus'
                ? 'font-black bg-blue-50/90 dark:bg-blue-950/50 shadow-2xs'
                : 'text-slate-500 dark:text-slate-400 font-bold hover:text-slate-800 dark:hover:text-slate-200'
            }`}
            style={abaAtiva === 'trofeus' ? { color: '#2563eb' } : {}}
          >
            <Trophy className="w-6 h-6 mb-1 drop-shadow-2xs" />
            <span className="text-xs tracking-tight uppercase font-black">TROFÉUS</span>
          </button>
        </div>
      </nav>

      {/* ========================================================= */}
      {/* MODAIS DO SISTEMA */}
      {/* ========================================================= */}
      {/* Modal de Cadastro/Edição de Jogo da Agenda */}
      <JogoModal
        isOpen={isJogoModalOpen}
        onClose={() => setIsJogoModalOpen(false)}
        onSave={handleSalvarJogo}
        jogoEditando={jogoEditando}
        categoriasDisponiveis={categorias}
        categoriaPadrao={categoriaAtiva === 'TODAS' ? 'SUB-15' : categoriaAtiva}
      />

      {/* Modal de Atleta */}
      <AtletaModal
        isOpen={isAtletaModalOpen}
        onClose={() => setIsAtletaModalOpen(false)}
        onSave={handleSalvarAtleta}
        atletaEditando={atletaEditando}
        categoriasDisponiveis={categorias}
        categoriaPadrao={categoriaAtiva === 'TODAS' ? 'SUB-15' : categoriaAtiva}
      />

      {/* Modal de Avaliação Tradicional */}
      <AvaliacaoModal
        isOpen={isAvaliacaoModalOpen}
        onClose={() => setIsAvaliacaoModalOpen(false)}
        onSave={handleSalvarAvaliacao}
        avaliacaoEditando={avaliacaoEditando}
        atletas={atletas}
        atletaPreSelecionadoId={atletaPreSelecionadoId}
        categoriaAtiva={categoriaAtiva}
        categoriasDisponiveis={categorias}
      />

      {/* Modal de Categorias */}
      <GerenciarCategoriasModal
        isOpen={isCategoriasModalOpen}
        onClose={() => setIsCategoriasModalOpen(false)}
        categorias={categorias}
        atletas={atletas}
        jogos={jogos}
        onSalvarCategorias={(novas) => {
          storageService.salvarCategorias(novas);
          setCategorias(novas);
          exibirToast('Categorias atualizadas!');
        }}
        onRenomearCategoria={handleRenomearCategoria}
        onViradaDeAno={handleViradaDeAno}
        onExcluirCategoriaComMigracao={handleExcluirCategoriaComMigracao}
        onExibirToast={exibirToast}
      />

      {/* Modal de Confirmação de Apagar (SIM / NÃO) */}
      <ConfirmacaoApagarModal
        isOpen={!!itemParaExcluir}
        onClose={() => {
          if (!excluindoCarregando) setItemParaExcluir(null);
        }}
        onConfirm={handleConfirmarExclusao}
        titulo={
          itemParaExcluir?.titulo ||
          (itemParaExcluir?.tipo === 'atleta'
            ? 'Apagar Atleta'
            : itemParaExcluir?.tipo === 'jogo'
            ? 'Excluir jogo?'
            : itemParaExcluir?.tipo === 'testefisico'
            ? 'Apagar Teste Físico'
            : 'Apagar Avaliação')
        }
        mensagem={itemParaExcluir?.mensagem || 'Tem certeza que deseja apagar?'}
        detalhes={itemParaExcluir?.tipo === 'jogo' ? undefined : itemParaExcluir?.nome}
        subtexto={itemParaExcluir?.tipo === 'jogo' ? '' : 'Esta ação não poderá ser desfeita.'}
        textoConfirmar={itemParaExcluir?.textoConfirmar || 'SIM'}
        textoCancelar={itemParaExcluir?.textoCancelar || 'NÃO'}
        carregando={excluindoCarregando}
      />

      {/* Modal de Instalação do App (PWA) */}
      {isInstalarModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200 no-print">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 relative">
            <button
              onClick={() => setIsInstalarModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center p-2 text-white shadow-md">
                <MasterSoccerEscudo size={36} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Instalar Master Soccer RJ
                </h3>
                <p className="text-xs text-slate-500">
                  Acesso rápido direto da tela inicial, funciona 100% offline
                </p>
              </div>
            </div>

            <div className="space-y-3 my-4 text-xs text-slate-600 dark:text-slate-300">
              {isIOS ? (
                <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-2">
                  <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    Como instalar no iPhone ou iPad (Safari):
                  </div>
                  <ol className="list-decimal list-inside space-y-1.5 pl-1">
                    <li>Toque no botão <strong>Compartilhar</strong> (ícone do quadrado com seta para cima) no Safari.</li>
                    <li>Role para baixo e toque em <strong>Adicionar à Tela de Início</strong>.</li>
                    <li>Toque em <strong>Adicionar</strong> no topo direito.</li>
                  </ol>
                </div>
              ) : (
                <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-2">
                  <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    Como instalar no seu celular ou computador:
                  </div>
                  <ul className="space-y-1.5 pl-1">
                    <li>
                      <strong>Android (Chrome):</strong> Toque no menu (3 pontinhos) e escolha <strong>"Adicionar à tela inicial"</strong> ou <strong>"Instalar aplicativo"</strong>.
                    </li>
                    <li>
                      <strong>Computador (Chrome/Edge):</strong> Clique no ícone de instalar (⭳) localizado no canto direito da barra de endereços do navegador.
                    </li>
                  </ul>
                </div>
              )}
            </div>

            <button
              onClick={() => setIsInstalarModalOpen(false)}
              className="w-full mt-2 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition shadow-sm"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
