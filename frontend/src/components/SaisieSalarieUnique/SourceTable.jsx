import React from 'react';

const SourceTable = ({ results, formatCurrency, getTypeLabel, theme }) => {
  return (
    <div className={`mt-8 border-t pt-6 ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
      <h3 className={`text-sm font-semibold mb-3 uppercase tracking-wider ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
        Sources Extraites ({results.length})
      </h3>
      <div className={`overflow-hidden rounded-xl border shadow-sm ${theme === 'dark' ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'}`}>
        <table className="w-full text-left text-sm">
          <thead className={`uppercase text-xs font-bold ${theme === 'dark' ? 'bg-gray-800 text-gray-400' : 'bg-gray-50 text-gray-600'}`}>
            <tr>
              <th className="px-6 py-4">Fichier / Source</th>
              <th className="px-6 py-4">Type</th>
              <th className="px-6 py-4">Validation brute</th>
            </tr>
          </thead>
          <tbody className={`divide-y ${theme === 'dark' ? 'divide-gray-800' : 'divide-gray-100'}`}>
            {results.map((res, idx) => {
              const { label, color } = getTypeLabel(res.type);
              const amount = res.type === 'invoice' ? res.total : (res.net_paye ?? res.total ?? 0);
              return (
                <tr key={idx} className={`${theme === 'dark' ? 'hover:bg-gray-800/50' : 'hover:bg-gray-50/50'} transition-colors`}>
                  <td className={`px-6 py-3 font-medium truncate max-w-[200px] ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>
                    {res.filename || res.details || "—"}
                  </td>
                  <td className="px-6 py-3">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${color}`}>
                      {label}
                    </span>
                  </td>
                  <td className={`px-6 py-3 font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    {formatCurrency(amount)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SourceTable;
