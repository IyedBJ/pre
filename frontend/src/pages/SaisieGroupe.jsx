import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import {
  FileArchive,
  FileText,
  Receipt,
  X,
  Loader2,
  Upload,
  Calendar,
  Users,
  UserCheck,
  AlertCircle
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useData } from '../context/DataContext';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import toast, { Toaster } from 'react-hot-toast';

import UploadCard from '../components/SaisieSalarieUnique/UploadCard';
import GroupResultSection from '../components/SaisieGroupe/GroupResultSection';
import GroupHeader from '../components/SaisieGroupe/GroupHeader';
import PeriodSelector from '../components/SaisieGroupe/PeriodSelector';
import InvoiceSelector from '../components/SaisieGroupe/InvoiceSelector';
import GroupActions from '../components/SaisieGroupe/GroupActions';

// ─── constants ───────────────────────────────────────────────────────────────

const MONTH_NAMES = {
  "01": "Janvier", "02": "Février", "03": "Mars", "04": "Avril",
  "05": "Mai",     "06": "Juin",    "07": "Juillet", "08": "Août",
  "09": "Septembre","10": "Octobre","11": "Novembre","12": "Décembre"
};

const formatCurrency = (v) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(v || 0);

// ─── helpers ─────────────────────────────────────────────────────────────────

/** Fuzzy match an extracted name against the employee list */
function matchEmployee(extractedName, employees) {
  if (!extractedName || !employees?.length) return null;
  const n = extractedName.toLowerCase().trim();
  return (
    employees.find(emp => emp.nom?.toLowerCase() === n) ||
    employees.find(emp => {
      const parts = (emp.nom || '').toLowerCase().split(/\s+/);
      return parts.some(p => p.length > 2 && n.includes(p));
    }) ||
    null
  );
}

/**
 * Call /upload-zip with a given fileType and optional mode.
 * Returns an array of extracted items.
 */
async function extractZip(file, fileType, mode = '') {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('employeeName', 'Batch');
  fd.append('fileType', fileType);
  if (mode) fd.append('mode', mode);
  const res = await api.post('/upload-zip', fd);
  return Array.isArray(res.data) ? res.data : [];
}

// ─── component ───────────────────────────────────────────────────────────────

