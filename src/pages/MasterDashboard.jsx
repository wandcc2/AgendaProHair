import React, { useState } from 'react';
import { 
  Shield, Users, TrendingUp, LogOut, UserPlus, DollarSign, CreditCard, XCircle, Palette, AlertTriangle 
} from 'lucide-react';
import { supabase, supabaseAdmin } from '../services/supabaseClient';

export default function MasterDashboard({ userProfile, professionals, licencas, loadAppData, onLogout }) {
  const [activeTab, setActiveTab] = useState('master_profs'); // master_profs | master_financeiro | master_vencimentos
  const [expandedProId, setExpandedProId] = useState(null);

  // Modal Novo Salão
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
  const [tipoLicencaNovo, setTipoLicencaNovo] = useState('dias');
  const [diasAcesso, setDiasAcesso] = useState(30);
  const [dataEspecificaVenc, setDataEspecificaVenc] = useState('');
  const [planoValor, setPlanoValor] = useState('50.00');
  const [formaPagamento, setFormaPagamento] = useState('Pix');
  const [proModalError, setProModalError] = useState('');
  const [proModalSuccess, setProModalSuccess] = useState('');

  // Modal Editar Salão
  const [showEditProModal, setShowEditProModal] = useState(false);
  const [editingPro, setEditingPro] = useState(null);
  const [editTipoLicenca, setEditTipoLicenca] = useState('manter');
  const [editDiasAcesso, setEditDiasAcesso] = useState(30);
  const [editDataEspecifica, setEditDataEspecifica] = useState('');
  const [editValorLicenca, setEditValorLicenca] = useState('50.00');
  const [editFormaPagto, setEditFormaPagto] = useState('Pix');

  const totalVendasLicencas = licencas.reduce((acc, l) => acc + (parseFloat(l.valor) || 0), 0);

  // Filtrar licenças próximas de vencer (nos próximos 7 dias ou vencidas)
  const hoje = new Date();
  const licencasProximas = licencas.filter(l => {
    const dataVencStr = l.data_vencimento || l.vencimento;
    if (!dataVencStr) return false; // Vitalício
    const venc = new Date(dataVencStr);
    const diffDias = Math.ceil((venc - hoje) / (1000 * 60 * 60 * 24));
    return diffDias <= 7;
  });

  const handleOpenEditPro = (pro) => {
    const lic = licencas.find(l => l.profissional_id === pro.id);
    setEditingPro(pro);
    setEditTipoLicenca('manter');
    setEditDiasAcesso(30);
    setEditDataEspecifica('');
    setEditValorLicenca(lic?.valor || '50.00');
    setEditFormaPagto(lic?.forma_pagamento || 'Pix');
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
          const dt = new Date();
          dt.setDate(dt.getDate() + parseInt(editDiasAcesso));
          dataVenc = dt.toISOString().split('T')[0];
          planoNome = `${editDiasAcesso} Dias`;
        } else if (editTipoLicenca === 'data') {
          dataVenc = editDataEspecifica || null;
          planoNome = editDataEspecifica ? `Até ${editDataEspecifica.split('-').reverse().join('/')}` : 'Personalizado';
        }

        const payloadLic = {
          profissional_id: editingPro.id,
          plano: planoNome,
          valor: parseFloat(editValorLicenca || 0),
          forma_pagamento: editFormaPagto,
          data_pagamento: new Date().toISOString().split('T')[0],
          data_vencimento: dataVenc,
          vencimento: dataVenc,
          status: 'active'
        };

        const { error: licErr } = await supabase.from('licencas').insert([payloadLic]);
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
          phone: newProPhone,
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
          dataVenc = dataEspecificaVenc || null;
          planoNome = dataEspecificaVenc ? `Até ${dataEspecificaVenc.split('-').reverse().join('/')}` : 'Personalizado';
        }

        await supabase.from('licencas').insert([{
          profissional_id: authData.user.id,
          plano: planoNome,
          valor: parseFloat(planoValor || 0),
          forma_pagamento: formaPagamento,
          data_pagamento: new Date().toISOString().split('T')[0],
          data_vencimento: dataVenc,
          vencimento: dataVenc,
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

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col md:flex-row font-sans">
      <aside className="w-full md:w-64 bg-slate-950 text-slate-100 flex flex-col border-r border-slate-800">
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
          <button onClick={() => setActiveTab('master_vencimentos')} className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium ${activeTab === 'master_vencimentos' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
            <div className="flex items-center gap-3"><AlertTriangle className="w-5 h-5 text-amber-400" /> Próximos de Vencer</div>
            {licencasProximas.length > 0 && (
              <span className="bg-amber-500 text-slate-950 font-bold text-xs px-2 py-0.5 rounded-full">{licencasProximas.length}</span>
            )}
          </button>
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button onClick={onLogout} className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-rose-900/50 text-slate-300 hover:text-rose-200 py-2.5 rounded-lg text-sm transition">
            <LogOut className="w-4 h-4" /> Sair
          </button>
        </div>
      </aside>

      <main className="flex-1 p-8 overflow-y-auto bg-slate-900">
        {activeTab === 'master_profs' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white">Salões Cadastrados</h2>
                <p className="text-sm text-slate-400 mt-1">Gerencie logins, aparências e licenças ativas.</p>
              </div>
              <button onClick={() => setShowAddProModal(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg font-semibold text-sm flex items-center gap-2 shadow">
                <UserPlus className="w-4 h-4" /> Cadastrar Novo Salão
              </button>
            </div>

            <div className="bg-slate-950 rounded-xl border border-slate-800 p-6 shadow-sm space-y-3">
              {professionals.filter(p => p.role !== 'master').map(p => {
                const lic = licencas.find(l => l.profissional_id === p.id);
                const dataVencStr = lic?.data_vencimento || lic?.vencimento;

                return (
                  <div key={p.id} className="border border-slate-800 rounded-xl bg-slate-900 overflow-hidden transition">
                    <div className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div className="flex items-center gap-3">
                        {p.logo_url ? (
                          <img src={p.logo_url} alt="Logo" className="w-10 h-10 rounded-lg object-cover border border-slate-700" />
                        ) : (
                          <div style={{ backgroundColor: p.cor_primaria || '#4f46e5' }} className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold">
                            {p.nome?.substring(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <h4 className="font-bold text-white text-base">{p.nome}</h4>
                          <p className="text-xs text-slate-400">{p.email} • WhatsApp: {p.telefone || p.phone || 'N/I'}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-slate-300 bg-slate-800 border border-slate-700 px-3 py-1 rounded-full">
                          Vencimento: {dataVencStr ? dataVencStr.split('-').reverse().join('/') : 'Vitalício'}
                        </span>
                        <button onClick={() => handleOpenEditPro(p)} className="px-3 py-1.5 bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/30 font-bold rounded-lg text-xs border border-indigo-500/30">
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

        {activeTab === 'master_vencimentos' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white">Licenças Próximas do Vencimento</h2>
              <p className="text-sm text-slate-400 mt-1">Salões cujas licenças vencem nos próximos 7 dias ou já expiraram.</p>
            </div>

            <div className="bg-slate-950 rounded-xl border border-slate-800 p-6 space-y-3">
              {licencasProximas.length === 0 ? (
                <p className="text-slate-500 text-sm">Nenhuma licença próxima do vencimento no momento.</p>
              ) : (
                licencasProximas.map(l => {
                  const pro = professionals.find(p => p.id === l.profissional_id);
                  const dataVencStr = l.data_vencimento || l.vencimento;
                  return (
                    <div key={l.id} className="p-4 border border-amber-500/30 bg-amber-500/5 rounded-xl flex justify-between items-center">
                      <div>
                        <h4 className="font-bold text-white text-sm">{pro?.nome || 'Salão'}</h4>
                        <p className="text-xs text-slate-400">Plano: {l.plano} • Vencimento: <strong className="text-amber-400">{dataVencStr?.split('-').reverse().join('/')}</strong></p>
                      </div>
                      <button onClick={() => pro && handleOpenEditPro(pro)} className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-slate-950 font-bold rounded-lg text-xs">
                        Renovar Licença
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {activeTab === 'master_financeiro' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white">Gestão Financeira de Vendas de Licenças</h2>
              <p className="text-sm text-slate-400 mt-1">Acompanhe o faturamento obtido através das licenças dos salões.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-950 border border-slate-800 p-6 rounded-xl shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 font-bold uppercase block">Faturamento Total</span>
                  <span className="text-2xl font-extrabold text-emerald-400">R$ {totalVendasLicencas.toFixed(2)}</span>
                </div>
                <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl"><DollarSign className="w-6 h-6" /></div>
              </div>

              <div className="bg-slate-950 border border-slate-800 p-6 rounded-xl shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 font-bold uppercase block">Total de Contratos</span>
                  <span className="text-2xl font-extrabold text-indigo-400">{licencas.length}</span>
                </div>
                <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl"><CreditCard className="w-6 h-6" /></div>
              </div>

              <div className="bg-slate-950 border border-slate-800 p-6 rounded-xl shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 font-bold uppercase block">Salões Ativos</span>
                  <span className="text-2xl font-extrabold text-white">{professionals.filter(p => p.role !== 'master').length}</span>
                </div>
                <div className="p-3 bg-slate-800 text-slate-300 rounded-xl"><Users className="w-6 h-6" /></div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* MODAL EDITAR SALÃO */}
      {showEditProModal && editingPro && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto text-slate-100">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-lg">Editar Salão & Licença</h3>
              <button onClick={() => setShowEditProModal(false)}><XCircle className="w-5 h-5 text-slate-400" /></button>
            </div>

            <form onSubmit={handleSaveEditedPro} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Nome do Salão</label>
                <input type="text" required value={editingPro.nome} onChange={e => setEditingPro({ ...editingPro, nome: e.target.value })} className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2.5 text-sm" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">WhatsApp</label>
                  <input type="tel" value={editingPro.telefone || editingPro.phone || ''} onChange={e => setEditingPro({ ...editingPro, telefone: e.target.value, phone: e.target.value })} className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2.5 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Cor Principal</label>
                  <input type="color" value={editingPro.cor_primaria || '#4f46e5'} onChange={e => setEditingPro({ ...editingPro, cor_primaria: e.target.value })} className="w-full h-9 bg-slate-950 border border-slate-800 rounded-lg p-1 cursor-pointer" />
                </div>
              </div>

              <div className="border-t border-slate-800 pt-3 space-y-3">
                <h4 className="font-bold text-xs text-indigo-400">Alterar Período da Licença & Valores</h4>
                <select value={editTipoLicenca} onChange={e => setEditTipoLicenca(e.target.value)} className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2.5 text-sm font-medium">
                  <option value="manter">Manter Licença Atual</option>
                  <option value="dias">Adicionar Dias de Uso</option>
                  <option value="data">Definir Data Específica de Expiração</option>
                  <option value="vitalicio">Tornar Vitalício</option>
                </select>

                {editTipoLicenca === 'dias' && (
                  <input type="number" value={editDiasAcesso} onChange={e => setEditDiasAcesso(e.target.value)} className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2.5 text-sm" placeholder="Dias" />
                )}

                {editTipoLicenca === 'data' && (
                  <input type="date" value={editDataEspecifica} onChange={e => setEditDataEspecifica(e.target.value)} className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2.5 text-sm" />
                )}

                <div className="grid grid-cols-2 gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Valor Pago (R$)</label>
                    <input type="number" step="0.01" value={editValorLicenca} onChange={e => setEditValorLicenca(e.target.value)} className="w-full bg-slate-900 border border-slate-800 text-white rounded-lg p-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Forma de Pagamento</label>
                    <select value={editFormaPagto} onChange={e => setEditFormaPagto(e.target.value)} className="w-full bg-slate-900 border border-slate-800 text-white rounded-lg p-2 text-sm">
                      <option value="Pix">Pix</option>
                      <option value="Cartão de Crédito">Cartão de Crédito</option>
                      <option value="Dinheiro">Dinheiro</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button type="button" onClick={() => setShowEditProModal(false)} className="px-4 py-2 text-xs font-semibold text-slate-400 hover:bg-slate-800 rounded-lg">Cancelar</button>
                <button type="submit" className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow">Salvar Alterações</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CADASTRAR SALÃO */}
      {showAddProModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto text-slate-100">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-lg">Novo Salão com Personalização & Licença</h3>
              <button onClick={() => setShowAddProModal(false)}><XCircle className="w-5 h-5 text-slate-400" /></button>
            </div>

            {proModalError && <div className="p-3 bg-rose-500/20 text-rose-300 text-xs rounded-lg border border-rose-500/30">{proModalError}</div>}
            {proModalSuccess && <div className="p-3 bg-emerald-500/20 text-emerald-300 text-xs rounded-lg border border-emerald-500/30">{proModalSuccess}</div>}

            <form onSubmit={handleCreateProfessional} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Nome do Salão</label>
                  <input type="text" required value={newProName} onChange={e => setNewProName(e.target.value)} className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2.5 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">E-mail</label>
                  <input type="email" required value={newProEmail} onChange={e => setNewProEmail(e.target.value)} className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2.5 text-sm" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">WhatsApp</label>
                  <input type="tel" required value={newProPhone} onChange={e => setNewProPhone(e.target.value)} className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2.5 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Senha</label>
                  <input type="password" required value={newProPassword} onChange={e => setNewProPassword(e.target.value)} className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2.5 text-sm" />
                </div>
              </div>

              <div className="border-t border-slate-800 pt-3 space-y-3">
                <h4 className="font-bold text-xs text-indigo-400 flex items-center gap-1"><Palette className="w-4 h-4" /> Personalização Visual</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">URL da Foto / Logo</label>
                    <input type="text" value={newProLogo} onChange={e => setNewProLogo(e.target.value)} placeholder="https://..." className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Cor Principal</label>
                    <input type="color" value={newProCor} onChange={e => setNewProCor(e.target.value)} className="w-full h-9 bg-slate-950 border border-slate-800 rounded-lg p-1 cursor-pointer" />
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-800 pt-3 space-y-3">
                <h4 className="font-bold text-xs text-indigo-400 flex items-center gap-1"><CreditCard className="w-4 h-4" /> Licença & Período de Uso</h4>
                <select value={tipoLicencaNovo} onChange={e => setTipoLicencaNovo(e.target.value)} className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2.5 text-sm font-medium">
                  <option value="dias">Quantidade de Dias (Ex: 30 dias)</option>
                  <option value="data">Data Específica de Expiração</option>
                  <option value="vitalicio">Acesso Vitalício</option>
                </select>

                {tipoLicencaNovo === 'dias' && (
                  <input type="number" required value={diasAcesso} onChange={e => setDiasAcesso(e.target.value)} placeholder="30" className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2.5 text-sm" />
                )}

                {tipoLicencaNovo === 'data' && (
                  <input type="date" required value={dataEspecificaVenc} onChange={e => setDataEspecificaVenc(e.target.value)} className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2.5 text-sm" />
                )}

                <div className="grid grid-cols-2 gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Valor Pago (R$)</label>
                    <input type="number" step="0.01" value={planoValor} onChange={e => setPlanoValor(e.target.value)} className="w-full bg-slate-900 border border-slate-800 text-white rounded-lg p-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Pagamento</label>
                    <select value={formaPagamento} onChange={e => setFormaPagamento(e.target.value)} className="w-full bg-slate-900 border border-slate-800 text-white rounded-lg p-2 text-sm">
                      <option value="Pix">Pix</option>
                      <option value="Cartão de Crédito">Cartão de Crédito</option>
                      <option value="Dinheiro">Dinheiro</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button type="button" onClick={() => setShowAddProModal(false)} className="px-4 py-2 text-xs font-semibold text-slate-400 hover:bg-slate-800 rounded-lg">Cancelar</button>
                <button type="submit" className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow">Cadastrar Salão</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
