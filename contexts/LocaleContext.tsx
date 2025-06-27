import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import { LoaderCircle } from 'lucide-react';

type Locale = 'en' | 'th';

interface LocaleContextType {
    locale: Locale;
    setLocale: (locale: Locale) => void;
    t: (key: string, fallback?: string | Record<string, any>) => any;
    isLoaded: boolean;
}

const LocaleContext = createContext<LocaleContextType | undefined>(undefined);

export const LocaleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [locale, setLocale] = useLocalStorage<Locale>('locale', 'th');
    const [translations, setTranslations] = useState<Record<string, any> | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        const fetchTranslations = async () => {
            try {
                // Paths are relative to index.html
                const [enResponse, thResponse] = await Promise.all([
                    fetch('./locales/en.json'),
                    fetch('./locales/th.json')
                ]);

                if (!enResponse.ok || !thResponse.ok) {
                    throw new Error('Failed to fetch translation files');
                }

                const enData = await enResponse.json();
                const thData = await thResponse.json();

                setTranslations({ en: enData, th: thData });
                setIsLoaded(true);
            } catch (error) {
                console.error("Failed to load translation files:", error);
            }
        };

        fetchTranslations();
    }, []);

    const t = useMemo(() => (key: string, options?: string | Record<string, any>): any => {
        if (!isLoaded || !translations) {
            if (typeof options === 'string') return options;
            return key;
        }

        const currentLocaleTranslations = translations[locale];
        const englishTranslations = translations['en'];

        let translation = key.split('.').reduce((acc, currentKey) => acc && acc[currentKey], currentLocaleTranslations);

        if (!translation) {
            // Fallback to English if translation is missing in the current locale
            translation = key.split('.').reduce((acc, currentKey) => acc && acc[currentKey], englishTranslations);
        }
        
        if (!translation) {
            if (typeof options === 'string') return options;
            return key;
        }

        if (typeof translation === 'string' && typeof options === 'object' && options !== null) {
            return Object.entries(options).reduce((str, [k, v]) => {
                const regex = new RegExp(`{${k}}`, 'g');
                return str.replace(regex, String(v));
            }, translation);
        }

        return translation;

    }, [locale, translations, isLoaded]);
    

    const value: LocaleContextType = {
        locale,
        setLocale,
        t,
        isLoaded,
    };

    if (!isLoaded) {
        return (
            <div className="fixed inset-0 bg-brand-bg flex items-center justify-center">
                <LoaderCircle className="w-12 h-12 text-brand-yellow animate-spin" />
            </div>
        );
    }

    return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export const useLocale = (): LocaleContextType => {
    const context = useContext(LocaleContext);
    if (!context) {
        throw new Error('useLocale must be used within a LocaleProvider');
    }
    return context;
};