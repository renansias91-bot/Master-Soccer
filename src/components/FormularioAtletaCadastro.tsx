import React, { useMemo, useState } from 'react';
import { AlertCircle, Check } from 'lucide-react';
import { Atleta, PernaDominante, PosicaoAtleta } from '../types';
import { CATEGORIAS_PADRAO } from '../services/storage';

export interface PosicaoOption {
  sigla: string;
  label: string;
  value: PosicaoAtleta;
}

export const POSICOES_CAMPO_OPTIONS: PosicaoOption[] = [
  { sigla: 'GOL', label: 'GOL - Goleiro', value: 'Goleiro' },
  { sigla: 'LD', label: 'LD - Lateral Direito', value: 'Lateral Direito' },
  { sigla: 'LE', label: 'LE - Lateral Esquerdo', value: 'Lateral Esquerdo' },
  { sigla: 'ZAG', label: 'ZAG - Zagueiro', value: 'Zagueiro' },
  { sigla: 'VOL', label: 'VOL - Volante', value: 'Volante' },
  { sigla: 'MEI', label: 'MEI - Meio-Campista', value: 'Meio-Campista' },
  { sigla: 'ATA', label: 'ATA - Atacante', value: 'Centroavante' },
  { sigla: 'PD', label: 'PD - Ponta Direita', value: 'Ponta Direita' },
  { sigla: 'PE', label: 'PE - Ponta Esquerda', value: 'Ponta Esquerda' },
];

export const PE_DOMINANTE_OPTIONS: { label: string; value: PernaDominante }[] = [
  { label: 'Direito', value: 'Destro' },
  { label: 'Esquerdo', value: 'Canhoto' },
  { label: 'Ambos', value: 'Ambidestro' },
];

