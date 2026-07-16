import { useMemo, useState, useEffect } from 'react';
import { 
  CalendarRange, 
  Database, 
  RefreshCw, 
  Search, 
  User as UserIcon, 
  Briefcase, 
  Calendar,
  ChevronDown,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  XCircle,
  Download
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useData } from '../context/DataContext';
import { useTheme } from '../context/ThemeContext';
import ForecastingAlert from '../components/Common/ForecastingAlert';
// fomrmater monétaire pour l'euro
const formatCurrency = (value = 0) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR'
  }).format(Number(value) || 0);
};
// Noms des mois en français pour l'affichage dans les tableaux et les exports Excel
const MONTH_NAMES = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
];
//  Composant principal de la page d'historique, affichant les données mensuelles par employé et projet, avec des fonctionnalités de recherche, de filtrage par année, d'export Excel et d'affichage conditionnel des prévisions de rentabilité
const Historique = () => {
  const { monthlyData, employees, projects, loading, fetchMonthlyData, fetchEmployees, fetchProjects } = useData();
  const { theme } = useTheme();
  const [search, setSearch] = useState('');
  const [selectedYear, setSelectedYear] = useState(null); // Année sélectionnée pour filtrer les données
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [expandedEmployees, setExpandedEmployees] = useState(new Set());
  const [expandedProjects, setExpandedProjects] = useState(new Set());
// Fonction de rafraîchissement des données, qui recharge les données mensuelles, les employés et les projets, avec une gestion de l'état de chargement pour afficher un indicateur de rafraîchissement
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([fetchMonthlyData(), fetchEmployees(), fetchProjects()]);
    } finally {
      setIsRefreshing(false);
    }
  };
  //  agrandir ou réduire la section d’un employé. Si son id est déjà dans l’ensemble, on l’enlève (réduit), sinon on l’ajoute (déplie).

  const toggleEmployee = (id) => {
    const next = new Set(expandedEmployees);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedEmployees(next);
  };
