import React, { useState } from 'react';
import {
  Shield,
  Key,
  Mail,
  Lock,
  X,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  UserCheck,
  RotateCcw,
} from 'lucide-react';
import { storage } from '../services/storage';
import { User } from '../types';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: User) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [mode, setMode] = useState<'login' | 'recover'>('login');
  const [recoveredPass, setRecoveredPass] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const result = storage.authenticate(email, password);
    if (result.success && result.user) {
      setSuccessMsg(`Bem-vindo, ${result.user.name}!`);
      setTimeout(() => {
        onLoginSuccess(result.user!);
        onClose();
      }, 700);
    } else {
      setErrorMsg(result.message);
    }
  };

  const handleDevQuickLogin = () => {
    setEmail('ale11062@gmail.com');
    setPassword('cast@2468');
    setErrorMsg(null);
    const result = storage.authenticate('ale11062@gmail.com', 'cast@2468');
    if (result.success && result.user) {
      setSuccessMsg('Autenticado com credenciais Dev Master!');
      setTimeout(() => {
        onLoginSuccess(result.user!);
        onClose();
      }, 700);
    } else {
      setErrorMsg(result.message);
    }
  };

  const handleRecover = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setRecoveredPass(null);

    if (!email) {
      setErrorMsg('Informe o e-mail cadastrado para recuperar.');
      return;
    }

    const result = storage.recoverPassword(email);
    if (result.success) {
      setSuccessMsg(result.message);
      setRecoveredPass(result.recoveredPassword || null);
    } else {
      setErrorMsg(result.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-slate-800 border border-emerald-500/40 flex items-center justify-center overflow-hidden shrink-0 shadow-md">
              <img src="/pwa-192x192.png" alt="Portaria360" className="w-full h-full object-cover" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                {mode === 'login' ? 'Acesso ao Portaria360' : 'Recuperação de Senha'}
              </h3>
              <p className="text-[11px] text-slate-400">Autenticação de Operadores e Gestores</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Dev Login Banner */}
        {mode === 'login' && (
          <div className="bg-gradient-to-r from-emerald-950/80 via-indigo-950/80 to-purple-950/80 border-b border-indigo-900/40 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-300">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Acesso Rápido Desenvolvedor / Master</span>
                </div>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  Conta cadastrada: <strong className="text-white font-mono">ale11062@gmail.com</strong>
                </p>
              </div>

              <button
                type="button"
                onClick={handleDevQuickLogin}
                className="px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow transition-all flex items-center gap-1 cursor-pointer shrink-0"
              >
                <span>Acessar</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Body Form */}
        <div className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-lg bg-emerald-950/70 border border-emerald-800 text-emerald-200 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {recoveredPass && (
            <div className="p-3 rounded-lg bg-slate-950 border border-emerald-500/60 text-xs space-y-1">
              <span className="text-slate-400 block text-[11px]">Sua senha encontrada:</span>
              <div className="font-mono text-emerald-400 font-bold text-sm bg-slate-900 px-3 py-1.5 rounded border border-slate-800 flex items-center justify-between">
                <span>{recoveredPass}</span>
                <button
                  type="button"
                  onClick={() => {
                    setPassword(recoveredPass);
                    setMode('login');
                  }}
                  className="text-[10px] text-indigo-400 hover:underline"
                >
                  Usar para login
                </button>
              </div>
            </div>
          )}

          {mode === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>E-mail do Usuário</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="ex: ale11062@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono-tabular"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Senha de Acesso</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('recover');
                      setErrorMsg(null);
                      setSuccessMsg(null);
                    }}
                    className="text-[11px] text-indigo-400 hover:text-indigo-300 hover:underline"
                  >
                    Esqueceu a senha?
                  </button>
                </div>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] text-white text-xs font-bold rounded-lg shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>Entrar no Sistema</span>
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleRecover} className="space-y-4">
              <p className="text-xs text-slate-400">
                Digite o e-mail cadastrado para localizar sua senha ou gerar novas credenciais.
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>E-mail Cadastrado</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="ex: ale11062@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setErrorMsg(null);
                    setSuccessMsg(null);
                  }}
                  className="flex-1 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg transition-colors"
                >
                  Voltar ao Login
                </button>

                <button
                  type="submit"
                  className="flex-1 py-2 px-3 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Recuperar Senha</span>
                </button>
              </div>
            </form>
          )}

          {/* Quick preset account hints */}
          <div className="mt-4 pt-4 border-t border-slate-800 text-[11px] text-slate-400 space-y-1.5">
            <span className="font-semibold text-slate-300 block">Usuários configurados:</span>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setEmail('ale11062@gmail.com');
                  setPassword('cast@2468');
                }}
                className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-emerald-300 rounded border border-slate-700 text-[10px]"
              >
                ale11062@gmail.com (Dev)
              </button>
              <button
                type="button"
                onClick={() => {
                  setEmail('sindico@solardaspalmeiras.com.br');
                  setPassword('admin@solarpalmeiras');
                }}
                className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 text-[10px]"
              >
                Síndico (Admin)
              </button>
              <button
                type="button"
                onClick={() => {
                  setEmail('joao.portaria@solardaspalmeiras.com.br');
                  setPassword('portaria@joao');
                }}
                className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 text-[10px]"
              >
                João (Porteiro)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
