import React from 'react';
import { CheckCircle2, Eye } from 'lucide-react';
import { API_URL } from '../../api/axios';

const ClientTableRow = ({ client, formatCurrency, onOpenDetails }) => {
  const isOutstanding = (client.montantRestant || 0) > 0;
  
  // Si l'avatar commence par /api, c'est un chemin relatif du serveur
  const avatarUrl = client.avatar && client.avatar.startsWith('/api') 
    ? `${API_URL}${client.avatar}` 
    : client.avatar;

  return (
    <tr className="hover:bg-slate-50/50 dark:hover:bg-gray-800/50 transition-colors group">
      <td className="px-6 py-4 border-b border-slate-50 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg border border-slate-100 dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center justify-center overflow-hidden">
            <img 
              src={avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(client.nom)}&background=random&color=fff`} 
              alt=""
              className="w-10 h-10 object-contain"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(client.nom)}&background=random&color=fff`;
              }}
            />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-900 dark:text-white">{client.nom}</span>
              {client.actif === false && (
                <span className="px-1.5 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 rounded">Archivé</span>
              )}
            </div>
            <span className="text-[11px] text-slate-400 dark:text-gray-500 truncate max-w-[150px]">{client.email}</span>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 text-right border-b border-slate-50 dark:border-gray-700">
        <span className="text-sm font-medium text-slate-600 dark:text-gray-400">{client.nombreFactures || 0}</span>
      </td>
      <td className="px-6 py-4 text-right border-b border-slate-50 dark:border-gray-700">
        <span className="text-sm font-bold text-slate-900 dark:text-white">{formatCurrency(client.totalCaHt)}</span>
      </td>
      <td className="px-6 py-4 text-right border-b border-slate-50 dark:border-gray-700">
        {isOutstanding ? (
          <div className="flex flex-col items-end">
            <span className="text-sm font-bold text-rose-600">-{formatCurrency(client.montantRestant)}</span>
            <span className="text-[10px] text-rose-400 font-medium">À régulariser</span>
          </div>
        ) : (
          <div className="flex items-center justify-end gap-1.5 text-emerald-600">
            <CheckCircle2 size={14} />
            <span className="text-sm font-bold">Payé</span>
          </div>
        )}
      </td>
      <td className="px-6 py-4 border-b border-slate-50 dark:border-gray-700">
        <div className="flex justify-center">
          <button 
            onClick={() => onOpenDetails(client)}
            className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-all"
            title="Voir les détails"
          >
            <Eye className="w-5 h-5" />
          </button>
        </div>
      </td>
    </tr>
  );
};

export default ClientTableRow;
