import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';


//bouton permettant à l’utilisateur de basculer entre le mode clair et le mode sombre
const ThemeToggle = ({ collapsed }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 ${
        collapsed ? 'justify-center' : ''
      }`}
      title={theme === 'light' ? 'Mode Sombre' : 'Mode Clair'}
    >
      {theme === 'light' ? (
        <>
          <Moon size={18} className="text-gray-600" />
          <span className="text-sm font-medium text-gray-700">Sombre</span>
        </>
      ) : (
        <>
          <Sun size={18} className="text-yellow-400" />
          <span className="text-sm font-medium text-gray-100">Clair</span>
        </>
      )}
    </button>
  );
};

export default ThemeToggle;