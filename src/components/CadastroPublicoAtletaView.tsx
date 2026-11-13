import React, { useState } from 'react';
import { CheckCircle2, UserPlus } from 'lucide-react';
import { Atleta } from '../types';
import { firebaseService } from '../services/firebase';
import { storageService } from '../services/storage';
import { MasterSoccerEscudo } from './MasterSoccerEscudo';
import { FormularioAtletaCadastro } from './FormularioAtletaCadastro';

interface CadastroPublicoAtletaViewProps {
  categorias?: string[];
}

export const CadastroPublicoAtletaView: React.FC<CadastroPublicoAtletaViewProps> = ({
  categorias,
}) => {
  const [cadastradoComSucesso, setCadastradoComSucesso] = useState(false);
  const [ultimoNomeSalvo, setUltimoNomeSalvo] = useState('');
  const [salvando, setSalvando] = useState(false);

  const handleSalvarPublico = async (atleta: Atleta) => {
    setSalvando(true);
    try {
      const atletaParaSalvar: Atleta = {
        ...atleta,
        status: 'Ativo',
      };

      let docId = '';
      try {
        docId = await firebaseService.cadastrarAtleta(atletaParaSalvar);
      } catch (err) {
        console.warn('Erro ao salvar cadastro público no Firestore, salvando localmente:', err);
      }

      storageService.salvarAtleta({
        ...atletaParaSalvar,
        id: docId || `atl-${Date.now()}`,
      });

      setUltimoNomeSalvo(atletaParaSalvar.nome);
      setCadastradoComSucesso(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 py-5 px-3 sm:px-6">
      <div className="max-w-xl mx-auto space-y-4">
        {/* Cabeçalho simples da página pública */}
        <header className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-4 sm:p-5 flex items-center gap-3.5">
          <div className="shrink-0">
            <MasterSoccerEscudo size={48} />
          </div>
          <div>
            <p className="text-[11px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400">
              Master Soccer RJ
            </p>
            <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
              Cadastro de Atleta
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Preencha seus dados abaixo para entrar na base do clube.
            </p>
          </div>
        </header>

        {cadastradoComSucesso ? (
          <section className="bg-white dark:bg-slate-900 rounded-2xl border border-emerald-200 dark:border-emerald-800 shadow-md p-6 sm:p-8 text-center space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-9 h-9 text-emerald-600 dark:text-emerald-400" />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-xl font-black text-slate-900 dark:text-white">
                Cadastro feito com sucesso! Obrigado!
              </h2>
              {ultimoNomeSalvo && (
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                  Atleta <span className="font-black text-slate-900 dark:text-white">{ultimoNomeSalvo}</span> já está ativo na lista do clube.
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                setCadastradoComSucesso(false);
                setUltimoNomeSalvo('');
              }}
              className="w-full min-h-[48px] px-5 py-3 rounded-xl text-sm font-black text-white bg-blue-600 hover:bg-blue-700 active:scale-[0.99] shadow-sm transition cursor-pointer flex items-center justify-center gap-2"
              style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
            >
              <UserPlus className="w-4 h-4" />
              <span>Fazer outro cadastro</span>
            </button>
          </section>
        ) : (
          <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md p-4 sm:p-6">
            <FormularioAtletaCadastro
              categorias={categorias}
              textoBotaoSalvar="Salvar e me cadastrar"
              salvandoExterno={salvando}
              onSalvar={handleSalvarPublico}
            />
          </section>
        )}
      </div>
    </div>
  );
};
