import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  ClipboardCheck,
  FileWarning,
  Phone,
  Plus,
  Trash2,
  UserPlus,
  X,
} from 'lucide-react';
import { CandidatoPeneira, PosicaoPeneira } from '../types';
import { formatarDataExibicao } from '../utils/dateUtils';
import { formatarTelefone } from './FormularioAtletaCadastro';

interface PeneiraViewProps {
  candidatos: CandidatoPeneira[];
  categorias: string[];
  onSalvarCandidato: (candidato: CandidatoPeneira) => Promise<void> | void;
  onExcluirCandidato: (id: string) => Promise<void> | void;
  onEntrarParaPlantel: (candidato: CandidatoPeneira) => void;
}

const POSICOES_PENEIRA: { sigla: PosicaoPeneira; label: string }[] = [
  { sigla: 'GOL', label: 'GOL · Goleiro' },
  { sigla: 'ZAG', label: 'ZAG · Zagueiro' },
  { sigla: 'LE', label: 'LE · Lat. Esquerdo' },
  { sigla: 'LD', label: 'LD · Lat. Direito' },
  { sigla: 'VOL', label: 'VOL · Volante' },
  { sigla: 'MEI', label: 'MEI · Meia' },
  { sigla: 'ATA', label: 'ATA · Atacante' },
];

const calcularCategoriaPorAno = (anoStr: string, categoriasLimpas: string[]): string => {
  const digits = anoStr.replace(/\D/g, '');
  if (digits.length !== 4) {
    return categoriasLimpas[0] || 'SUB-15';
  }
  const ano = Number(digits);
  const anoBase = new Date().getFullYear(); // ex: 2026 => 2026 - 2011 = 15 => SUB-15
  const idade = anoBase - ano;
  const desejada = `SUB-${idade}`;

  const exata = categoriasLimpas.find(
    (c) => c.trim().toUpperCase() === desejada.toUpperCase()
  );
  if (exata) return exata;

  if (idade <= 15 && categoriasLimpas.includes('SUB-15')) return 'SUB-15';
  if (idade === 16 && categoriasLimpas.includes('SUB-16')) return 'SUB-16';
  if (idade >= 17 && categoriasLimpas.includes('SUB-17')) return 'SUB-17';

  return categoriasLimpas[0] || desejada;
};

