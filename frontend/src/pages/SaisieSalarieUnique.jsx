import { useState, useEffect, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { 
  FileArchive, 
  FileText,
  Database,
  Receipt
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import api from '../api/axios';
import toast, { Toaster } from 'react-hot-toast';

import SalarieHeader from '../components/SaisieSalarieUnique/SalarieHeader';
import UploadCard from '../components/SaisieSalarieUnique/UploadCard';
import ExtractionActions from '../components/SaisieSalarieUnique/ExtractionActions';
import UnifiedResultCard from '../components/SaisieSalarieUnique/UnifiedResultCard';
import { useAuth } from '../context/AuthContext';

const SaisieSalarieUnique = () => {
  const { user } = useAuth();
  const isReadOnly = user?.role === 'finance';
  const { theme } = useTheme();
  const { employees } = useData();
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  
  const [zipFiles, setZipFiles] = useState({
    payslips: null,
    expenses: null,
    mileage: null
  });

  const [loadingCard, setLoadingCard] = useState({
    payslips: false,
    expenses: false,
    mileage: false
  });

  const [extractionStatus, setExtractionStatus] = useState({
    isExtracting: false,
    results: []
  });

  const handleFileChange = (type, e) => {
    const file = e.target.files?.[0];
    if (file) {
      setZipFiles(prev => ({ ...prev, [type]: file }));
    }
  };

  const handleCancelFile = (type) => {
    setZipFiles(prev => ({ ...prev, [type]: null }));
  };

  const startExtraction = async () => {
    if (!zipFiles.payslips && !zipFiles.expenses && !zipFiles.mileage) {
      toast.error('Veuillez uploader au moins un fichier');
      return;
    }

    setExtractionStatus(prev => ({ ...prev, isExtracting: true, results: [] }));
    
    const empName = employees.find(e => String(e.id) === String(selectedEmployeeId))?.nom || 'Inconnu';

    const extractionTasks = [];

    // 1. Payslips
    if (zipFiles.payslips) {
      extractionTasks.push((async () => {
        setLoadingCard(prev => ({ ...prev, payslips: true }));
        try {
          const payslipsData = new FormData();
          payslipsData.append('file', zipFiles.payslips);
          payslipsData.append('employeeName', empName);
          const res = await api.post("/upload-zip", payslipsData);
          return Array.isArray(res.data) ? res.data.map(item => ({ ...item, type: 'payslips' })) : [];
        } catch (error) {
          console.error("Payslip extraction error:", error);
          toast.error("Erreur lors de l'extraction des fiches de paie");
          return [];
        } finally {
          setLoadingCard(prev => ({ ...prev, payslips: false }));
        }
      })());
    }

    // 2. Expenses
    if (zipFiles.expenses) {
      extractionTasks.push((async () => {
        setLoadingCard(prev => ({ ...prev, expenses: true }));
        try {
          const expensesData = new FormData();
          expensesData.append('file', zipFiles.expenses);
          expensesData.append('employeeName', empName);
          const res = await api.post("/upload-zip", expensesData);
          return Array.isArray(res.data) ? res.data.map(item => ({ ...item, type: 'expenses' })) : [];
        } catch (error) {
          console.error("Expenses extraction error:", error);
          toast.error("Erreur lors de l'extraction des notes de frais");
          return [];
        } finally {
          setLoadingCard(prev => ({ ...prev, expenses: false }));
        }
      })());
    }

    // 3. Mileage
    if (zipFiles.mileage) {
      extractionTasks.push((async () => {
        setLoadingCard(prev => ({ ...prev, mileage: true }));
        try {
          const mileageData = new FormData();
          mileageData.append('file', zipFiles.mileage);
          mileageData.append('employeeName', empName);
          const res = await api.post("/upload-zip", mileageData);
          return Array.isArray(res.data) ? res.data.map(item => ({ ...item, type: 'mileage' })) : [];
        } catch (error) {
          console.error("Mileage extraction error:", error);
          toast.error("Erreur lors de l'extraction des frais kilométriques");
          return [];
        } finally {
          setLoadingCard(prev => ({ ...prev, mileage: false }));
        }
      })());
    }

    try {
      const taskResults = await Promise.all(extractionTasks);
      const allResults = taskResults.flat();
      
      setExtractionStatus({
        isExtracting: false,
        results: allResults
      });
      toast.success('Traitement terminé !');
    } catch (err) {
      console.error("Global extraction error:", err);
      toast.error('Échec du traitement global');
      setExtractionStatus(prev => ({ ...prev, isExtracting: false }));
    }
  };

  const groupedResults = useMemo(() => {
    return extractionStatus.results.reduce((acc, current) => {
      const group = current.date_group || 'Unknown';
      if (!acc[group]) {
        acc[group] = [];
      }
      acc[group].push(current);
      return acc;
    }, {});
  }, [extractionStatus.results]);

  const resetAll = () => {
    setSelectedEmployeeId('');
    setZipFiles({
      payslips: null,
      expenses: null,
      mileage: null
    });
    setExtractionStatus({
      isExtracting: false,
      results: []
    });
    toast.success('Le formulaire a été entièrement réinitialisé');
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(value || 0);
  };

  const monthNames = {
    "01": "Janvier", "02": "Février", "03": "Mars", "04": "Avril",
    "05": "Mai", "06": "Juin", "07": "Juillet", "08": "Août",
    "09": "Septembre", "10": "Octobre", "11": "Novembre", "12": "Décembre"
  };

  const formatGroupTitle = (group) => {
    if (group === 'Inconnu' || group === 'Unknown') return 'Date non détectée';

    const [year, month] = String(group).split('-');
    if (year && month) {
      return `${monthNames[month] || month} ${year}`;
    }

    return monthNames[group] || group;
  };

  return (
    <div className={`p-8 max-w-7xl mx-auto min-h-screen transition-colors ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-slate-50 text-slate-900'}`}>
      <Toaster position="top-right" />
      
      <SalarieHeader 
        selectedEmployeeId={selectedEmployeeId}
        setSelectedEmployeeId={setSelectedEmployeeId}
        employees={employees}
        theme={theme}
      />

      {/* Upload Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <UploadCard 
          title="Fiches de paie (ZIP)" 
          description="Extraire les données de salaires de tous vos bulletins"
          file={zipFiles.payslips}
          onFileSelect={(e) => handleFileChange('payslips', e)}
          onCancel={() => handleCancelFile('payslips')}
          isLoading={loadingCard.payslips}
          id="zip-payslips"
          icon={<FileText size={32} />}
          theme={theme}
        />

        <UploadCard 
          title="Notes de frais (ZIP)" 
          description="Extraire les montants des notes de frais du mois"
          file={zipFiles.expenses}
          onFileSelect={(e) => handleFileChange('expenses', e)}
          onCancel={() => handleCancelFile('expenses')}
          isLoading={loadingCard.expenses}
          id="zip-expenses"
          icon={<Receipt size={32} />}
          theme={theme}
        />

        <UploadCard 
          title="Frais kilométriques (ZIP)" 
          description="Extraire les montants des frais kilométriques du mois"
          file={zipFiles.mileage}
          onFileSelect={(e) => handleFileChange('mileage', e)}
          onCancel={() => handleCancelFile('mileage')}
          isLoading={loadingCard.mileage}
          id="zip-mileage"
          icon={<FileArchive size={32} />}
          theme={theme}
        />
      </div>

      {!isReadOnly && (
        <ExtractionActions 
          resetAll={resetAll}
          startExtraction={startExtraction}
          isExtracting={extractionStatus.isExtracting}
          theme={theme}
        />
      )}

      {/* Results grouped by date */}
      {extractionStatus.results.length > 0 && (
        <div className="space-y-10 mt-8">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <FileText className="text-[#7ED957]" />
            Résultats de l'extraction ({extractionStatus.results.length} éléments)
          </h2>
          
          {Object.entries(groupedResults)
            .sort(([a], [b]) => b.localeCompare(a))
            .map(([dateGroup, items]) => (
              <div key={dateGroup} className="bg-white/50 dark:bg-gray-800/20 p-6 rounded-2xl border border-gray-100 dark:border-gray-700/50">
                <h3 className="text-xl font-semibold mb-6 text-gray-800 dark:text-gray-200 flex items-center gap-2">
                  <div className="w-2 h-6 bg-[#7ED957] rounded-full"></div>
                  {formatGroupTitle(dateGroup)}
                </h3>
                
                <div className="space-y-6">
                  <UnifiedResultCard
                    items={items}
                    dateGroup={dateGroup}
                    formatCurrency={formatCurrency}
                    defaultEmployeeId={selectedEmployeeId}
                    theme={theme}
                  />
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
};

export default SaisieSalarieUnique;

