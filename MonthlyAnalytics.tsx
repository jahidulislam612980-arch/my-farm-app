
import React, { useState, useEffect, useCallback } from 'react';
import { DailyRecord, MonthlySummary } from '../types';
import { apiService } from '../services/apiService';
import Button from './Button';
import { exportToCsv } from '../utils/csvExport';
import {
  FaDownload,
  FaSpinner,
  FaChartPie,
  FaMoneyBillWave,
  FaEgg,
  FaExclamationTriangle,
  FaRedo,
  FaSearch,
  FaLightbulb,
} from 'react-icons/fa';
import { useLanguage } from '../hooks/useLanguage';
import { LanguageKey } from '../utils/translations'; // Import LanguageKey for explicit typing

// Import Chart.js components
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ChartData } from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

// Assuming 30 eggs per crate for calculations
const EGGS_PER_CRATE = 30;

const MonthlyAnalytics: React.FC = () => {
  const { t, lang } = useLanguage();
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState<string>(
    `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}`
  );
  const [monthlySummary, setMonthlySummary] = useState<MonthlySummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [allRecords, setAllRecords] = useState<DailyRecord[]>([]); // Initialize allRecords here
  const [marketInsights, setMarketInsights] = useState<string | null>(null);
  const [marketInsightsSources, setMarketInsightsSources] = useState<string[]>([]);
  const [marketInsightsLoading, setMarketInsightsLoading] = useState(false);
  const [marketInsightsError, setMarketInsightsError] = useState<string | null>(null);

  // States for charts
  const [profitLossChartData, setProfitLossChartData] = useState<ChartData<'line'> | null>(null);
  const [eggProductionChartData, setEggProductionChartData] = useState<ChartData<'bar'> | null>(null);
  const [expensesChartData, setExpensesChartData] = useState<ChartData<'bar'> | null>(null);
  const [chartsLoading, setChartsLoading] = useState(false);
  const [chartsError, setChartsError] = useState<string | null>(null);


  const fetchRecordsAndGenerateSummary = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setMonthlySummary(null);
    setMarketInsights(null); // Clear previous insights
    setMarketInsightsSources([]);
    setMarketInsightsError(null);
    setProfitLossChartData(null);
    setEggProductionChartData(null);
    setExpensesChartData(null);

    try {
      const fetchedRecords = await apiService.fetchDailyRecords();
      setAllRecords(fetchedRecords); // Update allRecords state

      const filteredRecords = fetchedRecords.filter(record => {
        const recordMonth = record.date.substring(0, 7); // YYYY-MM format
        return recordMonth === selectedMonth;
      });

      if (filteredRecords.length === 0) {
        setMonthlySummary(null);
        setIsLoading(false);
        return;
      }

      // Calculate monthly summary
      let totalEggProduction = 0; // in pieces
      let totalEggRevenue = 0;
      let totalFeedExpenses = 0;
      let totalMedicineExpenses = 0;

      filteredRecords.forEach(record => {
        totalEggProduction += record.cratesProduced * EGGS_PER_CRATE;
        totalEggRevenue += (record.cratesProduced * EGGS_PER_CRATE) * record.eggPricePerPiece;
        totalFeedExpenses += record.feedTotalCost;
        totalMedicineExpenses += record.medicineCost;
      });

      const totalExpenses = totalFeedExpenses + totalMedicineExpenses;
      const profitOrLoss = totalEggRevenue - totalExpenses;

      const summary: MonthlySummary = {
        month: new Date(selectedMonth + '-01').toLocaleString(lang === 'bn' ? 'bn-BD' : 'en-US', { month: 'long', year: 'numeric' }),
        totalEggProduction,
        totalEggRevenue,
        totalFeedExpenses,
        totalMedicineExpenses,
        totalExpenses,
        profitOrLoss,
      };

      setMonthlySummary(summary);
    } catch (err: any) {
      setError(err.message || t('Failed to fetch daily records.'));
    } finally {
      setIsLoading(false);
    }
  }, [selectedMonth, t, lang]);

  const generateHistoricalCharts = useCallback(async () => {
    setChartsLoading(true);
    setChartsError(null);
    setProfitLossChartData(null);
    setEggProductionChartData(null);
    setExpensesChartData(null);

    if (allRecords.length === 0) {
      setChartsLoading(false);
      return;
    }

    try {
      const monthlyDataMap: { [key: string]: MonthlySummary } = {};
      const today = new Date();

      for (let i = 11; i >= 0; i--) { // Last 12 months
        const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
        const monthName = date.toLocaleString(lang === 'bn' ? 'bn-BD' : 'en-US', { month: 'short', year: '2-digit' });

        const recordsForMonth = allRecords.filter(record => record.date.substring(0, 7) === monthKey);

        let totalEggProduction = 0;
        let totalEggRevenue = 0;
        let totalFeedExpenses = 0;
        let totalMedicineExpenses = 0;

        recordsForMonth.forEach(record => {
          totalEggProduction += record.cratesProduced * EGGS_PER_CRATE;
          totalEggRevenue += (record.cratesProduced * EGGS_PER_CRATE) * record.eggPricePerPiece;
          totalFeedExpenses += record.feedTotalCost;
          totalMedicineExpenses += record.medicineCost;
        });

        const totalExpenses = totalFeedExpenses + totalMedicineExpenses;
        const profitOrLoss = totalEggRevenue - totalExpenses;

        monthlyDataMap[monthKey] = {
          month: monthName,
          totalEggProduction,
          totalEggRevenue,
          totalFeedExpenses,
          totalMedicineExpenses,
          totalExpenses,
          profitOrLoss,
        };
      }

      const sortedMonths = Object.keys(monthlyDataMap).sort();
      const labels = sortedMonths.map(monthKey => monthlyDataMap[monthKey].month);
      const profits = sortedMonths.map(monthKey => monthlyDataMap[monthKey].profitOrLoss);
      const eggProductions = sortedMonths.map(monthKey => monthlyDataMap[monthKey].totalEggProduction);
      const feedCosts = sortedMonths.map(monthKey => monthlyDataMap[monthKey].totalFeedExpenses);
      const medicineCosts = sortedMonths.map(monthKey => monthlyDataMap[monthKey].totalMedicineExpenses);

      // Profit/Loss Chart
      setProfitLossChartData({
        labels,
        datasets: [
          {
            type: 'line', // Explicitly set type
            label: t('Profit/Loss') + ' (' + t('USD') + ')',
            data: profits,
            borderColor: 'rgb(75, 192, 192)',
            backgroundColor: 'rgba(75, 192, 192, 0.5)',
            tension: 0.1,
          },
        ],
      });

      // Egg Production Chart
      setEggProductionChartData({
        labels,
        datasets: [
          {
            type: 'bar', // Explicitly set type
            label: t('Total Egg Production') + ' (' + t('pcs') + ')',
            data: eggProductions,
            backgroundColor: 'rgba(255, 159, 64, 0.8)',
          },
        ],
      });

      // Expenses Chart
      setExpensesChartData({
        labels,
        datasets: [
          {
            type: 'bar', // Explicitly set type
            label: t('Feed Cost (USD)'),
            data: feedCosts,
            backgroundColor: 'rgba(255, 99, 132, 0.8)',
          },
          {
            type: 'bar', // Explicitly set type
            label: t('Medicine Cost (USD)'),
            data: medicineCosts,
            backgroundColor: 'rgba(54, 162, 235, 0.8)',
          },
        ],
      });

    } catch (err: any) {
      setChartsError(err.message || t('Failed to generate charts.')); // Changed to use LanguageKey
    } finally {
      setChartsLoading(false);
    }
  }, [allRecords, lang, t]);

  useEffect(() => {
    fetchRecordsAndGenerateSummary();
  }, [fetchRecordsAndGenerateSummary]);

  // Regenerate charts when allRecords or language changes
  useEffect(() => {
    if (allRecords.length > 0) {
      generateHistoricalCharts();
    } else {
      setProfitLossChartData(null);
      setEggProductionChartData(null);
      setExpensesChartData(null);
      setChartsLoading(false);
    }
  }, [allRecords, lang, generateHistoricalCharts]); // Depend on allRecords and lang

  const handleMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedMonth(e.target.value);
  };

  const handleExport = () => {
    if (monthlySummary) {
      const dataToExport = [
        {
          Month: monthlySummary.month,
          'Total Egg Production (pcs)': monthlySummary.totalEggProduction,
          'Total Egg Revenue (USD)': monthlySummary.totalEggRevenue.toFixed(2),
          'Total Feed Expenses (USD)': monthlySummary.totalFeedExpenses.toFixed(2),
          'Total Medicine Expenses (USD)': monthlySummary.totalMedicineExpenses.toFixed(2),
          'Total Expenses (USD)': monthlySummary.totalExpenses.toFixed(2),
          'Profit/Loss (USD)': monthlySummary.profitOrLoss.toFixed(2),
        },
      ];
      exportToCsv(`Poultry_Farm_Summary_${selectedMonth}.csv`, dataToExport);
    } else {
      alert(t('alert_no_data_export'));
    }
  };

  const getMarketInsights = async () => {
    setMarketInsightsLoading(true);
    setMarketInsights(null);
    setMarketInsightsSources([]);
    setMarketInsightsError(null);
    try {
      const insights = await apiService.getMarketInsightsWithGemini(selectedMonth, lang);
      setMarketInsights(insights.text);
      setMarketInsightsSources(insights.sources);
    } catch (err: any) {
      // Corrected translation key: removed trailing colon
      setMarketInsightsError(err.message || t('Failed to get market insights'));
    } finally {
      setMarketInsightsLoading(false);
    }
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: '', // Set dynamically
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(context.parsed.y);
            }
            return label;
          }
        }
      }
    },
    scales: {
      x: {
        title: {
          display: true,
          text: t('Month'),
        },
      },
      y: {
        title: {
          display: true,
          text: t('Amount (USD)'),
        },
      },
    },
  };

  const eggChartOptions = {
    ...chartOptions,
    plugins: {
      ...chartOptions.plugins,
      tooltip: {
        callbacks: {
          label: function(context: any) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += new Intl.NumberFormat('en-US').format(context.parsed.y) + ' ' + t('pcs');
            }
            return label;
          }
        }
      }
    },
    scales: {
      ...chartOptions.scales,
      y: {
        title: {
          display: true,
          text: t('Eggs (pcs)'),
        },
      },
    },
  };


  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-white rounded-lg shadow-md max-w-7xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">{t('Monthly Analytics')}</h2>

      <div className="mb-6 flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4">
        <label htmlFor="select-month" className="block text-lg font-medium text-gray-700 sr-only">
          {t('Select Month')}
        </label>
        <input
          id="select-month"
          type="month"
          value={selectedMonth}
          onChange={handleMonthChange}
          className="p-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-base"
          aria-label={t('Select Month')}
          disabled={isLoading}
        />
        <Button onClick={fetchRecordsAndGenerateSummary} disabled={isLoading} aria-label={t('Reload analytics for selected month')}>
          {isLoading ? <FaSpinner className="animate-spin mr-2" /> : <FaRedo className="mr-2" />}
          {t('Reload')}
        </Button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6" role="alert">
          <FaExclamationTriangle className="inline mr-2" aria-hidden="true" />
          <span className="block sm:inline">{t('Error')}: {error}</span>
          <p className="text-sm mt-2">{t('Could not load daily records. Please check your connection or try again.')}</p>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-10 text-blue-600" role="status">
          <FaSpinner className="animate-spin text-4xl mr-3" aria-hidden="true" />
          <p className="text-xl">{t('Loading records...')}</p>
        </div>
      ) : monthlySummary ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <div className="bg-blue-50 p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold text-blue-800 flex items-center mb-2">
                  <FaChartPie className="mr-2" aria-hidden="true" /> {t('Detailed Summary for')} {monthlySummary.month}
                </h3>
                <p className="text-gray-700 text-sm"><strong>{t('Total Egg Production')}:</strong> {monthlySummary.totalEggProduction.toLocaleString()} {t('pcs')}</p>
                {/* Fix: Move colon outside t() call */}
                <p className="text-gray-700 text-sm"><strong>{t('Total Egg Revenue')}:</strong> ${monthlySummary.totalEggRevenue.toFixed(2)}</p>
                {/* Fix: Move colon outside t() call */}
                <p className="text-gray-700 text-sm"><strong>{t('Total Feed Expenses')}:</strong> ${monthlySummary.totalFeedExpenses.toFixed(2)}</p>
                {/* Fix: Move colon outside t() call */}
                <p className="text-gray-700 text-sm"><strong>{t('Total Medicine Expenses')}:</strong> ${monthlySummary.totalMedicineExpenses.toFixed(2)}</p>
                <p className="text-gray-700 text-sm mt-2 font-bold"><strong>{t('Total Expenses')}:</strong> ${monthlySummary.totalExpenses.toFixed(2)}</p>
                <p className={`text-lg font-bold mt-3 ${monthlySummary.profitOrLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {/* Fix: Move colon outside t() call */}
                  {t('Overall Profit/Loss')}: ${monthlySummary.profitOrLoss.toFixed(2)}
                </p>
              </div>

              <div className="flex flex-col space-y-4 lg:col-span-2">
                <Button
                  onClick={handleExport}
                  className="w-full justify-center"
                  variant="secondary"
                  aria-label={t('Export Summary to CSV')}
                >
                  <FaDownload className="mr-2" aria-hidden="true" /> {t('Export Summary to CSV')}
                </Button>
                <Button
                  onClick={getMarketInsights}
                  className="w-full justify-center"
                  variant="primary"
                  disabled={marketInsightsLoading}
                  aria-label={t('Get Market Insights (AI + Search)')}
                >
                  {marketInsightsLoading ? <FaSpinner className="animate-spin mr-2" aria-hidden="true" /> : <FaSearch className="mr-2" aria-hidden="true" />}
                  {t('Get Market Insights (AI + Search)')}
                </Button>
              </div>
            </div>

            {/* AI Market Insights Section */}
            {(marketInsightsLoading || marketInsights || marketInsightsError) && (
              <div className="mt-8 p-6 bg-purple-50 border border-purple-200 rounded-lg shadow-sm">
                <h3 className="text-xl font-bold text-purple-800 mb-4 flex items-center">
                  <FaLightbulb className="mr-3 text-2xl" aria-hidden="true" /> {t('AI Market Insights')}
                </h3>
                {marketInsightsLoading && (
                  <div className="flex items-center text-purple-600">
                    <FaSpinner className="animate-spin mr-2" aria-hidden="true" />
                    <p>{t('Getting market insights with AI and Google Search...')}</p>
                  </div>
                )}
                {marketInsightsError && !marketInsightsLoading && (
                  <div className="flex items-center text-red-600">
                    <FaExclamationTriangle className="mr-2" aria-hidden="true" />
                    <p>{t('Failed to get market insights')}: {marketInsightsError}</p>
                  </div>
                )}
                {marketInsights && !marketInsightsLoading && (
                  <>
                    <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">{marketInsights}</p>
                    {marketInsightsSources.length > 0 && (
                      <div className="mt-4">
                        <p className="font-semibold text-gray-700">{t('Sources:')}</p>
                        <ul className="list-disc list-inside text-sm text-blue-700">
                          {marketInsightsSources.map((source, index) => (
                            <li key={index}>
                              <a href={source} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                {source}
                              </a>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Historical Data Charts */}
            {chartsLoading && (
              <div className="flex items-center justify-center py-10 text-blue-600">
                <FaSpinner className="animate-spin text-4xl mr-3" aria-hidden="true" />
                <p className="text-xl">{t('Loading charts...')}</p>
              </div>
            )}
            {!chartsLoading && allRecords.length > 0 && (
              <div className="mt-10 grid grid-cols-1 gap-8">
                <div className="bg-white p-6 rounded-lg shadow-md h-80 md:h-96">
                  <h3 className="text-xl font-bold text-gray-800 mb-4">{t('Profit/Loss Trend (Last 12 Months)')}</h3>
                  {profitLossChartData ? (
                    <Line data={profitLossChartData} options={{ ...chartOptions, plugins: { ...chartOptions.plugins, title: { ...chartOptions.plugins.title, text: t('Profit/Loss Trend (Last 12 Months)') } } }} />
                  ) : (
                    <div className="text-center text-gray-500 py-10">{t('No data for chart.')}</div>
                  )}
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md h-80 md:h-96">
                  <h3 className="text-xl font-bold text-gray-800 mb-4">{t('Monthly Egg Production (Last 12 Months)')}</h3>
                  {eggProductionChartData ? (
                    <Bar data={eggProductionChartData} options={{ ...eggChartOptions, plugins: { ...eggChartOptions.plugins, title: { ...eggChartOptions.plugins.title, text: t('Monthly Egg Production (Last 12 Months)') } } }} />
                  ) : (
                    <div className="text-center text-gray-500 py-10">{t('No data for chart.')}</div>
                  )}
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md h-80 md:h-96">
                  <h3 className="text-xl font-bold text-gray-800 mb-4">{t('Monthly Expenses (Feed vs. Medicine)')}</h3>
                  {expensesChartData ? (
                    <Bar data={expensesChartData} options={{ ...chartOptions, scales: { ...chartOptions.scales, y: { ...chartOptions.scales.y, stacked: true }, x: { ...chartOptions.scales.x, stacked: true } }, plugins: { ...chartOptions.plugins, title: { ...chartOptions.plugins.title, text: t('Monthly Expenses (Feed vs. Medicine)') } } }} />
                  ) : (
                    <div className="text-center text-gray-500 py-10">{t('No data for chart.')}</div>
                  )}
                </div>
              </div>
            )}
          </>
        ) : (!isLoading && !error && !monthlySummary) && (
          <div className="text-center text-gray-600 py-10">
            <p className="text-xl font-medium mb-2">{t('No data available for')} {new Date(selectedMonth).toLocaleString(lang === 'bn' ? 'bn-BD' : 'en-US', { month: 'long', year: 'numeric' })}.</p>
            <p className="text-md">{t('Please enter daily records for this month to see analytics.')}</p>
          </div>
        )}
      </div>
    );
  };

  export default MonthlyAnalytics;