
import { GoogleGenAI } from "@google/genai";

export interface GroundingChunk {
    web: {
        uri: string;
        title: string;
    }
}

interface PriceResponse {
    price: number;
    sources?: GroundingChunk[];
}

interface RateResponse {
    rate: number;
    sources?: GroundingChunk[];
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

// response type is inferred from ai.models.generateContent
const parseAIResponse = (response: any) => {
    let jsonStr = response.text.trim();
    const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
    const match = jsonStr.match(fenceRegex);
    if (match && match[2]) {
        jsonStr = match[2].trim();
    }
    const parsed = JSON.parse(jsonStr);
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks as GroundingChunk[] | undefined;
    return { parsed, sources };
}


export const fetchPriceWithAI = async (ticker: string, t: (key: string, fallback?: string | Record<string, any>) => any): Promise<PriceResponse> => {
    const systemInstruction = t('ai_prompt_fetch_price');
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-preview-04-17',
        contents: `${t('ai_get_price_instruction')} "${ticker}"`,
        config: {
            systemInstruction,
            tools: [{googleSearch: {}}],
        }
    });

    const { parsed, sources } = parseAIResponse(response);

    if (typeof parsed.price === 'number') {
        return { price: parsed.price, sources };
    } else {
        throw new Error(t('error_invalid_price_format'));
    }
}

export const fetchUSDToTHBExchangeRate = async (t: (key: string, fallback?: string | Record<string, any>) => any): Promise<RateResponse> => {
    const systemInstruction = t('ai_prompt_usd_thb_rate');
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-preview-04-17',
        contents: t('ai_get_usd_thb_rate_instruction'),
        config: {
            systemInstruction,
            tools: [{googleSearch: {}}],
        }
    });
    
    const { parsed, sources } = parseAIResponse(response);

    if (typeof parsed.rate === 'number' && parsed.rate > 0) {
        return { rate: parsed.rate, sources };
    } else {
        throw new Error(t('error_invalid_exchange_rate'));
    }
}
