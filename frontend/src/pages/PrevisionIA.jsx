import React, { useMemo, useState, useEffect } from "react";
import { 
  TrendingUp, 
  AlertTriangle, 
  UserPlus, 
  Target, 
  ArrowUpRight, 
  ArrowDownRight,
  Brain,
  Info,
  Calendar,
  DollarSign,
  Activity,
  Zap,
  BarChart3,
  Search,
  Loader2
} from "lucide-react";
import { ResponsiveLine } from "@nivo/line";
import { useData } from "../context/DataContext";
import { useTheme } from "../context/ThemeContext";
import { API_URL } from "../api/axios";

const formatCurrency = (val) => 
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(val);

export default function PrevisionIA() {
  const { projects, monthlyData, employees } = useData();
  const { theme } = useTheme();

  const [forecastResults, setForecastResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMonths, setViewMonths] = useState(6);

  useEffect(() => {
    const fetchForecast = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_URL}/api/forecast/global?months=${viewMonths}`, {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
        if (!res.ok) throw new Error("Erreur lors de la récupération des prévisions");
        const data = await res.json();
        setForecastResults(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchForecast();
  }, [viewMonths]);

  const forecastData = useMemo(() => {
    if (!forecastResults || !forecastResults.predictions) return [];

    const historyData = forecastResults.history || [];
    const predictions = forecastResults.predictions || [];

    // Map history (last 3 months) and predictions (next 3-6 months)
    const marginData = [
      ...historyData.slice(-3).map(h => ({ x: h.month, y: h.rentabilite })),
      ...predictions.map(p => ({ x: p.month, y: p.predicted_rentabilite }))
    ];

    const costData = [
      ...historyData.slice(-3).map(h => ({ x: h.month, y: h.coutTotal })),
      ...predictions.map(p => ({ x: p.month, y: p.predicted_cout }))
    ];

    return [
      { id: "Marge", color: "#7ED957", data: marginData },
      { id: "Coûts", color: "#ef4444", data: costData }
    ];
  }, [forecastResults]);

  // Dynamic Stats Calculation
  const stats = useMemo(() => {
    if (!forecastResults || !forecastResults.predictions) return [
      { label: 'CA Prévu (3 mois)', value: '...', icon: DollarSign, trend: '--', color: 'blue' },
      { label: 'Marge Prédite', value: '...', icon: Target, trend: '--', color: 'emerald' },
      { label: 'Risques Détectés', value: '...', icon: AlertTriangle, trend: '--', color: 'red' },
      { label: 'Capacité Recrutement', value: '...', icon: UserPlus, trend: '--', color: 'purple' },
    ];

    const next6MonthsRevenue = forecastResults.predictions.reduce((acc, p) => acc + (p.predicted_rentabilite + p.predicted_cout), 0);
    const avgMargin = forecastResults.predictions.reduce((acc, p) => acc + (p.predicted_rentabilite / (p.predicted_rentabilite + p.predicted_cout || 1)), 0) / forecastResults.predictions.length;
    const risksCount = forecastResults.reasons ? forecastResults.reasons.length : 0;

    // Dynamic Recruitment Label
    let recruitmentStatus = "Faible / Risque";
    let recruitmentTrend = "Limité";
    if (avgMargin > 0.4) {
      recruitmentStatus = "Élevée (Expansion)";
      recruitmentTrend = "Optimal";
    } else if (avgMargin > 0.25) {
      recruitmentStatus = "Stable (Ouvert)";
      recruitmentTrend = "Correct";
    } else if (avgMargin > 0.1) {
      recruitmentStatus = "Limitée (Wait)";
      recruitmentTrend = "Limité";
    }

    return [
      { label: 'CA Prévu ', value: formatCurrency(next6MonthsRevenue), icon: DollarSign, trend: forecastResults.trend === 'up' ? '+ Trend' : '- Trend', color: 'blue' },
      { label: 'Marge Moy. Prédite', value: `${(avgMargin * 100).toFixed(1)}%`, icon: Target, trend: forecastResults.trend === 'up' ? '+ OK' : '- Watch', color: 'emerald' },
      { label: 'Risques Détectés', value: `${risksCount} Alertes`, icon: AlertTriangle, trend: risksCount > 0 ? 'Critique' : 'Sain', color: 'red' },
      { label: 'Capacité Recrutement', value: recruitmentStatus, icon: UserPlus, trend: recruitmentTrend, color: 'purple' },
    ];
  }, [forecastResults]);

  const chartTheme = useMemo(() => ({
    background: "transparent",
    text: { fill: theme === 'dark' ? "#9ca3af" : "#475569", fontSize: 11 },
    axis: {
      domain: { line: { stroke: theme === 'dark' ? "#374151" : "#e2e8f0", strokeWidth: 1 } },
      ticks: {
        line: { stroke: theme === 'dark' ? "#374151" : "#e2e8f0", strokeWidth: 1 },
        text: { fill: theme === 'dark' ? "#9ca3af" : "#64748b", fontSize: 10 }
      }
    },
    grid: { line: { stroke: theme === 'dark' ? "#1f2937" : "#f1f5f9", strokeWidth: 1 } },
    legends: { text: { fill: theme === 'dark' ? "#e5e7eb" : "#475569", fontWeight: 600 } },
    tooltip: {
      container: {
        background: theme === 'dark' ? "#1f2937" : "#ffffff",
        color: theme === 'dark' ? "#e5e7eb" : "#0f172a",
        fontSize: 12,
        borderRadius: 8,
        boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
        border: `1px solid ${theme === 'dark' ? "#374151" : "#e2e8f0"}`,
      },
    },
  }), [theme]);

  return (
    <div className="w-full">
      
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 px-2">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-gradient-to-br from-[#7ED957] to-[#59ab38] rounded-2xl shadow-lg shadow-[#7ED957]/20">
            <Brain className="w-8 h-8 text-black" />
          </div>
          <div>
            <h1 className={`text-3xl font-black tracking-tight leading-none ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Intelligence Prédictive</h1>
            <p className={`mt-2 font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              Analyses stratégiques et projections financières à 6 mois.
            </p>
          </div>
        </div>
        

      </div>

      <div className="pb-12 space-y-8 px-2">
        
        {/* ── Top Stats Row ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s, i) => (
            <div key={i} className={`p-6 rounded-2xl border shadow-sm relative overflow-hidden group hover:scale-[1.02] transition-all cursor-default ${theme === 'dark' ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
              <div className="flex justify-between items-start relative z-[1]">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#7ED957] mb-1">{s.label}</p>
                  <h3 className="text-2xl font-black">{s.value}</h3>
                </div>
                <div className={`p-3 rounded-xl ${theme === 'dark' ? 'bg-gray-900/50' : 'bg-slate-50'}`}>
                  <s.icon className={`w-5 h-5 ${
                    s.color === 'blue' ? 'text-blue-500' : 
                    s.color === 'emerald' ? 'text-emerald-500' : 
                    s.color === 'red' ? 'text-red-500' : 'text-purple-500'
                  }`} />
                </div>
              </div>
              {/* Subtle background decoration */}
              <div className={`absolute -right-4 -bottom-4 w-24 h-24 opacity-5 bg-${s.color}-500 rounded-full blur-3xl group-hover:opacity-10 transition-opacity`}></div>
            </div>
          ))}
        </div>

        {/* ── Main Forecast Chart Section ── */}
        <div className={`p-6 rounded-3xl border shadow-xl ${theme === 'dark' ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
               <h2 className="text-xl font-bold flex items-center gap-2">
                 <TrendingUp className="text-[#7ED957]" size={22} />
                 Trajectoire Financière Prévisionnelle
               </h2>
               <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                 Projection du chiffre d'affaires et des coûts basés sur les contrats signés et les tendances passées.
               </p>
            </div>
            <div className="flex items-center gap-2">
               <button 
                onClick={() => setViewMonths(6)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${viewMonths === 6 ? 'bg-[#7ED957] text-black shadow-lg shadow-[#7ED957]/20' : 'border border-slate-200 dark:border-gray-700 hover:bg-slate-50 dark:hover:bg-gray-900'}`}
               >
                 Vue 6 mois
               </button>
               <button 
                onClick={() => setViewMonths(12)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${viewMonths === 12 ? 'bg-[#7ED957] text-black shadow-lg shadow-[#7ED957]/20' : 'border border-slate-200 dark:border-gray-700 hover:bg-slate-50 dark:hover:bg-gray-900'}`}
               >
                 Vue 12 mois
               </button>
            </div>
          </div>

          {/* Manual Legend to avoid clipping */}
          <div className="flex justify-end gap-6 mb-2 px-4 transition-all">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#ef4444]"></div>
              <span className="text-xs font-bold uppercase tracking-tighter opacity-70">Coûts</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#7ED957]"></div>
              <span className="text-xs font-bold uppercase tracking-tighter opacity-70">Marge</span>
            </div>
          </div>

          <div className="h-[380px] w-full">
            <ResponsiveLine
              data={forecastData}
              margin={{ top: 20, right: 30, bottom: 50, left: 60 }}
              xScale={{ type: 'point' }}
              yScale={{ type: 'linear', min: 'auto', max: 'auto', stacked: false, reverse: false }}
              axisBottom={{
                tickSize: 0,
                tickPadding: 15,
                legend: 'Période prévisonnelle',
                legendOffset: 40,
                legendPosition: 'middle',
              }}
              axisLeft={{
                tickSize: 0,
                tickPadding: 15,
                legend: 'Montant (€)',
                legendOffset: -50,
                legendPosition: 'middle',
                format: v => `${v/1000}k`
              }}
              colors={{ datum: 'color' }}
              pointSize={12}
              pointColor="#fff"
              pointBorderWidth={3}
              pointBorderColor={{ from: 'serieColor' }}
              pointLabelYOffset={-12}
              useMesh={true}
              curve="catmullRom"
              enableArea={true}
              areaOpacity={0.05}
              enableGridX={false}
              theme={chartTheme}
            />
          </div>
        </div>

        {/* ── Risk Radar & Strategy Section ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-4">
          
          {/* Radar de Risques */}
          <div className={`p-6 rounded-3xl border shadow-sm flex flex-col ${theme === 'dark' ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <AlertTriangle className="text-red-500" size={20} />
                Radar de Risques (3 mois)
              </h2>
              <span className="text-[10px] font-black bg-red-100 text-red-600 px-2 py-0.5 rounded-full uppercase">Crucial</span>
            </div>
            
            <div className="space-y-3">
              {loading ? (
                <div className="flex justify-center p-8"><Loader2 className="animate-spin text-[#7ED957]" /></div>
              ) : forecastResults?.reasons?.length > 0 ? (
                forecastResults.reasons.map((r, i) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-gray-900 border border-transparent hover:border-red-500/20 transition-all cursor-pointer group">
                    <div className="flex items-center gap-4">
                      <div className="w-2 h-10 rounded-full bg-red-500"></div>
                      <div>
                        <h4 className="font-bold text-sm">Risque Détecté</h4>
                        <p className="text-xs opacity-50">{r}</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center opacity-50 text-sm">Aucun risque critique détecté par l'IA.</div>
              )}
            </div>
            
            <button className="mt-6 w-full py-3 rounded-xl border border-dashed border-slate-300 dark:border-gray-600 text-xs font-bold opacity-60 hover:opacity-100 transition-opacity">
              Voir tous les risques détectés
            </button>
          </div>

          {/* AI Strategy Recommendations */}
          <div className={`p-6 rounded-3xl border shadow-sm flex flex-col hover:shadow-lg transition-all duration-500 ${theme === 'dark' ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
            <h2 className="text-lg font-bold flex items-center gap-2 mb-6">
              <Zap className="text-amber-500 animate-pulse" size={20} />
              Recommandations Stratégiques
            </h2>
            
             <div className="space-y-4">
              {forecastResults?.strategic_recommendations?.length > 0 ? (
                forecastResults.strategic_recommendations.map((rec, i) => {
                  const Icon = rec.type === 'RECRUITMENT' ? UserPlus : rec.type === 'COSTS' ? AlertTriangle : rec.type === 'STRATEGY' ? Target : TrendingUp;
                  const bgColor = rec.priority === 'Critical' ? 'bg-red-500/10' : rec.priority === 'High' ? 'bg-amber-500/10' : 'bg-[#7ED957]/10';
                  const borderColor = rec.priority === 'Critical' ? 'border-red-500/20' : rec.priority === 'High' ? 'border-amber-500/20' : 'border-[#7ED957]/20';
                  const iconBg = rec.priority === 'Critical' ? 'bg-red-500' : rec.priority === 'High' ? 'bg-amber-500' : 'bg-[#7ED957]';
                  const iconColor = rec.priority === 'High' ? 'text-white' : 'text-black';

                  return (
                    <div key={i} className={`p-4 rounded-2xl ${bgColor} border ${borderColor} relative overflow-hidden group/rec hover:bg-opacity-20 transition-all duration-300 transform hover:-translate-y-1`}>
                      <div className="flex gap-4 relative z-[1]">
                        <div className={`p-2 ${iconBg} rounded-lg h-fit ${iconColor} shadow-lg transition-transform group-hover/rec:scale-110`}>
                          <Icon size={16} />
                        </div>
                        <div>
                          <h4 className="font-black text-xs uppercase tracking-tight">{rec.title}</h4>
                          <p className="text-sm mt-1 leading-relaxed">
                            {rec.advice}
                          </p>
                        </div>
                      </div>
                      <div className="absolute right-[-10px] top-[-10px] opacity-10 group-hover/rec:opacity-20 transition-opacity rotate-12">
                        <Icon size={60} />
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center border border-dashed border-slate-200 dark:border-gray-700 rounded-2xl opacity-50 italic text-sm">
                  Détection en cours... Vos indicateurs actuels suggèrent une trajectoire stable.
                </div>
              )}
            </div>

            <div className="mt-auto pt-6 flex items-center justify-between text-[11px] font-bold opacity-40">
              <span className="flex items-center gap-1"><Info size={12} /> Basé sur 18 mois d'historique</span>
              <span className="hover:underline cursor-pointer">En savoir plus sur l'IA</span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}