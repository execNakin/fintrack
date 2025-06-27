import React, { useMemo, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';
import { useData } from '../contexts/DataContext';
import { Transaction, TransactionType } from '../types';
import { TrendingUp, TrendingDown, PiggyBank, Briefcase, Sparkles, LoaderCircle } from 'lucide-react';
import { format, subDays, startOfDay } from 'date-fns';
import { GoogleGenAI } from '@google/genai';
import { useLocale } from '../contexts/LocaleContext';
import { motion } from 'framer-motion';

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


const COLORS: { [key: string]: string } = {
    'อาหาร': '#FF6B6B', 'Food': '#FF6B6B',
    'เดินทาง': '#4ECDC4', 'Travel': '#4ECDC4',
    'ชอปปิ้ง': '#45B7D1', 'Shopping': '#45B7D1',
    'สาธารณูปโภค': '#F7B801', 'Utilities': '#F7B801',
    'บันเทิง': '#5D5FEF', 'Entertainment': '#5D5FEF',
    'สุขภาพ': '#22C55E', 'Health': '#22C55E',
    'การศึกษา': '#A855F7', 'Education': '#A855F7',
    'ของใช้ส่วนตัว': '#F97316', 'Personal': '#F97316',
    'อื่นๆ': '#6B7280', 'Other': '#6B7280',
    'Uncategorized': '#A9A9A9',
    'savings': '#3B82F6', 
};


const AIQuickAdd: React.FC = () => {
    const { addTransaction } = useData();
    const { t, locale } = useLocale();
    const [text, setText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!text.trim()) return;

        setIsLoading(true);
        setError(null);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            
            const systemInstruction = t('ai_prompt_quick_add');
            
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-preview-04-17',
                contents: `${t('ai_parse_instruction')}: "${text}"`,
                config: {
                    systemInstruction,
                    responseMimeType: "application/json",
                }
            });

            let jsonStr = response.text.trim();
            const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
            const match = jsonStr.match(fenceRegex);
            if (match && match[2]) {
                jsonStr = match[2].trim();
            }

            const parsedData = JSON.parse(jsonStr);
            const categoryInEnglish = t(`category_${parsedData.category.toLowerCase().replace(/ /g, '_')}`, parsedData.category);


            if (parsedData.amount > 0 && parsedData.category) {
                addTransaction({
                    type: TransactionType.Expense,
                    amount: parsedData.amount,
                    category: categoryInEnglish,
                    notes: parsedData.notes || '',
                    date: new Date().toISOString(),
                    tags: ['ai-added'],
                });
                setText('');
            } else {
                throw new Error(t('error_extract_expense'));
            }
        } catch (err) {
            console.error(err);
            setError(err instanceof Error ? err.message : t('error_unknown'));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <motion.div variants={itemVariants} className="bg-brand-dark rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-4 text-white flex items-center">
                <Sparkles className="w-6 h-6 mr-3 text-brand-yellow" />
                {t('quick_add_ai')}
            </h2>
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
                <input
                    type="text"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder={t('quick_add_placeholder')}
                    className="flex-grow bg-gray-700 text-white rounded-lg p-3 border border-gray-600 focus:ring-brand-yellow focus:border-brand-yellow transition"
                    disabled={isLoading}
                />
                <button
                    type="submit"
                    className="flex items-center justify-center bg-brand-yellow text-brand-dark font-bold py-3 px-5 rounded-lg hover:bg-yellow-300 transition-colors duration-200 active:scale-95 disabled:bg-gray-500 disabled:cursor-not-allowed"
                    disabled={isLoading || !text.trim()}
                >
                    {isLoading ? <LoaderCircle className="w-6 h-6 animate-spin" /> : t('add_expense_button')}
                </button>
            </form>
            {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
        </motion.div>
    );
};


const SummaryCard: React.FC<{ title: string; amount: number; icon: React.ReactNode; color: string }> = ({ title, amount, icon, color }) => {
    const { locale } = useLocale();
    return (
        <motion.div variants={itemVariants} className="bg-brand-dark rounded-xl p-6 flex items-center transform transition-transform duration-300 hover:-translate-y-1">
            <div className={`p-3 rounded-full mr-4 ${color}`}>
                {icon}
            </div>
            <div>
                <p className="text-sm text-gray-400">{title}</p>
                <p className="text-2xl font-bold text-white">
                    {amount.toLocaleString(locale, { style: 'currency', currency: 'THB', minimumFractionDigits: 2 })}
                </p>
            </div>
        </motion.div>
    );
};

