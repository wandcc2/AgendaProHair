import React from 'react';
import { XCircle } from 'lucide-react';

export default function ColorModal({ show, onClose, customTopoCor, setCustomTopoCor, customSidebarCor, setCustomSidebarCor, onSave }) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border space-y-4">
        <div className="flex justify-between items-center border-b pb-3">
          <h3 className="font-bold text-slate-900 text-lg">Personalizar Cores do Salão</h3>
          <button onClick={onClose}><XCircle className="w-5 h-5 text-slate-400" /></button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Cor do Topo / Destaques</label>
            <input type="color" value={customTopoCor} onChange={e => setCustomTopoCor(e.target.value)} className="w-full h-10 border rounded-lg p-1 cursor-pointer" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Cor do Menu Lateral (Sidebar)</label>
            <input type="color" value={customSidebarCor} onChange={e => setCustomSidebarCor(e.target.value)} className="w-full h-10 border rounded-lg p-1 cursor-pointer" />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t">
          <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg">Cancelar</button>
          <button type="button" onClick={onSave} className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow">Salvar Cores</button>
        </div>
      </div>
    </div>
  );
}
