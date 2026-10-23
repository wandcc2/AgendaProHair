import React, { useState, useEffect } from 'react';
import { 
  Calendar, Users, Scissors, Clock, DollarSign, Settings, MessageSquare, 
  Palette, LogOut, CalendarPlus, ChevronLeft, ChevronRight, UserPlus, Inbox,
  Plus, Check, X
} from 'lucide-react';
import { supabase } from '../services/supabaseClient';

const DIAS_NOME = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];

export default function SalaoDashboard({
  userProfile, proTab, setProTab, proAppointments, proClients, proServices,
  currentWeekStart, setCurrentWeekStart, weeklySchedule, setWeeklySchedule,
  salvarHorarioSemana, configSuccess, onLogout, onOpenColorModal, loadAppData
}) {
  const corTopo = userProfile?.cor_topo || userProfile?.cor_primaria || '#4f46e5';
  const corSidebar = userProfile?.cor_sidebar || '#0f172a';
  const corTextoSidebar = userProfile?.cor_texto_sidebar || '#cbd5e1';

  // Modais
  const [showAddApptModal, setShowAddApptModal] = useState(false);
  const [showAddClientModal, setShowAddClientModal] = useState(false);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [showAddDespesaModal, setShowAddDespesaModal] = useState(false);

  // Estados dos Formulários
  const [apptClientType, setApptClientType] = useState('existing');
  const [selectedClientId, setSelectedClientId] = useState('');
  const [manualClientName, setManualClientName] = useState('');
  const [manualClientPhone, setManualClientPhone] = useState('');
  const [manualServiceId, setManualServiceId] = useState('');
  const [manualDate, setManualDate] = useState('');
  const [manualTime, setManualTime] = useState('');

  const [newClientName, setNewClientName] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [newClientEndereco, setNewClientEndereco] = useState('');

  const [serviceName, setServiceName] = useState('');
  const [servicePrice, setServicePrice] = useState('');
  const [serviceDuration, setServiceDuration] = useState('30');

  // Módulo de Despesas
  const [despesas, setDespesas] = useState([]);
  const [despesaDesc, setDespesaDesc] = useState('');
  const [despesaValor, setDespesaValor] = useState('');

  useEffect(() => {
    if (userProfile?.id) {
      loadDespesas();
    }
  }, [userProfile]);

  const loadDespesas = async () => {
    const { data } = await supabase.from('despesas').select('*').eq('profissional_id', userProfile.id).order('data', { ascending: false });
    setDespesas(data || []);
  };

  const pendentes = proAppointments.filter(a => a.status === 'pendente');

  const diasDaSemana = Array.from({ length: 7 }).map((_, idx) => {
    const d = new Date(currentWeekStart);
    d.setDate(d.getDate() + idx);
    return d;
  });

  // Cálculos Financeiros
  const faturamentoBruto = proAppointments
    .filter(a => a.status === 'confirmado')
    .reduce((acc, a) => acc + (parseFloat(a.servicos?.preco) || 0), 0);

  const despesasTotais = despesas.reduce((acc, d) => acc + (parseFloat(d.valor) || 0), 0);
  const lucroLiquido = faturamentoBruto - despesasTotais;
  const aproveitamentoReceita = faturamentoBruto > 0 ? Math.max(0, Math.round((lucroLiquido / faturamentoBruto) * 100)) : 0;

  // Handlers
  const handleUpdateApptStatus = async (apptId, newStatus) => {
    const { error } = await supabase.from('agendamentos').update({ status: newStatus }).eq('id', apptId);
    if (!error) loadAppData();
  };

  const handleAddClient = async (e) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from('clientes').insert([{
        nome: newClientName,
        telefone: newClientPhone,
        phone: newClientPhone,
        endereco: newClientEndereco,
        profissional_id: userProfile.id
      }]);

      if (error) throw error;

      setNewClientName('');
      setNewClientPhone('');
      setNewClientEndereco('');
      setShowAddClientModal(false);
      await loadAppData();
    } catch (err) {
      alert('Erro ao cadastrar cliente: ' + err.message);
    }
  };

  const handleAddService = async (e) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from('servicos').insert([{
        nome: serviceName,
        preco: parseFloat(servicePrice),
        duracao_minutos: parseInt(serviceDuration),
        profissional_id: userProfile.id
      }]);

      if (error) throw error;

      setServiceName('');
      setServicePrice('');
      setServiceDuration('30');
      setShowServiceModal(false);
      await loadAppData();
    } catch (err) {
      alert('Erro ao cadastrar serviço: ' + err.message);
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
          phone: manualClientPhone,
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
      await loadAppData();
    } catch (err) {
      alert('Erro ao agendar: ' + err.message);
    }
  };

  const handleAddDespesa = async (e) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from('despesas').insert([{
        descricao: despesaDesc,
        valor: parseFloat(despesaValor),
        profissional_id: userProfile.id,
        data: new Date().toISOString().split('T')[0]
      }]);

      if (error) throw error;

      setDespesaDesc('');
      setDespesaValor('');
      setShowAddDespesaModal(false);
      await loadDespesas();
    } catch (err) {
      alert('Erro ao lançar despesa: ' + err.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col md:flex-row font-sans">
      {/* SIDEBAR */}
      <aside style={{ backgroundColor: corSidebar }} className="w-full md:w-64 flex flex-col border-r border-slate-800/80 shadow-xl">
        <div className="p-6 border-b border-slate-800/60 flex items-center gap-3">
          {userProfile?.logo_url ? (
            <img src={userProfile.logo_url} alt="Logo Salão" className="w-12 h-12 rounded-xl object-cover border border-slate-700 shadow" />
          ) : (
            <div style={{ backgroundColor: corTopo }} className="p-2.5 rounded-xl text-white shadow">
              <Scissors className="w-6 h-6" />
            </div>
          )}
          <div>
            <h1 style={{ color: corTextoSidebar }} className="font-bold text-base leading-tight truncate max-w-[130px]">{userProfile?.nome}</h1>
            <p className="text-xs opacity-75" style={{ color: corTextoSidebar }}>Painel de Gestão</p>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1.5">
          <button onClick={() => setProTab('agenda')} style={{ color: corTextoSidebar }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition ${proTab === 'agenda' ? 'bg-indigo-600 text-white shadow-md' : 'hover:bg-slate-800/60'}`}>
            <Calendar className="w-5 h-5 text-pink-400" /> Agenda
          </button>

          <button onClick={() => setProTab('solicitacoes')} style={{ color: corTextoSidebar }} className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition ${proTab === 'solicitacoes' ? 'bg-indigo-600 text-white shadow-md' : 'hover:bg-slate-800/60'}`}>
            <div className="flex items-center gap-3"><Inbox className="w-5 h-5 text-amber-400" /> Solicitações</div>
            {pendentes.length > 0 && (
              <span className="bg-amber-500 text-slate-950 font-bold text-xs px-2 py-0.5 rounded-full">{pendentes.length}</span>
            )}
          </button>

          <button onClick={() => setProTab('clientes')} style={{ color: corTextoSidebar }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition ${proTab === 'clientes' ? 'bg-indigo-600 text-white shadow-md' : 'hover:bg-slate-800/60'}`}>
            <Users className="w-5 h-5 text-indigo-300" /> Clientes
          </button>

          <button onClick={() => setProTab('servicos')} style={{ color: corTextoSidebar }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition ${proTab === 'servicos' ? 'bg-indigo-600 text-white shadow-md' : 'hover:bg-slate-800/60'}`}>
            <Scissors className="w-5 h-5 text-purple-300" /> Serviços
          </button>

          <button onClick={() => setShowAddApptModal(true)} style={{ color: corTextoSidebar }} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition hover:bg-slate-800/60 text-emerald-400">
            <CalendarPlus className="w-5 h-5 text-emerald-400" /> Agendamento Manual
          </button>

          <button onClick={() => setProTab('horarios')} style={{ color: corTextoSidebar }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition ${proTab === 'horarios' ? 'bg-indigo-600 text-white shadow-md' : 'hover:bg-slate-800/60'}`}>
            <Clock className="w-5 h-5 text-cyan-300" /> Horários
          </button>

          <button onClick={() => setProTab('faturamento')} style={{ color: corTextoSidebar }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition ${proTab === 'faturamento' ? 'bg-indigo-600 text-white shadow-md' : 'hover:bg-slate-800/60'}`}>
            <DollarSign className="w-5 h-5 text-emerald-400" /> Faturamento
          </button>

          <button onClick={() => setProTab('ajustes')} style={{ color: corTextoSidebar }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition ${proTab === 'ajustes' ? 'bg-indigo-600 text-white shadow-md' : 'hover:bg-slate-800/60'}`}>
            <Settings className="w-5 h-5 text-slate-400" /> Ajustes
          </button>

          <button onClick={() => setProTab('whatsapp')} style={{ color: corTextoSidebar }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition ${proTab === 'whatsapp' ? 'bg-indigo-600 text-white shadow-md' : 'hover:bg-slate-800/60'}`}>
            <MessageSquare className="w-4 h-4 text-emerald-400" /> WhatsApp
          </button>
        </nav>

        <div className="p-4 border-t border-slate-800/60 space-y-2">
          <button onClick={onOpenColorModal} style={{ color: corTextoSidebar }} className="w-full flex items-center justify-center gap-2 bg-slate-800/80 hover:bg-slate-700 py-2.5 rounded-lg text-xs font-semibold transition border border-slate-700">
            <Palette className="w-4 h-4 text-amber-400" /> Personalizar Cores
          </button>

          <button onClick={onLogout} style={{ color: corTextoSidebar }} className="w-full flex items-center justify-center gap-2 bg-slate-800/80 hover:bg-rose-900/50 hover:text-rose-200 py-2.5 rounded-lg text-xs font-semibold transition border border-slate-700">
            <LogOut className="w-4 h-4" /> Sair
          </button>
        </div>
      </aside>

      {/* CONTEÚDO PRINCIPAL */}
      <main className="flex-1 p-8 overflow-y-auto bg-slate-950 text-slate-100">
        <div style={{ backgroundColor: corTopo }} className="text-white p-6 rounded-2xl shadow-lg mb-8 flex justify-between items-center transition-all">
          <div className="flex items-center gap-4">
            {userProfile?.logo_url && (
              <img src={userProfile.logo_url} alt="Logo" className="w-16 h-16 rounded-xl object-cover border-2 border-white/40 shadow-md" />
            )}
            <div>
              <h2 className="text-2xl font-bold">{userProfile?.nome}</h2>
              <p className="text-xs text-white/80">Painel Administrativo do Salão</p>
            </div>
          </div>
        </div>

        {/* AGENDA SEMANAL */}
        {proTab === 'agenda' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900 p-4 rounded-2xl border border-slate-800">
              <div className="flex items-center gap-3">
                <button onClick={() => {
                  const prev = new Date(currentWeekStart);
                  prev.setDate(prev.getDate() - 7);
                  setCurrentWeekStart(prev);
                }} className="p-2 border border-slate-700 rounded-xl hover:bg-slate-800"><ChevronLeft className="w-5 h-5 text-slate-300" /></button>

                <h3 className="font-extrabold text-lg text-white">
                  {diasDaSemana[0].toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                </h3>

                <button onClick={() => {
                  const next = new Date(currentWeekStart);
                  next.setDate(next.getDate() + 7);
                  setCurrentWeekStart(next);
                }} className="p-2 border border-slate-700 rounded-xl hover:bg-slate-800"><ChevronRight className="w-5 h-5 text-slate-300" /></button>
              </div>

              <span className="text-xs font-bold text-slate-400 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">
                Semana: {diasDaSemana[0].getDate()} a {diasDaSemana[6].getDate()}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
              {diasDaSemana.map((diaObj, idx) => {
                const dataIso = diaObj.toISOString().split('T')[0];
                const apptsDoDia = proAppointments.filter(a => a.data === dataIso && a.status === 'confirmado');
                const ehHoje = new Date().toISOString().split('T')[0] === dataIso;

                return (
                  <div key={idx} className={`bg-slate-900 rounded-2xl border border-slate-800 p-3 min-h-[400px] flex flex-col gap-2 ${ehHoje ? 'border-2 border-indigo-500' : ''}`}>
                    <div className="text-center border-b border-slate-800 pb-2">
                      <span className={`text-xl font-black block ${ehHoje ? 'text-indigo-400' : 'text-white'}`}>{diaObj.getDate()}</span>
                      <span className="text-xs font-bold text-slate-500 uppercase">{DIAS_NOME[diaObj.getDay()]}</span>
                    </div>

                    <div className="space-y-2 flex-1 mt-2">
                      {apptsDoDia.length === 0 ? (
                        <div className="text-center py-8 text-slate-600 text-xs">Sem agendamentos</div>
                      ) : (
                        apptsDoDia.map(a => (
                          <div key={a.id} className="p-3 bg-indigo-600 text-white rounded-xl shadow-sm text-xs space-y-1">
                            <span className="font-bold block">{a.horario}</span>
                            <span className="font-semibold block truncate">{a.clientes?.nome}</span>
                            <span className="text-[10px] text-indigo-200 block truncate">{a.servicos?.nome}</span>
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

        {/* SOLICITAÇÕES */}
        {proTab === 'solicitacoes' && (
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 space-y-4">
            <h3 className="font-bold text-white text-lg border-b border-slate-800 pb-3">Aprovação de Agendamentos (Link Público)</h3>
            {pendentes.length === 0 ? (
              <p className="text-slate-400 text-sm">Nenhuma solicitação pendente no momento.</p>
            ) : (
              pendentes.map(a => (
                <div key={a.id} className="p-4 border border-amber-500/30 bg-amber-500/10 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h4 className="font-bold text-white">{a.clientes?.nome} ({a.clientes?.telefone || a.clientes?.phone})</h4>
                    <p className="text-xs text-slate-300 mt-0.5">{a.servicos?.nome} — {a.data?.split('-').reverse().join('/')} às {a.horario}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleUpdateApptStatus(a.id, 'confirmado')} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-xs font-bold shadow flex items-center gap-1">
                      <Check className="w-4 h-4" /> Aprovar
                    </button>
                    <button onClick={() => handleUpdateApptStatus(a.id, 'cancelado')} className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-lg text-xs font-bold shadow flex items-center gap-1">
                      <X className="w-4 h-4" /> Recusar
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* CLIENTES */}
        {proTab === 'clientes' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-white text-xl">Clientes Cadastradas</h3>
              <button onClick={() => setShowAddClientModal(true)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold text-xs shadow flex items-center gap-1.5">
                <UserPlus className="w-4 h-4" /> Cadastrar Cliente
              </button>
            </div>

            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 space-y-3">
              {proClients.map(c => (
                <div key={c.id} className="p-4 border border-slate-800 rounded-xl bg-slate-950 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-xs">
                  <div>
                    <h4 className="font-bold text-white text-sm">{c.nome}</h4>
                    <p className="text-slate-400">WhatsApp: {c.telefone || c.phone || 'N/I'}</p>
                    {c.endereco && <p className="text-slate-500">Endereço: {c.endereco}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SERVIÇOS */}
        {proTab === 'servicos' && (
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-white text-lg">Serviços e Produtos</h3>
              <button onClick={() => setShowServiceModal(true)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-xs font-bold shadow flex items-center gap-1">
                <Plus className="w-4 h-4" /> Novo Serviço
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {proServices.map(s => (
                <div key={s.id} className="p-4 border border-slate-800 rounded-xl bg-slate-950 flex justify-between items-center text-xs">
                  <div>
                    <span className="font-bold text-white text-sm block">{s.nome}</span>
                    <p className="text-slate-400">R$ {parseFloat(s.preco).toFixed(2)} • {s.duracao_minutos || 30} min</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* GESTÃO FINANCEIRA / FATURAMENTO */}
        {proTab === 'faturamento' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-extrabold text-white text-2xl">Gestão Financeira</h3>
                <p className="text-xs text-slate-400 mt-0.5">Acompanhe seu DRE e registre despesas.</p>
              </div>

              <div className="flex items-center gap-3">
                <span className="bg-slate-900 border border-slate-800 text-slate-300 text-xs px-4 py-2.5 rounded-xl font-bold">
                  outubro de 2026
                </span>
                <button onClick={() => setShowAddDespesaModal(true)} className="bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow transition">
                  - Lançar Despesa
                </button>
              </div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl space-y-2">
              <div className="flex justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
                <span>Aproveitamento da Receita</span>
                <span className="text-emerald-400 font-extrabold">{aproveitamentoReceita}%</span>
              </div>
              <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                <div style={{ width: `${aproveitamentoReceita}%` }} className="bg-emerald-500 h-full rounded-full transition-all duration-500"></div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-900/90 border-2 border-emerald-500/80 p-6 rounded-2xl text-center shadow-lg">
                <span className="text-[11px] text-slate-400 font-extrabold uppercase block mb-2 tracking-wider">Faturamento Bruto</span>
                <span className="text-2xl font-black text-emerald-400">R$ {faturamentoBruto.toFixed(2)}</span>
              </div>

              <div className="bg-slate-900/90 border-2 border-rose-500/80 p-6 rounded-2xl text-center shadow-lg">
                <span className="text-[11px] text-slate-400 font-extrabold uppercase block mb-2 tracking-wider">Despesas Totais</span>
                <span className="text-2xl font-black text-rose-500">R$ {despesasTotais.toFixed(2)}</span>
              </div>

              <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl text-center shadow-lg">
                <span className="text-[11px] text-slate-400 font-extrabold uppercase block mb-2 tracking-wider">Lucro Líquido</span>
                <span className={`text-2xl font-black ${lucroLiquido >= 0 ? 'text-white' : 'text-rose-400'}`}>R$ {lucroLiquido.toFixed(2)}</span>
              </div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-4">
              <h4 className="font-bold text-white text-sm">Despesas Lançadas no Mês</h4>
              {despesas.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-xs border border-slate-800/60 rounded-xl bg-slate-950/40">
                  Nenhuma despesa lançada.
                </div>
              ) : (
                <div className="space-y-2">
                  {despesas.map(d => (
                    <div key={d.id} className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex justify-between items-center text-xs">
                      <div>
                        <span className="font-bold text-white block">{d.descricao}</span>
                        <span className="text-[10px] text-slate-500">{d.data?.split('-').reverse().join('/')}</span>
                      </div>
                      <span className="font-bold text-rose-400">- R$ {parseFloat(d.valor).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* HORÁRIOS */}
        {proTab === 'horarios' && (
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 space-y-4">
            <h3 className="font-bold text-white text-lg border-b border-slate-800 pb-3">Ajuste de Horários & Pausa para Almoço</h3>
            {configSuccess && <div className="p-3 bg-emerald-500/20 text-emerald-300 text-xs rounded-lg border border-emerald-500/30">{configSuccess}</div>}

            <form onSubmit={salvarHorarioSemana} className="space-y-4">
              {weeklySchedule.map((item, idx) => (
                <div key={item.dia_semana} className="p-4 border border-slate-800 rounded-xl bg-slate-950 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <input type="checkbox" checked={item.ativo} onChange={e => {
                        const updated = [...weeklySchedule];
                        updated[idx].ativo = e.target.checked;
                        setWeeklySchedule(updated);
                      }} className="w-4 h-4 text-indigo-600 rounded" />
                      <span className="font-bold text-sm text-white">{item.nome}</span>
                    </div>

                    {item.ativo && (
                      <label className="flex items-center gap-2 text-xs font-bold text-slate-400 cursor-pointer">
                        <input type="checkbox" checked={item.com_almoco} onChange={e => {
                          const updated = [...weeklySchedule];
                          updated[idx].com_almoco = e.target.checked;
                          setWeeklySchedule(updated);
                        }} className="rounded text-indigo-600" />
                        Pausa para Almoço
                      </label>
                    )}
                  </div>

                  {item.ativo && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-800 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-400">Atendimento:</span>
                        <input type="time" value={item.hora_inicio} onChange={e => {
                          const updated = [...weeklySchedule];
                          updated[idx].hora_inicio = e.target.value;
                          setWeeklySchedule(updated);
                        }} className="bg-slate-900 border border-slate-800 text-white rounded p-1.5" />
                        <span>às</span>
                        <input type="time" value={item.hora_fim} onChange={e => {
                          const updated = [...weeklySchedule];
                          updated[idx].hora_fim = e.target.value;
                          setWeeklySchedule(updated);
                        }} className="bg-slate-900 border border-slate-800 text-white rounded p-1.5" />
                      </div>

                      {item.com_almoco && (
                        <div className="flex items-center gap-2 bg-amber-500/10 p-2 rounded-lg border border-amber-500/30">
                          <span className="font-bold text-amber-400">Almoço:</span>
                          <input type="time" value={item.hora_inicio_almoco} onChange={e => {
                            const updated = [...weeklySchedule];
                            updated[idx].hora_inicio_almoco = e.target.value;
                            setWeeklySchedule(updated);
                          }} className="bg-slate-900 border border-slate-800 text-white rounded p-1.5" />
                          <span>às</span>
                          <input type="time" value={item.hora_fim_almoco} onChange={e => {
                            const updated = [...weeklySchedule];
                            updated[idx].hora_fim_almoco = e.target.value;
                            setWeeklySchedule(updated);
                          }} className="bg-slate-900 border border-slate-800 text-white rounded p-1.5" />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}

              <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-2.5 rounded-lg text-sm shadow">
                Salvar Horários
              </button>
            </form>
          </div>
        )}

        {/* AJUSTES */}
        {proTab === 'ajustes' && (
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 space-y-4">
            <h3 className="font-bold text-white text-lg border-b border-slate-800 pb-3">Link de Agendamento</h3>
            <div>
              <span className="text-xs font-bold text-slate-400 block mb-1">Seu Link do Salão:</span>
              <div className="flex items-center gap-2">
                <input type="text" readOnly value={`${window.location.origin}/?pro=${userProfile?.id}`} className="w-full border border-slate-800 rounded-lg p-2.5 text-xs bg-slate-950 font-mono text-slate-300" />
                <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/?pro=${userProfile?.id}`); alert('Link copiado!'); }} className="bg-indigo-600 text-white px-4 py-2.5 rounded-lg text-xs font-bold">Copiar</button>
              </div>
            </div>
          </div>
        )}

        {/* WHATSAPP */}
        {proTab === 'whatsapp' && (
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 space-y-4">
            <h3 className="font-bold text-white text-lg border-b border-slate-800 pb-3">WhatsApp & Notificações</h3>
            <p className="text-sm text-slate-400">Disparo de lembretes e confirmações presenciais.</p>
          </div>
        )}
      </main>

      {/* MODAL CADASTRAR CLIENTE */}
      {showAddClientModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-800 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-lg">Nova Cliente</h3>
              <button onClick={() => setShowAddClientModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>

            <form onSubmit={handleAddClient} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Nome Completo *</label>
                <input type="text" required value={newClientName} onChange={e => setNewClientName(e.target.value)} className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2.5 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">WhatsApp *</label>
                <input type="tel" required value={newClientPhone} onChange={e => setNewClientPhone(e.target.value)} className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2.5 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Endereço (Opcional)</label>
                <input type="text" value={newClientEndereco} onChange={e => setNewClientEndereco(e.target.value)} className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2.5 text-sm" />
              </div>

              <div className="flex justify-end gap-3 pt-2 border-t border-slate-800">
                <button type="button" onClick={() => setShowAddClientModal(false)} className="px-4 py-2 text-xs font-semibold text-slate-400">Cancelar</button>
                <button type="submit" className="px-4 py-2 text-xs font-semibold bg-indigo-600 text-white rounded-lg shadow">Salvar Cliente</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL SERVIÇO */}
      {showServiceModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-800 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-lg">Novo Serviço</h3>
              <button onClick={() => setShowServiceModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleAddService} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Nome do Serviço *</label>
                <input type="text" required placeholder="Ex: Corte + Escova" value={serviceName} onChange={e => setServiceName(e.target.value)} className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2.5 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Preço (R$) *</label>
                <input type="number" step="0.01" required placeholder="50.00" value={servicePrice} onChange={e => setServicePrice(e.target.value)} className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2.5 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Duração (Minutos)</label>
                <input type="number" value={serviceDuration} onChange={e => setServiceDuration(e.target.value)} className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2.5 text-sm" />
              </div>
              <button type="submit" className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-bold text-xs shadow">Salvar Serviço</button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL LANÇAR DESPESA */}
      {showAddDespesaModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-800 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-lg">Lançar Nova Despesa</h3>
              <button onClick={() => setShowAddDespesaModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>

            <form onSubmit={handleAddDespesa} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Descrição da Despesa *</label>
                <input type="text" required placeholder="Ex: Produtos de Cabelo, Luz, Aluguel" value={despesaDesc} onChange={e => setDespesaDesc(e.target.value)} className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2.5 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Valor (R$) *</label>
                <input type="number" step="0.01" required placeholder="150.00" value={despesaValor} onChange={e => setDespesaValor(e.target.value)} className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2.5 text-sm" />
              </div>

              <button type="submit" className="w-full bg-rose-500 hover:bg-rose-600 text-white py-2.5 rounded-lg font-bold text-xs shadow">Registrar Despesa</button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL AGENDAMENTO MANUAL */}
      {showAddApptModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-800 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-lg">Agendamento Manual</h3>
              <button onClick={() => setShowAddApptModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>

            <form onSubmit={handleAddManualAppointment} className="space-y-3">
              <div className="flex border border-slate-800 rounded-lg overflow-hidden text-xs">
                <button type="button" onClick={() => setApptClientType('existing')} className={`flex-1 py-2 font-bold ${apptClientType === 'existing' ? 'bg-indigo-600 text-white' : 'bg-slate-950 text-slate-400'}`}>Cliente Cadastrada</button>
                <button type="button" onClick={() => setApptClientType('new')} className={`flex-1 py-2 font-bold ${apptClientType === 'new' ? 'bg-indigo-600 text-white' : 'bg-slate-950 text-slate-400'}`}>Nova Cliente</button>
              </div>

              {apptClientType === 'existing' ? (
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Selecione a Cliente *</label>
                  <select required value={selectedClientId} onChange={e => setSelectedClientId(e.target.value)} className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2.5 text-sm">
                    <option value="">Selecione...</option>
                    {proClients.map(c => <option key={c.id} value={c.id}>{c.nome} ({c.telefone || c.phone})</option>)}
                  </select>
                </div>
              ) : (
                <div className="space-y-2">
                  <input type="text" required placeholder="Nome Completo da Cliente" value={manualClientName} onChange={e => setManualClientName(e.target.value)} className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2.5 text-sm" />
                  <input type="tel" required placeholder="WhatsApp" value={manualClientPhone} onChange={e => setManualClientPhone(e.target.value)} className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2.5 text-sm" />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Serviço *</label>
                <select required value={manualServiceId} onChange={e => setManualServiceId(e.target.value)} className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2.5 text-sm">
                  <option value="">Selecione o Serviço...</option>
                  {proServices.map(s => <option key={s.id} value={s.id}>{s.nome} — R$ {parseFloat(s.preco).toFixed(2)}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Data *</label>
                  <input type="date" required value={manualDate} onChange={e => setManualDate(e.target.value)} className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Horário *</label>
                  <input type="time" required value={manualTime} onChange={e => setManualTime(e.target.value)} className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2 text-sm" />
                </div>
              </div>

              <button type="submit" className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-bold text-xs shadow mt-2">Agendar Atendimento</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
