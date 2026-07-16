import React from 'react';
import { Database, FileText, Receipt, Upload } from 'lucide-react';
import ImportCard from './ImportCard';

const ImportSection = ({
  dolibarrImported,
  isDolibarrLoading,
  handleDolibarrSync,
  handleCancelDolibarr,
  payslipImported,
  isPayslipLoading,
  handlePayslipUpload,
  handleCancelPayslip,
  expensesImported,
  isExpensesLoading,
  handleExpensesUpload,
  handleCancelExpenses,
  kmsImported,
  isKmsLoading,
  handleKmsUpload,
  handleCancelKms
}) => {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-8 border-2 border-[#7ED957]/20 mb-8 transition-colors">
      <h2 className="text-2xl font-semibold text-black dark:text-white mb-2">
        Import automatique des données
      </h2>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        Récupérez automatiquement vos données depuis vos sources
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
        <ImportCard
          title="Connexion"
          description="Récupérer la facturation et le TJM"
          icon={Database}
          isImported={dolibarrImported}
          isLoading={isDolibarrLoading}
          onSync={handleDolibarrSync}
          onCancel={handleCancelDolibarr}
          syncLabel="Synchroniser"
          importedLabel="Synchronisé"
        />

        <ImportCard
          title="Fiche de paie PDF"
          description="Extraction auto (PDF)"
          icon={FileText}
          isImported={payslipImported}
          isLoading={isPayslipLoading}
          onUpload={handlePayslipUpload}
          onCancel={handleCancelPayslip}
          accept=".pdf,.zip"
          uploadId="payslip-upload"
          importedLabel="Analyse terminée"
        />

        <ImportCard
          title="Notes de frais"
          description="Extraction auto Excel"
          icon={Receipt}
          isImported={expensesImported}
          isLoading={isExpensesLoading}
          onUpload={handleExpensesUpload}
          onCancel={handleCancelExpenses}
          accept=".pdf,.xlsx,.xls"
          uploadId="expenses-upload"
          importedLabel="Frais détectés"
        />

        <ImportCard
          title="Frais kilométriques"
          description="Extraction auto depuis Excel"
          icon={Receipt}
          isImported={kmsImported}
          isLoading={isKmsLoading}
          onUpload={handleKmsUpload}
          onCancel={handleCancelKms}
          accept=".xlsx,.xls"
          uploadId="kms-upload"
          importedLabel="KMs détectés"
        />
      </div>
    </div>
  );
};

export default ImportSection;
