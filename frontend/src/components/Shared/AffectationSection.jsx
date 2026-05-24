import React from 'react';
import { Building2 } from 'lucide-react';

const AffectationSection = ({
  theme,
  employeeId,
  setEmployeeId,
  projectId,
  setProjectId,
  employees,
  employeeProjects,
  fullWidth = false,
  children
}) => {
  const inputClass = `w-full px-4 py-2 border rounded-lg focus:ring-2 transition-all ${
    theme === 'dark' 
      ? 'bg-gray-800 border-gray-700 text-white focus:ring-[#7ED957]' 
      : 'bg-white border-gray-300 focus:ring-blue-500'
  }`;
  
  const labelClass = `block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`;

  return (
    <div className={`${fullWidth ? 'col-span-1 md:col-span-2' : ''} p-4 rounded-lg border ${theme === 'dark' ? 'bg-gray-900/50 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
      <h4 className={`text-sm font-bold mb-4 flex items-center gap-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
        <Building2 size={16} /> Affectation
      </h4>
      <div className={`grid grid-cols-1 ${fullWidth ? 'md:grid-cols-2 gap-4' : 'space-y-4'}`}>
        <div className={!fullWidth ? 'mb-4' : ''}>
          <label className={labelClass}>Salarié concerné</label>
          <select
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            className={inputClass}
          >
            <option value="">-- Sélectionner --</option>
            {employees.map(emp => (
              <option key={emp.id} value={emp.id}>{emp.nom || emp.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Projet associé</label>
          <select
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            className={inputClass}
            disabled={!employeeId}
          >
            <option value="">-- Aucun projet --</option>
            {employeeProjects.map(project => (
              <option key={project.id} value={project.id}>
                {project.titre || project.title} {project.référence || project.ref ? `(${project.référence || project.ref})` : ''}
              </option>
            ))}
          </select>
        </div>
        {children}
      </div>
    </div>
  );
};

export default AffectationSection;
