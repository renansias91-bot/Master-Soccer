import React from 'react';
import { Trash2, X } from 'lucide-react';

interface ConfirmacaoApagarModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  titulo?: string;
  mensagem?: string;
  detalhes?: string;
  subtexto?: string;
  textoConfirmar?: string;
  textoCancelar?: string;
  carregando?: boolean;
}

export const ConfirmacaoApagarModal: React.FC<ConfirmacaoApagarModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  titulo = 'Excluir Registro',
  mensagem = 'Tem certeza que deseja apagar?',
  detalhes,
  subtexto = 'Esta ação não poderá ser desfeita.',
  textoConfirmar = 'SIM',
  textoCancelar = 'NÃO',
  carregando = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150 no-print">
      <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 relative">
        <button
          onClick={onClose}
          disabled={carregando}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-3">
          <div className="w-11 h-11 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
            <Trash2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {titulo}
            </h3>
            {detalhes && (
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {detalhes}
              </p>
            )}
          </div>
        </div>

        <div className="my-4">
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 leading-snug">
            {mensagem}
          </p>
          {subtexto && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
              {subtexto}
            </p>
          )}
        </div>

        {/* 2 Botões com textos configuráveis (ex: Cancelar e Excluir jogo) */}
        <div className="grid grid-cols-2 gap-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            disabled={carregando}
            className="py-2.5 px-4 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition"
          >
            {textoCancelar}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={carregando}
            className="py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 active:scale-98 transition shadow-xs disabled:opacity-50"
          >
            {carregando ? 'Excluindo...' : textoConfirmar}
          </button>
        </div>
      </div>
    </div>
  );
};
