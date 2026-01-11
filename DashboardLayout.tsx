
import React, { useState } from 'react';
import Sidebar from './Sidebar';
import { NavSection } from '../types';
import { FaBars } from 'react-icons/fa';
import { useLanguage } from '../hooks/useLanguage'; // Import useLanguage hook

interface DashboardLayoutProps {
  currentSection: NavSection;
  onNavigate: (section: NavSection) => void;
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ currentSection, onNavigate, children }) => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const { lang, setLang, t } = useLanguage(); // Use the translation hook

  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Mobile sidebar toggle */}
      <div className="lg:hidden fixed top-0 left-0 z-20 p-4">
        <button onClick={toggleMobileSidebar} className="text-gray-700 focus:outline-none" aria-label={t('Close sidebar')}>
          <FaBars className="h-6 w-6" />
        </button>
      </div>

      <Sidebar
        currentSection={currentSection}
        onNavigate={onNavigate}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      <main className="flex-1 overflow-y-auto p-4 lg:p-8 pt-16 lg:pt-8"> {/* Added pt-16 for mobile to avoid content behind toggle */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-extrabold text-gray-900 leading-tight">
            {t('Welcome, ')} {currentSection === NavSection.DAILY_ENTRY ? t('Daily Entry') : t(currentSection as any)}
          </h1>
          <div className="flex space-x-2">
            <button
              onClick={() => setLang('en')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors
                          ${lang === 'en' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
              aria-label={t('Switch to English')}
            >
              {t('English')}
            </button>
            <button
              onClick={() => setLang('bn')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors
                          ${lang === 'bn' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
              aria-label={t('Switch to Bengali')}
            >
              {t('Bengali')}
            </button>
          </div>
        </div>
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;
