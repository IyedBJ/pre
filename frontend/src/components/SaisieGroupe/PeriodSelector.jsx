import React from 'react';
import { Calendar } from 'lucide-react';

const PeriodSelector = ({ 
  selectedMonth, 
  setSelectedMonth, 
  selectedYear, 
  setSelectedYear, 
  years, 
  monthNames, 
  theme 
}) => {
  const selectClass = `px-4 py-2.5 rounded-xl border font-semibold focus:ring-2 focus:ring-[#7ED957] transition-all outline-none ${
    theme === 'dark' ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-800'
  }`;

  return (
    <div className={`flex flex-wrap items-center gap-4 mb-8 p-5 rounded-2xl border shadow-sm ${
      theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
    }`}>
      <div className="flex items-center gap-2">
        <Calendar size={20} className="text-[#7ED957]" />
        <span className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
          Période concernée :
        </span>
      </div>
      <select 
        value={selectedMonth} 
        onChange={e => setSelectedMonth(e.target.value)} 
        className={selectClass}
      >
        {Object.entries(monthNames).map(([v, l]) => (
          <option key={v} value={v}>{l}</option>
        ))}
      </select>
      <select 
        value={selectedYear} 
        onChange={e => setSelectedYear(e.target.value)} 
        className={selectClass}
      >
        {years.map(y => (
          <option key={y} value={y}>{y}</option>
        ))}
      </select>
      <span className={`ml-2 px-3 py-1 rounded-full text-sm font-bold ${
        theme === 'dark' ? 'bg-[#7ED957]/20 text-[#7ED957]' : 'bg-[#7ED957]/10 text-green-700'
      }`}>
        {monthNames[selectedMonth]} {selectedYear}
      </span>
    </div>
  );
};

export default PeriodSelector;
