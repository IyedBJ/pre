import React from 'react';
import { CheckCircle2, Loader2, X } from 'lucide-react';

const UploadCard = ({ title, description, file, onFileSelect, id, icon, theme, accept = ".zip", buttonText = "Sélectionner ZIP", isLoading = false, onCancel }) => (
  <div className={`relative p-6 rounded-2xl border-2 border-dashed transition-all duration-300 group
    ${file 
      ? (theme === 'dark' ? 'border-[#7ED957] bg-green-900/20' : 'border-[#7ED957] bg-green-50/30') 
      : (theme === 'dark' ? 'border-gray-700 hover:border-[#7ED957]' : 'border-gray-200 hover:border-[#7ED957]')} 
    ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
    <div className="flex flex-col items-center text-center gap-4">
      <div className={`p-4 rounded-full transition-transform duration-500 
        ${file ? 'bg-[#7ED957] text-white scale-110 shadow-lg' : (theme === 'dark' ? 'bg-gray-700 text-gray-500' : 'bg-gray-100 text-gray-400') + ' group-hover:scale-110'}`}>
        {isLoading ? (
          <Loader2 size={32} className="animate-spin text-[#7ED957]" />
        ) : (
          file ? <CheckCircle2 size={32} /> : icon
        )}
      </div>
      <div>
        <h3 className={`text-lg font-bold mb-1 ${theme === 'dark' ? 'text-white' : 'text-black'}`}>{title}</h3>
        <p className={`text-sm line-clamp-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>{description}</p>
      </div>
      
      {file ? (
        <div className="w-full flex flex-col gap-3">
          <p className="text-xs font-medium text-[#7ED957] bg-[#7ED957]/10 py-2 px-3 rounded-lg truncate">
            {file.name}
          </p>
          {!isLoading && onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className={`flex items-center justify-center gap-2 py-2 px-4 text-xs font-semibold rounded-lg border transition-all ${
                theme === 'dark'
                  ? 'bg-red-900/20 text-red-400 border-red-900/50 hover:bg-red-900/30'
                  : 'bg-red-50 text-red-600 border-red-100 hover:bg-red-100'
              }`}
            >
              <X size={14} />
              Annuler l'import
            </button>
          )}
        </div>
      ) : (
        <div className="w-full">
          <input
            type="file"
            accept={accept}
            onChange={onFileSelect}
            className="hidden"
            id={id}
            disabled={isLoading}
          />
          <label
            htmlFor={id}
            className={`cursor-pointer block w-full py-2 px-4 text-sm font-semibold rounded-lg border transition-all text-center ${
              theme === 'dark' 
                ? 'bg-gray-700 text-white border-gray-600 hover:bg-gray-600' 
                : 'bg-gray-50 text-black border-gray-200 hover:bg-white hover:shadow-md'
            } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isLoading ? 'Extraction...' : buttonText}
          </label>
        </div>
      )}
    </div>
  </div>
);

export default UploadCard;
