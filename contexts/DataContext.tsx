
import React, { createContext, useContext, useMemo, useEffect } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import { Transaction, Investment, Budget, Goal, TransactionType, RecurringTransaction, Frequency } from '../types';
import { useLocale } from './LocaleContext';
import { add, format } from 'date-fns';

interface DataContextType {
  transactions: Transaction[];
  setTransactions: (transactions: Transaction[]) => void;
  addTransaction: (tx: Omit<Transaction, 'id'>) => boolean;
  updateTransaction: (tx: Transaction) => void;
  deleteTransaction: (id: string) => void;
  
  investments: Investment[];
  setInvestments: (investments: Investment[]) => void;
  addInvestment: (inv: Omit<Investment, 'id'>) => void;
  updateInvestment: (inv: Investment) => void;
  deleteInvestment: (id: string) => void;

  budgets: Budget[];
  setBudgets: (budgets: Budget[]) => void;

  goals: Goal[];
  setGoals: (goals: Goal[]) => void;
  updateGoal: (goal: Goal) => void;

  recurringTransactions: RecurringTransaction[];
  addRecurringTransaction: (rtx: Omit<RecurringTransaction, 'id'>) => void;
  updateRecurringTransaction: (rtx: RecurringTransaction) => void;
  deleteRecurringTransaction: (id: string) => void;
  
  balance: number;
  totalInvestmentsValue: number;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [transactions, setTransactions] = useLocalStorage<Transaction[]>('transactions', []);
  const [investments, setInvestments] = useLocalStorage<Investment[]>('investments', []);
  const [budgets, setBudgets] = useLocalStorage<Budget[]>('budgets', []);
  const [goals, setGoals] = useLocalStorage<Goal[]>('goals', []);
  const [recurringTransactions, setRecurringTransactions] = useLocalStorage<RecurringTransaction[]>('recurring-transactions', []);
  const [budgetSettings] = useLocalStorage('budgetSettings', {
    alertsEnabled: true,
    alertThreshold: 80, // percentage
    hardModeEnabled: false,
  });

  const { t, isLoaded } = useLocale();

  const addTransaction = (tx: Omit<Transaction, 'id'>): boolean => {
    if (tx.type === TransactionType.Expense) {
        const budget = budgets.find(b => b.category === tx.category);
        if (budget && budget.amount > 0) {
            const now = new Date();
            const monthlyExpensesForCategory = transactions
                .filter(t => 
                    t.type === TransactionType.Expense && 
                    t.category === tx.category && 
                    new Date(t.date).getMonth() === now.getMonth() && 
                    new Date(t.date).getFullYear() === now.getFullYear()
                )
                .reduce((acc, t) => acc + t.amount, 0);

            const spentSoFar = monthlyExpensesForCategory;
            const spentAfterThis = spentSoFar + tx.amount;
            const percentageSpentAfter = (spentAfterThis / budget.amount) * 100;
            const categoryDisplay = t(`category_${tx.category.toLowerCase().replace(/ /g, '_')}`, tx.category);

            if (budgetSettings.hardModeEnabled && percentageSpentAfter > 100) {
                alert(t('hard_mode_alert', { amount: tx.amount.toString(), category: categoryDisplay }));
                return false; 
            }

            if (budgetSettings.alertsEnabled) {
                const percentageSpentBefore = (spentSoFar / budget.amount) * 100;
                if (percentageSpentBefore < budgetSettings.alertThreshold && percentageSpentAfter >= budgetSettings.alertThreshold) {
                    alert(t('budget_alert_message', { percentage: percentageSpentAfter.toFixed(0), category: categoryDisplay }));
                }
            }
        }
    }
    
    const newTx = { ...tx, id: crypto.randomUUID() };
    setTransactions(prev => [newTx, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    return true;
  };
  const updateTransaction = (updatedTx: Transaction) => {
    setTransactions(prev => prev.map(tx => (tx.id === updatedTx.id ? updatedTx : tx)));
  };
  const deleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(tx => tx.id !== id));
  };
  
