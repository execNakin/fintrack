
import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { RecurringTransaction, TransactionType, Frequency } from '../types';
import { format } from 'date-fns';
import { enUS, th } from 'date-fns/locale';
import { Plus, Edit, Trash2, Repeat, TrendingUp, TrendingDown, PiggyBank, Briefcase } from 'lucide-react';
import RecurringTransactionModal from '../components/RecurringTransactionModal';
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
    [TransactionType.Income]: { icon: TrendingUp, color: 'text-green-400' },
    [TransactionType.Expense]: { icon: TrendingDown, color: 'text-red-400' },
    [TransactionType.Savings]: { icon: PiggyBank, color: 'text-blue-400' },
    [TransactionType.Investment]: { icon: Briefcase, color: 'text-purple-400' },
};

const AutomationsPage: React.FC = () => {
    const { recurringTransactions, deleteRecurringTransaction } = useData();
    const { t, locale } = useLocale();
    const [isModalOpen, setModalOpen] = useState(false);
    const [editingRtx, setEditingRtx] = useState<RecurringTransaction | undefined>(undefined);

    const openAddModal = () => {
        setEditingRtx(undefined);
        setModalOpen(true);
    };

    const openEditModal = (rtx: RecurringTransaction) => {
        setEditingRtx(rtx);
        setModalOpen(true);
    };
    
    const closeModal = () => {
        setModalOpen(false);
        setEditingRtx(undefined);
    };

    const dateLocale = locale === 'th' ? th : enUS;

    const getFrequencyLabel = (freq: Frequency) => {
        const key = `frequency_${freq}` as const;
        return t(key, freq);
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-white">{t('automations_title')}</h1>
                <button
                    onClick={openAddModal}
                    className="flex items-center bg-brand-yellow text-brand-dark font-bold py-2 px-4 rounded-lg hover:bg-yellow-300 transition-colors duration-200 active:scale-95"
                >
                    <Plus className="w-5 h-5 mr-2" />
                    {t('add_automation_button')}
                </button>
            </div>
            
             <p className="text-gray-400">{t('automations_description')}</p>

            <motion.div 
                className="bg-brand-dark rounded-xl overflow-hidden"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                <ul className="divide-y divide-gray-700">
                    {recurringTransactions.length > 0 ? recurringTransactions.map(rtx => {
                        const config = TYPE_CONFIG[rtx.baseTransaction.type];
                        const Icon = config.icon;
                        const categoryDisplay = t(`category_${rtx.baseTransaction.category.toLowerCase().replace(/ /g, '_')}`, rtx.baseTransaction.category);
                        return (
                            <motion.li 
                                key={rtx.id} 
                                className={`p-4 flex items-center justify-between hover:bg-gray-800 transition-colors`}
                                variants={itemVariants}
                            >
                                <div className="flex items-center">
                                    <div className="p-3 rounded-full mr-4 bg-gray-700">
                                        <Icon className={`w-6 h-6 ${config.color}`} />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-white capitalize">{categoryDisplay}</p>
                                        <p className="text-sm text-gray-400">
                                            {getFrequencyLabel(rtx.frequency)} - {t('modal_label_next_date', { date: format(new Date(rtx.nextDueDate), 'dd MMM yyyy', { locale: dateLocale }) })}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className={`font-bold text-lg ${config.color}`}>
                                        {rtx.baseTransaction.type === TransactionType.Income ? '+' : '-'}
                                        {rtx.baseTransaction.amount.toLocaleString(locale, { style: 'currency', currency: 'THB' })}
                                    </span>
                                    <button onClick={() => openEditModal(rtx)} className="text-gray-400 hover:text-white p-1"><Edit className="w-5 h-5"/></button>
                                    <button onClick={() => deleteRecurringTransaction(rtx.id)} className="text-gray-400 hover:text-red-500 p-1"><Trash2 className="w-5 h-5"/></button>
                                </div>
                            </motion.li>
                        );
                    }) : (
                      <li className="p-8 text-center text-gray-500 flex flex-col items-center gap-4">
                          <Repeat className="w-12 h-12 text-gray-600"/>
                          <p className="font-bold text-white">{t('no_automations_found')}</p>
                          <p className="max-w-xs">{t('no_automations_desc')}</p>
                      </li>
                    )}
                </ul>
            </motion.div>
            
            {isModalOpen && <RecurringTransactionModal recurringTransaction={editingRtx} onClose={closeModal} />}
        </div>
    );
};

export default AutomationsPage;
