import React from 'react';
import { X, Upload, Loader2 } from 'lucide-react';

const ExtractionActions = ({ resetAll, startExtraction, isExtracting, theme }) => {
  return (
    <div className="flex gap-4 justify-center mb-12">
      <button
        onClick={resetAll}
        className={`flex items-center gap-2 px-8 py-3 font-semibold rounded-xl border transition-all shadow-sm ${
          theme === 'dark' 
            ? 'bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700' 
            : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
        }`}
        disabled={isExtracting}
      >
        <X size={20} />
        Tout réinitialiser
      </button>
      <button
        onClick={startExtraction}
        className={`flex items-center gap-2 px-10 py-3 bg-[#7ED957] text-black font-bold rounded-xl transition-all shadow-lg hover:bg-[#6FC847] hover:scale-105 active:scale-95 ${isExtracting ? 'opacity-50 cursor-not-allowed' : ''}`}
        disabled={isExtracting}
      >
        {isExtracting ? (
          <Loader2 size={22} className="animate-spin" />
        ) : (
          <Upload size={22} />
        )}
        {isExtracting ? 'Extraction en cours...' : 'Lancer l\'analyse Salarié'}
      </button>
    </div>
  );
};

export default ExtractionActions;
