import React, { useState, useEffect, useMemo } from 'react';
import { X, User, AlertCircle, Check } from 'lucide-react';
import { Atleta, CategoriaBase, PernaDominante, PosicaoAtleta, StatusAtleta } from '../types';
import { CATEGORIAS_PADRAO } from '../services/storage';
import {
  POSICOES_CAMPO_OPTIONS,
  PE_DOMINANTE_OPTIONS,
  formatarCpf,
  formatarTelefone,
  normalizarAlturaCm,
  normalizarPesoKg,
} from './FormularioAtletaCadastro';

interface AtletaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (atleta: Atleta) => Promise<void> | void;
  atletaEditando?: Atleta | null;
  categoriasDisponiveis: string[];
  categoriaPadrao?: string;
}

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
  const [rg, setRg] = useState('');
  const [cpf, setCpf] = useState('');
  const [categoria, setCategoria] = useState<CategoriaBase>(categoriaPadrao);
  const [posicao, setPosicao] = useState<PosicaoAtleta | ''>('Meio-Campista');
  const [pernaDominante, setPernaDominante] = useState<PernaDominante>('Destro');
  const [altura, setAltura] = useState<string>('');
  const [peso, setPeso] = useState<string>('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [nomeResponsavel, setNomeResponsavel] = useState('');
  const [telefoneResponsavel, setTelefoneResponsavel] = useState('');
  const [status, setStatus] = useState<StatusAtleta>('Ativo');
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);

  const opcoesCategoria = useMemo(() => {
    const base = categoriasDisponiveis && categoriasDisponiveis.length > 0 ? categoriasDisponiveis : CATEGORIAS_PADRAO;
    return Array.from(new Set(base)).filter(
      (c) => c && c !== 'TODAS' && c !== 'GERAL'
    );
  }, [categoriasDisponiveis]);

  useEffect(() => {
    if (atletaEditando) {
      setNome(atletaEditando.nome);
      setApelido(atletaEditando.apelido || '');
      setRg(atletaEditando.rg || atletaEditando.documento || '');
      setCpf(atletaEditando.cpf || '');
      setCategoria(atletaEditando.categoria);
      setPosicao(atletaEditando.posicao);
      setPernaDominante(atletaEditando.pernaDominante);
      setAltura(atletaEditando.altura ? String(atletaEditando.altura) : '');
      setPeso(atletaEditando.peso ? String(atletaEditando.peso) : '');
      setDataNascimento(atletaEditando.dataNascimento || '');
      setNomeResponsavel(atletaEditando.nomeResponsavel || '');
      setTelefoneResponsavel(atletaEditando.telefoneResponsavel || '');
      setStatus(atletaEditando.status);
    } else {
      setNome('');
      setApelido('');
      setRg('');
      setCpf('');
      setCategoria(categoriaPadrao && categoriaPadrao !== 'TODAS' ? categoriaPadrao : '');
      setPosicao('');
      setPernaDominante('Destro');
      setAltura('');
      setPeso('');
      setDataNascimento('');
      setNomeResponsavel('');
      setTelefoneResponsavel('');
      setStatus('Ativo');
    }
    setErro('');
    setSalvando(false);
  }, [atletaEditando, isOpen, categoriaPadrao]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) {
      setErro('Informe o Nome Completo do Atleta.');
      return;
    }
    if (!categoria) {
      setErro('Selecione a Categoria.');
      return;
    }
    if (!posicao) {
      setErro('Selecione a Posição em Campo.');
      return;
    }
    if (!atletaEditando && !nomeResponsavel.trim()) {
      setErro('Informe o Nome do Responsável Financeiro.');
      return;
    }

    const nomeTrim = nome.trim();
    const rgTrim = rg.trim();
    const cpfTrim = cpf.trim();

    const atletaSalvo: Atleta = {
      id: atletaEditando ? atletaEditando.id : '',
      nome: nomeTrim,
      nomeCompleto: nomeTrim,
      categoria,
      posicao,
      dataNascimento,
      pernaDominante,
      status,
      dataCadastro: atletaEditando ? atletaEditando.dataCadastro : new Date().toISOString().split('T')[0],
    };

    if (apelido.trim()) atletaSalvo.apelido = apelido.trim();
    if (rgTrim) atletaSalvo.rg = rgTrim;
    if (cpfTrim) atletaSalvo.cpf = cpfTrim;
    if (rgTrim || cpfTrim) atletaSalvo.documento = rgTrim || cpfTrim;

    const altNorm = normalizarAlturaCm(altura);
    if (altNorm) atletaSalvo.altura = altNorm;
    const pesoNorm = normalizarPesoKg(peso);
    if (pesoNorm) atletaSalvo.peso = pesoNorm;

    if (nomeResponsavel.trim()) atletaSalvo.nomeResponsavel = nomeResponsavel.trim();
    if (telefoneResponsavel.trim()) atletaSalvo.telefoneResponsavel = telefoneResponsavel.trim();
    if (atletaEditando?.fotoUrl) atletaSalvo.fotoUrl = atletaEditando.fotoUrl;
    if (atletaEditando?.numeroCamisa && !isNaN(Number(atletaEditando.numeroCamisa))) {
      atletaSalvo.numeroCamisa = Number(atletaEditando.numeroCamisa);
    }

    setSalvando(true);
    setErro('');

    try {
      await onSave(atletaSalvo);
      onClose();
    } catch (error: any) {
      console.error('Erro ao cadastrar atleta:', error);
      setErro(error?.message || 'Erro ao cadastrar atleta no Firestore.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8">
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
                Ficha de identificação · Master Soccer
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

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto" noValidate>
          {erro && (
            <div className="flex items-center gap-2 p-3 text-xs text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg font-bold">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{erro}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 1. Nome Completo do Atleta * */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Nome Completo do Atleta *
              </label>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Gabriel Santos Ferreira"
                className="w-full min-h-[44px] px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* 2. Apelido (Campinho / Estratégia) */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Apelido (Campinho / Estratégia)
              </label>
              <input
                type="text"
                value={apelido}
                onChange={(e) => setApelido(e.target.value)}
                placeholder="Ex: Biel"
                className="w-full min-h-[44px] px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* 3. Identidade / RG */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Identidade / RG
              </label>
              <input
                type="text"
                value={rg}
                onChange={(e) => setRg(e.target.value)}
                placeholder="Ex: 12.345.678-9"
                className="w-full min-h-[44px] px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* 4. CPF */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                CPF
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={cpf}
                onChange={(e) => setCpf(formatarCpf(e.target.value))}
                placeholder="000.000.000-00"
                className="w-full min-h-[44px] px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* 5. Categoria * */}
            <div className="md:col-span-2">
              <span className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Categoria *
              </span>
              <div className="grid grid-cols-3 gap-2">
                {opcoesCategoria.map((cat) => {
                  const sel = categoria === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategoria(cat)}
                      className={`min-h-[44px] px-3 py-2 rounded-xl text-xs font-black border transition cursor-pointer flex items-center justify-center gap-1 ${
                        sel
                          ? 'bg-blue-600 border-blue-600 text-white'
                          : 'bg-slate-50 dark:bg-slate-800/80 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200'
                      }`}
                      style={
                        sel
                          ? { backgroundColor: '#2563eb', borderColor: '#2563eb', color: '#ffffff' }
                          : {}
                      }
                    >
                      {sel && <Check className="w-3.5 h-3.5" />}
                      <span>{cat}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 6. Posição em Campo * */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Posição em Campo *
              </label>
              <select
                value={posicao}
                onChange={(e) => setPosicao(e.target.value as PosicaoAtleta | '')}
                className="w-full min-h-[44px] px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Selecione a posição...</option>
                {POSICOES_CAMPO_OPTIONS.map((pos) => (
                  <option key={pos.value} value={pos.value}>
                    {pos.label}
                  </option>
                ))}
              </select>
            </div>

            {/* 7. Pé dominante */}
            <div>
              <span className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Pé dominante
              </span>
              <div className="grid grid-cols-3 gap-1.5">
                {PE_DOMINANTE_OPTIONS.map((p) => {
                  const ativo = pernaDominante === p.value;
                  return (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => setPernaDominante(p.value)}
                      className={`min-h-[44px] px-2 py-2 rounded-xl text-xs font-black border transition cursor-pointer ${
                        ativo
                          ? 'bg-blue-600 border-blue-600 text-white'
                          : 'bg-slate-50 dark:bg-slate-800/80 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200'
                      }`}
                      style={
                        ativo
                          ? { backgroundColor: '#2563eb', borderColor: '#2563eb', color: '#ffffff' }
                          : {}
                      }
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 8. Altura */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Altura (cm)
              </label>
              <input
                type="text"
                inputMode="decimal"
                placeholder="Ex: 174"
                value={altura}
                onChange={(e) => setAltura(e.target.value)}
                className="w-full min-h-[44px] px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* 9. Peso */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Peso (kg)
              </label>
              <input
                type="text"
                inputMode="decimal"
                placeholder="Ex: 68"
                value={peso}
                onChange={(e) => setPeso(e.target.value)}
                className="w-full min-h-[44px] px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* 10. Data de nascimento */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Data de nascimento
              </label>
              <input
                type="date"
                value={dataNascimento}
                onChange={(e) => setDataNascimento(e.target.value)}
                className="w-full min-h-[44px] px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* 11. Nome do Responsável Financeiro * */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Nome do Responsável Financeiro *
              </label>
              <input
                type="text"
                value={nomeResponsavel}
                onChange={(e) => setNomeResponsavel(e.target.value)}
                placeholder="Ex: Maria Santos Ferreira"
                className="w-full min-h-[44px] px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* 12. Telefone do Responsável */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Telefone do Responsável
              </label>
              <input
                type="tel"
                inputMode="tel"
                value={telefoneResponsavel}
                onChange={(e) => setTelefoneResponsavel(formatarTelefone(e.target.value))}
                placeholder="(21) 99999-9999"
                className="w-full min-h-[44px] px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Status (apenas em edição) */}
            {atletaEditando && (
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Status no Plantel
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as StatusAtleta)}
                  className="w-full min-h-[44px] px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {STATUS_LIST.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={salvando}
              className="px-5 py-2.5 text-xs font-black text-white bg-blue-600 hover:bg-blue-700 active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-sm transition-all cursor-pointer"
              style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
            >
              {salvando
                ? 'Salvando no Firestore...'
                : atletaEditando
                ? 'Salvar Alterações'
                : 'Cadastrar Atleta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
