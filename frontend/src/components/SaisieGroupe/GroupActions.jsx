import React from 'react';
import { X, Loader2, Upload } from 'lucide-react';

const GroupActions = ({ 
  resetAll, 
  startExtraction, 
  isExtracting, 
  extractionStep, 
  isReadOnly, 
  theme 
}) => {
  if (isReadOnly) return null;

  return (
    <div className="flex gap-4 justify-center mb-10">
      <button 
        onClick={resetAll} 
        className={`flex items-center gap-2 px-8 py-3 font-semibold rounded-xl border transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed ${
          theme === 'dark' 
            ? 'bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700' 
            : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
        }`}
      >
        <X size={20} /> Tout annuler
      </button>
      <button 
        onClick={startExtraction} 
        disabled={isExtracting}
        className="flex items-center gap-2 px-10 py-3 bg-[#7ED957] text-black font-bold rounded-xl transition-all shadow-lg hover:bg-[#6FC847] hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
      >
        {isExtracting ? (
          <>
            <Loader2 size={22} className="animate-spin" />
            {extractionStep || 'Extraction en cours...'}
          </>
        ) : (
          <>
            <Upload size={22} />
            Lancer l'extraction groupée
          </>
        )}
      </button>
    </div>
  );
};

export default GroupActions;
