import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { createClient } from '@supabase/supabase-js';
import { 
  Calendar, 
  Users, 
  Scissors, 
  Plus, 
  CheckCircle2, 
  XCircle, 
  Phone, 
  Mail, 
  DollarSign,
  UserPlus,
  LogOut,
  Shield,
  CreditCard,
  Clock,
  Copy,
  MessageSquare,
  AlertTriangle,
  Edit,
  RefreshCw,
  CalendarPlus,
  Trash2,
  ExternalLink,
  Share2,
  ChevronDown,
  ChevronUp,
  Check,
  X,
  Settings
} from 'lucide-react';

const SUPABASE_URL = 'https://ujdaesnmqhkzefqdwygk.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_PWOqJOgpsoJQT3FNDxB-Tw_5jURYgth';
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false }
});

export default function App() {
  const [session, setSession] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Login
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Rota Pública (?pro=UUID)
  const queryParams = new URLSearchParams(window.location.search);
  const publicProId = queryParams.get('pro');

  // Master
  const [activeTab, setActiveTab] = useState('master_profs');
  const [professionals, setProfessionals] = useState([]);
  const [licencas, setLicencas] = useState([]);

  // Modal Novo Profissional (Master)
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

  // Profissional / Cabeleireira
  const [proTab, setProTab] = useState('agenda');
  const [proClients, setProClients] = useState([]);
  const [proServices, setProServices] = useState([]);
  const [proAppointments, setProAppointments] = useState([]);
  const [expandedServiceId, setExpandedServiceId] = useState(null);

  // Configuração de Horário do Profissional
  const [horaInicio, setHoraInicio] = useState('08:00');
  const [horaFim, setHoraFim] = useState('18:00');
  const [configSuccess, setConfigSuccess] = useState('');

  // Modal Criar/Editar Serviço
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState(null);
  const [serviceName, setServiceName] = useState('');
  const [servicePrice, setServicePrice] = useState('');
  const [serviceDesc, setServiceDesc] = useState('');
  const [serviceDuration, setServiceDuration] = useState('30');
  const [serviceError, setServiceError] = useState('');

  // Modal Novo Cliente
  const [showAddClientModal, setShowAddClientModal] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [clientError, setClientError] = useState('');

  // Modal Agendamento Manual
  const [showAddApptModal, setShowAddApptModal] = useState(false);
  const [apptClientType, setApptClientType] = useState('existing');
  const [selectedClientId, setSelectedClientId] = useState('');
  const [manualClientName, setManualClientName] = useState('');
  const [manualClientPhone, setManualClientPhone] = useState('');
  const [manualServiceId, setManualServiceId] = useState('');
  const [manualDate, setManualDate] = useState('');
  const [manualTime, setManualTime] = useState('');

  // Página Pública
  const [publicProProfile, setPublicProProfile] = useState(null);
  const [publicServices, setPublicServices] = useState([]);
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [selectedService, setSelectedService] = useState('');
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('');
  const [publicFormaPagto, setPublicFormaPagto] = useState('Pix no Local');
  const [publicSuccess, setPublicSuccess] = useState(false);

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
      if (data?.hora_inicio) setHoraInicio(data.hora_inicio);
      if (data?.hora_fim) setHoraFim(data.hora_fim);
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
    } else if (userProfile) {
      const { data: cli } = await supabase.from('clientes').select('*').eq('profissional_id', userProfile.id).order('nome', { ascending: true });
      const { data: srv } = await supabase.from('servicos').select('*').eq('profissional_id', userProfile.id).order('nome', { ascending: true });
      const { data: appt } = await supabase.from('agendamentos').select('*, clientes(nome, telefone), servicos(nome, preco)').eq('profissional_id', userProfile.id).order('data', { ascending: true });

      setProClients(cli || []);
      setProServices(srv || []);
      setProAppointments(appt || []);
    }
  };

  const salvarHorarioAtendimento = async (e) => {
    e.preventDefault();
    setConfigSuccess('');

    const { error } = await supabase.from('perfis').update({
      hora_inicio: horaInicio,
      hora_fim: horaFim
    }).eq('id', userProfile.id);

    if (!error) {
      setConfigSuccess('Horário de atendimento atualizado com sucesso!');
      setTimeout(() => setConfigSuccess(''), 3000);
    } else {
      alert('Erro ao salvar horário.');
    }
  };

  const enviarLinkAgendamentoWhats = (nomeCliente, telefoneCliente) => {
    const numLimpo = (telefoneCliente || '').replace(/\D/g, '');
    if (!numLimpo) {
      alert('Esta cliente não possui telefone/WhatsApp cadastrado.');
      return;
    }

    const linkPublico = `${window.location.origin}/?pro=${userProfile?.id}`;
    const msg = `Olá, ${nomeCliente}! %0A%0AAgora você pode agendar seus horários no salão *${userProfile?.nome}* diretamente pelo nosso site de agendamento online! %0A%0AAcesse o link abaixo para escolher o melhor dia e horário:%0A${linkPublico}%0A%0ATe esperamos! 😊`;

    window.open(`https://wa.me/55${numLimpo}?text=${msg}`, '_blank');
  };

  const handleOpenAddServiceModal = () => {
    setEditingServiceId(null);
    setServiceName('');
    setServicePrice('');
    setServiceDesc('');
    setServiceDuration('30');
    setServiceError('');
    setShowServiceModal(true);
  };

  const handleOpenEditServiceModal = (srv) => {
    setEditingServiceId(srv.id);
    setServiceName(srv.nome);
    setServicePrice(srv.preco);
    setServiceDesc(srv.descricao || '');
    setServiceDuration(srv.duracao_minutos || '30');
    setServiceError('');
    setShowServiceModal(true);
  };

  const handleSaveService = async (e) => {
    e.preventDefault();
    setServiceError('');

    try {
      if (editingServiceId) {
        const { error } = await supabase.from('servicos').update({
          nome: serviceName,
          preco: parseFloat(servicePrice),
          descricao: serviceDesc,
          duracao_minutos: parseInt(serviceDuration)
        }).eq('id', editingServiceId);

        if (error) throw error;
      } else {
        const { error } = await supabase.from('servicos').insert([{
          nome: serviceName,
          preco: parseFloat(servicePrice),
          descricao: serviceDesc,
          duracao_minutos: parseInt(serviceDuration),
          profissional_id: userProfile.id
        }]);

        if (error) throw error;
      }

      setShowServiceModal(false);
      setServiceName('');
      setServicePrice('');
      setServiceDesc('');
      setServiceDuration('30');
      setEditingServiceId(null);
      await loadAppData();
    } catch (err) {
      setServiceError(err.message || 'Erro ao salvar serviço.');
    }
  };

  const handleDeleteService = async (serviceId) => {
    if (window.confirm('Deseja realmente remover este serviço/produto?')) {
      await supabase.from('servicos').delete().eq('id', serviceId);
      loadAppData();
    }
  };

  const handleUpdateApptStatus = async (apptId, newStatus) => {
    const { error } = await supabase.from('agendamentos').update({ status: newStatus }).eq('id', apptId);
    if (!error) {
      loadAppData();
    } else {
      alert('Erro ao atualizar status do agendamento.');
    }
  };

  const handleAddClient = async (e) => {
    e.preventDefault();
    setClientError('');

    try {
      const { error } = await supabase.from('clientes').insert([{
        nome: newClientName,
        telefone: newClientPhone,
        profissional_id: userProfile.id
      }]);

      if (error) throw error;

      setShowAddClientModal(false);
      setNewClientName('');
      setNewClientPhone('');
      await loadAppData();
    } catch (err) {
      setClientError(err.message || 'Erro ao cadastrar cliente.');
    }
  };

  const handleCreateProfessional = async (e) => {
    e.preventDefault();
    setProModalError('');
    setProModalSuccess('');

    try {
      const { data: authData, error: authError } = await supabaseAdmin.auth.signUp({
        email: newProEmail,
        password: newProPassword,
        options: { data: { nome: newProName } }
      });

      if (authError) throw authError;

      if (authData?.user) {
        await supabase.from('perfis').insert([{
          id: authData.user.id,
          nome: newProName,
          email: newProEmail,
          telefone: newProPhone,
          role: 'professional',
          status: 'active'
        }]);

        const dataVenc = new Date();
        dataVenc.setDate(dataVenc.getDate() + parseInt(diasAcesso));

        await supabase.from('licencas').insert([{
          profissional_id: authData.user.id,
          plano: 'Mensal',
          valor: parseFloat(planoValor),
          forma_pagamento: formaPagamento,
          data_pagamento: new Date().toISOString().split('T')[0],
          data_vencimento: dataVenc.toISOString().split('T')[0],
          status: 'active'
        }]);

        setProModalSuccess('Profissional cadastrado com sucesso!');
        setNewProName('');
        setNewProEmail('');
        setNewProPhone('');
        setNewProPassword('');
        
        await loadAppData();
        setTimeout(() => setShowAddProModal(false), 1200);
      }
    } catch (err) {
      setProModalError(err.message || 'Erro ao cadastrar profissional.');
    }
  };

  const handleAddManualAppointment = async (e) => {
    e.preventDefault();
    try {
      let finalClientId = selectedClientId;

      if (apptClientType === 'new') {
        const { data: newCli, error: cliErr } = await supabase.from('clientes').insert([{
          nome: manualClientName,
          telefone: manualClientPhone,
          profissional_id: userProfile.id
        }]).select().single();

        if (cliErr) throw cliErr;
        finalClientId = newCli.id;
      }

      const { error: apptErr } = await supabase.from('agendamentos').insert([{
        cliente_id: finalClientId,
        profissional_id: userProfile.id,
        servico_id: manualServiceId,
        data: manualDate,
        horario: manualTime,
        status: 'confirmado'
      }]);

      if (apptErr) throw apptErr;

      setShowAddApptModal(false);
      setManualClientName('');
      setManualClientPhone('');
      setSelectedClientId('');
      setManualServiceId('');
      setManualDate('');
      setManualTime('');
      loadAppData();
    } catch (err) {
      alert('Erro ao criar agendamento: ' + err.message);
    }
  };

  const handlePublicBookingSubmit = async (e) => {
    e.preventDefault();
    try {
      const hInicio = publicProProfile?.hora_inicio || '08:00';
      const hFim = publicProProfile?.hora_fim || '18:00';

      if (bookingTime < hInicio || bookingTime > hFim) {
        alert(`O salão atende somente entre ${hInicio.substring(0,5)} e ${hFim.substring(0,5)}. Por favor, escolha outro horário dentro do expediente.`);
        return;
      }

      const { data: busy } = await supabase.from('agendamentos')
        .select('*')
        .eq('profissional_id', publicProId)
        .eq('data', bookingDate)
        .eq('horario', bookingTime)
        .eq('status', 'confirmado');

      if (busy && busy.length > 0) {
        alert('Este horário já foi reservado para outra cliente. Por favor, escolha outro horário.');
        return;
      }

      let { data: cli } = await supabase.from('clientes')
        .select('*')
        .eq('telefone', clientPhone)
        .eq('profissional_id', publicProId)
        .maybeSingle();

      if (!cli) {
        const { data: newCli, error: cliInsertErr } = await supabase.from('clientes').insert([{ 
          nome: clientName, 
          telefone: clientPhone, 
          profissional_id: publicProId 
        }]).select().single();

        if (cliInsertErr) throw cliInsertErr;
        cli = newCli;
      }

      const { error: apptInsertErr } = await supabase.from('agendamentos').insert([{ 
        cliente_id: cli.id, 
        profissional_id: publicProId, 
        servico_id: selectedService, 
        data: bookingDate, 
        horario: bookingTime, 
        forma_pagamento: publicFormaPagto,
        status: 'pendente' 
      }]);

      if (apptInsertErr) throw apptInsertErr;

      setPublicSuccess(true);
    } catch (e) {
      console.error(e);
      alert('Erro ao solicitar agendamento: ' + (e.message || 'Verifique as permissões.'));
    }
  };

  const enviarConfirmacaoWhatsApp = (nomeCliente, telefoneCliente, data, horario, servicoNome) => {
    const numLimpo = (telefoneCliente || '').replace(/\D/g, '');
    if (!numLimpo) {
      alert('Esta cliente não tem um telefone cadastrado.');
      return;
    }

    const partesData = data.split('-');
    const dataFormatada = `${partesData[2]}/${partesData[1]}/${partesData[0]}`;
    const msg = `Olá, ${nomeCliente}! %0A%0APassando para lembrar do seu agendamento no salão *${userProfile?.nome}*:%0A%0A🗓️ *Data:* ${dataFormatada}%0A⏰ *Horário:* ${horario}%0A💇‍♀️ *Serviço:* ${servicoNome}%0A%0APor favor, responda esta mensagem confirmando a sua presença! 😊`;

    window.open(`https://wa.me/55${numLimpo}?text=${msg}`, '_blank');
  };

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

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <p className="animate-pulse font-medium">Carregando AgendaPro...</p>
      </div>
    );
  }

  // PÁGINA PÚBLICA DE AGENDAMENTO (?pro=UUID)
  if (publicProId) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-6">
          <div className="text-center border-b pb-4">
            <div className="w-14 h-14 bg-indigo-600 rounded-2xl mx-auto flex items-center justify-center text-white mb-2 shadow-lg">
              <Scissors className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">{publicProProfile?.nome || 'Agenda Online'}</h1>
            <p className="text-xs text-slate-500 mt-1">
              Horário de Atendimento: <strong className="text-slate-700">{publicProProfile?.hora_inicio?.substring(0,5) || '08:00'} às {publicProProfile?.hora_fim?.substring(0,5) || '18:00'}</strong>
            </p>
          </div>

          {publicSuccess ? (
            <div className="text-center py-8 space-y-3">
              <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto" />
              <h2 className="text-xl font-bold text-slate-900">Solicitação Enviada!</h2>
              <p className="text-sm text-slate-600">Sua solicitação de agendamento foi enviada. O salão confirmará em breve!</p>
              <button onClick={() => setPublicSuccess(false)} className="mt-4 bg-indigo-600 text-white px-6 py-2 rounded-lg text-sm font-semibold">
                Solicitar Outro Agendamento
              </button>
            </div>
          ) : (
            <form onSubmit={handlePublicBookingSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Seu Nome Completo</label>
                <input type="text" required value={clientName} onChange={e => setClientName(e.target.value)} placeholder="Ex: Ana Maria" className="w-full border rounded-lg p-3 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Seu WhatsApp</label>
                <input type="tel" required value={clientPhone} onChange={e => setClientPhone(e.target.value)} placeholder="(47) 99999-9999" className="w-full border rounded-lg p-3 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Serviço / Produto</label>
                <select required value={selectedService} onChange={e => setSelectedService(e.target.value)} className="w-full border rounded-lg p-3 text-sm">
                  <option value="">Selecione o serviço...</option>
                  {publicServices.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.nome} — R$ {parseFloat(s.preco).toFixed(2)} ({s.duracao_minutos || 30} min)
                    </option>
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

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Forma de Pagamento no Salão</label>
                <select value={publicFormaPagto} onChange={e => setPublicFormaPagto(e.target.value)} className="w-full border rounded-lg p-3 text-sm">
                  <option value="Pix no Local">Pix no Local</option>
                  <option value="Cartão de Crédito/Débito">Cartão de Crédito/Débito</option>
                  <option value="Dinheiro">Dinheiro</option>
                </select>
              </div>

              <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl transition shadow-lg mt-2">
                Solicitar Agendamento
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  // TELA DE LOGIN
  if (!session || !userProfile) {
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

  // PAINEL MASTER
  if (userProfile.role === 'master') {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col md:flex-row font-sans">
        <aside className="w-full md:w-64 bg-slate-900 text-slate-100 flex flex-col border-r border-slate-800">
          <div className="p-6 border-b border-slate-800 flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-lg text-white"><Shield className="w-6 h-6" /></div>
            <div>
              <h1 className="font-bold text-lg leading-tight">Painel Master</h1>
              <p className="text-xs text-indigo-400">Administração</p>
            </div>
          </div>

          <nav className="flex-1 p-4 space-y-1">
            <button onClick={() => setActiveTab('master_profs')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium ${activeTab === 'master_profs' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
              <Users className="w-5 h-5" /> Profissionais
            </button>
          </nav>

          <div className="p-4 border-t border-slate-800">
            <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-rose-900/50 text-slate-300 hover:text-rose-200 py-2.5 rounded-lg text-sm transition">
              <LogOut className="w-4 h-4" /> Sair
            </button>
          </div>
        </aside>

        <main className="flex-1 p-8 overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Profissionais Cadastrados</h2>
              <p className="text-sm text-slate-500 mt-1">Lista completa de acessos criados no sistema.</p>
            </div>
            <button onClick={() => setShowAddProModal(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg font-semibold text-sm flex items-center gap-2 shadow">
              <UserPlus className="w-4 h-4" /> Cadastrar Novo Profissional
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
            {professionals.map(p => {
              const linkPublico = `${window.location.origin}/?pro=${p.id}`;
              return (
                <div key={p.id} className="p-4 border rounded-xl bg-slate-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-slate-900 text-base">{p.nome}</h4>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                        {p.role}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">{p.email} • WhatsApp: {p.telefone || 'Não informado'}</p>
                    
                    {p.role !== 'master' && (
                      <div className="mt-2 flex items-center gap-2 text-xs bg-white p-2 rounded-lg border text-slate-600">
                        <span className="font-semibold text-slate-700">Link de Agendamento:</span>
                        <span className="truncate max-w-xs text-indigo-600">{linkPublico}</span>
                        <button onClick={() => { navigator.clipboard.writeText(linkPublico); alert('Link copiado!'); }} className="p-1 hover:bg-slate-100 rounded text-slate-500">
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </main>

        {/* MODAL CADASTRAR PROFISSIONAL */}
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
                    <label className="block text-xs font-semibold text-slate-600 mb-1">WhatsApp</label>
                    <input type="tel" required value={newProPhone} onChange={e => setNewProPhone(e.target.value)} placeholder="47999999999" className="w-full border rounded-lg p-2.5 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Senha Inicial</label>
                    <input type="password" required value={newProPassword} onChange={e => setNewProPassword(e.target.value)} placeholder="Mínimo 6 caracteres" className="w-full border rounded-lg p-2.5 text-sm" />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-3">
                  <button type="button" onClick={() => setShowAddProModal(false)} className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg">Cancelar</button>
                  <button type="submit" className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow">Cadastrar Profissional</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // GERAR LINK PÚBLICO DA PROFISSIONAL LOGADA
  const proLinkPublico = `${window.location.origin}/?pro=${userProfile?.id}`;

  // PAINEL DA CABELEIREIRA / PROFISSIONAL
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col md:flex-row font-sans">
      <aside className="w-full md:w-64 bg-slate-900 text-slate-100 flex flex-col border-r border-slate-800">
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
          <div className="p-2 bg-indigo-600 rounded-lg text-white"><Scissors className="w-6 h-6" /></div>
          <div>
            <h1 className="font-bold text-lg leading-tight">{userProfile?.nome}</h1>
            <p className="text-xs text-slate-400">Agenda Profissional</p>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          <button onClick={() => setProTab('agenda')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium ${proTab === 'agenda' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
            <Calendar className="w-5 h-5" /> Agendamentos
          </button>
          <button onClick={() => setProTab('servicos')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium ${proTab === 'servicos' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
            <Scissors className="w-5 h-5" /> Serviços & Produtos
          </button>
          <button onClick={() => setProTab('clientes')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium ${proTab === 'clientes' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
            <Users className="w-5 h-5" /> Minhas Clientes
          </button>
          <button onClick={() => setProTab('config')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium ${proTab === 'config' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
            <Settings className="w-5 h-5" /> Horário de Atendimento
          </button>
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-rose-900/50 text-slate-300 hover:text-rose-200 py-2.5 rounded-lg text-sm transition">
            <LogOut className="w-4 h-4" /> Sair
          </button>
        </div>
      </aside>

      <main className="flex-1 p-8 overflow-y-auto">
        {/* CARD DESTAQUE LINK PÚBLICO */}
        <div className="bg-gradient-to-r from-indigo-900 to-slate-900 text-white p-6 rounded-2xl shadow-lg mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border border-indigo-700/50">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Share2 className="w-5 h-5 text-indigo-400" />
              <h3 className="font-bold text-lg">Seu Link de Agendamento Online</h3>
            </div>
            <p className="text-xs text-indigo-200">Envie este link para suas clientes realizarem o agendamento diretamente pela internet.</p>
            <div className="mt-3 bg-slate-800/80 px-3 py-2 rounded-lg border border-slate-700 text-xs text-indigo-300 font-mono truncate max-w-md">
              {proLinkPublico}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => { navigator.clipboard.writeText(proLinkPublico); alert('Link público copiado!'); }} 
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-4 py-2.5 rounded-lg font-semibold flex items-center gap-2 shadow transition"
            >
              <Copy className="w-4 h-4" /> Copiar Link
            </button>
            <a 
              href={proLinkPublico} 
              target="_blank" 
              rel="noreferrer"
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs px-4 py-2.5 rounded-lg font-semibold flex items-center gap-2 border border-slate-700 transition"
            >
              <ExternalLink className="w-4 h-4" /> Visualizar
            </a>
          </div>
        </div>

        {/* TAB AGENDAMENTOS */}
        {proTab === 'agenda' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Meus Agendamentos</h2>
                <p className="text-sm text-slate-500 mt-1">Aprove solicitações ou cadastre agendamentos manuais.</p>
              </div>
              <button 
                onClick={() => setShowAddApptModal(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg font-semibold text-sm flex items-center gap-2 shadow"
              >
                <CalendarPlus className="w-4 h-4" /> Novo Agendamento Manual
              </button>
            </div>

            <div className="bg-white rounded-xl border p-6 shadow-sm space-y-3">
              {proAppointments.length === 0 ? (
                <p className="text-slate-500 text-sm">Nenhum agendamento gravado ainda.</p>
              ) : (
                proAppointments.map(a => (
                  <div key={a.id} className="p-4 border rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center bg-slate-50 gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-900 text-base">{a.clientes?.nome}</h4>
                        <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold uppercase ${
                          a.status === 'confirmado' ? 'bg-emerald-100 text-emerald-800' :
                          a.status === 'pendente' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {a.status === 'confirmado' ? 'Aprovado' : a.status === 'pendente' ? 'Aguardando Aprovação' : 'Cancelado'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">WhatsApp: {a.clientes?.telefone || 'Não informado'}</p>
                      <p className="text-xs text-indigo-600 font-semibold mt-1">
                        Serviço: {a.servicos?.nome} — R$ {parseFloat(a.servicos?.preco || 0).toFixed(2)}
                      </p>
                      {a.forma_pagamento && (
                        <p className="text-xs text-slate-500 font-medium">Pagamento: <strong className="text-slate-700">{a.forma_pagamento}</strong></p>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <div className="text-right">
                        <span className="font-bold text-slate-900 block text-sm">{a.data} às {a.horario}</span>
                      </div>

                      {a.status === 'pendente' ? (
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => handleUpdateApptStatus(a.id, 'confirmado')}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-3 py-2 rounded-lg font-bold flex items-center gap-1 shadow"
                          >
                            <Check className="w-4 h-4" /> Aprovar
                          </button>
                          <button 
                            onClick={() => handleUpdateApptStatus(a.id, 'cancelado')}
                            className="bg-rose-600 hover:bg-rose-700 text-white text-xs px-3 py-2 rounded-lg font-bold flex items-center gap-1 shadow"
                          >
                            <X className="w-4 h-4" /> Recusar
                          </button>
                        </div>
                      ) : (
                        <button 
                          onClick={() => enviarConfirmacaoWhatsApp(a.clientes?.nome, a.clientes?.telefone, a.data, a.horario, a.servicos?.nome)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-3 py-2 rounded-lg font-semibold flex items-center gap-1.5 shadow"
                        >
                          <MessageSquare className="w-4 h-4" /> Lembrete Whats
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB SERVIÇOS & PRODUTOS EXPANSÍVEL */}
        {proTab === 'servicos' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Serviços & Produtos</h2>
                <p className="text-sm text-slate-500 mt-1">Clique sobre o item para ver a descrição completa e a duração.</p>
              </div>
              <button 
                onClick={handleOpenAddServiceModal} 
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg font-semibold text-sm flex items-center gap-2 shadow"
              >
                <Plus className="w-4 h-4" /> Cadastrar Novo Serviço/Produto
              </button>
            </div>

            <div className="bg-white rounded-xl border p-6 shadow-sm space-y-3">
              {proServices.length === 0 ? (
                <p className="text-slate-500 text-sm">Nenhum serviço ou produto cadastrado ainda.</p>
              ) : (
                proServices.map(s => {
                  const isExpanded = expandedServiceId === s.id;
                  return (
                    <div key={s.id} className="border rounded-xl bg-slate-50 overflow-hidden transition">
                      <div 
                        onClick={() => setExpandedServiceId(isExpanded ? null : s.id)}
                        className="p-4 flex justify-between items-center cursor-pointer hover:bg-slate-100/80 transition"
                      >
                        <div className="flex items-center gap-3">
                          {isExpanded ? <ChevronUp className="w-5 h-5 text-indigo-600" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                          <span className="font-bold text-slate-900 text-base">{s.nome}</span>
                        </div>

                        <div className="flex items-center gap-4">
                          <span className="font-bold text-emerald-700 text-base">R$ {parseFloat(s.preco).toFixed(2)}</span>
                          
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleOpenEditServiceModal(s); }}
                            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                            title="Editar Serviço"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          <button 
                            onClick={(e) => { e.stopPropagation(); handleDeleteService(s.id); }}
                            className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Excluir Serviço"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="p-4 border-t bg-white space-y-2 text-sm text-slate-600">
                          <div className="flex items-center gap-2 font-semibold text-slate-700">
                            <Clock className="w-4 h-4 text-indigo-600" />
                            <span>Tempo de Procedimento: <strong className="text-slate-900">{s.duracao_minutos || 30} minutos</strong></span>
                          </div>
                          <div>
                            <span className="font-semibold text-slate-700 block mb-1">Descrição do Serviço/Produto:</span>
                            <p className="bg-slate-50 p-3 rounded-lg border text-slate-600 text-xs leading-relaxed">
                              {s.descricao || 'Nenhuma descrição informada para este item.'}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* TAB MINHAS CLIENTES */}
        {proTab === 'clientes' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Minhas Clientes</h2>
                <p className="text-sm text-slate-500 mt-1">Cadastre clientes e envie o link de agendamento por WhatsApp.</p>
              </div>
              <button 
                onClick={() => setShowAddClientModal(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg font-semibold text-sm flex items-center gap-2 shadow"
              >
                <UserPlus className="w-4 h-4" /> Cadastrar Nova Cliente
              </button>
            </div>

            <div className="bg-white rounded-xl border p-6 shadow-sm space-y-3">
              {proClients.length === 0 ? (
                <p className="text-slate-500 text-sm">Nenhuma cliente cadastrada ainda.</p>
              ) : (
                proClients.map(c => (
                  <div key={c.id} className="p-4 border rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center bg-slate-50 gap-4">
                    <div>
                      <h4 className="font-bold text-slate-900 text-base">{c.nome}</h4>
                      <p className="text-xs text-slate-500">WhatsApp: {c.telefone || 'Não informado'}</p>
                    </div>

                    <button 
                      onClick={() => enviarLinkAgendamentoWhats(c.nome, c.telefone)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-3.5 py-2 rounded-lg font-semibold flex items-center gap-2 shadow transition"
                    >
                      <MessageSquare className="w-4 h-4" /> Enviar Link via Whats
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB HORÁRIO DE ATENDIMENTO */}
        {proTab === 'config' && (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-slate-900">Horário de Atendimento</h2>
              <p className="text-sm text-slate-500 mt-1">Defina o expediente para impedir agendamentos fora de horário.</p>
            </div>

            <div className="bg-white rounded-xl border p-6 shadow-sm max-w-lg space-y-4">
              {configSuccess && (
                <div className="p-3 bg-emerald-50 text-emerald-700 text-xs rounded-lg border border-emerald-200">
                  {configSuccess}
                </div>
              )}

              <form onSubmit={salvarHorarioAtendimento} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Horário de Abertura</label>
                    <input 
                      type="time" 
                      required 
                      value={horaInicio} 
                      onChange={e => setHoraInicio(e.target.value)} 
                      className="w-full border rounded-lg p-3 text-sm" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Horário de Fechamento</label>
                    <input 
                      type="time" 
                      required 
                      value={horaFim} 
                      onChange={e => setHoraFim(e.target.value)} 
                      className="w-full border rounded-lg p-3 text-sm" 
                    />
                  </div>
                </div>

                <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg shadow transition">
                  Salvar Horário de Expediente
                </button>
              </form>
            </div>
          </div>
        )}
      </main>

      {/* MODAL CADASTRAR / EDITAR SERVIÇO COM DESCRIÇÃO E DURAÇÃO */}
      {showServiceModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-slate-900 text-lg">
                {editingServiceId ? 'Editar Serviço / Produto' : 'Novo Serviço / Produto'}
              </h3>
              <button onClick={() => setShowServiceModal(false)}><XCircle className="w-5 h-5 text-slate-400" /></button>
            </div>

            {serviceError && <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-lg border border-rose-200">{serviceError}</div>}

            <form onSubmit={handleSaveService} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Nome do Serviço ou Produto</label>
                <input 
                  type="text" 
                  required 
                  value={serviceName} 
                  onChange={e => setServiceName(e.target.value)} 
                  placeholder="Ex: Corte Feminino, Escova, Botox" 
                  className="w-full border rounded-lg p-2.5 text-sm" 
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Preço (R$)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    required 
                    value={servicePrice} 
                    onChange={e => setServicePrice(e.target.value)} 
                    placeholder="50.00" 
                    className="w-full border rounded-lg p-2.5 text-sm" 
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Duração (Minutos)</label>
                  <input 
                    type="number" 
                    required 
                    value={serviceDuration} 
                    onChange={e => setServiceDuration(e.target.value)} 
                    placeholder="30" 
                    className="w-full border rounded-lg p-2.5 text-sm" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Descrição do Procedimento</label>
                <textarea 
                  rows="3"
                  value={serviceDesc} 
                  onChange={e => setServiceDesc(e.target.value)} 
                  placeholder="Descreva os detalhes do serviço ou produto..." 
                  className="w-full border rounded-lg p-2.5 text-sm"
                ></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-2 border-t">
                <button type="button" onClick={() => setShowServiceModal(false)} className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg">Cancelar</button>
                <button type="submit" className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow">
                  {editingServiceId ? 'Salvar Alterações' : 'Cadastrar Serviço'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CADASTRAR CLIENTE */}
      {showAddClientModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-slate-900 text-lg">Cadastrar Nova Cliente</h3>
              <button onClick={() => setShowAddClientModal(false)}><XCircle className="w-5 h-5 text-slate-400" /></button>
            </div>

            {clientError && <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-lg border border-rose-200">{clientError}</div>}

            <form onSubmit={handleAddClient} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Nome Completo</label>
                <input 
                  type="text" 
                  required 
                  value={newClientName} 
                  onChange={e => setNewClientName(e.target.value)} 
                  placeholder="Ex: Mariana Silva" 
                  className="w-full border rounded-lg p-2.5 text-sm" 
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">WhatsApp / Telefone</label>
                <input 
                  type="tel" 
                  required 
                  value={newClientPhone} 
                  onChange={e => setNewClientPhone(e.target.value)} 
                  placeholder="(47) 99999-9999" 
                  className="w-full border rounded-lg p-2.5 text-sm" 
                />
              </div>

              <div className="flex justify-end gap-3 pt-2 border-t">
                <button type="button" onClick={() => setShowAddClientModal(false)} className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg">Cancelar</button>
                <button type="submit" className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow">
                  Salvar Cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL AGENDAMENTO MANUAL */}
      {showAddApptModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-slate-900 text-lg">Agendamento Manual</h3>
              <button onClick={() => setShowAddApptModal(false)}><XCircle className="w-5 h-5 text-slate-400" /></button>
            </div>

            <form onSubmit={handleAddManualAppointment} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Tipo de Cliente</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                    <input type="radio" name="clientType" checked={apptClientType === 'existing'} onChange={() => setApptClientType('existing')} /> Cliente Cadastrada
                  </label>
                  <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                    <input type="radio" name="clientType" checked={apptClientType === 'new'} onChange={() => setApptClientType('new')} /> Nova Cliente
                  </label>
                </div>
              </div>

              {apptClientType === 'existing' ? (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Selecione a Cliente</label>
                  <select required value={selectedClientId} onChange={e => setSelectedClientId(e.target.value)} className="w-full border rounded-lg p-2.5 text-sm">
                    <option value="">Selecione...</option>
                    {proClients.map(c => <option key={c.id} value={c.id}>{c.nome} ({c.telefone})</option>)}
                  </select>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Nome</label>
                    <input type="text" required value={manualClientName} onChange={e => setManualClientName(e.target.value)} placeholder="Ex: Maria" className="w-full border rounded-lg p-2.5 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">WhatsApp</label>
                    <input type="tel" required value={manualClientPhone} onChange={e => setManualClientPhone(e.target.value)} placeholder="(47) 99999-9999" className="w-full border rounded-lg p-2.5 text-sm" />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Serviço</label>
                <select required value={manualServiceId} onChange={e => setManualServiceId(e.target.value)} className="w-full border rounded-lg p-2.5 text-sm">
                  <option value="">Selecione o serviço...</option>
                  {proServices.map(s => <option key={s.id} value={s.id}>{s.nome} — R$ {parseFloat(s.preco).toFixed(2)}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Data</label>
                  <input type="date" required value={manualDate} onChange={e => setManualDate(e.target.value)} className="w-full border rounded-lg p-2.5 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Horário</label>
                  <input type="time" required value={manualTime} onChange={e => setManualTime(e.target.value)} className="w-full border rounded-lg p-2.5 text-sm" />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t">
                <button type="button" onClick={() => setShowAddApptModal(false)} className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg">Cancelar</button>
                <button type="submit" className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow">Salvar Agendamento</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
