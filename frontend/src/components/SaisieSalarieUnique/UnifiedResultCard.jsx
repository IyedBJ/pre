import React, { useState, useEffect } from 'react';
import { Save, Building2, FileText, Receipt, RefreshCw } from 'lucide-react';
import { useData } from '../../context/DataContext';
import Autocomplete from '../Shared/Autocomplete';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import ExtractionCardShell from '../Shared/ExtractionCardShell';
import AffectationSection from '../Shared/AffectationSection';

const UnifiedResultCard = ({ 
  items,
  dateGroup,
  formatCurrency, 
  defaultEmployeeId,
  theme,
  hideDolibarr = false
}) => {
  const { addMonthlyData, projects, employees } = useData();
  
  const [employeeId, setEmployeeId] = useState(defaultEmployeeId || '');
  const [projectId, setProjectId] = useState('');
  
  // Dolibarr states
  const [invoices, setInvoices] = useState([]);
  const [filteredInvoices, setFilteredInvoices] = useState([]);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState('');
  const [isDolibarrLoading, setIsDolibarrLoading] = useState(false);
  const [invoicePaid, setInvoicePaid] = useState(false);

  // Pre-fill invoice data
  const initTjm = items.reduce((sum, it) => {
    if (it.type === 'invoices') return sum + (Number(it.tjm) || 0);
    return sum;
  }, 0);
  const initDaysWorked = items.reduce((sum, it) => sum + (Number(it.daysWorked ?? it.jours ?? 0) || 0), 0);
  const initInvoiceAmount = items.reduce((sum, it) =>
    it.type === 'invoices' ? sum + (Number(it.total ?? it.invoiceAmount ?? 0) || 0) : sum, 0);

  const [tjm, setTjm] = useState(hideDolibarr ? (initTjm || 0) : 0);
  const [daysWorked, setDaysWorked] = useState(hideDolibarr ? (initDaysWorked || 0) : 0);

  const initSalaireBrut = items.reduce((sum, it) => sum + (Number(it.salaire_brut ?? it.salaireBrut) || 0), 0);
  const initNetApresPAS = items.reduce((sum, it) => sum + (Number(it.net_paye ?? it.salaireNetApresPAS) || 0), 0);
  const initNetAvantPAS = items.reduce((sum, it) => sum + (Number(it.net_avant_impot ?? it.salaireNetAvantPAS) || 0), 0);
  const initFraisRepas = items.reduce((sum, it) => sum + (Number(it.repas_restaurant ?? it.fraisRepas) || 0), 0);
  const initChargesPat = items.reduce((sum, it) => sum + (Number(it.total_charges_patronales ?? it.chargesPatronales) || 0), 0);
  const initChargesSal = items.reduce((sum, it) => sum + (Number(it.total_cotisations_salariales ?? it.chargesSalariales) || 0), 0);
  
  const initFraisKm = items.reduce((sum, it) => {
    if (it.type === 'mileage') return sum + (Number(it.fraisKilometriques ?? it.totalKms ?? it.total) || 0);
    return sum;
  }, 0);

  const initFraisAutres = items.reduce((sum, it) => {
    if (it.type === 'expenses') return sum + (Number(it.autresFrais ?? it.totalFrais ?? it.total) || 0);
    return sum;
  }, 0);

  const [salaireBrut, setSalaireBrut] = useState(initSalaireBrut);
  const [salaireNetApresPAS, setSalaireNetApresPAS] = useState(initNetApresPAS);
  const [salaireNetAvantPAS, setSalaireNetAvantPAS] = useState(initNetAvantPAS);
  const [fraisRepas, setFraisRepas] = useState(initFraisRepas);
  const [chargesPatronales, setChargesPatronales] = useState(initChargesPat);
  const [chargesSalariales, setChargesSalariales] = useState(initChargesSal);
  const [fraisKilometriques, setFraisKilometriques] = useState(initFraisKm);
  const [autresFrais, setAutresFrais] = useState(initFraisAutres);
  
  useEffect(() => {
    const newTjm = items.reduce((sum, it) => {
      if (it.type === 'invoices') return sum + (Number(it.tjm) || 0);
      return sum;
    }, 0);
    const newDaysWorked = items.reduce((sum, it) => sum + (Number(it.daysWorked ?? it.jours ?? 0) || 0), 0);
    const newSalaireBrut = items.reduce((sum, it) => sum + (Number(it.salaire_brut ?? it.salaireBrut) || 0), 0);
    const newNetApresPAS = items.reduce((sum, it) => sum + (Number(it.net_paye ?? it.salaireNetApresPAS) || 0), 0);
    const newNetAvantPAS = items.reduce((sum, it) => sum + (Number(it.net_avant_impot ?? it.salaireNetAvantPAS) || 0), 0);
    const newFraisRepas = items.reduce((sum, it) => sum + (Number(it.repas_restaurant ?? it.fraisRepas) || 0), 0);
    const newChargesPat = items.reduce((sum, it) => sum + (Number(it.total_charges_patronales ?? it.chargesPatronales) || 0), 0);
    const newChargesSal = items.reduce((sum, it) => sum + (Number(it.total_cotisations_salariales ?? it.chargesSalariales) || 0), 0);
    const newFraisKm = items.reduce((sum, it) => {
      if (it.type === 'mileage') return sum + (Number(it.fraisKilometriques ?? it.totalKms ?? it.total) || 0);
      return sum;
    }, 0);
    const newFraisAutres = items.reduce((sum, it) => {
      if (it.type === 'expenses') return sum + (Number(it.autresFrais ?? it.totalFrais ?? it.total) || 0);
      return sum;
    }, 0);

    if (hideDolibarr) {
      setTjm(newTjm);
      setDaysWorked(newDaysWorked);
    }
    setSalaireBrut(newSalaireBrut);
    setSalaireNetApresPAS(newNetApresPAS);
    setSalaireNetAvantPAS(newNetAvantPAS);
    setFraisRepas(newFraisRepas);
    setChargesPatronales(newChargesPat);
    setChargesSalariales(newChargesSal);
    setFraisKilometriques(newFraisKm);
    setAutresFrais(newFraisAutres);
  }, [items, hideDolibarr]);

  useEffect(() => {
    if (hideDolibarr) return;
    const fetchInvoices = async () => {
      try {
        const res = await api.get("/factures");
        if (Array.isArray(res.data)) {
          setInvoices(res.data);
          setFilteredInvoices(res.data);
        }
      } catch {
      }
    };
    fetchInvoices();
  }, [hideDolibarr]);

  useEffect(() => {
    const filterInvoices = () => {
      if (!invoices.length) {
        setFilteredInvoices([]);
        return;
      }

      const project = projects.find((p) => String(p.id) === String(projectId));
      if (!project) {
        setFilteredInvoices([]);
        setSelectedInvoiceId('');
        return;
      }

      const projectClientId = project.clientDolibarrId ? String(project.clientDolibarrId).trim() : null;
      const projectClientName = project.nomClient ? String(project.nomClient).trim().toLowerCase() : null;
      const projectTjm = project.tjm ? Number(project.tjm) : null;

      let startDate = null;
      let endDate = null;
      if (dateGroup && dateGroup !== 'Unknown') {
        const [year, month] = dateGroup.split('-');
        const y = parseInt(year);
        const m = parseInt(month);
        startDate = new Date(y, m - 1, 1, 0, 0, 0);
        endDate = new Date(y, m, 0, 23, 59, 59, 999);
      }

      const filtered = invoices.filter((inv) => {
        const invClientId = inv.idClient !== undefined && inv.idClient !== null ? String(inv.idClient).trim() : '';
        const invClientName = inv.nomClient ? String(inv.nomClient).trim().toLowerCase() : '';
        
        const clientMatch = (projectClientId && invClientId === projectClientId) ||
          (projectClientName && invClientName === projectClientName);
        
        if (!clientMatch) return false;

        if (projectTjm && projectTjm > 0) {
          if (!inv.lignes || inv.lignes.length === 0) return false;
          const hasMatchingLine = inv.lignes.some(line => {
            const lineTjm = parseFloat(line.subprice || line.price || 0);
            return lineTjm > 0 && Math.abs(lineTjm - projectTjm) <= 1;
          });
          if (!hasMatchingLine) return false;
        }

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
      if (selectedInvoiceId && !filtered.some((inv) => String(inv.id) === String(selectedInvoiceId))) {
        setSelectedInvoiceId('');
      }
    };
    filterInvoices();
  }, [invoices, projects, projectId, dateGroup, selectedInvoiceId]);

  useEffect(() => {
    if (projectId) {
      const proj = projects.find((p) => String(p.id) === String(projectId));
      if (proj && !daysWorked) {
        setTjm(proj.tjm || 0);
      }
    }
  }, [projectId, projects, daysWorked]);

  const handleDolibarrSync = async () => {
    if (!projectId) {
      toast.error('Veuillez sélectionner un projet');
      return;
    }
    if (!selectedInvoiceId) {
      toast.error('Veuillez sélectionner une facture Dolibarr');
      return;
    }

    setIsDolibarrLoading(true);
    const toastId = toast.loading('Récupération depuis Dolibarr...');
    try {
      const res = await api.get(`/factures/${selectedInvoiceId}`);
      const invoiceData = res.data;
      
      if (invoiceData.lignes && invoiceData.lignes.length > 0) {
        const primaryLine = invoiceData.lignes[0];
        setTjm(parseFloat(primaryLine.subprice || primaryLine.price || 0));
        setDaysWorked(parseFloat(primaryLine.qty || 0));
      }
      setInvoicePaid(invoiceData.payé === "1" || invoiceData.payé === 1 || invoiceData.statut === "2");
      
      toast.success('Données récupérées avec succès', { id: toastId });
    } catch {
      toast.error('Échec de la synchronisation', { id: toastId });
    } finally {
      setIsDolibarrLoading(false);
    }
  };

  const employeeProjects = projects.filter(p => 
    String(p.idEmployé) === String(employeeId) && 
    p.statut !== 'Terminé' && 
    p.statut !== 'Annulé'
  );

  const handleNumericChange = (setter) => (e) => {
    const { value } = e.target;
    setter(value === '' ? '' : value);
  };

  const toNumber = (value) => {
    if (value === '' || value === null || value === undefined) return 0;
    const parsed = parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!employeeId) {
      toast.error("Veuillez sélectionner un salarié pour cette période");
      return;
    }

    const monthStr = dateGroup !== 'Unknown' ? dateGroup : `${new Date().getFullYear()}-01`;

    const numericTjm = toNumber(tjm);
    const numericDaysWorked = toNumber(daysWorked);
    const numericSalaireBrut = toNumber(salaireBrut);
    const numericSalaireNetApresPAS = toNumber(salaireNetApresPAS);
    const numericSalaireNetAvantPAS = toNumber(salaireNetAvantPAS);
    const numericChargesPatronales = toNumber(chargesPatronales);
    const numericChargesSalariales = toNumber(chargesSalariales);
    const numericFraisRepas = toNumber(fraisRepas);
    const numericFraisKilometriques = toNumber(fraisKilometriques);
    const numericAutresFrais = toNumber(autresFrais);
    const numericSalaireNetHorsRepas = numericSalaireNetAvantPAS - numericFraisRepas;

    const multiplicateurPaiement = invoicePaid ? 1 : 0;
    const invoiceAmount = (hideDolibarr && initInvoiceAmount > 0
      ? initInvoiceAmount
      : numericTjm * numericDaysWorked) * multiplicateurPaiement;
    
    const totalPercu = numericSalaireNetAvantPAS + numericFraisKilometriques + numericAutresFrais;
    const totalFrais = numericFraisRepas + numericFraisKilometriques + numericAutresFrais;
    const totalCharges = numericChargesPatronales + numericChargesSalariales;
    const rentabilite = invoiceAmount - totalPercu;
    const pourcentageRentabilite = invoiceAmount > 0 ? (rentabilite / invoiceAmount) * 100 : 0;

    const initialData = {
      idEmployé: Number(employeeId),
      mois: monthStr,
      idProjet: projectId ? Number(projectId) : null,
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
      await addMonthlyData(initialData);
      toast.success(`Données enregistrées pour la période !`);
    } catch (error) {
      toast.error("Échec de l'enregistrement");
    }
  };

  const inputClass = `w-full px-4 py-2 border rounded-lg focus:ring-2 transition-all ${
    theme === 'dark' 
      ? 'bg-gray-800 border-gray-700 text-white focus:ring-[#7ED957]' 
      : 'bg-white border-gray-300 focus:ring-[#7ED957]'
  }`;
  
  const labelClass = `block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`;

  const filesList = items.map((it, idx) => {
    const isFee = it.type === 'expenses' || it.type === 'mileage';
    const Icon = isFee ? Receipt : FileText;
    const label = it.type === 'payslips' ? 'Fiche de paie' : (it.type === 'expenses' ? 'Notes de frais' : 'Frais KMs');
    return (
      <div key={idx} className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
         <Icon size={16} className={isFee ? 'text-[#7ED957]' : 'text-blue-500'} />
         <span className="font-semibold">{label}</span>: {it.filename || 'Inconnu'}
      </div>
    );
  });

  return (
    <ExtractionCardShell
      icon={Building2}
      iconColorClass="text-[#7ED957]"
      title="Données du mois"
      subtitle={<div className="mt-2 space-y-1">{filesList}</div>}
      theme={theme}
    >
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <AffectationSection
            theme={theme}
            employeeId={employeeId}
            setEmployeeId={setEmployeeId}
            projectId={projectId}
            setProjectId={setProjectId}
            employees={employees}
            employeeProjects={employeeProjects}
            fullWidth={true}
          >
            {!hideDolibarr && (
              <div className="mt-2 md:col-span-2">
                <label className={labelClass}>Facture</label>
                <div className="flex flex-col gap-2">
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
                    placeholder={filteredInvoices.length > 0 ? "Sélectionner une facture" : "Aucune facture détectée pour ce projet/mois"}
                    disabled={filteredInvoices.length === 0 || !projectId}
                    className="w-full"
                  />
                  <button
                    type="button"
                    onClick={handleDolibarrSync}
                    disabled={isDolibarrLoading || !selectedInvoiceId || !projectId}
                    className={`mt-2 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-bold transition-all shadow-sm ${
                      isDolibarrLoading || !selectedInvoiceId || !projectId
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    <RefreshCw size={18} className={isDolibarrLoading ? 'animate-spin' : ''} />
                    Extraire depuis la facture
                  </button>
                </div>
              </div>
            )}
          </AffectationSection>

          {/* Facturation Inputs */}
          <div className="col-span-1 md:col-span-2 space-y-4">
            <h4 className={`text-sm font-bold border-b pb-2 ${theme === 'dark' ? 'text-gray-300 border-gray-700' : 'text-gray-700 border-gray-200'}`}>Facturation</h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className={labelClass}>TJM (€)</label>
                <input type="number" step="any" value={tjm} onChange={handleNumericChange(setTjm)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Jours travaillés</label>
                <input type="number" step="any" value={daysWorked} onChange={handleNumericChange(setDaysWorked)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Facture (auto)</label>
                <div className="px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-800 dark:text-gray-200 font-semibold">
                  {formatCurrency(tjm * daysWorked * (invoicePaid ? 1 : 0))}
                </div>
              </div>
              <div>
                <label className={labelClass}>Payée ?</label>
                <div className="flex items-center h-10">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={invoicePaid}
                      onChange={(e) => setInvoicePaid(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#7ED957] dark:peer-focus:ring-[#7ED957] rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-[#7ED957]"></div>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Fiches de paie */}
          <div className="space-y-4">
            <h4 className={`text-sm font-bold border-b pb-2 ${theme === 'dark' ? 'text-gray-300 border-gray-700' : 'text-gray-700 border-gray-200'}`}>Fiche de paie</h4>
            <div>
              <label className={labelClass}>Salaire brut (€)</label>
              <input type="number" step="any" value={salaireBrut} onChange={handleNumericChange(setSalaireBrut)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Net Payé (€)</label>
              <input type="number" step="any" value={salaireNetApresPAS} onChange={handleNumericChange(setSalaireNetApresPAS)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Net avant Impôt (€)</label>
              <input type="number" step="any" value={salaireNetAvantPAS} onChange={handleNumericChange(setSalaireNetAvantPAS)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Charges patronales</label>
              <input type="number" step="any" value={chargesPatronales} onChange={handleNumericChange(setChargesPatronales)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Charges salariales</label>
              <input type="number" step="any" value={chargesSalariales} onChange={handleNumericChange(setChargesSalariales)} className={inputClass} />
            </div>
          </div>

          {/* Frais et KM */}
          <div className="space-y-4">
            <h4 className={`text-sm font-bold border-b pb-2 ${theme === 'dark' ? 'text-gray-300 border-gray-700' : 'text-gray-700 border-gray-200'}`}>Frais et Kilomètres</h4>
            <div>
              <label className={labelClass}>Autres Frais (€)</label>
              <input type="number" step="any" value={autresFrais} onChange={handleNumericChange(setAutresFrais)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Frais Repas (€)</label>
              <input type="number" step="any" value={fraisRepas} onChange={handleNumericChange(setFraisRepas)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Frais Kilométriques (€)</label>
              <input type="number" step="any" value={fraisKilometriques} onChange={handleNumericChange(setFraisKilometriques)} className={inputClass} />
            </div>
          </div>
        </div>

        {/* Calcul Automatique */}
        <div className="col-span-1 md:col-span-2 space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700 mt-6">
          <h4 className={`text-sm font-bold flex items-center gap-2 ${theme === 'dark' ? 'text-[#7ED957]' : 'text-green-600'}`}>
            <RefreshCw size={16} />
            Calcul automatique
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className={`p-8 rounded-2xl outline outline-1 outline-blue-500/20 shadow-lg ${theme === 'dark' ? 'bg-gray-900/50' : 'bg-white'}`}>
              <label className="text-xs uppercase tracking-widest font-bold opacity-60 mb-4 block">Net hors repas</label>
              <div className="text-xl font-black">
                {formatCurrency(toNumber(salaireNetAvantPAS) - toNumber(fraisRepas))}
              </div>
            </div>
            <div className={`p-8 rounded-2xl outline outline-1 outline-blue-500/20 shadow-lg ${theme === 'dark' ? 'bg-gray-900/50' : 'bg-white'}`}>
              <label className="text-xs uppercase tracking-widest font-bold opacity-60 mb-4 block">Total perçu</label>
              <div className="text-xl font-black">
                {formatCurrency(toNumber(salaireNetAvantPAS) + toNumber(fraisKilometriques) + toNumber(autresFrais))}
              </div>
            </div>
            <div className={`p-8 rounded-2xl outline outline-2 outline-[#7ED957]/40 shadow-xl ${theme === 'dark' ? 'bg-gray-900/50' : 'bg-green-50/10'}`}>
              <label className="text-xs uppercase tracking-widest font-bold mb-4 block text-[#7ED957]">Rentabilité</label>
              <div className={`text-2xl font-black ${((toNumber(hideDolibarr && initInvoiceAmount > 0 ? initInvoiceAmount : toNumber(tjm) * toNumber(daysWorked)) * (invoicePaid ? 1 : 0)) - (toNumber(salaireNetAvantPAS) + toNumber(fraisKilometriques) + toNumber(autresFrais))) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {formatCurrency((toNumber(hideDolibarr && initInvoiceAmount > 0 ? initInvoiceAmount : toNumber(tjm) * toNumber(daysWorked)) * (invoicePaid ? 1 : 0)) - (toNumber(salaireNetAvantPAS) + toNumber(fraisKilometriques) + toNumber(autresFrais)))}
              </div>
            </div>
            <div className={`p-8 rounded-2xl outline outline-2 outline-[#7ED957]/20 shadow-xl ${theme === 'dark' ? 'bg-gray-900/50' : 'bg-gray-50'}`}>
              <label className="text-xs uppercase tracking-widest font-bold mb-4 block text-[#7ED957]">Marge %</label>
              <div className="text-2xl font-black">
                {(() => {
                  const baseRevenue = toNumber(hideDolibarr && initInvoiceAmount > 0 ? initInvoiceAmount : toNumber(tjm) * toNumber(daysWorked));
                  const revenue = baseRevenue * (invoicePaid ? 1 : 0);
                  const getPercu = toNumber(salaireNetAvantPAS) + toNumber(fraisKilometriques) + toNumber(autresFrais);
                  const profit = revenue - getPercu;
                  return revenue > 0 ? `${((profit / revenue) * 100).toFixed(1)} %` : '0.00 %';
                })()}
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end mt-4">
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-2 bg-[#7ED957] text-white font-semibold rounded-lg hover:bg-green-500 transition-colors shadow-sm"
          >
            <Save size={18} />
            Enregistrer la période
          </button>
        </div>
      </form>
    </ExtractionCardShell>
  );
};

export default UnifiedResultCard;
