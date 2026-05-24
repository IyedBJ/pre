import React from 'react';
import { CheckCircle2, Eye } from 'lucide-react';
import { API_URL } from '../../api/axios';

const FacturationTableRow = ({ invoice, clientInfo, formatCurrency, formatDate, onOpenDetails }) => {

  // Détermine si la facture est payée ou non
  const isOutstanding = invoice.resteAPayer > 0;
  
  // Si l'avatar commence par /api, c'est un chemin relatif du serveur qui doit être préfixé par API_URL, sinon c'est une URL complète ou null. En cas d'erreur de chargement, on affiche un avatar généré avec le nom du client.
  const avatarUrl = clientInfo.avatar && clientInfo.avatar.startsWith('/api') 
    ? `${API_URL}${clientInfo.avatar}` 
    : clientInfo.avatar;

  return (
    <tr className="hover:bg-slate-50/50 dark:hover:bg-gray-800/50 transition-colors group">
      <td className="px-6 py-4 border-b border-slate-50 dark:border-gray-700">
        <span className="text-sm font-bold text-slate-900 dark:text-white">{invoice.référence}</span>
      </td>
      <td className="px-6 py-4 border-b border-slate-50 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg border border-slate-100 dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center justify-center overflow-hidden">
            <img 
              src={avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(invoice.nomClient)}&background=random&color=fff`} 
              alt=""
              className="w-10 h-10 object-contain"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(invoice.nomClient)}&background=random&color=fff`;
              }}
            />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-900 dark:text-white">{invoice.nomClient}</span>
              {invoice.actif === false && (
                <span className="px-1.5 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 rounded">Archivé</span>
              )}
            </div>
            <span className="text-xs font-mono font-bold text-slate-500 dark:text-gray-400 bg-slate-100 dark:bg-gray-700 px-2 py-0.5 rounded w-fit mt-1">
              {invoice.codeClient}
            </span>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 border-b border-slate-50 dark:border-gray-700">
        <span className="text-sm text-slate-500 dark:text-gray-400 font-medium">{formatDate(invoice.date)}</span>
      </td>
      <td className="px-6 py-4 text-right border-b border-slate-50 dark:border-gray-700">
        <span className="text-sm font-bold text-slate-900 dark:text-white">{formatCurrency(invoice.total_ht)}</span>
      </td>
      <td className="px-6 py-4 text-right border-b border-slate-50 dark:border-gray-700">
        {isOutstanding ? (
          <div className="flex flex-col items-end">
            <span className="text-sm font-bold text-rose-600">-{formatCurrency(invoice.resteAPayer)}</span>
            <span className="text-[10px] text-rose-400 font-medium">À régulariser</span>
          </div>
        ) : (
          <div className="flex items-center justify-end gap-1.5 text-emerald-600">
            <CheckCircle2 size={14} />
            <span className="text-sm font-bold">Payée</span>
          </div>
        )}
      </td>
      <td className="px-6 py-4 border-b border-slate-50 dark:border-gray-700">
        <div className="flex justify-center">
          <button 
            onClick={() => onOpenDetails(invoice)}
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

export default FacturationTableRow;
