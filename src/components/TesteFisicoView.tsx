import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Activity,
  Plus,
  Edit,
  Trash2,
  X,
  Play,
  Square,
  RotateCcw,
  Timer,
  CheckCircle2,
} from 'lucide-react';
import { Atleta, TesteFisicoAtleta } from '../types';
import { getDataAtualBrasil, formatarDataExibicao } from '../utils/dateUtils';

const STORAGE_KEY_TESTEFISICO_CATEGORIA = 'mastersoccer_testefisico_categoria_v1';

type AbaTesteFisico = 'velocidade' | 'salto' | 'yoyo' | 'agilidade';

interface TesteFisicoViewProps {
  atletas: Atleta[];
  testesFisicos: TesteFisicoAtleta[];
  categorias: string[];
  onSalvarTeste: (teste: TesteFisicoAtleta) => void;
  onExcluirTeste: (id: string) => void;
}

const formatarCronometro = (ms: number): string => {
  const totalCentis = Math.max(0, Math.floor(ms / 10));
  const centis = totalCentis % 100;
  const totalSegs = Math.floor(totalCentis / 100);
  const segs = totalSegs % 60;
  const mins = Math.floor(totalSegs / 60);
  return `${String(mins).padStart(2, '0')}:${String(segs).padStart(2, '0')}.${String(centis).padStart(2, '0')}`;
};

const parseNumeroOpcional = (valor: string): number | undefined => {
  const limpo = valor.replace(',', '.').trim();
  if (!limpo) return undefined;
  const num = parseFloat(limpo);
  return Number.isFinite(num) ? num : undefined;
};

