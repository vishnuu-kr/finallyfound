// @ts-ignore
const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const BASE_URL = 'https://api.themoviedb.org/3';

export interface TMDBTag {
  id: number | string;
  name: string;
  type: 'genre' | 'keyword' | 'person' | 'language' | 'intent';
}

export const fetchTMDB = async (endpoint: string, params: Record<string, string> = {}) => {
  if (!API_KEY || API_KEY === 'YOUR_TMDB_API_KEY') {
    throw new Error('Missing TMDB API Key. Please add a secret named exactly VITE_TMDB_API_KEY in the AI Studio Secrets panel.');
  }
  const queryParams = new URLSearchParams({
    api_key: API_KEY,
    ...params
  });
  const res = await fetch(`${BASE_URL}${endpoint}?${queryParams}`);
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.status_message || `TMDB Error: ${res.statusText}`);
  }
  return res.json();
};

export const searchMovie = async (query: string) => {
  const data = await fetchTMDB('/search/movie', { query, language: 'en-US', include_adult: 'false' });
  const sorted = data.results.sort((a: any, b: any) => (b.popularity || 0) - (a.popularity || 0));
  return sorted[0];
};

export const searchMoviesList = async (query: string) => {
  if (!query) return [];
  const data = await fetchTMDB('/search/movie', { query, language: 'en-US', include_adult: 'false' });
  const sorted = data.results.sort((a: any, b: any) => (b.popularity || 0) - (a.popularity || 0));
  return sorted.slice(0, 5).map((m: any) => ({
    id: m.id,
    title: m.title,
    releaseDate: m.release_date ? m.release_date.split('-')[0] : '',
    posterUrl: m.poster_path ? `https://image.tmdb.org/t/p/w92${m.poster_path}` : null
  }));
};

export const searchMulti = async (query: string) => {
  if (!query) return [];

  const [multiData, keywordData] = await Promise.all([
    fetchTMDB('/search/multi', { query, language: 'en-US', include_adult: 'false' }),
    fetchTMDB('/search/keyword', { query })
  ]);

  const results = [];

  // Add top keywords (max 2)
  if (keywordData.results && keywordData.results.length > 0) {
    // Sort keywords by exact match or length
    const sortedKeywords = keywordData.results.sort((a: any, b: any) => {
      if (a.name.toLowerCase() === query.toLowerCase()) return -1;
      if (b.name.toLowerCase() === query.toLowerCase()) return 1;
      return a.name.length - b.name.length;
    });

    const keywords = sortedKeywords.slice(0, 2).map((k: any) => ({
      type: 'keyword',
      id: k.id,
      name: k.name,
      title: k.name, // for UI consistency
    }));
    results.push(...keywords);
  }

  // Filter and sort multi results
  const validMulti = (multiData.results || [])
    .filter((r: any) => {
      if (r.media_type === 'movie') return r.poster_path && r.vote_count > 5; // Must have poster and some votes
      if (r.media_type === 'person') return r.profile_path && r.popularity > 1; // Must have profile and some popularity
      return false;
    })
    .sort((a: any, b: any) => {
      // Boost exact title matches
      const aExact = (a.title || a.name || '').toLowerCase() === query.toLowerCase();
      const bExact = (b.title || b.name || '').toLowerCase() === query.toLowerCase();
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;
      return (b.popularity || 0) - (a.popularity || 0);
    });

  const formattedMulti = validMulti.slice(0, 6).map((r: any) => {
    if (r.media_type === 'movie') {
      return {
        type: 'movie',
        id: r.id,
        title: r.title,
        releaseDate: r.release_date ? r.release_date.split('-')[0] : '',
        posterUrl: r.poster_path ? `https://image.tmdb.org/t/p/w92${r.poster_path}` : null
      };
    } else {
      return {
        type: 'person',
        id: r.id,
        name: r.name,
        knownFor: r.known_for_department,
        profileUrl: r.profile_path ? `https://image.tmdb.org/t/p/w92${r.profile_path}` : null
      };
    }
  });

  results.push(...formattedMulti);

  // Async AI Smart Search hook for natural language
  import('./ai').then(({ parseSearchIntent }) => {
    // we could do this but it's tricky inside a Promise.all that returns fast.
    // For now we will handle AI parsing inside handleSearch in VibeBlender instead.
  }).catch(() => { });

  return results.slice(0, 6); // Keep max 6 items in dropdown
};

