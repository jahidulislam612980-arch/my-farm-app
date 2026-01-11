
import React from 'react';
import { NavSection } from '../types';
import { useAuth } from '../hooks/useAuth';
import { FaEgg, FaChartLine, FaSignOutAlt, FaFeatherAlt, FaListAlt } from 'react-icons/fa';
import { useLanguage } from '../hooks/useLanguage'; // Import useLanguage hook

interface SidebarProps {
  currentSection: NavSection;
  onNavigate: (section: NavSection) => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentSection, onNavigate, isMobileOpen, onCloseMobile }) => {
  const { logout, user } = useAuth();
  const { t } = useLanguage(); // Use the translation hook

  const navItems = [
    { name: NavSection.DAILY_ENTRY, icon: <FaEgg className="mr-3" aria-hidden="true" /> },
    { name: NavSection.VIEW_RECORDS, icon: <FaListAlt className="mr-3" aria-hidden="true" /> },
    { name: NavSection.MONTHLY_ANALYTICS, icon: <FaChartLine className="mr-3" aria-hidden="true" /> },
  ];

  return (
    <>
      {/* Overlay for mobile */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={onCloseMobile}
          aria-label={t('Close sidebar')}
        ></div>
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 w-64 bg-gradient-to-b from-blue-700 to-indigo-800 text-white z-40 transition-transform duration-300 ease-in-out
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static`}
        aria-label={t('Main navigation')}
      >
        <div className="flex items-center justify-center h-20 bg-indigo-900 shadow-md">
          <FaFeatherAlt className="text-3xl mr-2 text-yellow-300" aria-hidden="true" />
          <h1 className="text-2xl font-bold">{t('Farm Dashboard')}</h1>
        </div>
        <nav className="mt-8">
          <ul>
            {navItems.map((item) => (
              <li key={item.name}>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigate(item.name);
                    onCloseMobile(); // Close sidebar on mobile after navigation
                  }}
                  className={`flex items-center py-3 px-6 text-lg transition-colors duration-200
                    ${currentSection === item.name
                      ? 'bg-blue-600 bg-opacity-80 border-l-4 border-yellow-300'
                      : 'hover:bg-blue-600 hover:bg-opacity-50'
                    }`}
                  aria-current={currentSection === item.name ? 'page' : undefined}
                >
                  {item.icon}
                  {t(item.name as any)} {/* Translate NavSection name */}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="absolute bottom-0 w-full p-4">
          <div className="text-sm text-gray-300 mb-2">{t('Logged in as')}: <span className="font-semibold">{user?.username}</span></div>
          <button
            onClick={logout}
            className="flex items-center w-full py-3 px-6 text-lg text-left text-white bg-indigo-700 hover:bg-indigo-600 rounded-md transition-colors duration-200"
            aria-label={t('Logout')}
          >
            <FaSignOutAlt className="mr-3" aria-hidden="true" />
            {t('Logout')}
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
