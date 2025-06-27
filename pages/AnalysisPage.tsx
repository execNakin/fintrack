import React, { useState, useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import { useLocale } from '../contexts/LocaleContext';
import { GoogleGenAI } from '@google/genai';
import { motion } from 'framer-motion';
import { BrainCircuit, LoaderCircle, AlertTriangle, Lightbulb } from 'lucide-react';

// A simple component to render markdown-like text from the AI
const MarkdownRenderer: React.FC<{ content: string }> = ({ content }) => {
    const processedContent = useMemo(() => {
        return content
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
            .replace(/^- (.*$)/gm, '<ul><li>$1</li></ul>') // Unordered list items
            .replace(/<\/ul>\s*<ul>/g, ''); // Merge consecutive lists
    }, [content]);

    return <div className="markdown-content whitespace-pre-wrap leading-relaxed" dangerouslySetInnerHTML={{ __html: processedContent }} />;
};

const AnalysisPage: React.FC = () => {
    const { transactions } = useData();
    const { t } = useLocale();

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [analysisResult, setAnalysisResult] = useState('');

    const handleGenerateAnalysis = async () => {
        if (transactions.length < 5) {
            setError(t('no_data_for_analysis'));
            return;
        }

        setIsLoading(true);
        setError(null);
        setAnalysisResult('');

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

            const systemInstruction = t('ai_prompt_financial_analysis');

            // Prepare a simplified version of transactions for the prompt
            const preparedTransactions = transactions.map(({ type, amount, category, date }) => ({
                type,
                amount,
                category: t(`category_${category.toLowerCase().replace(/ /g, '_')}`, category),
                date: date.split('T')[0] // Just the date part
            }));

            const promptContent = `Here is the user's transaction data in JSON format:\n${JSON.stringify(preparedTransactions, null, 2)}\nPlease provide your analysis now.`;

            const responseStream = await ai.models.generateContentStream({
                model: 'gemini-2.5-flash-preview-04-17',
                contents: promptContent,
                config: {
                    systemInstruction,
                }
            });

            for await (const chunk of responseStream) {
                setAnalysisResult(prev => prev + chunk.text);
            }

        } catch (err) {
            console.error(err);
            setError(t('analysis_error'));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="text-center">
                <BrainCircuit className="w-16 h-16 mx-auto text-brand-yellow" />
                <h1 className="text-3xl font-bold text-white mt-4">{t('analysis_title')}</h1>
                <p className="text-gray-400 mt-2">{t('analysis_description')}</p>
            </div>
            
            <div className="bg-brand-dark rounded-xl p-6 text-center">
                <button
                    onClick={handleGenerateAnalysis}
                    disabled={isLoading}
                    className="bg-brand-yellow text-brand-dark font-bold py-3 px-6 rounded-lg hover:bg-yellow-300 transition-colors duration-200 active:scale-95 disabled:bg-gray-500 disabled:cursor-not-allowed flex items-center justify-center mx-auto"
                >
                    {isLoading ? (
                        <>
                            <LoaderCircle className="w-6 h-6 mr-3 animate-spin" />
                            {t('generating_analysis_message')}
                        </>
                    ) : (
                         <>
                            <Lightbulb className="w-6 h-6 mr-3" />
                            {t('generate_analysis_button')}
                        </>
                    )}
                </button>
                {error && (
                    <div className="mt-4 text-red-400 flex items-center justify-center gap-2">
                        <AlertTriangle className="w-5 h-5" />
                        <span>{error}</span>
                    </div>
                )}
            </div>

            {analysisResult && (
                 <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="bg-brand-dark rounded-xl p-8 space-y-4 text-gray-300"
                >
                    <MarkdownRenderer content={analysisResult} />
                </motion.div>
            )}
        </div>
    );
};

export default AnalysisPage;
