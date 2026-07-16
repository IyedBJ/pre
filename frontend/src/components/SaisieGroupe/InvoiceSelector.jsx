import React from 'react';
import { Receipt } from 'lucide-react';

const InvoiceSelector = ({ 
  filteredInvoices, 
  selectedInvoiceIds, 
  toggleInvoiceSelection, 
  formatCurrency, 
  theme, 
  monthNames, 
  selectedMonth, 
  selectedYear 
}) => {
  return (
    <div className={`mb-8 p-6 rounded-2xl border shadow-sm ${
      theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
    }`}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <Receipt size={26} className="text-[#7ED957]" />
          <div>
            <h2 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Factures
            </h2>
            <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
              Sélectionnez les factures émises pendant la période choisie.
            </p>
          </div>
        </div>
        <div className={`text-sm font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
          {filteredInvoices.length === 0
            ? 'Aucune facture disponible pour cette période.'
            : `${filteredInvoices.length} facture(s) disponibles pour ${monthNames[selectedMonth]} ${selectedYear}`}
        </div>
      </div>

      {filteredInvoices.length > 0 && (
        <div className="grid grid-cols-1 gap-3 max-h-72 overflow-y-auto">
          {filteredInvoices.map(inv => {
            const isSelected = selectedInvoiceIds.includes(inv.id);
            const invDate = inv.date ? new Date(typeof inv.date === 'number' ? inv.date * 1000 : inv.date) : null;
            return (
              <label
                key={inv.id}
                className={`flex items-center gap-4 p-4 rounded-2xl border transition-colors cursor-pointer ${
                  theme === 'dark'
                    ? isSelected
                      ? 'border-[#7ED957]/60 bg-[#7ED957]/10'
                      : 'border-gray-700 bg-gray-900'
                    : isSelected
                      ? 'border-[#7ED957]/60 bg-[#7ED957]/10'
                      : 'border-gray-200 bg-white'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleInvoiceSelection(inv.id)}
                  className="w-4 h-4 rounded border-gray-300 text-[#7ED957] focus:ring-[#7ED957]"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-col gap-1">
                    <span className={`text-sm font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      {inv.référence} — {inv.nomClient}
                    </span>
                    <span className="text-xs text-slate-500">
                      {invDate ? invDate.toLocaleDateString('fr-FR') : 'Date inconnue'} · {formatCurrency(inv.total_ttc ?? inv.total_ht ?? 0)}
                    </span>
                  </div>
                </div>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default InvoiceSelector;
