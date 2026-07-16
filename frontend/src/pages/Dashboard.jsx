import { useState, useEffect, useMemo } from "react";
import { Toaster } from "react-hot-toast";
import { ResponsiveLine } from "@nivo/line";
import { ResponsiveBar } from "@nivo/bar";
import { ResponsivePie } from "@nivo/pie";
import {
  LayoutDashboard,
  Users,
  Briefcase,
  TrendingUp,
  PieChart,
  RefreshCw,
  Trophy,
  Target,
  Activity
} 
from "lucide-react";
import { useData } from "../context/DataContext";
import { useTheme } from "../context/ThemeContext";
import toast from "react-hot-toast";
// Convertit une date ISO en clé "YYYY-MM" pour l'agrégation mensuelle  

// Troncature intelligente pour les labels, avec ajout de points de suspension si nécessaire "12345678901234…" 
function truncateLabel(s, max = 14) {
  if (!s) return "—";
  const t = String(s);
  return t.length <= max ? t : `${t.slice(0, max)}…`;
}
// Formatage monétaire en euros, sans décimales, avec symbole "1 234 €"
const formatCurrency = (val) => 
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(val);
// Fonction principale du tableau de bord, affichant les indicateurs clés, les classements et les graphiques de performance
export default function Dashboard() {
  const { employees, projects, monthlyData, fetchEmployees, fetchProjects, fetchMonthlyData } = useData();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  // Configuration thématique pour les graphiques Nivo, adaptée au thème clair ou sombre de l'application
  const chartTheme = useMemo(() => ({
    background: "transparent",
    text: { fill: theme === 'dark' ? "#e5e7eb" : "#475569", fontSize: 12 },
    axis: {
      domain: { line: { stroke: theme === 'dark' ? "#374151" : "#cbd5e1", strokeWidth: 1 } },
      ticks: {
        line: { stroke: theme === 'dark' ? "#374151" : "#cbd5e1", strokeWidth: 1 },
        text: { fill: theme === 'dark' ? "#9ca3af" : "#64748b", fontSize: 11 },
      },
      legend: { text: { fill: theme === 'dark' ? "#e5e7eb" : "#334155", fontSize: 12, fontWeight: 600 } },
    },
    grid: { line: { stroke: theme === 'dark' ? "#1f2937" : "#e2e8f0", strokeWidth: 1 } },
    legends: { text: { fill: theme === 'dark' ? "#e5e7eb" : "#475569" } },
    tooltip: {
      container: {
        background: theme === 'dark' ? "#1f2937" : "#ffffff",
        color: theme === 'dark' ? "#e5e7eb" : "#0f172a",
        fontSize: 12,
        borderRadius: 8,
        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
        border: `1px solid ${theme === 'dark' ? "#374151" : "#e2e8f0"}`,
      },
    },
  }), [theme]);
  // Chargement initial des données au montage du composant, avec gestion des erreurs et affichage d'un toast en cas de problème
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        await Promise.all([
          fetchEmployees(),
          fetchProjects(),
          fetchMonthlyData(),
        ]);
      } catch (e) {
        console.error("Erreur de chargement:", e);
        toast.error("Erreur de chargement des données");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [fetchEmployees, fetchProjects, fetchMonthlyData]);
  // Fonction de rafraîchissement manuel des données, déclenchée par le bouton "Actualiser", avec gestion de l'état de chargement et des notifications
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        fetchEmployees(),
        fetchProjects(),
        fetchMonthlyData(),
      ]);
      toast.success("Données actualisées");
    } catch {
      toast.error("Erreur lors de l'actualisation");
    } finally {
      setIsRefreshing(false);
    }
  };
  // Calcul du classement des salariés les plus rentables sur la période, en agrégeant la rentabilité par salarié et en triant les résultats pour n'afficher que les 5 meilleurs
  const topEmployees = useMemo(() => {
    const totals = {};
    monthlyData.forEach(d => {
      const eid = String(d.idEmployé);
      if (!totals[eid]) totals[eid] = 0;
      totals[eid] += (Number(d.rentabilite) || 0);
    });
    return Object.entries(totals)
      .map(([id, margin]) => {
        const emp = employees.find(e => String(e.id) === id);
        return {
          id,
          name: emp?.nom || `Salarié #${id}`,
          margin,
          role: emp?.rôle || 'Salarié'
        };
      })
      .sort((a, b) => b.margin - a.margin)
      .slice(0, 5);
  }, [monthlyData, employees]);
  // Calcul du classement des projets les plus rentables sur la période, en agrégeant la rentabilité par projet et en triant les résultats pour n'afficher que les 5 meilleurs
  const topProjects = useMemo(() => {
    const totals = {};
    monthlyData.forEach(d => {
      const pid = d.idProjet ? String(d.idProjet) : 'null';
      if (!totals[pid]) totals[pid] = 0;
      totals[pid] += (Number(d.rentabilite) || 0);
    });
    return Object.entries(totals)
      .filter(([id]) => id !== 'null')
      .map(([id, margin]) => {
        const proj = projects.find(p => String(p.id) === id);
        return {
          id,
          title: proj?.titre || `Projet #${id}`,
          margin,
          client: proj?.nomClient || 'N/A'
        };
      })
      .sort((a, b) => b.margin - a.margin)
      .slice(0, 5);
  }, [monthlyData, projects]);
  // Calcul de la répartition du chiffre d'affaires par client sur la période, en agrégeant les montants facturés par projet et en regroupant par client, puis en triant pour n'afficher que les 5 clients principaux et regrouper les autres dans une catégorie "Autres"
  const clientDistribution = useMemo(() => {
    const dist = {};
    monthlyData.forEach(d => {
      const proj = projects.find(p => String(p.id) === String(d.idProjet));
      const clientName = proj?.nomClient || 'Autre / Sans Client';
      if (!dist[clientName]) dist[clientName] = 0;
      dist[clientName] += (Number(d.montantFacturé) || 0);
    });
    
      const sorted = Object.entries(dist)
      .map(([label, value]) => ({ 
        id: truncateLabel(label, 20), 
        label: truncateLabel(label, 20), 
        value: Math.round(value) 
      }))
      .sort((a, b) => b.value - a.value);

    // Retourne le top 5 et groupe le reste
    const top5 = sorted.slice(0, 5);
    const others = sorted.slice(5);
    
    if (others.length > 0) {
      top5.push({
        id: 'Autres',
        label: 'Autres',
        value: others.reduce((acc, c) => acc + c.value, 0)
      });
    }
    return top5;
  }, [monthlyData, projects]);
  // Calcul des statistiques globales pour les indicateurs clés du tableau de bord, tels que le nombre total de salariés, le nombre de projets actifs, la marge moyenne, le TJM moyen et le nombre de salariés rentables, en fonction des données chargées
  const stats = useMemo(() => {
    const activeProjects = projects.filter((p) => p.statut === "En cours").length; // Nombre de projets actuellement actifs
    const avgMargin =
      projects.length > 0
        ? Math.round(
            (projects.reduce((acc, p) => acc + (Number(p.marge) || 0), 0) / projects.length) * 10
          ) / 10
        : 0; // Marge moyenne de tous les projets, arrondie à une décimale
    const avgTjmEmp =
      employees.length > 0
        ? Math.round(
            (employees.reduce((acc, e) => acc + (Number(e.tjm) || 0), 0) / employees.length) * 10
          ) / 10
        : 0; // TJM moyen de tous les salariés, arrondi à une décimale
    const rentables = employees.filter((e) => e.statut === "Rentable").length;
    return {
      totalEmployees: employees.length,
      activeProjects,
      avgMargin,
      avgTjmEmp,
      rentables,
      totalProjects: projects.length,
    };
  }, [employees, projects]);
  // Préparation des données pour le graphique en barres de performance des projets, en filtrant les projets avec une marge positive, en triant par marge décroissante et en limitant à 10 projets, avec une couleur conditionnelle selon la rentabilité
  const barProjectPerformance = useMemo(() => {
    return [...projects]
      .filter(p => (Number(p.marge) || 0) > 0)
      .sort((a, b) => (Number(b.marge) || 0) - (Number(a.marge) || 0))
      .slice(0, 10)
      .map(p => ({
        id: truncateLabel(p.titre, 20),
        Marge: Number(p.marge) || 0,
        color: (Number(p.marge) || 0) > 50 ? "#10b981" : "#3b82f6"
      }));
  }, [projects]);
  // Préparation des données pour le graphique en barres du TJM par salarié, en filtrant les salariés avec un TJM positif, en triant par TJM décroissant et en limitant à 10 salariés, avec une troncature du nom pour l'affichage
  const barTjmByEmployee = useMemo(() => {
    return [...employees]
      .filter((e) => (Number(e.tjm) || 0) > 0)
      .sort((a, b) => (Number(b.tjm) || 0) - (Number(a.tjm) || 0))
      .slice(0, 10)
      .map((e) => ({
        name: truncateLabel(e.nom, 18),
        TJM: Number(e.tjm) || 0,
      }));
  }, [employees]);
  // Préparation des données pour le graphique en barres du nombre de projets par statut, en comptant le nombre de projets dans chaque statut défini et en formatant pour l'affichage
  const barProjectsByStatus = useMemo(() => {
    const statuses = ["En cours", "Terminé", "En pause", "Annulé"];
    return statuses.map((s) => ({
      statut: s,
      nombre: projects.filter((p) => p.statut === s).length,
    }));
  }, [projects]);

  const chartCommon = {
    theme: chartTheme,
    animate: true,
    motionConfig: "gentle",
  };

  return (
    <div className={`text-slate-900 font-sans min-h-screen ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-slate-50'}`}>
      <Toaster position="top-right" />

      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 px-6 pt-6">
        <div className="flex items-start gap-3">
          <div className={`p-2.5 rounded-xl ${theme === 'dark' ? 'bg-[#7ED957]/20 text-[#7ED957]' : 'bg-[#7ED957]/15 text-[#3d7a2a]'}`}>
            <LayoutDashboard className="w-7 h-7" />
          </div>
          <div>
            <h1 className={`text-2xl font-bold tracking-tight ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
              Tableau de bord Stratégique
            </h1>
            <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} font-medium mt-1 max-w-2xl`}>
              Analyses de performance, rentabilité client et classements.
            </p>
          </div>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-2 px-6 py-3 bg-[#7ED957] text-black font-semibold rounded-xl hover:bg-[#6FC847] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md"
        >
          <RefreshCw size={18} className={isRefreshing ? 'animate-spin' : ''} />
          Actualiser les données
        </button>
      </div>

      <div className="px-6 pb-6">
        {loading ? (
        <div className={`rounded-lg border shadow-sm p-12 text-center ${theme === 'dark' ? 'bg-gray-800 border-gray-700 text-gray-400' : 'bg-white border-slate-200 text-slate-500'}`}>
          <RefreshCw size={32} className="mx-auto mb-4 animate-spin text-[#7ED957]" />
          Chargement des indicateurs complexes…
        </div>
      ) : (
        <div className="space-y-8">
          {/* Key Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {[
              { label: 'Salariés', value: stats.totalEmployees, sub: `${stats.rentables} rentables`, icon: Users, color: 'blue' },
              { label: 'Projets actifs', value: stats.activeProjects, sub: `${stats.totalProjects} au total`, icon: Briefcase, color: 'amber' },
              { label: 'Marge moyenne', value: `${stats.avgMargin}%`, sub: 'Global', icon: PieChart, color: 'emerald' },
              { label: 'TJM moyen', value: `${stats.avgTjmEmp} €`, sub: 'Par salarié', icon: TrendingUp, color: 'violet' },
            ].map((s, i) => (
              <div key={i} className={`p-5 rounded-2xl border shadow-sm flex items-center justify-between transition-transform hover:scale-[1.02] ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-slate-200'}`}>
                <div>
                  <span className={`text-xs font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-gray-500' : 'text-slate-400'}`}>{s.label}</span>
                  <div className={`text-3xl font-black mt-1 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{s.value}</div>
                  <p className={`text-xs mt-1 font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-slate-500'}`}>{s.sub}</p>
                </div>
                <div className={`p-4 rounded-xl ${
                  s.color === 'blue' ? (theme === 'dark' ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-50 text-blue-600') :
                  s.color === 'amber' ? (theme === 'dark' ? 'bg-amber-900/30 text-amber-400' : 'bg-amber-50 text-amber-600') :
                  s.color === 'emerald' ? (theme === 'dark' ? 'bg-emerald-900/30 text-emerald-400' : 'bg-emerald-50 text-emerald-600') :
                  (theme === 'dark' ? 'bg-violet-900/30 text-violet-400' : 'bg-violet-50 text-violet-600')
                }`}>
                  <s.icon className="w-6 h-6" />
                </div>
              </div>
            ))}
          </div>

          {/* Top Rankings & Clients Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">


            {/* Top Projects Card */}
            <div className={`rounded-2xl border shadow-sm p-6 overflow-hidden relative ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-slate-200'}`}>
              <div className="flex items-center gap-3 mb-6">
                <Target className="text-blue-500" size={24} />
                <h2 className="text-lg font-bold">Top 5 Projets</h2>
              </div>
              <div className="space-y-4">
                {topProjects.map((proj, i) => (
                  <div key={proj.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50/50 dark:bg-gray-900/30 border border-transparent hover:border-blue-500/30 transition-all">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm bg-blue-50 text-blue-600 dark:bg-blue-900/20`}>
                        {i + 1}
                      </div>
                      <div>
                        <p className="font-bold text-sm truncate w-32">{proj.title}</p>
                        <p className="text-[10px] opacity-50 uppercase tracking-tighter">{proj.client}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-blue-500">{formatCurrency(proj.margin)}</p>
                      <p className="text-[10px] opacity-40">Rentabilité</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
                        {/* Top Employees Card */}
            <div className={`rounded-2xl border shadow-sm p-6 overflow-hidden relative ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-slate-200'}`}>
              <div className="flex items-center gap-3 mb-6">
                <Trophy className="text-amber-500" size={24} />
                <h2 className="text-lg font-bold">Top 5 Salariés</h2>
              </div>
              <div className="space-y-4">
                {topEmployees.map((emp, i) => (
                  <div key={emp.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50/50 dark:bg-gray-900/30 border border-transparent hover:border-[#7ED957]/30 transition-all">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                        i === 0 ? 'bg-amber-100 text-amber-600' : 
                        i === 1 ? 'bg-slate-200 text-slate-600' :
                        i === 2 ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-400'
                      }`}>
                        {i + 1}
                      </div>
                      <div>
                        <p className="font-bold text-sm truncate w-32">{emp.name}</p>
                        <p className="text-[10px] opacity-50 uppercase tracking-tighter">{emp.role}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-[#7ED957]">{formatCurrency(emp.margin)}</p>
                      <p className="text-[10px] opacity-40">Marge cumulée</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Client Chart Card */}
            <div className={`rounded-2xl border shadow-sm p-6 flex flex-col ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-slate-200'}`}>
              <div className="flex items-center gap-3 mb-2">
                <PieChart className="text-emerald-500" size={24} />
                <h2 className="text-lg font-bold">Répartition Clients</h2>
              </div>
              <p className="text-xs opacity-50 mb-4">Top 10 par Chiffre d'Affaire</p>
              <div className="h-[250px] w-full mt-auto relative">
                <ResponsivePie
                  data={clientDistribution}
                  margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
                  innerRadius={0}
                  padAngle={0.5}
                  cornerRadius={0}
                  activeOuterRadiusOffset={8}
                  colors={["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#f97316", "#6366f1"]}
                  borderWidth={1}
                  borderColor={{ from: 'color', modifiers: [['darker', 0.2]] }}
                  enableArcLinkLabels={false}
                  arcLabelsTextColor="#ffffff"
                  arcLabelsSkipAngle={15}
                  valueFormat={value => formatCurrency(value)}
                  arcLabel={d => `${Math.round((d.value / (clientDistribution.reduce((acc, c) => acc + c.value, 0) || 1)) * 100)}%`}
                  theme={chartTheme}
                />
              </div>
              
              {/* Custom Legend (Wrapping) */}
              <div className="mt-4 flex flex-wrap justify-center gap-x-4 gap-y-2 px-2">
                {clientDistribution.map((c, i) => (
                  <div key={c.id} className="flex items-center gap-1.5 min-w-fit">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ 
                        backgroundColor: ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#f97316", "#6366f1"][i % 9] 
                      }} 
                    />
                    <span className={`text-[11px] font-bold leading-tight ${theme === 'dark' ? 'text-gray-300' : 'text-slate-700'}`}>
                      {c.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* New Charts: TJM and Project Status */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className={`rounded-2xl border shadow-sm p-6 ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-slate-200'}`}>
              <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                <TrendingUp size={20} className="text-violet-500" />
                Top 10 TJM Salariés
              </h3>
              <div className="h-[300px]">
                <ResponsiveBar
                  data={barTjmByEmployee}
                  keys={['TJM']}
                  indexBy="name"
                  margin={{ top: 20, right: 30, bottom: 50, left: 60 }}
                  padding={0.3}
                  valueScale={{ type: 'linear' }}
                  indexScale={{ type: 'band', round: true }}
                  colors="#8b5cf6"
                  borderRadius={4}
                  axisBottom={{
                    tickSize: 5,
                    tickPadding: 5,
                    tickRotation: -20,
                  }}
                  labelFormat={d => `${d} €`}
                  {...chartCommon}
                />
              </div>
            </div>

            <div className={`rounded-2xl border shadow-sm p-6 ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-slate-200'}`}>
              <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                <Briefcase size={20} className="text-amber-500" />
                Répartition des Projets par Statut
              </h3>
              <div className="h-[300px]">
                <ResponsiveBar
                  data={barProjectsByStatus}
                  keys={['nombre']}
                  indexBy="statut"
                  margin={{ top: 20, right: 30, bottom: 50, left: 60 }}
                  padding={0.3}
                  valueScale={{ type: 'linear' }}
                  indexScale={{ type: 'band', round: true }}
                  colors={({ data }) => 
                    data.statut === 'En cours' ? '#10b981' : 
                    data.statut === 'Terminé' ? '#3b82f6' : 
                    data.statut === 'En pause' ? '#f59e0b' : '#ef4444'
                  }
                  borderRadius={4}
                  axisBottom={{
                    tickSize: 5,
                    tickPadding: 5,
                    tickRotation: 0,
                  }}
                  {...chartCommon}
                />
              </div>
            </div>
          </div>

          {/* Project Performance Section */}
          <div className="pt-4 border-t border-slate-100 dark:border-gray-800">
             <h2 className="text-xl font-bold flex items-center gap-2 mb-1">
               <Activity size={20} className="text-[#3b82f6]" />
               Performance des Marges par Projet
             </h2>
             <p className="text-sm opacity-50 mb-6">Classement des 10 projets les plus rentables en pourcentage de marge nette.</p>
          </div>

          <div className={`rounded-2xl border shadow-sm p-6 mb-8 flex flex-col ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-slate-200'}`}>
            <div className="h-[400px] w-full">
              <ResponsiveBar
                data={barProjectPerformance}
                keys={['Marge']}
                indexBy="id"
                margin={{ top: 20, right: 30, bottom: 60, left: 60 }}
                padding={0.3}
                valueScale={{ type: 'linear' }}
                indexScale={{ type: 'band', round: true }}
                colors={({ data }) => data.color}
                borderColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
                axisTop={null}
                axisRight={null}
                axisBottom={{
                  tickSize: 5,
                  tickPadding: 5,
                  tickRotation: -25,
                  legend: 'Projets',
                  legendPosition: 'middle',
                  legendOffset: 50
                }}
                axisLeft={{
                  tickSize: 5,
                  tickPadding: 5,
                  tickRotation: 0,
                  legend: 'Marge (%)',
                  legendPosition: 'middle',
                  legendOffset: -50
                }}
                labelSkipWidth={12}
                labelSkipHeight={12}
                labelTextColor="#ffffff"
                label={d => `${d.value}%`}
                role="application"
                ariaLabel="Ranking projects by margin performance"
                barAriaLabel={e => e.id + ": " + e.formattedValue + "% de marge"}
                {...chartCommon}
              />
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
