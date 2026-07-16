import { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { useTheme } from '../context/ThemeContext';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

import { 
  Save, 
  X,
  Loader2,
  FileText
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

import ImportSection from '../components/SaisieIndividuelle/ImportSection';
import FinancialSummary from '../components/SaisieIndividuelle/FinancialSummary';
import Autocomplete from '../components/Shared/Autocomplete';

import api from '../api/axios';

export function SaisieIndividuelle() {
  const { employees, addMonthlyData } = useData();
  const { theme } = useTheme();

  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  
// eslint-disable-next-line no-unused-vars
  const [selectedDate, setSelectedDate] = useState(null);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  
  // Nouveaux états de chargement
  const [isDolibarrLoading, setIsDolibarrLoading] = useState(false);
  const [isPayslipLoading, setIsPayslipLoading] = useState(false);
  const [isExpensesLoading, setIsExpensesLoading] = useState(false);
  const [isKmsLoading, setIsKmsLoading] = useState(false);
  
  const [selectedMonth, setSelectedMonth] = useState('');
  const [invoices, setInvoices] = useState([]);
  const [filteredInvoices, setFilteredInvoices] = useState([]);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState('');

  
  const [dolibarrImported, setDolibarrImported] = useState(false);
  const [payslipImported, setPayslipImported] = useState(false);
  const [expensesImported, setExpensesImported] = useState(false);
  const [kmsImported, setKmsImported] = useState(false);

  const [tjm, setTjm] = useState(0);
  const [daysWorked, setDaysWorked] = useState(0);
  const [invoicePaid, setInvoicePaid] = useState(false);
  const [salaireBrut, setSalaireBrut] = useState(0);
  const [salaireNetApresPAS, setSalaireNetApresPAS] = useState(0);
  const [salaireNetAvantPAS, setSalaireNetAvantPAS] = useState(0);
  const [salaireNetHorsRepas, setSalaireNetHorsRepas] = useState(0);
  const [fraisRepas, setFraisRepas] = useState(0);
  const [fraisKilometriques, setFraisKilometriques] = useState(0);
  const [autresFrais, setAutresFrais] = useState(0);
  const [chargesPatronales, setChargesPatronales] = useState(0);
  const [chargesSalariales, setChargesSalariales] = useState(0);
  const [zipExtractionResults, setZipExtractionResults] = useState([]);
  const [isZipLoading, setIsZipLoading] = useState(false);

  const handleNumericChange = (setter) => (e) => {
    const { value } = e.target;
    setter(value === '' ? '' : value);
  };

  const toNumber = (value) => {
    if (value === '' || value === null || value === undefined) return 0;
    const parsed = parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const numericTjm = toNumber(tjm);
  const numericDaysWorked = toNumber(daysWorked);
  const numericSalaireBrut = toNumber(salaireBrut);
  const numericSalaireNetApresPAS = toNumber(salaireNetApresPAS);
  const numericSalaireNetAvantPAS = toNumber(salaireNetAvantPAS);
  const numericSalaireNetHorsRepas = toNumber(salaireNetHorsRepas);
  const numericFraisRepas = toNumber(fraisRepas);
  const numericFraisKilometriques = toNumber(fraisKilometriques);
  const numericAutresFrais = toNumber(autresFrais);
  const numericChargesPatronales = toNumber(chargesPatronales);
  const numericChargesSalariales = toNumber(chargesSalariales);

  const multiplicateurPaiement = invoicePaid ? 1 : 0;
  const invoiceAmount = numericTjm * numericDaysWorked * multiplicateurPaiement;
  const totalPercu = (numericSalaireNetAvantPAS - numericFraisRepas) + numericFraisRepas + numericFraisKilometriques + numericAutresFrais;
  const totalFrais = numericFraisRepas + numericFraisKilometriques + numericAutresFrais;
  const totalCharges = numericChargesPatronales + numericChargesSalariales;
  const coutTotal = numericSalaireBrut + numericChargesPatronales + totalFrais;
  const rentabilite = invoiceAmount - totalPercu;
  const pourcentageRentabilite = invoiceAmount > 0 ? (rentabilite / invoiceAmount) * 100 : 0;




  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await api.get("/projets");
        if (Array.isArray(res.data)) {
          // Filter out projects that are Terminé or Annulé
          const activeProjects = res.data.filter(p => p.statut !== 'Terminé' && p.statut !== 'Annulé');
          setProjects(activeProjects);
        }
      } catch{
        // Handled by interceptor
      }
    };
    fetchProjects();
  }, []);

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const res = await api.get("/factures");
        if (Array.isArray(res.data)) {
          setInvoices(res.data);
          setFilteredInvoices(res.data);
        }
      } catch {
        // Handled by interceptor
      }
    };
    fetchInvoices();
  }, []);

  useEffect(() => {
    const filterInvoices = () => {
      if (!invoices.length) {
        setFilteredInvoices([]);
        return;
      }

      const project = projects.find((p) => String(p.id) === String(selectedProjectId));
      if (!project) {
        setFilteredInvoices([]);
        setSelectedInvoiceId('');
        return;
      }

      const projectClientId = project.clientDolibarrId ? String(project.clientDolibarrId).trim() : null;
      const projectClientName = project.nomClient ? String(project.nomClient).trim().toLowerCase() : null;
      const projectTjm = project.tjm ? Number(project.tjm) : null;

      const filtered = invoices.filter((inv) => {
        const invClientId = inv.idClient !== undefined && inv.idClient !== null ? String(inv.idClient).trim() : '';
        const invClientName = inv.nomClient ? String(inv.nomClient).trim().toLowerCase() : '';
        
        // Match Client/Project
        const clientMatch = (projectClientId && invClientId === projectClientId) ||
          (projectClientName && invClientName === projectClientName);
        
        if (!clientMatch) return false;

        // Match TJM : comparer avec toutes les lignes de la facture (tolérance ±1€)
        if (projectTjm && projectTjm > 0) {
          if (!inv.lignes || inv.lignes.length === 0) {
             return false;
          }
          
          const hasMatchingLine = inv.lignes.some(line => {
            const lineTjm = parseFloat(line.subprice || line.price || 0);
            return lineTjm > 0 && Math.abs(lineTjm - projectTjm) <= 1;
          });

          if (!hasMatchingLine) {
            return false;
          }
        }

        // Match Date Range
        if (startDate || endDate) {
          if (!inv.date) return false;
          const invDate = typeof inv.date === 'number' ? new Date(inv.date * 1000) : new Date(inv.date);
          if (isNaN(invDate.getTime())) return false;
          if (startDate && invDate < startDate) return false;
          if (endDate && invDate > endDate) return false;
        }

        return true;
      });

      setFilteredInvoices(filtered);

      if (selectedInvoiceId && !filtered.some((inv) => inv.id === selectedInvoiceId || String(inv.id) === String(selectedInvoiceId))) {
        setSelectedInvoiceId('');
      }
    };

    filterInvoices();
  }, [invoices, projects, selectedProjectId, startDate, endDate, selectedInvoiceId]);

  // Auto-select project when employee is selected
  useEffect(() => {
    if (selectedEmployeeId) {
      const empProjects = projects.filter(p => String(p.idEmployé) === String(selectedEmployeeId));
      if (empProjects.length === 1) {
        const newProjId = empProjects[0].id;
        if (String(selectedProjectId) !== String(newProjId)) {
          setSelectedProjectId(newProjId);
        }
      }
    }
  }, [selectedEmployeeId, projects, selectedProjectId]);

  useEffect(() => {
    // Reset everything when selection changes (Total Reset requirement)
    setDolibarrImported(false);
    setPayslipImported(false);
    setExpensesImported(false);
    setKmsImported(false);
    setSelectedInvoiceId('');

    setTjm(0);
    setDaysWorked(0);
    setInvoicePaid(false);
    setSalaireBrut(0);
    setSalaireNetApresPAS(0);
    setSalaireNetAvantPAS(0);
    setSalaireNetHorsRepas(0);
    setFraisRepas(0);
    setFraisKilometriques(0);
    setAutresFrais(0);
    setChargesPatronales(0);
    setChargesSalariales(0);

    // Default TJM from project if one is selected
    if (selectedProjectId) {
      const proj = projects.find((p) => String(p.id) === String(selectedProjectId));
      if (proj) {
        setTjm(proj.tjm || 0);
      }
    }
  }, [selectedEmployeeId, selectedMonth, selectedProjectId, projects]);

  // Sync Note hors repas automatically
  useEffect(() => {
    const netAvant = toNumber(salaireNetAvantPAS);
    const repas = toNumber(fraisRepas);
    const computed = parseFloat((netAvant - repas).toFixed(2));
    if (toNumber(salaireNetHorsRepas) !== computed) {
      setSalaireNetHorsRepas(computed);
    }
  }, [salaireNetAvantPAS, fraisRepas, salaireNetHorsRepas]);

 
  const handleDolibarrSync = async () => {

    if (!selectedProjectId) {
      toast.error('Veuillez sélectionner un projet');
      return;
    }

    if (!selectedInvoiceId) {
      toast.error('Veuillez sélectionner une facture');
      return;
    }

    setIsDolibarrLoading(true);
    const toastId = toast.loading('Récupération des données...');
    try {
      const res = await api.get(`/factures/${selectedInvoiceId}`);
      const invoiceData = res.data;
      
      if (invoiceData.lignes && invoiceData.lignes.length > 0) {
        const primaryLine = invoiceData.lignes[0];
        setTjm(parseFloat(primaryLine.subprice || primaryLine.price || 0));
        setDaysWorked(parseFloat(primaryLine.qty || 0));
      }

      setInvoicePaid(invoiceData.payé === "1" || invoiceData.payé === 1 || invoiceData.status === "2");
      setDolibarrImported(true);
      
      toast.success('Données récupérées avec succès', { id: toastId });
    } catch{
      toast.error('Échec de la synchronisation', { id: toastId });
    } finally {
      setIsDolibarrLoading(false);
    }
  };


  const handlePayslipUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type === 'application/zip' || file.name.endsWith('.zip')) {
      handleZipAnalysis(file);
      e.target.value = '';
      return;
    }

    if (file.type !== 'application/pdf') {
      toast.error('Veuillez uploader un fichier PDF ou ZIP');
      return;
    }

    setIsPayslipLoading(true);
    const toastId = toast.loading('Analyse de la fiche de paie...');
    try {
      const formData = new FormData();
      formData.append('file', file);
      // formData.append('mode', 'profile'); // Retiré pour obtenir les données financières

      const res = await api.post("/upload", formData);
      const data = res.data;
      
      if (data.error) {
        toast.error(`Erreur d'extraction : ${data.error}`, { id: toastId });
        return;
      }

      const netPaye = data.net_paye || data.salaireNetApresPAS || 0;
      const repas = data.repas_restaurant || data.fraisRepas || 0;
      
      setSalaireBrut(data.salaire_brut || data.salaireBrut || 0);
      setSalaireNetApresPAS(netPaye);
      setSalaireNetAvantPAS(data.net_avant_impot || data.salaireNetAvantPAS || 0);
      setSalaireNetHorsRepas(data.net_hors_repas || data.salaireNetHorsRepas || (data.net_avant_impot > 0 ? parseFloat((data.net_avant_impot - repas).toFixed(2)) : 0));
      setFraisRepas(repas);
      setChargesPatronales(data.total_charges_patronales || data.chargesPatronales || 0);
      setChargesSalariales(data.total_cotisations_salariales || data.chargesSalariales || 0);

      setPayslipImported(true);
      toast.success('Analyse terminée avec succès', { id: toastId });
    } catch{
      toast.error('Échec de l\'analyse du fichier', { id: toastId });
    } finally {
      setIsPayslipLoading(false);
      e.target.value = ''; 
    }
  };

  const handleZipAnalysis = async (file) => {
    setIsZipLoading(true);
    const toastId = toast.loading('Analyse groupée du ZIP en cours...');
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('employeeName', 'Batch'); // Required by backend

      const res = await api.post("/upload-zip", formData);
      const results = res.data;

      if (results.error) {
        toast.error(`Erreur ZIP : ${results.error}`, { id: toastId });
        return;
      }

      if (results.length > 0) {
        const data = results[0];
        const netPaye = data.net_paye || data.salaireNetApresPAS || 0;
        const repas = data.repas_restaurant || data.fraisRepas || 0;
        
        setSalaireBrut(data.salaire_brut || data.salaireBrut || 0);
        setSalaireNetApresPAS(netPaye);
        setSalaireNetAvantPAS(data.net_avant_impot || data.salaireNetAvantPAS || 0);
        setSalaireNetHorsRepas(data.net_hors_repas || data.salaireNetHorsRepas || (data.net_avant_impot > 0 ? parseFloat((data.net_avant_impot - repas).toFixed(2)) : 0));
        setFraisRepas(repas);
        setChargesPatronales(data.total_charges_patronales || data.chargesPatronales || 0);
        setChargesSalariales(data.total_cotisations_salariales || data.chargesSalariales || 0);
      }

      setPayslipImported(true);
      toast.success(`Analyse terminée à partir du ZIP`, { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error('Échec de l\'analyse du ZIP', { id: toastId });
    } finally {
      setIsZipLoading(false);
    }
  };

  const handleExpensesUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsExpensesLoading(true);
    const toastId = toast.loading('Extraction des frais...');
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await api.post("/upload", formData);
      const data = res.data;
      
      if (data.error) {
        toast.error(`Erreur d'extraction : ${data.error}`, { id: toastId });
        return;
      }

      if (data.autresFrais !== undefined && data.autresFrais > 0) {
        setAutresFrais(data.autresFrais);
        setExpensesImported(true);
        toast.success('Frais détectés automatiquement', { id: toastId });
      } else if (data.total !== undefined && data.total > 0) {
        setAutresFrais(data.total); 
        setExpensesImported(true);
        toast.success('Frais détectés automatiquement', { id: toastId });
      } else {
        toast.error('Aucun montant détecté dans le fichier', { id: toastId });
      }
    } catch {
      toast.error('Échec de l\'extraction des frais', { id: toastId });
    } finally {
      setIsExpensesLoading(false);
      e.target.value = ''; // Reset input
    }
  };

  const handleKmsUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsKmsLoading(true);
    const toastId = toast.loading('Extraction des frais kilométriques...');
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await api.post("/upload", formData);
      const data = res.data;
      
      if (data.error) {
        toast.error(`Erreur d'extraction : ${data.error}`, { id: toastId });
        return;
      }

      if (data.fraisKilometriques !== undefined && data.fraisKilometriques > 0) {
        setFraisKilometriques(data.fraisKilometriques);
        setKmsImported(true);
        toast.success('Frais kilométriques détectés automatiquement', { id: toastId });
      } else if (data.total !== undefined && data.total > 0) {
        setFraisKilometriques(data.total); 
        setKmsImported(true);
        toast.success('Frais kilométriques détectés automatiquement', { id: toastId });
      } else {
        toast.error('Aucun montant kilométrique détecté', { id: toastId });
      }
    } catch{
      toast.error('Échec de l\'extraction des frais kilométriques', { id: toastId });
    } finally {
      setIsKmsLoading(false);
      e.target.value = ''; // Reset input
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Contraintes assouplies à la demande de l'utilisateur
    /*
    if (!selectedEmployeeId || !selectedMonth) {
      toast.error('Veuillez sélectionner un salarié et un mois');
      return;
    }
    */

    const monthlyData = {
      idEmployé: Number(selectedEmployeeId),
      mois: selectedMonth,
      idProjet: selectedProjectId ? Number(selectedProjectId) : null,
      tjm: numericTjm,
      joursTravaillés: numericDaysWorked,
      montantFacturé: invoiceAmount,
      facturePayée: invoicePaid,
      salaireBrut: numericSalaireBrut,
      salaireNetApresPAS: numericSalaireNetApresPAS,
      salaireNetAvantPAS: numericSalaireNetAvantPAS,
      chargesPatronales: numericChargesPatronales,
      chargesSalariales: numericChargesSalariales,
      salaireNetHorsRepas: numericSalaireNetHorsRepas,
      fraisRepas: numericFraisRepas,
      fraisKilometriques: numericFraisKilometriques,
      autresFrais: numericAutresFrais,
      totalPercu,
      totalFrais,
      totalCharges,
      rentabilite,
      pourcentageRentabilite,
      extra: 0
    };

    try {
      await addMonthlyData(monthlyData);
      toast.success('Données enregistrées dans la base avec succès !');
    } catch (error) {
      console.error('Échec de sauvegarde mensuelle :', error);
      const message = error?.response?.data?.message || 'Échec de l\'enregistrement des données mensuelles';
      toast.error(message);
    }
  };

  const handleCancelDolibarr = (showToast = true) => {
    setTjm(0);
    setDaysWorked(0);
    setInvoicePaid(false);
    setSelectedInvoiceId('');
    setDolibarrImported(false);
    if (showToast) toast('Données Dolibarr réinitialisées');
  };

  const handleCancelPayslip = (showToast = true) => {
    setSalaireBrut(0);
    setSalaireNetApresPAS(0);
    setSalaireNetAvantPAS(0);
    setSalaireNetHorsRepas(0);
    setFraisRepas(0);
    setChargesPatronales(0);
    setChargesSalariales(0);
    setPayslipImported(false);
    if (showToast) toast('Données de paie réinitialisées');
  };

  const handleCancelExpenses = (showToast = true) => {
    setAutresFrais(0);
    setExpensesImported(false);
    if (showToast) toast('Notes de frais réinitialisées');
  };

  const handleCancelKms = (showToast = true) => {
    setFraisKilometriques(0);
    setKmsImported(false);
    if (showToast) toast('Frais kilométriques réinitialisés');
  };

  const handleCancel = () => {
    handleCancelDolibarr(false);
    handleCancelPayslip(false);
    handleCancelExpenses(false);
    handleCancelKms(false);
    setSelectedProjectId('');
    setSelectedEmployeeId('');
    setSelectedDate(null);
    setStartDate(null);
    setEndDate(null);
    setSelectedMonth('');
    toast.success('Le formulaire a été entièrement réinitialisé');
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(value);
  };

  const MONTHS = [
    { value: "01", label: "Janvier" }, { value: "02", label: "Février" },
    { value: "03", label: "Mars" }, { value: "04", label: "Avril" },
    { value: "05", label: "Mai" }, { value: "06", label: "Juin" },
    { value: "07", label: "Juillet" }, { value: "08", label: "Août" },
    { value: "09", label: "Septembre" }, { value: "10", label: "Octobre" },
    { value: "11", label: "Novembre" }, { value: "12", label: "Décembre" }
  ];
  
  const currentYear = new Date().getFullYear();
  const YEARS = Array.from({ length: 5 }, (_, i) => currentYear - i); // [2026, 2025, 2024, 2023, 2022]

  // --- LOGIQUE POUR LE POINTAGE ---
  const currentPointageMonth = selectedMonth ? selectedMonth.split('-')[1] : "";
  const currentPointageYear = selectedMonth ? selectedMonth.split('-')[0] : "";

  const handlePointageChange = (month, year) => {
    if (month && year) {
      const val = `${year}-${month}`;
      setSelectedMonth(val);
      setSelectedDate(new Date(`${val}-01T12:00:00`));
      
      // Filter invoices by the selected month
      const y = parseInt(year);
      const m = parseInt(month);
      // Start of month (local time)
      const start = new Date(y, m - 1, 1, 0, 0, 0);
      // End of month (local time)
      const end = new Date(y, m, 0, 23, 59, 59, 999);
      
      setStartDate(start);
      setEndDate(end);
    } else {
      setSelectedMonth("");
      setSelectedDate(null);
      setStartDate(null);
      setEndDate(null);
    }
  };

  return (
    <div className={`p-8 min-h-screen transition-colors ${theme === 'dark' ? 'bg-gray-900' : 'bg-slate-50'}`}>
      <Toaster position="top-right" />
      {/* Header */}
      <div className="mb-8">
        <h1 className={`text-3xl font-bold transition-colors ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Saisie individuelle des données salarié</h1>
        <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
          Centralisation automatique des données financières mensuelles
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Sélection salarié et mois */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700 mb-6 transition-colors">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Projet *
              </label>
              <Autocomplete
                value={selectedProjectId}
                onChange={(pId) => {
                  setSelectedProjectId(pId);
                  const proj = projects.find((p) => String(p.id) === String(pId));
                  if (proj) {
                    const empId = proj.idEmployé?.id || proj.idEmployé || '';
                    setSelectedEmployeeId(String(empId));
                  } else {
                    setSelectedEmployeeId('');
                  }
                }}
                options={projects.map((proj) => ({
                  id: proj.id,
                  name: `${proj.titre} — ${proj.nomClient}`
                }))}
                placeholder="Sélectionner un projet"
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Date du pointage *
              </label>
              <div className="flex gap-2">
                <Autocomplete
                  value={currentPointageMonth}
                  onChange={(val) => handlePointageChange(val, currentPointageYear || new Date().getFullYear())}
                  options={MONTHS.map(m => ({ id: m.value, name: m.label }))}
                  placeholder="Mois"
                  className="w-1/2"
                />

                <Autocomplete
                  value={currentPointageYear}
                  onChange={(val) => handlePointageChange(currentPointageMonth || "01", val)}
                  options={YEARS.map(y => ({ id: String(y), name: String(y) }))}
                  placeholder="Année"
                  className="w-1/2"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Facture *
              </label>
              <Autocomplete
                value={selectedInvoiceId}
                onChange={setSelectedInvoiceId}
                options={filteredInvoices.map((inv) => {
                  const invDate = inv.date ? new Date(typeof inv.date === 'number' ? inv.date * 1000 : inv.date) : null;
                  const invDateText = invDate && !isNaN(invDate.getTime()) ? invDate.toLocaleDateString() : 'Date inconnue';
                  return {
                    id: inv.id,
                    name: `${inv.référence} (${formatCurrency(inv.total_ttc)}) - ${inv.nomClient} - ${invDateText}`
                  };
                })}
                placeholder={filteredInvoices.length > 0 ? "Sélectionner une facture" : "Aucune facture disponible"}
                disabled={filteredInvoices.length === 0}
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* SECTION 1 - IMPORT AUTOMATIQUE */}
        <ImportSection
          dolibarrImported={dolibarrImported}
          isDolibarrLoading={isDolibarrLoading}
          handleDolibarrSync={handleDolibarrSync}
          handleCancelDolibarr={handleCancelDolibarr}
          payslipImported={payslipImported}
          isPayslipLoading={isPayslipLoading}
          handlePayslipUpload={handlePayslipUpload}
          handleCancelPayslip={handleCancelPayslip}
          expensesImported={expensesImported}
          isExpensesLoading={isExpensesLoading}
          handleExpensesUpload={handleExpensesUpload}
          handleCancelExpenses={handleCancelExpenses}
          kmsImported={kmsImported}
          isKmsLoading={isKmsLoading}
          handleKmsUpload={handleKmsUpload}
          handleCancelKms={handleCancelKms}
        />

        {/* SECTION RÉSULTATS D'ANALYSE SUPPRIMÉE */}

        {/* SECTION 2 - VÉRIFICATION ET MODIFICATION */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 border border-gray-100 dark:border-gray-700 mb-6 transition-colors">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-semibold text-black dark:text-white">
                Vérification des données
              </h2>
              <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                Les champs peuvent être modifiés en cas de correction
              </p>
            </div>
          </div>

          {/* Facturation */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-black dark:text-white mb-4 flex items-center gap-2">
              <div className="w-1 h-6 bg-[#7ED957] rounded"></div>
              Facturation
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  TJM (€)
                </label>
                <input
                  type="number"
                  step="any"
                  value={tjm}
                  onChange={handleNumericChange(setTjm)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-[#7ED957] focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Jours travaillés
                </label>
                <input
                  type="number"
                  step="any"
                  value={daysWorked}
                  onChange={handleNumericChange(setDaysWorked)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-[#7ED957] focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Facture (auto)
                </label>
                <div className="px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-800 dark:text-gray-200 font-semibold">
                  {formatCurrency(invoiceAmount)}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Payée ?
                </label>
                <div className="flex items-center h-10">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={invoicePaid}
                      onChange={(e) => setInvoicePaid(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#7ED957] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#7ED957]"></div>
                  </label>
                  <span className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                    {invoicePaid ? 'Oui' : 'Non'} 
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Total perçu
                </label>
                <div className="px-4 py-2 bg-[#7ED957]/10 dark:bg-[#7ED957]/20 border-2 border-[#7ED957]/30 rounded-lg text-black dark:text-white font-semibold">
                  {formatCurrency(totalPercu)}
                </div>
              </div>
            </div>
          </div>

          {/* Salaire */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-black dark:text-white mb-4 flex items-center gap-2">
              <div className="w-1 h-6 bg-[#7ED957] rounded"></div>
              Salaire
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Salaire brut (€)
                </label>
                <input
                  type="number"
                  step="any"
                  value={salaireBrut}
                  onChange={handleNumericChange(setSalaireBrut)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-[#7ED957] focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Net après PAS (€)
                </label>
                <input
                  type="number"
                  step="any"
                  value={salaireNetApresPAS}
                  onChange={handleNumericChange(setSalaireNetApresPAS)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-[#7ED957] focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Net avant PAS (€)
                </label>
                <input
                  type="number"
                  step="any"
                  value={salaireNetAvantPAS}
                  onChange={handleNumericChange(setSalaireNetAvantPAS)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-[#7ED957] focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Net hors repas (€)
                </label>
                <input
                  type="number"
                  step="any"
                  value={salaireNetHorsRepas}
                  onChange={handleNumericChange(setSalaireNetHorsRepas)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-[#7ED957] focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  min="0"
                />
              </div>
            </div>
          </div>

          {/* Frais */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-black dark:text-white mb-4 flex items-center gap-2">
              <div className="w-1 h-6 bg-[#7ED957] rounded"></div>
              Frais
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Frais repas (€)
                </label>
                <input
                  type="number"
                  step="any"
                  value={fraisRepas}
                  onChange={handleNumericChange(setFraisRepas)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-[#7ED957] focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Frais kilométriques (€)
                </label>
                <input
                  type="number"
                  step="any"
                  value={fraisKilometriques}
                  onChange={handleNumericChange(setFraisKilometriques)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-[#7ED957] focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Autres frais (€)
                </label>
                <input
                  type="number"
                  step="any"
                  value={autresFrais}
                  onChange={handleNumericChange(setAutresFrais)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-[#7ED957] focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  min="0"
                />
              </div>
            </div>
          </div>

          {/* Charges */}
          <div>
            <h3 className="text-lg font-semibold text-black dark:text-white mb-4 flex items-center gap-2">
              <div className="w-1 h-6 bg-[#7ED957] rounded"></div>
              Charges
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Charges patronales URSSAF (€)
                </label>
                <input
                  type="number"
                  step="any"
                  value={chargesPatronales}
                  onChange={handleNumericChange(setChargesPatronales)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-[#7ED957] focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Charges salariales (€)
                </label>
                <input
                  type="number"
                  step="any"
                  value={chargesSalariales}
                  onChange={handleNumericChange(setChargesSalariales)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-[#7ED957] focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  min="0"
                />
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 3 - CALCUL AUTOMATIQUE */}
        <FinancialSummary
          formatCurrency={formatCurrency}
          totalPercu={totalPercu}
          rentabilite={rentabilite}
          pourcentageRentabilite={pourcentageRentabilite}
        />

        {/* Boutons d'action */}
        <div className="flex gap-4 justify-end">
          <button
            type="button"
            onClick={handleCancel}
            className="flex items-center gap-2 px-8 py-3 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <X size={20} />
            Annuler
          </button>
          <button
            type="submit"
            className="flex items-center gap-2 px-8 py-3 bg-[#7ED957] text-black font-semibold rounded-lg hover:bg-[#6FC847] transition-colors shadow-md"
          >
            <Save size={20} />
            Enregistrer les données mensuelles
          </button>
        </div>
      </form>
    </div>
  );
}

export default SaisieIndividuelle;
