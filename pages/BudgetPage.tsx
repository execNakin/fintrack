
import React, { useMemo, useState, useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import { Budget, TransactionType } from '../types';
import { useLocale } from '../contexts/LocaleContext';

const BudgetPage: React.FC = () => {
  const { budgets, setBudgets, transactions } = useData();
  const { t, locale } = useLocale();

  const defaultCategories = useMemo(() => [
    t('category_food'), t('category_travel'), t('category_shopping'), t('category_utilities'),
    t('category_entertainment'), t('category_health'), t('category_education'),
    t('category_personal'), t('category_other')
  ], [t]);

  const [localBudgets, setLocalBudgets] = useState<Budget[]>([]);

  useEffect(() => {
    const existingCategories = new Set(budgets.map(b => t(`category_${b.category.toLowerCase().replace(/ /g, '_')}`, b.category)));
    const newBudgets = defaultCategories
      .filter(cat => !existingCategories.has(cat))
      .map(category => ({
        id: crypto.randomUUID(),
        category: Object.keys(t('categories_map', {})).find(key => t('categories_map', {})[key] === category) || category,
        amount: 0,
        period: 'monthly' as const
      }));
    
    const mergedBudgets = [...budgets, ...newBudgets].sort((a, b) => {
        const catA = t(`category_${a.category.toLowerCase().replace(/ /g, '_')}`, a.category);
        const catB = t(`category_${b.category.toLowerCase().replace(/ /g, '_')}`, b.category);
        return catA.localeCompare(catB, locale);
    });

    setLocalBudgets(mergedBudgets);
  }, [budgets, defaultCategories, t, locale]);


  const monthlyExpenses = useMemo(() => {
    const now = new Date();
    return transactions
      .filter(tx => tx.type === TransactionType.Expense && new Date(tx.date).getMonth() === now.getMonth() && new Date(tx.date).getFullYear() === now.getFullYear())
      .reduce((acc, tx) => {
        acc[tx.category] = (acc[tx.category] || 0) + tx.amount;
        return acc;
      }, {} as Record<string, number>);
  }, [transactions]);
  
  const handleBudgetChange = (categoryKey: string, amount: string) => {
    const newAmount = parseFloat(amount) || 0;
    setLocalBudgets(prev => 
      prev.map(b => b.category === categoryKey ? { ...b, amount: newAmount } : b)
    );
  };
  
  const saveBudgets = () => {
    setBudgets(localBudgets.filter(b => b.amount > 0));
    alert(t('budgets_saved_alert'));
  };

  const currencySymbol = useMemo(() => {
      return (0).toLocaleString(locale, { style: 'currency', currency: 'THB', minimumFractionDigits: 0 }).replace(/[0-9\s,.]/g, '');
  }, [locale]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">{t('budgets_title')}</h1>
        <button
          onClick={saveBudgets}
          className="bg-brand-yellow text-brand-dark font-bold py-2 px-4 rounded-lg hover:bg-yellow-300 transition-colors duration-200 active:scale-95"
        >
          {t('save_budgets_button')}
        </button>
      </div>
      
      <div className="bg-brand-dark rounded-xl p-6">
        <p className="text-gray-400 mb-6">{t('budgets_description')}</p>
        <div className="space-y-6">
          {localBudgets.map(budget => {
            const spent = monthlyExpenses[budget.category] || 0;
            const remaining = budget.amount - spent;
            const percentage = budget.amount > 0 ? Math.min((spent / budget.amount) * 100, 100) : 0;
            const isOverBudget = remaining < 0;
            const categoryDisplay = t(`category_${budget.category.toLowerCase().replace(/ /g, '_')}`, budget.category);

            return (
              <div key={budget.id}>
                <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-2">
                    <label className="text-lg font-semibold text-white mb-2 sm:mb-0">{categoryDisplay}</label>
                    <div className="flex items-center gap-2">
                        <span className="text-white">{currencySymbol}</span>
                        <input
                            type="number"
                            value={budget.amount === 0 ? '' : budget.amount}
                            onChange={(e) => handleBudgetChange(budget.category, e.target.value)}
                            placeholder="0.00"
                            className="w-32 bg-gray-700 text-white rounded-md p-1.5 text-right font-mono focus:ring-brand-yellow focus:border-brand-yellow"
                        />
                    </div>
                </div>
                {budget.amount > 0 && (
                    <>
                        <div className="w-full bg-gray-700 rounded-full h-3">
                          <div
                            className={`h-3 rounded-full ${isOverBudget ? 'bg-red-500' : 'bg-brand-yellow'}`}
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                        <div className="flex justify-between text-sm mt-1">
                          <span className="text-gray-400">{t('spent_label')}: {spent.toLocaleString(locale, { currency: 'THB', style: 'currency' })}</span>
                          <span className={`font-medium ${isOverBudget ? 'text-red-400' : 'text-gray-400'}`}>
                            {isOverBudget 
                              ? `${t('over_budget_label')} ${Math.abs(remaining).toLocaleString(locale, { currency: 'THB', style: 'currency' })}` 
                              : `${t('remaining_label')}: ${remaining.toLocaleString(locale, { currency: 'THB', style: 'currency' })}`}
                          </span>
                        </div>
                    </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default BudgetPage;