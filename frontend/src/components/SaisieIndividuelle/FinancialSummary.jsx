import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import SummaryCard from './SummaryCard';

const FinancialSummary = ({
  formatCurrency,
  totalPercu,
  rentabilite,
  pourcentageRentabilite
}) => {
  return (
    <div className="bg-gradient-to-br from-[#7ED957]/10 to-[#7ED957]/5 dark:from-[#7ED957]/20 dark:to-[#7ED957]/10 rounded-xl shadow-lg p-8 border-2 border-[#7ED957]/30 mb-8 transition-colors">
      <div className="flex items-center gap-3 mb-6">
        {rentabilite >= 0 ? (
          <TrendingUp className="text-green-600 dark:text-green-400" size={28} />
        ) : (
          <TrendingDown className="text-red-600 dark:text-red-400" size={28} />
        )}
        <h2 className="text-2xl font-semibold text-black dark:text-white">Calcul automatique</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <SummaryCard 
          title="Total perçu" 
          value={formatCurrency(totalPercu)} 
        />
        <SummaryCard 
          title="Rentabilité" 
          value={formatCurrency(rentabilite)} 
          isPositive={rentabilite >= 0} 
          isRentability={true}
        />
        <SummaryCard 
          title="Marge %" 
          value={`${pourcentageRentabilite.toFixed(2)} %`} 
          isPositive={rentabilite >= 0} 
          isRentability={true}
        />
      </div>
    </div>
  );
};

export default FinancialSummary;
