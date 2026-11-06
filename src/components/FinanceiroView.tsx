import React, { useState } from 'react';
import {
  DollarSign,
  Plus,
  Check,
  X,
  MoreVertical,
  Edit2,
  Trash2,
  ArrowLeft,
  Calendar,
  Trophy,
  AlertCircle,
  CheckCircle2,
  Filter,
  Users,
  Search,
} from 'lucide-react';
import {
  Atleta,
  ItemCompeticaoTaxa,
  RegistroFinanceiroAtleta,
  MesAno,
  MESES_DO_ANO,
} from '../types';
import { storageService } from '../services/storage';
import { firebaseService } from '../services/firebase';

interface FinanceiroViewProps {
  atletas: Atleta[];
  categorias: string[];
  competicoes: ItemCompeticaoTaxa[];
  registrosFinanceiros: Record<string, RegistroFinanceiroAtleta>;
  onAtualizarCompeticoes: (comps: ItemCompeticaoTaxa[]) => void;
  onAtualizarRegistro: (registro: RegistroFinanceiroAtleta) => void;
  onExibirToast: (msg: string) => void;
}

export const FinanceiroView: React.FC<FinanceiroViewProps> = ({
  atletas,
  categorias,
  competicoes,
  registrosFinanceiros,
  onAtualizarCompeticoes,
  onAtualizarRegistro,
  onExibirToast,
}) => {
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>('TODAS');
  const [busca, setBusca] = useState<string>('');
  const [atletaSelecionadoId, setAtletaSelecionadoId] = useState<string | null>(null);

  // Estados dos Modais
  const [isModalNovaCompeticaoOpen, setIsModalNovaCompeticaoOpen] = useState(false);
  const [tipoNovoItem, setTipoNovoItem] = useState<'competicao' | 'taxa_jogo'>('competicao');
  const [itemEditando, setItemEditando] = useState<ItemCompeticaoTaxa | null>(null);
  const [formNome, setFormNome] = useState('');
  const [formValor, setFormValor] = useState<string>('150');
  const [formCategoria, setFormCategoria] = useState<string>('TODAS');

  const [isModalMensalidadeOpen, setIsModalMensalidadeOpen] = useState(false);
  const [valorMensalidadeInput, setValorMensalidadeInput] = useState<string>('150');

  // Menu de 3 pontinhos ativo
  const [menuAbertoId, setMenuAbertoId] = useState<string | null>(null);

  // Confirmação para apagar competição
  const [itemParaApagar, setItemParaApagar] = useState<ItemCompeticaoTaxa | null>(null);

  // Atleta selecionado para visão detalhada
  const atletaAtivo = atletas.find((a) => a.id === atletaSelecionadoId) || null;

  // Atletas filtrados por categoria e busca
  const atletasFiltrados = atletas
    .filter((a) => {
      const matchCat = categoriaFiltro === 'TODAS' || a.categoria === categoriaFiltro;
      const matchBusca =
        !busca.trim() ||
        a.nome.toLowerCase().includes(busca.toLowerCase()) ||
        (a.apelido && a.apelido.toLowerCase().includes(busca.toLowerCase()));
      return matchCat && matchBusca;
    })
    .sort((a, b) => a.nome.localeCompare(b.nome));

  const formatarMoeda = (val: number) => {
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  // Helper para obter registro financeiro de um atleta
  const getRegistro = (atletaId: string): RegistroFinanceiroAtleta => {
    return (
      registrosFinanceiros[atletaId] ||
      storageService.getRegistroFinanceiroAtleta(atletaId)
    );
  };

  // Alternar pagamento de mês
  const handleToggleMes = async (atletaId: string, mes: MesAno) => {
    const regAtual = getRegistro(atletaId);
    const pagas = new Set(regAtual.mensalidadesPagas || []);
    if (pagas.has(mes)) {
      pagas.delete(mes);
    } else {
      pagas.add(mes);
    }
    const novoReg: RegistroFinanceiroAtleta = {
      ...regAtual,
      mensalidadesPagas: Array.from(pagas),
      atualizadoEm: new Date().toISOString(),
    };

    // Salva local e na nuvem
    storageService.salvarRegistroFinanceiroAtleta(novoReg);
    onAtualizarRegistro(novoReg);
    try {
      await firebaseService.salvarRegistroFinanceiroAtleta(novoReg);
    } catch (e) {
      console.warn('Erro ao salvar no Firestore (modo offline ativo):', e);
    }
  };

  // Alternar pagamento de competição / taxa
  const handleToggleCompeticao = async (atletaId: string, compId: string) => {
    const regAtual = getRegistro(atletaId);
    const atual = Boolean(regAtual.competicoesPagas?.[compId]);
    const novoReg: RegistroFinanceiroAtleta = {
      ...regAtual,
      competicoesPagas: {
        ...(regAtual.competicoesPagas || {}),
        [compId]: !atual,
      },
      atualizadoEm: new Date().toISOString(),
    };

    // Salva local e na nuvem
    storageService.salvarRegistroFinanceiroAtleta(novoReg);
    onAtualizarRegistro(novoReg);
    try {
      await firebaseService.salvarRegistroFinanceiroAtleta(novoReg);
    } catch (e) {
      console.warn('Erro ao salvar no Firestore (modo offline ativo):', e);
    }
  };

  // Abrir modal para nova competição / taxa
  const handleAbrirNovoItem = (tipo: 'competicao' | 'taxa_jogo') => {
    setItemEditando(null);
    setTipoNovoItem(tipo);
    setFormNome('');
    setFormValor(tipo === 'competicao' ? '150' : '50');
    setFormCategoria(atletaAtivo ? atletaAtivo.categoria : categoriaFiltro === 'TODAS' ? 'TODAS' : categoriaFiltro);
    setIsModalNovaCompeticaoOpen(true);
  };

  // Abrir modal para editar competição / taxa
  const handleAbrirEditarItem = (item: ItemCompeticaoTaxa) => {
    setItemEditando(item);
    setTipoNovoItem(item.tipo);
    setFormNome(item.nome);
    setFormValor(String(item.valor));
    setFormCategoria(item.categoria || 'TODAS');
    setMenuAbertoId(null);
    setIsModalNovaCompeticaoOpen(true);
  };

  // Salvar nova ou editada competição / taxa
  const handleSalvarItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNome.trim()) {
      alert('Por favor, informe o nome da competição ou taxa.');
      return;
    }
    const valNumerico = Math.max(0, parseFloat(formValor.replace(',', '.')) || 0);

    const itemSalvo: ItemCompeticaoTaxa = {
      id: itemEditando ? itemEditando.id : `comp-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      nome: formNome.trim(),
      valor: valNumerico,
      tipo: tipoNovoItem,
      categoria: formCategoria,
      criadoEm: itemEditando?.criadoEm || new Date().toISOString(),
    };

    storageService.salvarCompeticao(itemSalvo);
    onAtualizarCompeticoes(storageService.getCompeticoes());

    try {
      await firebaseService.salvarCompeticao(itemSalvo);
      onExibirToast(
        itemEditando
          ? 'Competição/taxa atualizada na nuvem com sucesso!'
          : 'Nova competição/taxa adicionada para todos os atletas!'
      );
    } catch (err) {
      console.warn('Salvo localmente (offline):', err);
      onExibirToast('Salvo no dispositivo (modo offline ativo).');
    }

    setIsModalNovaCompeticaoOpen(false);
  };

  // Confirmar exclusão de competição / taxa
  const handleConfirmarExclusaoItem = async () => {
    if (!itemParaApagar) return;
    const id = itemParaApagar.id;

    storageService.excluirCompeticao(id);
    onAtualizarCompeticoes(storageService.getCompeticoes());

    try {
      await firebaseService.excluirCompeticao(id);
      onExibirToast('Competição/taxa apagada com sucesso.');
    } catch (err) {
      console.warn('Excluído localmente (offline):', err);
      onExibirToast('Apagado no dispositivo.');
    }

    setItemParaApagar(null);
    setMenuAbertoId(null);
  };

  // Salvar novo valor de mensalidade padrão do atleta ou global
  const handleSalvarValorMensalidade = async (e: React.FormEvent) => {
    e.preventDefault();
    const valNumerico = Math.max(0, parseFloat(valorMensalidadeInput.replace(',', '.')) || 150);

    if (atletaAtivo) {
      const reg = getRegistro(atletaAtivo.id);
      const novoReg: RegistroFinanceiroAtleta = {
        ...reg,
        valorMensalidadePadrao: valNumerico,
      };
      storageService.salvarRegistroFinanceiroAtleta(novoReg);
      onAtualizarRegistro(novoReg);
      try {
        await firebaseService.salvarRegistroFinanceiroAtleta(novoReg);
      } catch (err) {
        console.warn('Erro ao salvar no Firestore (offline):', err);
      }
      onExibirToast(`Valor da mensalidade de ${atletaAtivo.nome.split(' ')[0]} atualizado para ${formatarMoeda(valNumerico)}!`);
    } else {
      storageService.salvarValorMensalidadePadrao(valNumerico);
      onExibirToast(`Valor padrão das mensalidades atualizado para ${formatarMoeda(valNumerico)}!`);
    }

    setIsModalMensalidadeOpen(false);
  };

  // Estatísticas globais da lista filtrada
  const estatisticasGerais = atletasFiltrados.reduce(
    (acc, atl) => {
      const res = storageService.calcularResumoAtleta(atl, competicoes, getRegistro(atl.id));
      acc.totalPago += res.totalPago;
      acc.totalDevendo += res.totalDevendo;
      acc.mensalidadesPagas += res.mensalidadesPagasCount;
      acc.competicoesPagas += res.competicoesPagasCount;
      return acc;
    },
    { totalPago: 0, totalDevendo: 0, mensalidadesPagas: 0, competicoesPagas: 0 }
  );

  return (
    <div className="space-y-6 pb-[120px] max-w-7xl mx-auto">
      {/* SE UM ATLETA ESTIVER SELECIONADO: PÁGINA FINANCEIRA SÓ DELE */}
      {atletaAtivo ? (
        <div className="space-y-6">
          {/* Botão Voltar */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setAtletaSelecionadoId(null)}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl transition-all shadow-xs"
            >
              <ArrowLeft className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Voltar para Lista Financeira</span>
            </button>

            <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-lg">
              {atletaAtivo.categoria}
            </span>
          </div>

          {/* Topo do Atleta: Foto, Nome, Categoria e Resumo Total Pago / Total Devendo */}
          {(() => {
            const reg = getRegistro(atletaAtivo.id);
            const resumo = storageService.calcularResumoAtleta(atletaAtivo, competicoes, reg);
            const valorMensalidade =
              reg.valorMensalidadePadrao !== undefined && reg.valorMensalidadePadrao > 0
                ? reg.valorMensalidadePadrao
                : storageService.getValorMensalidadePadrao();

            // Competições aplicáveis a este atleta
            const compsAtleta = competicoes.filter(
              (c) => !c.categoria || c.categoria === 'TODAS' || c.categoria === atletaAtivo.categoria
            );

            return (
              <>
                <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-blue-900 text-white rounded-2xl p-6 sm:p-7 border border-blue-900/60 shadow-sm relative overflow-hidden">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 z-10 relative">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden bg-slate-800 border-2 border-amber-400/40 shrink-0 flex items-center justify-center font-black text-xl text-amber-300">
                        {atletaAtivo.fotoUrl ? (
                          <img
                            src={atletaAtivo.fotoUrl}
                            alt={atletaAtivo.nome}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          atletaAtivo.nome
                            .split(' ')
                            .slice(0, 2)
                            .map((n) => n[0])
                            .join('')
                            .toUpperCase()
                        )}
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-900/80 text-amber-300 border border-amber-400/30">
                            {atletaAtivo.categoria}
                          </span>
                          <span className="text-xs text-slate-300 font-medium">
                            {atletaAtivo.posicao}
                          </span>
                        </div>
                        <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                          {atletaAtivo.nome}
                        </h2>
                        {atletaAtivo.apelido && (
                          <p className="text-xs text-slate-300">"{atletaAtivo.apelido}"</p>
                        )}
                      </div>
                    </div>

                    {/* Resumo Financeiro em Destaque */}
                    <div className="grid grid-cols-2 gap-3 w-full sm:w-auto">
                      <div className="bg-emerald-950/70 border border-emerald-500/40 p-3.5 rounded-xl text-left sm:text-right">
                        <span className="text-[10px] uppercase font-bold text-emerald-300 block">
                          Total Pago
                        </span>
                        <span className="text-lg sm:text-2xl font-black font-mono text-emerald-400 tabular-nums">
                          {formatarMoeda(resumo.totalPago)}
                        </span>
                        <span className="text-[10px] text-emerald-200/80 block mt-0.5">
                          {resumo.mensalidadesPagasCount} mensalidades + {resumo.competicoesPagasCount} taxas
                        </span>
                      </div>

                      <div className="bg-rose-950/70 border border-rose-500/40 p-3.5 rounded-xl text-left sm:text-right">
                        <span className="text-[10px] uppercase font-bold text-rose-300 block">
                          Total Devendo
                        </span>
                        <span className="text-lg sm:text-2xl font-black font-mono text-rose-400 tabular-nums">
                          {formatarMoeda(resumo.totalDevendo)}
                        </span>
                        <span className="text-[10px] text-rose-200/80 block mt-0.5">
                          {12 - resumo.mensalidadesPagasCount} mensalidades pendentes
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* SEÇÃO 1 - MENSALIDADE: 12 QUADRADINHOS */}
                <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        <h3 className="text-base font-bold text-slate-900 dark:text-white">
                          SEÇÃO 1 · Mensalidades ({MESES_DO_ANO.length} Meses)
                        </h3>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Clique no mês para marcar como <strong>PAGO (Verde)</strong> ou <strong>NÃO PAGO (Cinza)</strong>
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block font-medium">Valor por Mês</span>
                        <span className="text-sm font-bold font-mono text-slate-900 dark:text-white">
                          {formatarMoeda(valorMensalidade)}
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          setValorMensalidadeInput(String(valorMensalidade));
                          setIsModalMensalidadeOpen(true);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Editar valor da mensalidade deste atleta"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* 12 Quadradinhos dos Meses */}
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-2.5">
                    {MESES_DO_ANO.map((mes) => {
                      const estaPago = (reg.mensalidadesPagas || []).includes(mes.id);
                      return (
                        <button
                          key={mes.id}
                          type="button"
                          onClick={() => handleToggleMes(atletaAtivo.id, mes.id)}
                          className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all select-none active:scale-95 ${
                            estaPago
                              ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm ring-2 ring-emerald-400/40'
                              : 'bg-slate-100 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                          }`}
                        >
                          <span className="text-xs font-black tracking-wider">{mes.label}</span>
                          <div className="mt-1.5 flex items-center justify-center">
                            {estaPago ? (
                              <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                                <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
                              </div>
                            ) : (
                              <div className="w-5 h-5 rounded-full border border-slate-300 dark:border-slate-600 flex items-center justify-center">
                                <span className="text-[10px] font-bold text-slate-400">✕</span>
                              </div>
                            )}
                          </div>
                          <span
                            className={`text-[9px] font-bold mt-1.5 uppercase ${
                              estaPago ? 'text-emerald-100' : 'text-slate-400'
                            }`}
                          >
                            {estaPago ? 'PAGO' : 'PENDENTE'}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500 pt-2">
                    <span>
                      Progresso Anual:{' '}
                      <strong className="text-slate-900 dark:text-white">
                        {resumo.mensalidadesPagasCount} de 12 meses pagos
                      </strong>
                    </span>
                    <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                      {formatarMoeda(resumo.mensalidadesPagasCount * valorMensalidade)} pagos
                    </span>
                  </div>
                </div>

                {/* SEÇÃO 2 - COMPETIÇÕES / TAXAS */}
                <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div>
                      <div className="flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-amber-500" />
                        <h3 className="text-base font-bold text-slate-900 dark:text-white">
                          SEÇÃO 2 · Competições & Taxas de Jogo
                        </h3>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Valores aplicáveis aos atletas do {atletaAtivo.categoria}. Toque para marcar pago/não pago.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => handleAbrirNovoItem('taxa_jogo')}
                        className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-all"
                      >
                        <Plus className="w-3.5 h-3.5 text-blue-600" />
                        <span>+ Adicionar Taxa de Jogo</span>
                      </button>

                      <button
                        onClick={() => handleAbrirNovoItem('competicao')}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-98 rounded-xl shadow-xs transition-all"
                      >
                        <Plus className="w-3.5 h-3.5 text-amber-300" />
                        <span>+ Nova Competição / Taxa</span>
                      </button>
                    </div>
                  </div>

                  {/* Lista de Cartões das Competições */}
                  {compsAtleta.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                      <p className="text-xs text-slate-500">
                        Nenhuma competição ou taxa cadastrada para esta categoria.
                      </p>
                      <button
                        onClick={() => handleAbrirNovoItem('competicao')}
                        className="mt-2 text-xs font-bold text-blue-600 hover:underline"
                      >
                        + Cadastrar primeira competição
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                      {compsAtleta.map((comp) => {
                        const estaPago = Boolean(reg.competicoesPagas?.[comp.id]);
                        const isMenuAberto = menuAbertoId === comp.id;

                        return (
                          <div
                            key={comp.id}
                            className={`p-4 rounded-xl border transition-all relative ${
                              estaPago
                                ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800'
                                : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                                  {comp.tipo === 'taxa_jogo' ? 'Taxa de Jogo' : 'Competição'}
                                </span>
                                <h4 className="text-sm font-black text-slate-900 dark:text-white mt-0.5">
                                  {comp.nome}
                                </h4>
                                <span className="text-base font-extrabold font-mono text-slate-800 dark:text-slate-200 block mt-1">
                                  {formatarMoeda(comp.valor)}
                                </span>
                              </div>

                              {/* Menu de 3 pontinhos para Editar Nome, Editar Valor e Apagar */}
                              <div className="relative">
                                <button
                                  type="button"
                                  onClick={() => setMenuAbertoId(isMenuAberto ? null : comp.id)}
                                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700"
                                  title="Opções da competição"
                                >
                                  <MoreVertical className="w-4 h-4" />
                                </button>

                                {isMenuAberto && (
                                  <div className="absolute right-0 top-7 w-44 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-1 z-30 animate-in fade-in zoom-in-95 text-xs">
                                    <button
                                      type="button"
                                      onClick={() => handleAbrirEditarItem(comp)}
                                      className="w-full text-left px-3 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
                                    >
                                      <Edit2 className="w-3.5 h-3.5 text-blue-600" />
                                      <span>Editar Nome e Valor</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setItemParaApagar(comp);
                                        setMenuAbertoId(null);
                                      }}
                                      className="w-full text-left px-3 py-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2"
                                    >
                                      <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                                      <span>Apagar Competição</span>
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Botão de marcar Pago / Não Pago */}
                            <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-700/60">
                              <button
                                type="button"
                                onClick={() => handleToggleCompeticao(atletaAtivo.id, comp.id)}
                                className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                                  estaPago
                                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                                    : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'
                                }`}
                              >
                                {estaPago ? (
                                  <>
                                    <Check className="w-4 h-4 stroke-[3]" />
                                    <span>PAGO ✓</span>
                                  </>
                                ) : (
                                  <>
                                    <span className="w-2 h-2 rounded-full bg-slate-400" />
                                    <span>NÃO PAGO (CINZA)</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </>
            );
          })()}
        </div>
      ) : (
        /* VISÃO GERAL: SELETOR DE CATEGORIA + LISTA DE ATLETAS DA CATEGORIA */
        <div className="space-y-6">
          {/* Topo: Botões de Categoria (Todas, SUB-15, SUB-16, SUB-17...) */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
              <button
                onClick={() => setCategoriaFiltro('TODAS')}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  categoriaFiltro === 'TODAS'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                Todas ({atletas.length})
              </button>
              {categorias.map((cat) => {
                const totalCat = atletas.filter((a) => a.categoria === cat).length;
                return (
                  <button
                    key={cat}
                    onClick={() => setCategoriaFiltro(cat)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                      categoriaFiltro === cat
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {cat} ({totalCat})
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleAbrirNovoItem('competicao')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-all shrink-0"
              >
                <Plus className="w-3.5 h-3.5 text-amber-300" />
                <span>+ Nova Competição / Taxa</span>
              </button>
            </div>
          </div>

          {/* Cards de Métricas Consolidadas da Categoria */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">
                Total Arrecadado ({categoriaFiltro})
              </span>
              <span className="text-xl sm:text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400 tabular-nums">
                {formatarMoeda(estatisticasGerais.totalPago)}
              </span>
              <span className="text-[11px] text-slate-500 block mt-1">
                Pagamentos confirmados
              </span>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">
                Total a Receber ({categoriaFiltro})
              </span>
              <span className="text-xl sm:text-2xl font-black font-mono text-rose-600 dark:text-rose-400 tabular-nums">
                {formatarMoeda(estatisticasGerais.totalDevendo)}
              </span>
              <span className="text-[11px] text-slate-500 block mt-1">
                Valores pendentes no ano
              </span>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">
                Mensalidades Pagas
              </span>
              <span className="text-xl sm:text-2xl font-black font-mono text-blue-600 dark:text-blue-400 tabular-nums">
                {estatisticasGerais.mensalidadesPagas}
              </span>
              <span className="text-[11px] text-slate-500 block mt-1">
                Meses quitados pelos atletas
              </span>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">
                Competições & Taxas
              </span>
              <span className="text-xl sm:text-2xl font-black font-mono text-amber-500 tabular-nums">
                {competicoes.length} ativas
              </span>
              <span className="text-[11px] text-slate-500 block mt-1">
                FERJ, Liga Metro, etc.
              </span>
            </div>
          </div>

          {/* Campo de Busca Rápida de Atleta */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar atleta da categoria pelo nome ou apelido para ver ficha financeira..."
              className="w-full h-10 pl-10 pr-4 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Lista de Atletas da Categoria (Mesma ordem alfabética do Plantel) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 px-1">
              <span>Atletas ({atletasFiltrados.length}) — Ordem Alfabética</span>
              <span className="text-slate-400">Clique para abrir o controle individual</span>
            </div>

            {atletasFiltrados.length === 0 ? (
              <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800">
                <p className="text-sm font-medium text-slate-500">
                  Nenhum atleta encontrado para a categoria {categoriaFiltro}.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {atletasFiltrados.map((atleta) => {
                  const reg = getRegistro(atleta.id);
                  const resumo = storageService.calcularResumoAtleta(atleta, competicoes, reg);

                  return (
                    <div
                      key={atleta.id}
                      onClick={() => setAtletaSelecionadoId(atleta.id)}
                      className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-blue-500/60 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between gap-3 group"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-bold text-xs text-blue-600">
                            {atleta.fotoUrl ? (
                              <img
                                src={atleta.fotoUrl}
                                alt={atleta.nome}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              atleta.nome
                                .split(' ')
                                .slice(0, 2)
                                .map((n) => n[0])
                                .join('')
                                .toUpperCase()
                            )}
                          </div>

                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/50">
                                {atleta.categoria}
                              </span>
                              <span className="text-xs text-slate-400 font-medium">
                                {atleta.posicao}
                              </span>
                            </div>
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors mt-0.5 line-clamp-1">
                              {atleta.nome}
                            </h4>
                          </div>
                        </div>

                        {/* Badges de Valores */}
                        <div className="text-right shrink-0">
                          <span className="text-[10px] text-slate-400 block font-medium">Total Pago</span>
                          <span className="text-xs font-black font-mono text-emerald-600 dark:text-emerald-400 tabular-nums">
                            {formatarMoeda(resumo.totalPago)}
                          </span>
                        </div>
                      </div>

                      {/* Resumo solicitado pelo usuário: ex: 5 de 12 mensalidades pagas, 2 de 4 competições pagas */}
                      <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                            <span className="w-2 h-2 rounded-full bg-blue-600" />
                            {resumo.mensalidadesPagasCount} de {resumo.mensalidadesTotalCount} mensalidades pagas
                          </span>
                          <span className="text-slate-300 dark:text-slate-700">·</span>
                          <span className="inline-flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                            <span className="w-2 h-2 rounded-full bg-amber-500" />
                            {resumo.competicoesPagasCount} de {resumo.competicoesTotalCount} competições pagas
                          </span>
                        </div>

                        <span className="text-xs font-bold text-blue-600 dark:text-blue-400 group-hover:underline">
                          Abrir ficha →
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: ADICIONAR / EDITAR COMPETIÇÃO OU TAXA */}
      {isModalNovaCompeticaoOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150 no-print">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 relative">
            <button
              onClick={() => setIsModalNovaCompeticaoOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <Trophy className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {itemEditando
                    ? 'Editar Competição / Taxa'
                    : tipoNovoItem === 'taxa_jogo'
                    ? 'Nova Taxa de Jogo'
                    : 'Nova Competição / Taxa'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Aparecerá para todos os atletas da categoria para marcar pago / não pago.
                </p>
              </div>
            </div>

            <form onSubmit={handleSalvarItem} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nome da Competição / Taxa *
                </label>
                <input
                  type="text"
                  required
                  value={formNome}
                  onChange={(e) => setFormNome(e.target.value)}
                  placeholder="Ex: COPA RIO, TAXA DE AMISTOSO, SPAT..."
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Valor (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formValor}
                    onChange={(e) => setFormValor(e.target.value)}
                    placeholder="150"
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Categoria Aplicável
                  </label>
                  <select
                    value={formCategoria}
                    onChange={(e) => setFormCategoria(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  >
                    <option value="TODAS">Todas Categorias</option>
                    {categorias.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalNovaCompeticaoOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-all"
                >
                  {itemEditando ? 'Salvar Alterações' : 'Salvar Competição'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDITAR VALOR DA MENSALIDADE */}
      {isModalMensalidadeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150 no-print">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 relative">
            <button
              onClick={() => setIsModalMensalidadeOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Editar Valor da Mensalidade
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {atletaAtivo
                    ? `Valor cobrado por mês de ${atletaAtivo.nome.split(' ')[0]}`
                    : 'Valor padrão por mês para os atletas'}
                </p>
              </div>
            </div>

            <form onSubmit={handleSalvarValorMensalidade} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Valor da Mensalidade (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={valorMensalidadeInput}
                  onChange={(e) => setValorMensalidadeInput(e.target.value)}
                  className="w-full px-3.5 py-2 text-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono font-bold"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalMensalidadeOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-all"
                >
                  Salvar Valor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CONFIRMAR EXCLUSÃO DE COMPETIÇÃO (SIM / NÃO) */}
      {itemParaApagar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150 no-print">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 relative">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Apagar Competição
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  {itemParaApagar.nome} ({formatarMoeda(itemParaApagar.valor)})
                </p>
              </div>
            </div>

            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 my-4">
              Tem certeza que deseja apagar esta competição?
            </p>

            <div className="grid grid-cols-2 gap-3 mt-6">
              <button
                type="button"
                onClick={() => setItemParaApagar(null)}
                className="py-2.5 px-4 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition"
              >
                NÃO
              </button>
              <button
                type="button"
                onClick={handleConfirmarExclusaoItem}
                className="py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 active:scale-98 transition shadow-xs"
              >
                SIM
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
