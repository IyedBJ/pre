import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom'; 
import SaisieIndividuelle from './SaisieIndividuelle';
import SaisieGroupe from './SaisieGroupe';
import SaisieSalarieUnique from './SaisieSalarieUnique';
import Dashboard from './Dashboard';
import logo from "../assets/logoelzei.png";
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import ThemeToggle from '../components/Shared/ThemeToggle';
import GestionSalarie from './GestionSalarie';
import Clients from './Clients';
import GestionProjets from './GestionProjets';
import Facturation from './Facturation';
import PrevisionIa from './PrevisionIA';
import Historique from './Historique';
import Simulation from './Simulation';
import Paramètres from './Paramètres';
import ChatbotWidget from '../components/Chatbot/ChatbotWidget';
import { 
  LayoutDashboard, 
  ClipboardList, 
  FileArchive,
  Users, 
  Briefcase, 
  UserSquare2,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Receipt,
  TrendingUp,
  Calculator,
  History,
  Settings,
  Zap
} from 'lucide-react';

const Home = () => {
  const location = useLocation(); 
  const { logout, user } = useAuth();
  const { theme } = useTheme();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const navItems = [
    { name: 'Tableau de bord', path: '/home', icon: LayoutDashboard },
    
    // GESTION
    { name: user?.role === 'finance' ? 'Salariés' : 'Salariés', path: '/gestion-salaries', roles: ['admin', 'finance'], icon: Users, section: 'Gestion' },
    { name: user?.role === 'finance' ? 'Projets' : 'Projets', path: '/gestion-projets', roles: ['admin', 'finance'], icon: Briefcase, section: 'Gestion' },
    { name: 'Clients', path: '/clients', roles: ['admin', 'finance'], icon: UserSquare2, section: 'Gestion' },
    { name: user?.role === 'finance' ? 'Factures' : 'Facturation', path: '/facturation', roles: ['admin', 'finance'], icon: Receipt, section: 'Gestion' },
    
    // SAISIE
    { name: 'Saisie individuelle', path: '/saisie-individuelle', roles: ['admin', 'finance'], icon: ClipboardList, section: 'Saisie' },
    { name: 'Saisie multipériode', path: '/saisie-salarie', roles: ['admin', 'finance'], icon: Calculator, section: 'Saisie' },
    { name: 'Saisie multisalariés', path: '/saisie-groupe', roles: ['admin', 'finance'], icon: FileArchive, section: 'Saisie' },
    
    // AFFICHAGE
    { name: 'Historique Salarié', path: '/historique', roles: ['admin', 'finance'], icon: History, section: 'Affichage' },
    { name: 'Prevision IA', path: '/prevision-ia', roles: ['admin', 'finance'], icon: TrendingUp, section: 'Affichage' },
    { name: 'Simulation', path: '/simulation', roles: ['admin', 'finance'], icon: Zap, section: 'Affichage' },
    
    { name: 'Paramètres', path: '/parameters', roles: ['admin'], icon: Settings },
  ].filter(item => !item.roles || (user && item.roles.includes(user.role)));


  const handleLogout = () => {
    logout();
  };

  return (
    <div className="flex h-screen overflow-hidden">


      <aside className={`${isSidebarCollapsed ? 'w-22' : 'w-66'} bg-[var(--bg-sidebar)] text-white flex-shrink-0 flex flex-col transition-all duration-300 overflow-hidden`}>
        <div className="flex justify-center items-center mb-2 mt-4">
          <img 
            src={logo} 
            alt="Elzei Logo"
            className={`${isSidebarCollapsed ? 'w-10 h-10' : 'w-20 h-20'} object-contain transition-all duration-300`}
          />
        </div>

        <nav className="flex-1 px-3 flex flex-col gap-y-0.5 overflow-y-auto no-scrollbar">
          {navItems.map((item, index) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            const isLast = index === navItems.length - 1;
            
            // Logique de sections
            const prevItem = navItems[index - 1];
            const isNewSection = item.section && (!prevItem || prevItem.section !== item.section);

            return (
              <React.Fragment key={item.path}>
                {isNewSection && (
                  <div className={`mt-3 mb-1 flex flex-col ${isSidebarCollapsed ? 'items-center' : 'px-4'}`}>
                    <div className="w-full border-t border-black/5 mb-1.5"></div>
                    {!isSidebarCollapsed && (
                      <span className="text-[9px] font-bold text-black/40 uppercase tracking-[0.15em]">{item.section}</span>
                    )}
                  </div>
                )}

                <Link
                  to={item.path}
                  className={`flex items-center px-4 py-2 rounded-lg transition-all duration-200 group relative ${
                    isActive
                      ? 'bg-black/10 text-slate-900 font-bold shadow-sm'
                      : 'text-slate-800/70 hover:bg-black/5 hover:text-slate-900'
                  } ${isSidebarCollapsed ? 'justify-center mx-1' : 'mx-1'}`}
                  title={isSidebarCollapsed ? item.name : ''}
                >
                  {isActive && (
                    <div className="absolute left-0 w-1.5 h-4 bg-black/20 rounded-r-full"></div>
                  )}
                  <Icon 
                    size={18} 
                    className={`${isSidebarCollapsed ? '' : 'mr-2.5'} transition-all duration-200 group-hover:scale-110 ${isActive ? 'text-black' : ''}`} 
                  />
                  {!isSidebarCollapsed && <span className="text-[13px]">{item.name}</span>}
                </Link>

                
                {isLast && (
                  <div className="mt-auto pt-4 pb-4">
                    <div className="border-t border-white/5 mx-5 mb-4"></div>
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </nav>


      </aside>


  
      <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-gray-900 transition-colors duration-300">
        <div className="w-full flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 sticky top-0 z-40 transition-colors duration-300">

          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="flex items-center gap-2 px-5 py-2 bg-[#1e1e1e] text-white rounded-lg shadow hover:bg-black transition"
          >
            {isSidebarCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>


          <div className="flex items-center gap-6">
            <ThemeToggle collapsed={false} />

            <div className="flex flex-col items-end text-sm">
              <span className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>{user?.username}</span>
              <span className={`text-[10px] uppercase font-medium tracking-wider ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>{user?.role}</span>
            </div>
            <button
              onClick={handleLogout} 
              className="px-5 py-2 bg-red-600 text-white rounded-lg shadow hover:bg-red-700 transition"
            >
              Se déconnecter
            </button>
          </div>
        </div>


        <div className="p-6">
          {location.pathname === '/home' ? (
            <Dashboard />
          ) : location.pathname === '/saisie-individuelle' && (user?.role === 'admin' || user?.role === 'finance') ? (
            <SaisieIndividuelle />
          ) : location.pathname === '/saisie-groupe' && (user?.role === 'admin' || user?.role === 'finance') ? (
            <SaisieGroupe />
          ) : location.pathname === '/saisie-salarie' && (user?.role === 'admin' || user?.role === 'finance') ? (
            <SaisieSalarieUnique />
          ) : location.pathname === '/historique' && (user?.role === 'admin' || user?.role === 'finance') ? (
            <Historique />
          ) : location.pathname === '/gestion-salaries' && (user?.role === 'admin' || user?.role === 'finance') ? (
            <GestionSalarie />
          ) : location.pathname === '/gestion-projets' && (user?.role === 'admin' || user?.role === 'finance') ? (
            <GestionProjets />
          ) : location.pathname === '/clients' && (user?.role === 'admin' || user?.role === 'finance') ? (
            <Clients />
          ) : location.pathname === '/facturation' && (user?.role === 'admin' || user?.role === 'finance') ? (
            <Facturation />
          ) : location.pathname === '/prevision-ia' && (user?.role === 'admin' || user?.role === 'finance') ? (
            <PrevisionIa />
          ) : location.pathname === '/simulation' && (user?.role === 'admin' || user?.role === 'finance') ? (
            <Simulation />
          ) : location.pathname === '/parameters' && user?.role === 'admin' ? (
            <Paramètres />
          ) :
           (
            <div className={`flex flex-col items-center justify-center h-64 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>
              <h2 className={`text-2xl font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>Bienvenue, {user?.username}</h2>
              <p>Rôle: {user?.role}</p>
              <p className="mt-4">Sélectionnez une option dans le menu à gauche pour commencer.</p>
            </div>
          )}
        </div>

      </main>
      <ChatbotWidget />
    </div>
  );
};

export default Home;
