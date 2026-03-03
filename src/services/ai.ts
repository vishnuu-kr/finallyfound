import { GoogleGenAI, Type, Schema } from '@google/genai';
import { TMDBTag } from './tmdb';

// @ts-ignore
const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY || (process.env.GEMINI_API_KEY as string) });

export interface ParsedIntent {
    isNaturalLanguage: boolean;
    language?: { id: string; name: string }; // ISO 639-1 code and human name
    genres?: { id: number; name: string }[];
    keywords?: string[];
    translatedQuery?: string;
}

const responseSchema: Schema = {
    type: Type.OBJECT,
    properties: {
        isNaturalLanguage: {
            type: Type.BOOLEAN,
            description: "True if the query describes characteristics (genres, language, mood) rather than a specific title. Example: 'telugu action movie' -> true, 'Inception' -> false"
        },
        languageCode: {
            type: Type.STRING,
            description: "ISO 639-1 code if a language is mentioned (e.g., 'te' for Telugu, 'hi' for Hindi, 'es' for Spanish, 'ko' for Korean). Empty if none."
        },
        languageName: {
            type: Type.STRING,
            description: "The human-readable name of the language mentioned (e.g., 'Telugu', 'Spanish'). Empty if none."
        },
        genreIds: {
            type: Type.ARRAY,
            items: { type: Type.INTEGER },
            description: "TMDB genre IDs extracted from the query. (Action=28, Adventure=12, Animation=16, Comedy=35, Crime=80, Documentary=99, Drama=18, Family=10751, Fantasy=14, History=36, Horror=27, Music=10402, Mystery=9648, Romance=10749, Sci-Fi=878, Thriller=53, War=10752, Western=37)"
        },
        keywords: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Key themes or concepts mentioned (e.g. 'zombies', 'time travel')."
        }
    },
    required: ["isNaturalLanguage", "languageCode", "languageName", "genreIds", "keywords"]
};

export const parseSearchIntent = async (query: string): Promise<ParsedIntent | null> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Analyze this movie search query: "${query}"`,
            config: {
                responseMimeType: 'application/json',
                responseSchema: responseSchema,
            }
        });

        const data = JSON.parse(response.text || '{}');

        return {
            isNaturalLanguage: data.isNaturalLanguage,
            language: data.languageCode ? { id: data.languageCode, name: data.languageName } : undefined,
            genres: data.genreIds ? data.genreIds.map((id: number) => ({ id, name: getGenreName(id) })) : [],
            keywords: data.keywords || []
        };
    } catch (error) {
        console.error("AI intent parsing failed:", error);
        return null;
    }
};

const getGenreName = (id: number) => {
    const map: Record<number, string> = {
        28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy', 80: 'Crime', 99: 'Documentary',
        18: 'Drama', 10751: 'Family', 14: 'Fantasy', 36: 'History', 27: 'Horror', 10402: 'Music',
        9648: 'Mystery', 10749: 'Romance', 878: 'Science Fiction', 10770: 'TV Movie', 53: 'Thriller',
        10752: 'War', 37: 'Western'
    };
    return map[id] || 'Unknown';
}
