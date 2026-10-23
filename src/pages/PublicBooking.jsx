import React from 'react';
import { Scissors, MapPin, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function PublicBooking({ 
  publicProProfile, publicServices, publicSuccess, setPublicSuccess, 
  clientName, setClientName, clientPhone, setClientPhone, 
  selectedService, setSelectedService, bookingDate, setBookingDate, 
  bookingTime, setBookingTime, publicFormaPagto, setPublicFormaPagto, 
  onSubmit 
}) {
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
            <p className="text-sm text-slate-600">No momento, o agendamento por link está desativado para este salão.</p>
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
          <form onSubmit={onSubmit} className="space-y-4">
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
