import React, { useState, useEffect } from 'react';
import {
  Shield,
  Users,
  Award,
  ArrowRightLeft,
  Calendar,
  Plus,
  Download,
  Upload,
  RotateCcw,
  Menu,
  X,
  CheckCircle2,
  Settings,
  Flame,
  Wifi,
  WifiOff,
  Smartphone,
} from 'lucide-react';
import { Atleta, AvaliacaoJogo } from './types';
import { storageService, CATEGORIAS_PADRAO } from './services/storage';
import { firebaseService } from './services/firebase';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import { usePWAInstall } from './hooks/usePWAInstall';
import { PainelGeral } from './components/PainelGeral';
import { PlantelView } from './components/PlantelView';
import { RelatorioIndividual } from './components/RelatorioIndividual';
import { HistoricoJogosView } from './components/HistoricoJogosView';
import { ComparativoView } from './components/ComparativoView';
import { AtletaModal } from './components/AtletaModal';
import { AvaliacaoModal } from './components/AvaliacaoModal';
import { GerenciarCategoriasModal } from './components/GerenciarCategoriasModal';

import { MasterSoccerEscudo } from './components/MasterSoccerEscudo';

type AbaNavegacao = 'painel' | 'plantel' | 'avaliacoes' | 'comparativo' | 'relatorio';

