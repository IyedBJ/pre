import React, { useState } from 'react';
import { Calendar, Save } from 'lucide-react';
import { useData } from '../../context/DataContext';
import toast from 'react-hot-toast';
import EditableRow from './EditableRow';
import SourceTable from './SourceTable';

const MonthlyEditableBlock = ({ 
  group, 
  results, 
  formatCurrency, 
  employeeId, 
  formatGroupTitle, 
  getTypeLabel, 
  theme 
}) => {
  const { addMonthlyData, projects } = useData();

  const employeeProjects = projects.filter(p => String(p.idEmployé) === String(employeeId));

  const handleNumericChange = (setter) => (e) => {
    const { value } = e.target;
    setter(value === '' ? '' : value);
  };

  const handleIntegerChange = (setter) => (e) => {
    const { value } = e.target;
    if (value === '') {
      setter('');
      return;
    }
    // Automatically round to integer
    const num = Math.round(parseFloat(value));
    setter(isNaN(num) ? '' : num.toString());
  };

  const toNumber = (value) => {
    if (value === '' || value === null || value === undefined) return 0;
    const parsed = parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  // Aggregate extraction logic
  const initTjm = Math.max(...results.filter(r => r.type === 'invoice').map(r => r.tjm || 0), 0);
  const initDays = Math.round(results.filter(r => r.type === 'invoice').reduce((s, r) => s + (r.days || 0), 0));
  
  const payslip = results.find(r => r.type === 'payslip' || r.type === 'payslips') || {};
  const initSalaireBrut = payslip.salaire_brut ?? payslip.salaireBrut ?? 0;
  const initNetApresPAS = payslip.net_paye ?? payslip.salaireNetApresPAS ?? 0;
  const initNetAvantPAS = payslip.net_avant_impot ?? payslip.salaireNetAvantPAS ?? 0;
  const initFraisRepas = payslip.repas_restaurant ?? payslip.fraisRepas ?? 0;
  const initNetHorsRepas = payslip.salaireNetHorsRepas ?? (initFraisRepas ? Math.max(0, initNetApresPAS - initFraisRepas) : initNetApresPAS);
  const initChargesPatronales = payslip.total_charges_patronales ?? payslip.chargesPatronales ?? 0;
  const initChargesSalariales = payslip.total_cotisations_salariales ?? payslip.chargesSalariales ?? 0;

  const initAutresFrais = results.filter(r => r.type === 'expenses').reduce((s, r) => s + (r.total || 0), 0);
  const initKilometriques = results.filter(r => r.type === 'mileage').reduce((s, r) => s + (r.total || 0), 0);

  // States
  const [tjm, setTjm] = useState(initTjm);
  const [daysWorked, setDaysWorked] = useState(initDays);
  const [invoicePaid, setInvoicePaid] = useState(false);
  const [salaireBrut, setSalaireBrut] = useState(initSalaireBrut);
  const [salaireNetApresPAS, setSalaireNetApresPAS] = useState(initNetApresPAS);
  const [salaireNetAvantPAS, setSalaireNetAvantPAS] = useState(initNetAvantPAS);
  const [salaireNetHorsRepas, setSalaireNetHorsRepas] = useState(initNetHorsRepas);
  const [fraisRepas, setFraisRepas] = useState(initFraisRepas);
  const [fraisKilometriques, setFraisKilometriques] = useState(initKilometriques);
  const [autresFrais, setAutresFrais] = useState(initAutresFrais);
  const [extra, setExtra] = useState(0);
  const [chargesPatronales, setChargesPatronales] = useState(initChargesPatronales);
  const [chargesSalariales, setChargesSalariales] = useState(initChargesSalariales);
  const [projectId, setProjectId] = useState('');
  const [expandedSection, setExpandedSection] = useState(null);

  const numericTjm = toNumber(tjm);
  const numericDaysWorked = toNumber(daysWorked);
  const numericSalaireBrut = toNumber(salaireBrut);
  const numericSalaireNetApresPAS = toNumber(salaireNetApresPAS);
  const numericSalaireNetAvantPAS = toNumber(salaireNetAvantPAS);
  const numericSalaireNetHorsRepas = toNumber(salaireNetHorsRepas);
  const numericFraisRepas = toNumber(fraisRepas);
  const numericFraisKilometriques = toNumber(fraisKilometriques);
  const numericAutresFrais = toNumber(autresFrais);
  const numericExtra = toNumber(extra);
  const numericChargesPatronales = toNumber(chargesPatronales);
  const numericChargesSalariales = toNumber(chargesSalariales);

  const multiplicateurPaiement = invoicePaid ? 1 : 0;
  const invoiceAmount = numericTjm * numericDaysWorked * multiplicateurPaiement;
  const totalFacture = invoiceAmount + numericExtra;
  const totalFrais = numericFraisRepas + numericFraisKilometriques + numericAutresFrais;
  const totalPercuSalarie = numericSalaireNetApresPAS + totalFrais;
  const totalCharges = numericChargesPatronales + numericChargesSalariales;
  const coutTotal = numericSalaireBrut + totalFrais + totalCharges;
  const rentabilite = totalFacture - coutTotal;
  const pourcentageRentabilite = totalFacture > 0 ? (rentabilite / totalFacture) * 100 : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    /*
    if (!employeeId) {
      toast.error('Veuillez sélectionner un salarié en haut de la page');
      return;
    }
    */
    
    let dateGroup = results.find(r => r.date_group && r.date_group !== 'Unknown')?.date_group;
    if (!dateGroup) {
      const currentYear = new Date().getFullYear();
      dateGroup = /^\d{4}-\d{2}$/.test(group) ? group : `${currentYear}-${group}`;
    }

    const monthlyData = {
      id: `${employeeId}-${dateGroup}`,
      employeeId,
      month: dateGroup,
      tjm: numericTjm,
      daysWorked: numericDaysWorked,
      invoiceAmount,
      extra: numericExtra,
      invoicePaid,
      salaireBrut: numericSalaireBrut,
      salaireNetApresPAS: numericSalaireNetApresPAS,
      salaireNetAvantPAS: numericSalaireNetAvantPAS,
      salaireNetHorsRepas: numericSalaireNetHorsRepas,
      fraisRepas: numericFraisRepas,
      fraisKilometriques: numericFraisKilometriques,
      autresFrais: numericAutresFrais,
      chargesPatronales: numericChargesPatronales,
      chargesSalariales: numericChargesSalariales,
      totalPercu: totalFacture, // Map totalFacture to totalPercu in DB for backward compatibility or clarity
      totalFrais,
      totalCharges,
      coutTotal,
      rentabilite,
      pourcentageRentabilite,
      projectId: projectId || null
    };

    try {
      await addMonthlyData(monthlyData);
      toast.success('Données consolidées enregistrées dans la base !');
    } catch (error) {
      console.error('Échec de sauvegarde consolidée :', error);
      const message = error?.response?.data?.message || 'Échec de l\'enregistrement des données consolidées';
      toast.error(message);
    }
  };

  const inputClass = `w-full px-4 py-2 border rounded-lg focus:ring-2 transition-all ${
    theme === 'dark' 
      ? 'bg-gray-800 border-gray-700 text-white focus:ring-green-500' 
      : 'bg-white border-gray-300 focus:ring-[#7ED957]'
  }`;

  const labelClass = `block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`;

  return (
    <div className={`rounded-2xl shadow-xl border overflow-hidden mb-6 transition-colors ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
      <div className={`p-6 border-b flex justify-between items-center ${
        theme === 'dark' ? 'border-gray-700 bg-gradient-to-r from-gray-900 to-gray-800' : 'border-gray-50 bg-gradient-to-r from-gray-50 to-white'
      }`}>
        <h2 className={`text-xl font-bold flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
          <Calendar size={24} className="text-[#7ED957]" />
          {formatGroupTitle(group)}
        </h2>
        <span className="px-3 py-1 bg-[#7ED957]/10 text-[#7ED957] rounded-full text-sm font-bold">
          Total Marge : {formatCurrency(rentabilite)}
        </span>
      </div>

      <div className={`p-6 ${theme === 'dark' ? 'bg-gray-900/50' : 'bg-gray-50/50'}`}>
        <form onSubmit={handleSubmit}>
          {/* Project Selection */}
          <div className="mb-6">
            <label className={labelClass}>Projet associé (Optionnel)</label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className={inputClass}
            >
              <option value="">-- Aucun projet spécifique --</option>
              {employeeProjects.map(project => (
                <option key={project.id} value={project.id}>
                  {project.titre} {project.référence ? `(${project.référence})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-4 mb-8">
            {/* Facturation */}
            <EditableRow
              title="Factures"
              subtitle={`${formatCurrency(invoiceAmount)} (TJM: ${formatCurrency(numericTjm)} / ${numericDaysWorked}j)`}
              amount={formatCurrency(invoiceAmount)}
              iconColor="bg-[#7ED957]"
              textColor="text-[#7ED957]"
              isExpanded={expandedSection === 'facture'}
              onToggle={() => setExpandedSection(expandedSection === 'facture' ? null : 'facture')}
              theme={theme}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className={labelClass}>TJM (€)</label>
                  <input type="number" step="any" value={tjm} onChange={handleNumericChange(setTjm)} className={inputClass} min="0" />
                </div>
                <div>
                  <label className={labelClass}>Jours travaillés</label>
                  <input type="number" step="1" value={daysWorked} onChange={handleIntegerChange(setDaysWorked)} className={inputClass} min="0" />
                </div>
                <div>
                  <label className={labelClass}>Extra (€)</label>
                  <input type="number" step="any" value={extra} onChange={handleNumericChange(setExtra)} className={inputClass} min="0" />
                </div>
                <div>
                  <label className={labelClass}>Payée ?</label>
                  <div className="flex items-center h-10">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked={invoicePaid} onChange={(e) => setInvoicePaid(e.target.checked)} className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#7ED957] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#7ED957]"></div>
                    </label>
                    <span className={`ml-3 text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{invoicePaid ? 'Oui' : 'Non'}</span>
                  </div>
                </div>
              </div>
            </EditableRow>

            {/* Salaire */}
            <EditableRow
              title="Salaires et Charges (Paie)"
              subtitle={`Net payé: ${formatCurrency(numericSalaireNetApresPAS)} / Charges: ${formatCurrency(totalCharges)}`}
              amount={formatCurrency(numericSalaireNetApresPAS)}
              iconColor="bg-blue-500"
              textColor="text-blue-600"
              isExpanded={expandedSection === 'salaire'}
              onToggle={() => setExpandedSection(expandedSection === 'salaire' ? null : 'salaire')}
              theme={theme}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div>
                  <label className={labelClass}>Salaire brut (€)</label>
                  <input type="number" step="any" value={salaireBrut} onChange={handleNumericChange(setSalaireBrut)} className={inputClass} min="0" />
                </div>
                <div>
                  <label className={labelClass}>Net après PAS (€)</label>
                  <input type="number" step="any" value={salaireNetApresPAS} onChange={handleNumericChange(setSalaireNetApresPAS)} className={inputClass} min="0" />
                </div>
                <div>
                  <label className={labelClass}>Net avant PAS (€)</label>
                  <input type="number" step="any" value={salaireNetAvantPAS} onChange={handleNumericChange(setSalaireNetAvantPAS)} className={inputClass} min="0" />
                </div>
                <div>
                  <label className={labelClass}>Net hors repas (€)</label>
                  <input type="number" step="any" value={salaireNetHorsRepas} onChange={handleNumericChange(setSalaireNetHorsRepas)} className={inputClass} min="0" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className={labelClass}>Charges patronales (€)</label>
                  <input type="number" step="any" value={chargesPatronales} onChange={handleNumericChange(setChargesPatronales)} className={inputClass} min="0" />
                </div>
                <div>
                  <label className={labelClass}>Charges salariales (€)</label>
                  <input type="number" step="any" value={chargesSalariales} onChange={handleNumericChange(setChargesSalariales)} className={inputClass} min="0" />
                </div>
              </div>
            </EditableRow>

            {/* Notes de frais */}
            <EditableRow
              title="Notes de frais"
              subtitle={`Repas: ${formatCurrency(numericFraisRepas)} / Autres: ${formatCurrency(numericAutresFrais)}`}
              amount={formatCurrency(numericFraisRepas + numericAutresFrais)}
              iconColor="bg-purple-500"
              textColor="text-purple-600"
              isExpanded={expandedSection === 'frais'}
              onToggle={() => setExpandedSection(expandedSection === 'frais' ? null : 'frais')}
              theme={theme}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Frais repas (€)</label>
                  <input type="number" step="any" value={fraisRepas} onChange={handleNumericChange(setFraisRepas)} className={inputClass} min="0" />
                </div>
                <div>
                  <label className={labelClass}>Autres frais (€)</label>
                  <input type="number" step="any" value={autresFrais} onChange={handleNumericChange(setAutresFrais)} className={inputClass} min="0" />
                </div>
              </div>
            </EditableRow>

            {/* Kilométrique */}
            <EditableRow
              title="Frais Kilométriques"
              subtitle={`Total KM: ${formatCurrency(numericFraisKilometriques)}`}
              amount={formatCurrency(numericFraisKilometriques)}
              iconColor="bg-orange-500"
              textColor="text-orange-600"
              isExpanded={expandedSection === 'kms'}
              onToggle={() => setExpandedSection(expandedSection === 'kms' ? null : 'kms')}
              theme={theme}
            >
              <div>
                <label className={labelClass}>Total KM (€)</label>
                <input type="number" step="any" value={fraisKilometriques} onChange={handleNumericChange(setFraisKilometriques)} className={`${inputClass} max-w-sm`} min="0" />
              </div>
            </EditableRow>
          </div>

          {/* Résumé Financier */}
          <div className={`rounded-xl shadow-sm p-6 border mb-8 flex flex-col md:flex-row items-center justify-between gap-6 ${
            theme === 'dark' ? 'bg-[#7ED957]/10 border-[#7ED957]/30' : 'bg-gradient-to-br from-[#7ED957]/10 to-[#7ED957]/5 border-[#7ED957]/20'
          }`}>
            <div className="flex items-center gap-8 w-full md:w-auto overflow-x-auto pb-4 md:pb-0">
              <div>
                <p className={`text-sm mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Total Facturé</p>
                <p className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-black'}`}>{formatCurrency(totalFacture)}</p>
              </div>
              <div className={`w-px h-10 ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-300'}`}></div>
              <div>
                <p className={`text-sm mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Total Perçu (Salarié)</p>
                <p className={`text-xl font-bold ${theme === 'dark' ? 'text-[#7ED957]' : 'text-green-600'}`}>{formatCurrency(totalPercuSalarie)}</p>
              </div>
              <div className={`w-px h-10 ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-300'}`}></div>
              <div>
                <p className={`text-sm mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Coût total</p>
                <p className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-black'}`}>{formatCurrency(coutTotal)}</p>
              </div>
              <div className={`w-px h-10 ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-300'}`}></div>
              <div>
                <p className={`text-sm mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Rentabilité</p>
                <p className={`text-xl font-bold ${rentabilite >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {formatCurrency(rentabilite)} <span className={`text-sm ml-1 ${theme === 'dark' ? 'text-gray-400' : ''}`}>({pourcentageRentabilite.toFixed(1)}%)</span>
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-4 justify-end">
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-3 bg-[#7ED957] text-black font-semibold rounded-lg hover:bg-[#6FC847] transition-colors shadow-sm active:scale-95"
            >
              <Save size={20} />
              Enregistrer pour {formatGroupTitle(group)}
            </button>
          </div>
        </form>

        <SourceTable 
          results={results} 
          formatCurrency={formatCurrency} 
          getTypeLabel={getTypeLabel} 
          theme={theme} 
        />
      </div>
    </div>
  );
};

export default MonthlyEditableBlock;
