import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

const EditableRow = ({ 
  title, 
  subtitle, 
  amount, 
  iconColor, 
  textColor, 
  isExpanded, 
  onToggle, 
  theme, 
  children 
}) => {
  return (
    <div className={`rounded-xl border shadow-sm overflow-hidden transition-all ${
      theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
    }`}>
      <div 
        className={`flex items-center justify-between p-4 cursor-pointer ${
          theme === 'dark' ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50'
        }`}
        onClick={onToggle}
      >
        <div className="flex items-center gap-3">
          <div className={`w-1.5 h-10 rounded-full ${iconColor}`}></div>
          <div>
            <h3 className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{title}</h3>
            <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>{subtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className={`font-bold text-lg ${textColor}`}>{amount}</span>
          <button type="button" className={`p-2 rounded-lg transition-colors ${
            theme === 'dark' ? 'text-gray-500 hover:text-white hover:bg-gray-700' : 'text-gray-400 hover:bg-gray-50'
          }`}>
            {isExpanded ? <TrendingUp size={20} className="rotate-180" /> : <TrendingDown size={20} />}
          </button>
        </div>
      </div>
      
      {isExpanded && (
        <div className={`p-6 border-t ${
          theme === 'dark' ? 'border-gray-700 bg-gray-900/40' : 'border-gray-100 bg-gray-50/50'
        }`}>
          {children}
        </div>
      )}
    </div>
  );
};

export default EditableRow;
