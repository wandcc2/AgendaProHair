import React, { useState, useEffect } from 'react';
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
  Edit, 
  ChevronLeft, 
  ChevronRight,
  TrendingUp,
  DollarSign,
  UserPlus,
  Send,
  CalendarCheck
} from 'lucide-react';

// Dados Iniciais (Exemplo)
const INITIAL_SERVICES = [
  { id: '1', name: 'Corte Masculino', duration: 30, price: 50 },
  { id: '2', name: 'Barba Completa', duration: 30, price: 40 },
  { id: '3', name: 'Corte + Barba', duration: 60, price: 80 },
  { id: '4', name: 'Coloração / Luzes', duration: 120, price: 150 },
  { id: '5', name: 'Escova Progressiva', duration: 120, price: 180 },
];

const INITIAL_CLIENTS = [
  { id: '1', name: 'Carlos Silva', phone: '47999998888', email: 'carlos@email.com', notes: 'Prefere corte com tesoura nas laterais' },
  { id: '2', name: 'Ana Souza', phone: '47988887777', email: 'ana@email.com', notes: 'Alérgica a certas marcas de tintura' },
  { id: '3', name: 'Marcos Oliveira', phone: '47977776666', email: 'marcos@email.com', notes: 'Atendimento sempre no final da tarde' }
];

