

import React, { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './hooks/useAuth';
import AuthPage from './components/AuthPage';
import DashboardLayout from './components/DashboardLayout';
import DailyEntryForm from './components/DailyEntryForm';
import MonthlyAnalytics from './components/MonthlyAnalytics';
import DailyRecordsTable from './components/DailyRecordsTable'; // New import
import { NavSection, DailyRecord } from './types';
import { apiService } from './services/apiService'; // New import
import { FaSpinner, FaRedo } from 'react-icons/fa'; // FaRedo for retry, FaSpinner for loading
import Button from './components/Button';
import { useLanguage } from './hooks/useLanguage'; // Import useLanguage hook

// Main App component
const AppContent: React.FC = () => {
  const { user, isLoading: authLoading } = useAuth();
  const { t } = useLanguage(); // Use the translation hook
  const [currentSection, setCurrentSection] = useState<NavSection>(NavSection.DAILY_ENTRY);
  const [editingRecord, setEditingRecord] = useState<DailyRecord | null>(null);
  const [allDailyRecords, setAllDailyRecords] = useState<DailyRecord[]>([]);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [recordsError, setRecordsError] = useState<string | null>(null);

  const fetchAllDailyRecords = useCallback(async () => {
    setRecordsLoading(true);
    setRecordsError(null);
    try {
      const records = await apiService.fetchDailyRecords();
      setAllDailyRecords(records);
    } catch (err: any) {
      setRecordsError(err.message || t('Could not load daily records. Please check your connection or try again.'));
    } finally {
      setRecordsLoading(false);
    }
  }, [t]); // Add t to dependency array

  useEffect(() => {
    if (user) {
      fetchAllDailyRecords(); // Fetch records when user logs in
    }
  }, [user, fetchAllDailyRecords]);

  const handleEditRecord = (record: DailyRecord) => {
    setEditingRecord(record);
    setCurrentSection(NavSection.DAILY_ENTRY); // Navigate to daily entry form for editing
  };

  const handleDeleteRecord = async (id: string) => {
    if (window.confirm(t('confirm_delete_record'))) {
      setRecordsLoading(true);
      setRecordsError(null);
      try {
        await apiService.deleteDailyRecord(id);
        await fetchAllDailyRecords(); // Refresh the list
      } catch (err: any) {
        setRecordsError(err.message || t('Failed to delete record.'));
      } finally {
        setRecordsLoading(false);
      }
    }
  };

  const handleDailyEntrySaveSuccess = () => {
    setEditingRecord(null); // Clear editing state
    fetchAllDailyRecords(); // Refresh records list
    setCurrentSection(NavSection.VIEW_RECORDS); // Optionally navigate to view records after save/update
  };

  const handleCancelEdit = () => {
    setEditingRecord(null);
    setCurrentSection(NavSection.VIEW_RECORDS); // Go back to viewing records
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-400 to-blue-500">
        <FaSpinner className="animate-spin text-4xl text-white mr-3" aria-label={t('Loading application...')} />
        <p className="text-white text-xl">{t('Loading application...')}</p>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  return (
    <DashboardLayout currentSection={currentSection} onNavigate={setCurrentSection}>
      {currentSection === NavSection.DAILY_ENTRY && (
        <DailyEntryForm
          initialData={editingRecord}
          onSaveSuccess={handleDailyEntrySaveSuccess}
          onCancelEdit={handleCancelEdit}
          allDailyRecords={allDailyRecords} // Pass allDailyRecords to DailyEntryForm
        />
      )}
      {currentSection === NavSection.MONTHLY_ANALYTICS && <MonthlyAnalytics />}
      {currentSection === NavSection.VIEW_RECORDS && (
        <div className="max-w-7xl mx-auto"> {/* Added wrapper for table content */}
          {recordsError && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6" role="alert">
              <div className="flex items-center">
                <FaRedo className="text-xl mr-3" aria-hidden="true" />
                <span className="block sm:inline font-medium">{t('Error')}: {recordsError}</span>
                <Button
                  onClick={fetchAllDailyRecords}
                  variant="secondary"
                  size="sm"
                  className="ml-auto flex items-center bg-red-200 hover:bg-red-300 text-red-800"
                  aria-label={t('Retry loading records')}
                >
                  <FaRedo className="mr-1" aria-hidden="true" /> {t('Retry')}
                </Button>
              </div>
              <p className="text-sm mt-2">{t('Could not load daily records. Please check your connection or try again.')}</p>
            </div>
          )}
          <DailyRecordsTable
            records={allDailyRecords}
            onEdit={handleEditRecord}
            onDelete={handleDeleteRecord}
            isLoading={recordsLoading}
          />
        </div>
      )}
    </DashboardLayout>
  );
};

// The App component now only wraps with AuthProvider; LanguageProvider is in index.tsx
const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;