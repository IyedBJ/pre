import React, { useState, useMemo, useEffect } from "react";
import { useData } from "../context/DataContext";
import { useTheme } from "../context/ThemeContext";
import { 
  Zap,
  TrendingUp,
  Activity,
  UserSquare2,
  Briefcase,
  Target,
  ArrowRight
} from "lucide-react";
// Formate un nombre en euros sans centimes (arrondi à l’euro). Utilisé pour afficher les KPIs.

const formatCurrency = (val) => 
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(val);
//
export default function Simulation() {
  const { employees, projects, monthlyData } = useData();
  const { theme } = useTheme();

  const [selectedEmpId, setSelectedEmpId] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState("");

  // Base Real Data to compare against
  const [baseData, setBaseData] = useState(null);

  // Variables for Simulation
  const [tjm, setTjm] = useState(0);
  const [jours, setJours] = useState(0);
  const [salaireBrut, setSalaireBrut] = useState(0);
  const [fraisKilo, setFraisKilo] = useState(0);
  const [fraisRepas, setFraisRepas] = useState(0);
  const [autresFrais, setAutresFrais] = useState(0);

  // Hidden constants mapped from real data for accurate calculations
  const [ratioChargesPatronales, setRatioChargesPatronales] = useState(0);
  const [ratioNet, setRatioNet] = useState(0);

  const employeeProjects = useMemo(() => {
    if (!selectedEmpId) return [];
    return projects.filter(p => String(p.idEmployé) === selectedEmpId);
  }, [selectedEmpId, projects]);

  // Load the most recent month data for the selected project
  useEffect(() => {
    // si pas de projet ou salarié sélectionné, reset baseData
    if (!selectedEmpId || !selectedProjectId) {
      setBaseData(null);
      return;
    }
    // filtrer les données mensuelles pour trouver celles liées au salarié et projet sélectionnés, puis trier par mois décroissant pour prendre la plus récente. On convertit les IDs en string pour éviter les problèmes de type lors de la comparaison, surtout si les données proviennent de différentes sources (ex. base de données vs API).
    const idSalarieStr = String(selectedEmpId);
    const idProjetStr = String(selectedProjectId) === "null" ? null : String(selectedProjectId);

    const relatedData = monthlyData.filter(d => 
      String(d.idEmployé) === idSalarieStr && 
      String(d.idProjet) === idProjetStr
    ).sort((a, b) => b.mois.localeCompare(a.mois)); // sort desc by month

    if (relatedData.length > 0) {
      const latest = relatedData[0];
      setBaseData(latest);
      
      // Initialiser les variables modifiables avec les données du dernier mois pour une expérience de simulation plus intuitive
      setTjm(Number(latest.tjm) || 0);
      setJours(Math.round(Number(latest.joursTravaillés) || 0));
      setSalaireBrut(Number(latest.salaireBrut) || 0);
      setFraisKilo(Number(latest.fraisKilometriques) || 0);
      setFraisRepas(Number(latest.fraisRepas) || 0);
      setAutresFrais(Number(latest.autresFrais) || 0);

      // determiner les ratios de charges patronales et net hors repas
      const lBrut = Number(latest.salaireBrut) || 1; // avoid division by zero
      const lChargesPat = Number(latest.chargesPatronales) || 0;
      const lNetHors = Number(latest.salaireNetHorsRepas) || 0;

      setRatioChargesPatronales(lChargesPat / lBrut);
      setRatioNet(lNetHors / lBrut);
    } else {
      setBaseData(null);
    }
  }, [selectedEmpId, selectedProjectId, monthlyData]);


  // ---- Deterministic Algebraic Prediction Engine ----
  // Calculations based strictly on algebraic formulas 
  // without ML probabilism
  
  const simCA = tjm * Math.round(jours);
  // Estimate Net hors repas using base deterministic ratio
  const simNetHorsRepas = salaireBrut * ratioNet; 
  const simTotalPercu = simNetHorsRepas + fraisRepas + fraisKilo + autresFrais;
  
  // Calculate total costs for profitability
  const simChargesPatronales = salaireBrut * ratioChargesPatronales;
  const simCoutTotal = salaireBrut + simChargesPatronales + fraisRepas + fraisKilo + autresFrais; 
  // We assume Charges Salariales are deducted from Brut to get Net, so developer cost is Brut + Patronales + Frais.
  // Wait, in actual logic, coutTotal = SalaireBrut + ChargesPatronales + ChargesSalariales + Frais?
  // Let's use the explicit ratio for Cout Total.
  const baseCoutToBrutRatio = baseData ? (Number(baseData.coutTotal) / (Number(baseData.salaireBrut) || 1)) : 1;
  const simCoutTotalAccurate = salaireBrut * baseCoutToBrutRatio;

  const simRentabilite = simCA - simCoutTotalAccurate;
  const simRentabilitePerc = simCA > 0 ? (simRentabilite / simCA) * 100 : 0;
  
  // Calcul des valeurs de base (Précédent) pour les comparaisons, en s'assurant de gérer les cas où baseData pourrait être null ou avoir des valeurs manquantes. On utilise des valeurs par défaut (0) pour éviter les NaN dans les calculs et les affichages.
  const baseCA = baseData ? (Number(baseData.montantFacturé) || 0) + (Number(baseData.extra) || 0) : 0;
  const baseTotalPercu = baseData ? (Number(baseData.salaireNetHorsRepas) + Number(baseData.fraisRepas) + Number(baseData.fraisKilometriques) + Number(baseData.autresFrais)) : 0;

  const inputClass = `w-full px-4 py-2 border rounded-lg focus:ring-2 transition-all font-bold ${
    theme === 'dark' 
      ? 'bg-gray-800 border-gray-700 text-white focus:ring-[#7ED957]' 
      : 'bg-white border-gray-300 focus:ring-[#7ED957]'
  }`;
  const labelClass = `block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`;
  // Fonction utilitaire pour afficher les deltas avec une coloration conditionnelle : vert pour les améliorations, rouge pour les détériorations, et gris pour les valeurs proches (±10%). Le paramètre isPercent permet d'ajuster le format d'affichage pour les pourcentages.
  const renderDelta = (sim, base, isPercent = false) => {
    if (!baseData) return null;
    const delta = sim - base;
    if (Math.abs(delta) < 0.1) return <span className="text-gray-500 text-xs font-bold">~ Égal</span>;
    const color = delta > 0 ? 'text-green-500' : 'text-red-500';
    const sign = delta > 0 ? '+' : '';
    return (
      <span className={`${color} text-sm font-black`}>
        {sign}{isPercent ? delta.toFixed(1) + '%' : formatCurrency(delta)}
      </span>
    );
  };

  return (
    <div className={`w-full min-h-screen p-8 transition-colors ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-slate-50 text-slate-900'}`}>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl shadow-lg shadow-amber-500/20">
            <Zap className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight leading-none">Simulation Financière</h1>
            <p className={`mt-2 font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              Ajustez les paramètres du salarié et consultez l’impact mensuel.
            </p>
          </div>
        </div>

        {/* --- Selection --- */}
        <div className={`p-6 rounded-2xl shadow-sm border mb-8 flex gap-4 flex-wrap ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-slate-200'}`}>
          <div className="flex-1 min-w-[200px]">
            <label className={labelClass}><UserSquare2 size={16} className="inline mr-1"/> Salarié</label>
            <select
              value={selectedEmpId}
              onChange={(e) => {
                setSelectedEmpId(e.target.value);
                setSelectedProjectId("");
              }}
              className={inputClass}
            >
              <option value="">Sélectionnez un salarié</option>
              {employees.map(e => <option key={e.id} value={e.id}>{e.nom}</option>)}
            </select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className={labelClass}><Briefcase size={16} className="inline mr-1"/> Projet</label>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className={inputClass}
              disabled={!selectedEmpId}
            >
              <option value="">Sélectionnez un projet (Dernier mois)</option>
              {employeeProjects.map(p => (
                <option key={p.id} value={p.id}>{p.titre}</option>
              ))}
            </select>
          </div>
        </div>

        {!baseData && selectedProjectId && (
          <div className="text-center p-12 opacity-50 font-bold italic">
            Aucune donnée historique trouvée pour initialiser la simulation sur ce projet.
          </div>
        )}

        {baseData && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Variables Modifiables */}
            <div className={`lg:col-span-5 p-6 rounded-3xl border shadow-lg ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-slate-200'}`}>
              <h2 className="text-lg font-black mb-6 flex items-center gap-2">
                <Activity className="text-blue-500" /> Paramètres Modifiables
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="flex justify-between text-xs font-bold uppercase tracking-wider opacity-60 mb-1">
                    <span>TJM (€)</span>
                    <span>Actuel: {baseData.tjm}</span>
                  </label>
                  <input type="number" value={tjm} onChange={e => setTjm(Number(e.target.value))} className={inputClass} />
                </div>
                <div>
                  <label className="flex justify-between text-xs font-bold uppercase tracking-wider opacity-60 mb-1">
                    <span>Jours Travaillés</span>
                    <span>Actuel: {Math.round(baseData.joursTravaillés)}</span>
                  </label>
                  <input type="number" step="1" value={jours} onChange={e => setJours(Math.round(Number(e.target.value)))} className={inputClass} />
                </div>
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700"></div>
                <div>
                  <label className="flex justify-between text-xs font-bold uppercase tracking-wider opacity-60 mb-1">
                    <span>Salaire Brut (€)</span>
                    <span>Actuel: {baseData.salaireBrut}</span>
                  </label>
                  <input type="number" value={salaireBrut} onChange={e => setSalaireBrut(Number(e.target.value))} className={inputClass} />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="flex justify-between text-xs font-bold uppercase tracking-wider opacity-60 mb-1">
                      <span>Frais KM (€)</span>
                    </label>
                    <input type="number" value={fraisKilo} onChange={e => setFraisKilo(Number(e.target.value))} className={inputClass} />
                  </div>
                  <div>
                    <label className="flex justify-between text-xs font-bold uppercase tracking-wider opacity-60 mb-1">
                      <span>Frais Repas (€)</span>
                    </label>
                    <input type="number" value={fraisRepas} onChange={e => setFraisRepas(Number(e.target.value))} className={inputClass} />
                  </div>
                  <div>
                    <label className="flex justify-between text-xs font-bold uppercase tracking-wider opacity-60 mb-1">
                      <span>Autres Frais (€)</span>
                    </label>
                    <input type="number" value={autresFrais} onChange={e => setAutresFrais(Number(e.target.value))} className={inputClass} />
                  </div>
                </div>
              </div>
            </div>

            {/* Dashboards KPIs */}
            <div className="lg:col-span-7 flex flex-col gap-6">
              
              {/* Main Comparison Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                <div className={`p-6 rounded-3xl border shadow-sm ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-slate-200'}`}>
                  <p className="text-xs font-bold uppercase tracking-wider text-blue-500 mb-1">Chiffre d'Affaire (CA)</p>
                  <div className="flex items-end gap-4 mb-2">
                    <h3 className="text-3xl font-black">{formatCurrency(simCA)}</h3>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="opacity-50">Précédent: {formatCurrency(baseCA)}</span>
                    <ArrowRight size={14} className="opacity-30" />
                    {renderDelta(simCA, baseCA)}
                  </div>
                </div>

                <div className={`p-6 rounded-3xl border shadow-sm ${theme === 'dark' ? 'bg-[#E2EFDA]/10 border-[#E2EFDA]/30' : 'bg-[#E2EFDA]/50 border-green-200'}`}>
                  <p className="text-xs font-bold uppercase tracking-wider text-green-600 mb-1">Total Perçu (Salarié)</p>
                  <div className="flex items-end gap-4 mb-2">
                    <h3 className="text-3xl font-black text-green-600 dark:text-green-400">{formatCurrency(simTotalPercu)}</h3>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="opacity-50 text-gray-700 dark:text-gray-300">Précédent: {formatCurrency(baseTotalPercu)}</span>
                    <ArrowRight size={14} className="opacity-30" />
                    {renderDelta(simTotalPercu, baseTotalPercu)}
                  </div>
                </div>

              </div>

              {/* Sub-KPIs */}
              <div className={`p-6 rounded-3xl border shadow-sm ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-slate-200'}`}>
                <h3 className="font-bold flex items-center gap-2 mb-6 border-b pb-2 dark:border-gray-700">
                  <Target size={18} className="text-amber-500"/> Vue détaillée (Rentabilité & Marges)
                </h3>
                
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-bold">Net Hors Repas</p>
                      <p className="text-xs opacity-50">Estimé d'après ratio Brut/Net ({ (ratioNet * 100).toFixed(1) }%)</p>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-lg">{formatCurrency(simNetHorsRepas)}</p>
                      {renderDelta(simNetHorsRepas, Number(baseData.salaireNetHorsRepas))}
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-bold">Marge Nette (Rentabilité)</p>
                      <p className="text-xs opacity-50">CA - Coût Total ({formatCurrency(simCoutTotalAccurate)})</p>
                    </div>
                    <div className="text-right">
                      <p className={`font-black text-xl ${simRentabilite >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {formatCurrency(simRentabilite)}
                      </p>
                      {renderDelta(simRentabilite, Number(baseData.rentabilite))}
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-bold">Rentabilité en %</p>
                      <p className="text-xs opacity-50">Marge / CA</p>
                    </div>
                    <div className="text-right">
                      <p className={`font-black text-xl ${simRentabilitePerc >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {simRentabilitePerc.toFixed(1)}%
                      </p>
                      {renderDelta(
                        simRentabilitePerc, 
                        baseCA > 0 ? (Number(baseData.rentabilite) / baseCA) * 100 : 0,
                        true
                      )}
                    </div>
                  </div>

                </div>
              </div>

            </div>

          </div>
        )}
      </div>
    </div>
  );
}
