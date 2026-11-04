import React, { useState } from 'react';
import { X, Plus, Trash2, FolderCheck } from 'lucide-react';

interface GerenciarCategoriasModalProps {
  isOpen: boolean;
  onClose: () => void;
  categorias: string[];
  onSalvarCategorias: (categorias: string[]) => void;
}

export const GerenciarCategoriasModal: React.FC<GerenciarCategoriasModalProps> = ({
  isOpen,
  onClose,
  categorias,
  onSalvarCategorias,
}) => {
  const [lista, setLista] = useState<string[]>(categorias);
  const [novaCategoria, setNovaCategoria] = useState('');
  const [erro, setErro] = useState('');

  if (!isOpen) return null;

  const handleAdicionar = (e: React.FormEvent) => {
    e.preventDefault();
    const nomeLimpo = novaCategoria.trim().toUpperCase();
    if (!nomeLimpo) return;

    if (lista.includes(nomeLimpo)) {
      setErro('Esta categoria já existe na lista.');
      return;
    }

    const atualizada = [...lista, nomeLimpo];
    setLista(atualizada);
    setNovaCategoria('');
    setErro('');
    onSalvarCategorias(atualizada);
  };

  const handleRemover = (cat: string) => {
    if (lista.length <= 1) {
      setErro('O sistema precisa de pelo menos uma categoria cadastrada.');
      return;
    }
    const atualizada = lista.filter((c) => c !== cat);
    setLista(atualizada);
    onSalvarCategorias(atualizada);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
          <div className="flex items-center gap-2">
            <FolderCheck className="w-5 h-5 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Categorias de Base
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Conteúdo */}
        <div className="p-6 space-y-4">
          <p className="text-xs text-slate-500">
            Configure as divisões de base do seu clube (ex: SUB-15, SUB-16, SUB-17).
          </p>

          {erro && (
            <div className="p-2.5 text-xs text-red-600 bg-red-50 dark:bg-red-950/40 rounded-lg border border-red-200">
              {erro}
            </div>
          )}

          {/* Adicionar */}
          <form onSubmit={handleAdicionar} className="flex gap-2">
            <input
              type="text"
              value={novaCategoria}
              onChange={(e) => setNovaCategoria(e.target.value)}
              placeholder="Ex: SUB-13 ou SUB-20"
              className="flex-1 h-10 leading-normal px-3 py-2 text-xs uppercase bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="h-10 px-4 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg inline-flex items-center gap-1.5 shrink-0 transition-all shadow-xs"
            >
              <Plus className="w-4 h-4 text-amber-300" />
              <span>Adicionar</span>
            </button>
          </form>

          {/* Lista Atual */}
          <div className="space-y-2 pt-2">
            {lista.map((cat) => (
              <div
                key={cat}
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 text-xs"
              >
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {cat}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemover(cat)}
                  className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors"
                  title="Remover categoria"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Rodapé */}
        <div className="p-4 bg-slate-50/70 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-white bg-slate-900 dark:bg-slate-100 dark:text-slate-900 rounded-lg"
          >
            Concluir
          </button>
        </div>
      </div>
    </div>
  );
};
