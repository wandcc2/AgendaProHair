import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { 
  Calendar, 
  Users, 
  Clock, 
  Scissors, 
  MessageSquare, 
  Plus, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Search, 
  Phone, 
  Mail, 
  Trash2, 
  DollarSign,
  UserPlus,
  Send,
  CalendarCheck,
  LogOut,
  Shield,
  Lock
} from 'lucide-react';

export default function App() {
  const [session, setSession] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Estados de Login
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Estados dos Dados
  const [activeTab, setActiveTab] = useState('agenda');
  const [clients, setClients] = useState([]);
  const [services, setServices] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [professionals, setProfessionals] = useState([]); // Para o Master
  const [licencas, setLicencas] = useState([]); // Para o Master

  // Verificar Sessão ao Iniciar
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchUserProfile(session.user.id);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchUserProfile(session.user.id);
      else {
        setUserProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('perfis')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setUserProfile(data);
    } catch (error) {
      console.error('Erro ao buscar perfil:', error);
    } finally {
      setLoading(false);
    }
  };

  // Carregar dados quando houver sessão
  useEffect(() => {
    if (session && userProfile) {
      loadAppData();
    }
  }, [session, userProfile]);

  const loadAppData = async () => {
    if (userProfile?.role === 'master') {
      // Master carrega todos os profissionais, licenças e dados globais
      const { data: profs } = await supabase.from('perfis').select('*');
      const { data: lics } = await supabase.from('licencas').select('*, perfis(nome)');
      setProfessionals(profs || []);
      setLicencas(lics || []);
    } else if (userProfile) {
      // Profissional carrega apenas seus próprios dados
      const { data: cli } = await supabase.from('clientes').select('*').eq('profissional_id', userProfile.id);
      const { data: srv } = await supabase.from('servicos').select('*').eq('profissional_id', userProfile.id);
      const { data: appt } = await supabase.from('agendamentos').select('*').eq('profissional_id', userProfile.id);
      
      setClients(cli || []);
      setServices(srv || []);
      setAppointments(appt || []);
    }
  };

  // Login
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setLoginError('E-mail ou senha incorretos.');
      setLoading(false);
    }
  };

  // Logout
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUserProfile(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <p className="animate-pulse">Carregando AgendaPro...</p>
      </div>
    );
  }

  // TELA DE LOGIN SE NÃO ESTIVER AUTENTICADO
  if (!session || !userProfile) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl max-w-md w-full p-8 shadow-2xl space-y-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-indigo-600 rounded-xl mx-auto flex items-center justify-center text-white mb-3">
              <Scissors className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">AgendaPro Hair</h1>
            <p className="text-sm text-slate-500 mt-1">Faça login para acessar sua agenda</p>
          </div>

          {loginError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
              {loginError}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">E-mail</label>
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Senha</label>
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <button 
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-lg transition shadow"
            >
              Entrar no Sistema
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ==========================================
  // PAINEL MASTER (ADMINISTRADOR)
  // ==========================================
  if (userProfile.role === 'master') {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col md:flex-row font-sans">
        <aside className="w-full md:w-64 bg-slate-900 text-slate-100 flex flex-col border-r border-slate-800">
          <div className="p-6 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-600 rounded-lg text-white"><Shield className="w-6 h-6" /></div>
              <div>
                <h1 className="font-bold text-lg leading-tight">Painel Master</h1>
                <p className="text-xs text-indigo-400">Administração Geral</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 p-4 space-y-1">
            <button onClick={() => setActiveTab('master_profs')} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium bg-indigo-600 text-white">
              <Users className="w-5 h-5" /> Profissionais & Licenças
            </button>
          </nav>

          <div className="p-4 border-t border-slate-800">
            <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-rose-900/50 text-slate-300 hover:text-rose-200 py-2.5 rounded-lg text-sm transition">
              <LogOut className="w-4 h-4" /> Sair da Conta
            </button>
          </div>
        </aside>

        <main className="flex-1 p-8 overflow-y-auto">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Gerenciamento de Profissionais e Licenças</h2>
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <p className="text-sm text-slate-600 mb-4">Lista de cabeleireiras/profissionais cadastradas no sistema:</p>
            <div className="space-y-3">
              {professionals.map(p => (
                <div key={p.id} className="p-4 border border-slate-200 rounded-lg flex justify-between items-center bg-slate-50">
                  <div>
                    <h3 className="font-bold text-slate-900">{p.nome}</h3>
                    <p className="text-xs text-slate-500">{p.email} • Função: <span className="uppercase font-semibold text-indigo-600">{p.role}</span></p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${p.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                    {p.status === 'active' ? 'Ativo' : 'Bloqueado'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ==========================================
  // PAINEL DA PROFISSIONAL / CABELEIREIRA
  // ==========================================
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col md:flex-row font-sans">
      <aside className="w-full md:w-64 bg-slate-900 text-slate-100 flex flex-col border-r border-slate-800">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-lg text-white"><Scissors className="w-6 h-6" /></div>
            <div>
              <h1 className="font-bold text-lg leading-tight">{userProfile.nome}</h1>
              <p className="text-xs text-slate-400">Agenda Profissional</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          <button onClick={() => setActiveTab('agenda')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium ${activeTab === 'agenda' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
            <Calendar className="w-5 h-5" /> Minha Agenda
          </button>
          <button onClick={() => setActiveTab('clients')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium ${activeTab === 'clients' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
            <Users className="w-5 h-5" /> Meus Clientes
          </button>
          <button onClick={() => setActiveTab('services')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium ${activeTab === 'services' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
            <Scissors className="w-5 h-5" /> Meus Serviços
          </button>
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-rose-900/50 text-slate-300 hover:text-rose-200 py-2.5 rounded-lg text-sm transition">
            <LogOut className="w-4 h-4" /> Sair
          </button>
        </div>
      </aside>

      <main className="flex-1 p-8 overflow-y-auto">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mb-6">
          <h2 className="text-xl font-bold text-slate-900">Bem-vinda, {userProfile.nome}!</h2>
          <p className="text-sm text-slate-500">Seus dados e agendamentos estão isolados com segurança no banco de dados.</p>
        </div>
        {/* Aqui você pode manter os componentes de Agenda, Clientes e Serviços vinculados ao ID do usuário logado */}
      </main>
    </div>
  );
}
