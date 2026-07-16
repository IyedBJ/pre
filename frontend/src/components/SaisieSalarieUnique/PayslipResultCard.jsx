import React, { useState } from 'react';
import { FileText, Save } from 'lucide-react';
import { useData } from '../../context/DataContext';
import toast from 'react-hot-toast';
import ExtractionCardShell from '../Shared/ExtractionCardShell';
import AffectationSection from '../Shared/AffectationSection';

const PayslipResultCard = ({ 
  result, 
  formatCurrency, 
  defaultEmployeeId,
  theme 
}) => {
  const { addMonthlyData, projects, employees } = useData();
  
  const [employeeId, setEmployeeId] = useState(defaultEmployeeId || '');
  const [projectId, setProjectId] = useState('');

  const initSalaireBrut = result.salaire_brut ?? result.salaireBrut ?? 0;
  const initNetApresPAS = result.net_paye ?? result.salaireNetApresPAS ?? 0;
  const initNetAvantPAS = result.net_avant_impot ?? result.salaireNetAvantPAS ?? 0;
  const initFraisRepas = result.repas_restaurant ?? result.fraisRepas ?? 0;
  const initChargesPatronales = result.total_charges_patronales ?? result.chargesPatronales ?? 0;
  const initChargesSalariales = result.total_cotisations_salariales ?? result.chargesSalariales ?? 0;

  const [salaireBrut, setSalaireBrut] = useState(initSalaireBrut);
  const [salaireNetApresPAS, setSalaireNetApresPAS] = useState(initNetApresPAS);
  const [salaireNetAvantPAS, setSalaireNetAvantPAS] = useState(initNetAvantPAS);
  const [chargesPatronales, setChargesPatronales] = useState(initChargesPatronales);
  const [chargesSalariales, setChargesSalariales] = useState(initChargesSalariales);

  const employeeProjects = projects.filter(p => String(p.idEmployé) === String(employeeId));

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
      toast.error("Veuillez sélectionner un salarié pour cette fiche");
      return;
    }

    const dateGroup = result.date_group && result.date_group !== 'Unknown' 
      ? result.date_group 
      : `${new Date().getFullYear()}-01`;

    const numericSalaireBrut = toNumber(salaireBrut);
    const numericSalaireNetApresPAS = toNumber(salaireNetApresPAS);
    const numericSalaireNetAvantPAS = toNumber(salaireNetAvantPAS);
    const numericChargesPatronales = toNumber(chargesPatronales);
    const numericChargesSalariales = toNumber(chargesSalariales);

    const initialData = {
      id: `${employeeId}-${dateGroup}-${Date.now()}`, 
      idEmployé: employeeId,
      mois: dateGroup,
      idProjet: projectId || null,
      salaireBrut: numericSalaireBrut,
      salaireNetApresPAS: numericSalaireNetApresPAS,
      salaireNetAvantPAS: numericSalaireNetAvantPAS,
      chargesPatronales: numericChargesPatronales,
      chargesSalariales: numericChargesSalariales,
      tjm: 0, joursTravaillés: 0, montantFacturé: 0, extra: 0,
      salaireNetHorsRepas: numericSalaireNetApresPAS - initFraisRepas,
      fraisRepas: initFraisRepas,
      fraisKilometriques: 0, 
      autresFrais: 0
    };

    try {
      await addMonthlyData(initialData);
      toast.success(`Données pour ${result.filename || 'la fiche'} enregistrées !`);
    } catch (error) {
      toast.error("Échec de l'enregistrement");
    }
  };

  const inputClass = `w-full px-4 py-2 border rounded-lg focus:ring-2 transition-all ${
    theme === 'dark' 
      ? 'bg-gray-800 border-gray-700 text-white focus:ring-blue-500' 
      : 'bg-white border-gray-300 focus:ring-blue-500'
  }`;
  
  const labelClass = `block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`;

  return (
    <ExtractionCardShell
      icon={FileText}
      iconColorClass="text-blue-500"
      title={result.filename || 'Fiche de paie'}
      subtitle={<>Période détectée : <span className="font-semibold">{result.date_group !== 'Unknown' ? result.date_group : 'Non détectée'}</span></>}
      theme={theme}
      isExpandedInitial={false}
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
          />

          {/* Données extraites */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
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
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-2 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition-colors shadow-sm"
          >
            <Save size={18} />
            Enregistrer les données de la fiche
          </button>
        </div>
      </form>
    </ExtractionCardShell>
  );
};

export default PayslipResultCard;