export function formatarCpf(valor: string): string {
  const digits = valor.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

export function formatarTelefone(valor: string): string {
  const digits = valor.replace(/\D/g, '').slice(0, 11);
  if (digits.length === 0) return '';
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export function normalizarAlturaCm(valor: string): number | undefined {
  const limpo = valor.replace(',', '.').replace(/[^\d.]/g, '').trim();
  if (!limpo) return undefined;
  const num = Number(limpo);
  if (isNaN(num) || num <= 0) return undefined;
  // Se digitou em metros (ex: 1.74), converte para 174 cm
  if (num < 3) return Math.round(num * 100);
  return Math.round(num);
}

export function normalizarPesoKg(valor: string): number | undefined {
  const limpo = valor.replace(',', '.').replace(/[^\d.]/g, '').trim();
  if (!limpo) return undefined;
  const num = Number(limpo);
  if (isNaN(num) || num <= 0) return undefined;
  return Number(num.toFixed(1));
}

interface FormularioAtletaCadastroProps {
  categorias?: string[];
  textoBotaoSalvar?: string;
  salvandoExterno?: boolean;
  onSalvar: (atleta: Atleta) => Promise<void> | void;
}

export const FormularioAtletaCadastro: React.FC<FormularioAtletaCadastroProps> = ({
  categorias,
  textoBotaoSalvar = 'Salvar e me cadastrar',
  salvandoExterno = false,
  onSalvar,
}) => {
  const opcoesCategoria = useMemo(() => {
    const base = categorias && categorias.length > 0 ? categorias : CATEGORIAS_PADRAO;
    const unicas = Array.from(new Set(base)).filter(
      (c) => c && c !== 'TODAS' && c !== 'GERAL'
    );
    return unicas;
  }, [categorias]);

  const [nomeCompleto, setNomeCompleto] = useState('');
  const [apelido, setApelido] = useState('');
  const [rg, setRg] = useState('');
  const [cpf, setCpf] = useState('');
  const [categoria, setCategoria] = useState('');
  const [posicao, setPosicao] = useState<PosicaoAtleta | ''>('');
  const [pernaDominante, setPernaDominante] = useState<PernaDominante>('Destro');
  const [altura, setAltura] = useState('');
  const [peso, setPeso] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [nomeResponsavel, setNomeResponsavel] = useState('');
  const [telefoneResponsavel, setTelefoneResponsavel] = useState('');

  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  const limparFormulario = () => {
    setNomeCompleto('');
    setApelido('');
    setRg('');
    setCpf('');
    setCategoria('');
    setPosicao('');
    setPernaDominante('Destro');
    setAltura('');
    setPeso('');
    setDataNascimento('');
    setNomeResponsavel('');
    setTelefoneResponsavel('');
    setErro(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);

    if (!nomeCompleto.trim()) {
      setErro('Informe o Nome Completo do Atleta.');
      return;
    }
    if (!categoria) {
      setErro('Selecione a Categoria do atleta.');
      return;
    }
    if (!posicao) {
      setErro('Selecione a Posição em Campo.');
      return;
    }
    if (!nomeResponsavel.trim()) {
      setErro('Informe o Nome do Responsável Financeiro.');
      return;
    }

    const nomeTrim = nomeCompleto.trim();
    const rgTrim = rg.trim();
    const cpfTrim = cpf.trim();

    const novoAtleta: Atleta = {
      id: '',
      nome: nomeTrim,
      nomeCompleto: nomeTrim,
      apelido: apelido.trim() || undefined,
      rg: rgTrim || undefined,
      cpf: cpfTrim || undefined,
      documento: rgTrim || cpfTrim || undefined,
      categoria,
      posicao,
      pernaDominante,
      altura: normalizarAlturaCm(altura),
      peso: normalizarPesoKg(peso),
      dataNascimento: dataNascimento || '',
      nomeResponsavel: nomeResponsavel.trim(),
      telefoneResponsavel: telefoneResponsavel.trim() || undefined,
      status: 'Ativo',
      dataCadastro: new Date().toISOString().split('T')[0],
    };

    setSalvando(true);
    try {
      await onSalvar(novoAtleta);
      limparFormulario();
    } catch (err: any) {
      setErro(err?.message || 'Não foi possível concluir o cadastro. Tente novamente.');
    } finally {
      setSalvando(false);
    }
  };

  const ocupado = salvando || salvandoExterno;

  return (
    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5" noValidate>
      {erro && (
        <div
          role="alert"
          className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-300 dark:border-red-800 text-red-800 dark:text-red-200 text-xs sm:text-sm font-bold flex items-center gap-2.5"
        >
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600 dark:text-red-400" />
          <span>{erro}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* 1. Nome Completo do Atleta * */}
        <div className="sm:col-span-2">
          <label
            htmlFor="campo-nome-completo"
            className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5"
          >
            Nome Completo do Atleta <span className="text-red-600">*</span>
          </label>
          <input
            id="campo-nome-completo"
            type="text"
            required
            placeholder="Ex: Gabriel Santos Ferreira"
            value={nomeCompleto}
            onChange={(e) => setNomeCompleto(e.target.value)}
            className="w-full min-h-[46px] px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        {/* 2. Apelido (Campinho / Estratégia) */}
        <div className="sm:col-span-2">
          <label
            htmlFor="campo-apelido"
            className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5"
          >
            Apelido (Campinho / Estratégia)
          </label>
          <input
            id="campo-apelido"
            type="text"
            placeholder="Ex: Biel"
            value={apelido}
            onChange={(e) => setApelido(e.target.value)}
            className="w-full min-h-[46px] px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        {/* 3. Identidade / RG */}
        <div>
          <label
            htmlFor="campo-rg"
            className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5"
          >
            Identidade / RG
          </label>
          <input
            id="campo-rg"
            type="text"
            placeholder="Ex: 12.345.678-9"
            value={rg}
            onChange={(e) => setRg(e.target.value)}
            className="w-full min-h-[46px] px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        {/* 4. CPF */}
        <div>
          <label
            htmlFor="campo-cpf"
            className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5"
          >
            CPF
          </label>
          <input
            id="campo-cpf"
            type="text"
            inputMode="numeric"
            placeholder="000.000.000-00"
            value={cpf}
            onChange={(e) => setCpf(formatarCpf(e.target.value))}
            className="w-full min-h-[46px] px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        {/* 5. Categoria * - botões para marcar */}
        <div className="sm:col-span-2">
          <span className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-2">
            Categoria <span className="text-red-600">*</span>
          </span>
          <div className="grid grid-cols-3 gap-2">
            {opcoesCategoria.map((cat) => {
              const selecionada = categoria === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategoria(cat)}
                  className={`min-h-[46px] px-3 py-2.5 rounded-xl text-xs sm:text-sm font-black border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    selecionada
                      ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-800/80 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                  style={
                    selecionada
                      ? { backgroundColor: '#2563eb', borderColor: '#2563eb', color: '#ffffff' }
                      : {}
                  }
                >
                  {selecionada && <Check className="w-4 h-4 shrink-0" />}
                  <span>{cat}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 6. Posição em Campo * - campo de seleção */}
        <div>
          <label
            htmlFor="campo-posicao"
            className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5"
          >
            Posição em Campo <span className="text-red-600">*</span>
          </label>
          <select
            id="campo-posicao"
            required
            value={posicao}
            onChange={(e) => setPosicao(e.target.value as PosicaoAtleta | '')}
            className="w-full min-h-[46px] px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="">Selecione a posição...</option>
            {POSICOES_CAMPO_OPTIONS.map((op) => (
              <option key={op.value} value={op.value}>
                {op.label}
              </option>
            ))}
          </select>
        </div>

        {/* 7. Pé dominante (Direito, Esquerdo, Ambos) */}
        <div>
          <span className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
            Pé dominante
          </span>
          <div className="grid grid-cols-3 gap-2">
            {PE_DOMINANTE_OPTIONS.map((op) => {
              const ativo = pernaDominante === op.value;
              return (
                <button
                  key={op.value}
                  type="button"
                  onClick={() => setPernaDominante(op.value)}
                  className={`min-h-[46px] px-2 py-2 rounded-xl text-xs font-black border transition-all cursor-pointer flex items-center justify-center ${
                    ativo
                      ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-800/80 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                  style={
                    ativo
                      ? { backgroundColor: '#2563eb', borderColor: '#2563eb', color: '#ffffff' }
                      : {}
                  }
                >
                  {op.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* 8. Altura */}
        <div>
          <label
            htmlFor="campo-altura"
            className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5"
          >
            Altura (cm)
          </label>
          <input
            id="campo-altura"
            type="text"
            inputMode="decimal"
            placeholder="Ex: 174"
            value={altura}
            onChange={(e) => setAltura(e.target.value)}
            className="w-full min-h-[46px] px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        {/* 9. Peso */}
        <div>
          <label
            htmlFor="campo-peso"
            className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5"
          >
            Peso (kg)
          </label>
          <input
            id="campo-peso"
            type="text"
            inputMode="decimal"
            placeholder="Ex: 68"
            value={peso}
            onChange={(e) => setPeso(e.target.value)}
            className="w-full min-h-[46px] px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        {/* 10. Data de nascimento */}
        <div className="sm:col-span-2">
          <label
            htmlFor="campo-data-nascimento"
            className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5"
          >
            Data de nascimento
          </label>
          <input
            id="campo-data-nascimento"
            type="date"
            value={dataNascimento}
            onChange={(e) => setDataNascimento(e.target.value)}
            className="w-full min-h-[46px] px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        {/* 11. Nome do Responsável Financeiro * */}
        <div>
          <label
            htmlFor="campo-nome-responsavel"
            className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5"
          >
            Nome do Responsável Financeiro <span className="text-red-600">*</span>
          </label>
          <input
            id="campo-nome-responsavel"
            type="text"
            required
            placeholder="Ex: Maria Santos Ferreira"
            value={nomeResponsavel}
            onChange={(e) => setNomeResponsavel(e.target.value)}
            className="w-full min-h-[46px] px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        {/* 12. Telefone do Responsável */}
        <div>
          <label
            htmlFor="campo-telefone-responsavel"
            className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5"
          >
            Telefone do Responsável
          </label>
          <input
            id="campo-telefone-responsavel"
            type="tel"
            inputMode="tel"
            placeholder="(21) 99999-9999"
            value={telefoneResponsavel}
            onChange={(e) => setTelefoneResponsavel(formatarTelefone(e.target.value))}
            className="w-full min-h-[46px] px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>
      </div>

      <div className="pt-2">
        <button
          type="submit"
          disabled={ocupado}
          className="w-full min-h-[50px] px-6 py-3.5 rounded-xl text-sm sm:text-base font-black text-white bg-blue-600 hover:bg-blue-700 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed shadow-md transition cursor-pointer flex items-center justify-center gap-2"
          style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
        >
          {ocupado ? 'Salvando cadastro...' : textoBotaoSalvar}
        </button>
      </div>
    </form>
  );
};
