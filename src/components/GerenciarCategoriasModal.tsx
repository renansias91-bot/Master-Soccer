import React, { useState, useMemo } from 'react';
import {
  X,
  Plus,
  Trash2,
  FolderCheck,
  Edit2,
  Calendar,
  Check,
  AlertTriangle,
  ArrowRight,
  Users,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { Atleta, JogoAgenda } from '../types';

interface GerenciarCategoriasModalProps {
  isOpen: boolean;
  onClose: () => void;
  categorias: string[];
  atletas: Atleta[];
  jogos: JogoAgenda[];
  onSalvarCategorias: (categorias: string[]) => void;
  onRenomearCategoria: (antiga: string, nova: string, manterAntigaVazia?: boolean) => Promise<void>;
  onViradaDeAno: (plano: { origem: string; destino: string; qtdAtletas: number }[]) => Promise<void>;
  onExcluirCategoriaComMigracao: (catExcluir: string, catDestino: string) => Promise<void>;
  onExibirToast: (msg: string) => void;
}

/**
 * Extrai o número da categoria (ex: SUB-15 -> 15, SUB-16 -> 16, SUB-17 -> 17, SUB-20 -> 20)
 */
function extrairNumeroCategoria(cat: string): number {
  const match = cat.match(/\d+/);
  return match ? parseInt(match[0], 10) : 999;
}

/**
 * Calcula a próxima categoria superior de acordo com a progressão da base brasileira:
 * SUB-15 -> SUB-16 -> SUB-17 -> SUB-20 (conforme solicitação explícita do usuário)
 */
function inferirProximaCategoria(cat: string): string {
  const num = extrairNumeroCategoria(cat);
  if (num === 999) {
    return `${cat} (Superior)`;
  }
  if (num === 17) {
    return 'SUB-20';
  }
  if (num === 15) {
    return 'SUB-16';
  }
  if (num === 16) {
    return 'SUB-17';
  }
  if (num === 20) {
    return 'SUB-23';
  }
  return `SUB-${num + 1}`;
}

export const GerenciarCategoriasModal: React.FC<GerenciarCategoriasModalProps> = ({
  isOpen,
  onClose,
  categorias,
  atletas,
  onSalvarCategorias,
  onRenomearCategoria,
  onViradaDeAno,
  onExcluirCategoriaComMigracao,
  onExibirToast,
}) => {
  const [novaCategoria, setNovaCategoria] = useState('');
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);

  // Estado para edição inline de categoria
  const [categoriaEmEdicao, setCategoriaEmEdicao] = useState<string | null>(null);
  const [nomeEditando, setNomeEditando] = useState('');

  // Estado para confirmação de mesclagem manual (ex: editar SUB-17 para SUB-20 quando SUB-20 já existe)
  const [modalMesclar, setModalMesclar] = useState<{
    origem: string;
    destino: string;
    qtdAtletas: number;
  } | null>(null);

  // Estado para exclusão segura com migração obrigatória de atletas
  const [modalExcluirComAtletas, setModalExcluirComAtletas] = useState<{
    catExcluir: string;
    qtdAtletas: number;
    catDestino: string;
  } | null>(null);

  // Estado para o modal de Virada de Ano
  const [isViradaModalOpen, setIsViradaModalOpen] = useState(false);

  // Contagem de atletas por categoria
  const contagemAtletasPorCat = useMemo(() => {
    const mapa: Record<string, number> = {};
    categorias.forEach((c) => {
      mapa[c] = 0;
    });
    atletas.forEach((a) => {
      const cat = a.categoria?.trim().toUpperCase();
      if (cat) {
        mapa[cat] = (mapa[cat] || 0) + 1;
      }
    });
    return mapa;
  }, [categorias, atletas]);

  // Plano de Virada de Ano calculado do MAIOR para o MENOR
  const planoVirada = useMemo(() => {
    // 1. Ordena categorias decrescente por número (ex: SUB-17, depois SUB-16, depois SUB-15)
    const catsOrdenadas = [...categorias].sort((a, b) => {
      const numA = extrairNumeroCategoria(a);
      const numB = extrairNumeroCategoria(b);
      return numB - numA;
    });

    return catsOrdenadas.map((cat) => {
      const destino = inferirProximaCategoria(cat);
      const qtdAtletas = contagemAtletasPorCat[cat] || 0;
      return {
        origem: cat,
        destino,
        qtdAtletas,
      };
    });
  }, [categorias, contagemAtletasPorCat]);

  const totalAtletasVirada = useMemo(() => {
    return planoVirada.reduce((acc, curr) => acc + curr.qtdAtletas, 0);
  }, [planoVirada]);

  // Categoria base inferior (menor número, ex: SUB-15) que ficará vazia após a virada
  const categoriaBaseInferior = useMemo(() => {
    if (categorias.length === 0) return 'SUB-15';
    const catsOrdenadasCresc = [...categorias].sort((a, b) => {
      return extrairNumeroCategoria(a) - extrairNumeroCategoria(b);
    });
    return catsOrdenadasCresc[0];
  }, [categorias]);

  if (!isOpen) return null;

  // 1. Adicionar nova categoria
  const handleAdicionar = (e: React.FormEvent) => {
    e.preventDefault();
    const nomeLimpo = novaCategoria.trim().toUpperCase();
    if (!nomeLimpo) return;

    if (categorias.includes(nomeLimpo)) {
      setErro(`A categoria ${nomeLimpo} já existe na lista.`);
      return;
    }

    const atualizada = [...categorias, nomeLimpo];
    onSalvarCategorias(atualizada);
    setNovaCategoria('');
    setErro('');
    onExibirToast(`Categoria ${nomeLimpo} adicionada!`);
  };

  // 2. Iniciar edição inline
  const handleIniciarEdicao = (cat: string) => {
    setCategoriaEmEdicao(cat);
    setNomeEditando(cat);
    setErro('');
  };

  // 3. Salvar edição de categoria (renomeação ou transição manual)
  const handleSalvarEdicao = async (antiga: string) => {
    const nomeLimpo = nomeEditando.trim().toUpperCase();
    if (!nomeLimpo) {
      setErro('O nome da categoria não pode ficar em branco.');
      return;
    }

    if (nomeLimpo === antiga) {
      setCategoriaEmEdicao(null);
      return;
    }

    const qtdAtletas = contagemAtletasPorCat[antiga] || 0;

    // Se o nome digitado já existe na lista (ex: usuário criou SUB-20 antes e agora está renomeando SUB-17 para SUB-20)
    if (categorias.includes(nomeLimpo)) {
      setModalMesclar({
        origem: antiga,
        destino: nomeLimpo,
        qtdAtletas,
      });
      return;
    }

    // Renomeação direta para novo nome
    try {
      setSalvando(true);
      await onRenomearCategoria(antiga, nomeLimpo, false);
      setCategoriaEmEdicao(null);
      setErro('');
    } catch (err: any) {
      setErro(err?.message || 'Erro ao renomear categoria.');
    } finally {
      setSalvando(false);
    }
  };

  // 4. Confirmar mesclagem / transição manual (quando destino já existia)
  const handleConfirmarMesclagemManual = async () => {
    if (!modalMesclar) return;
    try {
      setSalvando(true);
      // Mantém a categoria antiga na lista com 0 atletas para permitir continuar a cascata (ex: SUB-16 -> SUB-17)
      await onRenomearCategoria(modalMesclar.origem, modalMesclar.destino, true);
      setModalMesclar(null);
      setCategoriaEmEdicao(null);
      setErro('');
    } catch (err: any) {
      setErro(err?.message || 'Erro ao realizar transição.');
    } finally {
      setSalvando(false);
    }
  };

  // 5. Clicar no botão excluir categoria
  const handleClicarExcluir = (cat: string) => {
    if (categorias.length <= 1) {
      setErro('O sistema precisa de pelo menos uma categoria cadastrada.');
      return;
    }

    const qtd = contagemAtletasPorCat[cat] || 0;

    // Trava de segurança: se tem atletas, DEVE avisar e solicitar categoria de destino!
    if (qtd > 0) {
      const outras = categorias.filter((c) => c !== cat);
      setModalExcluirComAtletas({
        catExcluir: cat,
        qtdAtletas: qtd,
        catDestino: outras[0] || 'SUB-15',
      });
      return;
    }

    // Se não tem nenhum atleta, remove direto
    const atualizada = categorias.filter((c) => c !== cat);
    onSalvarCategorias(atualizada);
    onExibirToast(`Categoria ${cat} removida.`);
  };

  // 6. Confirmar exclusão com migração de atletas
  const handleConfirmarExclusaoComMigracao = async () => {
    if (!modalExcluirComAtletas) return;
    try {
      setSalvando(true);
      await onExcluirCategoriaComMigracao(
        modalExcluirComAtletas.catExcluir,
        modalExcluirComAtletas.catDestino
      );
      setModalExcluirComAtletas(null);
      setErro('');
    } catch (err: any) {
      setErro(err?.message || 'Erro ao mover atletas e excluir categoria.');
    } finally {
      setSalvando(false);
    }
  };

  // 7. Executar Virada de Ano completa
  const handleExecutarViradaDeAno = async () => {
    try {
      setSalvando(true);
      await onViradaDeAno(planoVirada);
      setIsViradaModalOpen(false);
      onClose();
    } catch (err: any) {
      setErro(err?.message || 'Erro ao executar virada de ano.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/40 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300">
              <FolderCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white leading-tight">
                Categorias de Base
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Gerencie divisões, renomeações e virada de temporada
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Conteúdo com scroll se necessário */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {erro && (
            <div className="p-3 text-xs text-red-700 bg-red-50 dark:bg-red-950/40 rounded-xl border border-red-200 dark:border-red-800 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{erro}</span>
            </div>
          )}

          {/* ========================================================= */}
          {/* BOTÃO NO TOPO: VIRADA DE ANO (SUBIR TODOS 1 CATEGORIA) */}
          {/* ========================================================= */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-50 to-emerald-50 dark:from-amber-950/30 dark:to-emerald-950/30 border-2 border-amber-300 dark:border-amber-700/80 shadow-xs space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-lg">📅</span>
                <span className="font-black text-slate-900 dark:text-white text-xs sm:text-sm">
                  Virada de Temporada
                </span>
              </div>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-600 text-white shadow-2xs">
                {totalAtletasVirada} atletas na base
              </span>
            </div>

            <p className="text-[11px] text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
              Promove todos os atletas 1 categoria (SUB-15 ➔ SUB-16, SUB-16 ➔ SUB-17, SUB-17 ➔ SUB-20)
              sem perder histórico, fotos ou notas.
            </p>

            <button
              type="button"
              onClick={() => setIsViradaModalOpen(true)}
              className="w-full h-10 px-4 rounded-xl font-black text-xs text-slate-950 bg-amber-400 hover:bg-amber-300 dark:bg-amber-400 dark:hover:bg-amber-300 transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              <Calendar className="w-4 h-4 text-slate-950" />
              <span>Virada de Ano - Subir todos 1 categoria</span>
            </button>
          </div>

          {/* Adicionar Nova Categoria */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Cadastrar Nova Categoria
            </label>
            <form onSubmit={handleAdicionar} className="flex gap-2">
              <input
                type="text"
                value={novaCategoria}
                onChange={(e) => setNovaCategoria(e.target.value)}
                placeholder="EX: SUB-13 OU SUB-20"
                className="flex-1 h-10 leading-normal px-3 py-2 text-xs uppercase bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="h-10 px-4 text-xs font-black text-white bg-blue-600 hover:bg-blue-700 rounded-xl inline-flex items-center gap-1.5 shrink-0 transition-all shadow-xs active:scale-98 cursor-pointer"
              >
                <Plus className="w-4 h-4 text-amber-300" />
                <span>+ Adicionar</span>
              </button>
            </form>
          </div>

          {/* Lista de Categorias com Editar e Excluir */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between text-[11px] font-extrabold text-slate-500 uppercase tracking-wider px-1">
              <span>Categorias Existentes ({categorias.length})</span>
              <span>Ações & Atletas</span>
            </div>

            <div className="space-y-2">
              {categorias.map((cat) => {
                const qtd = contagemAtletasPorCat[cat] || 0;
                const estaEditando = categoriaEmEdicao === cat;

                return (
                  <div
                    key={cat}
                    className={`flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl border transition-all ${
                      estaEditando
                        ? 'bg-blue-50/70 dark:bg-blue-950/40 border-blue-400 dark:border-blue-700 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200/90 dark:border-slate-800 hover:border-slate-300'
                    }`}
                  >
                    {/* Se estiver no modo de edição inline */}
                    {estaEditando ? (
                      <div className="w-full flex items-center gap-2">
                        <input
                          type="text"
                          value={nomeEditando}
                          onChange={(e) => setNomeEditando(e.target.value)}
                          className="flex-1 h-9 px-3 text-xs font-black uppercase rounded-lg border-2 border-blue-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSalvarEdicao(cat);
                            if (e.key === 'Escape') setCategoriaEmEdicao(null);
                          }}
                        />
                        <button
                          type="button"
                          disabled={salvando}
                          onClick={() => handleSalvarEdicao(cat)}
                          className="h-9 px-3 text-xs font-black text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-1 shadow-2xs active:scale-95 cursor-pointer disabled:opacity-50"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Salvar</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setCategoriaEmEdicao(null)}
                          className="h-9 px-2.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition cursor-pointer"
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <>
                        {/* Nome da categoria + badge de atletas */}
                        <div className="flex items-center gap-2.5 mb-2 sm:mb-0">
                          <span className="font-black text-slate-900 dark:text-white text-sm tracking-tight">
                            {cat}
                          </span>
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              qtd > 0
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                                : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                            }`}
                          >
                            <Users className="w-3 h-3" />
                            {qtd} {qtd === 1 ? 'atleta' : 'atletas'}
                          </span>
                        </div>

                        {/* Botões: ✏️ Editar e 🗑️ Apagar */}
                        <div className="flex items-center gap-1.5 self-end sm:self-auto">
                          {/* Botão Editar Lápis */}
                          <button
                            type="button"
                            onClick={() => handleIniciarEdicao(cat)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-lg border border-blue-200 dark:border-blue-800 transition active:scale-95 cursor-pointer"
                            title="Editar nome da categoria"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-blue-600" />
                            <span>Editar</span>
                          </button>

                          {/* Botão Apagar Lixeira */}
                          <button
                            type="button"
                            onClick={() => handleClicarExcluir(cat)}
                            className="inline-flex items-center justify-center p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition active:scale-95 cursor-pointer"
                            title="Remover categoria"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Rodapé com botão Concluir */}
        <div className="p-4 bg-slate-50/80 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-black text-white bg-slate-900 dark:bg-slate-100 dark:text-slate-900 rounded-xl hover:bg-slate-800 transition shadow-xs cursor-pointer active:scale-98"
          >
            Concluir
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* MODAL 1: CONFIRMAÇÃO DE VIRADA DE ANO */}
      {/* ========================================================= */}
      {isViradaModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border-2 border-amber-400 dark:border-amber-600 p-5 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-xl bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 font-black">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-base font-black text-slate-900 dark:text-white leading-tight">
                  Confirmar Virada de Temporada
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Transição oficial de ano para a base
                </p>
              </div>
            </div>

            {/* Resumo da transição */}
            <div className="space-y-2 rounded-xl bg-slate-50 dark:bg-slate-800/70 p-3.5 border border-slate-200 dark:border-slate-700 text-xs">
              <div className="font-extrabold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                <span>Plano de Transição (Maior para Menor):</span>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-black">
                  Total: {totalAtletasVirada} atletas
                </span>
              </div>

              {planoVirada.map((item) => (
                <div
                  key={item.origem}
                  className="flex items-center justify-between py-1.5 px-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 font-bold"
                >
                  <span className="text-slate-800 dark:text-slate-200">
                    {item.origem} ({item.qtdAtletas} {item.qtdAtletas === 1 ? 'atleta' : 'atletas'})
                  </span>
                  <ArrowRight className="w-4 h-4 text-amber-500 shrink-0 mx-2" />
                  <span className="text-emerald-700 dark:text-emerald-400 font-black">
                    {item.destino}
                  </span>
                </div>
              ))}

              <div className="pt-2 text-[11px] text-slate-600 dark:text-slate-400 leading-snug">
                ✅ O <strong>{categoriaBaseInferior}</strong> permanecerá criado e ficará vazio (0 atletas), pronto para receber os novos atletas que vão entrar.
                <br />
                ✅ Histórico de jogos, notas e avaliações já realizadas continuam 100% preservados na categoria original da época.
              </div>
            </div>

            {/* Aviso de Confirmação */}
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 text-xs text-amber-900 dark:text-amber-200 space-y-1">
              <div className="font-black flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Tem certeza que deseja aplicar a virada de ano?</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Isso vai mudar a categoria de todos os atletas conforme o plano acima.
              </p>
            </div>

            {/* Botões do Modal */}
            <div className="flex items-center justify-end gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setIsViradaModalOpen(false)}
                disabled={salvando}
                className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleExecutarViradaDeAno}
                disabled={salvando}
                className="px-4 py-2 text-xs font-black text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition shadow-sm flex items-center gap-1.5 cursor-pointer active:scale-98 disabled:opacity-50"
              >
                {salvando ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Processando...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Confirmar Virada</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: CONFIRMAÇÃO DE MESCLAGEM / TRANSIÇÃO MANUAL */}
      {/* (Ex: Renomear SUB-17 para SUB-20 quando SUB-20 já existe) */}
      {/* ========================================================= */}
      {modalMesclar && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border-2 border-blue-500 p-5 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-xl bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 font-black">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-base font-black text-slate-900 dark:text-white leading-tight">
                  Categoria {modalMesclar.destino} já existe
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Transição manual de atletas
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              A categoria <strong>{modalMesclar.destino}</strong> já está cadastrada na lista.
              Deseja mover os <strong>{modalMesclar.qtdAtletas} atleta(s)</strong> de{' '}
              <strong>{modalMesclar.origem}</strong> para <strong>{modalMesclar.destino}</strong>?
            </p>

            <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-[11px] text-blue-900 dark:text-blue-200">
              💡 Os atletas passarão a fazer parte do <strong>{modalMesclar.destino}</strong>, e o{' '}
              <strong>{modalMesclar.origem}</strong> ficará vago para receber atletas de outra categoria (ex: SUB-16).
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setModalMesclar(null)}
                disabled={salvando}
                className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmarMesclagemManual}
                disabled={salvando}
                className="px-4 py-2 text-xs font-black text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition shadow-xs cursor-pointer active:scale-98 disabled:opacity-50"
              >
                {salvando ? 'Movendo...' : 'Confirmar e Mover Atletas'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 3: EXCLUSÃO DE CATEGORIA COM ATLETAS CADASTRADOS */}
      {/* ========================================================= */}
      {modalExcluirComAtletas && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border-2 border-red-500 p-5 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-xl bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 font-black">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-base font-black text-slate-900 dark:text-white leading-tight">
                  Essa categoria tem {modalExcluirComAtletas.qtdAtletas} atleta(s)
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Para onde vão esses atletas?
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              Não é permitido apagar uma categoria deixando atletas órfãos. Escolha para qual categoria
              os atletas de <strong>{modalExcluirComAtletas.catExcluir}</strong> serão transferidos:
            </p>

            <div className="space-y-1.5">
              <label className="text-[11px] font-extrabold uppercase text-slate-600 dark:text-slate-400">
                Categoria de Destino:
              </label>
              <select
                value={modalExcluirComAtletas.catDestino}
                onChange={(e) =>
                  setModalExcluirComAtletas({
                    ...modalExcluirComAtletas,
                    catDestino: e.target.value,
                  })
                }
                className="w-full h-10 px-3 text-xs font-bold bg-slate-50 dark:bg-slate-800 border-2 border-red-300 dark:border-red-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                {categorias
                  .filter((c) => c !== modalExcluirComAtletas.catExcluir)
                  .map((c) => (
                    <option key={c} value={c}>
                      {c} ({contagemAtletasPorCat[c] || 0} atletas atuais)
                    </option>
                  ))}
              </select>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setModalExcluirComAtletas(null)}
                disabled={salvando}
                className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmarExclusaoComMigracao}
                disabled={salvando}
                className="px-4 py-2 text-xs font-black text-white bg-red-600 hover:bg-red-700 rounded-xl transition shadow-xs cursor-pointer active:scale-98 disabled:opacity-50"
              >
                {salvando ? 'Processando...' : 'Mover Atletas e Apagar Categoria'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
