import React from 'react';
import { Receipt, TrendingUp, Wallet, ListFilter } from 'lucide-react';
import StatCard from '../Shared/StatCard';

const FacturationStats = ({ totalHT, totalPaid, totalOutstanding, filteredCount, formatCurrency }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="Total Facturé"
        value={formatCurrency(totalHT)}
        subValue="HT"
        icon={Receipt}
        iconBgColor="bg-blue-50 dark:bg-blue-900/20"
        iconColor="text-blue-600 dark:text-blue-400"
      />
      <StatCard
        title="Certificat d'Encaissement"
        value={formatCurrency(totalPaid)}
        subValue="TTC"
        icon={TrendingUp}
        iconBgColor="bg-emerald-50 dark:bg-emerald-900/20"
        iconColor="text-emerald-600 dark:text-emerald-400"
      />
      <StatCard
        title="Impayés"
        value={`-${formatCurrency(totalOutstanding)}`}
        icon={Wallet}
        iconBgColor="bg-rose-50 dark:bg-rose-900/20"
        iconColor="text-rose-600 dark:text-rose-400"
        textColor="text-rose-600"
      />
      <StatCard
        title="Factures"
        value={filteredCount}
        subValue="documents"
        icon={ListFilter}
        iconBgColor="bg-amber-50 dark:bg-amber-900/20"
        iconColor="text-amber-600 dark:text-amber-400"
      />
    </div>
  );
};

export default FacturationStats;
