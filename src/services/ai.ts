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

// ─── Core AI Recommender (CineMaster) ────────────────────────────

const recommenderPrompt = `You are CineMaster, an expert film curator. Your expertise spans global cinema: Hollywood, Bollywood, Korean, European, Japanese, and more.

Return ONLY valid JSON. Recommend 6-8 exceptional, highly-rated movies (IMDB 7.5+). Prioritize quality, emotional impact, and global diversity. No low-rated fillers. No sequels unless truly standalone masterpieces.

Scoring: 35% cast/director connection, 30% thematic/tone match, 25% quality/acclaim, 10% freshness. Only include 80%+ scores.

Output format:
{
  "recommendations": [
    { "title": "...", "year": 2003, "match_percent": 94, "why_perfect_next_watch": "concise reason, max 15 words" }
  ]
}
Sorted descending by match_percent. Now analyze the user's input:`;

// Build a structured query for the CineMaster prompt from seeds/tags/vibes
export function buildCineMasterQuery(opts: {
    selectedMovie?: string;
    year?: number;
    castOrDirector?: string;
    vibes?: string[];
    freeText?: string;
}): string {
    const parts: string[] = [];

    if (opts.selectedMovie) {
        parts.push(`Selected movie: "${opts.selectedMovie}"${opts.year ? ` (${opts.year})` : ''}.`);
    }
    if (opts.castOrDirector) {
        parts.push(`Focus: ${opts.castOrDirector}.`);
    }
    if (opts.vibes && opts.vibes.length > 0) {
        parts.push(`User vibes: ${opts.vibes.join(', ')}.`);
    }
    if (opts.freeText) {
        parts.push(opts.freeText);
    }
    if (parts.length === 0) {
        return 'Recommend the best movies to watch right now.';
    }
    parts.push('Recommend the best next watches now.');
    return parts.join(' ');
}

export const getAIRecommendations = async (query: string): Promise<AISearchResult | null> => {
    try {
        console.log('[CineMaster] Sending query:', query);
        console.log('[CineMaster] Using model:', model);

        // Use fetch directly with timeout for better compatibility with OpenRouter free models
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 90000); // 90s timeout for free models

        const resp = await fetch((baseURL || 'https://api.openai.com/v1') + '/chat/completions', {
            method: 'POST',
            signal: controller.signal,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
                'HTTP-Referer': 'https://finallyfound.vercel.app',
                'X-Title': 'FinallyFound',
            },
            body: JSON.stringify({
                model: model,
                messages: [
                    { role: 'system', content: recommenderPrompt },
                    { role: 'user', content: query }
                ],
                response_format: { type: 'json_object' }
            })
        });

        clearTimeout(timeoutId);
        const responseData = await resp.json();
        console.log('[CineMaster] API status:', resp.status);

        if (!resp.ok) {
            console.log('[CineMaster] API error:', JSON.stringify(responseData));
            return null;
        }

        const content = responseData.choices?.[0]?.message?.content;
        console.log('[CineMaster] Raw response:', content?.substring(0, 500));
        if (!content) return null;

        const data = JSON.parse(content);

        // CineMaster returns { recommendations: [...] } with match_percent & why_perfect_next_watch
        const recs = Array.isArray(data) ? data : (data.recommendations || []);
        console.log('[CineMaster] Parsed', recs.length, 'recommendations');

        return {
            query,
            vibeDescription: '',
            recommendations: recs.map((r: any) => {
                // Extract first bullet / line from why_perfect_next_watch as a short reason
                const rawReason = r.why_perfect_next_watch || r.matchReason || '';
                const firstLine = rawReason.split('\n')[0].replace(/^[•\-\*]\s*/, '').trim();

                return {
                    title: r.title,
                    year: r.year,
                    matchReason: firstLine || '',
                    matchScore: Math.min(Math.max(r.match_percent || r.matchScore || 80, 70), 98)
                };
            })
        };
    } catch (error) {
        console.log('[CineMaster] EXCEPTION:', error);
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
