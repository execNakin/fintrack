
import React, { useState, useEffect, useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import { RecurringTransaction, TransactionType, Frequency } from '../types';
import { useLocale } from '../contexts/LocaleContext';
import { motion, AnimatePresence } from 'framer-motion';

interface RecurringTransactionModalProps {
    recurringTransaction?: RecurringTransaction;
    onClose: () => void;
}

const modalVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 }
};

const RecurringTransactionModal: React.FC<RecurringTransactionModalProps> = ({ recurringTransaction, onClose }) => {
    const { addRecurringTransaction, updateRecurringTransaction } = useData();
    const { t } = useLocale();
    
    const [baseTransaction, setBaseTransaction] = useState(recurringTransaction?.baseTransaction || {
        type: TransactionType.Expense,
        amount: 0,
        category: '',
        tags: [],
        notes: ''
    });
    const [amountStr, setAmountStr] = useState(recurringTransaction?.baseTransaction.amount.toString() || '');
    const [tagsStr, setTagsStr] = useState(recurringTransaction?.baseTransaction.tags.join(', ') || '');

    const [frequency, setFrequency] = useState<Frequency>(recurringTransaction?.frequency || Frequency.Monthly);
    const [startDate, setStartDate] = useState<string>(recurringTransaction?.startDate ? new Date(recurringTransaction.startDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState<string>(recurringTransaction?.endDate ? new Date(recurringTransaction.endDate).toISOString().split('T')[0] : '');
    
    const typeLabels: Record<TransactionType, string> = useMemo(() => ({
        [TransactionType.Income]: t('type_income'),
        [TransactionType.Expense]: t('type_expense'),
        [TransactionType.Savings]: t('type_savings'),
        [TransactionType.Investment]: t('type_investment'),
    }), [t]);
    
    const frequencyLabels: Record<Frequency, string> = useMemo(() => ({
        [Frequency.Daily]: t('frequency_daily'),
        [Frequency.Weekly]: t('frequency_weekly'),
        [Frequency.Monthly]: t('frequency_monthly'),
    }), [t]);
    
    const defaultCategories = useMemo(() => [
        t('category_food'), t('category_travel'), t('category_shopping'), t('category_utilities'),
        t('category_entertainment'), t('category_health'), t('category_education'), t('category_personal'),
        t('category_salary'), t('category_freelance'), t('category_other')
    ], [t]);


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const categoryKey = Object.keys(t('categories_map', {})).find(key => t('categories_map', {})[key] === baseTransaction.category) || baseTransaction.category;

        const finalBaseTransaction = {
            ...baseTransaction,
            amount: parseFloat(amountStr) || 0,
            category: categoryKey || 'Other',
            tags: tagsStr.split(',').map(tag => tag.trim()).filter(Boolean),
        };

        const rtxData = {
            baseTransaction: finalBaseTransaction,
            frequency,
            startDate: new Date(startDate).toISOString(),
            nextDueDate: new Date(startDate).toISOString(), // nextDueDate is same as start for a new one
            endDate: endDate ? new Date(endDate).toISOString() : undefined,
        };

        if(recurringTransaction) {
            updateRecurringTransaction({ ...rtxData, id: recurringTransaction.id, nextDueDate: recurringTransaction.nextDueDate }); // Don't reset nextDueDate on edit
        } else {
            addRecurringTransaction(rtxData);
        }
        onClose();
    };
    
    useEffect(() => {
        const handleEsc = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    return (
        <AnimatePresence>
            <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4" onClick={onClose}>
                <motion.div 
                    className="bg-brand-dark rounded-xl p-8 w-full max-w-lg" 
                    onClick={(e) => e.stopPropagation()}
                    variants={modalVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    transition={{ type: 'spring', duration: 0.4 }}
                >
                    <h2 className="text-2xl font-bold text-white mb-6">{recurringTransaction ? t('modal_edit_automation_title') : t('modal_add_automation_title')}</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        
                        <h3 className="text-lg font-semibold text-brand-yellow border-b border-gray-600 pb-1">{t('modal_label_transaction_details')}</h3>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">{t('modal_label_type')}</label>
                                <select value={baseTransaction.type} onChange={(e) => setBaseTransaction(p => ({...p, type: e.target.value as TransactionType}))} className="w-full bg-gray-700 text-white rounded-lg p-2.5 border border-gray-600 focus:ring-brand-yellow focus:border-brand-yellow">
                                    {Object.values(TransactionType).map(t => <option key={t} value={t} className="capitalize">{typeLabels[t]}</option>)}
                                </select>
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">{t('modal_label_amount')}</label>
                                <input type="number" value={amountStr} onChange={e => setAmountStr(e.target.value)} placeholder="0.00" required className="w-full bg-gray-700 text-white rounded-lg p-2.5 border border-gray-600 focus:ring-brand-yellow focus:border-brand-yellow" />
                            </div>
                        </div>

                         <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">{t('modal_label_category')}</label>
                             <input list="categories" value={baseTransaction.category} onChange={e => setBaseTransaction(p => ({...p, category: e.target.value}))} placeholder={t('modal_placeholder_category')} required className="w-full bg-gray-700 text-white rounded-lg p-2.5 border border-gray-600 focus:ring-brand-yellow focus:border-brand-yellow" />
                             <datalist id="categories">
                                {defaultCategories.map(c => <option key={c} value={c} />)}
                             </datalist>
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">{t('modal_label_tags')}</label>
                            <input type="text" value={tagsStr} onChange={e => setTagsStr(e.target.value)} placeholder={t('modal_placeholder_tags')} className="w-full bg-gray-700 text-white rounded-lg p-2.5 border border-gray-600 focus:ring-brand-yellow focus:border-brand-yellow" />
                        </div>
                        
                        <h3 className="text-lg font-semibold text-brand-yellow border-b border-gray-600 pb-1 pt-4">{t('modal_label_schedule_details')}</h3>
                        
                        <div className="grid grid-cols-3 gap-4">
                           <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">{t('modal_label_frequency')}</label>
                                <select value={frequency} onChange={(e) => setFrequency(e.target.value as Frequency)} className="w-full bg-gray-700 text-white rounded-lg p-2.5 border border-gray-600 focus:ring-brand-yellow focus:border-brand-yellow">
                                    {Object.values(Frequency).map(f => <option key={f} value={f} className="capitalize">{frequencyLabels[f]}</option>)}
                                </select>
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">{t('modal_label_start_date')}</label>
                                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required className="w-full bg-gray-700 text-white rounded-lg p-2.5 border border-gray-600 focus:ring-brand-yellow focus:border-brand-yellow" disabled={!!recurringTransaction} />
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">{t('modal_label_end_date')}</label>
                                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full bg-gray-700 text-white rounded-lg p-2.5 border border-gray-600 focus:ring-brand-yellow focus:border-brand-yellow" />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-4">
                            <button type="button" onClick={onClose} className="bg-gray-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-500 transition-colors">{t('cancel_button')}</button>
                            <button type="submit" className="bg-brand-yellow text-brand-dark font-bold py-2 px-4 rounded-lg hover:bg-yellow-300 transition-colors">{t('save_button')}</button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default RecurringTransactionModal;
