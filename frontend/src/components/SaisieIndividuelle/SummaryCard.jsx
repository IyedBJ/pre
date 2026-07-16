import React from 'react';
const SummaryCard = ({ title, value, isPositive, isRentability }) => {
  const borderColor = isRentability ? (isPositive ? 'border-green-500' : 'border-red-500') : 'border-gray-200 dark:border-gray-700';
  const textColor = isRentability ? (isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400') : 'text-black dark:text-white';

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl border-2 ${borderColor} transition-all transform hover:scale-[1.02]`}>
      <p className="text-sm uppercase tracking-widest font-bold text-gray-500 dark:text-gray-400 mb-4">{title}</p>
      <p className={`text-2xl font-black ${textColor}`}>
        {value}
      </p>
    </div>
  );
};

export default SummaryCard;
