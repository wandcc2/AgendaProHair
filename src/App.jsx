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
  Settings,
  CalendarOff,
  BellRing,
  MapPin,
  Lock,
  Unlock,
  ToggleLeft,
  ToggleRight,
  Inbox,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Palette,
  Image as ImageIcon,
  TrendingUp,
  PieChart,
  UserCheck
} from 'lucide-react';

const SUPABASE_URL = 'https://ujdaesnmqhkzefqdwygk.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_PWOqJOgpsoJQT3FNDxB-Tw_5jURYgth';
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false }
});

const DIAS_NOME = [
  'Domingo',
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado'
];

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

  // Master State
  const [activeTab, setActiveTab] = useState('master_profs'); // master_profs | master_vencimentos | master_financeiro
  const [professionals, setProfessionals] = useState([]);
  const [licencas, setLicencas] = useState([]);
  const [expandedProId, setExpandedProId] = useState(null);

  // Modal Novo Profissional (Master)
  const [showAddProModal, setShowAddProModal] = useState(false);
  const [newProName, setNewProName] = useState('');
  const [newProEmail, setNewProEmail] = useState('');
  const [newProPhone, setNewProPhone] = useState('');
  const [newProEndereco, setNewProEndereco] = useState('');
  const [newProNumero, setNewProNumero] = useState('');
  const [newProPassword, setNewProPassword] = useState('');
  const [newProLogo, setNewProLogo] = useState('');
  const [newProCor, setNewProCor] = useState('#4f46e5');
  const [newProLinkAtivo, setNewProLinkAtivo] = useState(true);
  const [tipoLicencaNovo, setTipoLicencaNovo] = useState('dias'); // 'dias' | 'data' | 'vitalicio'
  const [diasAcesso, setDiasAcesso] = useState(30);
  const [dataEspecificaVenc, setDataEspecificaVenc] = useState('');
  const [planoValor, setPlanoValor] = useState('50.00');
  const [formaPagamento, setFormaPagamento] = useState('Pix');
  const [proModalError, setProModalError] = useState('');
  const [proModalSuccess, setProModalSuccess] = useState('');

  // Modal Editar Salão / Licenças (Master)
  const [showEditProModal, setShowEditProModal] = useState(false);
  const [editingPro, setEditingPro] = useState(null);
  const [editTipoLicenca, setEditTipoLicenca] = useState('manter'); 
  const [editDiasAcesso, setEditDiasAcesso] = useState(30);
  const [editDataEspecifica, setEditDataEspecifica] = useState('');
  const [editValorLicenca, setEditValorLicenca] = useState('50.00');
  const [editFormaPagto, setEditFormaPagto] = useState('Pix');

  // Profissional / Salão
  const [proTab, setProTab] = useState('dashboard_agenda'); // dashboard_agenda | agenda | aprovacao | servicos | clientes | config
  const [proClients, setProClients] = useState([]);
  const [proServices, setProServices] = useState([]);
  const [proAppointments, setProAppointments] = useState([]);
  const [expandedServiceId, setExpandedServiceId] = useState(null);

  // Dashboard Semanal
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day; 
    return new Date(d.setDate(diff));
  });

  // Configuração de Horários da Semana (com Almoço)
  const [weeklySchedule, setWeeklySchedule] = useState(
    DIAS_NOME.map((nome, idx) => ({
      dia_semana: idx,
      nome,
      ativo: idx >= 1 && idx <= 6,
      hora_inicio: '08:00',
      hora_fim: '18:00',
      com_almoco: false,
      hora_inicio_almoco: '12:00',
      hora_fim_almoco: '13:00'
    }))
  );
  const [offDays, setOffDays] = useState([]);
  const [newOffDate, setNewOffDate] = useState('');
  const [newOffMotivo, setNewOffMotivo] = useState('');
  const [configSuccess, setConfigSuccess] = useState('');

  // Modal Serviço
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState(null);
  const [serviceName, setServiceName] = useState('');
  const [servicePrice, setServicePrice] = useState('');
  const [serviceDesc, setServiceDesc] = useState('');
  const [serviceDuration, setServiceDuration] = useState('30');
  const [serviceError, setServiceError] = useState('');

  // Modal Novo Cliente (Com campos estendidos)
  const [showAddClientModal, setShowAddClientModal] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [newClientEndereco, setNewClientEndereco] = useState('');
  const [newClientPrefPro, setNewClientPrefPro] = useState('');
  const [newClientObs, setNewClientObs] = useState('');
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
  const [publicWeeklySchedule, setPublicWeeklySchedule] = useState([]);
  const [publicOffDays, setPublicOffDays] = useState([]);
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
      const { data: hs } = await supabase.from('horarios_semana').select('*').eq('profissional_id', proId);
      const { data: off } = await supabase.from('folgas_feriados').select('*').eq('profissional_id', proId);

      setPublicProProfile(pro);
      setPublicServices(srv || []);
      setPublicWeeklySchedule(hs || []);
      setPublicOffDays(off || []);
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
      const { data: lics } = await supabase.from('licencas').select('*').order('created_at', { ascending: false });
      setProfessionals(profs || []);
      setLicencas(lics || []);
    } else if (userProfile) {
      const { data: cli } = await supabase.from('clientes').select('*').eq('profissional_id', userProfile.id).order('nome', { ascending: true });
      const { data: srv } = await supabase.from('servicos').select('*').eq('profissional_id', userProfile.id).order('nome', { ascending: true });
      const { data: appt } = await supabase.from('agendamentos').select('*, clientes(nome, telefone), servicos(nome, preco)').eq('profissional_id', userProfile.id).order('data', { ascending: true });

      const { data: hs } = await supabase.from('horarios_semana').select('*').eq('profissional_id', userProfile.id);
      if (hs && hs.length > 0) {
        setWeeklySchedule(prev => prev.map(item => {
          const enc = hs.find(h => h.dia_semana === item.dia_semana);
          return enc ? { 
            ...item, 
            ativo: enc.ativo, 
            hora_inicio: enc.hora_inicio?.substring(0,5) || '08:00', 
            hora_fim: enc.hora_fim?.substring(0,5) || '18:00',
            com_almoco: enc.com_almoco || false,
            hora_inicio_almoco: enc.hora_inicio_almoco?.substring(0,5) || '12:00',
            hora_fim_almoco: enc.hora_fim_almoco?.substring(0,5) || '13:00'
          } : item;
        }));
      }

      const { data: off } = await supabase.from('folgas_feriados').select('*').eq('profissional_id', userProfile.id).order('data', { ascending: true });

      setProClients(cli || []);
      setProServices(srv || []);
      setProAppointments(appt || []);
      setOffDays(off || []);
    }
  };

  // Submissão Pública Sem Erros
  const handlePublicBookingSubmit = async (e) => {
    e.preventDefault();
    try {
      if (publicProProfile?.agendamento_link_ativo === false) {
        alert('O agendamento online via link está desativado para este salão.');
        return;
      }

      const folga = publicOffDays.find(o => o.data === bookingDate);
      if (folga) {
        alert(`O salão não atenderá nesta data (${bookingDate.split('-').reverse().join('/')}). Motivo: ${folga.motivo}`);
        return;
      }

      const dateParts = bookingDate.split('-');
      const dateObj = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));
      const diaSemanaIndex = dateObj.getDay();

      const regraDia = publicWeeklySchedule.find(h => h.dia_semana === diaSemanaIndex);

      if (regraDia) {
        if (!regraDia.ativo) {
          alert(`O salão não realiza atendimentos nas ${DIAS_NOME[diaSemanaIndex]}s.`);
          return;
        }

        const hInic = regraDia.hora_inicio.substring(0, 5);
        const hFim = regraDia.hora_fim.substring(0, 5);

        if (bookingTime < hInic || bookingTime > hFim) {
          alert(`Nas ${DIAS_NOME[diaSemanaIndex]}s o salão atende somente entre ${hInic} e ${hFim}.`);
          return;
        }

        if (regraDia.com_almoco) {
          const hInicAlm = regraDia.hora_inicio_almoco.substring(0, 5);
          const hFimAlm = regraDia.hora_fim_almoco.substring(0, 5);
          if (bookingTime >= hInicAlm && bookingTime < hFimAlm) {
            alert(`Horário de almoço do salão (${hInicAlm} às ${hFimAlm}). Por favor escolha outro horário.`);
            return;
          }
        }
      }

      const { data: busy } = await supabase.from('agendamentos')
        .select('*')
        .eq('profissional_id', publicProId)
        .eq('data', bookingDate)
        .eq('horario', bookingTime)
        .eq('status', 'confirmado');

      if (busy && busy.length > 0) {
        alert('Este horário já foi reservado. Por favor, escolha outro horário.');
        return;
      }

      // Inserir ou localizar cliente enviando "nome" exclusivamente
      let clientId = null;
      const { data: existingCli } = await supabase.from('clientes')
        .select('id')
        .eq('telefone', clientPhone)
        .eq('profissional_id', publicProId)
        .limit(1);

      if (existingCli && existingCli.length > 0) {
        clientId = existingCli[0].id;
      } else {
        const { data: newCli, error: cliErr } = await supabase.from('clientes').insert([{ 
          nome: clientName,
          telefone: clientPhone, 
          profissional_id: publicProId 
        }]).select('id').single();

        if (cliErr) throw cliErr;
        clientId = newCli.id;
      }

      const { error: apptInsertErr } = await supabase.from('agendamentos').insert([{ 
        cliente_id: clientId, 
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
      alert('Erro ao solicitar agendamento: ' + (e.message || 'Verifique as permissões no banco.'));
    }
  };

  // Funções Master
  const toggleAgendamentoLink = async (proId, currentStatus) => {
    const { error } = await supabase.from('perfis').update({ agendamento_link_ativo: !currentStatus }).eq('id', proId);
    if (!error) loadAppData();
  };

  const toggleStatusProfissional = async (proId, currentStatus) => {
    const newStatus = currentStatus === 'blocked' ? 'active' : 'blocked';
    const { error } = await supabase.from('perfis').update({ status: newStatus }).eq('id', proId);
    if (!error) loadAppData();
  };

  const handleOpenEditPro = (pro) => {
    setEditingPro(pro);
    setEditTipoLicenca('manter');
    setEditDiasAcesso(30);
    setEditDataEspecifica('');
    setEditValorLicenca('50.00');
    setEditFormaPagto('Pix');
    setShowEditProModal(true);
  };

  const handleSaveEditedPro = async (e) => {
    e.preventDefault();
    try {
      const { error: proErr } = await supabase.from('perfis').update({
        nome: editingPro.nome,
        telefone: editingPro.telefone,
        endereco: editingPro.endereco,
        numero: editingPro.numero,
        agendamento_link_ativo: editingPro.agendamento_link_ativo,
        logo_url: editingPro.logo_url,
        cor_primaria: editingPro.cor_primaria
      }).eq('id', editingPro.id);

      if (proErr) throw proErr;

      if (editTipoLicenca !== 'manter') {
        let dataVenc = null;
        let planoNome = 'Vitalício';

        if (editTipoLicenca === 'dias') {
          const hoje = new Date();
          hoje.setDate(hoje.getDate() + parseInt(editDiasAcesso));
          dataVenc = hoje.toISOString().split('T')[0];
          planoNome = `${editDiasAcesso} Dias`;
        } else if (editTipoLicenca === 'data') {
          dataVenc = editDataEspecifica;
          planoNome = `Até ${editDataEspecifica.split('-').reverse().join('/')}`;
        }

        const { error: licErr } = await supabase.from('licencas').insert([{
          profissional_id: editingPro.id,
          plano: planoNome,
          valor: parseFloat(editValorLicenca || 0),
          forma_pagamento: editFormaPagto,
          data_pagamento: new Date().toISOString().split('T')[0],
          data_vencimento: dataVenc,
          status: 'active'
        }]);

        if (licErr) throw licErr;
      }

      setShowEditProModal(false);
      await loadAppData();
      alert('Salão e Licença salvos com sucesso!');
    } catch (err) {
      alert('Erro ao salvar salão: ' + err.message);
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
          endereco: newProEndereco,
          numero: newProNumero,
          logo_url: newProLogo,
          cor_primaria: newProCor,
          agendamento_link_ativo: newProLinkAtivo,
          role: 'professional',
          status: 'active'
        }]);

        let dataVenc = null;
        let planoNome = 'Vitalício';

        if (tipoLicencaNovo === 'dias') {
          const dt = new Date();
          dt.setDate(dt.getDate() + parseInt(diasAcesso));
          dataVenc = dt.toISOString().split('T')[0];
          planoNome = `${diasAcesso} Dias`;
        } else if (tipoLicencaNovo === 'data') {
          dataVenc = dataEspecificaVenc;
          planoNome = `Até ${dataEspecificaVenc.split('-').reverse().join('/')}`;
        }

        await supabase.from('licencas').insert([{
          profissional_id: authData.user.id,
          plano: planoNome,
          valor: parseFloat(planoValor || 0),
          forma_pagamento: formaPagamento,
          data_pagamento: new Date().toISOString().split('T')[0],
          data_vencimento: dataVenc,
          status: 'active'
        }]);

        setProModalSuccess('Salão cadastrado com sucesso!');
        await loadAppData();
        setTimeout(() => setShowAddProModal(false), 1200);
      }
    } catch (err) {
      setProModalError(err.message || 'Erro ao cadastrar profissional.');
    }
  };

  // Salvar Grade Semanal com Almoço
  const salvarHorarioSemana = async (e) => {
    e.preventDefault();
    setConfigSuccess('');

    try {
      for (const item of weeklySchedule) {
        const { error } = await supabase.from('horarios_semana').upsert({
          profissional_id: userProfile.id,
          dia_semana: item.dia_semana,
          ativo: item.ativo,
          hora_inicio: item.hora_inicio,
          hora_fim: item.hora_fim,
          com_almoco: item.com_almoco,
          hora_inicio_almoco: item.hora_inicio_almoco,
          hora_fim_almoco: item.hora_fim_almoco
        }, { onConflict: 'profissional_id,dia_semana' });

        if (error) throw error;
      }

      setConfigSuccess('Horários de atendimento salvos!');
      setTimeout(() => setConfigSuccess(''), 3000);
    } catch (err) {
      alert('Erro ao salvar horários: ' + err.message);
    }
  };

  const handleAddClientExt = async (e) => {
    e.preventDefault();
    setClientError('');

    try {
      const { error } = await supabase.from('clientes').insert([{
        nome: newClientName,
        telefone: newClientPhone,
        endereco: newClientEndereco,
        preferencia_profissional: newClientPrefPro,
        observacoes: newClientObs,
        profissional_id: userProfile.id
      }]);

      if (error) throw error;

      setShowAddClientModal(false);
      setNewClientName('');
      setNewClientPhone('');
      setNewClientEndereco('');
      setNewClientPrefPro('');
      setNewClientObs('');
      await loadAppData();
    } catch (err) {
      setClientError(err.message || 'Erro ao cadastrar cliente.');
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
      loadAppData();
    } catch (err) {
      alert('Erro ao criar agendamento: ' + err.message);
    }
  };

  const handleUpdateApptStatus = async (apptId, newStatus) => {
    const { error } = await supabase.from('agendamentos').update({ status: newStatus }).eq('id', apptId);
    if (!error) loadAppData();
  };

  const handleOpenAddServiceModal = () => {
    setEditingServiceId(null);
    setServiceName('');
    setServicePrice('');
    setServiceDesc('');
    setServiceDuration('30');
    setShowServiceModal(true);
  };

  const handleSaveService = async (e) => {
    e.preventDefault();
    try {
      if (editingServiceId) {
        await supabase.from('servicos').update({
          nome: serviceName,
          preco: parseFloat(servicePrice),
          descricao: serviceDesc,
          duracao_minutos: parseInt(serviceDuration)
        }).eq('id', editingServiceId);
      } else {
        await supabase.from('servicos').insert([{
          nome: serviceName,
          preco: parseFloat(servicePrice),
          descricao: serviceDesc,
          duracao_minutos: parseInt(serviceDuration),
          profissional_id: userProfile.id
        }]);
      }
      setShowServiceModal(false);
      loadAppData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleAddOffDay = async (e) => {
    e.preventDefault();
    if (!newOffDate) return;
    await supabase.from('folgas_feriados').insert([{
      profissional_id: userProfile.id,
      data: newOffDate,
      motivo: newOffMotivo || 'Folga / Feriado'
    }]);
    setNewOffDate('');
    setNewOffMotivo('');
    loadAppData();
  };

  const handleDeleteOffDay = async (id) => {
    await supabase.from('folgas_feriados').delete().eq('id', id);
    loadAppData();
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

  // PÁGINA PÚBLICA DE AGENDAMENTO
  if (publicProId) {
    const linkDesativado = publicProProfile?.agendamento_link_ativo === false;
    const corTema = publicProProfile?.cor_primaria || '#4f46e5';

    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-6">
          <div className="text-center border-b pb-4">
            {publicProProfile?.logo_url ? (
              <img src={publicProProfile.logo_url} alt="Logo Salão" className="w-20 h-20 rounded-2xl object-cover mx-auto mb-2 shadow" />
            ) : (
              <div style={{ backgroundColor: corTema }} className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center text-white mb-2 shadow-lg">
                <Scissors className="w-8 h-8" />
              </div>
            )}
            <h1 className="text-2xl font-bold text-slate-900">{publicProProfile?.nome || 'Agenda Online'}</h1>
            {publicProProfile?.endereco && (
              <p className="text-xs text-slate-500 mt-1 flex items-center justify-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                {publicProProfile.endereco}, Nº {publicProProfile.numero || 'S/N'}
              </p>
            )}
          </div>

          {linkDesativado ? (
            <div className="text-center py-8 space-y-3">
              <AlertTriangle className="w-16 h-16 text-amber-500 mx-auto" />
              <h2 className="text-xl font-bold text-slate-900">Agendamento Online Indisponível</h2>
              <p className="text-sm text-slate-600">No momento, o agendamento por link está temporariamente desativado para este salão.</p>
            </div>
          ) : publicSuccess ? (
            <div className="text-center py-8 space-y-3">
              <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto" />
              <h2 className="text-xl font-bold text-slate-900">Solicitação Enviada com Sucesso!</h2>
              <p className="text-sm text-slate-600">O salão confirmará o seu atendimento em breve.</p>
              <button onClick={() => setPublicSuccess(false)} style={{ backgroundColor: corTema }} className="mt-4 text-white px-6 py-2.5 rounded-lg text-sm font-semibold shadow">
                Novo Agendamento
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
                  <option value="">Selecione...</option>
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
                <label className="block text-xs font-semibold text-slate-700 mb-1">Forma de Pagamento</label>
                <select value={publicFormaPagto} onChange={e => setPublicFormaPagto(e.target.value)} className="w-full border rounded-lg p-3 text-sm">
                  <option value="Pix no Local">Pix no Local</option>
                  <option value="Cartão de Crédito/Débito">Cartão de Crédito/Débito</option>
                  <option value="Dinheiro">Dinheiro</option>
                </select>
              </div>

              <button type="submit" style={{ backgroundColor: corTema }} className="w-full text-white font-bold py-3.5 rounded-xl transition shadow-lg mt-2">
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

          <form onSubmit={e => {
            e.preventDefault();
            setLoading(true);
            supabase.auth.signInWithPassword({ email, password }).then(({ error }) => {
              if (error) { setLoginError('E-mail ou senha incorretos.'); setLoading(false); }
            });
          }} className="space-y-4">
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
    const totalVendasLicencas = licencas.reduce((acc, l) => acc + (parseFloat(l.valor) || 0), 0);

    return (
      <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col md:flex-row font-sans">
        <aside className="w-full md:w-64 bg-slate-900 text-slate-100 flex flex-col border-r border-slate-800">
          <div className="p-6 border-b border-slate-800 flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-lg text-white"><Shield className="w-6 h-6" /></div>
            <div>
              <h1 className="font-bold text-lg leading-tight">Painel Master</h1>
              <p className="text-xs text-indigo-400">Gestão & Finanças</p>
            </div>
          </div>

          <nav className="flex-1 p-4 space-y-1">
            <button onClick={() => setActiveTab('master_profs')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium ${activeTab === 'master_profs' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
              <Users className="w-5 h-5" /> Salões Cadastrados
            </button>
            <button onClick={() => setActiveTab('master_financeiro')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium ${activeTab === 'master_financeiro' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
              <TrendingUp className="w-5 h-5 text-emerald-400" /> Gestão Financeira
            </button>
          </nav>

          <div className="p-4 border-t border-slate-800">
            <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-rose-900/50 text-slate-300 hover:text-rose-200 py-2.5 rounded-lg text-sm transition">
              <LogOut className="w-4 h-4" /> Sair
            </button>
          </div>
        </aside>

        <main className="flex-1 p-8 overflow-y-auto">
          {activeTab === 'master_profs' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Salões Cadastrados</h2>
                  <p className="text-sm text-slate-500 mt-1">Gerencie logins, aparências e licenças ativas.</p>
                </div>
                <button onClick={() => setShowAddProModal(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg font-semibold text-sm flex items-center gap-2 shadow">
                  <UserPlus className="w-4 h-4" /> Cadastrar Novo Salão
                </button>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-3">
                {professionals.filter(p => p.role !== 'master').map(p => {
                  const lic = licencas.find(l => l.profissional_id === p.id);
                  const isExpanded = expandedProId === p.id;

                  return (
                    <div key={p.id} className="border rounded-xl bg-slate-50 overflow-hidden transition">
                      <div 
                        onClick={() => setExpandedProId(isExpanded ? null : p.id)}
                        className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center cursor-pointer hover:bg-slate-100/80 transition gap-4"
                      >
                        <div className="flex items-center gap-3">
                          {p.logo_url ? (
                            <img src={p.logo_url} alt="Logo" className="w-10 h-10 rounded-lg object-cover border" />
                          ) : (
                            <div style={{ backgroundColor: p.cor_primaria || '#4f46e5' }} className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold">
                              {p.nome?.substring(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <h4 className="font-bold text-slate-900 text-base">{p.nome}</h4>
                            <p className="text-xs text-slate-500">{p.email} • WhatsApp: {p.telefone || 'N/I'}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="text-xs font-bold text-slate-700 bg-slate-200 px-3 py-1 rounded-full">
                            Vencimento: {lic?.data_vencimento ? lic.data_vencimento.split('-').reverse().join('/') : 'Vitalício'}
                          </span>
                          <button onClick={(e) => { e.stopPropagation(); handleOpenEditPro(p); }} className="px-3 py-1.5 bg-indigo-50 text-indigo-600 font-bold rounded-lg text-xs border border-indigo-200">
                            Editar / Licença
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'master_financeiro' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Gestão Financeira de Vendas de Licenças</h2>
                <p className="text-sm text-slate-500 mt-1">Acompanhe o faturamento obtido através das licenças dos salões.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl border shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-500 font-bold uppercase block">Faturamento Total</span>
                    <span className="text-2xl font-extrabold text-emerald-600">R$ {totalVendasLicencas.toFixed(2)}</span>
                  </div>
                  <div className="p-3 bg-emerald-100 text-emerald-700 rounded-xl"><DollarSign className="w-6 h-6" /></div>
                </div>

                <div className="bg-white p-6 rounded-xl border shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-500 font-bold uppercase block">Total de Vendas / Contratos</span>
                    <span className="text-2xl font-extrabold text-indigo-600">{licencas.length}</span>
                  </div>
                  <div className="p-3 bg-indigo-100 text-indigo-700 rounded-xl"><CreditCard className="w-6 h-6" /></div>
                </div>

                <div className="bg-white p-6 rounded-xl border shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-500 font-bold uppercase block">Salões Ativos</span>
                    <span className="text-2xl font-extrabold text-slate-800">{professionals.filter(p => p.role !== 'master').length}</span>
                  </div>
                  <div className="p-3 bg-slate-100 text-slate-700 rounded-xl"><Users className="w-6 h-6" /></div>
                </div>
              </div>

              <div className="bg-white rounded-xl border p-6 shadow-sm">
                <h3 className="font-bold text-slate-900 text-base mb-4">Histórico de Transações e Licenças Vendidas</h3>
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b bg-slate-50 text-slate-600">
                      <th className="p-3 font-bold">Salão</th>
                      <th className="p-3 font-bold">Plano</th>
                      <th className="p-3 font-bold">Valor</th>
                      <th className="p-3 font-bold">Forma de Pagamento</th>
                      <th className="p-3 font-bold">Data Compra</th>
                      <th className="p-3 font-bold">Vencimento</th>
                    </tr>
                  </thead>
                  <tbody>
                    {licencas.map(l => {
                      const pro = professionals.find(p => p.id === l.profissional_id);
                      return (
                        <tr key={l.id} className="border-b hover:bg-slate-50">
                          <td className="p-3 font-bold text-slate-800">{pro?.nome || 'Salão'}</td>
                          <td className="p-3">{l.plano}</td>
                          <td className="p-3 font-bold text-emerald-600">R$ {parseFloat(l.valor || 0).toFixed(2)}</td>
                          <td className="p-3">{l.forma_pagamento}</td>
                          <td className="p-3">{l.data_pagamento?.split('-').reverse().join('/')}</td>
                          <td className="p-3">{l.data_vencimento ? l.data_vencimento.split('-').reverse().join('/') : 'Vitalício'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>

        {/* MODAL CADASTRAR NOVO SALÃO */}
        {showAddProModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center border-b pb-3">
                <h3 className="font-bold text-slate-900 text-lg">Novo Salão com Personalização & Licença</h3>
                <button onClick={() => setShowAddProModal(false)}><XCircle className="w-5 h-5 text-slate-400" /></button>
              </div>

              {proModalError && <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-lg border border-rose-200">{proModalError}</div>}
              {proModalSuccess && <div className="p-3 bg-emerald-50 text-emerald-700 text-xs rounded-lg border border-emerald-200">{proModalSuccess}</div>}

              <form onSubmit={handleCreateProfessional} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Nome do Salão</label>
                    <input type="text" required value={newProName} onChange={e => setNewProName(e.target.value)} className="w-full border rounded-lg p-2.5 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">E-mail</label>
                    <input type="email" required value={newProEmail} onChange={e => setNewProEmail(e.target.value)} className="w-full border rounded-lg p-2.5 text-sm" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">WhatsApp</label>
                    <input type="tel" required value={newProPhone} onChange={e => setNewProPhone(e.target.value)} className="w-full border rounded-lg p-2.5 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Senha</label>
                    <input type="password" required value={newProPassword} onChange={e => setNewProPassword(e.target.value)} className="w-full border rounded-lg p-2.5 text-sm" />
                  </div>
                </div>

                <div className="border-t pt-3 space-y-3">
                  <h4 className="font-bold text-slate-900 text-xs text-indigo-600 flex items-center gap-1"><Palette className="w-4 h-4" /> Personalização Visual</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">URL da Foto / Logo</label>
                      <input type="text" value={newProLogo} onChange={e => setNewProLogo(e.target.value)} placeholder="https://..." className="w-full border rounded-lg p-2 text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Cor Principal</label>
                      <input type="color" value={newProCor} onChange={e => setNewProCor(e.target.value)} className="w-full h-9 border rounded-lg p-1 cursor-pointer" />
                    </div>
                  </div>
                </div>

                <div className="border-t pt-3 space-y-3">
                  <h4 className="font-bold text-slate-900 text-xs text-indigo-600 flex items-center gap-1"><CreditCard className="w-4 h-4" /> Licença & Período de Uso</h4>
                  <select value={tipoLicencaNovo} onChange={e => setTipoLicencaNovo(e.target.value)} className="w-full border rounded-lg p-2.5 text-sm font-medium">
                    <option value="dias">Quantidade de Dias (Ex: 30 dias)</option>
                    <option value="data">Data Específica de Expiração</option>
                    <option value="vitalicio">Acesso Vitalício</option>
                  </select>

                  {tipoLicencaNovo === 'dias' && (
                    <input type="number" required value={diasAcesso} onChange={e => setDiasAcesso(e.target.value)} placeholder="30" className="w-full border rounded-lg p-2.5 text-sm" />
                  )}

                  {tipoLicencaNovo === 'data' && (
                    <input type="date" required value={dataEspecificaVenc} onChange={e => setDataEspecificaVenc(e.target.value)} className="w-full border rounded-lg p-2.5 text-sm" />
                  )}

                  <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Valor Pago (R$)</label>
                      <input type="number" step="0.01" value={planoValor} onChange={e => setPlanoValor(e.target.value)} className="w-full border rounded-lg p-2 text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Pagamento</label>
                      <select value={formaPagamento} onChange={e => setFormaPagamento(e.target.value)} className="w-full border rounded-lg p-2 text-sm">
                        <option value="Pix">Pix</option>
                        <option value="Cartão de Crédito">Cartão de Crédito</option>
                        <option value="Dinheiro">Dinheiro</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t">
                  <button type="button" onClick={() => setShowAddProModal(false)} className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg">Cancelar</button>
                  <button type="submit" className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow">Cadastrar Salão</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL EDITAR SALÃO */}
        {showEditProModal && editingPro && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center border-b pb-3">
                <h3 className="font-bold text-slate-900 text-lg">Editar Salão & Personalização</h3>
                <button onClick={() => setShowEditProModal(false)}><XCircle className="w-5 h-5 text-slate-400" /></button>
              </div>

              <form onSubmit={handleSaveEditedPro} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Nome do Salão</label>
                  <input type="text" required value={editingPro.nome} onChange={e => setEditingPro({ ...editingPro, nome: e.target.value })} className="w-full border rounded-lg p-2.5 text-sm" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">WhatsApp</label>
                    <input type="tel" value={editingPro.telefone || ''} onChange={e => setEditingPro({ ...editingPro, telefone: e.target.value })} className="w-full border rounded-lg p-2.5 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Cor Principal</label>
                    <input type="color" value={editingPro.cor_primaria || '#4f46e5'} onChange={e => setEditingPro({ ...editingPro, cor_primaria: e.target.value })} className="w-full h-9 border rounded-lg p-1 cursor-pointer" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">URL da Logo / Foto</label>
                  <input type="text" value={editingPro.logo_url || ''} onChange={e => setEditingPro({ ...editingPro, logo_url: e.target.value })} className="w-full border rounded-lg p-2.5 text-sm" />
                </div>

                <div className="border-t pt-3 space-y-3">
                  <h4 className="font-bold text-slate-900 text-xs text-indigo-600">Alterar Período da Licença</h4>
                  <select value={editTipoLicenca} onChange={e => setEditTipoLicenca(e.target.value)} className="w-full border rounded-lg p-2.5 text-sm font-medium">
                    <option value="manter">Manter Licença Atual</option>
                    <option value="dias">Adicionar Dias de Uso</option>
                    <option value="data">Definir Data Específica de Expiração</option>
                    <option value="vitalicio">Tornar Vitalício</option>
                  </select>

                  {editTipoLicenca === 'dias' && (
                    <input type="number" value={editDiasAcesso} onChange={e => setEditDiasAcesso(e.target.value)} className="w-full border rounded-lg p-2.5 text-sm" />
                  )}

                  {editTipoLicenca === 'data' && (
                    <input type="date" value={editDataEspecifica} onChange={e => setEditDataEspecifica(e.target.value)} className="w-full border rounded-lg p-2.5 text-sm" />
                  )}
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t">
                  <button type="button" onClick={() => setShowEditProModal(false)} className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg">Cancelar</button>
                  <button type="submit" className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow">Salvar Alterações</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // COR DO SALÃO
  const corSalão = userProfile?.cor_primaria || '#4f46e5';

  // GERAR DIAS DA SEMANA PARA O DASHBOARD DE AGENDA
  const diasDaSemana = Array.from({ length: 7 }).map((_, idx) => {
    const d = new Date(currentWeekStart);
    d.setDate(d.getDate() + idx);
    return d;
  });

  // PAINEL DO SALÃO / PROFISSIONAL
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col md:flex-row font-sans">
      <aside className="w-full md:w-64 bg-slate-900 text-slate-100 flex flex-col border-r border-slate-800">
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
          {userProfile?.logo_url ? (
            <img src={userProfile.logo_url} alt="Logo Salão" className="w-12 h-12 rounded-xl object-cover border border-slate-700 shadow" />
          ) : (
            <div style={{ backgroundColor: corSalão }} className="p-2.5 rounded-xl text-white shadow">
              <Scissors className="w-6 h-6" />
            </div>
          )}
          <div>
            <h1 className="font-bold text-base leading-tight truncate max-w-[130px]">{userProfile?.nome}</h1>
            <p className="text-xs text-slate-400">Painel do Salão</p>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          <button onClick={() => setProTab('dashboard_agenda')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium ${proTab === 'dashboard_agenda' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
            <Calendar className="w-5 h-5" /> Dashboard Agenda
          </button>
          <button onClick={() => setProTab('aprovacao')} className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium ${proTab === 'aprovacao' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
            <div className="flex items-center gap-3"><Inbox className="w-5 h-5" /> Solicitações</div>
            {proAppointments.filter(a => a.status === 'pendente').length > 0 && (
              <span className="bg-amber-500 text-slate-900 font-bold text-xs px-2 py-0.5 rounded-full">
                {proAppointments.filter(a => a.status === 'pendente').length}
              </span>
            )}
          </button>
          <button onClick={() => setProTab('servicos')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium ${proTab === 'servicos' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
            <Scissors className="w-5 h-5" /> Serviços & Produtos
          </button>
          <button onClick={() => setProTab('clientes')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium ${proTab === 'clientes' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
            <Users className="w-5 h-5" /> Clientes
          </button>
          <button onClick={() => setProTab('config')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium ${proTab === 'config' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
            <Settings className="w-5 h-5" /> Horários & Folgas
          </button>
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-rose-900/50 text-slate-300 hover:text-rose-200 py-2.5 rounded-lg text-sm transition">
            <LogOut className="w-4 h-4" /> Sair
          </button>
        </div>
      </aside>

      <main className="flex-1 p-8 overflow-y-auto">
        {/* TOP BANNER / LOGO SALÃO */}
        <div style={{ backgroundColor: corSalão }} className="text-white p-6 rounded-2xl shadow-lg mb-8 flex justify-between items-center">
          <div className="flex items-center gap-4">
            {userProfile?.logo_url && (
              <img src={userProfile.logo_url} alt="Logo" className="w-16 h-16 rounded-xl object-cover border-2 border-white/40 shadow-md" />
            )}
            <div>
              <h2 className="text-2xl font-bold">{userProfile?.nome}</h2>
              <p className="text-xs text-white/80">Bem-vinda(o) ao seu painel de agendamentos!</p>
            </div>
          </div>
          <button onClick={() => setShowAddApptModal(true)} className="bg-white text-slate-900 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow">
            <CalendarPlus className="w-4 h-4 text-indigo-600" /> Novo Agendamento
          </button>
        </div>

        {/* MENU DASHBOARD DA AGENDA (VISUALIZAÇÃO SEMANAL IGUAL À IMAGEM) */}
        {proTab === 'dashboard_agenda' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-2xl border shadow-sm">
              <div className="flex items-center gap-3">
                <button onClick={() => {
                  const prev = new Date(currentWeekStart);
                  prev.setDate(prev.getDate() - 7);
                  setCurrentWeekStart(prev);
                }} className="p-2 border rounded-xl hover:bg-slate-50"><ChevronLeft className="w-5 h-5 text-slate-600" /></button>
                
                <h3 className="font-extrabold text-lg text-slate-900">
                  {diasDaSemana[0].toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                </h3>

                <button onClick={() => {
                  const next = new Date(currentWeekStart);
                  next.setDate(next.getDate() + 7);
                  setCurrentWeekStart(next);
                }} className="p-2 border rounded-xl hover:bg-slate-50"><ChevronRight className="w-5 h-5 text-slate-600" /></button>
              </div>

              <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg border">
                Semana: {diasDaSemana[0].getDate()} a {diasDaSemana[6].getDate()}
              </span>
            </div>

            {/* GRADE DA AGENDA SEMANAL */}
            <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
              {diasDaSemana.map((diaObj, idx) => {
                const dataIso = diaObj.toISOString().split('T')[0];
                const apptsDoDia = proAppointments.filter(a => a.data === dataIso && a.status === 'confirmado');
                const ehHoje = new Date().toISOString().split('T')[0] === dataIso;

                return (
                  <div key={idx} className={`bg-white rounded-2xl border p-3 min-h-[400px] flex flex-col gap-2 ${ehHoje ? 'border-2 border-indigo-600 bg-indigo-50/10' : ''}`}>
                    <div className="text-center border-b pb-2">
                      <span className={`text-xl font-black block ${ehHoje ? 'text-indigo-600' : 'text-slate-800'}`}>{diaObj.getDate()}</span>
                      <span className="text-xs font-bold text-slate-400 uppercase">{DIAS_NOME[diaObj.getDay()]}</span>
                    </div>

                    <div className="space-y-2 flex-1 mt-2">
                      {apptsDoDia.length === 0 ? (
                        <div className="text-center py-8 text-slate-300 text-xs">Sem agendamentos</div>
                      ) : (
                        apptsDoDia.map(a => (
                          <div key={a.id} className="p-3 bg-indigo-600 text-white rounded-xl shadow-sm text-xs space-y-1">
                            <span className="font-bold block">{a.horario}</span>
                            <span className="font-semibold block truncate">{a.clientes?.nome}</span>
                            <span className="text-[10px] text-indigo-100 block truncate">{a.servicos?.nome}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* MENU SOLICITAÇÕES VIA LINK */}
        {proTab === 'aprovacao' && (
          <div className="bg-white rounded-xl border p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 text-lg">Aprovação de Agendamentos Efetivados pelo Link</h3>
            {proAppointments.filter(a => a.status === 'pendente').length === 0 ? (
              <p className="text-slate-500 text-sm">Nenhuma solicitação pendente no momento.</p>
            ) : (
              proAppointments.filter(a => a.status === 'pendente').map(a => (
                <div key={a.id} className="p-4 border-2 border-amber-200 bg-amber-50/40 rounded-xl flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-slate-900">{a.clientes?.nome} ({a.clientes?.telefone})</h4>
                    <p className="text-xs text-slate-600">{a.servicos?.nome} — {a.data?.split('-').reverse().join('/')} às {a.horario}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleUpdateApptStatus(a.id, 'confirmado')} className="bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow">Aprovar</button>
                    <button onClick={() => handleUpdateApptStatus(a.id, 'cancelado')} className="bg-rose-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow">Recusar</button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* MENU CLIENTES COM CAMPOS AMPLIADOS */}
        {proTab === 'clientes' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-slate-900 text-xl">Cadastro Completo de Clientes</h3>
              <button onClick={() => setShowAddClientModal(true)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold text-xs shadow flex items-center gap-1.5">
                <UserPlus className="w-4 h-4" /> Cadastrar Cliente
              </button>
            </div>

            <div className="bg-white rounded-xl border p-6 shadow-sm space-y-3">
              {proClients.map(c => (
                <div key={c.id} className="p-4 border rounded-xl bg-slate-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-xs">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{c.nome}</h4>
                    <p className="text-slate-600">WhatsApp: {c.telefone || 'N/I'}</p>
                    {c.endereco && <p className="text-slate-500">Endereço: {c.endereco}</p>}
                    {c.preferencia_profissional && <p className="text-indigo-600 font-semibold">Pref. Profissional: {c.preferencia_profissional}</p>}
                    {c.observacoes && <p className="text-slate-500 italic mt-1">Obs: {c.observacoes}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* MENU HORÁRIOS DA SEMANA E ALMOÇO */}
        {proTab === 'config' && (
          <div className="bg-white rounded-xl border p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 text-lg border-b pb-3">Ajuste de Horários de Atendimento & Almoço</h3>
            
            {configSuccess && <div className="p-3 bg-emerald-50 text-emerald-700 text-xs rounded-lg border">{configSuccess}</div>}

            <form onSubmit={salvarHorarioSemana} className="space-y-4">
              {weeklySchedule.map((item, idx) => (
                <div key={item.dia_semana} className="p-4 border rounded-xl bg-slate-50 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <input type="checkbox" checked={item.ativo} onChange={e => {
                        const updated = [...weeklySchedule];
                        updated[idx].ativo = e.target.checked;
                        setWeeklySchedule(updated);
                      }} className="w-4 h-4 text-indigo-600 rounded" />
                      <span className="font-bold text-sm text-slate-800">{item.nome}</span>
                    </div>

                    {item.ativo && (
                      <label className="flex items-center gap-2 text-xs font-bold text-slate-600 cursor-pointer">
                        <input type="checkbox" checked={item.com_almoco} onChange={e => {
                          const updated = [...weeklySchedule];
                          updated[idx].com_almoco = e.target.checked;
                          setWeeklySchedule(updated);
                        }} className="rounded text-indigo-600" />
                        Habilitar Pausa para Almoço
                      </label>
                    )}
                  </div>

                  {item.ativo && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-600">Atendimento:</span>
                        <input type="time" value={item.hora_inicio} onChange={e => {
                          const updated = [...weeklySchedule];
                          updated[idx].hora_inicio = e.target.value;
                          setWeeklySchedule(updated);
                        }} className="border rounded p-1.5" />
                        <span>às</span>
                        <input type="time" value={item.hora_fim} onChange={e => {
                          const updated = [...weeklySchedule];
                          updated[idx].hora_fim = e.target.value;
                          setWeeklySchedule(updated);
                        }} className="border rounded p-1.5" />
                      </div>

                      {item.com_almoco && (
                        <div className="flex items-center gap-2 bg-amber-50 p-2 rounded-lg border border-amber-200">
                          <span className="font-bold text-amber-800">Almoço:</span>
                          <input type="time" value={item.hora_inicio_almoco} onChange={e => {
                            const updated = [...weeklySchedule];
                            updated[idx].hora_inicio_almoco = e.target.value;
                            setWeeklySchedule(updated);
                          }} className="border rounded p-1.5" />
                          <span>às</span>
                          <input type="time" value={item.hora_fim_almoco} onChange={e => {
                            const updated = [...weeklySchedule];
                            updated[idx].hora_fim_almoco = e.target.value;
                            setWeeklySchedule(updated);
                          }} className="border rounded p-1.5" />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}

              <button type="submit" className="bg-indigo-600 text-white font-bold px-6 py-2.5 rounded-lg text-sm shadow">
                Salvar Horários de Atendimento
              </button>
            </form>
          </div>
        )}

        {/* DEMAIS MENUS (SERVIÇOS) */}
        {proTab === 'servicos' && (
          <div className="bg-white rounded-xl border p-6 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-slate-900 text-lg">Serviços e Produtos</h3>
              <button onClick={handleOpenAddServiceModal} className="bg-indigo-600 text-white px-3 py-2 rounded-lg text-xs font-bold">+ Novo Serviço</button>
            </div>
            {proServices.map(s => (
              <div key={s.id} className="p-3 border rounded-lg flex justify-between items-center text-xs">
                <div>
                  <span className="font-bold text-slate-900">{s.nome}</span>
                  <p className="text-slate-500">R$ {parseFloat(s.preco).toFixed(2)} — {s.duracao_minutos || 30} min</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* MODAL CADASTRAR CLIENTE COMPLETO */}
      {showAddClientModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-slate-900 text-lg">Nova Cliente (Completo)</h3>
              <button onClick={() => setShowAddClientModal(false)}><XCircle className="w-5 h-5 text-slate-400" /></button>
            </div>

            <form onSubmit={handleAddClientExt} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Nome Completo *</label>
                <input type="text" required value={newClientName} onChange={e => setNewClientName(e.target.value)} className="w-full border rounded-lg p-2.5 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">WhatsApp / Telefone *</label>
                <input type="tel" required value={newClientPhone} onChange={e => setNewClientPhone(e.target.value)} className="w-full border rounded-lg p-2.5 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Endereço Residencial (Opcional)</label>
                <input type="text" value={newClientEndereco} onChange={e => setNewClientEndereco(e.target.value)} className="w-full border rounded-lg p-2.5 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Preferência por Profissional (Opcional)</label>
                <input type="text" value={newClientPrefPro} onChange={e => setNewClientPrefPro(e.target.value)} placeholder="Ex: Cabeleireira Maria" className="w-full border rounded-lg p-2.5 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Observações (Opcional)</label>
                <textarea rows="2" value={newClientObs} onChange={e => setNewClientObs(e.target.value)} placeholder="Alergias, preferências..." className="w-full border rounded-lg p-2.5 text-sm"></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-2 border-t">
                <button type="button" onClick={() => setShowAddClientModal(false)} className="px-4 py-2 text-xs font-semibold text-slate-600">Cancelar</button>
                <button type="submit" className="px-4 py-2 text-xs font-semibold bg-indigo-600 text-white rounded-lg shadow">Salvar Cliente</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL SERVIÇO */}
      {showServiceModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-slate-900 text-lg">Novo Serviço</h3>
              <button onClick={() => setShowServiceModal(false)}><XCircle className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleSaveService} className="space-y-3">
              <input type="text" required placeholder="Nome do Serviço" value={serviceName} onChange={e => setServiceName(e.target.value)} className="w-full border rounded-lg p-2.5 text-sm" />
              <input type="number" step="0.01" required placeholder="Preço (R$)" value={servicePrice} onChange={e => setServicePrice(e.target.value)} className="w-full border rounded-lg p-2.5 text-sm" />
              <button type="submit" className="w-full bg-indigo-600 text-white py-2 rounded-lg font-bold text-xs">Salvar</button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL AGENDAMENTO MANUAL */}
      {showAddApptModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-slate-900 text-lg">Agendamento Manual</h3>
              <button onClick={() => setShowAddApptModal(false)}><XCircle className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleAddManualAppointment} className="space-y-3">
              <select required value={selectedClientId} onChange={e => setSelectedClientId(e.target.value)} className="w-full border rounded-lg p-2.5 text-sm">
                <option value="">Selecione a Cliente...</option>
                {proClients.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
              <select required value={manualServiceId} onChange={e => setManualServiceId(e.target.value)} className="w-full border rounded-lg p-2.5 text-sm">
                <option value="">Selecione o Serviço...</option>
                {proServices.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
              </select>
              <div className="grid grid-cols-2 gap-2">
                <input type="date" required value={manualDate} onChange={e => setManualDate(e.target.value)} className="border rounded-lg p-2 text-sm" />
                <input type="time" required value={manualTime} onChange={e => setManualTime(e.target.value)} className="border rounded-lg p-2 text-sm" />
              </div>
              <button type="submit" className="w-full bg-indigo-600 text-white py-2 rounded-lg font-bold text-xs shadow">Agendar</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