export const TesteFisicoView: React.FC<TesteFisicoViewProps> = ({
  atletas,
  testesFisicos,
  categorias,
  onSalvarTeste,
  onExcluirTeste,
}) => {
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>(() => {
    try {
      const salvo =
        localStorage.getItem(STORAGE_KEY_TESTEFISICO_CATEGORIA) ||
        sessionStorage.getItem(STORAGE_KEY_TESTEFISICO_CATEGORIA);
      if (!salvo || salvo.toUpperCase() === 'GERAL' || salvo.toUpperCase() === 'TODOS') {
        return 'TODAS';
      }
      return salvo;
    } catch {
      return 'TODAS';
    }
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [testeEditando, setTesteEditando] = useState<TesteFisicoAtleta | null>(null);
  const [abaTesteAtiva, setAbaTesteAtiva] = useState<AbaTesteFisico>('velocidade');

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_TESTEFISICO_CATEGORIA, categoriaFiltro);
      sessionStorage.setItem(STORAGE_KEY_TESTEFISICO_CATEGORIA, categoriaFiltro);
    } catch {}
  }, [categoriaFiltro]);

  // Lista limpa de categorias (sem misturar "Todos / Categoria Geral")
  const categoriasLimpas = useMemo(() => {
    const base = new Set<string>(['SUB-15', 'SUB-16', 'SUB-17']);
    categorias.forEach((c) => {
      const norm = (c || '').trim();
      const upper = norm.toUpperCase();
      if (norm && upper !== 'TODAS' && upper !== 'TODOS' && upper !== 'GERAL') {
        base.add(norm);
      }
    });
    const prioridade: Record<string, number> = {
      'SUB-15': 1,
      'SUB-16': 2,
      'SUB-17': 3,
      'SUB-20': 4,
      PROFISSIONAL: 5,
    };
    return Array.from(base).sort((a, b) => {
      const pa = prioridade[a.toUpperCase()] ?? 99;
      const pb = prioridade[b.toUpperCase()] ?? 99;
      if (pa !== pb) return pa - pb;
      return a.localeCompare(b, 'pt-BR');
    });
  }, [categorias]);

  // Campos do formulário (sempre começam VAZIOS ao lançar novo teste)
  const [atletaId, setAtletaId] = useState('');
  const [dataTeste, setDataTeste] = useState(() => getDataAtualBrasil());
  const [velocidadeTent1, setVelocidadeTent1] = useState<string>('');
  const [velocidadeTent2, setVelocidadeTent2] = useState<string>('');
  const [saltoVertical, setSaltoVertical] = useState<string>('');
  const [resistenciaYoYo, setResistenciaYoYo] = useState<string>('');
  const [agilidadeSeg, setAgilidadeSeg] = useState<string>('');
  const [observacoes, setObservacoes] = useState('');
  const [avaliador, setAvaliador] = useState('Prep. Físico');
  const [erro, setErro] = useState('');

  // Cronômetros independentes por aba (Velocidade 30m, Yo-Yo, Agilidade)
  const [cronoMs, setCronoMs] = useState<Record<'velocidade' | 'yoyo' | 'agilidade', number>>({
    velocidade: 0,
    yoyo: 0,
    agilidade: 0,
  });
  const [cronoRodando, setCronoRodando] = useState<'velocidade' | 'yoyo' | 'agilidade' | null>(null);
  const cronoInicioRef = useRef<number>(0);
  const cronoBaseRef = useRef<number>(0);

  useEffect(() => {
    if (!cronoRodando) return;
    const chave = cronoRodando;
    cronoInicioRef.current = performance.now();
    cronoBaseRef.current = cronoMs[chave];

    const id = window.setInterval(() => {
      const decorrido = performance.now() - cronoInicioRef.current;
      setCronoMs((prev) => ({
        ...prev,
        [chave]: cronoBaseRef.current + decorrido,
      }));
    }, 30);

    return () => window.clearInterval(id);
  }, [cronoRodando]);

  // Para o cronômetro caso o modal seja fechado
  useEffect(() => {
    if (!isModalOpen) {
      setCronoRodando(null);
    }
  }, [isModalOpen]);

  const iniciarCronometro = (chave: 'velocidade' | 'yoyo' | 'agilidade') => {
    setCronoRodando(chave);
  };

  const pararCronometro = () => {
    if (!cronoRodando) return;
    const chave = cronoRodando;
    const decorrido = performance.now() - cronoInicioRef.current;
    setCronoMs((prev) => ({
      ...prev,
      [chave]: cronoBaseRef.current + decorrido,
    }));
    setCronoRodando(null);
  };

  const zerarCronometro = (chave: 'velocidade' | 'yoyo' | 'agilidade') => {
    if (cronoRodando === chave) {
      setCronoRodando(null);
    }
    setCronoMs((prev) => ({
      ...prev,
      [chave]: 0,
    }));
  };

  const obterSegundosCronometro = (chave: 'velocidade' | 'yoyo' | 'agilidade'): string => {
    let totalMs = cronoMs[chave];
    if (cronoRodando === chave) {
      totalMs = cronoBaseRef.current + (performance.now() - cronoInicioRef.current);
      setCronoMs((prev) => ({ ...prev, [chave]: totalMs }));
      setCronoRodando(null);
    }
    return (totalMs / 1000).toFixed(2);
  };

  // Cálculo automático da média da Velocidade 30m (Tentativa 1 e Tentativa 2)
  const mediaVelocidadeCalculada = useMemo(() => {
    const t1 = parseNumeroOpcional(velocidadeTent1);
    const t2 = parseNumeroOpcional(velocidadeTent2);
    if (t1 !== undefined && t2 !== undefined) {
      return Number(((t1 + t2) / 2).toFixed(2));
    }
    if (t1 !== undefined) return Number(t1.toFixed(2));
    if (t2 !== undefined) return Number(t2.toFixed(2));
    return undefined;
  }, [velocidadeTent1, velocidadeTent2]);

  const atletasOrdenadosParaSelecao = useMemo(() => {
    const filtrados = atletas.filter(
      (a) => categoriaFiltro === 'TODAS' || a.categoria === categoriaFiltro || a.id === atletaId
    );
    return [...filtrados].sort((a, b) =>
      (a.apelido || a.nome).localeCompare(b.apelido || b.nome, 'pt-BR')
    );
  }, [atletas, categoriaFiltro, atletaId]);

  const testesFiltrados = useMemo(
    () =>
      testesFisicos.filter(
        (t) => categoriaFiltro === 'TODAS' || t.categoria === categoriaFiltro
      ),
    [testesFisicos, categoriaFiltro]
  );

  const handleAbrirNovoTeste = (atletaPre?: Atleta) => {
    setTesteEditando(null);
    setAtletaId(atletaPre?.id || '');
    setDataTeste(getDataAtualBrasil());
    setVelocidadeTent1('');
    setVelocidadeTent2('');
    setSaltoVertical('');
    setResistenciaYoYo('');
    setAgilidadeSeg('');
    setObservacoes('');
    setAvaliador('Prep. Físico');
    setErro('');
    setAbaTesteAtiva('velocidade');
    setCronoRodando(null);
    setCronoMs({ velocidade: 0, yoyo: 0, agilidade: 0 });
    setIsModalOpen(true);
  };

  const handleAbrirEditarTeste = (teste: TesteFisicoAtleta) => {
    setTesteEditando(teste);
    setAtletaId(teste.atletaId);
    setDataTeste(formatarDataExibicao(teste.data));

    if (teste.velocidadeTentativa1 !== undefined || teste.velocidadeTentativa2 !== undefined) {
      setVelocidadeTent1(
        teste.velocidadeTentativa1 !== undefined ? String(teste.velocidadeTentativa1) : ''
      );
      setVelocidadeTent2(
        teste.velocidadeTentativa2 !== undefined ? String(teste.velocidadeTentativa2) : ''
      );
    } else if (teste.velocidade30m !== undefined) {
      setVelocidadeTent1(String(teste.velocidade30m));
      setVelocidadeTent2('');
    } else {
      setVelocidadeTent1('');
      setVelocidadeTent2('');
    }

    setSaltoVertical(teste.saltoVertical !== undefined ? String(teste.saltoVertical) : '');
    setResistenciaYoYo(teste.resistenciaYoYo !== undefined ? String(teste.resistenciaYoYo) : '');
    setAgilidadeSeg(teste.agilidadeShuttle !== undefined ? String(teste.agilidadeShuttle) : '');
    setObservacoes(teste.observacoes || '');
    setAvaliador(teste.avaliador || 'Prep. Físico');
    setErro('');
    setAbaTesteAtiva('velocidade');
    setCronoRodando(null);
    setCronoMs({ velocidade: 0, yoyo: 0, agilidade: 0 });
    setIsModalOpen(true);
  };

  const handleTrocarAbaTeste = (novaAba: AbaTesteFisico) => {
    if (cronoRodando && cronoRodando !== novaAba) {
      pararCronometro();
    }
    setAbaTesteAtiva(novaAba);
  };

  const handleSalvar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!atletaId) {
      setErro('Por favor, selecione o atleta avaliado.');
      return;
    }

    const atletaObj = atletas.find((a) => a.id === atletaId);
    const t1 = parseNumeroOpcional(velocidadeTent1);
    const t2 = parseNumeroOpcional(velocidadeTent2);
    const saltoNum = parseNumeroOpcional(saltoVertical);
    const yoyoNum = parseNumeroOpcional(resistenciaYoYo);
    const agilidadeNum = parseNumeroOpcional(agilidadeSeg);

    const novoTeste: TesteFisicoAtleta = {
      id: testeEditando ? testeEditando.id : `tf-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      atletaId,
      categoria: atletaObj?.categoria || 'SUB-15',
      data: dataTeste.trim() || getDataAtualBrasil(),
      velocidade30m: mediaVelocidadeCalculada,
      velocidadeTentativa1: t1,
      velocidadeTentativa2: t2,
      saltoVertical: saltoNum,
      resistenciaYoYo: yoyoNum,
      agilidadeShuttle: agilidadeNum,
      estatura: atletaObj?.altura,
      massaCorporal: atletaObj?.peso,
      observacoes: observacoes.trim(),
      avaliador: avaliador.trim() || 'Preparação Física',
    };

    onSalvarTeste(novoTeste);
    setCronoRodando(null);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 pb-[120px]">
      {/* Topo do Módulo */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400">
            <Activity className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
              Testes Físicos & Antropometria
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Avaliação de velocidade (30m), impulsão vertical, resistência Yo-Yo e agilidade
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => handleAbrirNovoTeste()}
          style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-extrabold hover:bg-blue-700 active:scale-98 rounded-xl shadow-xs transition-all whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4 text-amber-300" />
          <span>+ Novo Teste Físico</span>
        </button>
      </div>

      {/* 1. ABAS DE CATEGORIA GRANDES (iguais às abas de DESEMPENHO DA EQUIPE no Painel) */}
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
          Todas as Categorias
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

      {/* Lista de Atletas com Testes Físicos */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Resultados dos Atletas ({testesFiltrados.length} testes registrados)
          </span>
        </div>

        {testesFiltrados.length === 0 ? (
          <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 text-slate-500 text-sm">
            Nenhum teste físico registrado nesta categoria. Clique em "+ Novo Teste Físico".
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {testesFiltrados.map((teste) => {
              const atleta = atletas.find((a) => a.id === teste.atletaId);
              const temDuasTentativas =
                teste.velocidadeTentativa1 !== undefined &&
                teste.velocidadeTentativa2 !== undefined;

              return (
                <div
                  key={teste.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4 hover:border-blue-500/40 transition-all"
                >
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-center font-bold text-xs text-blue-700 dark:text-blue-300 overflow-hidden">
                        {atleta?.fotoUrl ? (
                          <img
                            src={atleta.fotoUrl}
                            alt={atleta.nome}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          atleta?.nome?.substring(0, 2).toUpperCase() || 'MS'
                        )}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                          {atleta?.apelido || atleta?.nome || 'Atleta'}
                        </h4>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <span className="font-semibold">{teste.categoria}</span>
                          <span>·</span>
                          <span className="font-mono">{formatarDataExibicao(teste.data)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleAbrirEditarTeste(teste)}
                        className="p-2 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                        title="Editar teste físico"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onExcluirTeste(teste.id)}
                        className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                        title="Excluir teste físico"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Grid de Índices Físicos (Velocidade 30m média, Salto Vertical, Yo-Yo, Agilidade) */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-bold">
                        VELOCIDADE 30M
                      </span>
                      <span className="text-sm font-black font-mono text-blue-600 dark:text-blue-400">
                        {teste.velocidade30m !== undefined ? `${teste.velocidade30m}s` : '-'}
                      </span>
                      {temDuasTentativas && (
                        <span className="block text-[9px] font-mono text-slate-400 mt-0.5">
                          média ({teste.velocidadeTentativa1}s / {teste.velocidadeTentativa2}s)
                        </span>
                      )}
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-bold">
                        SALTO VERTICAL
                      </span>
                      <span className="text-sm font-black font-mono text-emerald-600 dark:text-emerald-400">
                        {teste.saltoVertical !== undefined ? `${teste.saltoVertical} cm` : '-'}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-bold">
                        YO-YO
                      </span>
                      <span className="text-sm font-black font-mono text-amber-600 dark:text-amber-400">
                        {teste.resistenciaYoYo !== undefined ? `${teste.resistenciaYoYo} m` : '-'}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-bold">
                        AGILIDADE
                      </span>
                      <span className="text-sm font-black font-mono text-indigo-600 dark:text-indigo-400">
                        {teste.agilidadeShuttle !== undefined ? `${teste.agilidadeShuttle}s` : '-'}
                      </span>
                    </div>
                  </div>

                  {teste.observacoes && (
                    <p className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
                      <strong className="text-slate-700 dark:text-slate-200">Parecer: </strong>
                      {teste.observacoes}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal de Lançamento / Edição de Teste Físico (1 teste por vez com abas e cronômetro) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-2 sm:p-4 bg-slate-900/65 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-4 sm:my-6">
            {/* Cabeçalho */}
            <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50">
              <div className="flex items-center gap-2.5">
                <Activity className="w-5 h-5 text-blue-600" />
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  {testeEditando ? 'Editar Teste Físico' : 'Novo Teste Físico'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSalvar} className="p-4 sm:p-6 space-y-5">
              {erro && (
                <div className="p-3 text-xs font-bold text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl">
                  {erro}
                </div>
              )}

              {/* 2. ESCOLHER ATLETA E DATA PRIMEIRO */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Atleta Avaliado *
                  </label>
                  <select
                    value={atletaId}
                    onChange={(e) => setAtletaId(e.target.value)}
                    className="w-full h-11 px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600"
                    required
                  >
                    <option value="">Selecione o atleta...</option>
                    {atletasOrdenadosParaSelecao.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.apelido || a.nome} — {a.categoria} ({a.posicao})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Data da Avaliação *
                  </label>
                  <input
                    type="text"
                    value={dataTeste}
                    onChange={(e) => setDataTeste(e.target.value)}
                    placeholder="DD/MM/AAAA"
                    className="w-full h-11 px-3 py-2 text-sm font-mono font-bold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                    required
                  />
                </div>
              </div>

              {/* 3. ABAS DOS TESTES - UM DE CADA VEZ */}
              <div className="space-y-3">
                <span className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Escolha o teste para lançar:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(
                    [
                      { id: 'velocidade', label: 'Velocidade 30m' },
                      { id: 'salto', label: 'Salto Vertical' },
                      { id: 'yoyo', label: 'Yo-Yo' },
                      { id: 'agilidade', label: 'Agilidade' },
                    ] as { id: AbaTesteFisico; label: string }[]
                  ).map((aba) => {
                    const ativa = abaTesteAtiva === aba.id;
                    return (
                      <button
                        key={aba.id}
                        type="button"
                        onClick={() => handleTrocarAbaTeste(aba.id)}
                        style={
                          ativa
                            ? { backgroundColor: '#2563eb', color: '#ffffff' }
                            : undefined
                        }
                        className={`min-h-[44px] px-2.5 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer text-center ${
                          ativa
                            ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-400/40'
                            : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                        }`}
                      >
                        {aba.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* CONTEÚDO DA ABA ATIVA (UM TESTE POR VEZ) */}
              {abaTesteAtiva === 'velocidade' && (
                <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border-2 border-blue-200 dark:border-blue-900/60 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-blue-700 dark:text-blue-300 flex items-center gap-1.5">
                      <Timer className="w-4 h-4" />
                      Velocidade 30m — Cronômetro & 2 Tentativas
                    </span>
                  </div>

                  {/* Cronômetro Gigante no Centro */}
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 py-5 px-4 text-center shadow-2xs space-y-4">
                    <div className="text-5xl sm:text-6xl font-mono font-black tracking-tight text-slate-900 dark:text-white tabular-nums">
                      {formatarCronometro(cronoMs.velocidade)}
                    </div>

                    {/* Botões grandes INICIAR (azul), PARAR (vermelho), ZERAR */}
                    <div className="grid grid-cols-3 gap-2.5">
                      <button
                        type="button"
                        onClick={() => iniciarCronometro('velocidade')}
                        style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
                        className="min-h-[48px] px-3 py-2.5 rounded-xl text-sm font-black shadow-xs hover:opacity-95 active:scale-98 transition flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Play className="w-4 h-4 fill-current" />
                        <span>INICIAR</span>
                      </button>

                      <button
                        type="button"
                        onClick={pararCronometro}
                        style={{ backgroundColor: '#dc2626', color: '#ffffff' }}
                        className="min-h-[48px] px-3 py-2.5 rounded-xl text-sm font-black shadow-xs hover:opacity-95 active:scale-98 transition flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Square className="w-4 h-4 fill-current" />
                        <span>PARAR</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => zerarCronometro('velocidade')}
                        className="min-h-[48px] px-3 py-2.5 rounded-xl text-sm font-black bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-white active:scale-98 transition flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <RotateCcw className="w-4 h-4" />
                        <span>ZERAR</span>
                      </button>
                    </div>

                    {/* Botões: Salvar como Tentativa 1 / Salvar como Tentativa 2 */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setVelocidadeTent1(obterSegundosCronometro('velocidade'))}
                        className="min-h-[42px] px-3 py-2 rounded-xl text-xs font-extrabold bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-800 transition cursor-pointer"
                      >
                        Salvar como Tentativa 1
                      </button>
                      <button
                        type="button"
                        onClick={() => setVelocidadeTent2(obterSegundosCronometro('velocidade'))}
                        className="min-h-[42px] px-3 py-2 rounded-xl text-xs font-extrabold bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-800 transition cursor-pointer"
                      >
                        Salvar como Tentativa 2
                      </button>
                    </div>
                  </div>

                  {/* Tentativa 1 e Tentativa 2 (começam VAZIOS) */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Tentativa 1 (seg)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={velocidadeTent1}
                        onChange={(e) => setVelocidadeTent1(e.target.value)}
                        placeholder="Ex: 3.92"
                        className="w-full h-11 px-3 py-2 text-sm font-mono font-bold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Tentativa 2 (seg)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={velocidadeTent2}
                        onChange={(e) => setVelocidadeTent2(e.target.value)}
                        placeholder="Ex: 3.98"
                        className="w-full h-11 px-3 py-2 text-sm font-mono font-bold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                    </div>
                  </div>

                  {/* Média Automática */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800">
                    <div>
                      <span className="text-xs font-extrabold uppercase text-blue-800 dark:text-blue-300 block">
                        Média Automática (Resultado Oficial)
                      </span>
                      <span className="text-[11px] text-blue-700/80 dark:text-blue-400">
                        Calculada automaticamente pelas tentativas lançadas
                      </span>
                    </div>
                    <span className="text-xl font-mono font-black text-blue-700 dark:text-blue-300">
                      {mediaVelocidadeCalculada !== undefined
                        ? `${mediaVelocidadeCalculada.toFixed(2)}s`
                        : '-'}
                    </span>
                  </div>
                </div>
              )}

              {abaTesteAtiva === 'salto' && (
                <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border-2 border-blue-200 dark:border-blue-900/60 space-y-3">
                  <span className="block text-xs font-black uppercase tracking-wider text-blue-700 dark:text-blue-300">
                    Salto Vertical — Teste Único
                  </span>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Salto Vertical (cm)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      value={saltoVertical}
                      onChange={(e) => setSaltoVertical(e.target.value)}
                      placeholder="Digite a altura em cm (ex: 46)"
                      className="w-full h-12 px-3.5 py-2 text-base font-mono font-bold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                </div>
              )}

              {abaTesteAtiva === 'yoyo' && (
                <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border-2 border-blue-200 dark:border-blue-900/60 space-y-4">
                  <span className="text-xs font-black uppercase tracking-wider text-blue-700 dark:text-blue-300 flex items-center gap-1.5">
                    <Timer className="w-4 h-4" />
                    Resistência Yo-Yo — Cronômetro & Distância
                  </span>

                  {/* Cronômetro para controle de tempo do teste Yo-Yo */}
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 py-4 px-4 text-center shadow-2xs space-y-3">
                    <div className="text-4xl sm:text-5xl font-mono font-black tracking-tight text-slate-900 dark:text-white tabular-nums">
                      {formatarCronometro(cronoMs.yoyo)}
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => iniciarCronometro('yoyo')}
                        style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
                        className="min-h-[44px] px-3 py-2 rounded-xl text-xs sm:text-sm font-black shadow-xs hover:opacity-95 active:scale-98 transition flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Play className="w-4 h-4 fill-current" />
                        <span>INICIAR</span>
                      </button>
                      <button
                        type="button"
                        onClick={pararCronometro}
                        style={{ backgroundColor: '#dc2626', color: '#ffffff' }}
                        className="min-h-[44px] px-3 py-2 rounded-xl text-xs sm:text-sm font-black shadow-xs hover:opacity-95 active:scale-98 transition flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Square className="w-4 h-4 fill-current" />
                        <span>PARAR</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => zerarCronometro('yoyo')}
                        className="min-h-[44px] px-3 py-2 rounded-xl text-xs sm:text-sm font-black bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-white active:scale-98 transition flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <RotateCcw className="w-4 h-4" />
                        <span>ZERAR</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Resistência Yo-Yo (m)
                    </label>
                    <input
                      type="number"
                      step="10"
                      value={resistenciaYoYo}
                      onChange={(e) => setResistenciaYoYo(e.target.value)}
                      placeholder="Digite a distância em metros (ex: 1400)"
                      className="w-full h-12 px-3.5 py-2 text-base font-mono font-bold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                </div>
              )}

              {abaTesteAtiva === 'agilidade' && (
                <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border-2 border-blue-200 dark:border-blue-900/60 space-y-4">
                  <span className="text-xs font-black uppercase tracking-wider text-blue-700 dark:text-blue-300 flex items-center gap-1.5">
                    <Timer className="w-4 h-4" />
                    Agilidade — Cronômetro & Tempo
                  </span>

                  {/* Cronômetro para Agilidade */}
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 py-4 px-4 text-center shadow-2xs space-y-3">
                    <div className="text-4xl sm:text-5xl font-mono font-black tracking-tight text-slate-900 dark:text-white tabular-nums">
                      {formatarCronometro(cronoMs.agilidade)}
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => iniciarCronometro('agilidade')}
                        style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
                        className="min-h-[44px] px-3 py-2 rounded-xl text-xs sm:text-sm font-black shadow-xs hover:opacity-95 active:scale-98 transition flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Play className="w-4 h-4 fill-current" />
                        <span>INICIAR</span>
                      </button>
                      <button
                        type="button"
                        onClick={pararCronometro}
                        style={{ backgroundColor: '#dc2626', color: '#ffffff' }}
                        className="min-h-[44px] px-3 py-2 rounded-xl text-xs sm:text-sm font-black shadow-xs hover:opacity-95 active:scale-98 transition flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Square className="w-4 h-4 fill-current" />
                        <span>PARAR</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => zerarCronometro('agilidade')}
                        className="min-h-[44px] px-3 py-2 rounded-xl text-xs sm:text-sm font-black bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-white active:scale-98 transition flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <RotateCcw className="w-4 h-4" />
                        <span>ZERAR</span>
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAgilidadeSeg(obterSegundosCronometro('agilidade'))}
                      className="w-full min-h-[42px] px-3 py-2 rounded-xl text-xs font-extrabold bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-800 transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Salvar resultado do cronômetro</span>
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Agilidade (seg)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={agilidadeSeg}
                      onChange={(e) => setAgilidadeSeg(e.target.value)}
                      placeholder="Digite o tempo em segundos (ex: 4.75)"
                      className="w-full h-12 px-3.5 py-2 text-base font-mono font-bold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                </div>
              )}

              {/* RESUMO DOS RESULTADOS EMBAIXO */}
              <div className="space-y-2">
                <span className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Resumo dos Resultados deste Lançamento
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] text-slate-500 block font-bold">
                      VELOCIDADE 30M
                    </span>
                    <span className="text-sm font-black font-mono text-blue-600 dark:text-blue-400">
                      {mediaVelocidadeCalculada !== undefined
                        ? `${mediaVelocidadeCalculada}s`
                        : '-'}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] text-slate-500 block font-bold">
                      SALTO VERTICAL
                    </span>
                    <span className="text-sm font-black font-mono text-emerald-600 dark:text-emerald-400">
                      {parseNumeroOpcional(saltoVertical) !== undefined
                        ? `${parseNumeroOpcional(saltoVertical)} cm`
                        : '-'}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] text-slate-500 block font-bold">
                      YO-YO
                    </span>
                    <span className="text-sm font-black font-mono text-amber-600 dark:text-amber-400">
                      {parseNumeroOpcional(resistenciaYoYo) !== undefined
                        ? `${parseNumeroOpcional(resistenciaYoYo)} m`
                        : '-'}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] text-slate-500 block font-bold">
                      AGILIDADE
                    </span>
                    <span className="text-sm font-black font-mono text-indigo-600 dark:text-indigo-400">
                      {parseNumeroOpcional(agilidadeSeg) !== undefined
                        ? `${parseNumeroOpcional(agilidadeSeg)}s`
                        : '-'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Parecer da Preparação Física */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Parecer da Preparação Física:
                </label>
                <textarea
                  rows={3}
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  placeholder="Observações do condicionamento, potência e índices..."
                  className="w-full p-3 text-xs sm:text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              {/* Botões finais */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
                  className="px-5 py-2.5 text-xs sm:text-sm font-black rounded-xl shadow-sm hover:opacity-95 active:scale-98 transition cursor-pointer"
                >
                  Salvar Teste Físico
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