export default function App() {
  // Estado Principal
  const [activeTab, setActiveTab] = useState('agenda');
  const [clients, setClients] = useState(() => {
    const saved = localStorage.getItem('agendapro_clients');
    return saved ? JSON.parse(saved) : INITIAL_CLIENTS;
  });
  
  const [services, setServices] = useState(() => {
    const saved = localStorage.getItem('agendapro_services');
    return saved ? JSON.parse(saved) : INITIAL_SERVICES;
  });

  const [appointments, setAppointments] = useState(() => {
    const saved = localStorage.getItem('agendapro_appointments');
    if (saved) return JSON.parse(saved);
    
    const todayStr = new Date().toISOString().split('T')[0];
    return [
      {
        id: '1',
        clientId: '1',
        clientName: 'Carlos Silva',
        clientPhone: '47999998888',
        serviceId: '3',
        serviceName: 'Corte + Barba',
        date: todayStr,
        time: '14:00',
        duration: 60,
        price: 80,
        status: 'CONFIRMED',
        reminderSent: true
      },
      {
        id: '2',
        clientId: '2',
        clientName: 'Ana Souza',
        clientPhone: '47988887777',
        serviceId: '4',
        serviceName: 'Coloração / Luzes',
        date: todayStr,
        time: '16:00',
        duration: 120,
        price: 150,
        status: 'PENDING',
        reminderSent: false
      }
    ];
  });

  // Salvar no LocalStorage
  useEffect(() => {
    localStorage.setItem('agendapro_clients', JSON.stringify(clients));
  }, [clients]);

  useEffect(() => {
    localStorage.setItem('agendapro_services', JSON.stringify(services));
  }, [services]);

  useEffect(() => {
    localStorage.setItem('agendapro_appointments', JSON.stringify(appointments));
  }, [appointments]);

  // Modais e Formulários
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isApptModalOpen, setIsApptModalOpen] = useState(false);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [selectedClientHistory, setSelectedClientHistory] = useState(null);

  // Form Agendamento
  const [newAppt, setNewAppt] = useState({
    clientId: '',
    serviceId: '',
    date: new Date().toISOString().split('T')[0],
    time: '09:00',
    notes: ''
  });

  // Form Cliente
  const [newClient, setNewClient] = useState({ name: '', phone: '', email: '', notes: '' });

  // Form Serviço
  const [newService, setNewService] = useState({ name: '', duration: 30, price: 50 });

  // Busca e Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Envio de Mensagem no WhatsApp
  const sendWhatsAppMessage = (phone, text) => {
    const cleanPhone = phone.replace(/\D/g, '');
    const formattedPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
    const encodedText = encodeURIComponent(text);
    window.open(`https://wa.me/${formattedPhone}?text=${encodedText}`, '_blank');
  };

  const handleSendConfirmation = (appt) => {
    const msg = `Olá ${appt.clientName}! 👋\n\nSeu agendamento foi marcado com sucesso!\n\n🗓️ *Data:* ${appt.date.split('-').reverse().join('/')}\n⏰ *Horário:* ${appt.time}\n💇 *Serviço:* ${appt.serviceName}\n💰 *Valor:* R$ ${appt.price.toFixed(2)}\n\nQualquer dúvida estamos à disposição!`;
    sendWhatsAppMessage(appt.clientPhone, msg);
  };

  const handleSendReminder = (appt) => {
    const msg = `Olá ${appt.clientName}! 📢\n\nPassando para lembrar do seu atendimento *amanhã*!\n\n🗓️ *Data:* ${appt.date.split('-').reverse().join('/')}\n⏰ *Horário:* ${appt.time}\n💇 *Serviço:* ${appt.serviceName}\n\nPor favor, confirme sua presença respondendo esta mensagem. Obrigado!`;
    sendWhatsAppMessage(appt.clientPhone, msg);
    
    setAppointments(prev => prev.map(a => a.id === appt.id ? { ...a, reminderSent: true } : a));
  };

  // Handlers de Criação
  const handleCreateAppointment = (e) => {
    e.preventDefault();
    const client = clients.find(c => c.id === newAppt.clientId);
    const service = services.find(s => s.id === newAppt.serviceId);

    if (!client || !service) return;

    const created = {
      id: Date.now().toString(),
      clientId: client.id,
      clientName: client.name,
      clientPhone: client.phone,
      serviceId: service.id,
      serviceName: service.name,
      date: newAppt.date,
      time: newAppt.time,
      duration: Number(service.duration),
      price: Number(service.price),
      status: 'PENDING',
      reminderSent: false
    };

    setAppointments([...appointments, created]);
    setIsApptModalOpen(false);
    
    // Pergunta se deseja enviar mensagem no WhatsApp
    if (confirm(`Agendamento criado! Deseja enviar a mensagem de confirmação para ${client.name} via WhatsApp agora?`)) {
      handleSendConfirmation(created);
    }
  };

  const handleCreateClient = (e) => {
    e.preventDefault();
    if (!newClient.name || !newClient.phone) return;

    const created = {
      id: Date.now().toString(),
      ...newClient
    };

    setClients([...clients, created]);
    setNewClient({ name: '', phone: '', email: '', notes: '' });
    setIsClientModalOpen(false);
  };

  const handleCreateService = (e) => {
    e.preventDefault();
    if (!newService.name || !newService.price) return;

    const created = {
      id: Date.now().toString(),
      name: newService.name,
      duration: Number(newService.duration),
      price: Number(newService.price)
    };

    setServices([...services, created]);
    setNewService({ name: '', duration: 30, price: 50 });
    setIsServiceModalOpen(false);
  };

  const updateApptStatus = (id, newStatus) => {
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: newStatus } : a));
  };

  const deleteAppointment = (id) => {
    if (confirm('Tem certeza que deseja cancelar este agendamento?')) {
      setAppointments(prev => prev.filter(a => a.id !== id));
    }
  };

  // Agendamentos Filtrados
  const filteredAppointments = appointments.filter(a => {
    const matchDate = a.date === selectedDate;
    const matchStatus = statusFilter === 'ALL' || a.status === statusFilter;
    return matchDate && matchStatus;
  });

  // Próximos Atendimentos para Lembrete (Amanhã)
  const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const tomorrowAppts = appointments.filter(a => a.date === tomorrowStr && a.status !== 'CANCELED');

  // Cálculos do Dashboard
  const todayStr = new Date().toISOString().split('T')[0];
  const todayAppts = appointments.filter(a => a.date === todayStr && a.status !== 'CANCELED');
  const todayRevenue = todayAppts.reduce((sum, a) => sum + (a.status === 'COMPLETED' ? a.price : 0), 0);
  const pendingReminders = tomorrowAppts.filter(a => !a.reminderSent).length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col md:flex-row font-sans">
      
      {/* SIDEBAR NAVEGAÇÃO */}
      <aside className="w-full md:w-64 bg-slate-900 text-slate-100 flex flex-col border-r border-slate-800">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-lg text-white">
              <Scissors className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight">AgendaPro</h1>
              <p className="text-xs text-slate-400">Hair & Estética</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          <button 
            onClick={() => setActiveTab('agenda')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition ${activeTab === 'agenda' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
          >
            <Calendar className="w-5 h-5" /> Agenda do Profissional
          </button>

          <button 
            onClick={() => setActiveTab('clients')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition ${activeTab === 'clients' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
          >
            <Users className="w-5 h-5" /> Cadastro de Clientes
          </button>

          <button 
            onClick={() => setActiveTab('services')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition ${activeTab === 'services' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
          >
            <Scissors className="w-5 h-5" /> Catálogo de Serviços
          </button>

          <button 
            onClick={() => setActiveTab('reminders')}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition ${activeTab === 'reminders' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
          >
            <div className="flex items-center gap-3">
              <MessageSquare className="w-5 h-5" /> Lembretes WhatsApp
            </div>
            {pendingReminders > 0 && (
              <span className="bg-emerald-500 text-slate-950 font-bold text-xs px-2 py-0.5 rounded-full">
                {pendingReminders}
              </span>
            )}
          </button>
        </nav>

        <div className="p-4 border-t border-slate-800 text-xs text-slate-500 text-center">
          AgendaPro Hair v1.0
        </div>
      </aside>

      {/* ÁREA PRINCIPAL */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        
        {/* CABEÇALHO / METRICAS */}
        <header className="bg-white border-b border-slate-200 p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center gap-4">
              <div className="p-3 bg-indigo-600 text-white rounded-lg">
                <CalendarCheck className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-medium text-indigo-600 uppercase tracking-wider">Atendimentos Hoje</p>
                <p className="text-2xl font-bold text-slate-800">{todayAppts.length}</p>
              </div>
            </div>

            <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-4">
              <div className="p-3 bg-emerald-600 text-white rounded-lg">
                <DollarSign className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-medium text-emerald-600 uppercase tracking-wider">Faturamento Concluído</p>
                <p className="text-2xl font-bold text-slate-800">R$ {todayRevenue.toFixed(2)}</p>
              </div>
            </div>

            <div className="p-4 bg-sky-50 border border-sky-100 rounded-xl flex items-center gap-4">
              <div className="p-3 bg-sky-600 text-white rounded-lg">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-medium text-sky-600 uppercase tracking-wider">Total de Clientes</p>
                <p className="text-2xl font-bold text-slate-800">{clients.length}</p>
              </div>
            </div>

            <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl flex items-center gap-4">
              <div className="p-3 bg-amber-600 text-white rounded-lg">
                <MessageSquare className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-medium text-amber-600 uppercase tracking-wider">Lembretes P/ Amanhã</p>
                <p className="text-2xl font-bold text-slate-800">{tomorrowAppts.length}</p>
              </div>
            </div>
          </div>
        </header>

        {/* CONTEÚDO DA ABA */}
        <div className="p-6 flex-1">

          {/* TAB 1: AGENDA DO PROFISSIONAL */}
          {activeTab === 'agenda' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-3">
                  <input 
                    type="date" 
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="border border-slate-300 rounded-lg px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-indigo-500"
                  />
                  <button 
                    onClick={() => setSelectedDate(todayStr)}
                    className="px-3 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg text-sm font-medium"
                  >
                    Hoje
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white"
                  >
                    <option value="ALL">Todos os Status</option>
                    <option value="PENDING">Pendentes</option>
                    <option value="CONFIRMED">Confirmados</option>
                    <option value="COMPLETED">Concluídos</option>
                    <option value="CANCELED">Cancelados</option>
                  </select>

                  <button 
                    onClick={() => setIsApptModalOpen(true)}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium shadow transition"
                  >
                    <Plus className="w-4 h-4" /> Novo Agendamento
                  </button>
                </div>
              </div>

              {/* LISTA DE AGENDAMENTOS */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50 font-medium text-slate-700 flex justify-between items-center">
                  <span>Horários Agendados para {selectedDate.split('-').reverse().join('/')}</span>
                  <span className="text-xs text-slate-500">{filteredAppointments.length} registro(s)</span>
                </div>

                {filteredAppointments.length === 0 ? (
                  <div className="p-12 text-center text-slate-400">
                    <Calendar className="w-12 h-12 mx-auto mb-3 opacity-40" />
                    <p className="font-medium">Nenhum agendamento encontrado para esta data.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {filteredAppointments.sort((a,b) => a.time.localeCompare(b.time)).map((appt) => (
                      <div key={appt.id} className="p-4 hover:bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4 transition">
                        
                        <div className="flex items-start gap-4">
                          <div className="bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-lg p-3 text-center min-w-[70px]">
                            <p className="text-lg font-bold leading-none">{appt.time}</p>
                            <p className="text-xs text-indigo-500 mt-1">{appt.duration} min</p>
                          </div>

                          <div>
                            <h3 className="font-semibold text-slate-900 text-base">{appt.clientName}</h3>
                            <p className="text-sm text-indigo-600 font-medium">{appt.serviceName} • R$ {appt.price.toFixed(2)}</p>
                            <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                              <Phone className="w-3 h-3" /> {appt.clientPhone}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 justify-end border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
                          {/* STATUS BADGE */}
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                            appt.status === 'CONFIRMED' ? 'bg-emerald-100 text-emerald-800' :
                            appt.status === 'COMPLETED' ? 'bg-blue-100 text-blue-800' :
                            appt.status === 'CANCELED' ? 'bg-rose-100 text-rose-800' :
                            'bg-amber-100 text-amber-800'
                          }`}>
                            {appt.status === 'CONFIRMED' && 'Confirmado'}
                            {appt.status === 'COMPLETED' && 'Concluído'}
                            {appt.status === 'CANCELED' && 'Cancelado'}
                            {appt.status === 'PENDING' && 'Pendente'}
                          </span>

                          {/* WHATSAPP CONFIRMAÇÃO */}
                          <button 
                            onClick={() => handleSendConfirmation(appt)}
                            title="Enviar confirmação pelo WhatsApp"
                            className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg border border-emerald-200 transition"
                          >
                            <Send className="w-4 h-4" />
                          </button>

                          {/* CONTROLES DE STATUS */}
                          <select 
                            value={appt.status}
                            onChange={(e) => updateApptStatus(appt.id, e.target.value)}
                            className="text-xs border border-slate-300 rounded-lg px-2 py-1.5 bg-white font-medium"
                          >
                            <option value="PENDING">Pendente</option>
                            <option value="CONFIRMED">Confirmar</option>
                            <option value="COMPLETED">Concluir</option>
                            <option value="CANCELED">Cancelar</option>
                          </select>

                          <button 
                            onClick={() => deleteAppointment(appt.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: CADASTRO DE CLIENTES */}
          {activeTab === 'clients' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="relative w-full sm:w-80">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input 
                    type="text"
                    placeholder="Buscar por nome ou telefone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                  />
                </div>

                <button 
                  onClick={() => setIsClientModalOpen(true)}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium shadow transition"
                >
                  <UserPlus className="w-4 h-4" /> Cadastrar Cliente
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {clients
                  .filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.phone.includes(searchTerm))
                  .map(client => (
                    <div key={client.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3 relative hover:border-indigo-200 transition">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-bold text-slate-900 text-base">{client.name}</h3>
                          <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                            <Phone className="w-3 h-3 text-emerald-600" /> {client.phone}
                          </p>
                        </div>

                        <button 
                          onClick={() => setSelectedClientHistory(client)}
                          className="text-xs bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 px-2.5 py-1 rounded-md font-medium border border-slate-200 transition"
                        >
                          Histórico
                        </button>
                      </div>

                      {client.email && (
                        <p className="text-xs text-slate-600 flex items-center gap-1">
                          <Mail className="w-3 h-3 text-slate-400" /> {client.email}
                        </p>
                      )}

                      {client.notes && (
                        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-xs text-slate-600">
                          <span className="font-semibold text-slate-700">Obs:</span> {client.notes}
                        </div>
                      )}

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                        <button 
                          onClick={() => sendWhatsAppMessage(client.phone, `Olá ${client.name}! Como podemos te ajudar hoje?`)}
                          className="text-xs text-emerald-600 font-semibold flex items-center gap-1 hover:underline"
                        >
                          <Send className="w-3 h-3" /> Conversar no WhatsApp
                        </button>

                        <button 
                          onClick={() => {
                            if(confirm(`Excluir o cadastro de ${client.name}?`)) {
                              setClients(clients.filter(c => c.id !== client.id));
                            }
                          }}
                          className="text-slate-400 hover:text-rose-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* TAB 3: CATÁLOGO DE SERVIÇOS */}
          {activeTab === 'services' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-bold text-slate-800">Serviços Oferecidos</h2>
                <button 
                  onClick={() => setIsServiceModalOpen(true)}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium shadow transition"
                >
                  <Plus className="w-4 h-4" /> Adicionar Serviço
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {services.map(srv => (
                  <div key={srv.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-slate-900">{srv.name}</h3>
                      <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                        <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {srv.duration} min</span>
                        <span className="font-semibold text-emerald-600 text-sm">R$ {srv.price.toFixed(2)}</span>
                      </div>
                    </div>

                    <button 
                      onClick={() => {
                        if(confirm(`Remover serviço ${srv.name}?`)) {
                          setServices(services.filter(s => s.id !== srv.id));
                        }
                      }}
                      className="text-slate-400 hover:text-rose-600 p-2"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: LEMBRETES DO DIA ANTERIOR (WHATSAPP) */}
          {activeTab === 'reminders' && (
            <div className="space-y-6">
              <div className="bg-amber-50 border border-amber-200 p-5 rounded-xl flex items-start gap-3">
                <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-amber-900">Lembretes de Véspera (Amanhã)</h3>
                  <p className="text-sm text-amber-700 mt-1">
                    Envie mensagens no WhatsApp dos clientes agendados para amanhã ({tomorrowStr.split('-').reverse().join('/')}) para diminuir faltas.
                  </p>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 font-medium text-slate-700 flex justify-between items-center">
                  <span>Agendamentos para Amanhã ({tomorrowAppts.length})</span>
                </div>

                {tomorrowAppts.length === 0 ? (
                  <div className="p-12 text-center text-slate-400">
                    <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-40" />
                    <p className="font-medium">Nenhum atendimento agendado para amanhã.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {tomorrowAppts.map((appt) => (
                      <div key={appt.id} className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900">{appt.time}</span>
                            <span className="text-slate-400">•</span>
                            <span className="font-semibold text-indigo-600">{appt.clientName}</span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">{appt.serviceName} ({appt.clientPhone})</p>
                        </div>

                        <div className="flex items-center gap-3">
                          {appt.reminderSent ? (
                            <span className="text-xs bg-emerald-100 text-emerald-800 font-semibold px-2.5 py-1 rounded-full flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Enviado
                            </span>
                          ) : (
                            <span className="text-xs bg-amber-100 text-amber-800 font-semibold px-2.5 py-1 rounded-full">
                              Pendente
                            </span>
                          )}

                          <button 
                            onClick={() => handleSendReminder(appt)}
                            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-2 rounded-lg transition"
                          >
                            <Send className="w-3.5 h-3.5" /> Enviar Lembrete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </main>

      {/* MODAL NOVO AGENDAMENTO */}
      {isApptModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Novo Agendamento</h2>
            <form onSubmit={handleCreateAppointment} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Cliente</label>
                <select 
                  required 
                  value={newAppt.clientId}
                  onChange={(e) => setNewAppt({ ...newAppt, clientId: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-sm bg-white"
                >
                  <option value="">Selecione um cliente...</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Serviço</label>
                <select 
                  required 
                  value={newAppt.serviceId}
                  onChange={(e) => setNewAppt({ ...newAppt, serviceId: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-sm bg-white"
                >
                  <option value="">Selecione um serviço...</option>
                  {services.map(s => (
                    <option key={s.id} value={s.id}>{s.name} - R$ {s.price.toFixed(2)} ({s.duration} min)</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Data</label>
                  <input 
                    type="date"
                    required
                    value={newAppt.date}
                    onChange={(e) => setNewAppt({ ...newAppt, date: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Horário</label>
                  <input 
                    type="time"
                    required
                    value={newAppt.time}
                    onChange={(e) => setNewAppt({ ...newAppt, time: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-sm"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setIsApptModalOpen(false)}
                  className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow"
                >
                  Confirmar Agendamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL NOVO CLIENTE */}
      {isClientModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Cadastrar Cliente</h2>
            <form onSubmit={handleCreateClient} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Nome Completo</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ex: Maria Oliveira"
                  value={newClient.name}
                  onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">WhatsApp / Telefone</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ex: 47999998888"
                  value={newClient.phone}
                  onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">E-mail (Opcional)</label>
                <input 
                  type="email" 
                  placeholder="cliente@email.com"
                  value={newClient.email}
                  onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Observações / Preferências</label>
                <textarea 
                  placeholder="Ex: Alergias, preferências de corte, etc."
                  value={newClient.notes}
                  onChange={(e) => setNewClient({ ...newClient, notes: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-sm h-20"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setIsClientModalOpen(false)}
                  className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow"
                >
                  Salvar Cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL NOVO SERVIÇO */}
      {isServiceModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Adicionar Serviço</h2>
            <form onSubmit={handleCreateService} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Nome do Serviço</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ex: Barba + Hidratação"
                  value={newService.name}
                  onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Duração (Minutos)</label>
                  <input 
                    type="number" 
                    required
                    step="5"
                    value={newService.duration}
                    onChange={(e) => setNewService({ ...newService, duration: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Preço (R$)</label>
                  <input 
                    type="number" 
                    required
                    step="0.01"
                    value={newService.price}
                    onChange={(e) => setNewService({ ...newService, price: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-sm"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setIsServiceModalOpen(false)}
                  className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow"
                >
                  Salvar Serviço
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL HISTÓRICO DO CLIENTE */}
      {selectedClientHistory && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-100">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-slate-900">Histórico de {selectedClientHistory.name}</h2>
              <button 
                onClick={() => setSelectedClientHistory(null)}
                className="text-slate-400 hover:text-slate-600 text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {appointments
                .filter(a => a.clientId === selectedClientHistory.id)
                .sort((a,b) => b.date.localeCompare(a.date))
                .map(appt => (
                  <div key={appt.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-slate-800">{appt.serviceName}</p>
                      <p className="text-xs text-slate-500">{appt.date.split('-').reverse().join('/')} às {appt.time}</p>
                    </div>
                    <span className="font-bold text-slate-700">R$ {appt.price.toFixed(2)}</span>
                  </div>
                ))}

              {appointments.filter(a => a.clientId === selectedClientHistory.id).length === 0 && (
                <p className="text-center text-slate-400 text-sm py-6">Nenhum atendimento registrado para este cliente ainda.</p>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
              <button 
                onClick={() => setSelectedClientHistory(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
