import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, MapPin, Shield, CheckCircle2 } from 'lucide-react';
import { JogoAgenda, ItemCompeticaoTaxa } from '../types';
import { formatarDataExibicao } from '../utils/dateUtils';
import { normalizarNomeCompeticao } from '../services/storage';

interface JogoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (jogo: JogoAgenda) => void;
  jogoEditando?: JogoAgenda | null;
  categoriasDisponiveis: string[];
  categoriaPadrao?: string;
  competicoesFinanceiro?: ItemCompeticaoTaxa[];
}

const aplicarMascaraData = (valor: string): string => {
  const digitos = valor.replace(/\D/g, '').slice(0, 8);
  if (digitos.length <= 2) return digitos;
  if (digitos.length <= 4) return `${digitos.slice(0, 2)}/${digitos.slice(2)}`;
  return `${digitos.slice(0, 2)}/${digitos.slice(2, 4)}/${digitos.slice(4)}`;
};

const aplicarMascaraHora = (valor: string): string => {
  const digitos = valor.replace(/\D/g, '').slice(0, 4);
  if (digitos.length <= 2) return digitos;
  return `${digitos.slice(0, 2)}:${digitos.slice(2)}`;
};

export const JogoModal: React.FC<JogoModalProps> = ({
  isOpen,
  onClose,
  onSave,
  jogoEditando,
  categoriasDisponiveis,
  competicoesFinanceiro = [],
}) => {
  const [adversario, setAdversario] = useState('');
  const [dataJogo, setDataJogo] = useState('');
  const [hora, setHora] = useState('');
  const [categoria, setCategoria] = useState('');
  const [local, setLocal] = useState('');
  const [tipo, setTipo] = useState('');
  const [placar, setPlacar] = useState('');
  const [realizado, setRealizado] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    if (!isOpen) return;

    if (jogoEditando) {
      setAdversario(jogoEditando.adversario || '');
      setDataJogo(formatarDataExibicao(jogoEditando.dataJogo) || '');
      setHora(jogoEditando.hora || '');
      setCategoria(jogoEditando.categoria || '');
      setLocal(jogoEditando.local || '');
      setTipo(jogoEditando.tipo || '');
      setPlacar(jogoEditando.placar || '');
      setRealizado(Boolean(jogoEditando.realizado));
    } else {
      // Todos os campos abrem completamente EM BRANCO ao cadastrar novo jogo
      setAdversario('');
      setDataJogo('');
      setHora('');
      setCategoria('');
      setLocal('');
      setTipo('');
      setPlacar('');
      setRealizado(false);
    }
    setErro('');
  }, [isOpen, jogoEditando]);

  if (!isOpen) return null;

  const opcoesCategoria = Array.from(
    new Set([
      ...(categoriasDisponiveis.length > 0 ? categoriasDisponiveis : ['SUB-15', 'SUB-16', 'SUB-17']),
      ...(jogoEditando?.categoria ? [jogoEditando.categoria] : []),
    ])
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adversario.trim()) {
      setErro('Por favor, informe o nome do adversário.');
      return;
    }
    if (!/^\d{2}\/\d{2}\/\d{4}$/.test(dataJogo.trim())) {
      setErro('Por favor, informe a data completa no formato DD/MM/AAAA.');
      return;
    }
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(hora.trim())) {
      setErro('Por favor, informe a hora completa no formato HH:MM (ex: 15:30).');
      return;
    }
    if (!categoria.trim()) {
      setErro('Por favor, selecione a categoria.');
      return;
    }
    if (!tipo.trim()) {
      setErro('Por favor, informe a competição.');
      return;
    }

    const adversarioFormatado = adversario.trim().toLowerCase().startsWith('vs')
      ? adversario.trim()
      : `vs ${adversario.trim()}`;

    const novoJogo: JogoAgenda = {
      id: jogoEditando ? jogoEditando.id : `jogo-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      adversario: adversarioFormatado,
      dataJogo: dataJogo.trim(),
      hora: hora.trim(),
      categoria: categoria.trim(),
      local: local.trim(),
      tipo: tipo.trim(),
      placar: placar.trim() || undefined,
      realizado: realizado || Boolean(placar.trim()),
      criadoEm: jogoEditando?.criadoEm || new Date().toISOString(),
      escalacao: jogoEditando?.escalacao || {},
      formacao: jogoEditando?.formacao,
    };

    onSave(novoJogo);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-6">
        {/* Topo do Modal */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
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
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} noValidate className="p-5 sm:p-6 space-y-4">
          {erro && (
            <div className="p-3 text-xs font-semibold text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl">
              {erro}
            </div>
          )}

          {/* Adversário */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
              Adversário *
            </label>
            <div className="relative">
              <input
                type="text"
                value={adversario}
                onChange={(e) => setAdversario(e.target.value)}
                placeholder="Ex: Tigres ou Brescia"
                className="w-full h-10 pl-3.5 pr-10 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              />
              <button
                type="button"
                onClick={() => setAdversario('')}
                title="Limpar adversário"
                aria-label="Limpar adversário"
                className={`absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md transition cursor-pointer ${
                  adversario
                    ? 'text-slate-500 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-700'
                    : 'text-slate-300 dark:text-slate-600 cursor-default'
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Data e Hora */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                Data do Jogo *
              </label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={10}
                  value={dataJogo}
                  onChange={(e) => setDataJogo(aplicarMascaraData(e.target.value))}
                  placeholder="DD/MM/AAAA"
                  className="w-full h-10 pl-3.5 pr-10 py-2 text-sm font-mono bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setDataJogo('')}
                  title="Limpar data"
                  aria-label="Limpar data"
                  className={`absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md transition cursor-pointer ${
                    dataJogo
                      ? 'text-slate-500 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-700'
                      : 'text-slate-300 dark:text-slate-600 cursor-default'
                  }`}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                Hora *
              </label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={5}
                  value={hora}
                  onChange={(e) => setHora(aplicarMascaraHora(e.target.value))}
                  placeholder="HH:MM"
                  className="w-full h-10 pl-3.5 pr-10 py-2 text-sm font-mono bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setHora('')}
                  title="Limpar hora"
                  aria-label="Limpar hora"
                  className={`absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md transition cursor-pointer ${
                    hora
                      ? 'text-slate-500 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-700'
                      : 'text-slate-300 dark:text-slate-600 cursor-default'
                  }`}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Categoria (botões simples, sem dropdown) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <Shield className="w-3.5 h-3.5 text-blue-600" />
                <span>Categoria *</span>
              </label>
              <button
                type="button"
                onClick={() => setCategoria('')}
                title="Limpar categoria"
                aria-label="Limpar categoria"
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold transition cursor-pointer ${
                  categoria
                    ? 'text-slate-600 hover:text-rose-600 bg-slate-100 hover:bg-rose-50 dark:bg-slate-800 dark:text-slate-300'
                    : 'text-slate-300 dark:text-slate-600 cursor-default'
                }`}
              >
                <X className="w-3 h-3" />
                <span>Limpar</span>
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {opcoesCategoria.map((cat) => {
                const selecionada = categoria === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategoria(selecionada ? '' : cat)}
                    className={`h-10 px-2.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                      selecionada
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Competição (campo de texto livre + botões clicáveis das competições do Financeiro) */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
              <span className="text-sm leading-none">📝</span>
              <span>Competição *</span>
            </label>
            <input
              type="text"
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              placeholder="Ex: Copa do Mundo, Copa Rio de Janeiro, Campeonato, Amistoso..."
              className="w-full h-10 px-3.5 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            />

            {(() => {
              const listaComps = competicoesFinanceiro.filter((c) => {
                if (!c.nome?.trim() || c.id === 'taxa-jogo-padrao') return false;
                if (!categoria.trim()) return true;
                return !c.categoria || c.categoria === 'TODAS' || c.categoria === categoria.trim();
              });
              const nomesVistos = new Set<string>();
              const compsUnicas = listaComps.filter((c) => {
                const k = normalizarNomeCompeticao(c.nome);
                if (nomesVistos.has(k)) return false;
                nomesVistos.add(k);
                return true;
              });

              if (compsUnicas.length === 0) return null;

              return (
                <div className="pt-1">
                  <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1.5">
                    Competições já cadastradas no Financeiro:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {compsUnicas.map((comp) => {
                      const selecionada =
                        normalizarNomeCompeticao(tipo) === normalizarNomeCompeticao(comp.nome);
                      return (
                        <button
                          key={comp.id}
                          type="button"
                          onClick={() => setTipo(comp.nome)}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                            selecionada
                              ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                              : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700 hover:bg-blue-50 hover:border-blue-400 dark:hover:bg-slate-700'
                          }`}
                        >
                          {comp.nome}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Local / Campo */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-blue-600" />
              Local / Campo
            </label>
            <div className="relative">
              <input
                type="text"
                value={local}
                onChange={(e) => setLocal(e.target.value)}
                placeholder="Ex: Estádio Municipal, Campo 1"
                className="w-full h-10 pl-3.5 pr-10 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => setLocal('')}
                title="Limpar local"
                aria-label="Limpar local"
                className={`absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md transition cursor-pointer ${
                  local
                    ? 'text-slate-500 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-700'
                    : 'text-slate-300 dark:text-slate-600 cursor-default'
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
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
                <div className="relative">
                  <input
                    type="text"
                    value={placar}
                    onChange={(e) => setPlacar(e.target.value)}
                    placeholder="Ex: 2 x 1"
                    className="w-full h-9 pl-3 pr-9 py-1.5 text-xs font-mono font-bold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setPlacar('')}
                    title="Limpar placar"
                    aria-label="Limpar placar"
                    className={`absolute right-1.5 top-1/2 -translate-y-1/2 p-1 rounded-md transition cursor-pointer ${
                      placar
                        ? 'text-slate-500 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-700'
                        : 'text-slate-300 dark:text-slate-600 cursor-default'
                    }`}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Botões */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-98 rounded-lg shadow-xs transition-all flex items-center gap-2 cursor-pointer"
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

