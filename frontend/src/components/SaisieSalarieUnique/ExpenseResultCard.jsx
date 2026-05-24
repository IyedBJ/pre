import React, { useState } from 'react';
import { Receipt, Save } from 'lucide-react';
import { useData } from '../../context/DataContext';
import toast from 'react-hot-toast';
import ExtractionCardShell from '../Shared/ExtractionCardShell';
import AffectationSection from '../Shared/AffectationSection';

const ExpenseResultCard = ({ 
  result, 
  formatCurrency, 
  defaultEmployeeId,
  theme 
}) => {
  const { addMonthlyData, projects, employees } = useData();
  
  const [employeeId, setEmployeeId] = useState(defaultEmployeeId || '');
  const [projectId, setProjectId] = useState('');

  const initAutresFrais = result.autresFrais ?? result.totalFrais ?? result.total ?? 0;
  const [autresFrais, setAutresFrais] = useState(initAutresFrais);

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
      toast.error("Veuillez sélectionner un salarié pour cette note");
      return;
    }

    const dateGroup = result.date_group && result.date_group !== 'Unknown' 
      ? result.date_group 
      : `${new Date().getFullYear()}-01`;

    const numericAutresFrais = toNumber(autresFrais);

    const initialData = {
      id: `${employeeId}-${dateGroup}-exp-${Date.now()}`,
      idEmployé: employeeId,
      mois: dateGroup,
      idProjet: projectId || null,
      salaireBrut: 0,
      salaireNetApresPAS: 0,
      salaireNetAvantPAS: 0,
      chargesPatronales: 0,
      chargesSalariales: 0,
      tjm: 0, joursTravaillés: 0, montantFacturé: 0, extra: 0,
      salaireNetHorsRepas: 0,
      fraisRepas: 0,
      fraisKilometriques: 0, 
      autresFrais: numericAutresFrais
    };

    try {
      await addMonthlyData(initialData);
      toast.success(`Données pour ${result.filename || 'la note de frais'} enregistrées !`);
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

  return (
    <ExtractionCardShell
      icon={Receipt}
      iconColorClass="text-[#7ED957]"
      title={result.filename || 'Notes de frais'}
      subtitle={<>Période : <span className="font-semibold">{result.date_group !== 'Unknown' ? result.date_group : 'A préciser'}</span></>}
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
          />

          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className={labelClass}>Autres Frais (€)</label>
              <input type="number" step="any" value={autresFrais} onChange={handleNumericChange(setAutresFrais)} className={inputClass} />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-2 bg-[#7ED957] text-white font-semibold rounded-lg hover:bg-green-500 transition-colors shadow-sm"
          >
            <Save size={18} />
            Enregistrer la note de frais
          </button>
        </div>
      </form>
    </ExtractionCardShell>
  );
};

export default ExpenseResultCard;
