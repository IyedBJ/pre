import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { ThemeProvider as MuiThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

// Création du contexte qui permettra de partager l'état du thème dans toute l'application
const ThemeContext = createContext();

// Hook personnalisé pour utiliser le thème facilement dans n'importe quel composant
// eslint-disable-next-line react-refresh/only-export-components
export const useTheme = () => useContext(ThemeContext);

// Fournisseur de thème : il englobe l'application et gère le mode clair/sombre
export const ThemeProvider = ({ children }) => {
  // État local du thème : initialisé avec la valeur stockée dans localStorage ou 'light' par défaut
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  // Création du thème Material UI (optimisée avec useMemo pour ne recalculer que quand 'theme' change)
  const muiTheme = useMemo(() => 
    createTheme({
      palette: {
        mode: theme,              // 'light' ou 'dark' : adapte automatiquement les couleurs MUI
        primary: {
          main: '#7ED957',       // Couleur personnalisée (vert) pour les éléments principaux
        },
        background: {
          default: theme === 'dark' ? '#111827' : '#ffffff', // Fond général
          paper: theme === 'dark' ? '#1f2937' : '#ffffff',   // Fond des cartes, modales, etc.
        },
      },
      typography: {
        fontFamily: '"Poppins", sans-serif', // Police globale de l'application
      },
    }), [theme]);

  // Effet de bord : synchronise la classe 'dark' sur l'élément racine (<html>) pour Tailwind CSS,
  // et sauvegarde la préférence dans localStorage à chaque changement de thème
  useEffect(() => {
    const root = window.document.documentElement; // Récupère l'élément <html>
    if (theme === 'dark') {
      root.classList.add('dark');    // Ajoute la classe 'dark' → active les styles Tailwind avec 'dark:'
    } else {
      root.classList.remove('dark'); // Supprime la classe → mode clair Tailwind
    }
    localStorage.setItem('theme', theme); // Persistance du choix utilisateur
  }, [theme]); // Se réexécute à chaque fois que 'theme' change

  // Fonction pour basculer entre les deux thèmes
  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  // Rendu du fournisseur : met à disposition le thème et la fonction de bascule,
  // enveloppe les enfants avec le ThemeProvider MUI et le CssBaseline (normalisation CSS)
  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <MuiThemeProvider theme={muiTheme}>
        <CssBaseline />      {/* Réinitialise les styles CSS et applique le fond MUI */}
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};

// Ce composant permet à l’utilisateur de passer du mode clair au mode sombre selon ses préférences,
// réduisant la fatigue visuelle en environnement peu lumineux.