export const PeneiraView: React.FC<PeneiraViewProps> = ({
  candidatos,
  categorias,
  onSalvarCandidato,
  onExcluirCandidato,
  onEntrarParaPlantel,
}) => {
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>('TODAS');
  const [modalAberto, setModalAberto] = useState(false);
  const [candidatoParaExcluir, setCandidatoParaExcluir] = useState<CandidatoPeneira | null>(null);
  const [excluindoCandidato, setExcluindoCandidato] = useState(false);

  // Campos do formulário + Novo Teste
  const [nome, setNome] = useState('');
  const [posicao, setPosicao] = useState<PosicaoPeneira>('MEI');
  const [anoNascimento, setAnoNascimento] = useState('');
  const [categoriaPretendida, setCategoriaPretendida] = useState('SUB-15');
  const [categoriaEditadaManualmente, setCategoriaEditadaManualmente] = useState(false);
  const [dataTeste, setDataTeste] = useState(() => new Date().toISOString().split('T')[0]);
  const [telefoneResponsavel, setTelefoneResponsavel] = useState('');
  const [apresentouAtestado, setApresentouAtestado] = useState(false);
  const [observacao, setObservacao] = useState('');
  const [erroForm, setErroForm] = useState('');
  const [salvando, setSalvando] = useState(false);

  const categoriasLimpas = useMemo(() => {
    const base =
      categorias && categorias.length > 0 ? categorias : ['SUB-15', 'SUB-16', 'SUB-17'];
    return base.filter(
      (c) => c.trim().toUpperCase() !== 'GERAL' && c.trim().toUpperCase() !== 'TODOS'
    );
  }, [categorias]);

  const candidatosFiltrados = useMemo(() => {
    return candidatos
      .filter((c) => categoriaFiltro === 'TODAS' || c.categoria === categoriaFiltro)
      .sort((a, b) => (b.criadoEm || '').localeCompare(a.criadoEm || ''));
  }, [candidatos, categoriaFiltro]);

  const abrirModalNovoTeste = () => {
    setNome('');
    setPosicao('MEI');
    setAnoNascimento('');
    setCategoriaPretendida(
      categoriaFiltro !== 'TODAS' ? categoriaFiltro : categoriasLimpas[0] || 'SUB-15'
    );
    setCategoriaEditadaManualmente(false);
    setDataTeste(new Date().toISOString().split('T')[0]);
    setTelefoneResponsavel('');
    setApresentouAtestado(false);
    setObservacao('');
    setErroForm('');
    setSalvando(false);
    setModalAberto(true);
  };

  const handleAlterarAno = (valor: string) => {
    const somenteDigitos = valor.replace(/\D/g, '').slice(0, 4);
    setAnoNascimento(somenteDigitos);
    if (somenteDigitos.length === 4 && !categoriaEditadaManualmente) {
      setCategoriaPretendida(calcularCategoriaPorAno(somenteDigitos, categoriasLimpas));
    }
  };

  const handleSalvarNovoTeste = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) {
      setErroForm('Informe o Nome do Garoto.');
      return;
    }
    if (!categoriaPretendida) {
      setErroForm('Selecione a Categoria Pretendida.');
      return;
    }
    if (!dataTeste) {
      setErroForm('Informe a Data do Teste.');
      return;
    }

    const novoCandidato: CandidatoPeneira = {
      id: `pen-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      nome: nome.trim(),
      posicao,
      anoNascimento: anoNascimento.trim(),
      categoria: categoriaPretendida,
      dataTeste,
      telefoneResponsavel: telefoneResponsavel.trim(),
      apresentouAtestado,
      observacao: observacao.trim(),
      aprovado: false,
      criadoEm: new Date().toISOString(),
    };

    setSalvando(true);
    setErroForm('');
    try {
      await onSalvarCandidato(novoCandidato);
      setModalAberto(false);
    } catch {
      setErroForm('Erro ao salvar teste. Tente novamente.');
    } finally {
      setSalvando(false);
    }
  };

  const handleAprovar = async (candidato: CandidatoPeneira) => {
    await onSalvarCandidato({
      ...candidato,
      aprovado: true,
    });
  };

  const handleConfirmarExcluirCandidato = async () => {
    if (!candidatoParaExcluir || excluindoCandidato) return;
    setExcluindoCandidato(true);
    try {
      await onExcluirCandidato(candidatoParaExcluir.id);
      setCandidatoParaExcluir(null);
    } finally {
      setExcluindoCandidato(false);
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* Cabeçalho com botão grande + Novo Teste */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400">
              <ClipboardCheck className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
                Avaliação / Peneira - Teste
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Garotos em teste e peneira para avaliação nas categorias de base
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={abrirModalNovoTeste}
            className="w-full sm:w-auto min-h-[48px] px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm flex items-center justify-center gap-2 shadow-sm active:scale-98 transition-all cursor-pointer"
            style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
          >
            <Plus className="w-5 h-5" />
            <span>+ Novo Teste</span>
          </button>
        </div>
      </div>

      {/* Filtro SOMENTE por categoria (botões grandes, sem filtro de status) */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setCategoriaFiltro('TODAS')}
          className={`min-h-[44px] px-4 py-2 rounded-xl text-[14px] font-bold transition-all cursor-pointer shadow-2xs active:scale-98 ${
            categoriaFiltro === 'TODAS'
              ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-400/40'
              : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
          }`}
          style={categoriaFiltro === 'TODAS' ? { backgroundColor: '#2563eb', color: '#ffffff' } : {}}
        >
          Todas
        </button>

        {categoriasLimpas.map((cat) => {
          const ativa = categoriaFiltro === cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setCategoriaFiltro(cat)}
              className={`min-h-[44px] px-4 py-2 rounded-xl text-[14px] font-bold transition-all cursor-pointer shadow-2xs active:scale-98 ${
                ativa
                  ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-400/40'
                  : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
              }`}
              style={ativa ? { backgroundColor: '#2563eb', color: '#ffffff' } : {}}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Lista simples dos garotos em teste */}
      {candidatosFiltrados.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 text-center">
          <ClipboardCheck className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
          <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
            Nenhum garoto cadastrado para teste nesta categoria.
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Toque em "+ Novo Teste" para registrar um garoto para avaliação.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {candidatosFiltrados.map((candidato) => (
            <div
              key={candidato.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs flex flex-col justify-between gap-3.5"
            >
              <div className="space-y-2.5">
                {/* Nome, Posição e Ano/Categoria */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="text-base font-black text-slate-900 dark:text-white truncate">
                      {candidato.nome}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-black bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300">
                        {candidato.posicao}
                      </span>
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                        {candidato.anoNascimento
                          ? `${candidato.anoNascimento} · ${candidato.categoria}`
                          : candidato.categoria}
                      </span>
                    </div>
                  </div>

                  {/* Atestado Médico: SIM (verde) / NÃO (amarelo) */}
                  <span
                    className={`shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-black border ${
                      candidato.apresentouAtestado
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-800'
                        : 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/70 dark:text-amber-300 dark:border-amber-800'
                    }`}
                  >
                    {candidato.apresentouAtestado ? (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    ) : (
                      <FileWarning className="w-3.5 h-3.5" />
                    )}
                    Atestado: {candidato.apresentouAtestado ? 'SIM' : 'NÃO'}
                  </span>
                </div>

                {/* Data do Teste + Contato do Responsável */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-slate-600 dark:text-slate-300 pt-1">
                  <div className="flex items-center gap-1.5 font-semibold">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Teste: {formatarDataExibicao(candidato.dataTeste)}</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-semibold truncate">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">
                      {candidato.telefoneResponsavel || 'Sem telefone'}
                    </span>
                  </div>
                </div>

                {/* Observação (se existir) */}
                {candidato.observacao && (
                  <p className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 rounded-xl px-3 py-2">
                    <strong className="text-slate-700 dark:text-slate-200">Obs:</strong>{' '}
                    {candidato.observacao}
                  </p>
                )}
              </div>

              {/* SÓ 2 BOTÕES NO CARD: 1. Aprovar (ou Entrar para o Plantel) | 2. Excluir */}
              <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                {!candidato.aprovado ? (
                  <button
                    type="button"
                    onClick={() => handleAprovar(candidato)}
                    className="min-h-[44px] px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-2xs active:scale-98 transition-all cursor-pointer"
                    style={{ backgroundColor: '#059669', color: '#ffffff' }}
                  >
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>Aprovar</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => onEntrarParaPlantel(candidato)}
                    className="min-h-[44px] px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-2xs active:scale-98 transition-all cursor-pointer"
                    style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
                  >
                    <UserPlus className="w-4 h-4 shrink-0" />
                    <span>Entrar para o Plantel</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setCandidatoParaExcluir(candidato)}
                  className="min-h-[44px] px-3 py-2 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-950/70 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800/70 font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 active:scale-98 transition-all cursor-pointer"
                >
                  <Trash2 className="w-4 h-4 shrink-0" />
                  <span>Excluir</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal + Novo Teste */}
      {modalAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400">
                  <ClipboardCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    Novo Teste / Peneira
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Cadastro rápido de garoto para avaliação
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalAberto(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={handleSalvarNovoTeste}
              className="p-5 space-y-4 max-h-[82vh] overflow-y-auto"
              noValidate
            >
              {erroForm && (
                <div className="flex items-center gap-2 p-3 text-xs text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg font-bold">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{erroForm}</span>
                </div>
              )}

              {/* Nome do Garoto */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nome do Garoto *
                </label>
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Digite o nome do garoto"
                  className="w-full min-h-[44px] px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Posição */}
              <div>
                <span className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Posição *
                </span>
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
                  {POSICOES_PENEIRA.map((pos) => {
                    const sel = posicao === pos.sigla;
                    return (
                      <button
                        key={pos.sigla}
                        type="button"
                        title={pos.label}
                        onClick={() => setPosicao(pos.sigla)}
                        className={`min-h-[42px] px-2 py-2 rounded-xl text-xs font-black border transition cursor-pointer ${
                          sel
                            ? 'bg-blue-600 border-blue-600 text-white'
                            : 'bg-slate-50 dark:bg-slate-800/80 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200'
                        }`}
                        style={
                          sel
                            ? { backgroundColor: '#2563eb', borderColor: '#2563eb', color: '#ffffff' }
                            : {}
                        }
                      >
                        {pos.sigla}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Ano de Nascimento + Data do Teste */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Ano de Nascimento
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={anoNascimento}
                    onChange={(e) => handleAlterarAno(e.target.value)}
                    placeholder="Ex: 2011"
                    maxLength={4}
                    className="w-full min-h-[44px] px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Data do Teste *
                  </label>
                  <input
                    type="date"
                    value={dataTeste}
                    onChange={(e) => setDataTeste(e.target.value)}
                    className="w-full min-h-[44px] px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Categoria Pretendida */}
              <div>
                <span className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Categoria Pretendida *
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {categoriasLimpas.map((cat) => {
                    const sel = categoriaPretendida === cat;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => {
                          setCategoriaPretendida(cat);
                          setCategoriaEditadaManualmente(true);
                        }}
                        className={`min-h-[44px] px-3 py-2 rounded-xl text-xs font-black border transition cursor-pointer ${
                          sel
                            ? 'bg-blue-600 border-blue-600 text-white'
                            : 'bg-slate-50 dark:bg-slate-800/80 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200'
                        }`}
                        style={
                          sel
                            ? { backgroundColor: '#2563eb', borderColor: '#2563eb', color: '#ffffff' }
                            : {}
                        }
                      >
                        {cat}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Contato / Telefone do Responsável */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Contato / Telefone do Responsável
                </label>
                <input
                  type="tel"
                  inputMode="tel"
                  value={telefoneResponsavel}
                  onChange={(e) => setTelefoneResponsavel(formatarTelefone(e.target.value))}
                  placeholder="(21) 99999-9999"
                  className="w-full min-h-[44px] px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Atestado Médico Apresentou? (1 toque: SIM verde / NÃO amarelo) */}
              <div>
                <span className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Atestado Médico Apresentou?
                </span>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setApresentouAtestado(true)}
                    className={`min-h-[46px] px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black border-2 transition cursor-pointer flex items-center justify-center gap-2 ${
                      apresentouAtestado
                        ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-800/80 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                    style={
                      apresentouAtestado
                        ? { backgroundColor: '#059669', borderColor: '#059669', color: '#ffffff' }
                        : {}
                    }
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>SIM</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setApresentouAtestado(false)}
                    className={`min-h-[46px] px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black border-2 transition cursor-pointer flex items-center justify-center gap-2 ${
                      !apresentouAtestado
                        ? 'bg-amber-400 border-amber-500 text-slate-950 shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-800/80 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                    style={
                      !apresentouAtestado
                        ? { backgroundColor: '#fbbf24', borderColor: '#d97706', color: '#0f172a' }
                        : {}
                    }
                  >
                    <FileWarning className="w-4 h-4" />
                    <span>NÃO</span>
                  </button>
                </div>
              </div>

              {/* Observação */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Observação (opcional)
                </label>
                <input
                  type="text"
                  value={observacao}
                  onChange={(e) => setObservacao(e.target.value)}
                  placeholder="Ex: Veio indicado por..."
                  className="w-full min-h-[44px] px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalAberto(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvando}
                  className="min-h-[44px] px-5 py-2.5 text-xs sm:text-sm font-black text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl shadow-sm transition-all cursor-pointer"
                  style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
                >
                  {salvando ? 'Salvando...' : 'Salvar Teste'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Confirmação Obrigatória antes de Excluir Teste */}
      {candidatoParaExcluir && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 relative">
            <button
              type="button"
              onClick={() => !excluindoCandidato && setCandidatoParaExcluir(null)}
              disabled={excluindoCandidato}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Fechar"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-3">
              <div className="w-11 h-11 rounded-xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Excluir teste?
              </h3>
            </div>

            <div className="my-4 space-y-2">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 leading-snug">
                Você tem certeza que deseja excluir o teste do atleta{' '}
                <strong className="font-black">
                  {candidatoParaExcluir.nome} - {candidatoParaExcluir.posicao} -{' '}
                  {candidatoParaExcluir.categoria}
                </strong>
                ?
              </p>
              <p className="text-xs font-bold text-red-600 dark:text-red-400">
                Essa ação não pode ser desfeita.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-6">
              <button
                type="button"
                onClick={() => setCandidatoParaExcluir(null)}
                disabled={excluindoCandidato}
                className="min-h-[44px] py-2.5 px-4 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmarExcluirCandidato}
                disabled={excluindoCandidato}
                className="min-h-[44px] py-2.5 px-4 rounded-xl text-xs font-black text-white bg-red-600 hover:bg-red-700 active:scale-98 transition shadow-xs disabled:opacity-50 cursor-pointer"
                style={{ backgroundColor: '#dc2626', color: '#ffffff' }}
              >
                {excluindoCandidato ? 'Excluindo...' : 'Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
