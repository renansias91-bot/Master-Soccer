import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  Plus,
  Check,
  Edit2,
  Trash2,
  ArrowLeft,
  Calendar,
  Trophy,
  Search,
  X,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  Atleta,
  ItemCompeticaoTaxa,
  RegistroFinanceiroAtleta,
  MesAno,
  MESES_DO_ANO,
} from '../types';
import {
  storageService,
  normalizarCompeticao,
  normalizarRegistroFinanceiro,
} from '../services/storage';
import { firebaseService } from '../services/firebase';

const STORAGE_KEY_FINANCEIRO_CATEGORIA = 'mastersoccer_financeiro_categoria_v1';

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
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>(() => {
    try {
      return (
        localStorage.getItem(STORAGE_KEY_FINANCEIRO_CATEGORIA) ||
        sessionStorage.getItem(STORAGE_KEY_FINANCEIRO_CATEGORIA) ||
        'TODAS'
      );
    } catch {
      return 'TODAS';
    }
  });
  const [abaCategoriaAberta, setAbaCategoriaAberta] = useState<boolean>(false);
  const [busca, setBusca] = useState<string>('');
  const [atletaSelecionadoId, setAtletaSelecionadoId] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_FINANCEIRO_CATEGORIA, categoriaFiltro);
      sessionStorage.setItem(STORAGE_KEY_FINANCEIRO_CATEGORIA, categoriaFiltro);
    } catch {}
  }, [categoriaFiltro]);

  // Estados dos Modais
  const [isModalNovaCompeticaoOpen, setIsModalNovaCompeticaoOpen] = useState(false);
  const [itemEditando, setItemEditando] = useState<ItemCompeticaoTaxa | null>(null);
  const [formNome, setFormNome] = useState('');
  const [formValorInscricao, setFormValorInscricao] = useState<string>('0');
  const [formValorJogo, setFormValorJogo] = useState<string>('0');
  const [formCategoria, setFormCategoria] = useState<string>('TODAS');

  const [isModalMensalidadeOpen, setIsModalMensalidadeOpen] = useState(false);
  const [valorMensalidadeInput, setValorMensalidadeInput] = useState<string>('150');

  // Confirmação para apagar competição
  const [itemParaApagar, setItemParaApagar] = useState<ItemCompeticaoTaxa | null>(null);

  // Atleta selecionado para visão detalhada
  const atletaAtivo = atletas.find((a) => a.id === atletaSelecionadoId) || null;

  // Competições normalizadas (garante Taxa de Inscrição + Taxa de Jogo separadas)
  const competicoesNormalizadas = competicoes.map((c) => normalizarCompeticao(c));

  // Atletas da categoria selecionada (para os totais de Total Arrecadado / Total a Receber)
  const atletasDaCategoria = atletas.filter(
    (a) => categoriaFiltro === 'TODAS' || a.categoria === categoriaFiltro
  );

  // Atletas filtrados por categoria e busca
  const atletasFiltrados = atletasDaCategoria
    .filter((a) => {
      const matchBusca =
        !busca.trim() ||
        a.nome.toLowerCase().includes(busca.toLowerCase()) ||
        (a.apelido && a.apelido.toLowerCase().includes(busca.toLowerCase()));
      return matchBusca;
    })
    .sort((a, b) => a.nome.localeCompare(b.nome));

  const formatarMoeda = (val: number) => {
    return (Number(val) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  // Helper para obter registro financeiro normalizado de um atleta
  const getRegistro = (atletaId: string): RegistroFinanceiroAtleta => {
    const bruto =
      registrosFinanceiros[atletaId] ||
      storageService.getRegistroFinanceiroAtleta(atletaId);
    return normalizarRegistroFinanceiro(bruto, competicoesNormalizadas);
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

    storageService.salvarRegistroFinanceiroAtleta(novoReg);
    onAtualizarRegistro(novoReg);
    try {
      await firebaseService.salvarRegistroFinanceiroAtleta(novoReg);
    } catch (e) {
      console.warn('Erro ao salvar no Firestore (modo offline ativo):', e);
    }
  };

  // Alternar pagamento de Taxa de Inscrição do atleta
  const handleToggleInscricao = async (atletaId: string, inscricaoId: string) => {
    const regAtual = getRegistro(atletaId);
    const novasInscricoes = (regAtual.inscricoes || []).map((insc) => {
      if (insc.id !== inscricaoId) return insc;
      const novoPago = !insc.pago;
      return {
        ...insc,
        pago: novoPago,
        pagoEm: novoPago ? new Date().toISOString() : undefined,
      };
    });

    const novoReg: RegistroFinanceiroAtleta = {
      ...regAtual,
      inscricoes: novasInscricoes,
      atualizadoEm: new Date().toISOString(),
    };

    storageService.salvarRegistroFinanceiroAtleta(novoReg);
    onAtualizarRegistro(novoReg);
    try {
      await firebaseService.salvarRegistroFinanceiroAtleta(novoReg);
    } catch (e) {
      console.warn('Erro ao salvar inscrição no Firestore:', e);
    }
  };

  // Alternar pagamento de Taxa de Jogo do atleta
  const handleToggleTaxaJogo = async (atletaId: string, taxaId: string) => {
    const regAtual = getRegistro(atletaId);
    const novasTaxas = (regAtual.taxasJogo || []).map((taxa) => {
      if (taxa.id !== taxaId) return taxa;
      const novoPago = !taxa.pago;
      return {
        ...taxa,
        pago: novoPago,
        pagoEm: novoPago ? new Date().toISOString() : undefined,
      };
    });

    const novoReg: RegistroFinanceiroAtleta = {
      ...regAtual,
      taxasJogo: novasTaxas,
      atualizadoEm: new Date().toISOString(),
    };

    storageService.salvarRegistroFinanceiroAtleta(novoReg);
    onAtualizarRegistro(novoReg);
    try {
      await firebaseService.salvarRegistroFinanceiroAtleta(novoReg);
    } catch (e) {
      console.warn('Erro ao salvar taxa de jogo no Firestore:', e);
    }
  };

  // Abrir modal para nova competição (valor inicial R$ 0,00 para editar ou preencher na hora)
  const handleAbrirNovaCompeticao = () => {
    setItemEditando(null);
    setFormNome('');
    setFormValorInscricao('0');
    setFormValorJogo('0');
    setFormCategoria(
      atletaAtivo ? atletaAtivo.categoria : categoriaFiltro === 'TODAS' ? 'TODAS' : categoriaFiltro
    );
    setIsModalNovaCompeticaoOpen(true);
  };

  // Abrir modal para editar competição e suas 2 taxas (Inscrição e Taxa de Jogo)
  const handleAbrirEditarItem = (item: ItemCompeticaoTaxa) => {
    const norm = normalizarCompeticao(item);
    setItemEditando(norm);
    setFormNome(norm.nome);
    setFormValorInscricao(String(norm.valorInscricao));
    setFormValorJogo(String(norm.valorJogo));
    setFormCategoria(norm.categoria || 'TODAS');
    setIsModalNovaCompeticaoOpen(true);
  };

  // Salvar nova ou editada competição
  const handleSalvarItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNome.trim()) {
      alert('Por favor, informe o nome da competição.');
      return;
    }
    const valInscricao = Math.max(0, parseFloat(String(formValorInscricao).replace(',', '.')) || 0);
    const valJogo = Math.max(0, parseFloat(String(formValorJogo).replace(',', '.')) || 0);

    const itemSalvo: ItemCompeticaoTaxa = {
      id: itemEditando ? itemEditando.id : `comp-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      nome: formNome.trim(),
      valor: valInscricao,
      valorInscricao: valInscricao,
      valorJogo: valJogo,
      tipo: itemEditando?.tipo || 'competicao',
      categoria: formCategoria || 'TODAS',
      criadoEm: itemEditando?.criadoEm || new Date().toISOString(),
    };

    storageService.salvarCompeticao(itemSalvo);
    onAtualizarCompeticoes(storageService.getCompeticoes());

    try {
      await firebaseService.salvarCompeticao(itemSalvo);
      onExibirToast(
        itemEditando
          ? 'Competição atualizada! Novos débitos usarão os novos valores.'
          : `Competição "${itemSalvo.nome}" salva e disponível na Agenda de Jogos!`
      );
    } catch (err) {
      console.warn('Salvo localmente (offline):', err);
      onExibirToast('Competição salva no dispositivo (modo offline ativo).');
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

  // Estatísticas globais da categoria selecionada
  const estatisticasGerais = atletasDaCategoria.reduce(
    (acc, atl) => {
      const res = storageService.calcularResumoAtleta(atl, competicoesNormalizadas, getRegistro(atl.id));
      acc.totalPago += res.totalPago;
      acc.totalDevendo += res.totalDevendo;
      acc.mensalidadesPagas += res.mensalidadesPagasCount;
      acc.competicoesPagas += res.competicoesPagasCount;
      return acc;
    },
    { totalPago: 0, totalDevendo: 0, mensalidadesPagas: 0, competicoesPagas: 0 }
  );

  // Competições permanecem visíveis independentemente do filtro de categoria dos atletas
  const competicoesVisiveis = competicoesNormalizadas;

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
            const resumo = storageService.calcularResumoAtleta(atletaAtivo, competicoesNormalizadas, reg);
            const valorMensalidade =
              reg.valorMensalidadePadrao !== undefined && reg.valorMensalidadePadrao > 0
                ? reg.valorMensalidadePadrao
                : storageService.getValorMensalidadePadrao();

            const inscricoesAtleta = reg.inscricoes || [];
            const taxasJogoAtleta = reg.taxasJogo || [];
            const taxasPendentesCount =
              resumo.competicoesTotalCount - resumo.competicoesPagasCount;

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
                          {12 - resumo.mensalidadesPagasCount} mensalidades + {taxasPendentesCount} taxas pendentes
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

                {/* SEÇÃO 2 - INSCRIÇÕES & TAXAS DE JOGO SEPARADAS */}
                <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div>
                      <div className="flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-amber-500" />
                        <h3 className="text-base font-bold text-slate-900 dark:text-white">
                          SEÇÃO 2 · Inscrições & Taxas de Jogo
                        </h3>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Débitos gerados automaticamente pela escalação (Inscrição única) e avaliação em campo (Taxa de Jogo).
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleAbrirNovaCompeticao}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-98 rounded-xl shadow-xs transition-all cursor-pointer shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5 text-amber-300" />
                      <span>Cadastrar Nova Competição</span>
                    </button>
                  </div>

                  {/* 2A - INSCRIÇÕES (1 linha por competição) */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-200">
                        Inscrições ({inscricoesAtleta.length})
                      </h4>
                      <span className="text-[11px] font-semibold text-slate-500">
                        Taxa única por competição
                      </span>
                    </div>

                    {inscricoesAtleta.length === 0 ? (
                      <div className="p-5 text-center bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                        <p className="text-xs text-slate-500">
                          Nenhuma taxa de inscrição gerada ainda. Ao escalar o atleta pela 1ª vez em uma competição, a inscrição aparece aqui.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {inscricoesAtleta.map((insc) => (
                          <div
                            key={insc.id}
                            className={`p-3.5 sm:p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
                              insc.pago
                                ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800'
                                : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800'
                            }`}
                          >
                            <div className="space-y-0.5 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-black text-slate-900 dark:text-white">
                                  Taxa de Inscrição - {insc.competicaoNome}
                                </span>
                                <span
                                  className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase ${
                                    insc.pago
                                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200'
                                      : 'bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-200'
                                  }`}
                                >
                                  {insc.pago ? 'PAGO' : 'PENDENTE'}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                              <span className="text-base font-black font-mono text-slate-900 dark:text-white">
                                {formatarMoeda(insc.valor)}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleToggleInscricao(atletaAtivo.id, insc.id)}
                                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                                  insc.pago
                                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                                    : 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-100 hover:bg-emerald-600 hover:text-white'
                                }`}
                              >
                                {insc.pago ? (
                                  <>
                                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                                    <span>PAGO</span>
                                  </>
                                ) : (
                                  <span>Marcar PAGO</span>
                                )}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 2B - TAXAS DE JOGO (1 linha por jogo jogado, com data e adversário) */}
                  <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-200">
                        Taxas de Jogo ({taxasJogoAtleta.length})
                      </h4>
                      <span className="text-[11px] font-semibold text-slate-500">
                        1 cobrança por jogo escalado e avaliado
                      </span>
                    </div>

                    {taxasJogoAtleta.length === 0 ? (
                      <div className="p-5 text-center bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                        <p className="text-xs text-slate-500">
                          Nenhuma taxa de jogo gerada ainda. Só é lançada quando o atleta é escalado e avaliado na partida.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {taxasJogoAtleta.map((taxa) => (
                          <div
                            key={taxa.id}
                            className={`p-3.5 sm:p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
                              taxa.pago
                                ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800'
                                : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800'
                            }`}
                          >
                            <div className="space-y-0.5 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-black text-slate-900 dark:text-white">
                                  Taxa de Jogo - {taxa.competicaoNome}
                                </span>
                                <span
                                  className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase ${
                                    taxa.pago
                                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200'
                                      : 'bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-200'
                                  }`}
                                >
                                  {taxa.pago ? 'PAGO' : 'PENDENTE'}
                                </span>
                              </div>
                              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                                {taxa.dataJogo} · {taxa.adversario}
                              </p>
                            </div>

                            <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                              <span className="text-base font-black font-mono text-slate-900 dark:text-white">
                                {formatarMoeda(taxa.valor)}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleToggleTaxaJogo(atletaAtivo.id, taxa.id)}
                                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                                  taxa.pago
                                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                                    : 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-100 hover:bg-emerald-600 hover:text-white'
                                }`}
                              >
                                {taxa.pago ? (
                                  <>
                                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                                    <span>PAGO</span>
                                  </>
                                ) : (
                                  <span>Marcar PAGO</span>
                                )}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </>
            );
          })()}
        </div>
      ) : (
        /* VISÃO GERAL: BOTÃO NOVA COMPETIÇÃO + TOTAIS + COMPETIÇÕES + FILTRO E LISTA DE ATLETAS */
        <div className="space-y-6">
          {/* Topo: Apenas o botão azul "+ Cadastrar Nova Competição" */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleAbrirNovaCompeticao}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-all shrink-0 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-amber-300" />
              <span>Cadastrar Nova Competição</span>
            </button>
          </div>

          {/* Cards de Métricas Consolidadas da Categoria */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">
                Total Arrecadado ({categoriaFiltro === 'TODAS' ? 'Geral' : categoriaFiltro})
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
                Total a Receber ({categoriaFiltro === 'TODAS' ? 'Geral' : categoriaFiltro})
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
                Competições Ativas
              </span>
              <span className="text-xl sm:text-2xl font-black font-mono text-amber-500 tabular-nums">
                {competicoesVisiveis.length}
              </span>
              <span className="text-[11px] text-slate-500 block mt-1">
                Inscrição e Taxa de Jogo
              </span>
            </div>
          </div>

          {/* SEÇÃO DE COMPETIÇÕES CADASTRADAS (INSCRIÇÃO + TAXA DE JOGO SEPARADAS E EDITÁVEIS) */}
          <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-black uppercase tracking-tight text-slate-900 dark:text-white">
                  Competições ({competicoesVisiveis.length})
                </h3>
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                Cada competição possui Taxa de Inscrição (única) e Taxa de Jogo (por jogo) editáveis
              </span>
            </div>

            {competicoesVisiveis.length === 0 ? (
              <div className="p-6 text-center bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-xs text-slate-500">
                Nenhuma competição cadastrada ainda. Clique em <strong>Cadastrar Nova Competição</strong> ou crie um jogo na Agenda.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {competicoesVisiveis.map((comp) => (
                  <div
                    key={comp.id}
                    className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex flex-col justify-between gap-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                          {comp.categoria && comp.categoria !== 'TODAS' ? comp.categoria : 'Todas Categorias'}
                        </span>
                        <h4 className="text-sm font-black text-slate-900 dark:text-white mt-1.5 truncate">
                          {comp.nome}
                        </h4>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleAbrirEditarItem(comp)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-700 transition cursor-pointer"
                          title="Editar competição e taxas"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setItemParaApagar(comp)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                          title="Apagar competição"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/70 dark:border-slate-700/70">
                      <div className="bg-white dark:bg-slate-900 rounded-lg p-2 border border-slate-200/80 dark:border-slate-700">
                        <span className="text-[10px] font-bold uppercase text-slate-400 block">
                          Inscrição
                        </span>
                        <span className="text-xs font-black font-mono text-slate-900 dark:text-white">
                          {formatarMoeda(comp.valorInscricao)}
                        </span>
                      </div>
                      <div className="bg-white dark:bg-slate-900 rounded-lg p-2 border border-slate-200/80 dark:border-slate-700">
                        <span className="text-[10px] font-bold uppercase text-slate-400 block">
                          Taxa de Jogo
                        </span>
                        <span className="text-xs font-black font-mono text-slate-900 dark:text-white">
                          {formatarMoeda(comp.valorJogo)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Aba dobrável de Categoria (começa fechada) logo acima da busca e lista de atletas */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xs overflow-hidden">
            <button
              type="button"
              onClick={() => setAbaCategoriaAberta((prev) => !prev)}
              className="w-full px-4 py-3 flex items-center justify-between gap-2 text-left bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/70 transition cursor-pointer"
            >
              <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100">
                <span>📂</span>
                <span>Categoria:</span>
                <span className="font-black text-blue-600 dark:text-blue-400">
                  {categoriaFiltro === 'TODAS' ? 'Geral' : categoriaFiltro}
                </span>
              </div>
              {abaCategoriaAberta ? (
                <ChevronUp className="w-4 h-4 text-slate-500 shrink-0" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />
              )}
            </button>

            {abaCategoriaAberta && (
              <div className="p-3 pt-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/30">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setCategoriaFiltro('TODAS');
                      setAbaCategoriaAberta(false);
                    }}
                    className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold text-center transition-all cursor-pointer shadow-2xs ${
                      categoriaFiltro === 'TODAS'
                        ? 'bg-blue-600 text-white border border-blue-600 shadow-sm'
                        : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    Geral ({atletas.length})
                  </button>
                  {categorias.map((cat) => {
                    const totalCat = atletas.filter((a) => a.categoria === cat).length;
                    const ativo = categoriaFiltro === cat;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => {
                          setCategoriaFiltro(cat);
                          setAbaCategoriaAberta(false);
                        }}
                        className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold text-center transition-all cursor-pointer shadow-2xs ${
                          ativo
                            ? 'bg-blue-600 text-white border border-blue-600 shadow-sm'
                            : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                      >
                        {cat} ({totalCat})
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
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
                  Nenhum atleta encontrado para a categoria{' '}
                  {categoriaFiltro === 'TODAS' ? 'Geral' : categoriaFiltro}.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {atletasFiltrados.map((atleta) => {
                  const reg = getRegistro(atleta.id);
                  const resumo = storageService.calcularResumoAtleta(atleta, competicoesNormalizadas, reg);

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

                      <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                            <span className="w-2 h-2 rounded-full bg-blue-600" />
                            {resumo.mensalidadesPagasCount} de {resumo.mensalidadesTotalCount} mensalidades pagas
                          </span>
                          <span className="text-slate-300 dark:text-slate-700">·</span>
                          <span className="inline-flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                            <span className="w-2 h-2 rounded-full bg-amber-500" />
                            {resumo.competicoesPagasCount} de {resumo.competicoesTotalCount} taxas pagas
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

      {/* MODAL: CADASTRAR / EDITAR COMPETIÇÃO (COM TAXA DE INSCRIÇÃO E TAXA DE JOGO) */}
      {isModalNovaCompeticaoOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150 no-print">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 relative">
            <button
              type="button"
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
                  {itemEditando ? 'Editar Competição' : 'Cadastrar Nova Competição'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Aparecerá automaticamente na Agenda de Jogos e no controle financeiro.
                </p>
              </div>
            </div>

            <form onSubmit={handleSalvarItem} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nome da Competição *
                </label>
                <input
                  type="text"
                  required
                  value={formNome}
                  onChange={(e) => setFormNome(e.target.value)}
                  placeholder="Ex: Copa Libertadores, Copa Rio, FERJ..."
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Categoria Aplicável *
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {['TODAS', ...categorias].map((cat) => {
                    const ativa = formCategoria === cat;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setFormCategoria(cat)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                          ativa
                            ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                        }`}
                      >
                        {cat === 'TODAS' ? 'Todas Categorias' : cat}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Taxa de Inscrição (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formValorInscricao}
                    onChange={(e) => setFormValorInscricao(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Taxa de Jogo (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formValorJogo}
                    onChange={(e) => setFormValorJogo(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono font-bold"
                  />
                </div>
              </div>

              {itemEditando && (
                <p className="text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700">
                  Os novos valores valem para débitos futuros; débitos já gerados mantêm o valor anterior.
                </p>
              )}

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
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-all cursor-pointer"
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
                  {itemParaApagar.nome} (Inscrição {formatarMoeda(itemParaApagar.valorInscricao)} · Jogo {formatarMoeda(itemParaApagar.valorJogo)})
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
