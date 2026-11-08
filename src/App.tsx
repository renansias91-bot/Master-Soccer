import React, { useState, useEffect } from 'react';
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
import { RelatorioIndividual } from './components/RelatorioIndividual';
import { ComparativoView } from './components/ComparativoView';
import { FinanceiroView } from './components/FinanceiroView';
import { AgendaJogosView } from './components/AgendaJogosView';
import { JogoModal } from './components/JogoModal';
import { TesteFisicoView } from './components/TesteFisicoView';
import { AtletaModal } from './components/AtletaModal';
import { AvaliacaoModal } from './components/AvaliacaoModal';
import { GerenciarCategoriasModal } from './components/GerenciarCategoriasModal';
import { ConfirmacaoApagarModal } from './components/ConfirmacaoApagarModal';
import { MasterSoccerEscudo } from './components/MasterSoccerEscudo';

type AbaNavegacao =
  | 'painel'
  | 'jogo'
  | 'escalacao'
  | 'trofeus'
  | 'financeiro'
  | 'relatorio'
  | 'testefisico';

export default function App() {
  const isOnline = useOnlineStatus();
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();

  // Estados principais
  const [atletas, setAtletas] = useState<Atleta[]>([]);
  const [avaliacoes, setAvaliacoes] = useState<AvaliacaoJogo[]>([]);
  const [jogos, setJogos] = useState<JogoAgenda[]>(() => storageService.getJogosAgenda());
  const [testesFisicos, setTestesFisicos] = useState<TesteFisicoAtleta[]>(() =>
    storageService.getTestesFisicos()
  );
  const [categorias, setCategorias] = useState<string[]>(CATEGORIAS_PADRAO);

  // Navegação: Menu de Baixo (PAINEL, JOGO, ESCALAÇÃO, TROFÉUS) + Telas do Menu ☰ (Financeiro, Relatório, Teste Físico)
  const [abaAtiva, setAbaAtiva] = useState<AbaNavegacao>('painel');
  const [categoriaAtiva, setCategoriaAtiva] = useState<string>('TODAS');

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
      if (atletaEditando && atleta.id) {
        await firebaseService.atualizarAtleta(atleta.id, atleta);
      } else {
        await firebaseService.cadastrarAtleta(atleta);
      }
      if (atletaSelecionado && atletaSelecionado.id === atleta.id) {
        setAtletaSelecionado(atleta);
      }
      exibirToast(`Atleta ${atleta.nome.split(' ')[0]} salvo com sucesso no Firestore!`);
    } catch (e: any) {
      console.error('Erro ao salvar atleta no Firestore:', e);
      alert(e?.message || 'Erro ao salvar atleta no Firestore');
      throw e;
    }
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

  const handleAbrirNovoAtleta = () => {
    setAtletaEditando(null);
    setIsAtletaModalOpen(true);
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

  // Navegações
  const handleAbrirRelatorioAtleta = (atleta: Atleta) => {
    setAtletaSelecionado(atleta);
    setAbaAtiva('relatorio');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavegarPlantel = (categoria?: string) => {
    if (categoria) setCategoriaAtiva(categoria);
    setAbaAtiva('escalacao');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavegarMenuTopo = (aba: AbaNavegacao) => {
    setAbaAtiva(aba);
    setMenuDrawerOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 no-print w-full max-w-[100vw] overflow-x-hidden box-border">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-3 w-full max-w-full box-border">
          {/* Logo & Marca Master Soccer */}
          <div
            onClick={() => setAbaAtiva('painel')}
            className="flex items-center gap-2.5 cursor-pointer whitespace-nowrap shrink-0 group select-none"
          >
            <MasterSoccerEscudo
              size={40}
              className="group-hover:scale-105 transition-transform drop-shadow-xs shrink-0"
            />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white">
                  Master <span className="text-blue-600 dark:text-blue-400">Soccer</span>
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                  RJ
                </span>
              </div>
              <span className="text-[10px] font-medium text-slate-400">
                Base Sub-15 · Sub-16 · Sub-17
              </span>
            </div>
          </div>

          {/* Zona Direita: Selo de Conexão + Botão Instalar + OS 3 RISQUINHOS ☰ NO CANTO DIREITO */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Selinho ONLINE / OFFLINE */}
            {isOnline ? (
              <span
                title="Conectado à internet. Sincronização em tempo real ativa."
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 shrink-0"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                ONLINE
              </span>
            ) : (
              <span
                title="Sem conexão. Modo offline com persistência IndexedDB."
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-bold bg-orange-100 text-orange-800 dark:bg-orange-950/80 dark:text-orange-300 border border-orange-300 shrink-0 animate-pulse"
              >
                <span className="w-2 h-2 rounded-full bg-orange-500 shrink-0" />
                OFFLINE
              </span>
            )}

            {/* Botão Instalar App */}
            {!isInstalled && isInstallable && (
              <button
                onClick={handleInstalarApp}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 rounded-xl border border-emerald-300 transition-all shadow-xs shrink-0"
              >
                <Download className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Instalar App</span>
              </button>
            )}

            {/* BOTÃO DOS 3 RISQUINHOS ☰ NO CANTO DIREITO */}
            <button
              onClick={() => setMenuDrawerOpen(!menuDrawerOpen)}
              className="p-2.5 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-slate-200/80 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 shrink-0"
              aria-label="Abrir menu de opções"
              title="Menu: Financeiro, Histórico / Relatório e Teste Físico"
            >
              <Menu className="w-5 h-5 text-slate-800 dark:text-white" />
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
          <div className="relative w-full max-w-xs bg-white dark:bg-slate-900 h-full shadow-2xl border-l border-slate-200 dark:border-slate-800 p-6 flex flex-col justify-between z-10 animate-in slide-in-from-right duration-200">
            <div>
              {/* Topo do Menu ☰ */}
              <div className="flex items-center justify-between pb-5 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <MasterSoccerEscudo size={32} />
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                      Menu Master Soccer
                    </h3>
                    <p className="text-[11px] text-slate-400">Opções & Gestão Integrada</p>
                  </div>
                </div>
                <button
                  onClick={() => setMenuDrawerOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Itens do Menu Solicitados: Cadastrar Atleta, Financeiro, Histórico / Relatório, Teste Físico */}
              <div className="py-4 space-y-2">
                {/* 0. Cadastrar Atleta (conforme solicitado: só nos 3 risquinhos ☰ lá em cima) */}
                <button
                  onClick={() => {
                    setMenuDrawerOpen(false);
                    handleAbrirNovoAtleta();
                  }}
                  className="w-full flex items-center justify-between p-3.5 rounded-2xl text-left transition-all hover:bg-amber-100/70 dark:hover:bg-amber-950/40 text-slate-800 dark:text-slate-200 font-semibold border border-amber-300 dark:border-amber-800 bg-amber-50/80 dark:bg-amber-950/20"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-amber-400 text-slate-950 font-bold shadow-xs">
                      <Plus className="w-5 h-5 text-slate-950" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-900 dark:text-white">
                        + Cadastrar Atleta
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Adicionar novo atleta à base
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 opacity-70" />
                </button>

                {/* 1. Financeiro */}
                <button
                  onClick={() => handleNavegarMenuTopo('financeiro')}
                  className={`w-full flex items-center justify-between p-3.5 rounded-2xl text-left transition-all ${
                    abaAtiva === 'financeiro'
                      ? 'bg-blue-600 text-white font-bold shadow-md'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold'
                  }`}
                  style={abaAtiva === 'financeiro' ? { backgroundColor: '#2563eb', color: '#ffffff' } : {}}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-xl ${
                        abaAtiva === 'financeiro'
                          ? 'bg-blue-700 text-white'
                          : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600'
                      }`}
                    >
                      <DollarSign className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm">Financeiro</div>
                      <div
                        className={`text-[11px] ${
                          abaAtiva === 'financeiro' ? 'text-blue-200' : 'text-slate-400'
                        }`}
                      >
                        Mensalidades & Competições
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 opacity-70" />
                </button>

                {/* 2. Histórico / Relatório (que é a Ficha: João de agora) */}
                <button
                  onClick={() => handleNavegarMenuTopo('relatorio')}
                  className={`w-full flex items-center justify-between p-3.5 rounded-2xl text-left transition-all ${
                    abaAtiva === 'relatorio'
                      ? 'bg-blue-600 text-white font-bold shadow-md'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold'
                  }`}
                  style={abaAtiva === 'relatorio' ? { backgroundColor: '#2563eb', color: '#ffffff' } : {}}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-xl ${
                        abaAtiva === 'relatorio'
                          ? 'bg-blue-700 text-white'
                          : 'bg-blue-50 dark:bg-blue-950/60 text-blue-600'
                      }`}
                    >
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm">Histórico / Relatório</div>
                      <div
                        className={`text-[11px] ${
                          abaAtiva === 'relatorio' ? 'text-blue-200' : 'text-slate-400'
                        }`}
                      >
                        Ficha do Atleta com abas de jogos
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 opacity-70" />
                </button>

                {/* 3. Teste Físico */}
                <button
                  onClick={() => handleNavegarMenuTopo('testefisico')}
                  className={`w-full flex items-center justify-between p-3.5 rounded-2xl text-left transition-all ${
                    abaAtiva === 'testefisico'
                      ? 'bg-blue-600 text-white font-bold shadow-md'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold'
                  }`}
                  style={abaAtiva === 'testefisico' ? { backgroundColor: '#2563eb', color: '#ffffff' } : {}}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-xl ${
                        abaAtiva === 'testefisico'
                          ? 'bg-blue-700 text-white'
                          : 'bg-amber-50 dark:bg-amber-950/60 text-amber-600'
                      }`}
                    >
                      <Activity className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm">Teste Físico</div>
                      <div
                        className={`text-[11px] ${
                          abaAtiva === 'testefisico' ? 'text-blue-200' : 'text-slate-400'
                        }`}
                      >
                        Velocidade, salto, Yo-Yo & flexibilidade
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 opacity-70" />
                </button>
              </div>
            </div>

            {/* Rodapé do Menu Drawer */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <button
                onClick={() => {
                  setIsCategoriasModalOpen(true);
                  setMenuDrawerOpen(false);
                }}
                className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-blue-600 flex items-center gap-2"
              >
                <Settings className="w-4 h-4" />
                <span>Gerenciar Categorias</span>
              </button>

              <button
                onClick={handleInstalarApp}
                className="w-full text-left px-3 py-2 text-xs font-semibold text-emerald-600 hover:underline flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>Instalar Aplicativo (PWA)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* CONTEÚDO PRINCIPAL (COM PADDING-BOTTOM DE 120px) */}
      {/* ========================================================= */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 py-4 sm:py-8 pb-[120px] max-w-[100vw] overflow-x-hidden box-border">
        {/* ABA 1: PAINEL (Visão Geral de agora) */}
        {abaAtiva === 'painel' && (
          <PainelGeral
            atletas={atletas}
            avaliacoes={avaliacoes}
            categorias={categorias}
            onNavegarPlantel={handleNavegarPlantel}
            onSelecionarAtleta={handleAbrirRelatorioAtleta}
            onNovaAvaliacao={() => {
              setAbaAtiva('jogo');
              handleAbrirNovoJogo();
            }}
            onNovoAtleta={handleAbrirNovoAtleta}
          />
        )}

        {/* ABA 2: JOGO (Agenda de Jogos com avaliação dentro do jogo) */}
        {abaAtiva === 'jogo' && (
          <AgendaJogosView
            jogos={jogos}
            atletas={atletas}
            avaliacoes={avaliacoes}
            categorias={categorias}
            onNovoJogo={handleAbrirNovoJogo}
            onEditarJogo={handleAbrirEditarJogo}
            onExcluirJogo={handleExcluirJogo}
            onSalvarAvaliacao={handleSalvarAvaliacao}
            onSelecionarAtleta={handleAbrirRelatorioAtleta}
            onNavegarEscalacao={(jogoId) => {
              setJogoSelecionadoParaEscalacaoId(jogoId);
              setAbaAtiva('escalacao');
            }}
          />
        )}

        {/* ABA 3: ESCALAÇÃO (onde monta o time / convocação do jogo) */}
        {abaAtiva === 'escalacao' && (
          <PlantelView
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
          />
        )}

        {/* ABA 4: TROFÉUS (Comparativo de agora) */}
        {abaAtiva === 'trofeus' && (
          <ComparativoView
            atletas={atletas}
            avaliacoes={avaliacoes}
            onSelecionarAtleta={handleAbrirRelatorioAtleta}
          />
        )}

        {/* TELAS DO MENU ☰ */}
        {abaAtiva === 'financeiro' && (
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
        )}

        {abaAtiva === 'relatorio' && (
          <RelatorioIndividual
            atletas={atletas}
            atletaSelecionadoInicial={atletaSelecionado}
            avaliacoes={avaliacoes}
            onVoltar={() => setAbaAtiva('painel')}
            onNovaAvaliacao={() => setAbaAtiva('jogo')}
            onEditarAtleta={handleAbrirEditarAtleta}
          />
        )}

        {abaAtiva === 'testefisico' && (
          <TesteFisicoView
            atletas={atletas}
            testesFisicos={testesFisicos}
            categorias={categorias}
            onSalvarTeste={handleSalvarTesteFisico}
            onExcluirTeste={handleExcluirTesteFisico}
          />
        )}
      </main>

      {/* ========================================================= */}
      {/* 1. MENU DE BAIXO: */}
      {/* PAINEL (Visão Geral) - JOGO - ESCALAÇÃO - TROFÉUS */}
      {/* Quando clicar, fica azul #2563eb */}
      {/* ========================================================= */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 no-print w-full max-w-[100vw] overflow-x-hidden box-border">
        <div className="max-w-md mx-auto grid grid-cols-4 items-center h-16">
          {/* 1. PAINEL */}
          <button
            onClick={() => setAbaAtiva('painel')}
            className={`flex flex-col items-center justify-center h-full transition-all ${
              abaAtiva === 'painel'
                ? 'font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
            }`}
            style={abaAtiva === 'painel' ? { color: '#2563eb' } : {}}
          >
            <Shield className="w-5 h-5 mb-0.5" />
            <span className="text-[11px] tracking-tight uppercase">PAINEL</span>
          </button>

          {/* 2. JOGO */}
          <button
            onClick={() => setAbaAtiva('jogo')}
            className={`flex flex-col items-center justify-center h-full transition-all ${
              abaAtiva === 'jogo'
                ? 'font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
            }`}
            style={abaAtiva === 'jogo' ? { color: '#2563eb' } : {}}
          >
            <Calendar className="w-5 h-5 mb-0.5" />
            <span className="text-[11px] tracking-tight uppercase">JOGO</span>
          </button>

          {/* 3. ESCALAÇÃO */}
          <button
            onClick={() => setAbaAtiva('escalacao')}
            className={`flex flex-col items-center justify-center h-full transition-all ${
              abaAtiva === 'escalacao'
                ? 'font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
            }`}
            style={abaAtiva === 'escalacao' ? { color: '#2563eb' } : {}}
          >
            <Users className="w-5 h-5 mb-0.5" />
            <span className="text-[11px] tracking-tight uppercase">ESCALAÇÃO</span>
          </button>

          {/* 4. TROFÉUS */}
          <button
            onClick={() => setAbaAtiva('trofeus')}
            className={`flex flex-col items-center justify-center h-full transition-all ${
              abaAtiva === 'trofeus'
                ? 'font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
            }`}
            style={abaAtiva === 'trofeus' ? { color: '#2563eb' } : {}}
          >
            <Trophy className="w-5 h-5 mb-0.5" />
            <span className="text-[11px] tracking-tight uppercase">TROFÉUS</span>
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
        onSalvarCategorias={(novas) => {
          storageService.salvarCategorias(novas);
          setCategorias(novas);
          exibirToast('Categorias atualizadas!');
        }}
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
