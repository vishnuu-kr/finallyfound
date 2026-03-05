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

// ─── LRU Cache (maxsize=1000, exact-match on query string) ───────

class LRUCache<V> {
    private maxSize: number;
    private cache: Map<string, V>;

    constructor(maxSize = 1000) {
        this.maxSize = maxSize;
        this.cache = new Map();
    }

    get(key: string): V | undefined {
        if (!this.cache.has(key)) return undefined;
        // Move to end (most-recently used)
        const value = this.cache.get(key)!;
        this.cache.delete(key);
        this.cache.set(key, value);
        return value;
    }

    set(key: string, value: V): void {
        if (this.cache.has(key)) this.cache.delete(key);
        this.cache.set(key, value);
        // Evict oldest entry when over capacity
        if (this.cache.size > this.maxSize) {
            const oldest = this.cache.keys().next().value;
            if (oldest !== undefined) this.cache.delete(oldest);
        }
    }

    get size(): number { return this.cache.size; }

    clear(): void { this.cache.clear(); }
}

/** Recommendation cache – up to 1000 unique queries, auto-evicts LRU */
const recommendationCache = new LRUCache<AISearchResult>(1000);

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

const recommenderPrompt = `You are CineMaster, world-class curator of global cinema (Hollywood, Bollywood, Korean, Malayalam, Tamil, Japanese, European, etc.).
Recommend 6-8 exceptional next-watch movies after the selected one. Only highly-acclaimed films (IMDB 7.5+, awards/cult status, strong emotional impact).
Prioritize director style + cast chemistry, but never include low-rated fillers, obscure duds, or sequels unless standalone masterpieces.

Internal step-by-step thinking (do NOT output this):
1. Analyze selected movie: core themes, tone, director hallmarks, cast strengths.
2. Identify strong connections via cast/director + thematic/tone overlap.
3. Ensure global diversity: include at least 2-3 non-Hollywood if quality matches.
4. Score each: 35% cast/dir connection, 30% thematic/tone/vibe, 25% acclaim/impact, 10% freshness/uniqueness.
5. Only keep 80%+ scores. Use real years and existing acclaimed films only – no hallucinations.
6. Why phrase: concise, 1 sentence max (10-15 words), compelling reason.

Output ONLY valid JSON – nothing else. No explanations, no intro text.

{
  "recommendations": [
    {
      "title": "Movie Title",
      "year": 2020,
      "match_percent": 92,
      "why_perfect_next_watch": "One punchy reason why it's the perfect next watch."
    }
  ]
}

Few-shot example:

Input: Selected movie: Inception (2010). Focus: directed by Christopher Nolan. User vibes: none
Output:
{
  "recommendations": [
    {"title": "The Prestige", "year": 2006, "match_percent": 95, "why_perfect_next_watch": "Nolan's obsession with rivalry, deception, and intricate structure."},
    {"title": "Interstellar", "year": 2014, "match_percent": 92, "why_perfect_next_watch": "Emotional depth meets Nolan's grand sci-fi time concepts."},
    {"title": "Tenet", "year": 2020, "match_percent": 90, "why_perfect_next_watch": "High-stakes temporal mechanics and mind-bending action."},
    {"title": "Paprika", "year": 2006, "match_percent": 88, "why_perfect_next_watch": "Dream-layer invasion that inspired Inception's subconscious visuals."}
  ]
}

Now apply to:`;

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
    // ── Cache lookup (exact-match on query string) ──
    const cached = recommendationCache.get(query);
    if (cached) {
        console.log(`[CineMaster] CACHE HIT (${recommendationCache.size} entries) →`, query.substring(0, 80));
        return { ...cached, query };
    }

    try {
        console.log('[CineMaster] CACHE MISS – calling Groq:', query);
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

        const result: AISearchResult = {
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

        // ── Store in cache (errors are NOT cached) ──
        recommendationCache.set(query, result);
        console.log(`[CineMaster] Cached result (${recommendationCache.size}/1000 entries)`);

        return result;
    } catch (error) {
        // Don't cache errors – let the next call retry against Groq
        console.log('[CineMaster] EXCEPTION (not cached):', error);
        return null;
    }
};

/** Expose cache utilities for debugging / admin */
export const aiCache = {
    get size() { return recommendationCache.size; },
    clear: () => { recommendationCache.clear(); console.log('[CineMaster] Cache cleared'); },
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
