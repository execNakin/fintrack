
import React from 'react';
import { HashRouter, Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { Home, History, Target, Landmark, Settings, Wallet, BrainCircuit, Repeat } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

import DashboardPage from './pages/DashboardPage';
import HistoryPage from './pages/HistoryPage';
import BudgetPage from './pages/BudgetPage';
import InvestmentsPage from './pages/InvestmentsPage';
import AutomationsPage from './pages/AutomationsPage';
import AnalysisPage from './pages/AnalysisPage';
import SettingsPage from './pages/SettingsPage';
import { DataProvider } from './contexts/DataContext';
import { LocaleProvider, useLocale } from './contexts/LocaleContext';

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  in: { opacity: 1, y: 0 },
  out: { opacity: 0, y: -20 },
};

const pageTransition = {
  type: 'tween',
  ease: 'anticipate',
  duration: 0.5,
};

const NAV_ITEMS = (t: (key: string) => string) => [
  { to: '/', label: t('nav_dashboard'), icon: Home },
  { to: '/history', label: t('nav_history'), icon: History },
  { to: '/budgets', label: t('nav_budgets'), icon: Target },
  { to: '/investments', label: t('nav_investments'), icon: Landmark },
  { to: '/automations', label: t('nav_automations'), icon: Repeat },
  { to: '/analysis', label: t('nav_analysis'), icon: BrainCircuit },
  { to: '/settings', label: t('nav_settings'), icon: Settings },
];

const NavItem: React.FC<{ to: string; label: string; icon: React.ElementType }> = ({ to, label, icon: Icon }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `flex items-center p-3 my-1 rounded-lg transition-colors duration-200 ${
        isActive
          ? 'bg-brand-yellow text-brand-dark'
          : 'text-gray-300 hover:bg-brand-dark hover:text-white'
      }`
    }
  >
    <Icon className="w-6 h-6 mr-4" />
    <span className="font-semibold">{label}</span>
  </NavLink>
);

const AppContent: React.FC = () => {
    const location = useLocation();
    const { t } = useLocale();
    
    return (
        <div className="flex h-screen bg-brand-bg text-gray-100 font-sans">
          <aside className="w-64 bg-brand-dark p-4 flex flex-col shrink-0">
            <div className="flex items-center mb-8">
              <Wallet className="w-10 h-10 text-brand-yellow mr-3" />
              <h1 className="text-2xl font-bold text-white">{t('appName')}</h1>
            </div>
            <nav className="flex-grow">
              {NAV_ITEMS(t).map(item => <NavItem key={item.to} {...item} />)}
            </nav>
            <div className="text-xs text-gray-500 text-center">
              {t('appSubtitle')}
            </div>
          </aside>

          <main className="flex-1 overflow-y-auto bg-brand-bg">
            <AnimatePresence mode="wait">
                <motion.div
                    key={location.pathname}
                    initial="initial"
                    animate="in"
                    exit="out"
                    variants={pageVariants}
                    transition={pageTransition}
                    className="p-4 sm:p-6 lg:p-8"
                >
                    <Routes location={location}>
                        <Route path="/" element={<DashboardPage />} />
                        <Route path="/history" element={<HistoryPage />} />
                        <Route path="/budgets" element={<BudgetPage />} />
                        <Route path="/investments" element={<InvestmentsPage />} />
                        <Route path="/automations" element={<AutomationsPage />} />
                        <Route path="/analysis" element={<AnalysisPage />} />
                        <Route path="/settings" element={<SettingsPage />} />
                    </Routes>
                </motion.div>
            </AnimatePresence>
          </main>
        </div>
    );
}


const App: React.FC = () => {
  return (
    <LocaleProvider>
      <DataProvider>
        <HashRouter>
            <AppContent />
        </HashRouter>
      </DataProvider>
    </LocaleProvider>
  );
};

export default App;
