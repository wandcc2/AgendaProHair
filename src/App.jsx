import React, { useState, useEffect } from 'react';
import { supabase } from './services/supabaseClient';

import Login from './pages/Login';
import PublicBooking from './pages/PublicBooking';
import SalaoDashboard from './pages/SalaoDashboard';
import ColorModal from './components/ColorModal';

export default function App() {
  const [session, setSession] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Login
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Rota Pública
  const queryParams = new URLSearchParams(window.location.search);
  const publicProId = queryParams.get('pro');

  // Profissional / Salão
  const [proTab, setProTab] = useState('agenda');
  const [proClients, setProClients] = useState([]);
  const [proServices, setProServices] = useState([]);
  const [proAppointments, setProAppointments] = useState([]);

  // Modal Ajuste de Cores
  const [showColorModal, setShowColorModal] = useState(false);
  const [customTopoCor, setCustomTopoCor] = useState('#4f46e5');
  const [customSidebarCor, setCustomSidebarCor] = useState('#0f172a');

  // Dashboard Semanal
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day; 
    return new Date(d.setDate(diff));
  });

  const [weeklySchedule, setWeeklySchedule] = useState(
    Array.from({ length: 7 }).map((_, idx) => ({
      dia_semana: idx,
      nome: ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'][idx],
      ativo: idx >= 1 && idx <= 6,
      hora_inicio: '08:00',
      hora_fim: '18:00',
      com_almoco: false,
      hora_inicio_almoco: '12:00',
      hora_fim_almoco: '13:00'
    }))
  );
  const [configSuccess, setConfigSuccess] = useState('');

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
      setCustomTopoCor(data.cor_topo || data.cor_primaria || '#4f46e5');
      setCustomSidebarCor(data.cor_sidebar || '#0f172a');
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
    if (userProfile) {
      const { data: cli } = await supabase.from('clientes').select('*').eq('profissional_id', userProfile.id).order('nome', { ascending: true });
      const { data: srv } = await supabase.from('servicos').select('*').eq('profissional_id', userProfile.id).order('nome', { ascending: true });
      const { data: appt } = await supabase.from('agendamentos').select('*, clientes(nome, telefone), servicos(nome, preco)').eq('profissional_id', userProfile.id).order('data', { ascending: true });

      setProClients(cli || []);
      setProServices(srv || []);
      setProAppointments(appt || []);
    }
  };

  const handleSaveColors = async () => {
    try {
      const { error } = await supabase.from('perfis').update({
        cor_topo: customTopoCor,
        cor_sidebar: customSidebarCor,
        cor_primaria: customTopoCor
      }).eq('id', userProfile.id);

      if (error) throw error;

      setUserProfile({ ...userProfile, cor_topo: customTopoCor, cor_sidebar: customSidebarCor, cor_primaria: customTopoCor });
      setShowColorModal(false);
      alert('Cores salvas com sucesso!');
    } catch (e) {
      alert('Erro ao salvar cores: ' + e.message);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUserProfile(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white font-medium animate-pulse">
        Carregando AgendaPro...
      </div>
    );
  }

  // ROTA 1: PÁGINA PÚBLICA
  if (publicProId) {
    return (
      <PublicBooking
        publicProProfile={publicProProfile}
        publicServices={publicServices}
        publicSuccess={publicSuccess}
        setPublicSuccess={setPublicSuccess}
        clientName={clientName} setClientName={setClientName}
        clientPhone={clientPhone} setClientPhone={setClientPhone}
        selectedService={selectedService} setSelectedService={setSelectedService}
        bookingDate={bookingDate} setBookingDate={setBookingDate}
        bookingTime={bookingTime} setBookingTime={setBookingTime}
        publicFormaPagto={publicFormaPagto} setPublicFormaPagto={setPublicFormaPagto}
        onSubmit={(e) => { e.preventDefault(); alert('Agendamento enviado!'); }}
      />
    );
  }

  // ROTA 2: LOGIN
  if (!session || !userProfile) {
    return (
      <Login
        email={email} setEmail={setEmail}
        password={password} setPassword={setPassword}
        loginError={loginError}
        onLogin={(e) => {
          e.preventDefault();
          setLoading(true);
          supabase.auth.signInWithPassword({ email, password }).then(({ error }) => {
            if (error) { setLoginError('E-mail ou senha incorretos.'); setLoading(false); }
          });
        }}
      />
    );
  }

  // ROTA 3: DASHBOARD DO SALÃO
  return (
    <>
      <SalaoDashboard
        userProfile={userProfile}
        proTab={proTab} setProTab={setProTab}
        proAppointments={proAppointments}
        proClients={proClients}
        proServices={proServices}
        currentWeekStart={currentWeekStart} setCurrentWeekStart={setCurrentWeekStart}
        weeklySchedule={weeklySchedule} setWeeklySchedule={setWeeklySchedule}
        salvarHorarioSemana={(e) => e.preventDefault()}
        configSuccess={configSuccess}
        onLogout={handleLogout}
        onOpenColorModal={() => setShowColorModal(true)}
        setShowAddApptModal={() => {}}
        setShowAddClientModal={() => {}}
        setShowServiceModal={() => {}}
      />

      <ColorModal
        show={showColorModal}
        onClose={() => setShowColorModal(false)}
        customTopoCor={customTopoCor} setCustomTopoCor={setCustomTopoCor}
        customSidebarCor={customSidebarCor} setCustomSidebarCor={setCustomSidebarCor}
        onSave={handleSaveColors}
      />
    </>
  );
}
