import React, { useState, useEffect } from 'react';
import {
  Activity,
  Zap,
  TrendingUp,
  Plus,
  Edit,
  Trash2,
  Calendar,
  Shield,
  CheckCircle2,
  X,
  Award,
} from 'lucide-react';
import { Atleta, TesteFisicoAtleta } from '../types';
import { getDataAtualBrasil, formatarDataExibicao } from '../utils/dateUtils';
import { MasterSoccerEscudo } from './MasterSoccerEscudo';

const STORAGE_KEY_TESTEFISICO_CATEGORIA = 'mastersoccer_testefisico_categoria_v1';

interface TesteFisicoViewProps {
  atletas: Atleta[];
  testesFisicos: TesteFisicoAtleta[];
  categorias: string[];
  onSalvarTeste: (teste: TesteFisicoAtleta) => void;
  onExcluirTeste: (id: string) => void;
}

export const TesteFisicoView: React.FC<TesteFisicoViewProps> = ({
  atletas,
  testesFisicos,
  categorias,
  onSalvarTeste,
  onExcluirTeste,
}) => {
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>(() => {
    try {
      return (
        localStorage.getItem(STORAGE_KEY_TESTEFISICO_CATEGORIA) ||
        sessionStorage.getItem(STORAGE_KEY_TESTEFISICO_CATEGORIA) ||
        'TODAS'
      );
    } catch {
      return 'TODAS';
    }
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [testeEditando, setTesteEditando] = useState<TesteFisicoAtleta | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_TESTEFISICO_CATEGORIA, categoriaFiltro);
      sessionStorage.setItem(STORAGE_KEY_TESTEFISICO_CATEGORIA, categoriaFiltro);
    } catch {}
  }, [categoriaFiltro]);

  // Campos do formulário
  const [atletaId, setAtletaId] = useState('');
  const [dataTeste, setDataTeste] = useState(() => getDataAtualBrasil());
  const [velocidade30m, setVelocidade30m] = useState<string>('4.05');
  const [saltoVertical, setSaltoVertical] = useState<string>('45');
  const [resistenciaYoYo, setResistenciaYoYo] = useState<string>('1400');
  const [agilidadeShuttle, setAgilidadeShuttle] = useState<string>('4.75');
  const [flexibilidadeBanco, setFlexibilidadeBanco] = useState<string>('30');
  const [observacoes, setObservacoes] = useState('');
  const [avaliador, setAvaliador] = useState('Prep. Físico');
  const [erro, setErro] = useState('');

  const atletasFiltrados = atletas.filter(
    (a) => categoriaFiltro === 'TODAS' || a.categoria === categoriaFiltro
  );

  const testesFiltrados = testesFisicos.filter(
    (t) => categoriaFiltro === 'TODAS' || t.categoria === categoriaFiltro
  );

  const handleAbrirNovoTeste = (atletaPre?: Atleta) => {
    setTesteEditando(null);
    setAtletaId(atletaPre?.id || atletasFiltrados[0]?.id || atletas[0]?.id || '');
    setDataTeste(getDataAtualBrasil());
    setVelocidade30m('4.05');
    setSaltoVertical('45');
    setResistenciaYoYo('1400');
    setAgilidadeShuttle('4.75');
    setFlexibilidadeBanco('30');
    setObservacoes('');
    setAvaliador('Prep. Físico');
    setErro('');
    setIsModalOpen(true);
  };

  const handleAbrirEditarTeste = (teste: TesteFisicoAtleta) => {
    setTesteEditando(teste);
    setAtletaId(teste.atletaId);
    setDataTeste(formatarDataExibicao(teste.data));
    setVelocidade30m(teste.velocidade30m ? String(teste.velocidade30m) : '');
    setSaltoVertical(teste.saltoVertical ? String(teste.saltoVertical) : '');
    setResistenciaYoYo(teste.resistenciaYoYo ? String(teste.resistenciaYoYo) : '');
    setAgilidadeShuttle(teste.agilidadeShuttle ? String(teste.agilidadeShuttle) : '');
    setFlexibilidadeBanco(teste.flexibilidadeBanco ? String(teste.flexibilidadeBanco) : '');
    setObservacoes(teste.observacoes || '');
    setAvaliador(teste.avaliador || 'Prep. Físico');
    setErro('');
    setIsModalOpen(true);
  };

  const handleSalvar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!atletaId) {
      setErro('Por favor, selecione um atleta.');
      return;
    }

    const atletaObj = atletas.find((a) => a.id === atletaId);

    const novoTeste: TesteFisicoAtleta = {
      id: testeEditando ? testeEditando.id : `tf-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      atletaId,
      categoria: atletaObj?.categoria || 'SUB-15',
      data: dataTeste.trim() || getDataAtualBrasil(),
      velocidade30m: velocidade30m ? parseFloat(velocidade30m) : undefined,
      saltoVertical: saltoVertical ? parseFloat(saltoVertical) : undefined,
      resistenciaYoYo: resistenciaYoYo ? parseFloat(resistenciaYoYo) : undefined,
      agilidadeShuttle: agilidadeShuttle ? parseFloat(agilidadeShuttle) : undefined,
      flexibilidadeBanco: flexibilidadeBanco ? parseFloat(flexibilidadeBanco) : undefined,
      estatura: atletaObj?.altura,
      massaCorporal: atletaObj?.peso,
      observacoes: observacoes.trim(),
      avaliador: avaliador.trim() || 'Preparação Física',
    };

    onSalvarTeste(novoTeste);
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
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
              Testes Físicos & Antropometria
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Avaliação de velocidade (30m), impulsão vertical, resistência Yo-Yo e flexibilidade
            </p>
          </div>
        </div>

        <button
          onClick={() => handleAbrirNovoTeste()}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-98 rounded-xl shadow-xs transition-all whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4 text-amber-300" />
          <span>+ Novo Teste Físico</span>
        </button>
      </div>

      {/* Categorias */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
        <button
          onClick={() => setCategoriaFiltro('TODAS')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            categoriaFiltro === 'TODAS'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
          }`}
        >
          Todas as Categorias
        </button>
        {categorias.map((cat) => {
          const ativo = categoriaFiltro === cat;
          return (
            <button
              key={cat}
              onClick={() => setCategoriaFiltro(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                ativo
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
              }`}
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
          <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 text-slate-500 text-xs">
            Nenhum teste físico registrado nesta categoria. Clique em "+ Novo Teste Físico".
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {testesFiltrados.map((teste) => {
              const atleta = atletas.find((a) => a.id === teste.atletaId);
              return (
                <div
                  key={teste.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4 hover:border-blue-500/40 transition-all"
                >
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-center font-bold text-xs text-blue-700 dark:text-blue-300 overflow-hidden">
                        {atleta?.fotoUrl ? (
                          <img src={atleta.fotoUrl} alt={atleta.nome} className="w-full h-full object-cover" />
                        ) : (
                          atleta?.nome?.substring(0, 2).toUpperCase() || 'MS'
                        )}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                          {atleta?.nome || 'Atleta'}
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
                        onClick={() => handleAbrirEditarTeste(teste)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onExcluirTeste(teste.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Grid de Índices Físicos */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] text-slate-400 block font-medium">VELOCIDADE 30M</span>
                      <span className="text-sm font-bold font-mono text-blue-600 dark:text-blue-400">
                        {teste.velocidade30m ? `${teste.velocidade30m}s` : '-'}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] text-slate-400 block font-medium">SALTO VERTICAL</span>
                      <span className="text-sm font-bold font-mono text-emerald-600 dark:text-emerald-400">
                        {teste.saltoVertical ? `${teste.saltoVertical} cm` : '-'}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] text-slate-400 block font-medium">YO-YO RESISTÊNCIA</span>
                      <span className="text-sm font-bold font-mono text-amber-600 dark:text-amber-400">
                        {teste.resistenciaYoYo ? `${teste.resistenciaYoYo}m` : '-'}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] text-slate-400 block font-medium">FLEXIBILIDADE</span>
                      <span className="text-sm font-bold font-mono text-indigo-600 dark:text-indigo-400">
                        {teste.flexibilidadeBanco ? `${teste.flexibilidadeBanco} cm` : '-'}
                      </span>
                    </div>
                  </div>

                  {teste.observacoes && (
                    <p className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-850 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
                      {teste.observacoes}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal de Registro de Teste Físico */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-6">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {testeEditando ? 'Editar Teste Físico' : 'Lançar Teste Físico'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSalvar} className="p-6 space-y-4">
              {erro && (
                <div className="p-3 text-xs text-red-700 bg-red-50 rounded-xl">
                  {erro}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  Atleta Avaliado *
                </label>
                <select
                  value={atletaId}
                  onChange={(e) => setAtletaId(e.target.value)}
                  className="w-full h-10 px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-medium"
                  required
                >
                  <option value="">Selecione o atleta...</option>
                  {atletas.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.nome} — {a.categoria} ({a.posicao})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  Data da Avaliação *
                </label>
                <input
                  type="text"
                  value={dataTeste}
                  onChange={(e) => setDataTeste(e.target.value)}
                  placeholder="DD/MM/AAAA"
                  className="w-full h-10 px-3 py-2 text-sm font-mono bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Velocidade 30m (seg)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={velocidade30m}
                    onChange={(e) => setVelocidade30m(e.target.value)}
                    placeholder="Ex: 3.95"
                    className="w-full h-10 px-3 py-2 text-sm font-mono bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Salto Vertical (cm)
                  </label>
                  <input
                    type="number"
                    step="1"
                    value={saltoVertical}
                    onChange={(e) => setSaltoVertical(e.target.value)}
                    placeholder="Ex: 48"
                    className="w-full h-10 px-3 py-2 text-sm font-mono bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Resistência Yo-Yo (m)
                  </label>
                  <input
                    type="number"
                    step="10"
                    value={resistenciaYoYo}
                    onChange={(e) => setResistenciaYoYo(e.target.value)}
                    placeholder="Ex: 1400"
                    className="w-full h-10 px-3 py-2 text-sm font-mono bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Flexibilidade Banco (cm)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={flexibilidadeBanco}
                    onChange={(e) => setFlexibilidadeBanco(e.target.value)}
                    placeholder="Ex: 32"
                    className="w-full h-10 px-3 py-2 text-sm font-mono bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Parecer da Preparação Física:
                </label>
                <textarea
                  rows={3}
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  placeholder="Observações do condicionamento, potência e índices..."
                  className="w-full p-2.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl"
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
