
import React, { useState, useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import { Investment, TransactionType } from '../types';
import { Sparkles, LoaderCircle } from 'lucide-react';
import { useLocale } from '../contexts/LocaleContext';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchPriceWithAI, fetchUSDToTHBExchangeRate, GroundingChunk } from '../utils/gemini';

interface InvestmentModalProps {
    investment?: Investment;
    onClose: () => void;
}

const modalVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 }
};

const InvestmentModal: React.FC<InvestmentModalProps> = ({ investment, onClose }) => {
    const { addInvestment, updateInvestment, addTransaction } = useData();
    const { t } = useLocale();
    
    const [name, setName] = useState(investment?.name || '');
    const [ticker, setTicker] = useState(investment?.ticker || '');
    const [quantity, setQuantity] = useState(investment?.quantity.toString() || '');
    const [purchasePrice, setPurchasePrice] = useState(investment?.purchasePrice.toString() || '');
    const [currentPrice, setCurrentPrice] = useState(investment?.currentPrice.toString() || '');
    const [purchaseDate, setPurchaseDate] = useState(investment ? new Date(investment.purchaseDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);

    const [isFetching, setIsFetching] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [priceSources, setPriceSources] = useState<GroundingChunk[] | null>(null);

    const handleFetchPrice = async () => {
        if (!ticker.trim()) {
            setFetchError(t('error_enter_ticker_first'));
            return;
        }
        setIsFetching(true);
        setFetchError(null);
        setPriceSources(null);
        try {
            const { price, sources } = await fetchPriceWithAI(ticker, t);
            setCurrentPrice(price.toString());
            if (sources) {
                setPriceSources(sources);
            }
        } catch (err) {
            console.error(err);
            setFetchError(t('error_fetch_price'));
        } finally {
            setIsFetching(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        
        const parsedQuantity = parseFloat(quantity) || 0;
        const parsedPurchasePrice = parseFloat(purchasePrice) || 0;

        const investmentData = {
            name: name || ticker,
            ticker,
            quantity: parsedQuantity,
            purchasePrice: parsedPurchasePrice,
            currentPrice: parseFloat(currentPrice) || 0,
            purchaseDate: new Date(purchaseDate).toISOString(),
        };

        if (investment) {
            updateInvestment({ ...investmentData, id: investment.id });
            onClose();
        } else {
            try {
                const { rate, sources } = await fetchUSDToTHBExchangeRate(t);
                const costInTHB = parsedQuantity * parsedPurchasePrice * rate;
                const investmentCategory = t('category_investment');

                addInvestment(investmentData);
                
                if (parsedQuantity > 0 && parsedPurchasePrice > 0) {
                    let notes = t('investment_purchase_notes', {
                       name: investmentData.name,
                       ticker: ticker,
                       cost: (parsedPurchasePrice * parsedQuantity).toString(),
                       rate: rate.toString()
                    });
                    
                    if(sources && sources.length > 0) {
                        const sourcesText = sources.map(s => `${s.web.title}: ${s.web.uri}`).join('; ');
                        notes += `\n\nSources: ${sourcesText}`;
                    }

                    addTransaction({
                        type: TransactionType.Investment,
                        amount: costInTHB,
                        date: new Date(purchaseDate).toISOString(),
                        category: investmentCategory,
                        tags: ['asset-purchase'],
                        notes: notes,
                    });
                }
                onClose();
            } catch (error) {
                console.error("Failed to fetch exchange rate for purchase:", error);
                alert(t('error_create_transaction_exchange_rate'));
            } finally {
                setIsSubmitting(false);
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
                    <h2 className="text-2xl font-bold text-white mb-6">{investment ? t('modal_edit_investment_title') : t('modal_add_investment_title')}</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">{t('modal_label_asset_name')}</label>
                                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder={t('modal_placeholder_asset_name')} className="w-full bg-gray-700 text-white rounded-lg p-2.5 border border-gray-600 focus:ring-brand-yellow focus:border-brand-yellow" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">{t('modal_label_ticker')}</label>
                                <input type="text" value={ticker} onChange={e => setTicker(e.target.value.toUpperCase())} placeholder={t('modal_placeholder_ticker')} required className="w-full bg-gray-700 text-white rounded-lg p-2.5 border border-gray-600 focus:ring-brand-yellow focus:border-brand-yellow" />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">{t('modal_label_purchase_price_usd')}</label>
                                <input type="number" step="any" value={purchasePrice} onChange={e => setPurchasePrice(e.target.value)} placeholder="0.00" required className="w-full bg-gray-700 text-white rounded-lg p-2.5 border border-gray-600 focus:ring-brand-yellow focus:border-brand-yellow" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">{t('modal_label_quantity')}</label>
                                <input type="number" step="any" value={quantity} onChange={e => setQuantity(e.target.value)} placeholder="0.00" required className="w-full bg-gray-700 text-white rounded-lg p-2.5 border border-gray-600 focus:ring-brand-yellow focus:border-brand-yellow" />
                            </div>
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">{t('modal_label_current_price_usd')}</label>
                            <div className="flex items-center gap-2">
                               <input type="number" step="any" value={currentPrice} onChange={e => setCurrentPrice(e.target.value)} placeholder="0.00" required className="flex-grow w-full bg-gray-700 text-white rounded-lg p-2.5 border border-gray-600 focus:ring-brand-yellow focus:border-brand-yellow" />
                                <button
                                    type="button"
                                    onClick={handleFetchPrice}
                                    disabled={isFetching || !ticker}
                                    className="flex-shrink-0 flex items-center justify-center bg-blue-600 text-white font-bold py-2.5 px-3 rounded-lg hover:bg-blue-500 transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed"
                                >
                                    {isFetching ? <LoaderCircle className="w-5 h-5 animate-spin"/> : <Sparkles className="w-5 h-5"/>}
                                </button>
                            </div>
                             {fetchError && <p className="text-red-400 text-xs mt-1">{fetchError}</p>}
                             {priceSources && (
                                <div className="mt-2 text-xs text-gray-400">
                                    <p className="font-bold mb-1">Sources:</p>
                                    <ul className="list-disc list-inside space-y-1">
                                        {priceSources.map((source, index) => (
                                            <li key={index}>
                                                <a href={source.web.uri} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                                                    {source.web.title || source.web.uri}
                                                </a>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">{t('modal_label_purchase_date')}</label>
                            <input type="date" value={purchaseDate} onChange={e => setPurchaseDate(e.target.value)} required className="w-full bg-gray-700 text-white rounded-lg p-2.5 border border-gray-600 focus:ring-brand-yellow focus:border-brand-yellow" />
                        </div>
                        <div className="flex justify-end gap-3 pt-4">
                            <button type="button" onClick={onClose} className="bg-gray-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-500 transition-colors">{t('cancel_button')}</button>
                            <button type="submit" disabled={isSubmitting} className="bg-brand-yellow text-brand-dark font-bold py-2 px-4 rounded-lg hover:bg-yellow-300 transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed">
                                {isSubmitting ? <LoaderCircle className="w-5 h-5 animate-spin" /> : (investment ? t('save_button') : t('add_asset_button'))}
                            </button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default InvestmentModal;
