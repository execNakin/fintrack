
import React, { useRef, useState } from 'react';
import { useData } from '../contexts/DataContext';
import { Upload, Download } from 'lucide-react';
import { useLocale } from '../contexts/LocaleContext';
import useLocalStorage from '../hooks/useLocalStorage';

const SettingsPage: React.FC = () => {
    const { transactions, investments, budgets, goals, setTransactions, setInvestments, setBudgets, setGoals } = useData();
    const { t, locale, setLocale } = useLocale();
    const importRef = useRef<HTMLInputElement>(null);
    
    const [budgetSettings, setBudgetSettings] = useLocalStorage('budgetSettings', {
      alertsEnabled: true,
      alertThreshold: 80,
      hardModeEnabled: false,
    });

    const handleBudgetSettingChange = (key: keyof typeof budgetSettings, value: any) => {
        setBudgetSettings(prev => ({...prev, [key]: value}));
    };

    const handleExport = () => {
        const data = {
            transactions,
            investments,
            budgets,
            goals
        };
        const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(data, null, 2))}`;
        const link = document.createElement("a");
        link.href = jsonString;
        link.download = `fintrack_backup_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
    };
    
    const handleImportClick = () => {
        importRef.current?.click();
    };

    const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target?.result;
                if (typeof text !== 'string') throw new Error("File is not readable");
                const data = JSON.parse(text);

                if (Array.isArray(data.transactions) && Array.isArray(data.investments) && Array.isArray(data.budgets) && Array.isArray(data.goals)) {
                    if (window.confirm(t('confirm_import_overwrite'))) {
                      setTransactions(data.transactions);
                      setInvestments(data.investments);
                      setBudgets(data.budgets);
                      setGoals(data.goals);
                      alert(t('import_success_alert'));
                    }
                } else {
                    throw new Error(t('error_invalid_backup_file'));
                }
            } catch (error) {
                console.error("Failed to import data:", error);
                alert(`${t('error_import_file')}: ${error instanceof Error ? error.message : "Unknown error"}`);
            }
        };
        reader.readAsText(file);
        
        event.target.value = '';
    };

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold text-white">{t('settings_title')}</h1>
            
            <div className="bg-brand-dark rounded-xl p-6">
                <h2 className="text-xl font-semibold text-white mb-2">{t('language_title')}</h2>
                <p className="text-gray-400 mb-6">{t('language_description')}</p>
                <div className="flex flex-col sm:flex-row gap-4">
                     <button
                        onClick={() => setLocale('th')}
                        className={`w-full sm:w-auto font-bold py-3 px-6 rounded-lg transition-colors duration-200 active:scale-95 ${locale === 'th' ? 'bg-brand-yellow text-brand-dark' : 'bg-gray-600 text-white hover:bg-gray-500'}`}
                    >
                        ไทย
                    </button>
                    <button
                        onClick={() => setLocale('en')}
                        className={`w-full sm:w-auto font-bold py-3 px-6 rounded-lg transition-colors duration-200 active:scale-95 ${locale === 'en' ? 'bg-brand-yellow text-brand-dark' : 'bg-gray-600 text-white hover:bg-gray-500'}`}
                    >
                        English
                    </button>
                </div>
            </div>

            <div className="bg-brand-dark rounded-xl p-6">
                <h2 className="text-xl font-semibold text-white mb-2">{t('budget_alerts_title')}</h2>
                <p className="text-gray-400 mb-6">{t('budget_alerts_description')}</p>
                <div className="space-y-5">
                    <div className="flex items-center justify-between">
                        <label htmlFor="enable-alerts" className="text-gray-200">{t('enable_alerts_label')}</label>
                        <button onClick={() => handleBudgetSettingChange('alertsEnabled', !budgetSettings.alertsEnabled)} className={`${budgetSettings.alertsEnabled ? 'bg-brand-yellow' : 'bg-gray-600'} relative inline-flex h-6 w-11 items-center rounded-full transition-colors`}>
                            <span className={`${budgetSettings.alertsEnabled ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}/>
                        </button>
                    </div>
                     <div className="flex items-center justify-between">
                        <label htmlFor="alert-threshold" className="text-gray-200">{t('alert_threshold_label', { value: budgetSettings.alertThreshold })}</label>
                        <input
                            id="alert-threshold"
                            type="range"
                            min="50"
                            max="100"
                            step="5"
                            value={budgetSettings.alertThreshold}
                            onChange={(e) => handleBudgetSettingChange('alertThreshold', parseInt(e.target.value, 10))}
                            className="w-1/2 accent-brand-yellow"
                            disabled={!budgetSettings.alertsEnabled}
                        />
                    </div>
                     <div className="flex items-center justify-between">
                        <label htmlFor="hard-mode" className="text-gray-200">{t('hard_mode_label')}</label>
                        <button onClick={() => handleBudgetSettingChange('hardModeEnabled', !budgetSettings.hardModeEnabled)} className={`${budgetSettings.hardModeEnabled ? 'bg-red-500' : 'bg-gray-600'} relative inline-flex h-6 w-11 items-center rounded-full transition-colors`}>
                             <span className={`${budgetSettings.hardModeEnabled ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}/>
                        </button>
                    </div>
                    <p className="text-sm text-gray-500">{t('hard_mode_description')}</p>
                </div>
            </div>

            <div className="bg-brand-dark rounded-xl p-6">
                <h2 className="text-xl font-semibold text-white mb-2">{t('data_management_title')}</h2>
                <p className="text-gray-400 mb-6">{t('data_management_description')}</p>
                <div className="flex flex-col sm:flex-row gap-4">
                    <button
                        onClick={handleExport}
                        className="flex items-center justify-center w-full sm:w-auto bg-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-500 transition-colors duration-200 active:scale-95"
                    >
                        <Download className="w-5 h-5 mr-2" />
                        {t('export_data_button')}
                    </button>
                    <button
                        onClick={handleImportClick}
                        className="flex items-center justify-center w-full sm:w-auto bg-green-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-green-500 transition-colors duration-200 active:scale-95"
                    >
                        <Upload className="w-5 h-5 mr-2" />
                        {t('import_data_button')}
                    </button>
                    <input
                        type="file"
                        ref={importRef}
                        className="hidden"
                        accept=".json"
                        onChange={handleFileImport}
                    />
                </div>
            </div>
            
            <div className="bg-brand-dark rounded-xl p-6">
                <h2 className="text-xl font-semibold text-white mb-2">{t('security_title')}</h2>
                <p className="text-gray-400">{t('security_description')}</p>
            </div>
        </div>
    );
};

export default SettingsPage;