export const getMovieDetails = async (id: number) => {
  const data = await fetchTMDB(`/movie/${id}`, { append_to_response: 'keywords,credits' });
  const tags: TMDBTag[] = [
    ...(data.genres || []).map((g: any) => ({ id: g.id, name: g.name, type: 'genre' as const })),
    ...(data.keywords?.keywords || []).slice(0, 5).map((k: any) => ({ id: k.id, name: k.name, type: 'keyword' as const }))
  ];

  const director = data.credits?.crew?.find((c: any) => c.job === 'Director')?.name;
  const cast = data.credits?.cast?.slice(0, 4).map((c: any) => c.name) || [];

  return {
    id: data.id,
    title: data.title,
    posterUrl: data.poster_path ? `https://image.tmdb.org/t/p/w500${data.poster_path}` : 'https://picsum.photos/seed/fallback/600/900',
    backdropUrl: data.backdrop_path ? `https://image.tmdb.org/t/p/original${data.backdrop_path}` : '',
    overview: data.overview,
    releaseDate: data.release_date ? data.release_date.split('-')[0] : '',
    director,
    cast,
    tags
  };
};

export const getMovieFullDetails = async (id: string) => {
  const data = await fetchTMDB(`/movie/${id}`, { append_to_response: 'videos,credits,reviews,similar' });
  const trailer = data.videos?.results?.find((v: any) => v.type === 'Trailer' && v.site === 'YouTube') || data.videos?.results?.[0];
  return {
    runtime: data.runtime,
    releaseYear: data.release_date ? data.release_date.split('-')[0] : '',
    trailerUrl: trailer ? `https://www.youtube.com/embed/${trailer.key}` : null,
    rating: data.vote_average,
    voteCount: data.vote_count,
    reviews: data.reviews?.results?.slice(0, 5).map((r: any) => ({
      id: r.id,
      author: r.author,
      content: r.content,
      rating: r.author_details?.rating
    })) || [],
    cast: data.credits?.cast?.slice(0, 10).map((c: any) => ({
      id: c.id,
      name: c.name,
      character: c.character,
      profileUrl: c.profile_path ? `https://image.tmdb.org/t/p/w185${c.profile_path}` : null
    })) || [],
    similar: data.similar?.results?.slice(0, 10).map((m: any) => ({
      id: m.id.toString(),
      title: m.title,
      posterUrl: m.poster_path ? `https://image.tmdb.org/t/p/w500${m.poster_path}` : 'https://picsum.photos/seed/fallback/600/900',
      backdropUrl: m.backdrop_path ? `https://image.tmdb.org/t/p/original${m.backdrop_path}` : '',
      matchPercentage: Math.round((m.vote_average / 10) * 100),
      tags: [],
      type: 'movie',
      overview: m.overview
    })) || []
  };
};

export const searchKeyword = async (query: string): Promise<TMDBTag | null> => {
  try {
    const data = await fetchTMDB('/search/keyword', { query });
    if (data.results && data.results.length > 0) {
      return { id: data.results[0].id, name: data.results[0].name, type: 'keyword' };
    }
    return null;
  } catch (e) {
    return null;
  }
};

import { Seed } from '../App';

