import React from 'react';
import { Scissors } from 'lucide-react';

export default function Header({ nomeSalao, logoUrl, corTopo }) {
  return (
    <div style={{ backgroundColor: corTopo }} className="text-white p-6 rounded-2xl shadow-lg mb-8 flex justify-between items-center">
      <div className="flex items-center gap-4">
        {logoUrl && <img src={logoUrl} alt="Logo" className="w-16 h-16 rounded-xl object-cover border-2 border-white/40 shadow-md" />}
        <div>
          <h2 className="text-2xl font-bold">{nomeSalao}</h2>
          <p className="text-xs text-white/80">Painel Administrativo do Salão</p>
        </div>
      </div>
    </div>
  );
}
