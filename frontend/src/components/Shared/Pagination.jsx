import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Hash } from 'lucide-react';

//onPageChange : fonction pour changer de page
//texte optionnel pour remplacer « éléments » (ex: « projets », « factures »)

export default function Pagination({ currentPage, totalPages, onPageChange, totalItems, itemsPerPage, label }) {
  //valeur saisie dans le champ « Aller à page »
  const [jumpValue, setJumpValue] = useState('');

  if (totalPages <= 1) {
    return (
      <div className="bg-slate-50/50 dark:bg-black px-6 py-4 border-t border-slate-100 dark:border-gray-800 flex items-center justify-between transition-colors">
        <span className="text-xs font-medium text-slate-500 dark:text-gray-400">
          Affichage de <span className="text-slate-900 dark:text-gray-100">{totalItems === 0 ? 0 : 1}</span> à <span className="text-slate-900 dark:text-gray-100">{totalItems}</span> sur <span className="text-slate-900 dark:text-gray-100">{totalItems}</span> {label || 'éléments'}
        </span>
      </div>
    );
  }

  const handleJump = (e) => {
    e.preventDefault();
    const page = parseInt(jumpValue);
    if (!isNaN(page) && page >= 1 && page <= totalPages) {
      onPageChange(page);
    }
    setJumpValue('');
  };


  //construction de la liste des numéros à afficher
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');
      const start = Math.max(2, currentPage - (currentPage > totalPages - 2 ? 2 : 1));
      const end = Math.min(totalPages - 1, currentPage + (currentPage < 3 ? 2 : 1));
      for (let i = start; i <= end; i++) {
        if (!pages.includes(i)) pages.push(i);
      }
      if (currentPage < totalPages - 2) pages.push('...');
      if (!pages.includes(totalPages)) pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="bg-slate-50/50 dark:bg-black px-6 py-4 border-t border-slate-100 dark:border-gray-800 flex flex-col lg:flex-row items-center justify-between gap-6 transition-colors">
      {/* Partie gauche */}
      <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
        <span className="text-xs font-medium text-slate-500 dark:text-gray-400">
          Affichage de <span className="text-slate-900 dark:text-gray-100">{(currentPage - 1) * itemsPerPage + 1}</span> à <span className="text-slate-900 dark:text-gray-100">{Math.min(currentPage * itemsPerPage, totalItems)}</span> sur <span className="text-slate-900 dark:text-gray-100">{totalItems}</span> {label || 'éléments'}
        </span>

        {totalPages > 3 && (
          <form onSubmit={handleJump} className="flex items-center gap-2">
            <div className="relative group">
              <Hash size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#7ED957] transition-colors" />
              <input
                type="number"
                min="1"
                max={totalPages}
                value={jumpValue}
                onChange={(e) => setJumpValue(e.target.value)}
                placeholder="Aller à..."
                className="w-24 pl-8 pr-2 py-1.5 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-lg text-xs font-bold outline-none focus:ring-2 focus:ring-[#7ED957] focus:border-transparent transition-all placeholder:font-medium placeholder:text-slate-400"
              />
            </div>
            <button
              type="submit"
              className="px-3 py-1.5 bg-[#7ED957] text-slate-900 text-[10px] font-black uppercase tracking-wider rounded-lg hover:shadow-lg hover:shadow-[#7ED957]/20 transition-all active:scale-95"
            >
              Aller
            </button>
          </form>
        )}
      </div>
      {/* Partie droite */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
          disabled={currentPage === 1}
          className="p-2 text-slate-500 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-800 border border-transparent hover:border-slate-200 dark:hover:border-gray-700 rounded-xl disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-1">
          {getPageNumbers().map((page, index) => (
            page === '...' ? (
              <span key={`ellipsis-${index}`} className="px-2 text-slate-400 font-bold select-none">...</span>
            ) : (
              <button
                key={page}
                onClick={() => onPageChange(page)}
                className={`min-w-[40px] h-10 rounded-xl text-sm font-bold transition-all border ${
                  currentPage === page
                  ? 'bg-[#7ED957] text-slate-900 border-[#7ED957] shadow-md shadow-[#7ED957]/10'
                  : 'text-slate-500 dark:text-gray-400 bg-transparent border-transparent hover:bg-white dark:hover:bg-gray-800 hover:border-slate-200 dark:hover:border-gray-700'
                }`}
              >
                {page}
              </button>
            )
          ))}
        </div>

        <button
          onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
          disabled={currentPage === totalPages}
          className="p-2 text-slate-500 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-800 border border-transparent hover:border-slate-200 dark:hover:border-gray-700 rounded-xl disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
