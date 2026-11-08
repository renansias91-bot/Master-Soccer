import React, { useState, useEffect } from 'react';
import { Trophy, Plus, Trash2, X, Award, CheckCircle2 } from 'lucide-react';
import { Trofeu } from '../types';
import { storageService } from '../services/storage';

interface AbaTrofeusProps {
  trofeus?: Trofeu[];
  onSalvarTrofeu?: (trofeu: Trofeu) => void;
  onExcluirTrofeu?: (id: string | number) => void;
}

export const AbaTrofeus: React.FC<AbaTrofeusProps> = ({
  trofeus: trofeusProps,
  onSalvarTrofeu,
  onExcluirTrofeu,
}) => {
  const [trofeus, setTrofeus] = useState<Trofeu[]>(() => {
    if (trofeusProps && trofeusProps.length > 0) return trofeusProps;
    return storageService.getTrofeus();
  });

  const [mostrarForm, setMostrarForm] = useState(false);
  const [campeonato, setCampeonato] = useState('');
  const [categoria, setCategoria] = useState('');
  const [resultado, setResultado] = useState<'campeao' | 'vice'>('campeao');
  const [feedback, setFeedback] = useState<string | null>(null);

  // Sincroniza se os props mudarem
  useEffect(() => {
    if (trofeusProps) {
      setTrofeus(trofeusProps);
    }
  }, [trofeusProps]);

  const totalOuro = trofeus.filter((t) => t.resultado === 'campeao').length;
  const totalPrata = trofeus.filter((t) => t.resultado === 'vice').length;

  const salvarTrofeu = () => {
    if (!campeonato.trim() || !categoria.trim()) {
      alert('Preencha o Campeonato e a Categoria');
      return;
    }

    const novoTrofeu: Trofeu = {
      id: Date.now(),
      campeonato: campeonato.trim(),
      categoria: categoria.trim(),
      resultado,
      dataConquista: new Date().toLocaleDateString('pt-BR'),
    };

    const novaLista = [novoTrofeu, ...trofeus];
    setTrofeus(novaLista);
    storageService.salvarTrofeus(novaLista);

    if (onSalvarTrofeu) {
      onSalvarTrofeu(novoTrofeu);
    }

    setCampeonato('');
    setCategoria('');
    setResultado('campeao');
    setMostrarForm(false);

    setFeedback('✓ Troféu adicionado com sucesso à galeria!');
    setTimeout(() => setFeedback(null), 3500);
  };

  const excluirTrofeu = (id: string | number) => {
    const confirmou = window.confirm('Tem certeza que deseja excluir este troféu da galeria?');
    if (!confirmou) return;

    const novaLista = trofeus.filter((t) => String(t.id) !== String(id));
    setTrofeus(novaLista);
    storageService.salvarTrofeus(novaLista);

    if (onExcluirTrofeu) {
      onExcluirTrofeu(id);
    }
  };

  return (
    <div className="space-y-6 pb-[120px] w-full max-w-full box-border">
      {/* ========================================================= */}
      {/* CABEÇALHO DA ABA DE TROFÉUS */}
      {/* ========================================================= */}
      <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Trophy className="w-6 h-6 text-amber-500" />
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Aba de Troféus
            </h2>
          </div>
          <p className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400 mt-1">
            Treinador • Troféus conquistados
          </p>
        </div>

        <button
          onClick={() => setMostrarForm(true)}
          style={{ backgroundColor: '#1E3A5F' }}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 text-xs sm:text-sm font-bold text-white hover:opacity-95 active:scale-98 rounded-xl shadow-xs transition-all shrink-0"
        >
          <Plus className="w-4 h-4 text-amber-300" />
          <span>+ Adicionar novo troféu</span>
        </button>
      </div>

      {feedback && (
        <div className="p-3.5 text-xs sm:text-sm font-semibold text-emerald-800 dark:text-emerald-200 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 rounded-xl flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* ========================================================= */}
      {/* CARDS DE RESUMO (OURO, PRATA, TOTAL) */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* 🏆 Ouro */}
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 flex items-center gap-3.5 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-amber-200/80 dark:bg-amber-900/60 flex items-center justify-center text-2xl shrink-0 shadow-2xs">
            🏆
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
              Ouro (Campeão)
            </span>
            <div className="text-2xl font-black text-amber-950 dark:text-amber-100">
              {totalOuro} {totalOuro === 1 ? 'Título' : 'Títulos'}
            </div>
          </div>
        </div>

        {/* 🥈 Prata */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-100 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700 flex items-center gap-3.5 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-2xl shrink-0 shadow-2xs">
            🥈
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Prata (Vice)
            </span>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {totalPrata} {totalPrata === 1 ? 'Vice' : 'Vices'}
            </div>
          </div>
        </div>

        {/* Total */}
        <div className="p-4 sm:p-5 rounded-2xl bg-blue-50/80 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 flex items-center gap-3.5 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-blue-200/80 dark:bg-blue-900/60 flex items-center justify-center text-2xl shrink-0 shadow-2xs">
            🎖️
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-800 dark:text-blue-300">
              Total Geral
            </span>
            <div className="text-2xl font-black text-blue-950 dark:text-blue-100">
              {trofeus.length} {trofeus.length === 1 ? 'Conquista' : 'Conquistas'}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* FORMULÁRIO DE NOVO TROFÉU */}
      {/* ========================================================= */}
      {mostrarForm && (
        <div
          style={{ background: '#fff' }}
          className="dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border-2 border-blue-500 shadow-md space-y-4 animate-in fade-in duration-200"
        >
          <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
            <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              <span>Adicionar Novo Troféu</span>
            </h3>
            <button
              onClick={() => setMostrarForm(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
              title="Fechar formulário"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Campeonato
            </label>
            <input
              type="text"
              value={campeonato}
              onChange={(e) => setCampeonato(e.target.value)}
              placeholder="Ex: Liga Nacional 2025"
              className="w-full p-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-2xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Categoria
            </label>
            <input
              type="text"
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              placeholder="Ex: Sub-17, Profissional, Sub-20..."
              className="w-full p-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-2xs"
            />
            {/* Sugestões rápidas */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {['SUB-15', 'SUB-16', 'SUB-17', 'Sub-20', 'Profissional'].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategoria(cat)}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-blue-100 text-slate-700 dark:text-slate-300 transition"
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
              Resultado
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Botão Campeão 🏆 */}
              <button
                type="button"
                onClick={() => setResultado('campeao')}
                style={{
                  background: resultado === 'campeao' ? '#FDE68A' : '#F3F4F6',
                  border: resultado === 'campeao' ? '2px solid #F59E0B' : '2px solid #D1D5DB',
                }}
                className="p-5 rounded-2xl flex flex-col items-center justify-center transition-all cursor-pointer shadow-xs active:scale-98"
              >
                <div style={{ fontSize: 40 }} className="leading-none mb-1">
                  🏆
                </div>
                <div className="text-base font-extrabold text-slate-900">
                  <b>Campeão</b>
                </div>
                {resultado === 'campeao' && (
                  <div className="text-xs font-bold text-amber-800 mt-1">
                    ✓ Selecionado
                  </div>
                )}
              </button>

              {/* Botão Vice-Campeão 🥈 */}
              <button
                type="button"
                onClick={() => setResultado('vice')}
                style={{
                  background: resultado === 'vice' ? '#E5E7EB' : '#F3F4F6',
                  border: resultado === 'vice' ? '2px solid #6B7280' : '2px solid #D1D5DB',
                }}
                className="p-5 rounded-2xl flex flex-col items-center justify-center transition-all cursor-pointer shadow-xs active:scale-98"
              >
                <div style={{ fontSize: 40 }} className="leading-none mb-1">
                  🥈
                </div>
                <div className="text-base font-extrabold text-slate-900">
                  <b>Vice-Campeão</b>
                </div>
                {resultado === 'vice' && (
                  <div className="text-xs font-bold text-slate-700 mt-1">
                    ✓ Selecionado
                  </div>
                )}
              </button>
            </div>
          </div>

          <div className="pt-2 space-y-2">
            <button
              type="button"
              onClick={salvarTrofeu}
              style={{ background: '#1E3A5F', color: '#fff' }}
              className="w-full p-4 rounded-xl font-black text-sm tracking-wide shadow-md hover:opacity-95 active:scale-98 transition cursor-pointer"
            >
              Salvar
            </button>
            <button
              type="button"
              onClick={() => setMostrarForm(false)}
              className="w-full py-2.5 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* LISTA DE TROFÉUS CONQUISTADOS */}
      {/* ========================================================= */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
            <Award className="w-4 h-4 text-blue-600" />
            <span>Troféus conquistados</span>
          </h3>
          <span className="text-xs text-slate-500 font-semibold">
            {trofeus.length} {trofeus.length === 1 ? 'troféu' : 'troféus'}
          </span>
        </div>

        {trofeus.length === 0 ? (
          <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 text-slate-500 text-xs space-y-2">
            <div className="text-3xl">🏆</div>
            <p className="font-semibold">Nenhum troféu ainda.</p>
            <p className="text-[11px] text-slate-400">
              Clique em "+ Adicionar novo troféu" para cadastrar as conquistas do clube e do treinador.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {trofeus.map((t) => {
              const ehCampeao = t.resultado === 'campeao';
              return (
                <div
                  key={t.id}
                  style={{
                    background: '#fff',
                    borderRadius: 16,
                    padding: 16,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                  }}
                  className="dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition-all group"
                >
                  {/* Círculo do Troféu com 80px */}
                  <div
                    style={{
                      width: 80,
                      height: 80,
                      borderRadius: 40,
                      background: ehCampeao ? '#FDE68A' : '#E5E7EB',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 40,
                      flexShrink: 0,
                    }}
                    className="shadow-2xs select-none"
                  >
                    {ehCampeao ? '🏆' : '🥈'}
                  </div>

                  {/* Informações do Troféu */}
                  <div style={{ flex: 1 }} className="min-w-0 space-y-1">
                    <span
                      style={{
                        background: ehCampeao ? '#F59E0B' : '#9CA3AF',
                        color: '#fff',
                        padding: '4px 10px',
                        borderRadius: 6,
                        fontWeight: 'bold',
                        fontSize: '11px',
                        display: 'inline-block',
                      }}
                      className="uppercase tracking-wider shadow-2xs mb-1"
                    >
                      {ehCampeao ? 'CAMPEÃO' : 'VICE-CAMPEÃO'}
                    </span>
                    <p className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white truncate">
                      <b className="font-bold text-slate-500 dark:text-slate-400 mr-1 text-xs uppercase tracking-wide">
                        Campeonato:
                      </b>{' '}
                      {t.campeonato}
                    </p>
                    <p className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">
                      <b className="font-bold text-slate-500 dark:text-slate-400 mr-1 text-xs uppercase tracking-wide">
                        Categoria:
                      </b>{' '}
                      {t.categoria}
                    </p>
                  </div>

                  {/* Botão de Excluir [ X ] */}
                  <button
                    type="button"
                    onClick={() => excluirTrofeu(t.id)}
                    className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 border border-transparent hover:border-rose-200 transition-all shrink-0 cursor-pointer"
                    title="Excluir este troféu"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AbaTrofeus;
