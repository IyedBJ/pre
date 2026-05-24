import React, { useState } from 'react';
import { User, CheckCircle2, AlertCircle, ChevronDown, ChevronRight, UserCheck, FileText, Receipt } from 'lucide-react';
import UnifiedResultCard from '../SaisieSalarieUnique/UnifiedResultCard';

const MONTH_NAMES = {
  "01": "Janvier", "02": "Février", "03": "Mars", "04": "Avril",
  "05": "Mai", "06": "Juin", "07": "Juillet", "08": "Août",
  "09": "Septembre", "10": "Octobre", "11": "Novembre", "12": "Décembre"
};

const UnidentifiedItemRow = ({ item, idx, employees, onAssign, employeeKey, selectCls, theme }) => {
  const [localTarget, setLocalTarget] = useState('');
  const isFee = item.type === 'expenses' || item.type === 'mileage';
  const Icon = isFee ? Receipt : FileText;

  return (
    <div className={`flex flex-wrap items-center gap-3 p-3 rounded-lg border bg-white dark:bg-gray-900 ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
      <div className="flex items-center gap-2 flex-1 min-w-[200px]">
        <Icon size={16} className={isFee ? 'text-[#7ED957]' : 'text-blue-500'} />
        <span className="text-sm font-medium truncate max-w-[250px]" title={item.filename}>
          {item.filename || 'Fichier inconnu'}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <select
          value={localTarget}
          onChange={e => setLocalTarget(e.target.value)}
          className={selectCls}
        >
          <option value="">— Salarié —</option>
          {employees.map(emp => (
            <option key={emp.id} value={emp.id}>{emp.nom}</option>
          ))}
        </select>
        <button
          disabled={!localTarget}
          onClick={(e) => {
            e.stopPropagation();
            onAssign?.(employeeKey, idx, localTarget);
          }}
          className="p-2 bg-[#7ED957] text-black rounded-lg hover:bg-[#6FC847] disabled:opacity-30 transition-all"
          title="Assigner"
        >
          <UserCheck size={16} />
        </button>
      </div>
    </div>
  );
};

const GroupResultSection = ({
  employeeKey,
  employeeName,
  matchedEmployeeId,
  items,
  dateGroup,
  formatCurrency,
  theme,
  employees = [],
  onAssign
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const isIdentified = !!matchedEmployeeId;

  const cardBg    = theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
  const headerBg  = theme === 'dark' ? 'bg-gray-900/60 hover:bg-gray-900/80' : 'bg-slate-50 hover:bg-slate-100';
  const selectCls = `text-sm px-3 py-1.5 rounded-lg border font-medium focus:ring-2 focus:ring-[#7ED957] outline-none transition-all ${
    theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-800'
  }`;

  const [year, month] = (dateGroup || '').split('-');
  const formattedPeriod =
    year && month ? `${MONTH_NAMES[month] || month} ${year}` : dateGroup || 'Période inconnue';

  return (
    <div className={`rounded-2xl border shadow-sm overflow-hidden transition-colors ${cardBg}`}>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div
        className={`flex items-center justify-between px-6 py-4 cursor-pointer transition-colors ${headerBg}`}
        onClick={() => setIsOpen(p => !p)}
      >
        <div className="flex items-center gap-4">
          <div className={`p-2 rounded-full ${
            isIdentified ? 'bg-[#7ED957]/20 text-[#7ED957]' : 'bg-orange-100 text-orange-500'
          }`}>
            <User size={22} />
          </div>

          <div>
            <h3 className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              {employeeName || 'Fichiers non identifiés'}
            </h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex items-center gap-1 ${
                isIdentified
                  ? 'bg-green-100 text-green-700'
                  : 'bg-orange-100 text-orange-600'
              }`}>
                {isIdentified
                  ? <><CheckCircle2 size={11} /> Identifié automatiquement</>
                  : <><AlertCircle size={11} /> À assigner manuellement</>}
              </span>
              <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                · {items.length} fichier{items.length > 1 ? 's' : ''} — {formattedPeriod}
              </span>
            </div>
          </div>
        </div>

        {isOpen
          ? <ChevronDown size={20} className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} />
          : <ChevronRight size={20} className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} />
        }
      </div>

      {/* ── Content ────────────────────────────────────────────────────── */}
      {isOpen && (
        <div className="px-6 pb-6 pt-4">

          {/* Manual assignment list (only for unidentified groups) */}
          {!isIdentified && (
            <div className="space-y-3 mb-6">
              <div className={`p-4 rounded-xl border ${theme === 'dark' ? 'bg-orange-900/10 border-orange-700/30' : 'bg-orange-50/50 border-orange-100'}`}>
                 <div className="flex items-center gap-2 mb-3 text-orange-600 dark:text-orange-400">
                    <AlertCircle size={18} />
                    <span className="text-sm font-bold">Assignation individuelle des fichiers</span>
                 </div>
                 
                 <div className="space-y-2">
                    {items.map((item, idx) => (
                      <UnidentifiedItemRow 
                        key={`${item.filename}-${idx}`}
                        item={item} 
                        idx={idx} 
                        employees={employees}
                        onAssign={onAssign}
                        employeeKey={employeeKey}
                        selectCls={selectCls}
                        theme={theme}
                      />
                    ))}
                 </div>
              </div>
            </div>
          )}

          {/* UnifiedResultCard — only for identified employees */}
          {isIdentified && (
            <UnifiedResultCard
              items={items}
              dateGroup={dateGroup}
              formatCurrency={formatCurrency}
              defaultEmployeeId={matchedEmployeeId || ''}
              theme={theme}
              hideDolibarr={false}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default GroupResultSection;
