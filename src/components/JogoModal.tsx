import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, MapPin, Trophy, Shield, CheckCircle2 } from 'lucide-react';
import { JogoAgenda, TipoJogo } from '../types';
import { getDataAtualBrasil } from '../utils/dateUtils';

interface JogoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (jogo: JogoAgenda) => void;
  jogoEditando?: JogoAgenda | null;
  categoriasDisponiveis: string[];
  categoriaPadrao?: string;
}

export const JogoModal: React.FC<JogoModalProps> = ({
  isOpen,
  onClose,
  onSave,
  jogoEditando,
  categoriasDisponiveis,
  categoriaPadrao = 'SUB-15',
}) => {
  const [adversario, setAdversario] = useState('');
  const [dataJogo, setDataJogo] = useState('');
  const [hora, setHora] = useState('09:00');
  const [categoria, setCategoria] = useState(categoriaPadrao);
  const [local, setLocal] = useState('CT Ninho do Galo');
  const [tipo, setTipo] = useState<string>('Campeonato');
  const [placar, setPlacar] = useState('');
  const [realizado, setRealizado] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    if (!isOpen) return;

    if (jogoEditando) {
      setAdversario(jogoEditando.adversario);
      setDataJogo(jogoEditando.dataJogo);
      setHora(jogoEditando.hora || '09:00');
      setCategoria(jogoEditando.categoria || categoriaPadrao);
      setLocal(jogoEditando.local || 'Campo Master Soccer');
      setTipo(jogoEditando.tipo || 'Campeonato');
      setPlacar(jogoEditando.placar || '');
      setRealizado(Boolean(jogoEditando.realizado));
    } else {
      setAdversario('');
      setDataJogo(getDataAtualBrasil());
      setHora('09:00');
      setCategoria(categoriaPadrao);
      setLocal('CT Ninho do Galo');
      setTipo('Campeonato');
      setPlacar('');
      setRealizado(false);
    }
    setErro('');
  }, [isOpen, jogoEditando, categoriaPadrao]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adversario.trim()) {
      setErro('Por favor, informe o nome do adversário.');
      return;
    }
    if (!dataJogo.trim()) {
      setErro('Por favor, informe a data do jogo.');
      return;
    }

    const adversarioFormatado = adversario.trim().toLowerCase().startsWith('vs')
      ? adversario.trim()
      : `vs ${adversario.trim()}`;

    const novoJogo: JogoAgenda = {
      id: jogoEditando ? jogoEditando.id : `jogo-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      adversario: adversarioFormatado,
      dataJogo: dataJogo.trim(),
      hora: hora.trim() || '09:00',
      categoria,
      local: local.trim() || 'Campo Master Soccer',
      tipo: tipo.trim() || 'Campeonato',
      placar: placar.trim() || undefined,
      realizado: realizado || Boolean(placar.trim()),
      criadoEm: jogoEditando?.criadoEm || new Date().toISOString(),
      escalacao: jogoEditando?.escalacao || {},
    };

    onSave(novoJogo);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-6">
        {/* Topo do Modal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400">
              <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {jogoEditando ? 'Editar Jogo da Agenda' : 'Cadastrar Novo Jogo'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Preencha os dados da partida na agenda do clube
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {erro && (
            <div className="p-3 text-xs text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl">
              {erro}
            </div>
          )}

          {/* Adversário */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
              Adversário *
            </label>
            <input
              type="text"
              value={adversario}
              onChange={(e) => setAdversario(e.target.value)}
              placeholder="Ex: vs Brescia ou Tigres"
              className="w-full h-10 px-3.5 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              required
            />
          </div>

          {/* Data e Hora */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                Data do Jogo *
              </label>
              <input
                type="text"
                value={dataJogo}
                onChange={(e) => setDataJogo(e.target.value)}
                placeholder="Ex: 14/11/2026"
                className="w-full h-10 px-3.5 py-2 text-sm font-mono bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                Hora *
              </label>
              <input
                type="time"
                value={hora}
                onChange={(e) => setHora(e.target.value)}
                className="w-full h-10 px-3.5 py-2 text-sm font-mono bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          {/* Categoria e Tipo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                <Shield className="w-3.5 h-3.5 text-blue-600" />
                Categoria *
              </label>
              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                className="w-full h-10 px-3 py-2 text-sm font-semibold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {categoriasDisponiveis.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                <Trophy className="w-3.5 h-3.5 text-amber-500" />
                Tipo de Jogo *
              </label>
              <input
                type="text"
                list="tipos-jogo-opcoes"
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
                placeholder="Ex: Campeonato, Amistoso, Torneio, Copa..."
                className="w-full h-10 px-3 py-2 text-sm font-semibold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <datalist id="tipos-jogo-opcoes">
                <option value="Campeonato">Campeonato</option>
                <option value="Amistoso">Amistoso</option>
                <option value="Torneio">Torneio</option>
                <option value="Copa">Copa</option>
                <option value="Festival">Festival</option>
                <option value="Jogo-Treino">Jogo-Treino</option>
              </datalist>
            </div>
          </div>

          {/* Local / Campo */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-blue-600" />
              Local / Campo
            </label>
            <input
              type="text"
              value={local}
              onChange={(e) => setLocal(e.target.value)}
              placeholder="Ex: CT Ninho do Galo, Campo 1, Estádio Municipal"
              className="w-full h-10 px-3.5 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Status de Realizado & Placar */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2.5">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={realizado}
                onChange={(e) => setRealizado(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 accent-blue-600 focus:ring-blue-500"
              />
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Este jogo já aconteceu (Jogo Realizado)
              </span>
            </label>

            {realizado && (
              <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700 space-y-1">
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                  Placar Final (Opcional):
                </label>
                <input
                  type="text"
                  value={placar}
                  onChange={(e) => setPlacar(e.target.value)}
                  placeholder="Ex: 2 x 1 ou V 3x0"
                  className="w-full h-9 px-3 py-1.5 text-xs font-mono font-bold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}
          </div>

          {/* Botões */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-98 rounded-lg shadow-xs transition-all flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4 text-amber-300" />
              <span>{jogoEditando ? 'Salvar Alterações' : 'Salvar Jogo'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