export default function App() {
  const isOnline = useOnlineStatus();
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();

  const [atletas, setAtletas] = useState<Atleta[]>([]);
  const [avaliacoes, setAvaliacoes] = useState<AvaliacaoJogo[]>([]);
  const [categorias, setCategorias] = useState<string[]>(CATEGORIAS_PADRAO);
  const [abaAtiva, setAbaAtiva] = useState<AbaNavegacao>('painel');
  const [categoriaAtiva, setCategoriaAtiva] = useState<string>('TODAS');

  // Modais e seleções
  const [atletaSelecionado, setAtletaSelecionado] = useState<Atleta | null>(null);
  const [isAtletaModalOpen, setIsAtletaModalOpen] = useState(false);
  const [atletaEditando, setAtletaEditando] = useState<Atleta | null>(null);

  const [isAvaliacaoModalOpen, setIsAvaliacaoModalOpen] = useState(false);
  const [avaliacaoEditando, setAvaliacaoEditando] = useState<AvaliacaoJogo | null>(null);
  const [atletaPreSelecionadoId, setAtletaPreSelecionadoId] = useState<string | undefined>();

  const [isCategoriasModalOpen, setIsCategoriasModalOpen] = useState(false);
  const [isInstalarModalOpen, setIsInstalarModalOpen] = useState(false);
  const [toastMensagem, setToastMensagem] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Carrega dados e sincroniza via onSnapshot do Firestore (fonte única da lista de atletas)
  useEffect(() => {
    // 1. Escuta em tempo real a coleção 'athletes' do Firestore
    const unsubscribe = firebaseService.observarDados(
      (novosAtletas) => {
        setAtletas(novosAtletas);
        storageService.salvarAtletas(novosAtletas);
      },
      (novasAvaliacoes) => {
        setAvaliacoes(novasAvaliacoes);
        storageService.salvarAvaliacoes(novasAvaliacoes);
      }
    );

    // 2. Se a coleção 'athletes' estiver vazia pela primeira vez, semeia os atletas iniciais no Firestore
    async function inicializarAtletasNoFirestore() {
      try {
        const dadosRemotos = await firebaseService.buscarDados();
        if (dadosRemotos.atletas.length === 0) {
          const atlsLocais = storageService.getAtletas();
          if (atlsLocais.length > 0) {
            for (const atl of atlsLocais) {
              await firebaseService.cadastrarAtleta(atl).catch(() => {});
            }
          }
        }
      } catch (err) {
        console.warn('Conexão inicial com Firestore offline ou em segundo plano:', err);
      }
    }

    inicializarAtletasNoFirestore();

    return () => {
      unsubscribe();
    };
  }, []);

  const exibirToast = (msg: string) => {
    setToastMensagem(msg);
    setTimeout(() => setToastMensagem(null), 3500);
  };

  // Handlers para Atletas: Salva com await no Firestore SEM setState manual (o onSnapshot atualiza sozinho)
  const handleSalvarAtleta = async (atleta: Atleta) => {
    try {
      if (atletaEditando && atleta.id) {
        await firebaseService.atualizarAtleta(atleta.id, atleta);
      } else {
        // Cadastra com addDoc(collection(db, 'athletes'), ...)
        await firebaseService.cadastrarAtleta(atleta);
      }
      // NÃO dá setState manual: o onSnapshot do Firestore atualiza sozinho a lista de atletas!
      if (atletaSelecionado && atletaSelecionado.id === atleta.id) {
        setAtletaSelecionado(atleta);
      }
      exibirToast(`Atleta ${atleta.nome.split(' ')[0]} salvo com sucesso no Firestore!`);
    } catch (e: any) {
      console.error('Erro ao salvar atleta no Firestore:', e);
      alert(e?.message || 'Erro ao salvar atleta no Firestore');
      throw e; // Lança para que o AtletaModal capture e exiba sem fechar
    }
  };

  // Excluir atleta: usa deleteDoc(doc(db, 'athletes', id)) SEM setState manual (o onSnapshot atualiza sozinho)
  const handleExcluirAtleta = async (id: string) => {
    const atleta = atletas.find((a) => a.id === id);
    if (window.confirm(`Tem certeza que deseja excluir o atleta ${atleta?.nome || ''}?`)) {
      try {
        await firebaseService.excluirAtleta(id);
        // NÃO dá setState manual: o onSnapshot do Firestore remove sozinho!
        if (atletaSelecionado && atletaSelecionado.id === id) {
          setAtletaSelecionado(null);
          setAbaAtiva('plantel');
        }
        exibirToast('Atleta removido com sucesso do Firestore.');
      } catch (e: any) {
        console.error('Erro ao excluir atleta:', e);
        alert(`Erro ao excluir atleta do Firestore: ${e?.message || e}`);
      }
    }
  };


  const handleAbrirEditarAtleta = (atleta: Atleta) => {
    setAtletaEditando(atleta);
    setIsAtletaModalOpen(true);
  };

  const handleAbrirNovoAtleta = () => {
    setAtletaEditando(null);
    setIsAtletaModalOpen(true);
  };

  // Handlers para Avaliações (Salva no Firestore com nome do atleta, categoria, data, nota, observações, nome do professor)
  const handleSalvarAvaliacao = async (avaliacao: AvaliacaoJogo) => {
    storageService.salvarAvaliacao(avaliacao);
    setAvaliacoes(storageService.getAvaliacoes());

    const atleta = atletas.find((a) => a.id === avaliacao.atletaId);
    const nomeAtleta = atleta ? atleta.nome : '';

    try {
      await firebaseService.salvarAvaliacao(avaliacao, nomeAtleta);
      if (isOnline) {
        exibirToast('Avaliação salva e sincronizada com o Firebase!');
      } else {
        exibirToast('Avaliação salva offline no aparelho! Sincronizará quando online.');
      }
    } catch (e) {
      console.warn('Avaliação salva no cache offline:', e);
      exibirToast('Avaliação salva no aparelho (modo offline ativo).');
    }
  };

  const handleExcluirAvaliacao = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta avaliação de partida?')) {
      storageService.excluirAvaliacao(id);
      setAvaliacoes(storageService.getAvaliacoes());
      try {
        await firebaseService.excluirAvaliacao(id);
      } catch (e) {
        console.warn('Exclusão salva no cache offline:', e);
      }
      exibirToast('Avaliação excluída com sucesso.');
    }
  };

  const handleAbrirNovaAvaliacao = (atletaId?: string) => {
    setAvaliacaoEditando(null);
    setAtletaPreSelecionadoId(atletaId);
    setIsAvaliacaoModalOpen(true);
  };

  const handleAbrirEditarAvaliacao = (avaliacao: AvaliacaoJogo) => {
    setAvaliacaoEditando(avaliacao);
    setAtletaPreSelecionadoId(avaliacao.atletaId);
    setIsAvaliacaoModalOpen(true);
  };

  // Handler para instalação do PWA
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
    setAbaAtiva('plantel');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Importar / Exportar / Reset
  const handleImportarBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (storageService.importarBackupJson(content)) {
        setAtletas(storageService.getAtletas());
        setAvaliacoes(storageService.getAvaliacoes());
        setCategorias(storageService.getCategorias());
        exibirToast('Backup importado com sucesso!');
      } else {
        alert('Arquivo de backup inválido. Verifique o formato JSON.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleRestaurarFabrica = () => {
    if (
      window.confirm(
        'Deseja restaurar os dados de demonstração originais? Isso redefinirá os atletas e avaliações de exemplo.'
      )
    ) {
      storageService.restaurarDadosFabrica();
      setAtletas(storageService.getAtletas());
      setAvaliacoes(storageService.getAvaliacoes());
      setCategorias(storageService.getCategorias());
      setAtletaSelecionado(null);
      setAbaAtiva('painel');
      exibirToast('Dados de exemplo restaurados com sucesso!');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/70 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans">
      {/* Toast Notification */}
      {toastMensagem && (
        <div className="fixed bottom-20 sm:bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xl border border-slate-700 dark:border-slate-200 text-xs font-semibold animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-amber-400 dark:text-amber-500 shrink-0" />
          <span>{toastMensagem}</span>
        </div>
      )}

      {/* Top Bar Contract (1 Row, 3 Zones: Brand - Nav - Action) */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Brand Wordmark & Escudo Oficial Master Soccer */}
          <div
            onClick={() => setAbaAtiva('painel')}
            className="flex items-center gap-3 cursor-pointer whitespace-nowrap shrink-0 group select-none"
          >
            <MasterSoccerEscudo size={42} className="group-hover:scale-105 transition-transform drop-shadow-xs" />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white">
                  Master <span className="text-blue-600 dark:text-blue-400">Soccer</span>
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                  RJ
                </span>
              </div>
              <span className="hidden sm:inline text-[10px] font-medium text-slate-400">
                Base Sub-15 · Sub-16 · Sub-17
              </span>
            </div>
          </div>

          {/* Zone 2: Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-600 dark:text-slate-300">
            <button
              onClick={() => setAbaAtiva('painel')}
              className={`hover:text-blue-600 transition-colors whitespace-nowrap shrink-0 py-1 ${
                abaAtiva === 'painel'
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-amber-400 font-bold'
                  : ''
              }`}
            >
              Visão Geral
            </button>
            <button
              onClick={() => setAbaAtiva('plantel')}
              className={`hover:text-blue-600 transition-colors whitespace-nowrap shrink-0 py-1 ${
                abaAtiva === 'plantel'
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-amber-400 font-bold'
                  : ''
              }`}
            >
              Plantel de Atletas
            </button>
            <button
              onClick={() => setAbaAtiva('avaliacoes')}
              className={`hover:text-blue-600 transition-colors whitespace-nowrap shrink-0 py-1 ${
                abaAtiva === 'avaliacoes'
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-amber-400 font-bold'
                  : ''
              }`}
            >
              Partidas & Avaliações
            </button>
            <button
              onClick={() => setAbaAtiva('comparativo')}
              className={`hover:text-blue-600 transition-colors whitespace-nowrap shrink-0 py-1 ${
                abaAtiva === 'comparativo'
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-amber-400 font-bold'
                  : ''
              }`}
            >
              Comparativo
            </button>
            {atletaSelecionado && (
              <button
                onClick={() => setAbaAtiva('relatorio')}
                className={`hover:text-blue-600 transition-colors whitespace-nowrap shrink-0 py-1 ${
                  abaAtiva === 'relatorio'
                    ? 'text-blue-600 dark:text-blue-400 border-b-2 border-amber-400 font-bold'
                    : ''
                }`}
              >
                Ficha: {atletaSelecionado.nome.split(' ')[0]}
              </button>
            )}
          </nav>

          {/* Zone 3: Primary Action & Menu */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Selinho ONLINE / OFFLINE (Requisito 2) */}
            {isOnline ? (
              <span
                title="Conectado à internet. Sincronização em tempo real com o Firebase ativa."
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 shrink-0"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                ONLINE
              </span>
            ) : (
              <span
                title="Sem conexão com a internet. Modo offline ativo com persistência IndexedDB."
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-orange-100 text-orange-800 dark:bg-orange-950/80 dark:text-orange-300 border border-orange-300 dark:border-orange-800 shrink-0 animate-pulse"
              >
                <span className="w-2 h-2 rounded-full bg-orange-500 shrink-0" />
                OFFLINE
              </span>
            )}

            {/* Botão Instalar App (Requisito 3) */}
            <button
              onClick={handleInstalarApp}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 border border-emerald-300 dark:border-emerald-800 rounded-xl transition-all shadow-xs shrink-0"
              title="Instalar Master Soccer RJ no seu celular ou computador"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="hidden sm:inline">Instalar App</span>
              <span className="sm:hidden">Instalar</span>
            </button>

            {/* Botão de Nova Avaliação (Azul Master Soccer com detalhe Dourado) */}
            <button
              onClick={() => handleAbrirNovaAvaliacao()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-98 rounded-xl shadow-xs transition-all whitespace-nowrap shrink-0 border border-blue-500/30"
            >
              <Plus className="w-4 h-4 text-amber-300" />
              <span className="hidden sm:inline">Avaliar Jogo</span>
              <span className="sm:hidden">Avaliar</span>
            </button>


            {/* Configurações / Backup Dropdown */}
            <div className="relative group">
              <button
                title="Configurações e Backup de Dados"
                className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <Settings className="w-4 h-4" />
              </button>
              <div className="absolute right-0 mt-2 w-56 p-2 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 hidden group-hover:block z-50 text-xs space-y-1">
                <button
                  onClick={() => setIsCategoriasModalOpen(true)}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium"
                >
                  Gerenciar Categorias
                </button>
                <button
                  onClick={() => storageService.exportarBackupJson()}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-between"
                >
                  <span>Exportar Backup (JSON)</span>
                  <Download className="w-3.5 h-3.5 text-slate-400" />
                </button>
                <label className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-between cursor-pointer">
                  <span>Importar Backup (JSON)</span>
                  <Upload className="w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportarBackup}
                    className="hidden"
                  />
                </label>
                <button
                  onClick={() => storageService.exportarAvaliacoesCsv()}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-between"
                >
                  <span>Exportar Planilha (CSV)</span>
                  <Download className="w-3.5 h-3.5 text-slate-400" />
                </button>
                <div className="border-t border-slate-100 dark:border-slate-800 my-1 pt-1">
                  <button
                    onClick={handleRestaurarFabrica}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 text-red-600 flex items-center justify-between"
                  >
                    <span>Restaurar Dados Exemplo</span>
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {abaAtiva === 'painel' && (
          <PainelGeral
            atletas={atletas}
            avaliacoes={avaliacoes}
            categorias={categorias}
            onNavegarPlantel={handleNavegarPlantel}
            onSelecionarAtleta={handleAbrirRelatorioAtleta}
            onNovaAvaliacao={() => handleAbrirNovaAvaliacao()}
            onNovoAtleta={handleAbrirNovoAtleta}
          />
        )}

        {abaAtiva === 'plantel' && (
          <PlantelView
            atletas={atletas}
            avaliacoes={avaliacoes}
            categorias={categorias}
            categoriaSelecionada={categoriaAtiva}
            onSelecionarCategoria={setCategoriaAtiva}
            onNovoAtleta={handleAbrirNovoAtleta}
            onSelecionarAtleta={handleAbrirRelatorioAtleta}
            onNovaAvaliacao={handleAbrirNovaAvaliacao}
            onEditarAtleta={handleAbrirEditarAtleta}
            onExcluirAtleta={handleExcluirAtleta}
          />
        )}

        {abaAtiva === 'avaliacoes' && (
          <HistoricoJogosView
            avaliacoes={avaliacoes}
            atletas={atletas}
            categorias={categorias}
            onNovaAvaliacao={() => handleAbrirNovaAvaliacao()}
            onEditarAvaliacao={handleAbrirEditarAvaliacao}
            onExcluirAvaliacao={handleExcluirAvaliacao}
            onSelecionarAtleta={handleAbrirRelatorioAtleta}
          />
        )}

        {abaAtiva === 'comparativo' && (
          <ComparativoView
            atletas={atletas}
            avaliacoes={avaliacoes}
            onSelecionarAtleta={handleAbrirRelatorioAtleta}
          />
        )}

        {abaAtiva === 'relatorio' && atletaSelecionado && (
          <RelatorioIndividual
            atleta={atletaSelecionado}
            avaliacoes={avaliacoes}
            onVoltar={() => setAbaAtiva('plantel')}
            onNovaAvaliacao={handleAbrirNovaAvaliacao}
            onEditarAtleta={handleAbrirEditarAtleta}
          />
        )}
      </main>

      {/* Mobile Bottom Navigation Bar (Pattern from references/10_mobile_touch_apps.md) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 no-print">
        <div className="grid grid-cols-4 items-center h-14">
          <button
            onClick={() => setAbaAtiva('painel')}
            className={`flex flex-col items-center justify-center h-full transition-colors ${
              abaAtiva === 'painel'
                ? 'text-blue-600 dark:text-blue-400 font-bold'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span className="text-[10px] tracking-tight mt-1">Início</span>
          </button>
          <button
            onClick={() => setAbaAtiva('plantel')}
            className={`flex flex-col items-center justify-center h-full transition-colors ${
              abaAtiva === 'plantel'
                ? 'text-blue-600 dark:text-blue-400 font-bold'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <Users className="w-4 h-4" />
            <span className="text-[10px] tracking-tight mt-1">Plantel</span>
          </button>
          <button
            onClick={() => setAbaAtiva('avaliacoes')}
            className={`flex flex-col items-center justify-center h-full transition-colors ${
              abaAtiva === 'avaliacoes'
                ? 'text-blue-600 dark:text-blue-400 font-bold'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <Award className="w-4 h-4" />
            <span className="text-[10px] tracking-tight mt-1">Jogos</span>
          </button>
          <button
            onClick={() => setAbaAtiva('comparativo')}
            className={`flex flex-col items-center justify-center h-full transition-colors ${
              abaAtiva === 'comparativo'
                ? 'text-blue-600 dark:text-blue-400 font-bold'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <ArrowRightLeft className="w-4 h-4" />
            <span className="text-[10px] tracking-tight mt-1">Comparar</span>
          </button>
        </div>
      </div>

      {/* Modais */}
      <AtletaModal
        isOpen={isAtletaModalOpen}
        onClose={() => setIsAtletaModalOpen(false)}
        onSave={handleSalvarAtleta}
        atletaEditando={atletaEditando}
        categoriasDisponiveis={categorias}
        categoriaPadrao={categoriaAtiva === 'TODAS' ? 'SUB-15' : categoriaAtiva}
      />

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

      {/* Modal de Instalação do App (PWA) */}
      {isInstalarModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200 no-print">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 relative">
            <button
              onClick={() => setIsInstalarModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
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
                <p className="text-xs text-slate-500 dark:text-slate-400">
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

              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <span className="text-emerald-800 dark:text-emerald-300 text-[11px] leading-relaxed">
                  O aplicativo funcionará mesmo no campo sem sinal de internet, sincronizando as avaliações automaticamente com o Firebase assim que reconectar.
                </span>
              </div>
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

