import React from 'react';
import { CheckCircle2, X, Loader2 } from 'lucide-react';

const ImportCard = ({ 
  title, 
  description, 
  
// eslint-disable-next-line no-unused-vars
  icon: IconComponent, 
  isImported, 
  isLoading, 
  onSync, 
  onCancel, 
  onUpload,
  accept = ".pdf",
  uploadId,
  syncLabel = "Synchroniser",
  importedLabel = "Importé"
}) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col items-center text-center transition-colors">
      <div className="p-3 bg-[#7ED957]/10 rounded-full mb-4">
        <IconComponent className="text-[#7ED957]" size={28} />
      </div>
      <h3 className="font-semibold text-black dark:text-white mb-2">{title}</h3>
      <p className="text-xs text-gray-600 dark:text-gray-400 mb-6 flex-1">
        {description}
      </p>
      
      <div className="w-full mt-auto">
        {isImported ? (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-center gap-2 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-3 py-2 rounded-lg w-full">
              <CheckCircle2 size={18} />
              <span className="font-medium text-xs">{importedLabel}</span>
            </div>
            <button
              type="button"
              onClick={onCancel}
              className="flex items-center justify-center gap-2 px-3 py-2 text-red-600 border border-red-200 dark:border-red-900/50 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors text-xs font-medium w-full"
            >
              <X size={14} />
              Annuler
            </button>
          </div>
        ) : (
          <>
            {onSync ? (
              <button
                type="button"
                onClick={onSync}
                disabled={isLoading}
                className={`flex items-center justify-center gap-2 px-3 py-4 w-full bg-[#7ED957] text-black font-semibold rounded-lg transition-colors text-xs ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#6FC847]'}`}
              >
                {isLoading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <IconComponent size={16} />
                )}
                {isLoading ? 'Sync...' : syncLabel}
              </button>
            ) : (
              <div className={`border-2 border-dashed ${isLoading ? 'border-[#7ED957] bg-[#7ED957]/5' : 'border-gray-300 dark:border-gray-600'} rounded-lg p-2 text-center hover:border-[#7ED957] transition-colors h-[50px] flex flex-col justify-center`}>
                <input
                  type="file"
                  accept={accept}
                  onChange={onUpload}
                  className="hidden"
                  id={uploadId}
                  disabled={isLoading}
                />
                <label
                  htmlFor={uploadId}
                  className={`flex items-center justify-center gap-2 ${isLoading ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}
                >
                  {isLoading ? (
                    <Loader2 className="text-[#7ED957] animate-spin" size={18} />
                  ) : (
                    <div className="flex items-center gap-2">
                       <IconComponent className="text-gray-400" size={18} />
                    </div>
                  )}
                  <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                    {isLoading ? 'Extraction...' : 'Importer'}
                  </span>
                </label>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ImportCard;
