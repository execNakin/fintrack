import React, { useState, useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import { Transaction, TransactionType } from '../types';
import { format } from 'date-fns';
import { enUS, th } from 'date-fns/locale';
import { Plus, Edit, Trash2, TrendingUp, TrendingDown, PiggyBank, Briefcase, SearchX } from 'lucide-react';
import TransactionModal from '../components/TransactionModal';
import { useLocale } from '../contexts/LocaleContext';
import { motion } from 'framer-motion';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 }
};


const TYPE_CONFIG = {
    [TransactionType.Income]: { icon: TrendingUp, color: 'text-green-400', bg: 'bg-green-500/10', borderColor: 'border-green-400' },
    [TransactionType.Expense]: { icon: TrendingDown, color: 'text-red-400', bg: 'bg-red-500/10', borderColor: 'border-red-400' },
    [TransactionType.Savings]: { icon: PiggyBank, color: 'text-blue-400', bg: 'bg-blue-500/10', borderColor: 'border-blue-400' },
    [TransactionType.Investment]: { icon: Briefcase, color: 'text-purple-400', bg: 'bg-purple-500/10', borderColor: 'border-purple-400' },
};

const HistoryPage: React.FC = () => {
    const { transactions, deleteTransaction } = useData();
    const { t, locale } = useLocale();
    const [isModalOpen, setModalOpen] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState<Transaction | undefined>(undefined);
    const [filterType, setFilterType] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState<string>('');

    const openAddModal = () => {
        setEditingTransaction(undefined);
        setModalOpen(true);
    };

    const openEditModal = (tx: Transaction) => {
        setEditingTransaction(tx);
        setModalOpen(true);
    };
    
    const closeModal = () => {
        setModalOpen(false);
        setEditingTransaction(undefined);
    };

    const filteredTransactions = useMemo(() => {
        return transactions
            .filter(tx => filterType === 'all' || tx.type === filterType)
            .filter(tx => {
                const searchLower = searchTerm.toLowerCase();
                const category = t(`category_${tx.category.toLowerCase().replace(/ /g, '_')}`, tx.category);
                return searchTerm === '' || 
                       tx.tags.some(tag => tag.toLowerCase().includes(searchLower)) || 
                       category.toLowerCase().includes(searchLower) || 
                       tx.notes?.toLowerCase().includes(searchLower);
            });
    }, [transactions, filterType, searchTerm, t]);

    const dateLocale = locale === 'th' ? th : enUS;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-white">{t('history_title')}</h1>
                <button
                    onClick={openAddModal}
                    className="flex items-center bg-brand-yellow text-brand-dark font-bold py-2 px-4 rounded-lg hover:bg-yellow-300 transition-colors duration-200 active:scale-95"
                >
                    <Plus className="w-5 h-5 mr-2" />
                    {t('add_transaction_button')}
                </button>
            </div>
            
            <div className="flex flex-col md:flex-row gap-4">
                <select 
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full md:w-48 bg-brand-dark border border-gray-600 text-white rounded-lg p-2 focus:ring-brand-yellow focus:border-brand-yellow"
                >
                    <option value="all">{t('filter_all_types')}</option>
                    <option value={TransactionType.Income}>{t('type_income')}</option>
                    <option value={TransactionType.Expense}>{t('type_expense')}</option>
                    <option value={TransactionType.Savings}>{t('type_savings')}</option>
                    <option value={TransactionType.Investment}>{t('type_investment')}</option>
                </select>
                <input
                    type="text"
                    placeholder={t('history_search_placeholder')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full md:flex-1 bg-brand-dark border border-gray-600 text-white rounded-lg p-2 focus:ring-brand-yellow focus:border-brand-yellow"
                />
            </div>

            <motion.div 
                className="bg-brand-dark rounded-xl overflow-hidden"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                <ul className="divide-y divide-gray-700">
                    {filteredTransactions.length > 0 ? filteredTransactions.map(tx => {
                        const config = TYPE_CONFIG[tx.type];
                        const Icon = config.icon;
                        const categoryDisplay = t(`category_${tx.category.toLowerCase().replace(/ /g, '_')}`, tx.category);
                        return (
                            <motion.li 
                                key={tx.id} 
                                className={`p-4 flex items-center justify-between hover:bg-gray-800 transition-colors border-l-4 ${config.borderColor}`}
                                variants={itemVariants}
                            >
                                <div className="flex items-center">
                                    <div className={`p-3 rounded-full mr-4 ${config.bg}`}>
                                        <Icon className={`w-6 h-6 ${config.color}`} />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-white capitalize">{categoryDisplay}</p>
                                        <p className="text-sm text-gray-400">{format(new Date(tx.date), 'dd MMM yyyy', { locale: dateLocale })}</p>
                                        {tx.tags.length > 0 && <div className="flex gap-1 mt-1">{tx.tags.map(t => <span key={t} className="text-xs bg-gray-600 text-gray-200 px-2 py-0.5 rounded-full">{t}</span>)}</div>}
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className={`font-bold text-lg ${config.color}`}>
                                        {tx.type === TransactionType.Income ? '+' : '-'}
                                        {tx.amount.toLocaleString(locale, { style: 'currency', currency: 'THB' })}
                                    </span>
                                    <button onClick={() => openEditModal(tx)} className="text-gray-400 hover:text-white p-1"><Edit className="w-5 h-5"/></button>
                                    <button onClick={() => deleteTransaction(tx.id)} className="text-gray-400 hover:text-red-500 p-1"><Trash2 className="w-5 h-5"/></button>
                                </div>
                            </motion.li>
                        );
                    }) : (
                      <li className="p-8 text-center text-gray-500 flex flex-col items-center gap-4">
                          <SearchX className="w-12 h-12 text-gray-600"/>
                          <p>{t('no_transactions_found')}</p>
                      </li>
                    )}
                </ul>
            </motion.div>
            
            {isModalOpen && <TransactionModal transaction={editingTransaction} onClose={closeModal} />}
        </div>
    );
};

export default HistoryPage;