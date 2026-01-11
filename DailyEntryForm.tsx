import React, { useState, useEffect } from 'react';
import Input from './Input';
import Button from './Button';
import { DailyRecord } from '../types';
import { apiService } from '../services/apiService';
import { useLanguage } from '../hooks/useLanguage'; // Import useLanguage hook
import { FaSpinner, FaBrain, FaExclamationCircle, FaChartLine } from 'react-icons/fa'; // Import AI-related icons
import { LanguageKey } from '../utils/translations'; // Import LanguageKey for explicit typing

// Assuming 30 eggs per crate for calculations
const EGGS_PER_CRATE = 30;
const ANOMALY_THRESHOLD_PERCENT = 20; // 20% deviation from 7-day average

interface DailyEntryFormProps {
  initialData?: DailyRecord | null;
  onSaveSuccess: () => void;
  onCancelEdit?: () => void;
  allDailyRecords: DailyRecord[]; // Added to provide data for anomaly detection
}

const DailyEntryForm: React.FC<DailyEntryFormProps> = ({ initialData, onSaveSuccess, onCancelEdit, allDailyRecords }) => {
  const { t, lang } = useLanguage(); // Use the translation hook and language code
  const [formData, setFormData] = useState<Omit<DailyRecord, 'id' | 'date'> & { date: string }>({
    date: new Date().toISOString().split('T')[0], // Auto-capture current date YYYY-MM-DD
    cratesProduced: 0,
    eggPricePerPiece: 0,
    feedBagsUsed: 0,
    feedTotalCost: 0,
    medicineName: '',
    medicineCost: 0,
    totalChickens: 0,
    layingChickens: 0,
    nonLayingChickens: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Anomaly Detection States
  const [anomalyAnalysis, setAnomalyAnalysis] = useState<string | null>(null);
  const [anomalyLoading, setAnomalyLoading] = useState(false);
  const [anomalyError, setAnomalyError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setFormData({
        date: initialData.date,
        cratesProduced: initialData.cratesProduced,
        eggPricePerPiece: initialData.eggPricePerPiece,
        feedBagsUsed: initialData.feedBagsUsed,
        feedTotalCost: initialData.feedTotalCost,
        medicineName: initialData.medicineName,
        medicineCost: initialData.medicineCost,
        totalChickens: initialData.totalChickens,
        layingChickens: initialData.layingChickens,
        nonLayingChickens: initialData.nonLayingChickens,
      });
    } else {
      // Reset form if initialData is removed (e.g., after successful edit or cancel)
      setFormData({
        date: new Date().toISOString().split('T')[0],
        cratesProduced: 0,
        eggPricePerPiece: 0,
        feedBagsUsed: 0,
        feedTotalCost: 0,
        medicineName: '',
        medicineCost: 0,
        totalChickens: 0,
        layingChickens: 0,
        nonLayingChickens: 0,
      });
    }
    setErrors({}); // Clear errors when initialData changes
    setMessage(null); // Clear messages when initialData changes
    setAiAnalysis(null); // Clear AI analysis
    setAiError(null); // Clear AI error
    setAnomalyAnalysis(null); // Clear anomaly analysis
    setAnomalyError(null); // Clear anomaly error
  }, [initialData]);

  // Calculate total eggs produced
  const totalEggsProduced = formData.cratesProduced * EGGS_PER_CRATE;

  useEffect(() => {
    // Clear message after a few seconds
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    let processedValue: string | number = value;

    // Convert to number for numeric fields
    if (['number', 'range'].includes(type) && value !== '') {
      processedValue = parseFloat(value);
      if (isNaN(processedValue)) {
        processedValue = 0; // Default to 0 if not a valid number
      }
    }

    setFormData((prev) => ({
      ...prev,
      [name]: processedValue,
    }));
    // Clear error for the field once user starts typing
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (formData.cratesProduced < 0) newErrors.cratesProduced = t('Cannot be negative.');
    if (formData.eggPricePerPiece < 0) newErrors.eggPricePerPiece = t('Cannot be negative.');
    if (formData.feedBagsUsed < 0) newErrors.feedBagsUsed = t('Cannot be negative.');
    if (formData.feedTotalCost < 0) newErrors.feedTotalCost = t('Cannot be negative.');
    if (formData.medicineCost < 0) newErrors.medicineCost = t('Cannot be negative.');
    if (formData.totalChickens < 0) newErrors.totalChickens = t('Cannot be negative.');
    if (formData.layingChickens < 0) newErrors.layingChickens = t('Cannot be negative.');
    if (formData.nonLayingChickens < 0) newErrors.nonLayingChickens = t('Cannot be negative.');
    if (formData.layingChickens + formData.nonLayingChickens > formData.totalChickens) {
      newErrors.layingChickens = t('Laying and non-laying chickens cannot exceed total chickens.');
      newErrors.nonLayingChickens = t('Laying and non-laying chickens cannot exceed total chickens.');
      newErrors.totalChickens = t('Laying and non-laying chickens cannot exceed total chickens.');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const triggerAnomalyDetection = async (currentRecord: DailyRecord) => {
    setAnomalyLoading(true);
    setAnomalyAnalysis(null);
    setAnomalyError(null);

    // Get last 7 days of records excluding the current one if it's an update
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentRecords = allDailyRecords.filter(
      (record) =>
        new Date(record.date) >= sevenDaysAgo &&
        record.id !== currentRecord.id // Exclude the current record if it's an update
    );

    if (recentRecords.length === 0) {
      setAnomalyAnalysis(t('No recent data for anomaly detection.'));
      setAnomalyLoading(false);
      return;
    }

    // Calculate averages for the last 7 days
    const avgCratesProduced = recentRecords.reduce((sum, r) => sum + r.cratesProduced, 0) / recentRecords.length;
    const avgFeedTotalCost = recentRecords.reduce((sum, r) => sum + r.feedTotalCost, 0) / recentRecords.length;
    const avgMedicineCost = recentRecords.reduce((sum, r) => sum + r.medicineCost, 0) / recentRecords.length;

    const anomalies: string[] = [];

    // Check for anomalies
    const checkAnomaly = (currentValue: number, averageValue: number, metricName: string, unit: string) => {
      if (averageValue === 0) return; // Avoid division by zero
      const deviation = ((currentValue - averageValue) / averageValue) * 100;
      if (Math.abs(deviation) >= ANOMALY_THRESHOLD_PERCENT) {
        anomalies.push(
          `${t(metricName as LanguageKey)}: ${currentValue.toFixed(2)} ${unit} (Avg: ${averageValue.toFixed(2)} ${unit}, Deviation: ${deviation.toFixed(2)}%)`
        );
      }
    };

    checkAnomaly(currentRecord.cratesProduced, avgCratesProduced, 'Egg production anomaly', 'crates');
    checkAnomaly(currentRecord.feedTotalCost, avgFeedTotalCost, 'Feed cost anomaly', 'USD');
    checkAnomaly(currentRecord.medicineCost, avgMedicineCost, 'Medicine cost anomaly', 'USD');

    if (anomalies.length > 0) {
      const anomalyDescription = `For ${currentRecord.date}: ${anomalies.join('; ')}`;
      try {
        const analysis = await apiService.analyzeAnomalyWithGemini(anomalyDescription, lang);
        setAnomalyAnalysis(analysis);
      } catch (err: any) {
        setAnomalyError(err.message || t('Failed to get anomaly analysis.'));
      }
    } else {
      setAnomalyAnalysis(t('No significant anomaly detected.'));
    }
    setAnomalyLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setAiAnalysis(null); // Clear previous AI analysis on new submission
    setAiError(null);
    setAnomalyAnalysis(null); // Clear previous anomaly analysis
    setAnomalyError(null);

    if (!validateForm()) {
      setMessage({ type: 'error', text: t('Please correct the errors in the form.') });
      return;
    }

    setIsLoading(true);
    try {
      let savedOrUpdatedRecord: DailyRecord;
      if (initialData) {
        // Update existing record
        const recordToUpdate: DailyRecord = { ...formData, id: initialData.id };
        savedOrUpdatedRecord = await apiService.updateDailyRecord(recordToUpdate);
        setMessage({ type: 'success', text: t('Daily record updated successfully!') });
      } else {
        // Save new record
        // Generate a unique ID for the record (e.g., timestamp-based)
        const recordWithId: DailyRecord = { ...formData, id: new Date().getTime().toString() };
        savedOrUpdatedRecord = await apiService.saveDailyRecord(recordWithId);
        setMessage({ type: 'success', text: t('Daily record saved successfully!') });
      }

      onSaveSuccess(); // Notify parent of success, which will re-fetch allDailyRecords

      // Trigger general AI analysis
      setAiLoading(true);
      try {
        const analysis = await apiService.analyzeDailyRecordWithGemini(savedOrUpdatedRecord, lang);
        setAiAnalysis(analysis);
      } catch (aiErr: any) {
        setAiError(aiErr.message || t('Failed to get AI analysis.'));
      } finally {
        setAiLoading(false);
      }

      // Trigger Anomaly Detection after AI analysis
      // Pass the saved/updated record to ensure analysis is on the most current data
      // and wait for allDailyRecords to be refreshed by onSaveSuccess
      setTimeout(() => triggerAnomalyDetection(savedOrUpdatedRecord), 100);


      // Reset form to initial state for new entry, or clear for editing after successful update
      if (!initialData) {
        setFormData({
          date: new Date().toISOString().split('T')[0],
          cratesProduced: 0,
          eggPricePerPiece: 0,
          feedBagsUsed: 0,
          feedTotalCost: 0,
          medicineName: '',
          medicineCost: 0,
          totalChickens: 0,
          layingChickens: 0,
          nonLayingChickens: 0,
        });
      }
    } catch (err: any) {
      // Use explicit LanguageKey for translation
      const errorKey: LanguageKey = initialData ? 'Failed to update record' : 'Failed to save record';
      setMessage({ type: 'error', text: t(errorKey) + ': ' + err.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-white rounded-lg shadow-md max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        {initialData ? t('Edit Daily Record') : t('Daily Farm Data Entry')}
      </h2>

      {message && (
        <div
          className={`p-3 mb-4 rounded-md text-sm ${
            message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}
          role="alert"
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
        {/* Date */}
        <div className="md:col-span-2">
          <Input
            id="date"
            label={t('Date')}
            type="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            required
            disabled={isLoading}
          />
        </div>

        {/* Egg Records */}
        <fieldset className="p-4 border border-gray-200 rounded-md md:col-span-1">
          <legend className="text-lg font-semibold text-gray-700 px-2">{t('Egg Records')}</legend>
          <Input
            id="cratesProduced"
            label={t('Crates Produced')}
            type="number"
            name="cratesProduced"
            value={formData.cratesProduced}
            onChange={handleChange}
            min="0"
            required
            error={errors.cratesProduced}
            disabled={isLoading}
          />
          {/* Display calculated total eggs */}
          <p className="text-sm text-gray-600 mb-4 pl-1" aria-live="polite">
            {t('Total Eggs')}: <span className="font-semibold">{totalEggsProduced.toLocaleString()}</span> {t('pieces')}
          </p>
          <Input
            id="eggPricePerPiece"
            label={t('Market Price per Egg (USD)')}
            type="number"
            name="eggPricePerPiece"
            value={formData.eggPricePerPiece}
            onChange={handleChange}
            step="0.01"
            min="0"
            required
            error={errors.eggPricePerPiece}
            disabled={isLoading}
          />
        </fieldset>

        {/* Feed Records */}
        <fieldset className="p-4 border border-gray-200 rounded-md md:col-span-1">
          <legend className="text-lg font-semibold text-gray-700 px-2">{t('Feed Records')}</legend>
          <Input
            id="feedBagsUsed"
            label={t('Feed Bags Used')}
            type="number"
            name="feedBagsUsed"
            value={formData.feedBagsUsed}
            onChange={handleChange}
            min="0"
            required
            error={errors.feedBagsUsed}
            disabled={isLoading}
          />
          <Input
            id="feedTotalCost"
            label={t('Total Cost of Feed Bags (USD)')}
            type="number"
            name="feedTotalCost"
            value={formData.feedTotalCost}
            onChange={handleChange}
            step="0.01"
            min="0"
            required
            error={errors.feedTotalCost}
            disabled={isLoading}
          />
        </fieldset>

        {/* Medicine Records */}
        <fieldset className="p-4 border border-gray-200 rounded-md md:col-span-1">
          <legend className="text-lg font-semibold text-gray-700 px-2">{t('Medicine Records')}</legend>
          <Input
            id="medicineName"
            label={t('Medicine Name')}
            type="text"
            name="medicineName"
            value={formData.medicineName}
            onChange={handleChange}
            disabled={isLoading}
          />
          <Input
            id="medicineCost"
            label={t('Medicine Cost (USD)')}
            type="number"
            name="medicineCost"
            value={formData.medicineCost}
            onChange={handleChange}
            step="0.01"
            min="0"
            required
            error={errors.medicineCost}
            disabled={isLoading}
          />
        </fieldset>

        {/* Flock Stats */}
        <fieldset className="p-4 border border-gray-200 rounded-md md:col-span-1">
          <legend className="text-lg font-semibold text-gray-700 px-2">{t('Flock Stats')}</legend>
          <Input
            id="totalChickens"
            label={t('Total Number of Chickens')}
            type="number"
            name="totalChickens"
            value={formData.totalChickens}
            onChange={handleChange}
            min="0"
            required
            error={errors.totalChickens}
            disabled={isLoading}
          />
          <Input
            id="layingChickens"
            label={t('Laying Chickens')}
            type="number"
            name="layingChickens"
            value={formData.layingChickens}
            onChange={handleChange}
            min="0"
            required
            error={errors.layingChickens}
            disabled={isLoading}
          />
          <Input
            id="nonLayingChickens"
            label={t('Non-laying Chickens')}
            type="number"
            name="nonLayingChickens"
            value={formData.nonLayingChickens}
            onChange={handleChange}
            min="0"
            required
            error={errors.nonLayingChickens}
            disabled={isLoading}
          />
        </fieldset>

        <div className="md:col-span-2 mt-6 flex justify-end gap-4">
          {initialData && onCancelEdit && (
            <Button
              type="button"
              variant="secondary"
              onClick={onCancelEdit}
              disabled={isLoading}
              aria-label={t('Cancel editing')}
            >
              {t('Cancel Edit')}
            </Button>
          )}
          <Button type="submit" className="w-full sm:w-auto" disabled={isLoading}>
            {isLoading ? (initialData ? t('Updating...') : t('Saving...')) : (initialData ? t('Update Record') : t('Save Daily Record'))}
          </Button>
        </div>
      </form>

      {/* AI Analysis Section */}
      {(aiLoading || aiAnalysis || aiError) && (
        <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-lg shadow-sm">
          <h3 className="text-xl font-bold text-blue-800 mb-4 flex items-center">
            <FaBrain className="mr-3 text-2xl" /> {t('AI Analysis')}
          </h3>
          {aiLoading && (
            <div className="flex items-center text-blue-600">
              <FaSpinner className="animate-spin mr-2" aria-hidden="true" />
              <p>{t('Analyzing data with AI...')}</p>
            </div>
          )}
          {aiError && !aiLoading && (
            <div className="flex items-center text-red-600">
              <FaExclamationCircle className="mr-2" aria-hidden="true" />
              <p>{t('Failed to get AI analysis.')} {aiError}</p>
            </div>
          )}
          {aiAnalysis && !aiLoading && (
            <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">{aiAnalysis}</p>
          )}
        </div>
      )}

      {/* Anomaly Detection Section */}
      {(anomalyLoading || anomalyAnalysis || anomalyError) && (
        <div className="mt-8 p-6 bg-orange-50 border border-orange-200 rounded-lg shadow-sm">
          <h3 className="text-xl font-bold text-orange-800 mb-4 flex items-center">
            <FaChartLine className="mr-3 text-2xl" /> {t('Anomaly Detection')}
          </h3>
          {anomalyLoading && (
            <div className="flex items-center text-orange-600">
              <FaSpinner className="animate-spin mr-2" aria-hidden="true" />
              <p>{t('Analyzing anomaly with AI...')}</p>
            </div>
          )}
          {anomalyError && !anomalyLoading && (
            <div className="flex items-center text-red-600">
              <FaExclamationCircle className="mr-2" aria-hidden="true" />
              <p>{t('Failed to get anomaly analysis.')} {anomalyError}</p>
            </div>
          )}
          {anomalyAnalysis && !anomalyLoading && (
            <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">{anomalyAnalysis}</p>
          )}
        </div>
      )}
    </div>
  );
};

export default DailyEntryForm;