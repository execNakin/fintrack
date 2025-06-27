
import React, { useMemo, useState } from 'react';
import { useData } from '../contexts/DataContext';
import { Investment, TransactionType } from '../types';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Plus, Edit, Trash2, RefreshCw, LoaderCircle, TrendingUp as TrendingUpIcon } from 'lucide-react';
import InvestmentModal from '../components/InvestmentModal';
import { useLocale } from '../contexts/LocaleContext';
import { motion } from 'framer-motion';
import { fetchPriceWithAI, fetchUSDToTHBExchangeRate, GroundingChunk } from '../utils/gemini';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 }
};

const InvestmentCard: React.FC<{ investment: Investment; onEdit: (inv: Investment) => void; onDelete: (id: string) => void; onRefresh: (inv: Investment) => void; isLoading: boolean; sources?: GroundingChunk[] }> = ({ investment, onEdit, onDelete, onRefresh, isLoading, sources }) => {
    const currentValue = investment.quantity * investment.currentPrice;
    const costBasis = investment.quantity * investment.purchasePrice;
    const returnPct = costBasis > 0 ? ((currentValue - costBasis) / costBasis) * 100 : 0;
    const gainLoss = currentValue - costBasis;
    const { t } = useLocale();

    return (
        <motion.div variants={itemVariants} className="bg-brand-dark p-4 rounded-lg flex flex-col justify-between transform transition-transform duration-300 hover:-translate-y-1">
            <div>
                <div className="flex justify-between items-start">
                    <h3 className="font-bold text-white text-lg">{investment.name}</h3>
                    <div className="flex items-center gap-1">
                        <button disabled={isLoading} onClick={() => onRefresh(investment)} className="text-gray-400 hover:text-white p-1 disabled:text-gray-600 disabled:cursor-not-allowed">
                            {isLoading ? <LoaderCircle className="w-4 h-4 animate-spin"/> : <RefreshCw className="w-4 h-4"/>}
                        </button>
                        <button onClick={() => onEdit(investment)} className="text-gray-400 hover:text-white p-1"><Edit className="w-4 h-4"/></button>
                        <button onClick={() => onDelete(investment.id)} className="text-gray-400 hover:text-red-500 p-1"><Trash2 className="w-4 h-4"/></button>
                    </div>
                </div>
                 <p className="text-sm font-semibold text-gray-400 uppercase">{investment.ticker}</p>
                <p className="text-2xl font-mono text-white mt-1">{currentValue.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</p>
                <p className={`text-sm font-semibold ${returnPct >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {returnPct >= 0 ? '+' : ''}{returnPct.toFixed(2)}%
                    <span className="text-gray-400 ml-2">({gainLoss.toLocaleString('en-US', { style: 'currency', currency: 'USD', signDisplay: 'always' })})</span>
                </p>
            </div>
            <div className="text-xs text-gray-500 mt-3 space-y-2">
                <p>{t('investment_card_qty', { qty: investment.quantity, price: investment.purchasePrice.toLocaleString('en-US', { style: 'currency', currency: 'USD' })})}</p>
                {sources && sources.length > 0 && (
                     <div className="pt-1">
                        <p className="font-bold text-gray-400">Sources:</p>
                        <ul className="list-none pl-1 space-y-0.5">
                            {sources.map((source, index) => (
                                <li key={index}>
                                    <a href={source.web.uri} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline truncate block" title={source.web.title || source.web.uri}>
                                        - {source.web.title || source.web.uri}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </motion.div>
    );
}

const InvestmentsPage: React.FC = () => {
    const { investments, updateInvestment, deleteInvestment, addTransaction } = useData();
    const { t } = useLocale();
    const [isModalOpen, setModalOpen] = useState(false);
    const [editingInvestment, setEditingInvestment] = useState<Investment | undefined>(undefined);
    const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
    const [isRefreshingAll, setIsRefreshingAll] = useState(false);
    const [sourcingInfo, setSourcingInfo] = useState<Record<string, GroundingChunk[]>>({});

    const portfolio = useMemo(() => {
        const totalValueUSD = investments.reduce((acc, inv) => acc + (inv.quantity * inv.currentPrice), 0);
        const totalCostUSD = investments.reduce((acc, inv) => acc + (inv.quantity * inv.purchasePrice), 0);
        const overallReturn = totalCostUSD > 0 ? ((totalValueUSD - totalCostUSD) / totalCostUSD) * 100 : 0;
        
        const chartData = investments.map(inv => ({
            name: inv.name,
            value: inv.quantity * inv.currentPrice
        })).filter(d => d.value > 0);

        return { totalValue: totalValueUSD, overallReturn, chartData };
    }, [investments]);
    
    const handleAddClick = () => {
        setEditingInvestment(undefined);
        setModalOpen(true);
    };

    const handleEditClick = (inv: Investment) => {
        setEditingInvestment(inv);
        setModalOpen(true);
    }
    
    const handleDelete = async (id: string) => {
        if(window.confirm(t('confirm_delete_investment'))) {
            const investmentToDelete = investments.find(inv => inv.id === id);
            if (investmentToDelete) {
                try {
                    const { rate, sources } = await fetchUSDToTHBExchangeRate(t);
                    const valueInTHB = investmentToDelete.quantity * investmentToDelete.currentPrice * rate;
                    const saleCategory = t('category_asset_sale');

                    let notes = t('investment_sale_notes', {
                        name: investmentToDelete.name,
                        ticker: investmentToDelete.ticker,
                        value: (investmentToDelete.quantity * investmentToDelete.currentPrice).toString(),
                        rate: rate.toString()
                    });

                    if(sources && sources.length > 0) {
                        const sourcesText = sources.map(s => `${s.web.title}: ${s.web.uri}`).join('; ');
                        notes += `\n\nSources: ${sourcesText}`;
                    }

                    addTransaction({
                        type: TransactionType.Income,
                        amount: valueInTHB,
                        date: new Date().toISOString(),
                        category: saleCategory,
                        tags: ['asset-sale'],
                        notes: notes,
                    });
                    deleteInvestment(id);
                } catch (error) {
                    console.error("Failed to fetch exchange rate for sale:", error);
                    alert(t('error_fetch_exchange_rate'));
                }
            }
        }
    }

    const closeModal = () => {
        setModalOpen(false);
        setEditingInvestment(undefined);
    };
    
    const handleRefresh = async (investment: Investment) => {
        setLoadingStates(prev => ({ ...prev, [investment.id]: true }));
        try {
            const { price, sources } = await fetchPriceWithAI(investment.ticker, t);
            updateInvestment({ ...investment, currentPrice: price });
            if (sources) {
                setSourcingInfo(prev => ({ ...prev, [investment.id]: sources }));
            }
        } catch (error) {
            console.error(`Failed to refresh price for ${investment.ticker}:`, error);
            alert(t('error_refresh_price', { ticker: investment.ticker }));
        } finally {
            setLoadingStates(prev => ({ ...prev, [investment.id]: false }));
        }
    };

    const handleRefreshAll = async () => {
        setIsRefreshingAll(true);
        const allIds = investments.map(inv => inv.id);
        setLoadingStates(allIds.reduce((acc, id) => ({ ...acc, [id]: true }), {}));

        const newSourcingInfo: Record<string, GroundingChunk[]> = {};
        for (const inv of investments) {
            try {
                const { price, sources } = await fetchPriceWithAI(inv.ticker, t);
                updateInvestment({ ...inv, currentPrice: price });
                 if (sources) {
                    newSourcingInfo[inv.id] = sources;
                }
            } catch (error) {
                console.error(`Failed to refresh price for ${inv.ticker}:`, error);
            }
        }
        
        setSourcingInfo(prev => ({...prev, ...newSourcingInfo}));
        
        setTimeout(() => {
            setLoadingStates({});
            setIsRefreshingAll(false);
        }, 500);
    };
    
    const COLORS = ['#FFC700', '#3b82f6', '#22c55e', '#a855f7', '#ef4444', '#f97316'];

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <h1 className="text-3xl font-bold text-white">{t('investments_title')}</h1>
                <div className="flex gap-2">
                     <button
                        onClick={handleRefreshAll}
                        disabled={isRefreshingAll || investments.length === 0}
                        className="flex items-center bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-500 transition-colors duration-200 active:scale-95 disabled:bg-gray-500 disabled:cursor-not-allowed"
                    >
                        {isRefreshingAll ? <LoaderCircle className="w-5 h-5 mr-2 animate-spin" /> : <RefreshCw className="w-5 h-5 mr-2" />}
                        {t('refresh_all_button')}
                    </button>
                    <button
                        onClick={handleAddClick}
                        className="flex items-center bg-brand-yellow text-brand-dark font-bold py-2 px-4 rounded-lg hover:bg-yellow-300 transition-colors duration-200 active:scale-95"
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        {t('add_investment_button')}
                    </button>
                </div>
            </div>

            <motion.div className="grid grid-cols-1 md:grid-cols-2 gap-6" variants={containerVariants} initial="hidden" animate="visible">
                <motion.div variants={itemVariants} className="bg-brand-dark rounded-xl p-6">
                    <h2 className="text-lg font-semibold text-gray-400">{t('total_portfolio_value_usd')}</h2>
                    <p className="text-4xl font-bold font-mono text-white">{portfolio.totalValue.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 })}</p>
                    <p className={`mt-2 text-xl font-semibold ${portfolio.overallReturn >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {portfolio.overallReturn >= 0 ? '↑' : '↓'} {Math.abs(portfolio.overallReturn).toFixed(2)}% {t('total_return')}
                    </p>
                </motion.div>
                <motion.div variants={itemVariants} className="bg-brand-dark rounded-xl p-6 flex flex-col justify-center items-center">
                    <h2 className="text-xl font-semibold mb-4 text-white text-center">{t('portfolio_allocation')}</h2>
                    <ResponsiveContainer width="100%" height={200}>
                       <PieChart>
                            <Pie data={portfolio.chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2}>
                                {portfolio.chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                             <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '0.5rem' }} formatter={(value: number) => value.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}/>
                             <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </motion.div>
            </motion.div>

            <div>
                <h2 className="text-2xl font-bold text-white mb-4">{t('your_assets')}</h2>
                {investments.length > 0 ? (
                    <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" variants={containerVariants} initial="hidden" animate="visible">
                        {investments.map(inv => (
                            <InvestmentCard 
                                key={inv.id} 
                                investment={inv} 
                                onEdit={handleEditClick} 
                                onDelete={handleDelete}
                                onRefresh={handleRefresh}
                                isLoading={loadingStates[inv.id] || isRefreshingAll}
                                sources={sourcingInfo[inv.id]}
                            />
                        ))}
                    </motion.div>
                ) : (
                    <div className="text-center py-16 bg-brand-dark rounded-xl flex flex-col items-center gap-4">
                        <TrendingUpIcon className="w-16 h-16 text-gray-600" />
                        <h3 className="text-xl font-bold text-white">{t('no_investments_yet_title')}</h3>
                        <p className="text-gray-400 max-w-sm">{t('no_investments_yet_desc')}</p>
                    </div>
                )}
            </div>
            
            {isModalOpen && <InvestmentModal investment={editingInvestment} onClose={closeModal} />}
        </div>
    );
};

export default InvestmentsPage;
