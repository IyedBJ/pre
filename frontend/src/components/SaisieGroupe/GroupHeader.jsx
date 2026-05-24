import React from 'react';
import { FileArchive } from 'lucide-react';

const GroupHeader = ({ theme }) => {
  return (
    <div className="mb-8">
      <h1 className={`text-3xl font-bold flex items-center gap-3 ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
        <FileArchive size={32} className="text-[#7ED957]" />
        Saisie multi-salariés pour une période donnée
      </h1>
      <p className={`mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
        Importation par lots · Identification automatique des salariés par IA
      </p>
    </div>
  );
};

export default GroupHeader;
