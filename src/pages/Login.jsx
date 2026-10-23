import React from 'react';
import { Scissors } from 'lucide-react';

export default function Login({ email, setEmail, password, setPassword, loginError, onLogin }) {
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-8 shadow-2xl space-y-6">
        <div className="text-center">
          <div className="w-12 h-12 bg-indigo-600 rounded-xl mx-auto flex items-center justify-center text-white mb-3">
            <Scissors className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">AgendaPro Hair</h1>
          <p className="text-sm text-slate-500 mt-1">Faça login para acessar o sistema</p>
        </div>

        {loginError && <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-lg border border-rose-200">{loginError}</div>}

        <form onSubmit={onLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">E-mail</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" className="w-full border rounded-lg p-3 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Senha</label>
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full border rounded-lg p-3 text-sm" />
          </div>
          <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-lg transition shadow">
            Entrar no Sistema
          </button>
        </form>
      </div>
    </div>
  );
}
