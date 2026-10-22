import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { 
  Calendar, 
  Users, 
  Scissors, 
  Plus, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Phone, 
  Mail, 
  DollarSign,
  UserPlus,
  LogOut,
  Shield,
  UserCheck,
  UserX,
  CreditCard,
  Clock,
  ExternalLink,
  Copy,
  CalendarCheck,
  MessageSquare,
  AlertTriangle
} from 'lucide-react';

export default function App() {
  const [session, setSession] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Estados de Login
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Rota Pública de Agendamento (?pro=UUID_DO_PROFISSIONAL)
  const queryParams = new URLSearchParams(window.location.search);
  const publicProId = queryParams.get('pro');

  // Estados do Master
  const [activeTab, setActiveTab] = useState('master_profs');
  const [professionals, setProfessionals] = useState([]);
  const [licencas, setLicencas] = useState([]);

  // Modal Novo Profissional & Licença
  const [showAddProModal, setShowAddProModal] = useState(false);
  const [newProName, setNewProName] = useState('');
  const [newProEmail, setNewProEmail] = useState('');
  const [newProPhone, setNewProPhone] = useState('');
  const [newProPassword, setNewProPassword] = useState('');
  const [planoValor, setPlanoValor] = useState('50.00');
  const [formaPagamento, setFormaPagamento] = useState('Pix');
  const [diasAcesso, setDiasAcesso] = useState(30);
  const [proModalError, setProModalError] = useState('');
  const [proModalSuccess, setProModalSuccess] = useState('');

  // Estados da Agenda do Profissional e Agendamento Público
  const [publicProProfile, setPublicProProfile] = useState(null);
  const [publicServices, setPublicServices] = useState([]);
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [selectedService, setSelectedService] = useState('');
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('');
  const [publicSuccess, setPublicSuccess] = useState(false);

  // Verificar Sessão ao Iniciar
  useEffect(() => {
    if (publicProId) {
      loadPublicPageData(publicProId);
    } else {
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
    }
  }, [publicProId]);

  const loadPublicPageData = async (proId) => {
    try {
      const { data: pro } = await supabase.from('perfis').select('*').eq('id', proId).single();
      const { data: srv } = await supabase.from('servicos').select('*').eq('profissional_id', proId);
      setPublicProProfile(pro);
      setPublicServices(srv || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserProfile = async (userId) => {
    try {
      const { data, error } = await supabase.from('perfis').select('*').eq('id', userId).single();
      if (error) throw error;
      setUserProfile(data);
    } catch (error) {
      console.error('Erro ao buscar perfil:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session && userProfile) {
      loadAppData();
    }
  }, [session, userProfile]);

  const loadAppData = async () => {
    if (userProfile?.role === 'master') {
      const { data: profs } = await supabase.from('perfis').select('*').order('created_at', { ascending: false });
      const { data: lics } = await supabase.from('licencas').select('*, perfis(nome, email, telefone)').order('created_at', { ascending: false });
      setProfessionals(profs || []);
      setLicencas(lics || []);
    }
  };

  // Calcular dias restantes até o vencimento
  const getDiasRestantes = (dataVencimento) => {
    if (!dataVencimento) return 0;
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const venc = new Date(dataVencimento);
    venc.setHours(0, 0, 0, 0);
    const diffTime = venc - hoje;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Função para Enviar Lembrete via WhatsApp
  const enviarLembreteWhatsApp = (nomePro, telefonePro, dataVenc, diasRestantes) => {
    const numLimpo = (telefonePro || '').replace(/\D/g, '');
    let msg = `Olá, ${nomePro}! %0A%0ASeu acesso ao AgendaPro Hair vence em ${diasRestantes <= 0 ? 'HOJE' : diasRestantes + ' dias'} (${dataVenc}).%0A%0APara manter sua agenda ativa sem interrupções, realize a renovação da sua licença mensal.%0A%0AQualquer dúvida estamos à disposição!`;

    const url = numLimpo 
      ? `https://wa.me/55${numLimpo}?text=${msg}`
      : `https://wa.me/?text=${msg}`;

    window.open(url, '_blank');
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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUserProfile(null);
  };

  // Cadastrar Profissional com Licença Financeira Inicial
  const handleCreateProfessional = async (e) => {
    e.preventDefault();
    setProModalError('');
    setProModalSuccess('');

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newProEmail,
        password: newProPassword,
        options: { data: { nome: newProName } }
      });

      if (authError) throw authError;

      if (authData?.user) {
        // 1. Criar Perfil
        await supabase.from('perfis').insert([{
          id: authData.user.id,
          nome: newProName,
          email: newProEmail,
          telefone: newProPhone,
          role: 'professional',
          status: 'active'
        }]);

        // 2. Calcular Data de Vencimento
        const dataVenc = new Date();
        dataVenc.setDate(dataVenc.getDate() + parseInt(diasAcesso));

        // 3. Registrar Licença
        await supabase.from('licencas').insert([{
          profissional_id: authData.user.id,
          plano: 'Mensal',
          valor: parseFloat(planoValor),
          forma_pagamento: formaPagamento,
          data_pagamento: new Date().toISOString().split('T')[0],
          data_vencimento: dataVenc.toISOString().split('T')[0],
          status: 'active'
        }]);

        setProModalSuccess('Profissional e licença registradas com sucesso!');
        setNewProName('');
        setNewProEmail('');
        setNewProPhone('');
        setNewProPassword('');
        loadAppData();
        setTimeout(() => setShowAddProModal(false), 1500);
      }
    } catch (err) {
      setProModalError(err.message || 'Erro ao cadastrar profissional.');
    }
  };

  // Agendamento Público
  const handlePublicBooking = async (e) => {
    e.preventDefault();
    try {
      let { data: cli } = await supabase.from('clientes')
        .select('*')
        .eq('telefone', clientPhone)
        .eq('profissional_id', publicProId)
        .maybeSingle();

      if (!cli) {
        const { data: newCli } = await supabase.from('clientes').insert([{
          nome: clientName,
          telefone: clientPhone,
          profissional_id: publicProId
        }]).select().single();
        cli = newCli;
      }

      await supabase.from('agendamentos').insert([{
        cliente_id: cli.id,
        profissional_id: publicProId,
        servico_id: selectedService,
        data: bookingDate,
        horario: bookingTime,
        status: 'confirmado'
      }]);

      setPublicSuccess(true);
    } catch (e) {
      alert('Erro ao agendar. Tente novamente.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <p className="animate-pulse font-medium">Carregando AgendaPro...</p>
      </div>
    );
  }

  // ==========================================
  // PÁGINA PÚBLICA DE AGENDAMENTO (PARA CLIENTES)
  // ==========================================
  if (publicProId) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-6">
          <div className="text-center border-b pb-4">
            <div className="w-14 h-14 bg-indigo-600 rounded-2xl mx-auto flex items-center justify-center text-white mb-2 shadow-lg">
              <Scissors className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">{publicProProfile?.nome || 'Agenda Online'}</h1>
            <p className="text-xs text-slate-500 mt-1">Selecione o serviço e o horário desejado</p>
          </div>

          {publicSuccess ? (
            <div className="text-center py-8 space-y-3">
              <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto" />
              <h2 className="text-xl font-bold text-slate-900">Agendamento Solicitado!</h2>
              <p className="text-sm text-slate-600">Seu agendamento foi registrado na agenda do profissional.</p>
              <button onClick={() => setPublicSuccess(false)} className="mt-4 bg-indigo-600 text-white px-6 py-2 rounded-lg text-sm font-semibold">
                Fazer Novo Agendamento
              </button>
            </div>
          ) : (
            <form onSubmit={handlePublicBooking} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Seu Nome Completo</label>
                <input type="text" required value={clientName} onChange={e => setClientName(e.target.value)} placeholder="Ex: Ana Maria" className="w-full border rounded-lg p-3 text-sm" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Seu WhatsApp / Telefone</label>
                <input type="tel" required value={clientPhone} onChange={e => setClientPhone(e.target.value)} placeholder="(47) 99999-9999" className="w-full border rounded-lg p-3 text-sm" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Serviço Desejado</label>
                <select required value={selectedService} onChange={e => setSelectedService(e.target.value)} className="w-full border rounded-lg p-3 text-sm">
                  <option value="">Selecione o serviço...</option>
                  {publicServices.map(s => (
                    <option key={s.id} value={s.id}>{s.nome} - R$ {s.preco}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Data</label>
                  <input type="date" required value={bookingDate} onChange={e => setBookingDate(e.target.value)} className="w-full border rounded-lg p-3 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Horário</label>
                  <input type="time" required value={bookingTime} onChange={e => setBookingTime(e.target.value)} className="w-full border rounded-lg p-3 text-sm" />
                </div>
              </div>

              <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl transition shadow-lg mt-2">
                Confirmar Agendamento
              </button>
            </form>
          )}
        </div>
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
            <p className="text-sm text-slate-500 mt-1">Faça login para acessar a sua conta</p>
          </div>

          {loginError && <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-lg border border-rose-200">{loginError}</div>}

          <form onSubmit={handleLogin} className="space-y-4">
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

  // ==========================================
  // PAINEL MASTER (ADMINISTRADOR)
  // ==========================================
  if (userProfile.role === 'master') {
    const totalRecebido = licencas.reduce((acc, curr) => acc + (parseFloat(curr.valor) || 0), 0);
    
    // Filtrar licenças com vencimento nos próximos 7 dias (ou vencidas)
    const licencasProximosVencimentos = licencas.filter(l => {
      const dias = getDiasRestantes(l.data_vencimento);
      return dias <= 7;
    });

    return (
      <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col md:flex-row font-sans">
        <aside className="w-full md:w-64 bg-slate-900 text-slate-100 flex flex-col border-r border-slate-800">
          <div className="p-6 border-b border-slate-800 flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-lg text-white"><Shield className="w-6 h-6" /></div>
            <div>
              <h1 className="font-bold text-lg leading-tight">Painel Master</h1>
              <p className="text-xs text-indigo-400">Gestão & Licenças</p>
            </div>
          </div>

          <nav className="flex-1 p-4 space-y-1">
            <button onClick={() => setActiveTab('master_profs')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium ${activeTab === 'master_profs' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
              <Users className="w-5 h-5" /> Profissionais & Links
            </button>
            <button onClick={() => setActiveTab('master_finance')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium ${activeTab === 'master_finance' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
              <DollarSign className="w-5 h-5" /> Controle Financeiro
            </button>
            <button onClick={() => setActiveTab('master_vencimentos')} className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium ${activeTab === 'master_vencimentos' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-400" /> Próx. Vencimentos
              </div>
              {licencasProximosVencimentos.length > 0 && (
                <span className="bg-amber-500 text-slate-900 font-bold px-2 py-0.5 rounded-full text-xs">
                  {licencasProximosVencimentos.length}
                </span>
              )}
            </button>
          </nav>

          <div className="p-4 border-t border-slate-800">
            <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-rose-900/50 text-slate-300 hover:text-rose-200 py-2.5 rounded-lg text-sm transition">
              <LogOut className="w-4 h-4" /> Sair
            </button>
          </div>
        </aside>

        <main className="flex-1 p-8 overflow-y-auto">
          {/* ABA PROFISSIONAIS & LINKS */}
          {activeTab === 'master_profs' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Profissionais & Licenças Cadastradas</h2>
                  <p className="text-sm text-slate-500 mt-1">Gerencie os acessos, licenças e links de agendamento das cabeleireiras.</p>
                </div>
                <button onClick={() => setShowAddProModal(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg font-semibold text-sm flex items-center gap-2 shadow">
                  <UserPlus className="w-4 h-4" /> Cadastrar Novo Profissional
                </button>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
                {professionals.map(p => {
                  const licencaPro = licencas.find(l => l.profissional_id === p.id);
                  const diasRestantes = licencaPro ? getDiasRestantes(licencaPro.data_vencimento) : 0;
                  const linkPublico = `${window.location.origin}/?pro=${p.id}`;

                  return (
                    <div key={p.id} className="p-4 border rounded-xl bg-slate-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-slate-900 text-base">{p.nome}</h4>
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${p.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                            {p.status === 'active' ? 'Ativo' : 'Bloqueado'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">{p.email} • WhatsApp: {p.telefone || 'Não informado'}</p>
                        
                        {licencaPro && (
                          <div className="flex items-center gap-3 text-xs text-slate-600 pt-1">
                            <span>Valor Licença: <strong className="text-emerald-700">R$ {parseFloat(licencaPro.valor).toFixed(2)}</strong></span>
                            <span>• Vencimento: <strong>{licencaPro.data_vencimento}</strong></span>
                            <span className={`font-bold px-2 py-0.5 rounded ${diasRestantes <= 5 ? 'bg-rose-100 text-rose-700' : 'bg-indigo-50 text-indigo-700'}`}>
                              {diasRestantes <= 0 ? 'Vencido' : `${diasRestantes} dias restantes`}
                            </span>
                          </div>
                        )}

                        {p.role !== 'master' && (
                          <div className="mt-2 flex items-center gap-2 text-xs bg-white p-2 rounded-lg border text-slate-600">
                            <span className="font-semibold text-slate-700">Link Público:</span>
                            <span className="truncate max-w-xs text-indigo-600">{linkPublico}</span>
                            <button onClick={() => { navigator.clipboard.writeText(linkPublico); alert('Link copiado!'); }} className="p-1 hover:bg-slate-100 rounded text-slate-500" title="Copiar Link">
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>

                      {p.role !== 'master' && (
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => enviarLembreteWhatsApp(p.nome, p.telefone, licencaPro?.data_vencimento, diasRestantes)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-3 py-2 rounded-lg font-semibold flex items-center gap-1.5 shadow"
                          >
                            <MessageSquare className="w-4 h-4" /> Lembrete Whats
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ABA CONTROLE FINANCEIRO */}
          {activeTab === 'master_finance' && (
            <div>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-slate-900">Controle Financeiro de Licenças</h2>
                <p className="text-sm text-slate-500 mt-1">Histórico completo de pagamentos e liquidações das cabeleireiras.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                  <div className="p-3 bg-emerald-100 text-emerald-700 rounded-xl"><DollarSign className="w-8 h-8" /></div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase font-semibold">Faturamento Total</p>
                    <h3 className="text-2xl font-bold text-slate-900">R$ {totalRecebido.toFixed(2)}</h3>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                  <div className="p-3 bg-indigo-100 text-indigo-700 rounded-xl"><Users className="w-8 h-8" /></div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase font-semibold">Licenças Ativas</p>
                    <h3 className="text-2xl font-bold text-slate-900">{licencas.filter(l => l.status === 'active').length}</h3>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-100 text-slate-600 uppercase text-xs">
                    <tr>
                      <th className="p-3">Profissional</th>
                      <th className="p-3">Data Pagamento</th>
                      <th className="p-3">Forma Pagto</th>
                      <th className="p-3">Valor</th>
                      <th className="p-3">Vencimento</th>
                      <th className="p-3">Dias Restantes</th>
                      <th className="p-3">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {licencas.map(l => {
                      const dias = getDiasRestantes(l.data_vencimento);
                      return (
                        <tr key={l.id} className="hover:bg-slate-50">
                          <td className="p-3 font-semibold text-slate-900">{l.perfis?.nome || 'Cabeleireira'}</td>
                          <td className="p-3 text-slate-600">{l.data_pagamento}</td>
                          <td className="p-3 text-slate-600"><span className="px-2 py-1 bg-slate-100 border rounded text-xs">{l.forma_pagamento}</span></td>
                          <td className="p-3 font-bold text-emerald-700">R$ {parseFloat(l.valor).toFixed(2)}</td>
                          <td className="p-3 text-slate-600 font-medium">{l.data_vencimento}</td>
                          <td className="p-3">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${dias <= 5 ? 'bg-rose-100 text-rose-800' : 'bg-indigo-100 text-indigo-800'}`}>
                              {dias <= 0 ? 'Vencido' : `${dias} dias`}
                            </span>
                          </td>
                          <td className="p-3">
                            <button 
                              onClick={() => enviarLembreteWhatsApp(l.perfis?.nome, l.perfis?.telefone, l.data_vencimento, dias)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-2.5 py-1.5 rounded font-semibold flex items-center gap-1"
                            >
                              <MessageSquare className="w-3.5 h-3.5" /> Whats
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ABA PRÓXIMOS VENCIMENTOS (7 DIAS) */}
          {activeTab === 'master_vencimentos' && (
            <div>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-slate-900">Próximos Vencimentos (Até 7 Dias)</h2>
                <p className="text-sm text-slate-500 mt-1">Lista de profissionais com renovação próxima para envio de cobrança preventiva.</p>
              </div>

              {licencasProximosVencimentos.length === 0 ? (
                <div className="bg-white rounded-xl border p-8 text-center text-slate-500">
                  <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
                  <p className="font-semibold text-slate-800">Nenhum vencimento para os próximos 7 dias!</p>
                  <p className="text-xs text-slate-500 mt-1">Todas as licenças estão em dia com prazo superior a 7 dias.</p>
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-amber-50 text-amber-900 uppercase text-xs">
                      <tr>
                        <th className="p-3">Profissional</th>
                        <th className="p-3">E-mail / Whats</th>
                        <th className="p-3">Data Vencimento</th>
                        <th className="p-3">Prazo</th>
                        <th className="p-3">Valor Mensalidade</th>
                        <th className="p-3">Cobrança WhatsApp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {licencasProximosVencimentos.map(l => {
                        const dias = getDiasRestantes(l.data_vencimento);
                        return (
                          <tr key={l.id} className="hover:bg-slate-50">
                            <td className="p-3 font-bold text-slate-900">{l.perfis?.nome}</td>
                            <td className="p-3 text-slate-600 text-xs">{l.perfis?.email}<br/>{l.perfis?.telefone || 'Sem Whats'}</td>
                            <td className="p-3 font-semibold text-slate-800">{l.data_vencimento}</td>
                            <td className="p-3">
                              <span className={`px-3 py-1 rounded-full text-xs font-bold ${dias <= 0 ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'}`}>
                                {dias <= 0 ? 'Vencido' : `Vence em ${dias} dias`}
                              </span>
                            </td>
                            <td className="p-3 font-bold text-emerald-700">R$ {parseFloat(l.valor).toFixed(2)}</td>
                            <td className="p-3">
                              <button 
                                onClick={() => enviarLembreteWhatsApp(l.perfis?.nome, l.perfis?.telefone, l.data_vencimento, dias)}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 shadow"
                              >
                                <MessageSquare className="w-4 h-4" /> Cobrar via Whats
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </main>

        {/* MODAL CADASTRAR PROFISSIONAL + LICENÇA */}
        {showAddProModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border space-y-4">
              <div className="flex justify-between items-center border-b pb-3">
                <h3 className="font-bold text-slate-900 text-lg">Novo Profissional & Licença</h3>
                <button onClick={() => setShowAddProModal(false)}><XCircle className="w-5 h-5 text-slate-400" /></button>
              </div>

              {proModalError && <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-lg border border-rose-200">{proModalError}</div>}
              {proModalSuccess && <div className="p-3 bg-emerald-50 text-emerald-700 text-xs rounded-lg border border-emerald-200">{proModalSuccess}</div>}

              <form onSubmit={handleCreateProfessional} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Nome / Salão</label>
                    <input type="text" required value={newProName} onChange={e => setNewProName(e.target.value)} placeholder="Ex: Salão Beleza" className="w-full border rounded-lg p-2.5 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">E-mail de Acesso</label>
                    <input type="email" required value={newProEmail} onChange={e => setNewProEmail(e.target.value)} placeholder="email@exemplo.com" className="w-full border rounded-lg p-2.5 text-sm" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">WhatsApp (DDD + Número)</label>
                    <input type="tel" required value={newProPhone} onChange={e => setNewProPhone(e.target.value)} placeholder="47999999999" className="w-full border rounded-lg p-2.5 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Senha Inicial</label>
                    <input type="password" required value={newProPassword} onChange={e => setNewProPassword(e.target.value)} placeholder="Mínimo 6 caracteres" className="w-full border rounded-lg p-2.5 text-sm" />
                  </div>
                </div>

                <div className="border-t pt-3 mt-3">
                  <h4 className="text-xs font-bold text-indigo-600 uppercase mb-2">Dados da Licença / Pagamento</h4>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Valor (R$)</label>
                      <input type="number" step="0.01" required value={planoValor} onChange={e => setPlanoValor(e.target.value)} className="w-full border rounded-lg p-2 text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Forma Pagto</label>
                      <select value={formaPagamento} onChange={e => setFormaPagamento(e.target.value)} className="w-full border rounded-lg p-2 text-sm">
                        <option value="Pix">Pix</option>
                        <option value="Cartão">Cartão</option>
                        <option value="Dinheiro">Dinheiro</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Validade (Dias)</label>
                      <input type="number" required value={diasAcesso} onChange={e => setDiasAcesso(e.target.value)} className="w-full border rounded-lg p-2 text-sm" />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-3">
                  <button type="button" onClick={() => setShowAddProModal(false)} className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg">Cancelar</button>
                  <button type="submit" className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow">Cadastrar & Liberar Acesso</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
}
