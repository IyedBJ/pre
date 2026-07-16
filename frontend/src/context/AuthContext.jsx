import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';
import { useNavigate } from 'react-router-dom';

// Création du contexte d'authentification
const AuthContext = createContext();

// Hook personnalisé pour utiliser le contexte d'authentification facilement N'importe quel composant peut appeler useAuth() pour récupérer user, login, logout et loading.
// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  return useContext(AuthContext);
};

// Fournisseur de contexte qui enveloppe l'application
export const AuthProvider = ({ children }) => {
  // État de l'utilisateur connecté (null si déconnecté)
  const [user, setUser] = useState(null);
  // État de chargement initial (vérification du localStorage)
  const [loading, setLoading] = useState(true);
  // Hook pour la navigation programmatique
  const navigate = useNavigate();

  // Effet exécuté au montage du composant : restaure la session persistante
  useEffect(() => {
    const checkAuth = async () => {
      // Récupération des données stockées dans le navigateur
      const token = localStorage.getItem('userToken');
      const storedUser = localStorage.getItem('userInfo');

      // Si token et infos utilisateur existent, on restaure la session
      if (token && storedUser) {
        const parsedUser = JSON.parse(storedUser);
        // Normalisation du rôle : le backend peut envoyer 'rôle' (avec accent) ou 'role'
        const normalizedUser = { ...parsedUser, role: parsedUser.rôle || parsedUser.role };
        setUser(normalizedUser);
      }
      // Fin du chargement initial
      setLoading(false);
    };

    checkAuth();
  }, []); // Le tableau de dépendances vide garantit une exécution unique


  const login = async (username, password) => {
    try {
      // Requête POST vers l'endpoint d'authentification
      const response = await api.post('/auth/login', { username, password });
      const { token, user } = response.data;
      
      // Normalisation du rôle pour éviter les incohérences
      const normalizedUser = { ...user, role: user.rôle || user.role };

      // Persistance des données dans le localStorage
      localStorage.setItem('userToken', token);
      localStorage.setItem('userInfo', JSON.stringify(normalizedUser));
      
      // Mise à jour de l'état global
      setUser(normalizedUser);
      
      // Retourne l'utilisateur pour permettre d'éventuelles actions post-connexion
      return normalizedUser; 
    } catch (error) {
      console.error("Login failed", error);
      throw error; // Propage l'erreur pour gestion par l'appelant
    }
  };

  /**
   * Fonction de déconnexion
   * Supprime les données persistées, réinitialise l'état et redirige vers l'accueil
   */
  const logout = () => {
    // Nettoyage du localStorage
    localStorage.removeItem('userToken');
    localStorage.removeItem('userInfo');
    // Réinitialisation de l'état utilisateur
    setUser(null);
    // Redirection vers la page d'accueil
    navigate('/');
  };

  // Valeurs exposées par le contexte
  const value = {
    user,      // Utilisateur connecté ou null
    login,     // Fonction de connexion
    logout,    // Fonction de déconnexion
    loading    // Indique si la vérification initiale est terminée
  };

  return (
    <AuthContext.Provider value={value}>
      {/* On n'affiche les enfants qu'après la fin du chargement initial */}
      {!loading && children}
    </AuthContext.Provider>
  );
};