import React from 'react';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Users, Calendar, Receipt } from 'lucide-react';
import Autocomplete from '../Shared/Autocomplete';

const SalarieHeader = ({ 
  selectedEmployeeId, 
  setSelectedEmployeeId, 
  startDate, 
  setStartDate, 
  endDate, 
  setEndDate, 
  selectedInvoiceIds, 
  setSelectedInvoiceIds, 
  filteredInvoices, 
  employees, 
  theme 
}) => {
  return (
    <>
      <div className="mb-8">
        <h1 className={`text-3xl font-bold flex items-center gap-3 ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
          <Users size={32} className="text-[#7ED957]" />
          Saisie individuelle multi-période
        </h1>
        <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
          Extraction automatisée par mois via ZIP pour un salarié précis.
        </p>
      </div>

      <div className="grid grid-cols-1 mb-8">
        {/* Sélection Salarié */}
        <div className={`p-6 rounded-2xl border shadow-sm space-y-6 ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
          <div>
            <label className={`block text-sm font-bold mb-2 flex items-center gap-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
              <Users size={18} className="text-[#7ED957]" />
              Choisir le salarié
            </label>
            <Autocomplete
              value={selectedEmployeeId}
              onChange={setSelectedEmployeeId}
              options={employees.map((emp) => ({
                id: emp.id,
                name: `${emp.nom} — ${emp.rôle}`
              }))}
              placeholder="Sélectionner un salarié d'affectation par défaut"
              className="w-full"
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default SalarieHeader;
