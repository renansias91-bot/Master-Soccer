import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  KeyRound,
  Lock,
  ShieldCheck,
  User,
  X,
} from 'lucide-react';
import { MasterSoccerEscudo } from './MasterSoccerEscudo';
import {
  gerarHashSenhaFinanceiro,
  getHashPadraoFinanceiro,
  isAdmPrincipalEmail,
  salvarHashSenhaFinanceiroLocal,
  verificarCredenciaisFinanceiro,
  verificarSenhaFinanceiro,
} from '../services/financeiroAuth';
import { auth, firebaseService } from '../services/firebase';

interface FinanceiroBloqueioTelaProps {
  hashConfigurado: string | null;
  onDesbloquear: () => void;
}

export const FinanceiroBloqueioTela: React.FC<FinanceiroBloqueioTelaProps> = ({
  hashConfigurado,
  onDesbloquear,
}) => {
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [validando, setValidando] = useState(false);
  const [mostrarInfoEsqueceu, setMostrarInfoEsqueceu] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuario.trim() || !senha) {
      setErro('Informe o usuário e a senha do Financeiro.');
      return;
    }

    setValidando(true);
    setErro('');
    try {
      const ok = await verificarCredenciaisFinanceiro(usuario, senha, hashConfigurado);
      if (ok) {
        setSenha('');
        onDesbloquear();
      } else {
        setErro('Usuário ou senha incorretos.');
      }
    } finally {
      setValidando(false);
    }
  };

  return (
    <div className="min-h-[68vh] flex items-center justify-center py-6 px-2">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border-2 border-slate-200 dark:border-slate-800 shadow-xl p-6 sm:p-8 space-y-6">
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="relative">
            <MasterSoccerEscudo size={56} />
            <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-md border-2 border-white dark:border-slate-900">
              <Lock className="w-3.5 h-3.5" />
            </div>
          </div>

          <div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
              Acesso Restrito · Financeiro
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Digite o usuário e a senha exclusivos para acessar o módulo financeiro
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate autoComplete="off">
          {erro && (
            <div className="flex items-center gap-2 p-3 text-xs font-bold text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{erro}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Usuário
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={usuario}
                onChange={(e) => {
                  setUsuario(e.target.value);
                  setErro('');
                }}
                placeholder="Digite o usuário"
                autoComplete="off"
                autoCapitalize="none"
                autoCorrect="off"
                className="w-full h-11 pl-10 pr-4 text-sm font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Senha
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="password"
                value={senha}
                onChange={(e) => {
                  setSenha(e.target.value);
                  setErro('');
                }}
                placeholder="••••••••"
                autoComplete="current-password"
                className="w-full h-11 pl-10 pr-4 text-sm font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={validando}
            className="w-full min-h-[48px] py-3 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-98 disabled:opacity-50 text-white font-black text-sm shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
            style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
          >
            <Lock className="w-4 h-4" />
            <span>{validando ? 'Verificando...' : 'Entrar no Financeiro'}</span>
          </button>
        </form>

        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-center space-y-2.5">
          <button
            type="button"
            onClick={() => setMostrarInfoEsqueceu((prev) => !prev)}
            className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
          >
            Esqueceu a senha?
          </button>

          {mostrarInfoEsqueceu && (
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/70 text-xs font-semibold text-amber-900 dark:text-amber-200 text-left leading-relaxed">
              Por segurança, somente o <strong>ADM Principal</strong> pode redefinir a senha do Financeiro. Solicite ao administrador pelo menu lateral (☰ → Área do ADM).
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface FinanceiroAlterarSenhaModalProps {
  isOpen: boolean;
  hashConfigurado: string | null;
  onClose: () => void;
  onSenhaAlterada: (novoHash: string) => void;
  onExibirToast: (msg: string) => void;
}

export const FinanceiroAlterarSenhaModal: React.FC<FinanceiroAlterarSenhaModalProps> = ({
  isOpen,
  hashConfigurado,
  onClose,
  onSenhaAlterada,
  onExibirToast,
}) => {
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarNovaSenha, setConfirmarNovaSenha] = useState('');
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setSenhaAtual('');
    setNovaSenha('');
    setConfirmarNovaSenha('');
    setErro('');
    setSalvando(false);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!senhaAtual) {
      setErro('Informe a senha atual.');
      return;
    }
    if (novaSenha.length < 4) {
      setErro('A nova senha deve ter pelo menos 4 caracteres.');
      return;
    }
    if (novaSenha !== confirmarNovaSenha) {
      setErro('A confirmação da nova senha não confere.');
      return;
    }

    setSalvando(true);
    setErro('');
    try {
      const atualCorreta = await verificarSenhaFinanceiro(senhaAtual, hashConfigurado);
      if (!atualCorreta) {
        setErro('A senha atual está incorreta.');
        setSalvando(false);
        return;
      }

      if (novaSenha === senhaAtual) {
        setErro('A nova senha deve ser diferente da senha atual.');
        setSalvando(false);
        return;
      }

      const novoHash = await gerarHashSenhaFinanceiro(novaSenha);
      salvarHashSenhaFinanceiroLocal(novoHash);
      onSenhaAlterada(novoHash);

      try {
        await firebaseService.salvarHashSenhaFinanceiro(novoHash);
      } catch (err) {
        console.warn('Nova senha salva localmente (offline):', err);
      }

      onExibirToast('Senha do Financeiro alterada com sucesso!');
      onClose();
    } catch {
      setErro('Erro ao alterar senha. Tente novamente.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/65 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Alterar Senha do Financeiro
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                A senha antiga deixará de funcionar imediatamente
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

        <form onSubmit={handleSubmit} className="p-5 space-y-4" noValidate autoComplete="off">
          {erro && (
            <div className="flex items-center gap-2 p-3 text-xs font-bold text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{erro}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Senha Atual *
            </label>
            <input
              type="password"
              value={senhaAtual}
              onChange={(e) => {
                setSenhaAtual(e.target.value);
                setErro('');
              }}
              placeholder="••••••••"
              autoComplete="current-password"
              className="w-full min-h-[44px] px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Nova Senha *
            </label>
            <input
              type="password"
              value={novaSenha}
              onChange={(e) => {
                setNovaSenha(e.target.value);
                setErro('');
              }}
              placeholder="••••••••"
              autoComplete="new-password"
              className="w-full min-h-[44px] px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Confirmar Nova Senha *
            </label>
            <input
              type="password"
              value={confirmarNovaSenha}
              onChange={(e) => {
                setConfirmarNovaSenha(e.target.value);
                setErro('');
              }}
              placeholder="••••••••"
              autoComplete="new-password"
              className="w-full min-h-[44px] px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={salvando}
              className="min-h-[44px] px-5 py-2.5 text-xs font-black text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl shadow-xs transition cursor-pointer"
              style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
            >
              {salvando ? 'Salvando...' : 'Salvar Nova Senha'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface FinanceiroResetAdmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSenhaResetada: (hashPadrao: string) => void;
  onExibirToast: (msg: string) => void;
}

export const FinanceiroResetAdmModal: React.FC<FinanceiroResetAdmModalProps> = ({
  isOpen,
  onClose,
  onSenhaResetada,
  onExibirToast,
}) => {
  const [admVerificado, setAdmVerificado] = useState(false);
  const [emailAdmInput, setEmailAdmInput] = useState('');
  const [erro, setErro] = useState('');
  const [processando, setProcessando] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const usuarioAtual = auth.currentUser?.email || '';
    setAdmVerificado(isAdmPrincipalEmail(usuarioAtual));
    setEmailAdmInput('');
    setErro('');
    setProcessando(false);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleValidarGoogleAdm = async () => {
    setProcessando(true);
    setErro('');
    const res = await firebaseService.autenticarAdmGoogle();
    setProcessando(false);
    if (res.ok) {
      setAdmVerificado(true);
    } else if (res.erro) {
      setErro(res.erro);
    }
  };

  const handleValidarEmailAdm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmPrincipalEmail(emailAdmInput)) {
      setErro('E-mail não autorizado. Somente o ADM principal pode realizar esta ação.');
      return;
    }
    setErro('');
    setAdmVerificado(true);
  };

  const handleResetarParaPadrao = async () => {
    setProcessando(true);
    setErro('');
    try {
      const hashPadrao = await getHashPadraoFinanceiro();
      salvarHashSenhaFinanceiroLocal(hashPadrao);
      try {
        await firebaseService.salvarHashSenhaFinanceiro(hashPadrao);
      } catch (err) {
        console.warn('Reset salvo localmente (offline):', err);
      }
      onSenhaResetada(hashPadrao);
      onExibirToast('Senha do Financeiro redefinida pelo ADM para o acesso padrão!');
      onClose();
    } catch {
      setErro('Erro ao resetar a senha do Financeiro.');
    } finally {
      setProcessando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/65 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Área do ADM · Resetar Senha
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Exclusivo para o administrador principal do clube
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

        <div className="p-5 space-y-4">
          {erro && (
            <div className="flex items-center gap-2 p-3 text-xs font-bold text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{erro}</span>
            </div>
          )}

          {!admVerificado ? (
            <div className="space-y-4">
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Confirme sua identidade de <strong>ADM Principal</strong> para poder restaurar a senha padrão do módulo Financeiro.
              </p>

              <button
                type="button"
                onClick={handleValidarGoogleAdm}
                disabled={processando}
                className="w-full min-h-[44px] py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 text-white font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{processando ? 'Verificando...' : 'Confirmar com Conta Google do ADM'}</span>
              </button>

              <div className="relative flex items-center py-1">
                <div className="flex-grow border-t border-slate-200 dark:border-slate-800" />
                <span className="shrink mx-3 text-[11px] font-bold uppercase text-slate-400">
                  ou confirme o e-mail do ADM
                </span>
                <div className="flex-grow border-t border-slate-200 dark:border-slate-800" />
              </div>

              <form onSubmit={handleValidarEmailAdm} className="space-y-2.5" noValidate>
                <input
                  type="email"
                  value={emailAdmInput}
                  onChange={(e) => {
                    setEmailAdmInput(e.target.value);
                    setErro('');
                  }}
                  placeholder="Digite o e-mail do ADM principal"
                  autoComplete="off"
                  className="w-full min-h-[44px] px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  className="w-full min-h-[44px] py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs sm:text-sm transition cursor-pointer"
                  style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
                >
                  Validar E-mail do ADM
                </button>
              </form>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs font-bold text-emerald-800 dark:text-emerald-200">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>ADM Principal autorizado.</span>
              </div>

              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Ao confirmar abaixo, a senha do Financeiro voltará imediatamente para a <strong>senha padrão inicial</strong> e o acesso atual será bloqueado até novo login.
              </p>

              <div className="grid grid-cols-2 gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="min-h-[44px] py-2.5 px-4 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleResetarParaPadrao}
                  disabled={processando}
                  className="min-h-[44px] py-2.5 px-4 rounded-xl text-xs font-black text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50 transition cursor-pointer"
                  style={{ backgroundColor: '#d97706', color: '#ffffff' }}
                >
                  {processando ? 'Redefinindo...' : 'Resetar Senha'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
