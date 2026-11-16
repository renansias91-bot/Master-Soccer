import React, { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  FileCheck2,
  FileText,
  Printer,
  Search,
  UserCheck,
  X,
} from 'lucide-react';
import { Atleta } from '../types';
import { formatarDataExibicao } from '../utils/dateUtils';
import { obterIniciaisApelido } from '../utils/apelidoUtils';
import { MasterSoccerEscudo } from './MasterSoccerEscudo';

interface DocumentosViewProps {
  atletas: Atleta[];
  categorias: string[];
  onAtualizarDocumento: (
    atletaId: string,
    campo: 'docAtestadoOk' | 'docRgAutenticadaOk',
    valor: boolean
  ) => Promise<void> | void;
}

type FiltroStatusDocs = 'todas' | 'pendente' | 'ok';

export const DocumentosView: React.FC<DocumentosViewProps> = ({
  atletas,
  categorias,
  onAtualizarDocumento,
}) => {
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>('TODAS');
  const [buscaNome, setBuscaNome] = useState('');
  const [statusFiltro, setStatusFiltro] = useState<FiltroStatusDocs>('todas');
  const [atletaExpandidoId, setAtletaExpandidoId] = useState<string | null>(null);

  // Modal de Autorização de Viagem
  const [atletaAutorizacao, setAtletaAutorizacao] = useState<Atleta | null>(null);
  const [modoModal, setModoModal] = useState<'form' | 'print'>('form');
  const [destino, setDestino] = useState('');
  const [dataIda, setDataIda] = useState('');
  const [dataVolta, setDataVolta] = useState('');
  const [responsavel, setResponsavel] = useState('');
  const [cpfResponsavel, setCpfResponsavel] = useState('');
  const [motivo, setMotivo] = useState('');
  const [erroForm, setErroForm] = useState('');

  const categoriasLimpas = useMemo(() => {
    const base =
      categorias && categorias.length > 0 ? categorias : ['SUB-15', 'SUB-16', 'SUB-17'];
    return base.filter(
      (c) => c.trim().toUpperCase() !== 'GERAL' && c.trim().toUpperCase() !== 'TODOS'
    );
  }, [categorias]);

  const isAtletaDocsOk = (atleta: Atleta) =>
    Boolean(atleta.docAtestadoOk) && Boolean(atleta.docRgAutenticadaOk);

  // Atletas filtrados por categoria + busca (antes do filtro de status, para calcular contadores)
  const atletasBaseFiltrados = useMemo(() => {
    const termo = buscaNome.trim().toLowerCase();
    return atletas
      .filter((a) => {
        if (categoriaFiltro !== 'TODAS' && a.categoria !== categoriaFiltro) return false;
        if (!termo) return true;
        const nome = (a.nome || '').toLowerCase();
        const nomeCompleto = (a.nomeCompleto || '').toLowerCase();
        const apelido = (a.apelido || '').toLowerCase();
        return (
          nome.includes(termo) || nomeCompleto.includes(termo) || apelido.includes(termo)
        );
      })
      .sort((a, b) =>
        (a.nomeCompleto || a.nome).localeCompare(b.nomeCompleto || b.nome, 'pt-BR')
      );
  }, [atletas, categoriaFiltro, buscaNome]);

  const contadores = useMemo(() => {
    let okCount = 0;
    let pendenteCount = 0;
    for (const a of atletasBaseFiltrados) {
      if (isAtletaDocsOk(a)) okCount++;
      else pendenteCount++;
    }
    return {
      todas: atletasBaseFiltrados.length,
      pendente: pendenteCount,
      ok: okCount,
    };
  }, [atletasBaseFiltrados]);

  const atletasExibidos = useMemo(() => {
    if (statusFiltro === 'todas') return atletasBaseFiltrados;
    if (statusFiltro === 'ok') return atletasBaseFiltrados.filter(isAtletaDocsOk);
    return atletasBaseFiltrados.filter((a) => !isAtletaDocsOk(a));
  }, [atletasBaseFiltrados, statusFiltro]);

  const handleAbrirAutorizacao = (atleta: Atleta) => {
    setAtletaAutorizacao(atleta);
    setModoModal('form');
    setDestino('');
    setDataIda('');
    setDataVolta('');
    setResponsavel(atleta.nomeResponsavel || '');
    setCpfResponsavel('');
    setMotivo('');
    setErroForm('');
  };

  const handleFecharModal = () => {
    setAtletaAutorizacao(null);
    setErroForm('');
  };

  const handleGerarEImprimir = (e: React.FormEvent) => {
    e.preventDefault();
    if (!destino.trim()) {
      setErroForm('Informe o destino da viagem.');
      return;
    }
    if (!dataIda) {
      setErroForm('Informe a data de ida.');
      return;
    }
    if (!dataVolta) {
      setErroForm('Informe a data de volta.');
      return;
    }
    if (!responsavel.trim()) {
      setErroForm('Informe o nome do responsável que autoriza.');
      return;
    }

    setErroForm('');
    setModoModal('print');
    setTimeout(() => {
      window.print();
    }, 250);
  };

  const nomeExibicaoAtleta = (a: Atleta) => (a.nomeCompleto || a.nome || '').trim();

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* Cabeçalho */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400">
            <FileCheck2 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
              Documentos dos Atletas
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Controle rápido de Atestado Médico, RG Autenticada e Autorização de Viagem
            </p>
          </div>
        </div>
      </div>

      {/* 1. Filtro por Categoria (botões grandes fáceis de tocar no celular) */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setCategoriaFiltro('TODAS')}
          className={`min-h-[40px] px-4 py-2 rounded-xl text-[14px] font-bold transition-all cursor-pointer shadow-2xs active:scale-98 ${
            categoriaFiltro === 'TODAS'
              ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-400/40'
              : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
          }`}
          style={categoriaFiltro === 'TODAS' ? { backgroundColor: '#2563eb', color: '#ffffff' } : {}}
        >
          Todas
        </button>

        {categoriasLimpas.map((cat) => {
          const ativo = categoriaFiltro === cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setCategoriaFiltro(cat)}
              className={`min-h-[40px] px-4 py-2 rounded-xl text-[14px] font-bold transition-all cursor-pointer shadow-2xs active:scale-98 ${
                ativo
                  ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-400/40'
                  : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
              }`}
              style={ativo ? { backgroundColor: '#2563eb', color: '#ffffff' } : {}}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* 2. Busca por nome + Filtro Rápido (Todas / Pendente / OK) */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={buscaNome}
            onChange={(e) => setBuscaNome(e.target.value)}
            placeholder="Buscar atleta pelo nome ou apelido..."
            className="w-full pl-10 pr-10 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
          />
          {buscaNome && (
            <button
              type="button"
              onClick={() => setBuscaNome('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              aria-label="Limpar busca"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filtro Rápido: Todas / Pendente / OK */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setStatusFiltro('todas')}
            className={`min-h-[38px] px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer border ${
              statusFiltro === 'todas'
                ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 dark:border-white shadow-xs'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            Todas ({contadores.todas})
          </button>

          <button
            type="button"
            onClick={() => setStatusFiltro('pendente')}
            className={`min-h-[38px] px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer border inline-flex items-center gap-1.5 ${
              statusFiltro === 'pendente'
                ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                : 'bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800/60 hover:bg-amber-100'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Pendente ({contadores.pendente})</span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFiltro('ok')}
            className={`min-h-[38px] px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer border inline-flex items-center gap-1.5 ${
              statusFiltro === 'ok'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                : 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-100'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>OK ({contadores.ok})</span>
          </button>
        </div>
      </div>

      {/* 3. Lista de Atletas */}
      {atletasExibidos.length === 0 ? (
        <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-sm font-medium">
          Nenhum atleta encontrado para os filtros selecionados.
        </div>
      ) : (
        <div className="space-y-3">
          {atletasExibidos.map((atleta) => {
            const expandido = atletaExpandidoId === atleta.id;
            const atestadoOk = Boolean(atleta.docAtestadoOk);
            const rgOk = Boolean(atleta.docRgAutenticadaOk);
            const todosOk = atestadoOk && rgOk;
            const iniciais = obterIniciaisApelido(atleta);

            return (
              <div
                key={atleta.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden transition-all"
              >
                {/* Linha principal clicável */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() =>
                    setAtletaExpandidoId((prev) => (prev === atleta.id ? null : atleta.id))
                  }
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setAtletaExpandidoId((prev) => (prev === atleta.id ? null : atleta.id));
                    }
                  }}
                  className="w-full p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors cursor-pointer text-left"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Foto / Iniciais */}
                    <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-center font-extrabold text-xs text-blue-700 dark:text-blue-300 overflow-hidden shrink-0">
                      {atleta.fotoUrl ? (
                        <img
                          src={atleta.fotoUrl}
                          alt={atleta.nome}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        iniciais
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white truncate">
                          {nomeExibicaoAtleta(atleta)}
                        </span>
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 shrink-0">
                          {atleta.categoria || 'Sem categoria'}
                        </span>
                        <span
                          className={`text-[11px] font-black px-2 py-0.5 rounded-md border shrink-0 ${
                            todosOk
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-800'
                              : 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/70 dark:text-amber-300 dark:border-amber-800'
                          }`}
                        >
                          {todosOk ? 'OK' : 'PENDENTE'}
                        </span>
                      </div>

                      {atleta.apelido &&
                        atleta.apelido.trim().toLowerCase() !==
                          nomeExibicaoAtleta(atleta).toLowerCase() && (
                          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                            Apelido: {atleta.apelido}
                          </div>
                        )}
                    </div>
                  </div>

                  {/* Ações à direita: + Autorização de Viagem + Seta expandir */}
                  <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAbrirAutorizacao(atleta);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-extrabold bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800 transition-all cursor-pointer active:scale-98"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>+ Autorização de Viagem</span>
                    </button>

                    <div className="p-1.5 rounded-lg text-slate-400 dark:text-slate-500">
                      {expandido ? (
                        <ChevronUp className="w-5 h-5" />
                      ) : (
                        <ChevronDown className="w-5 h-5" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Conteúdo Expandido: SOMENTE 2 documentos, sem upload */}
                {expandido && (
                  <div className="px-4 pb-4 pt-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/30 space-y-2.5 animate-in fade-in duration-150">
                    {/* 1. Atestado Médico */}
                    <div className="flex items-center justify-between gap-3 p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                            atestadoOk ? 'bg-emerald-500' : 'bg-amber-500'
                          }`}
                        />
                        <div>
                          <div className="text-sm font-extrabold text-slate-900 dark:text-white">
                            Atestado Médico
                          </div>
                          <span
                            className={`inline-block mt-0.5 text-[11px] font-black px-2 py-0.5 rounded-md border ${
                              atestadoOk
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-800'
                                : 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/70 dark:text-amber-300 dark:border-amber-800'
                            }`}
                          >
                            {atestadoOk ? 'OK' : 'PENDENTE'}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          onAtualizarDocumento(atleta.id, 'docAtestadoOk', !atestadoOk)
                        }
                        className={`min-h-[40px] px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer active:scale-95 border shrink-0 ${
                          atestadoOk
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600 shadow-xs'
                            : 'bg-amber-500 hover:bg-amber-600 text-white border-amber-500 shadow-xs'
                        }`}
                      >
                        {atestadoOk ? '✓ OK (Tocar p/ Pendente)' : 'Marcar como OK'}
                      </button>
                    </div>

                    {/* 2. RG Autenticada */}
                    <div className="flex items-center justify-between gap-3 p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                            rgOk ? 'bg-emerald-500' : 'bg-amber-500'
                          }`}
                        />
                        <div>
                          <div className="text-sm font-extrabold text-slate-900 dark:text-white">
                            RG Autenticada
                          </div>
                          <span
                            className={`inline-block mt-0.5 text-[11px] font-black px-2 py-0.5 rounded-md border ${
                              rgOk
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-800'
                                : 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/70 dark:text-amber-300 dark:border-amber-800'
                            }`}
                          >
                            {rgOk ? 'OK' : 'PENDENTE'}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          onAtualizarDocumento(atleta.id, 'docRgAutenticadaOk', !rgOk)
                        }
                        className={`min-h-[40px] px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer active:scale-95 border shrink-0 ${
                          rgOk
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600 shadow-xs'
                            : 'bg-amber-500 hover:bg-amber-600 text-white border-amber-500 shadow-xs'
                        }`}
                      >
                        {rgOk ? '✓ OK (Tocar p/ Pendente)' : 'Marcar como OK'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Formulário de Autorização de Viagem */}
      {atletaAutorizacao &&
        modoModal === 'form' &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/65 backdrop-blur-xs animate-in fade-in duration-150 no-print">
            <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
              {/* Topo do Modal */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 shrink-0">
                <div className="flex items-center gap-2.5">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                    Autorização de Viagem
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={handleFecharModal}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-800 transition cursor-pointer"
                  aria-label="Fechar"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form
                onSubmit={handleGerarEImprimir}
                className="p-5 space-y-4 overflow-y-auto"
              >
                {/* Aviso caso esteja PENDENTE nos documentos */}
                {!isAtletaDocsOk(atletaAutorizacao) && (
                  <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 flex items-start gap-2.5">
                    <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-sm font-black text-amber-900 dark:text-amber-200">
                        Atleta com documento pendente
                      </div>
                      <div className="text-xs font-medium text-amber-800 dark:text-amber-300 mt-0.5">
                        Pendência em:{' '}
                        {[
                          !atletaAutorizacao.docAtestadoOk ? 'Atestado Médico' : null,
                          !atletaAutorizacao.docRgAutenticadaOk ? 'RG Autenticada' : null,
                        ]
                          .filter(Boolean)
                          .join(' e ')}
                        .
                      </div>
                    </div>
                  </div>
                )}

                {/* Atleta (preenchido automático) */}
                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                    Atleta
                  </label>
                  <div className="w-full px-3.5 py-2.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <UserCheck className="w-4 h-4 text-blue-600 shrink-0" />
                      <span className="text-sm font-extrabold text-slate-900 dark:text-white truncate">
                        {nomeExibicaoAtleta(atletaAutorizacao)}
                      </span>
                    </div>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700 shrink-0">
                      {atletaAutorizacao.categoria || 'Sem categoria'}
                    </span>
                  </div>
                </div>

                {/* Destino da Viagem */}
                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                    Destino da Viagem *
                  </label>
                  <input
                    type="text"
                    value={destino}
                    onChange={(e) => setDestino(e.target.value)}
                    placeholder="Ex: Saquarema - RJ"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Data de Ida e Data de Volta */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                      Data de Ida *
                    </label>
                    <input
                      type="date"
                      value={dataIda}
                      onChange={(e) => setDataIda(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                      Data de Volta / Até *
                    </label>
                    <input
                      type="date"
                      value={dataVolta}
                      onChange={(e) => setDataVolta(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Responsável / Quem autoriza */}
                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                    Responsável / Quem autoriza *
                  </label>
                  <input
                    type="text"
                    value={responsavel}
                    onChange={(e) => setResponsavel(e.target.value)}
                    placeholder="Nome completo do pai, mãe ou responsável"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* CPF do Responsável (opcional) */}
                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                    CPF do Responsável (opcional)
                  </label>
                  <input
                    type="text"
                    value={cpfResponsavel}
                    onChange={(e) => setCpfResponsavel(e.target.value)}
                    placeholder="Ex: 000.000.000-00 (se não preencher, fica em branco)"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Motivo / Competição */}
                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                    Motivo / Competição
                  </label>
                  <input
                    type="text"
                    value={motivo}
                    onChange={(e) => setMotivo(e.target.value)}
                    placeholder="Ex: Campeonato, Amistoso"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {erroForm && (
                  <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs font-bold text-red-700 dark:text-red-300">
                    {erroForm}
                  </div>
                )}

                <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={handleFecharModal}
                    className="px-4 py-2.5 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-extrabold hover:bg-blue-700 transition shadow-sm cursor-pointer active:scale-98"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Gerar e Imprimir</span>
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

      {/* Visualização e Impressão da Autorização de Viagem */}
      {atletaAutorizacao &&
        modoModal === 'print' &&
        createPortal(
          <div className="print-modal-root fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="print-modal-card relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[94vh]">
              {/* Barra de ações (oculta na impressão) */}
              <div className="no-print flex flex-wrap items-center justify-between gap-2 px-4 sm:px-5 py-3.5 border-b border-slate-200 bg-slate-50 shrink-0">
                <button
                  type="button"
                  onClick={() => setModoModal('form')}
                  className="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 transition cursor-pointer"
                >
                  ← Editar Dados
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold hover:bg-blue-700 transition shadow-xs cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Imprimir / Salvar PDF</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleFecharModal}
                    className="p-2 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-200/70 transition cursor-pointer"
                    aria-label="Fechar"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Folha Imprimível */}
              <div className="print-modal-scroll overflow-y-auto p-6 sm:p-10 bg-white text-slate-900">
                <div className="print-page max-w-2xl mx-auto space-y-7">
                  {/* Cabeçalho Oficial */}
                  <div className="flex items-center justify-between pb-5 border-b-2 border-slate-900">
                    <div className="flex items-center gap-3.5">
                      <MasterSoccerEscudo size={52} />
                      <div>
                        <div className="text-lg sm:text-xl font-black tracking-tight text-slate-900 uppercase">
                          Master Soccer RJ
                        </div>
                        <div className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                          Departamento de Futebol de Base
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-black uppercase tracking-widest text-slate-500">
                        Documento Oficial
                      </div>
                      <div className="text-sm sm:text-base font-black text-slate-900 uppercase">
                        Autorização de Viagem
                      </div>
                    </div>
                  </div>

                  {/* Quadro Resumo */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-xl border border-slate-300 bg-slate-50 text-sm">
                    <div>
                      <span className="text-[11px] font-bold uppercase text-slate-500 block">
                        Atleta
                      </span>
                      <span className="font-extrabold text-slate-900">
                        {nomeExibicaoAtleta(atletaAutorizacao)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] font-bold uppercase text-slate-500 block">
                        Categoria
                      </span>
                      <span className="font-extrabold text-slate-900">
                        {atletaAutorizacao.categoria || 'Sem categoria'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] font-bold uppercase text-slate-500 block">
                        Destino da Viagem
                      </span>
                      <span className="font-extrabold text-slate-900">{destino.trim()}</span>
                    </div>
                    <div>
                      <span className="text-[11px] font-bold uppercase text-slate-500 block">
                        Período
                      </span>
                      <span className="font-extrabold text-slate-900">
                        {formatarDataExibicao(dataIda)} a {formatarDataExibicao(dataVolta)}
                      </span>
                    </div>
                    {motivo.trim() && (
                      <div className="sm:col-span-2">
                        <span className="text-[11px] font-bold uppercase text-slate-500 block">
                          Motivo / Competição
                        </span>
                        <span className="font-extrabold text-slate-900">{motivo.trim()}</span>
                      </div>
                    )}
                  </div>

                  {/* Texto de Autorização */}
                  <div className="py-3 text-base sm:text-lg leading-relaxed text-slate-900 font-medium text-justify">
                    Eu autorizo o atleta{' '}
                    <strong className="font-black">
                      {nomeExibicaoAtleta(atletaAutorizacao)}
                    </strong>{' '}
                    a viajar para <strong className="font-black">{destino.trim()}</strong> no
                    período de{' '}
                    <strong className="font-black">{formatarDataExibicao(dataIda)}</strong> a{' '}
                    <strong className="font-black">{formatarDataExibicao(dataVolta)}</strong>
                    {motivo.trim() ? (
                      <>
                        , para participação em{' '}
                        <strong className="font-black">{motivo.trim()}</strong>
                      </>
                    ) : null}
                    .
                  </div>

                  {/* Área em branco para assinatura à caneta no papel (sem assinatura digital no celular) */}
                  <div className="pt-8 mt-6 border-t border-slate-300 space-y-6 text-sm text-slate-900 print-break-inside-avoid">
                    <div className="space-y-2">
                      <div>
                        <span className="font-bold">Nome do Responsável:</span>{' '}
                        <span className="font-extrabold">{responsavel.trim()}</span>
                      </div>

                      <div>
                        <span className="font-bold">CPF do Responsável:</span>{' '}
                        {cpfResponsavel.trim() ? (
                          <span className="font-extrabold">{cpfResponsavel.trim()}</span>
                        ) : (
                          <span className="inline-block w-56 border-b border-slate-800 align-bottom h-4" />
                        )}
                      </div>
                    </div>

                    <div className="pt-8">
                      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
                        <div className="flex-1">
                          <div className="border-b border-slate-900 h-8 w-full" />
                          <div className="text-xs font-bold text-slate-700 mt-1.5">
                            Assinatura do Responsável
                          </div>
                        </div>

                        <div className="w-52 shrink-0">
                          <div className="text-sm font-bold text-slate-900">
                            Data: ____ / ____ / ________
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