// Fonction de basculement de l'affichage des détails d'un projet, en ajoutant ou supprimant son ID de l'ensemble des projets developpés
  const toggleProject = (empId, projId) => {
    const key = `${empId}-${projId}`;
    const next = new Set(expandedProjects);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setExpandedProjects(next);
  };
  // Fonction d'export des données d'un projet spécifique pour l'année sélectionnée au format Excel, en générant un fichier HTML structuré avec les données formatées et stylisées pour une compatibilité optimale avec Excel, et en déclenchant le téléchargement du fichier

  const exportToExcel = (projectNode) => {
    const yearStr = String(selectedYear);
    const shortYear = yearStr.slice(-2);
    const projectName = projectNode.project?.titre || "Inconnu";
    const employeeName = employees.find(e => String(e.id) === String(projectNode.idEmployé))?.nom || 'Inconnu';
    
    // Style constants for HTML
    const tableStyle = 'border-collapse: collapse; width: 100%; font-family: Calibri, sans-serif;';
    const headerStyle = 'border: 1pt solid black; font-weight: bold; text-align: center; padding: 10px; font-size: 11px; vertical-align: middle;';
    const cellStyle = 'border: 1pt solid black; padding: 6px; text-align: right; font-size: 11px; vertical-align: middle;';
    const cellStyleCenter = 'border: 1pt solid black; padding: 6px; text-align: center; font-size: 11px; vertical-align: middle;';
    const percuHeaderStyle = 'background-color: #92D050; border: 1pt solid black; font-weight: bold; text-align: center; padding: 10px; font-size: 11px; color: black; vertical-align: middle;';
    const percuCellStyle = 'background-color: #E2EFDA; border: 1pt solid black; padding: 6px; text-align: right; font-size: 11px; font-weight: bold; vertical-align: middle;';

    const monthShortNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    const formatExcelCurrency = (val) => {
      return new Intl.NumberFormat('fr-FR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(val || 0) + ' €';
    };

    let html = `<html><head><meta charset="utf-8"></head><body>`;
    html += `<table style="${tableStyle}">`;
    
    // Headers
    html += `<thead><tr>`;
    const headers = [
      "Fact", "TJM", "Jours", "Facture", "extra", "Payée", "Total Facturé", 
      "Salaire Brut", "Salaire net FP après PAS", "Salaire net FP avant PAS", 
      "Salaire Net hors repas", "Frais Repas", "Frais Kilo", "Autre Frais", 
      "Total Perçu", "Charges Patronales URSSAF", "Charges Salariales",
      "Marge (€)", "Marge (%)"
    ];
    headers.forEach(h => {
      const style = h === "Total Perçu" || h.includes("Marge") ? percuHeaderStyle : headerStyle;
      html += `<th style="${style}">${h}</th>`;
    });
    html += `</tr></thead><tbody>`;

    let totalRevenueYear = 0;
    let totalMargeYear = 0;

    // Iterate over months and populate rows, calculating totals and applying conditional formatting for margins
    MONTH_NAMES.forEach((name, index) => {
      const monthNum = String(index + 1).padStart(2, '0');
      const key = `${yearStr}-${monthNum}`;
      const d = projectNode.months[key];
      
      const revenue = (Number(d?.montantFacturé) || 0) + (Number(d?.extra) || 0);
      const totalPercu = (Number(d?.salaireNetHorsRepas) || 0) + (Number(d?.fraisRepas) || 0) + (Number(d?.fraisKilometriques) || 0) + (Number(d?.autresFrais) || 0);
      const marge = Number(d?.rentabilite) || (revenue - totalPercu);
      const margePerc = revenue > 0 ? (marge / revenue) * 100 : 0;
      const roundedDays = Math.round(Number(d?.joursTravaillés) || 0);
      
      totalRevenueYear += revenue;
      totalMargeYear += marge;

      const factLabel = `${monthShortNames[index]}-${shortYear}`;

      // Conditional formatting logic (ONLY for marge)
      const margeColor = marge >= 0 ? '#16a34a' : '#dc2626';

      const percuCellStyle = `background-color: #E2EFDA; border: 1pt solid black; padding: 6px; text-align: right; font-size: 11px; font-weight: bold; vertical-align: middle; color: black;`;
      const margeCellStyleDynamic = `background-color: #FCE4D6; border: 1pt solid black; padding: 6px; text-align: right; font-size: 11px; font-weight: bold; vertical-align: middle; color: ${margeColor};`;

      html += `<tr>`;
      html += `<td style="${cellStyleCenter}; font-weight: bold; text-align: left;">${factLabel}</td>`;
      html += `<td style="${cellStyleCenter}">${d?.tjm || 0}</td>`;
      html += `<td style="${cellStyleCenter}">${roundedDays}</td>`;
      html += `<td style="${cellStyle}">${formatExcelCurrency(d?.montantFacturé)}</td>`;
      html += `<td style="${cellStyle}">${formatExcelCurrency(d?.extra)}</td>`;
      html += `<td style="${cellStyleCenter}">${d?.facturePayée ? "1" : "0"}</td>`;
      html += `<td style="${cellStyle}">${formatExcelCurrency(revenue)}</td>`;
      html += `<td style="${cellStyle}">${formatExcelCurrency(d?.salaireBrut)}</td>`;
      html += `<td style="${cellStyle}">${formatExcelCurrency(d?.salaireNetApresPAS)}</td>`;
      html += `<td style="${cellStyle}">${formatExcelCurrency(d?.salaireNetAvantPAS)}</td>`;
      html += `<td style="${cellStyle}">${formatExcelCurrency(d?.salaireNetHorsRepas)}</td>`;
      html += `<td style="${cellStyle}">${formatExcelCurrency(d?.fraisRepas)}</td>`;
      html += `<td style="${cellStyle}">${formatExcelCurrency(d?.fraisKilometriques)}</td>`;
      html += `<td style="${cellStyle}">${formatExcelCurrency(d?.autresFrais)}</td>`;
      html += `<td style="${percuCellStyle}">${formatExcelCurrency(totalPercu)}</td>`;
      html += `<td style="${cellStyle}">${formatExcelCurrency(d?.chargesPatronales)}</td>`;
      html += `<td style="${cellStyle}">${formatExcelCurrency(d?.chargesSalariales)}</td>`;
      html += `<td style="${margeCellStyleDynamic}">${formatExcelCurrency(marge)}</td>`;
      html += `<td style="${margeCellStyleDynamic}">${margePerc.toFixed(1)} %</td>`;
      html += `</tr>`;
    });

    // TOTAL row
    const totalMargeColor = totalMargeYear >= 0 ? '#16a34a' : '#dc2626';
    const totalMargePerc = totalRevenueYear > 0 ? (totalMargeYear / totalRevenueYear) * 100 : 0;
    const summaryLabelStyle = 'border: 1pt solid black; padding: 10px; text-align: right; font-weight: bold; font-size: 12px; background-color: #f8fafc;';
    const summaryValueStyle = `border: 1pt solid black; padding: 10px; text-align: right; font-weight: bold; font-size: 12px; background-color: #f8fafc; color: ${totalMargeColor};`;

    html += `<tr>`;
    html += `<td colspan="17" style="${summaryLabelStyle}">RENTABILITÉ TOTALE ANNUELLE:</td>`;
    html += `<td style="${summaryValueStyle}">${formatExcelCurrency(totalMargeYear)}</td>`;
    html += `<td style="${summaryValueStyle}">${totalMargePerc.toFixed(1)} %</td>`;
    html += `</tr>`;

    html += `</tbody></table></body></html>`;

    const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Historique_${employeeName}_${projectName}_${yearStr}.xls`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };
  // Extrait les années présentes dans monthlyData (champ mois au format YYYY-MM) et ajoute l’année courante. Tri décroissant.
  const years = useMemo(() => {
    const yearsSet = new Set([new Date().getFullYear()]);
    monthlyData.forEach(d => {
      if (d.mois) {
        const year = parseInt(d.mois.split('-')[0]);
        if (year) yearsSet.add(year);
      }
    });
    return Array.from(yearsSet).sort((a, b) => b - a);
  }, [monthlyData]);

  // Initialize selectedYear to most recent year with data
  useEffect(() => {
    if (selectedYear === null && years.length > 0) {
      setSelectedYear(years[0]);
    }
  }, [years, selectedYear]);

  // Auto-expand employees with data for the current year
  useEffect(() => {
    if (selectedYear && monthlyData.length > 0) {
      const yearStr = String(selectedYear);
      const toExpand = new Set();
      monthlyData.forEach(d => {
        if (d.mois?.startsWith(yearStr)) {
          toExpand.add(String(d.idEmployé));
        }
      });
      if (toExpand.size > 0) {
        setExpandedEmployees(prev => {
            const next = new Set(prev);
            toExpand.forEach(id => next.add(id));
            return next;
        });
      }
    }
  }, [selectedYear, monthlyData]);

  const groupedData = useMemo(() => {
    const term = search.toLowerCase().trim();
    
    // Group by employee -> project -> month
    const structure = new Map();

    employees.forEach(emp => {
      if (term && !emp.nom.toLowerCase().includes(term) && !emp.rôle?.toLowerCase().includes(term)) {
        return;
      }

      const empId = String(emp.id);
      if (!structure.has(empId)) {
        structure.set(empId, {
          employee: emp,
          projects: new Map()
        });
      }

      // Initialize all employee projects
      const empProjects = projects.filter(p => String(p.idEmployé) === empId);
      empProjects.forEach(p => {
        structure.get(empId).projects.set(String(p.id), {
          project: p,
          months: {}
        });
      });

      // Special group for "No Project"
      structure.get(empId).projects.set('null', {
        project: { titre: 'Sans Projet Spécifique', référence: 'N/A' },
        months: {}
      });
    });

    monthlyData.forEach(entry => {
      const empId = String(entry.idEmployé);
      const projId = entry.idProjet ? String(entry.idProjet) : 'null';
      
      if (structure.has(empId)) {
        const empNode = structure.get(empId);
        if (!empNode.projects.has(projId)) {
          // If project not in employee projects (maybe deleted?), add it as placeholder
          const projectInfo = projects.find(p => String(p.id) === projId) || { titre: `Projet #${projId}`, référence: '?' };
          empNode.projects.set(projId, { project: projectInfo, months: {} });
        }
        empNode.projects.get(projId).months[entry.mois] = entry;
      }
    });

    // Cleanup: remove projects/employees with no data if searching and they don't match
    // Or just keep them if we want to see the "empty" 12-month table

    return Array.from(structure.values()).sort((a, b) => a.employee.nom.localeCompare(b.employee.nom));
  }, [employees, projects, monthlyData, search]);

  const renderTable = (projectNode) => {
    const yearStr = String(selectedYear);
    const rows = MONTH_NAMES.map((name, index) => {
      const monthNum = String(index + 1).padStart(2, '0');
      const key = `${yearStr}-${monthNum}`;
      const data = projectNode.months[key];
      return { name, key, data };
    });
    const totals = rows.reduce((acc, row) => {
      if (row.data) {
        acc.ca += (Number(row.data.montantFacturé) || 0);
        acc.extra += (Number(row.data.extra) || 0);
        acc.days += Math.round(Number(row.data.joursTravaillés) || 0);
        acc.brut += (Number(row.data.salaireBrut) || 0);
        acc.netApres += (Number(row.data.salaireNetApresPAS) || 0);
        acc.netAvant += (Number(row.data.salaireNetAvantPAS) || 0);
        acc.netHorsRepas += (Number(row.data.salaireNetHorsRepas) || 0);
        acc.fraisRepas += (Number(row.data.fraisRepas) || 0);
        acc.fraisKilo += (Number(row.data.fraisKilometriques) || 0);
        acc.fraisAutres += (Number(row.data.autresFrais) || 0);
        acc.chargesPatronales += (Number(row.data.chargesPatronales) || 0);
        acc.chargesSalariales += (Number(row.data.chargesSalariales) || 0);
        acc.marge += (Number(row.data.rentabilite) || 0);
        acc.totalPercu += (Number(row.data.salaireNetHorsRepas) || 0) + (Number(row.data.fraisRepas) || 0) + (Number(row.data.fraisKilometriques) || 0) + (Number(row.data.autresFrais) || 0);
      }
      return acc;
    }, { 
      ca: 0, extra: 0, days: 0, brut: 0, netApres: 0, netAvant: 0, 
      netHorsRepas: 0, fraisRepas: 0, fraisKilo: 0, fraisAutres: 0, 
      chargesPatronales: 0, chargesSalariales: 0, marge: 0, totalPercu: 0 
    });

    return (
      <div className="overflow-x-auto rounded-lg shadow-sm border border-slate-300">
        <table className={`w-full text-left border-collapse ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
          <thead className="sticky top-0 z-20">
            <tr className={`${theme === 'dark' ? 'bg-gray-900 border-gray-700' : 'bg-slate-100 border-slate-300'} border-b font-bold text-[11px] uppercase tracking-wider`}>
              <th className="sticky left-0 bg-inherit z-10 px-2 py-2 border border-slate-300 min-w-[80px]">Mois</th>
              <th className="px-2 py-2 border border-slate-300 text-center">TJM</th>
              <th className="px-2 py-2 border border-slate-300 text-center">Jours</th>
              <th className="px-2 py-2 border border-slate-300 text-right">Facture</th>
              <th className="px-2 py-2 border border-slate-300 text-right">Extra</th>
              <th className="px-2 py-2 border border-slate-300 text-center">Payée</th>
              <th className="px-2 py-2 border border-slate-300 text-right bg-slate-200/50">Total Facturé</th>
              <th className="px-2 py-2 border border-slate-300 text-right">Salaire Brut</th>
              <th className="px-2 py-2 border border-slate-300 text-right">Net FP après PAS</th>
              <th className="px-2 py-2 border border-slate-300 text-right">Net FP avant PAS</th>
              <th className="px-2 py-2 border border-slate-300 text-right">Net hors repas</th>
              <th className="px-2 py-2 border border-slate-300 text-right">Frais Repas</th>
              <th className="px-2 py-2 border border-slate-300 text-right">Frais Kilo</th>
              <th className="px-2 py-2 border border-slate-300 text-right">Autre Frais</th>
              <th className="px-2 py-2 border border-slate-300 text-right bg-[#90EE90] text-black">Total Perçu</th>
              <th className="px-2 py-2 border border-slate-300 text-right whitespace-normal leading-tight">Charges Patronales URSSAF</th>
              <th className="px-2 py-2 border border-slate-300 text-right whitespace-normal leading-tight">Charges Salariales</th>
              <th className="px-2 py-2 border border-slate-300 text-right bg-slate-200/50">Marge €</th>
              <th className="px-2 py-2 border border-slate-300 text-right bg-slate-200/50">Marge %</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.key} className={`border-b transition-colors ${theme === 'dark' ? 'border-gray-800 hover:bg-gray-700/30' : 'border-slate-200 hover:bg-slate-50/80'}`}>
                <td className="sticky left-0 bg-white dark:bg-gray-800 z-10 px-2 py-1.5 text-xs font-semibold border border-slate-300">{row.name}</td>
                <td className="px-2 py-1.5 text-xs border border-slate-300 text-center">{row.data ? row.data.tjm : '-'}</td>
                <td className="px-2 py-1.5 text-xs border border-slate-300 text-center">{row.data ? Math.round(Number(row.data.joursTravaillés) || 0) : '-'}</td>
                <td className="px-2 py-1.5 text-xs border border-slate-300 text-right">{row.data ? formatCurrency(row.data.montantFacturé) : '-'}</td>
                <td className="px-2 py-1.5 text-xs border border-slate-300 text-right">{row.data ? formatCurrency(row.data.extra) : '-'}</td>
                <td className="px-2 py-1.5 text-center border border-slate-300">
                  {row.data ? (
                    row.data.facturePayée ? 
                      <span className="text-green-600 font-bold text-[10px]">OUI</span> : 
                      <span className="text-amber-600 font-bold text-[10px]">NON</span>
                  ) : '-'}
                </td>
                <td className="px-2 py-1.5 text-xs border border-slate-300 text-right font-bold bg-slate-50/50">
                  {row.data ? formatCurrency(row.data.montantFacturé + (row.data.extra || 0)) : '-'}
                </td>
                <td className="px-2 py-1.5 text-xs border border-slate-300 text-right">{row.data ? formatCurrency(row.data.salaireBrut) : '-'}</td>
                <td className="px-2 py-1.5 text-xs border border-slate-300 text-right">{row.data ? formatCurrency(row.data.salaireNetApresPAS) : '-'}</td>
                <td className="px-2 py-1.5 text-xs border border-slate-300 text-right">{row.data ? formatCurrency(row.data.salaireNetAvantPAS) : '-'}</td>
                <td className="px-2 py-1.5 text-xs border border-slate-300 text-right">{row.data ? formatCurrency(row.data.salaireNetHorsRepas) : '-'}</td>
                <td className="px-2 py-1.5 text-xs border border-slate-300 text-right">{row.data ? formatCurrency(row.data.fraisRepas) : '-'}</td>
                <td className="px-2 py-1.5 text-xs border border-slate-300 text-right">{row.data ? formatCurrency(row.data.fraisKilometriques) : '-'}</td>
                <td className="px-2 py-1.5 text-xs border border-slate-300 text-right">{row.data ? formatCurrency(row.data.autresFrais) : '-'}</td>
                <td className="px-2 py-1.5 text-xs border border-slate-300 text-right font-bold bg-[#90EE90]/20 text-green-800">
                  {row.data ? formatCurrency(
                    (row.data.salaireNetHorsRepas || 0) + 
                    (row.data.fraisRepas || 0) + 
                    (row.data.fraisKilometriques || 0) + 
                    (row.data.autresFrais || 0)
                  ) : '-'}
                </td>
                <td className="px-2 py-1.5 text-xs border border-slate-300 text-right">{row.data ? formatCurrency(row.data.chargesPatronales) : '-'}</td>
                <td className="px-2 py-1.5 text-xs border border-slate-300 text-right">{row.data ? formatCurrency(row.data.chargesSalariales) : '-'}</td>
                <td className={`px-2 py-1.5 text-xs border border-slate-300 text-right font-bold bg-slate-50/50 ${row.data?.rentabilite >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                  {row.data ? formatCurrency(row.data.rentabilite) : '-'}
                </td>
                <td className={`px-2 py-1.5 text-xs border border-slate-300 text-right font-bold bg-slate-50/50 ${row.data?.pourcentageRentabilite >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                  {row.data ? `${(row.data.pourcentageRentabilite || 0).toFixed(1)}%` : '-'}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className={`${theme === 'dark' ? 'bg-gray-900 border-gray-700' : 'bg-slate-100 border-slate-300'} border-t-2 font-black text-xs`}>
              <td className="sticky left-0 bg-inherit z-10 px-2 py-2 border border-slate-300">TOTAL ANNUEL</td>
              <td className="border border-slate-300"></td>
              <td className="px-2 py-2 border border-slate-300 text-center">{Math.round(totals.days)}j</td>
              <td className="px-2 py-2 border border-slate-300 text-right">{formatCurrency(totals.ca)}</td>
              <td className="px-2 py-2 border border-slate-300 text-right">{formatCurrency(totals.extra)}</td>
              <td className="border border-slate-300"></td>
              <td className="px-2 py-2 border border-slate-300 text-right bg-slate-200/50 font-black">{formatCurrency(totals.ca + totals.extra)}</td>
              <td className="px-2 py-2 border border-slate-300 text-right">{formatCurrency(totals.brut)}</td>
              <td className="px-2 py-2 border border-slate-300 text-right">{formatCurrency(totals.netApres)}</td>
              <td className="px-2 py-2 border border-slate-300 text-right">{formatCurrency(totals.netAvant)}</td>
              <td className="px-2 py-2 border border-slate-300 text-right">{formatCurrency(totals.netHorsRepas)}</td>
              <td className="px-2 py-2 border border-slate-300 text-right">{formatCurrency(totals.fraisRepas)}</td>
              <td className="px-2 py-2 border border-slate-300 text-right">{formatCurrency(totals.fraisKilo)}</td>
              <td className="px-2 py-2 border border-slate-300 text-right">{formatCurrency(totals.fraisAutres)}</td>
              <td className="px-2 py-2 border border-slate-300 text-right bg-[#90EE90] text-black font-black">
                {formatCurrency(totals.netHorsRepas + totals.fraisRepas + totals.fraisKilo + totals.fraisAutres)}
              </td>
              <td className="px-2 py-2 border border-slate-300 text-right">{formatCurrency(totals.chargesPatronales)}</td>
              <td className="px-2 py-2 border border-slate-300 text-right">{formatCurrency(totals.chargesSalariales)}</td>
              <td className={`px-2 py-2 border border-slate-300 text-right font-black bg-slate-200/50 ${totals.marge >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                {formatCurrency(totals.marge)}
              </td>
              <td className={`px-2 py-2 border border-slate-300 text-right font-black bg-slate-200/50 ${totals.marge >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                {(totals.ca + totals.extra) > 0 ? `${((totals.marge / (totals.ca + totals.extra)) * 100).toFixed(1)}%` : '0%'}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    );
  };

  return (
    <div className={`p-8 min-h-screen transition-colors ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-slate-50 text-slate-900'}`}>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className={`text-3xl font-bold flex items-center gap-3 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
              <Database className="text-[#7ED957]" size={32} />
              Historique des Projets
            </h1>
            <p className={`mt-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
              Suivi détaillé de la rentabilité par salarié et par projet sur 12 mois.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Calendar className={`absolute left-3 top-1/2 -translate-y-1/2 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} size={18} />
              <select
                value={selectedYear || new Date().getFullYear()}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className={`pl-10 pr-4 py-2 rounded-lg border appearance-none focus:ring-2 focus:ring-[#7ED957] transition-all ${
                  theme === 'dark' ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-slate-900 shadow-sm'
                }`}
              >
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            
            <button
              onClick={handleRefresh}
              className="inline-flex items-center gap-2 rounded-lg bg-[#7ED957] px-4 py-2 font-bold text-black transition hover:bg-[#6FC847] shadow-sm active:scale-95"
            >
              <RefreshCw size={18} className={isRefreshing ? 'animate-spin' : ''} />
              Actualiser
            </button>
          </div>
        </div>

        <div className={`mb-8 rounded-2xl border p-2 shadow-sm ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
          <div className="relative">
            <Search size={18} className={`absolute left-4 top-1/2 -translate-y-1/2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un salarié (nom, rôle)..."
              className={`w-full rounded-xl border-none py-3 pl-12 pr-4 focus:ring-0 text-lg ${theme === 'dark' ? 'bg-transparent text-white' : 'bg-transparent text-slate-900'}`}
            />
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 grayscale opacity-50">
            <RefreshCw size={48} className="animate-spin text-[#7ED957] mb-4" />
            <p className="text-xl font-medium">Chargement des données...</p>
          </div>
        ) : groupedData.length === 0 ? (
          <div className={`rounded-2xl border border-dashed p-20 text-center ${theme === 'dark' ? 'bg-gray-800/50 border-gray-700 text-gray-400' : 'bg-white border-gray-200 text-gray-500'}`}>
            <Search size={48} className="mx-auto mb-4 opacity-20" />
            <p className="text-xl">Aucun résultat trouvé.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {groupedData.map((node) => (
              <div 
                key={node.employee.id}
                className={`overflow-hidden rounded-2xl border shadow-sm transition-all ${
                  theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
                }`}
              >
                <div 
                  onClick={() => toggleEmployee(node.employee.id)}
                  className={`p-6 flex items-center justify-between cursor-pointer group ${
                    theme === 'dark' ? 'hover:bg-gray-700/50' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${theme === 'dark' ? 'bg-gray-900' : 'bg-slate-100'} text-[#7ED957]`}>
                      <UserIcon size={24} />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">{node.employee.nom}</h2>
                      <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                        {node.employee.rôle || 'Salarié'} • {node.projects.size - 1} projet(s)
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {expandedEmployees.has(node.employee.id) ? <ChevronDown size={24} /> : <ChevronRight size={24} />}
                  </div>
                </div>

                {expandedEmployees.has(node.employee.id) && (
                  <div className={`p-6 border-t space-y-10 ${theme === 'dark' ? 'border-gray-700 bg-gray-900/20' : 'border-gray-50 bg-slate-50/30'}`}>
                    {Array.from(node.projects.values())
                      .filter(pNode => pNode.project.id !== undefined || Object.keys(pNode.months).length > 0)
                      .map((pNode, pIdx) => {
                        const projId = pNode.project.id ? String(pNode.project.id) : 'null';
                        const isProjExpanded = expandedProjects.has(`${node.employee.id}-${projId}`);
                        
                        return (
                          <div key={pIdx} className="space-y-4">
                            <div 
                              onClick={() => toggleProject(node.employee.id, projId)}
                              className={`flex items-center justify-between px-4 py-3 rounded-xl cursor-pointer transition-colors ${
                                theme === 'dark' ? 'hover:bg-gray-700/50 bg-gray-800/40' : 'hover:bg-white bg-white/50 border border-gray-100'
                              }`}
                            >
                              <h3 className="text-lg font-bold flex items-center gap-3">
                                {isProjExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                                <Briefcase size={18} className="text-[#7ED957]" />
                                {pNode.project.titre} 
                                {pNode.project.référence && <span className="text-sm font-normal opacity-50 ml-2">[{pNode.project.référence}]</span>}
                              </h3>
                              <div className="flex items-center gap-6">
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    exportToExcel(pNode);
                                  }}
                                  className="flex items-center gap-2 px-3 py-1.5 bg-[#7ED957] text-black rounded-lg text-sm font-bold hover:scale-105 transition-transform"
                                >
                                  <Download size={16} />
                                  Excel
                                </button>
                                <div className="text-right">
                                  <p className="text-xs uppercase tracking-wider opacity-50">Marge Annuelle</p>
                                  <p className={`text-lg font-black ${Object.values(pNode.months).reduce((s, m) => s + (m.rentabilite || 0), 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                    {formatCurrency(Object.values(pNode.months).filter(m => m.mois.startsWith(selectedYear)).reduce((s, m) => s + (m.rentabilite || 0), 0))}
                                  </p>
                                </div>
                              </div>
                            </div>
                            
                            {isProjExpanded && (
                              <div className="space-y-6">
                                <div className={`rounded-xl border overflow-hidden ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-sm'}`}>
                                  {renderTable(pNode)}
                                </div>
                                <ForecastingAlert projectId={projId} theme={theme} months={3} />
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Historique;