  const addInvestment = (inv: Omit<Investment, 'id'>) => {
    setInvestments(prev => [{ ...inv, id: crypto.randomUUID() }, ...prev]);
  };
  const updateInvestment = (updatedInv: Investment) => {
    setInvestments(prev => prev.map(inv => (inv.id === updatedInv.id ? updatedInv : inv)));
  };
  const deleteInvestment = (id: string) => {
    setInvestments(prev => prev.filter(inv => inv.id !== id));
  };

  const addRecurringTransaction = (rtx: Omit<RecurringTransaction, 'id'>) => {
      setRecurringTransactions(prev => [...prev, { ...rtx, id: crypto.randomUUID() }]);
  };
  const updateRecurringTransaction = (updatedRtx: RecurringTransaction) => {
      setRecurringTransactions(prev => prev.map(rtx => rtx.id === updatedRtx.id ? updatedRtx : rtx));
  };
  const deleteRecurringTransaction = (id: string) => {
      setRecurringTransactions(prev => prev.filter(rtx => rtx.id !== id));
  };

  const updateGoal = (updatedGoal: Goal) => {
    setGoals(prev => prev.map(g => (g.id === updatedGoal.id ? updatedGoal : g)));
  };

  const balance = useMemo(() => {
    return transactions.reduce((acc, tx) => {
      if (tx.type === TransactionType.Income) return acc + tx.amount;
      if ([TransactionType.Expense, TransactionType.Savings, TransactionType.Investment].includes(tx.type)) {
        return acc - tx.amount;
      }
      return acc;
    }, 0);
  }, [transactions]);
  
  const totalInvestmentsValue = useMemo(() => {
    return investments.reduce((acc, inv) => acc + (inv.quantity * inv.currentPrice), 0);
  }, [investments]);

  useEffect(() => {
    if (!isLoaded) return;

    const processRecurringTransactions = () => {
        const now = new Date();
        const newTransactions: Omit<Transaction, 'id'>[] = [];
        
        const updatedRecurringTxs = recurringTransactions.map(rtx => {
            const rtxCopy = { ...rtx };
            let nextDueDate = new Date(rtxCopy.nextDueDate);

            while(nextDueDate <= now) {
                if (rtxCopy.endDate && nextDueDate > new Date(rtxCopy.endDate)) {
                    break;
                }
                newTransactions.push({
                    ...rtxCopy.baseTransaction,
                    date: nextDueDate.toISOString(),
                    tags: [...(rtxCopy.baseTransaction.tags || []), 'recurring']
                });

                let newNextDueDate: Date;
                if(rtxCopy.frequency === Frequency.Daily) newNextDueDate = add(nextDueDate, { days: 1 });
                else if (rtxCopy.frequency === Frequency.Weekly) newNextDueDate = add(nextDueDate, { weeks: 1 });
                else newNextDueDate = add(nextDueDate, { months: 1 });
                
                rtxCopy.nextDueDate = newNextDueDate.toISOString();
                nextDueDate = newNextDueDate;
            }
            return rtxCopy;
        });

        if (newTransactions.length > 0) {
            const addedTransactions = newTransactions.map(tx => ({...tx, id: crypto.randomUUID()}));
            setTransactions(prev => [...prev, ...addedTransactions].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
            setRecurringTransactions(updatedRecurringTxs);
            alert(t('recurring_transactions_added_alert', { count: newTransactions.length }));
        }
    };
    
    const timer = setTimeout(processRecurringTransactions, 1000);
    return () => clearTimeout(timer);
  }, [isLoaded]);

  const value: DataContextType = {
    transactions,
    setTransactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    investments,
    setInvestments,
    addInvestment,
    updateInvestment,
    deleteInvestment,
    budgets,
    setBudgets,
    goals,
    setGoals,
    updateGoal,
    recurringTransactions,
    addRecurringTransaction,
    updateRecurringTransaction,
    deleteRecurringTransaction,
    balance,
    totalInvestmentsValue,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const useData = (): DataContextType => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