const SaisieGroupe = () => {
  const { user } = useAuth();
  const isReadOnly = user?.role === 'finance';
  const { theme } = useTheme();
  const { employees } = useData();

  const currentYear  = new Date().getFullYear();
  const currentMonth = String(new Date().getMonth() + 1).padStart(2, '0');
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedYear,  setSelectedYear]  = useState(String(currentYear));
  const years = Array.from({ length: 8 }, (_, i) => String(currentYear - 2 + i));

  const [zipFiles, setZipFiles] = useState({
    payslips: null, expenses: null, mileage: null
  });
  const [loadingCard, setLoadingCard] = useState({
    payslips: false,
    expenses: false,
    mileage: false
  });

  const [isExtracting,   setIsExtracting]   = useState(false);
  const [extractionStep, setExtractionStep] = useState('');
  const [grouped,        setGrouped]        = useState([]);
  const [invoices,       setInvoices]       = useState([]);
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState([]);
  const extractionId = useRef(0);

  const dateGroup = `${selectedYear}-${selectedMonth}`;

  // ── file handlers ─────────────────────────────────────────────────────────

  const handleFileChange = (type, e) => {
    const file = e.target.files?.[0];
    if (file) {
      setZipFiles(prev => ({ ...prev, [type]: file }));
    }
  };

  const handleCancelFile = (type) => {
    setZipFiles(prev => ({ ...prev, [type]: null }));
  };

  const toggleInvoiceSelection = (invoiceId) => {
    setSelectedInvoiceIds(prev =>
      prev.includes(invoiceId)
        ? prev.filter(id => id !== invoiceId)
        : [...prev, invoiceId]
    );
  };

  const resetAll = () => {
    extractionId.current += 1; // Increment to ignore any pending extraction results
    setZipFiles({ payslips: null, expenses: null, mileage: null });
    setSelectedInvoiceIds([]);
    setGrouped([]);
    setExtractionStep('');
    setIsExtracting(false);
    setLoadingCard({ payslips: false, expenses: false, mileage: false });
    toast.success('Formulaire réinitialisé');
  };

  // ── manual assignment (called from GroupResultSection) ────────────────────

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const res = await api.get('/factures');
        if (Array.isArray(res.data)) {
          setInvoices(res.data);
        }
      } catch (err) {
        console.error('Erreur de récupération des factures :', err);
      }
    };

    fetchInvoices();
  }, []);

  const assignItemToEmployee = useCallback((fromKey, itemIndex, targetEmployeeId) => {
    const targetEmp = employees.find(e => String(e.id) === String(targetEmployeeId));
    if (!targetEmp) return;
    const targetKey = `emp_${targetEmp.id}`;

    setGrouped(prev => {
      const srcIdx = prev.findIndex(g => g.employeeKey === fromKey);
      if (srcIdx === -1) return prev;

      const srcGroup = prev[srcIdx];
      const itemToMove = srcGroup.items[itemIndex];
      if (!itemToMove) return prev;

      // New items for source group
      const newSrcItems = srcGroup.items.filter((_, idx) => idx !== itemIndex);
      
      let next = [...prev];

      // Update or remove source group
      if (newSrcItems.length === 0) {
        next = next.filter(g => g.employeeKey !== fromKey);
      } else {
        next[srcIdx] = { ...srcGroup, items: newSrcItems };
      }

      // Add to target group
      const targetIdx = next.findIndex(g => g.employeeKey === targetKey);
      if (targetIdx !== -1) {
        next[targetIdx] = { 
          ...next[targetIdx], 
          items: [...next[targetIdx].items, itemToMove] 
        };
      } else {
        next.push({
          employeeKey: targetKey,
          employeeName: targetEmp.nom,
          matchedEmployeeId: targetEmp.id,
          items: [itemToMove],
          dateGroup
        });
      }

      // Sort: identified first
      return next.sort((a, b) => (a.matchedEmployeeId ? 0 : 1) - (b.matchedEmployeeId ? 0 : 1));
    });

    toast.success(`Fichier assigné à ${targetEmp.nom}`);
  }, [employees, dateGroup]);

  // ── extraction ────────────────────────────────────────────────────────────

  const startExtraction = async () => {
    if (!zipFiles.payslips && !zipFiles.expenses && !zipFiles.mileage && selectedInvoiceIds.length === 0) {
      toast.error('Veuillez uploader au moins un fichier ZIP ou sélectionner des factures');
      return;
    }

    setIsExtracting(true);
    setGrouped([]);
    const currentId = ++extractionId.current;

    // employeeKey → { employeeName, matchedEmployeeId, items }
    const empMap = {};

    const addToMap = (key, name, matchedId, item) => {
      if (!empMap[key]) empMap[key] = { employeeName: name, matchedEmployeeId: matchedId, items: [] };
      empMap[key].items.push(item);
    };

    const identifyAndGroup = (financialItems, profileItems, fileType) => {
      // Build lookup: filename → extracted name from profile or raw text
      const profileByFile = {};
      const rawTextByFile = {};
      profileItems.forEach(p => {
        if (p.filename && (p.nom || p.name)) profileByFile[p.filename] = p.nom || p.name;
        if (p.filename && p.raw_text) rawTextByFile[p.filename] = p.raw_text;
      });

      financialItems.forEach(item => {
        if (item.error) return;

        // Try profile result first (for excel files which still return {nom: ...})
        const extractedName = profileByFile[item.filename] || null;
        let matched = extractedName ? matchEmployee(extractedName, employees) : null;

        // NEW: Try matching raw PDF text using RegEx
        if (!matched && rawTextByFile[item.filename]) {
           const rawText = rawTextByFile[item.filename].toLowerCase();
           matched = employees.find(emp => {
               const nom = (emp.nom || '').toLowerCase().trim();
               // Exact match
               if (nom.length > 3 && rawText.includes(nom)) return true;
               
               // Split parts
               const parts = nom.split(/\s+/).filter(Boolean);
               if (parts.length >= 2) {
                   // Reversed Match (Last First)
                   const reversed = parts.slice().reverse().join(' ');
                   if (rawText.includes(reversed)) return true;
                   
                   // All parts appear anywhere in the text
                   const allPartsExist = parts.every(p => p.length > 2 && rawText.includes(p));
                   if (allPartsExist) return true;
               }
               return false;
           }) || null;
        }

        // Fallback: filename matching using regex
        if (!matched) {
          const filename = (item.filename || '').toLowerCase();
          matched = employees.find(emp => {
            const nom = (emp.nom || '').toLowerCase().trim();
            if (nom.length > 2 && filename.includes(nom)) return true;
            
            const parts = nom.split(/\s+/);
            return parts.some(p => p.length > 2 && new RegExp(`\\b${p}\\b`, 'i').test(filename));
          }) || null;
        }

        const finalMatch      = matched;
        const key             = finalMatch
          ? `emp_${finalMatch.id}`
          : `unassigned_${fileType}_${item.filename || Math.random()}`;
        const displayName     = finalMatch?.nom || null;

        const dateGroupFromItem = item.date_group && item.date_group !== 'Unknown' ? item.date_group : dateGroup;

        addToMap(key, displayName, finalMatch?.id || null, { ...item, type: fileType, date_group: dateGroupFromItem });
      });
    };

    const extractionTasks = [];

    // ── 1. Fiches de paie ────────────────────────────────────────────────
    if (zipFiles.payslips) {
      extractionTasks.push((async () => {
        setLoadingCard(prev => ({ ...prev, payslips: true }));
        setExtractionStep('Extraction des fiches de paie...');
        try {
          const financialItems = await extractZip(zipFiles.payslips, 'payslips');
          // Unified mode returns both financial and profile data
          const profileItems = financialItems.map(item => ({ 
              filename: item.filename, 
              nom: item.nom || item.name, 
              raw_text: item.raw_text 
          }));
          identifyAndGroup(financialItems, profileItems, 'payslips');
        } catch (e) {
          toast.error("Erreur lors de l'extraction des fiches de paie");
        } finally {
          setLoadingCard(prev => ({ ...prev, payslips: false }));
        }
      })());
    }

    // ── 3. Notes de frais ────────────────────────────────────────────────
    if (zipFiles.expenses) {
      extractionTasks.push((async () => {
        setLoadingCard(prev => ({ ...prev, expenses: true }));
        setExtractionStep('Extraction des notes de frais...');
        try {
          const financialItems = await extractZip(zipFiles.expenses, 'expenses');
          const profileItems = financialItems.map(item => ({ 
              filename: item.filename, 
              nom: item.nom || item.name, 
              raw_text: item.raw_text 
          }));
          identifyAndGroup(financialItems, profileItems, 'expenses');
        } catch (e) {
          toast.error("Erreur lors de l'extraction des notes de frais");
        } finally {
          setLoadingCard(prev => ({ ...prev, expenses: false }));
        }
      })());
    }

    // ── 4. Frais kilométriques ───────────────────────────────────────────
    if (zipFiles.mileage) {
      extractionTasks.push((async () => {
        setLoadingCard(prev => ({ ...prev, mileage: true }));
        setExtractionStep('Extraction des frais kilométriques...');
        try {
          const financialItems = await extractZip(zipFiles.mileage, 'mileage');
          const profileItems = financialItems.map(item => ({ 
              filename: item.filename, 
              nom: item.nom || item.name, 
              raw_text: item.raw_text 
          }));
          identifyAndGroup(financialItems, profileItems, 'mileage');
        } catch (e) {
          toast.error("Erreur lors de l'extraction des frais kilométriques");
        } finally {
          setLoadingCard(prev => ({ ...prev, mileage: false }));
        }
      })());
    }

    try {
      await Promise.all(extractionTasks);

      if (currentId !== extractionId.current) return; // Extraction was cancelled

      // ── Consolidate: merge lone unassigned files into a single group ─────
      // Group all "unassigned_*" keys by type so as not to have one card per file
      const consolidated = {};
      Object.entries(empMap).forEach(([key, val]) => {
        if (val.matchedEmployeeId != null) {
          // Identified employee — keep as-is
          consolidated[key] = val;
        } else {
          // Unidentified — group all into single "unassigned" bucket
          const unassignedKey = 'unassigned';
          if (!consolidated[unassignedKey]) {
            consolidated[unassignedKey] = {
              employeeName:      null,
              matchedEmployeeId: null,
              items:             []
            };
          }
          consolidated[unassignedKey].items.push(...val.items);
        }
      });

      const groupArray = Object.entries(consolidated).map(([key, val]) => {
        // Find the most frequent date_group in the items
        const dates = val.items.map(i => i.date_group).filter(d => d && d !== 'Unknown');
        const mostRecentDate = dates.length > 0 ? [...dates].sort().pop() : dateGroup;
        
        return {
          employeeKey: key,
          ...val,
          dateGroup: mostRecentDate
        };
      }).sort((a, b) => (a.matchedEmployeeId ? 0 : 1) - (b.matchedEmployeeId ? 0 : 1));

      setGrouped(groupArray);
      setExtractionStep('');

      const identified = groupArray.filter(g => g.matchedEmployeeId).length;
      toast.success(
        `Extraction terminée — ${identified} salarié${identified > 1 ? 's' : ''} identifié${identified > 1 ? 's' : ''}`
      );
    } catch (err) {
      if (currentId !== extractionId.current) return;
      console.error(err);
      toast.error('Échec de l\'extraction');
      setExtractionStep('');
    } finally {
      if (currentId === extractionId.current) {
        setIsExtracting(false);
      }
    }
  };

  const unassignedCount = grouped.find(g => g.employeeKey === 'unassigned')?.items.length ?? 0;

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <div className={`p-8 max-w-7xl mx-auto min-h-screen transition-colors ${
      theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-slate-50 text-slate-900'
    }`}>
      <Toaster position="top-right" />

      <GroupHeader theme={theme} />

      <PeriodSelector
        selectedMonth={selectedMonth}
        setSelectedMonth={setSelectedMonth}
        selectedYear={selectedYear}
        setSelectedYear={setSelectedYear}
        years={years}
        monthNames={MONTH_NAMES}
        theme={theme}
      />

      {/* Upload cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 mb-8">
        <UploadCard title="Fiches de paie (ZIP)" description="Bulletins de salaire du mois pour tous les salariés"
          file={zipFiles.payslips} onFileSelect={e => handleFileChange('payslips', e)}
          onCancel={() => handleCancelFile('payslips')} isLoading={loadingCard.payslips}
          id="zip-payslips" icon={<FileText size={32} />} theme={theme} accept=".zip" buttonText="Sélectionner ZIP" />
        <UploadCard title="Notes de frais (ZIP)" description="Justificatifs de frais PDF/Excel du mois"
          file={zipFiles.expenses} onFileSelect={e => handleFileChange('expenses', e)}
          onCancel={() => handleCancelFile('expenses')} isLoading={loadingCard.expenses}
          id="zip-expenses" icon={<Receipt size={32} />} theme={theme} accept=".zip" buttonText="Sélectionner ZIP" />
        <UploadCard title="Frais kilométriques (ZIP)" description="Relevés kilométriques Excel du mois"
          file={zipFiles.mileage} onFileSelect={e => handleFileChange('mileage', e)}
          onCancel={() => handleCancelFile('mileage')} isLoading={loadingCard.mileage}
          id="zip-mileage" icon={<FileArchive size={32} />} theme={theme} accept=".zip" buttonText="Sélectionner ZIP" />
      </div>

      <InvoiceSelector
        filteredInvoices={invoices.filter(inv => {
          const invDate = inv.date ? new Date(typeof inv.date === 'number' ? inv.date * 1000 : inv.date) : null;
          if (!invDate) return false;
          return invDate.getFullYear() === Number(selectedYear) && 
                 String(invDate.getMonth() + 1).padStart(2, '0') === selectedMonth;
        })}
        selectedInvoiceIds={selectedInvoiceIds}
        toggleInvoiceSelection={toggleInvoiceSelection}
        formatCurrency={formatCurrency}
        theme={theme}
        monthNames={MONTH_NAMES}
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
      />

      <GroupActions
        resetAll={resetAll}
        startExtraction={startExtraction}
        isExtracting={isExtracting}
        extractionStep={extractionStep}
        isReadOnly={isReadOnly}
        theme={theme}
      />

      {/* Results */}
      {grouped.length > 0 && (
        <div className="space-y-6 mt-4">
          {/* Summary bar */}
          <div className="flex flex-wrap items-center gap-4 mb-2">
            <h2 className={`text-2xl font-bold flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              <Users className="text-[#7ED957]" />
              Résultats
            </h2>
            <span className={`px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1 ${
              theme === 'dark' ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-700'
            }`}>
              <UserCheck size={14} />
              {grouped.filter(g => g.matchedEmployeeId).length} identifié(s)
            </span>
            {unassignedCount > 0 && (
              <span className={`px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1 ${
                theme === 'dark' ? 'bg-orange-900/30 text-orange-400' : 'bg-orange-100 text-orange-600'
              }`}>
                <AlertCircle size={14} />
                {unassignedCount} fichier(s) à assigner
              </span>
            )}
            <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
              · {MONTH_NAMES[selectedMonth]} {selectedYear}
            </span>
          </div>

          {grouped.map(group => (
            <GroupResultSection
              key={group.employeeKey}
              employeeKey={group.employeeKey}
              employeeName={group.employeeName}
              matchedEmployeeId={group.matchedEmployeeId}
              items={group.items}
              dateGroup={group.dateGroup}
              formatCurrency={formatCurrency}
              theme={theme}
              employees={employees}
              onAssign={assignItemToEmployee}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default SaisieGroupe;
