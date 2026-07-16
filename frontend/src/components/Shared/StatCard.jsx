import React from 'react';

// eslint-disable-next-line no-unused-vars
const StatCard = ({ title, value, subValue, icon: IconComponent, iconBgColor, iconColor, textColor = "text-slate-900" }) => {
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-slate-200 dark:border-gray-700 shadow-sm flex flex-col gap-4 transition-colors">
      <div className="flex items-center justify-between">
        <span className="text-slate-500 dark:text-gray-400 text-sm font-medium uppercase tracking-wider">{title}</span>
        <div className={`p-2 ${iconBgColor} rounded-lg ${iconColor}`}>
          <IconComponent className="w-5 h-5" />
        </div>
      </div>
      <div className="flex items-baseline gap-2">
        <span className={`text-3xl font-bold ${textColor} dark:text-white`}>{value}</span>
        {subValue && <span className="text-slate-400 dark:text-gray-500 text-xs font-medium">{subValue}</span>}
      </div>
    </div>
  );
};

export default StatCard;
// une carte statistique