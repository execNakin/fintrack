
import React, { useState, useEffect, useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import { Transaction, TransactionType } from '../types';
import { useLocale } from '../contexts/LocaleContext';
import { motion, AnimatePresence } from 'framer-motion';

interface TransactionModalProps {
    transaction?: Transaction;
    onClose: () => void;
}

const modalVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 }
};

const TransactionModal: React.FC<TransactionModalProps> = ({ transaction, onClose }) => {
    const { addTransaction, updateTransaction } = useData();
    const { t } = useLocale();

    const categoryMap = useMemo(() => (t('categories_map', {}) || {}) as Record<string, string>, [t]);

    const getDisplayCategory = (key: string): string => {
        return categoryMap[key] || key;
    };

    const [type, setType] = useState<TransactionType>(transaction?.type || TransactionType.Expense);
    const [amount, setAmount] = useState<string>(transaction?.amount.toString() || '');
    const [date, setDate] = useState<string>(transaction ? new Date(transaction.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
    const [category, setCategory] = useState<string>(transaction ? getDisplayCategory(transaction.category) : '');
    const [tags, setTags] = useState<string>(transaction?.tags.join(', ') || '');
    const [notes, setNotes] = useState<string>(transaction?.notes || '');
    
    const typeLabels: Record<TransactionType, string> = useMemo(() => ({
        [TransactionType.Income]: t('type_income'),
        [TransactionType.Expense]: t('type_expense'),
        [TransactionType.Savings]: t('type_savings'),
        [TransactionType.Investment]: t('type_investment'),
    }), [t]);
    
    const defaultCategories = useMemo((): string[] => {
        return Object.values(categoryMap);
    }, [categoryMap]);


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const categoryKey = Object.keys(categoryMap).find(key => categoryMap[key] === category) || category || 'other';

        const transactionData = {
            type,
            amount: parseFloat(amount),
            date: new Date(date).toISOString(),
            category: categoryKey,
            tags: tags.split(',').map(tag => tag.trim()).filter(Boolean),
            notes,
        };

        if(transaction) {
            updateTransaction({ ...transactionData, id: transaction.id });
            onClose();
        } else {
            const success = addTransaction(transactionData);
            if (success) {
                onClose();
            }
        }
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
                    className="bg-brand-dark rounded-xl p-8 w-full max-w-md" 
                    onClick={(e) => e.stopPropagation()}
                    variants={modalVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    transition={{ type: 'spring', duration: 0.4 }}
                >
                    <h2 className="text-2xl font-bold text-white mb-6">{transaction ? t('modal_edit_transaction_title') : t('modal_add_transaction_title')}</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">{t('modal_label_type')}</label>
                            <select value={type} onChange={(e) => setType(e.target.value as TransactionType)} className="w-full bg-gray-700 text-white rounded-lg p-2.5 border border-gray-600 focus:ring-brand-yellow focus:border-brand-yellow">
                                {Object.values(TransactionType).map(t => <option key={t} value={t} className="capitalize">{typeLabels[t]}</option>)}
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">{t('modal_label_amount')}</label>
                                <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" required className="w-full bg-gray-700 text-white rounded-lg p-2.5 border border-gray-600 focus:ring-brand-yellow focus:border-brand-yellow" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">{t('modal_label_date')}</label>
                                <input type="date" value={date} onChange={e => setDate(e.target.value)} required className="w-full bg-gray-700 text-white rounded-lg p-2.5 border border-gray-600 focus:ring-brand-yellow focus:border-brand-yellow" />
                            </div>
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">{t('modal_label_category')}</label>
                             <input list="categories" value={category} onChange={e => setCategory(e.target.value)} placeholder={t('modal_placeholder_category')} required className="w-full bg-gray-700 text-white rounded-lg p-2.5 border border-gray-600 focus:ring-brand-yellow focus:border-brand-yellow" />
                             <datalist id="categories">
                                {defaultCategories.map(c => <option key={c} value={c} />)}
                             </datalist>
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">{t('modal_label_tags')}</label>
                            <input type="text" value={tags} onChange={e => setTags(e.target.value)} placeholder={t('modal_placeholder_tags')} className="w-full bg-gray-700 text-white rounded-lg p-2.5 border border-gray-600 focus:ring-brand-yellow focus:border-brand-yellow" />
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">{t('modal_label_notes')}</label>
                            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} className="w-full bg-gray-700 text-white rounded-lg p-2.5 border border-gray-600 focus:ring-brand-yellow focus:border-brand-yellow"></textarea>
                        </div>
                        <div className="flex justify-end gap-3 pt-4">
                            <button type="button" onClick={onClose} className="bg-gray-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-500 transition-colors">{t('cancel_button')}</button>
                            <button type="submit" className="bg-brand-yellow text-brand-dark font-bold py-2 px-4 rounded-lg hover:bg-yellow-300 transition-colors">{transaction ? t('save_button') : t('add_transaction_button')}</button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default TransactionModal;
