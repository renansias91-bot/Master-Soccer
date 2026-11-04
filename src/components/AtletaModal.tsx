import React, { useState, useEffect } from 'react';
import { X, User, Shield, AlertCircle } from 'lucide-react';
import { Atleta, CategoriaBase, PernaDominante, PosicaoAtleta, StatusAtleta } from '../types';

interface AtletaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (atleta: Atleta) => void;
  atletaEditando?: Atleta | null;
  categoriasDisponiveis: string[];
  categoriaPadrao?: string;
}

const POSICOES: PosicaoAtleta[] = [
  'Goleiro',
  'Zagueiro',
  'Lateral Direito',
  'Lateral Esquerdo',
  'Volante',
  'Meio-Campista',
  'Ponta Direita',
  'Ponta Esquerda',
  'Centroavante',
];

const PERNAS: PernaDominante[] = ['Destro', 'Canhoto', 'Ambidestro'];
const STATUS_LIST: StatusAtleta[] = ['Ativo', 'Departamento Médico', 'Transição', 'Suspenso'];

export const AtletaModal: React.FC<AtletaModalProps> = ({
  isOpen,
  onClose,
  onSave,
  atletaEditando,
  categoriasDisponiveis,
  categoriaPadrao = 'SUB-15',
}) => {
  const [nome, setNome] = useState('');
  const [apelido, setApelido] = useState('');
  const [categoria, setCategoria] = useState<CategoriaBase>(categoriaPadrao);
  const [posicao, setPosicao] = useState<PosicaoAtleta>('Meio-Campista');
  const [dataNascimento, setDataNascimento] = useState('2010-01-01');
  const [pernaDominante, setPernaDominante] = useState<PernaDominante>('Destro');
  const [altura, setAltura] = useState<string>('');
  const [peso, setPeso] = useState<string>('');
  const [status, setStatus] = useState<StatusAtleta>('Ativo');
  const [fotoUrl, setFotoUrl] = useState('');
  const [erro, setErro] = useState('');

  useEffect(() => {
    if (atletaEditando) {
      setNome(atletaEditando.nome);
      setApelido(atletaEditando.apelido || '');
      setCategoria(atletaEditando.categoria);
      setPosicao(atletaEditando.posicao);
      setDataNascimento(atletaEditando.dataNascimento);
      setPernaDominante(atletaEditando.pernaDominante);
      setAltura(atletaEditando.altura ? String(atletaEditando.altura) : '');
      setPeso(atletaEditando.peso ? String(atletaEditando.peso) : '');
      setStatus(atletaEditando.status);
      setFotoUrl(atletaEditando.fotoUrl || '');
    } else {
      setNome('');
      setApelido('');
      setCategoria(categoriaPadrao);
      setPosicao('Meio-Campista');
      setDataNascimento('2010-01-01');
      setPernaDominante('Destro');
      setAltura('');
      setPeso('');
      setStatus('Ativo');
      setFotoUrl('');
    }
    setErro('');
  }, [atletaEditando, isOpen, categoriaPadrao]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) {
      setErro('Por favor, informe o nome completo do atleta.');
      return;
    }

    const atletaSalvo: Atleta = {
      id: atletaEditando ? atletaEditando.id : `atl-${Date.now()}`,
      nome: nome.trim(),
      apelido: apelido.trim() || undefined,
      categoria,
      posicao,
      numeroCamisa: atletaEditando?.numeroCamisa,
      dataNascimento,
      pernaDominante,
      altura: altura ? Number(altura) : undefined,
      peso: peso ? Number(peso) : undefined,
      status,
      dataCadastro: atletaEditando ? atletaEditando.dataCadastro : new Date().toISOString().split('T')[0],
      fotoUrl: fotoUrl.trim() || undefined,
    };

    onSave(atletaSalvo);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {atletaEditando ? 'Editar Atleta' : 'Novo Cadastro de Atleta'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Ficha de identificação e perfil nas categorias de base · Master Soccer
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {erro && (
            <div className="flex items-center gap-2 p-3 text-xs text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{erro}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Nome Completo */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Nome Completo *
              </label>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Gabriel Santos Ferreira"
                className="w-full h-10 px-3.5 py-2 text-sm leading-normal bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* Apelido */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Apelido de Jogo
              </label>
              <input
                type="text"
                value={apelido}
                onChange={(e) => setApelido(e.target.value)}
                placeholder="Ex: Biel"
                className="w-full h-10 px-3.5 py-2 text-sm leading-normal bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Categoria */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Categoria da Base *
              </label>
              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                className="w-full h-10 px-3.5 py-2 text-sm leading-normal bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {categoriasDisponiveis.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Posição */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Posição em Campo *
              </label>
              <select
                value={posicao}
                onChange={(e) => setPosicao(e.target.value as PosicaoAtleta)}
                className="w-full h-10 px-3.5 py-2 text-sm leading-normal bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {POSICOES.map((pos) => (
                  <option key={pos} value={pos}>
                    {pos}
                  </option>
                ))}
              </select>
            </div>

            {/* Perna Dominante */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Pé Dominante
              </label>
              <select
                value={pernaDominante}
                onChange={(e) => setPernaDominante(e.target.value as PernaDominante)}
                className="w-full h-10 px-3.5 py-2 text-sm leading-normal bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {PERNAS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            {/* Data de Nascimento */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Data de Nascimento
              </label>
              <input
                type="date"
                value={dataNascimento}
                onChange={(e) => setDataNascimento(e.target.value)}
                className="w-full h-10 px-3.5 py-2 text-sm font-mono leading-normal bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Status no Plantel
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as StatusAtleta)}
                className="w-full h-10 px-3.5 py-2 text-sm leading-normal bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {STATUS_LIST.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            {/* Altura e Peso */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Altura (cm)
              </label>
              <input
                type="number"
                placeholder="Ex: 175"
                value={altura}
                onChange={(e) => setAltura(e.target.value)}
                className="w-full h-10 px-3.5 py-2 text-sm font-mono tabular-nums leading-normal bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Peso (kg)
              </label>
              <input
                type="number"
                placeholder="Ex: 68"
                value={peso}
                onChange={(e) => setPeso(e.target.value)}
                className="w-full h-10 px-3.5 py-2 text-sm font-mono tabular-nums leading-normal bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Foto URL opcional */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Link da Foto do Atleta (Opcional)
              </label>
              <input
                type="url"
                placeholder="https://..."
                value={fotoUrl}
                onChange={(e) => setFotoUrl(e.target.value)}
                className="w-full h-10 px-3.5 py-2 text-sm leading-normal bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-98 rounded-lg shadow-sm transition-all"
            >
              {atletaEditando ? 'Salvar Alterações' : 'Cadastrar Atleta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
