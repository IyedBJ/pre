import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

const ExtractionCardShell = ({
  icon: Icon,
  iconColorClass,
  title,
  subtitle,
  theme,
  isExpandedInitial = false,
  children
}) => {
  const [isExpanded, setIsExpanded] = useState(isExpandedInitial);
  
  return (
    <div className={`rounded-xl shadow-sm border transition-colors ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} overflow-hidden`}>
      <div 
        className={`flex justify-between items-center p-6 cursor-pointer ${theme === 'dark' ? 'hover:bg-gray-700/50' : 'hover:bg-slate-50'}`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div>
          <h3 className={`text-lg font-bold flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            {Icon && <Icon className={iconColorClass} size={20} />}
            {title}
          </h3>
          {subtitle && (
            <div className={`text-sm mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
              {subtitle}
            </div>
          )}
        </div>
        <div className="flex items-center gap-4">
           {isExpanded ? <ChevronDown size={24} className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} /> : <ChevronRight size={24} className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} />}
        </div>
      </div>

      {isExpanded && (
        <div className="p-6 pt-0 border-t border-gray-200 dark:border-gray-700 mt-4">
          {children}
        </div>
      )}
    </div>
  );
};

export default ExtractionCardShell;
