/// <reference types="vite/client" />
import OpenAI from 'openai';

const apiKey = import.meta.env.VITE_OPENAI_API_KEY || (process.env.OPENAI_API_KEY as string);
const baseURL = import.meta.env.VITE_OPENAI_API_BASE_URL || (process.env.OPENAI_API_BASE_URL as string);
const model = import.meta.env.VITE_OPENAI_MODEL || (process.env.OPENAI_MODEL as string) || 'gpt-4o';

const openai = new OpenAI({
    apiKey: apiKey,
    baseURL: baseURL || undefined,
    dangerouslyAllowBrowser: true,
    defaultHeaders: {
        'HTTP-Referer': 'https://finallyfound.vercel.app',
        'X-Title': 'FinallyFound',
    },
});

// ─── Types ───────────────────────────────────────────────────────

export interface AIMovieRecommendation {
    title: string;
    year?: number;
    matchReason: string;   // Why this movie fits the vibe
    matchScore: number;    // 1-100 confidence
}

export interface AISearchResult {
    query: string;
    recommendations: AIMovieRecommendation[];
    vibeDescription: string;  // One-line summary of the detected vibe
}

export interface ParsedIntent {
    isNaturalLanguage: boolean;
    languages?: { id: string; name: string }[];
    genres?: { id: number; name: string }[];
    keywords?: string[];
}

// ─── Core AI Recommender ─────────────────────────────────────────

const recommenderPrompt = `You are TasteForge — the most powerful movie recommendation engine in the world.

When a user gives you ANY input — a vibe, a mood, actor names, movie titles, genres, languages, messy lists, or even a single emoji — your job is to return the PERFECT set of movie recommendations.

You are not a search engine. You are a taste profiler. You understand cinema deeply across ALL languages and industries: Hollywood, Bollywood, Tollywood, Kollywood, Korean cinema, Japanese anime films, European arthouse, African cinema, and everything in between.

=== RULES ===
1. Return ONLY valid JSON. No text, no markdown, no fences.
2. Return 10-15 movie recommendations, ranked by relevance.
3. Each recommendation MUST include:
   - "title": The exact movie title (use the most internationally recognized title)
   - "year": Release year (number)
   - "matchReason": A short, punchy, human reason why this movie fits (max 15 words)
   - "matchScore": 70-98 confidence score (never 100, never below 70)
4. Include a "vibeDescription": A one-line creative summary of the detected taste (max 20 words)
5. Mix well-known hits with hidden gems. Never recommend ONLY blockbusters.
6. If the user mentions specific movies, recommend similar ones — do NOT recommend the same movies back.
7. If the user mentions actors/directors, recommend their best work AND movies with similar energy.
8. Prioritize movies that are genuinely great (high ratings, cult classics, award winners).

=== OUTPUT FORMAT ===
{
  "vibeDescription": "Dark, cerebral thrillers with plot twists that break your brain",
  "recommendations": [
    {
      "title": "Oldboy",
      "year": 2003,
      "matchReason": "The ultimate revenge thriller with a devastating twist",
      "matchScore": 97
    },
    ...
  ]
}

Now analyze the user's input and return your recommendations:`;

export const getAIRecommendations = async (query: string): Promise<AISearchResult | null> => {
    try {
        const response = await openai.chat.completions.create({
            model: model,
            messages: [
                { role: 'system', content: recommenderPrompt },
                { role: 'user', content: query }
            ],
            response_format: { type: 'json_object' }
        });

        const content = response.choices[0].message.content;
        if (!content) return null;

        const data = JSON.parse(content);

        return {
            query,
            vibeDescription: data.vibeDescription || '',
            recommendations: (data.recommendations || []).map((r: any) => ({
                title: r.title,
                year: r.year,
                matchReason: r.matchReason || '',
                matchScore: Math.min(Math.max(r.matchScore || 80, 70), 98)
            }))
        };
    } catch (error) {
        console.error("AI recommendation failed:", error);
        return null;
    }
};

// ─── Legacy Tag Parser (still used for quick-filter refinements) ──

const tagParserPrompt = `Analyze this movie search query and extract structured data.
Return ONLY valid JSON:
{
  "isNaturalLanguage": boolean,
  "languageCodes": string[],
  "languageNames": string[],
  "genreIds": number[],
  "keywords": string[]
}
Genre IDs: Action=28, Adventure=12, Animation=16, Comedy=35, Crime=80, Documentary=99, Drama=18, Family=10751, Fantasy=14, History=36, Horror=27, Music=10402, Mystery=9648, Romance=10749, Sci-Fi=878, Thriller=53, War=10752, Western=37.`;

export const parseSearchIntent = async (query: string): Promise<ParsedIntent | null> => {
    try {
        const response = await openai.chat.completions.create({
            model: model,
            messages: [
                { role: 'system', content: tagParserPrompt },
                { role: 'user', content: query }
            ],
            response_format: { type: 'json_object' }
        });

        const content = response.choices[0].message.content;
        if (!content) return null;

        const data = JSON.parse(content);
        const languages = (data.languageCodes || []).map((code: string, i: number) => ({
            id: code,
            name: data.languageNames?.[i] || code
        }));

        return {
            isNaturalLanguage: data.isNaturalLanguage,
            languages: languages.length > 0 ? languages : undefined,
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
};
