import React, { useState, useEffect } from 'react';
import { AlertTriangle, TrendingUp, TrendingDown, BrainCircuit, Activity } from 'lucide-react';
import api from '../../api/axios';

/**
 * Composant ForecastingAlert
 * Affiche les prévisions financières (marge, rentabilité) pour un projet ou pour l'entreprise entière.
 * Il interroge l'API backend `/forecast/global` ou `/forecast/:projectId`.
 * Gère les états de chargement, d'erreur, et affiche les résultats (cartes de prévisions + alerte).
 *
 * @param {Object} props
 * @param {string|number} props.projectId - Identifiant du projet (si global=false)
 * @param {string} props.theme - Thème 'dark' ou 'light' pour les couleurs
 * @param {boolean} props.global - Si true, prévisions globales, sinon prévisions par projet
 * @param {number} props.months - Nombre de mois à prévoir (défaut 3)
 */
const ForecastingAlert = ({ projectId, theme, global = false, months = 3 }) => {
  // État local : chargement, données de prévision, message d'erreur
  const [loading, setLoading] = useState(true);
  const [forecast, setForecast] = useState(null);
  const [error, setError] = useState(null);

  // Effet pour déclencher l'appel API dès que le composant est monté
  // ou lorsque les dépendances (projectId, global, months) changent
  useEffect(() => {
    // Fonction asynchrone qui récupère les prévisions depuis le backend
    const fetchForecast = async () => {
      try {
        setLoading(true);
        // Construction de l'endpoint selon le mode (global ou projet)
        const endpoint = global
          ? `/forecast/global?months=${months}`
          : `/forecast/${projectId}?months=${months}`;
        // Appel Axios (instance préconfigurée avec baseURL et token)
        const res = await api.get(endpoint);
        setForecast(res.data);
      } catch (err) {
        console.error("Erreur lors de la récupération des prévisions :", err);
        setError("Impossible de charger les prévisions IA.");
      } finally {
        setLoading(false);
      }
    };

    // On exécute la requête seulement si on est en mode global
    // ou si un projectId valide (non null) est fourni
    if (global || (projectId && projectId !== 'null')) {
      fetchForecast();
    }
  }, [projectId, global, months]); // Dépendances : relancer si l'une de ces valeurs change

  // --- Rendu conditionnel : chargement ---
  if (loading) {
    return (
      <div className={`p-4 rounded-xl flex items-center gap-3 animate-pulse ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
        <Activity className="text-[#7ED957] animate-spin" size={20} />
        <span className="text-sm">Analyse prédictive en cours...</span>
      </div>
    );
  }

  // --- Rendu conditionnel : erreur ou absence de prévisions (données insuffisantes) ---
  if (error || !forecast || forecast.predictions.length === 0) {
    // On n'affiche un message que si le chargement est terminé
    if (!loading) {
      // Le backend peut fournir une raison dans forecast.reason
      const reason = forecast?.reason ||
        (global
          ? "Analyse Machine Learning : Données globales insuffisantes."
          : "Historique insuffisant pour ce projet (minimum 2 mois requis).");
      return (
        <div className={`mt-4 p-4 rounded-xl border border-dashed text-center ${theme === 'dark' ? 'bg-gray-800/20 border-gray-700' : 'bg-gray-50/50 border-gray-200'}`}>
          <p className="text-xs opacity-50 italic">{reason}</p>
        </div>
      );
    }
    return null;
  }

  // --- Rendu principal : prévisions disponibles ---
  // Détermine la couleur de fond et de bordure selon l'alerte et le thème
  const alertClass = forecast.alert
    ? (theme === 'dark' ? 'bg-red-900/20 border-red-500/50' : 'bg-red-50 border-red-100')
    : (theme === 'dark' ? 'bg-green-900/10 border-green-500/30' : 'bg-green-50 border-green-100');

  return (
    <div className={`mt-6 p-6 rounded-2xl border transition-all ${alertClass}`}>
      {/* En-tête : titre + badge de tendance */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {/* Icône IA avec cercle coloré selon alerte */}
          <div className={`p-2 rounded-lg ${forecast.alert ? 'bg-red-500 text-white' : 'bg-[#7ED957] text-black'}`}>
            <BrainCircuit size={20} />
          </div>
          <h4 className="font-bold text-lg">
            {global ? "Prévisions Globales (Total Entreprise)" : "Prévisions du Projet"}
          </h4>
        </div>
        {/* Badge de tendance (hausse/baisse) */}
        <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
          forecast.trend === 'up' ? 'bg-green-500/20 text-green-500' : 'bg-amber-500/20 text-amber-500'
        }`}>
          Tendance: {forecast.trend === 'up' ? <TrendingUp size={14} className="inline mr-1" /> : <TrendingDown size={14} className="inline mr-1" />}
          {forecast.trend === 'up' ? 'Croissante' : 'Décroissante'}
        </div>
      </div>

      {/* Grille des prévisions mensuelles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {forecast.predictions.map((pred, idx) => (
          <div key={idx} className={`p-4 rounded-xl border ${
            theme === 'dark' ? 'bg-gray-900/50 border-gray-700' : 'bg-white border-gray-100 shadow-sm'
          }`}>
            <p className="text-xs uppercase opacity-50 mb-1">{pred.month}</p>
            <p className="text-[10px] opacity-40">Marge estimée</p>
            <p className={`text-xl font-black ${pred.predicted_rentabilite >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(pred.predicted_rentabilite)}
            </p>
          </div>
        ))}
      </div>

      {/* Bloc d'alerte si la tendance est négative ou si le modèle détecte un risque */}
      {forecast.alert && (
        <div className={`mt-4 p-3 rounded-lg flex items-start gap-3 text-sm font-medium ${
          theme === 'dark' ? 'bg-red-500/20 text-red-100' : 'bg-red-100 text-red-800'
        }`}>
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <div>
            <p className="font-bold mb-1">Alerte Rentabilité !</p>
            <ul className="list-disc list-inside opacity-90">
              {forecast.reasons.map((r, i) => <li key={i}>{r}</li>)}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default ForecastingAlert;