export const discoverMovies = async (seeds: Seed[], tags: TMDBTag[]) => {
  const explicitGenres = tags.filter(t => t.type === 'genre').map(t => t.id);
  const explicitKeywords = tags.filter(t => t.type === 'keyword').map(t => t.id);
  const explicitPeople = tags.filter(t => t.type === 'person').map(t => t.id);
  const explicitLanguages = tags.filter(t => t.type === 'language').map(t => t.id);

  const targetGenres = new Set(explicitGenres);
  const targetKeywords = new Set(explicitKeywords);
  const targetPeople = new Set(explicitPeople);
  const targetLanguages = new Set(explicitLanguages);

  const seedGenreCounts = new Map<number | string, number>();
  const seedKeywordCounts = new Map<number | string, number>();

  seeds.forEach(seed => {
    seed.tags.forEach(t => {
      if (t.type === 'genre') {
        targetGenres.add(t.id);
        seedGenreCounts.set(t.id, (seedGenreCounts.get(t.id) || 0) + 1);
      }
      if (t.type === 'keyword') {
        targetKeywords.add(t.id);
        seedKeywordCounts.set(t.id, (seedKeywordCounts.get(t.id) || 0) + 1);
      }
    });
  });

  const candidateMovies = new Map<number, any>();

  // 1. Fetch recommendations and similarities for seeds
  if (seeds.length > 0) {
    const recPromises = seeds.map(s => fetchTMDB(`/movie/${s.id}/recommendations`, { language: 'en-US', page: '1' }));
    const simPromises = seeds.map(s => fetchTMDB(`/movie/${s.id}/similar`, { language: 'en-US', page: '1' }));

    const allResponses = await Promise.all([...recPromises, ...simPromises]);

    allResponses.forEach((res) => {
      (res.results || []).forEach((m: any) => {
        if (!candidateMovies.has(m.id)) {
          candidateMovies.set(m.id, { ...m, seedMatches: 1 });
        } else {
          candidateMovies.get(m.id).seedMatches++;
        }
      });
    });
  }

  // 2. Fetch discover using explicit tags OR a blend of seed DNA
  const useDiscover = tags.length > 0 || seeds.length > 1;
  if (useDiscover) {
    const params: Record<string, string> = {
      sort_by: 'popularity.desc',
      'vote_count.gte': '50',
      language: 'en-US',
      page: '1'
    };

    let g = [...explicitGenres];
    let k = [...explicitKeywords];

    // If we have multiple seeds but no explicit tags, use the top shared genres & keywords across those seeds
    if (seeds.length > 1 && explicitGenres.length === 0 && explicitKeywords.length === 0) {
      const sortedGenres = Array.from(seedGenreCounts.entries()).sort((a, b) => b[1] - a[1]);
      g = sortedGenres.slice(0, 3).map(entry => entry[0]);

      const sortedKeywords = Array.from(seedKeywordCounts.entries()).sort((a, b) => b[1] - a[1]);
      k = sortedKeywords.slice(0, 2).map(entry => entry[0]);
    }

    if (g.length) params.with_genres = g.join(',');
    if (k.length) params.with_keywords = k.join('|');
    if (explicitPeople.length) params.with_people = explicitPeople.join('|');
    if (explicitLanguages.length) params.with_original_language = explicitLanguages[0].toString();

    const hasDiscoverFilters = g.length || k.length || explicitPeople.length || explicitLanguages.length;

    if (hasDiscoverFilters) {
      const discoverData = await fetchTMDB('/discover/movie', params);
      (discoverData.results || []).forEach((m: any) => {
        if (!candidateMovies.has(m.id)) {
          candidateMovies.set(m.id, { ...m, tagMatch: true, seedMatches: 0 });
        } else {
          candidateMovies.get(m.id).tagMatch = true;
        }
      });
    }
  }

  // 3. Score candidates
  let scoredCandidates = Array.from(candidateMovies.values()).map(m => {
    let score = 0;

    score += (m.vote_average || 0) * 3;
    score += Math.min((m.popularity || 0) / 5, 20);

    let genreMatchCount = 0;
    if (m.genre_ids) {
      m.genre_ids.forEach((gid: number) => {
        if (targetGenres.has(gid)) {
          const seedFreq = seedGenreCounts.get(gid) || 1;
          score += 10 * seedFreq;
          genreMatchCount++;
        }
      });
    }

    const searchStr = ((m.title || '') + ' ' + (m.overview || '')).toLowerCase();

    tags.filter(t => t.type === 'keyword').forEach(k => {
      if (searchStr.includes(k.name.toLowerCase())) {
        score += 15;
      }
    });

    // Substantial boost for movies overlapping across multiple seed lists
    if (seeds.length > 1) {
      if (m.seedMatches > 1) {
        score += m.seedMatches * 40; // High confidence!
      } else if (m.seedMatches === 1 && m.tagMatch) {
        score += 30; // Appeared in 1 seed's similarities AND in the general discover blend
      }
    } else {
      if (m.seedMatches > 0) {
        score += m.seedMatches * 20;
      }
    }

    if (m.tagMatch) {
      score += 25;
    }

    if (targetGenres.size > 0 && genreMatchCount === 0) {
      score -= 30;
    }

    return { movie: m, score };
  });

  // Remove exact seeds from results
  const seedIds = new Set(seeds.map(s => s.id));
  scoredCandidates = scoredCandidates.filter(c => !seedIds.has(c.movie.id));

  scoredCandidates.sort((a, b) => b.score - a.score);

  const topResults = scoredCandidates.slice(0, 20).map(c => c.movie);

  if (topResults.length === 0) {
    const fallbackData = await fetchTMDB('/movie/popular', { language: 'en-US', page: '1' });
    topResults.push(...(fallbackData.results || []).slice(0, 10));
  }

  return topResults.filter((m: any) => m.poster_path && m.overview).map((m: any) => ({
    id: m.id.toString(),
    title: m.title,
    posterUrl: `https://image.tmdb.org/t/p/w500${m.poster_path}`,
    backdropUrl: m.backdrop_path ? `https://image.tmdb.org/t/p/original${m.backdrop_path}` : '',
    matchPercentage: Math.min(Math.round((m.vote_average / 10) * 100) + Math.floor(Math.random() * 15), 98),
    tags: [],
    type: 'movie',
    overview: m.overview,
    releaseDate: m.release_date ? m.release_date.split('-')[0] : ''
  }));
};

export const getTrendingMovies = async () => {
  const data = await fetchTMDB('/trending/movie/day', { language: 'en-US' });
  return (data.results || []).filter((m: any) => m.poster_path).map((m: any) => ({
    id: m.id.toString(),
    title: m.title,
    posterUrl: `https://image.tmdb.org/t/p/w500${m.poster_path}`,
    backdropUrl: m.backdrop_path ? `https://image.tmdb.org/t/p/original${m.backdrop_path}` : '',
    matchPercentage: Math.round((m.vote_average / 10) * 100) || 70,
    tags: [],
    type: 'movie',
    overview: m.overview,
    releaseDate: m.release_date ? m.release_date.split('-')[0] : ''
  }));
};