const DashboardPage: React.FC = () => {
    const { transactions, balance, goals, totalInvestmentsValue } = useData();
    const { t, locale } = useLocale();

    const { totalIncome, totalExpenses } = useMemo(() => {
        return transactions.reduce((acc, tx) => {
            if (tx.type === TransactionType.Income) {
                acc.totalIncome += tx.amount;
            } else if (tx.type === TransactionType.Expense) { // Only count expenses for expense total
                acc.totalExpenses += tx.amount;
            }
            return acc;
        }, { totalIncome: 0, totalExpenses: 0 });
    }, [transactions]);
    
    const overviewData = transactions.reduce((acc, tx) => {
        if(tx.type === TransactionType.Expense) {
           const category = t(`category_${tx.category.toLowerCase().replace(/ /g, '_')}`, tx.category);
           acc[category] = (acc[category] || 0) + tx.amount;
        }
        return acc;
    }, {} as Record<string, number>);

    const pieChartData = Object.entries(overviewData).map(([name, value]) => ({name, value})).sort((a,b) => b.value - a.value);

    const lineChartData = useMemo(() => {
      const last30Days = Array.from({ length: 30 }, (_, i) => startOfDay(subDays(new Date(), i))).reverse();
      const dailyData = last30Days.map(day => {
        const dayStr = format(day, 'MMM dd');
        const dailyBalance = transactions
          .filter(tx => startOfDay(new Date(tx.date)) <= day)
          .reduce((acc, tx) => {
            if (tx.type === TransactionType.Income) return acc + tx.amount;
            if ([TransactionType.Expense, TransactionType.Savings, TransactionType.Investment].includes(tx.type)) return acc - tx.amount;
            return acc;
          }, 0);
        return { name: dayStr, balance: dailyBalance };
      });
      return dailyData;
    }, [transactions]);

    const welcomeMessage = useMemo(() => {
        const hour = new Date().getHours();
        if (hour < 12) return t('welcome_morning');
        if (hour < 18) return t('welcome_afternoon');
        return t('welcome_evening');
    }, [t]);


    return (
        <motion.div 
            className="space-y-8"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            <motion.div variants={itemVariants}>
                <h1 className="text-3xl font-bold text-white">{t('dashboard_title')}</h1>
                <p className="text-gray-400 mt-1">{welcomeMessage}</p>
            </motion.div>
            
            <motion.div variants={containerVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <SummaryCard title={t('balance_title')} amount={balance} icon={<PiggyBank className="text-white"/>} color="bg-blue-500" />
                <SummaryCard title={t('total_income_title')} amount={totalIncome} icon={<TrendingUp className="text-white"/>} color="bg-green-500" />
                <SummaryCard title={t('total_expenses_title')} amount={totalExpenses} icon={<TrendingDown className="text-white"/>} color="bg-red-500" />
                <SummaryCard title={t('portfolio_value_title')} amount={totalInvestmentsValue} icon={<Briefcase className="text-white"/>} color="bg-purple-500" />
            </motion.div>

            <AIQuickAdd />

            <motion.div variants={containerVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <motion.div variants={itemVariants} className="lg:col-span-2 bg-brand-dark rounded-xl p-6">
                    <h2 className="text-xl font-semibold mb-4 text-white">{t('cash_flow_title')}</h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={lineChartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                            <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
                            <YAxis stroke="#9ca3af" fontSize={12} tickFormatter={(value) => `฿${Math.round(value/1000)}k`} />
                            <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '0.5rem' }} labelStyle={{ color: '#f9fafb' }} formatter={(value: number) => value.toLocaleString(locale, { style: 'currency', currency: 'THB' })} />
                            <Line type="monotone" dataKey="balance" stroke={COLORS.savings} strokeWidth={2} dot={false} />
                        </LineChart>
                    </ResponsiveContainer>
                </motion.div>
                <motion.div variants={itemVariants} className="bg-brand-dark rounded-xl p-6">
                    <h2 className="text-xl font-semibold mb-4 text-white">{t('expense_overview_title')}</h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                             <Pie data={pieChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} fill="#8884d8" labelLine={false} label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                                if (percent < 0.05) return null;
                                const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                                const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
                                const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);
                                return <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize={12}>{`${(percent * 100).toFixed(0)}%`}</text>
                            }}>
                               {pieChartData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS] || '#8884d8'} />)}
                            </Pie>
                            <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '0.5rem' }} formatter={(value: number, name) => [value.toLocaleString(locale, { style: 'currency', currency: 'THB' }), name]}/>
                        </PieChart>
                    </ResponsiveContainer>
                </motion.div>
            </motion.div>
            
            {goals.length > 0 && (
                <motion.div variants={itemVariants} className="bg-brand-dark rounded-xl p-6">
                    <h2 className="text-xl font-semibold mb-4 text-white">{t('financial_goals_title')}</h2>
                    <div className="space-y-4">
                        {goals.map(goal => {
                            const percentage = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
                            return (
                                <div key={goal.id}>
                                    <div className="flex justify-between mb-1">
                                        <span className="text-base font-medium text-gray-300">{goal.name}</span>
                                        <span className="text-sm font-medium text-gray-400">
                                            {goal.currentAmount.toLocaleString(locale)} / {goal.targetAmount.toLocaleString(locale)} ({percentage.toFixed(1)}%)
                                        </span>
                                    </div>
                                    <div className="w-full bg-gray-700 rounded-full h-2.5">
                                        <div className="bg-brand-yellow h-2.5 rounded-full" style={{ width: `${percentage}%` }}></div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </motion.div>
            )}
        </motion.div>
    );
};

export default DashboardPage;