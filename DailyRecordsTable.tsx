
import React from 'react';
import { DailyRecord } from '../types';
import Button from './Button';
import { FaEdit, FaTrashAlt, FaSpinner } from 'react-icons/fa';
import { useLanguage } from '../hooks/useLanguage'; // Import useLanguage hook

interface DailyRecordsTableProps {
  records: DailyRecord[];
  onEdit: (record: DailyRecord) => void;
  onDelete: (id: string) => void;
  isLoading?: boolean;
}

const DailyRecordsTable: React.FC<DailyRecordsTableProps> = ({ records, onEdit, onDelete, isLoading }) => {
  const { t } = useLanguage(); // Use the translation hook

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10 text-blue-600" role="status">
        <FaSpinner className="animate-spin text-4xl mr-3" aria-hidden="true" />
        <p className="text-xl">{t('Loading records...')}</p>
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="text-center text-gray-600 py-10">
        <p className="text-xl font-medium mb-2">{t('No daily records found.')}</p>
        <p className="text-md">{t('Start by adding a new entry in the \"Daily Entry\" section.')}</p>
      </div>
    );
  }

  // Sort records by date in descending order (most recent first)
  const sortedRecords = [...records].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-white rounded-lg shadow-md max-w-full overflow-x-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">{t('All Daily Records')}</h2>
      <table className="min-w-full divide-y divide-gray-200" aria-label={t('All Daily Records')}>
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('Date (Table)')}</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('Eggs (Crates)')}</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('Egg Price (per piece)')}</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('Feed Used (Bags)')}</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('Feed Cost')}</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('Medicine Name (Table)')}</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('Medicine Cost (Table)')}</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('Total Chickens (Table)')}</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('Laying')}</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('Non-Laying')}</th>
            <th scope="col" className="relative px-6 py-3"><span className="sr-only">{t('Actions')}</span></th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {sortedRecords.map((record) => (
            <tr key={record.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{record.date}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{record.cratesProduced}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${record.eggPricePerPiece.toFixed(2)}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{record.feedBagsUsed}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${record.feedTotalCost.toFixed(2)}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{record.medicineName || t('N/A')}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${record.medicineCost.toFixed(2)}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{record.totalChickens}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{record.layingChickens}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{record.nonLayingChickens}</td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <Button
                  onClick={() => onEdit(record)}
                  variant="secondary"
                  size="sm"
                  aria-label={`${t('Edit record for')} ${record.date}`}
                  className="mr-2 inline-flex items-center"
                >
                  <FaEdit aria-hidden="true" />
                </Button>
                <Button
                  onClick={() => onDelete(record.id)}
                  variant="danger"
                  size="sm"
                  aria-label={`${t('Delete record for')} ${record.date}`}
                  className="inline-flex items-center"
                >
                  <FaTrashAlt aria-hidden="true" />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DailyRecordsTable;
