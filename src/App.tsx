/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Header from './components/Header';
import VibeBlender from './components/VibeBlender';
import VibeMixer from './components/VibeMixer';
import BlendAnimation from './components/BlendAnimation';
import InfiniteGrid from './components/InfiniteGrid';
import MovieModal from './components/MovieModal';
import HeroBackground from './components/HeroBackground';
import TrendingSection from './components/TrendingSection';
import { TMDBTag, discoverMovies, getTrendingMovies } from './services/tmdb';
import { MediaItem } from './components/MediaCard';

export interface Seed {
  id?: number;
  title: string;
  posterUrl: string;
  backdropUrl?: string;
  overview?: string;
  releaseDate?: string;
  director?: string;
  cast?: string[];
  tags: TMDBTag[];
}

export type AppState = 'input' | 'blending' | 'results';

export default function App() {
  const [appState, setAppState] = useState<AppState>('input');
  const [seeds, setSeeds] = useState<Seed[]>([]);
  const [activeTags, setActiveTags] = useState<TMDBTag[]>([]);
  const [results, setResults] = useState<MediaItem[]>([]);
  const [selectedMovie, setSelectedMovie] = useState<MediaItem | null>(null);
  const [trendingMovies, setTrendingMovies] = useState<MediaItem[]>([]);

  useEffect(() => {
    getTrendingMovies().then(setTrendingMovies).catch(console.error);

    // Handle shared movie links
    const params = new URLSearchParams(window.location.search);
    const movieId = params.get('movie');
    if (movieId) {
      import('./services/tmdb').then(({ getMovieDetails }) => {
        getMovieDetails(Number(movieId)).then(data => {
          setSelectedMovie({
            id: data.id.toString(),
            title: data.title,
            posterUrl: data.posterUrl,
            backdropUrl: data.backdropUrl,
            matchPercentage: 100,
            type: 'movie',
            overview: data.overview,
            releaseDate: data.releaseDate
          });
          // Clean up URL without reloading
          window.history.replaceState({}, document.title, window.location.pathname);
        }).catch(console.error);
      });
    }
  }, []);

  const [blendReady, setBlendReady] = useState(false);

  const handleBlend = async () => {
    setBlendReady(false);
    setAppState('blending');
    try {
      // Build a rich context string from seeds + tags for the AI
      const seedDescriptions = seeds.map(s => {
        let desc = s.title;
        if (s.releaseDate) desc += ` (${s.releaseDate})`;
        if (s.director) desc += ` directed by ${s.director}`;
        return desc;
      });

      // Build a structured CineMaster query from seeds + tags
      const { getAIRecommendations, buildCineMasterQuery } = await import('./services/ai');

      const firstSeed = seeds[0];
      const personTags = activeTags.filter(t => t.type === 'person').map(t => t.name);
      const vibeTags = activeTags.filter(t => t.type !== 'person').map(t => {
        if (t.type === 'genre') return `${t.name} genre`;
        if (t.type === 'language') return `${t.name} language movies`;
        return t.name;
      });

      // Add extra seed info as vibes
      if (seedDescriptions.length > 1) {
        vibeTags.push(`similar to ${seedDescriptions.slice(1).join(', ')}`);
      }

      const blendQuery = buildCineMasterQuery({
        selectedMovie: firstSeed?.title,
        year: firstSeed?.releaseDate ? parseInt(firstSeed.releaseDate) : undefined,
        castOrDirector: personTags.length > 0
          ? `featuring ${personTags.join(', ')}`
          : firstSeed?.director
            ? `directed by ${firstSeed.director}`
            : undefined,
        vibes: vibeTags.length > 0 ? vibeTags : undefined,
      });

      // Ask the AI for recommendations
      const aiResult = await getAIRecommendations(blendQuery);

      if (aiResult && aiResult.recommendations.length > 0) {
        // Look up each AI recommendation on TMDB for posters
        const { searchMoviesList } = await import('./services/tmdb');
        const tmdbPromises = aiResult.recommendations.map(async (rec) => {
          try {
            const results = await searchMoviesList(rec.title);
            if (results.length > 0) {
              const best = results[0];
              return {
                id: best.id.toString(),
                title: best.title || rec.title,
                posterUrl: (best.posterUrl || '').replace('/w92', '/w500') || 'https://picsum.photos/seed/fallback/600/900',
                matchPercentage: rec.matchScore,
                matchReason: rec.matchReason,
                type: 'movie' as const,
                releaseDate: best.releaseDate || (rec.year?.toString() ?? ''),
                overview: '',
              } as MediaItem;
            }
            return null;
          } catch {
            return null;
          }
        });

        const mediaItems = (await Promise.all(tmdbPromises)).filter((m): m is MediaItem => m !== null);
        const seedIds = seeds.map(s => s.id?.toString());
        const filtered = mediaItems.filter(m => !seedIds.includes(m.id));

        if (filtered.length > 0) {
          setResults(filtered);
          setBlendReady(true);
          return;
        }
      }

      // Fallback: use old TMDB discover if AI fails
      const movies = await discoverMovies(seeds, activeTags);
      const seedIds = seeds.map(s => s.id?.toString());
      const filtered = movies.filter(m => !seedIds.includes(m.id));
      setResults(filtered);
      setBlendReady(true);
    } catch (err: any) {
      console.error(err);
      setBlendReady(true);
      // Don't alert on timeout, just show whatever we have
    }
  };

  const handleAISearch = async (aiResults: MediaItem[]) => {
    setResults(aiResults);
    setBlendReady(true);
    setAppState('blending');
  };

  const handleHomeClick = () => {
    setAppState('input');
    setSeeds([]);
    setActiveTags([]);
    setSelectedMovie(null);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-[#EDEDED] font-sans selection:bg-white/20 overflow-x-hidden relative">
      <Header onHomeClick={handleHomeClick} />

      <main className="relative z-10 flex flex-col min-h-screen pt-20 pb-24">
        <AnimatePresence mode="wait">
          {appState === 'input' && (
            <motion.div key="input" exit={{ opacity: 0 }} className="relative w-full">
              <div className="absolute top-0 left-0 right-0 h-[400px] overflow-hidden -z-10 pointer-events-none">
                <HeroBackground movies={trendingMovies} />
                <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#050505] to-transparent z-20" />
              </div>
              <VibeMixer activeTags={activeTags} setActiveTags={setActiveTags} />
              <VibeBlender
                seeds={seeds} setSeeds={setSeeds}
                activeTags={activeTags} setActiveTags={setActiveTags}
                onBlend={handleBlend}
                onAISearch={handleAISearch}
              />
              <TrendingSection movies={trendingMovies} onMovieClick={setSelectedMovie} />
            </motion.div>
          )}

          {appState === 'blending' && (
            <div key="blending">
              <BlendAnimation
                seeds={seeds}
                onComplete={() => {
                  if (blendReady) {
                    setAppState('results');
                  }
                }}
                waitForResults={blendReady}
              />
            </div>
          )}

          {appState === 'results' && results.length > 0 && (
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="w-full flex flex-col"
            >
              <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
                <button
                  onClick={() => setAppState('input')}
                  className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-full text-sm font-medium transition-colors flex items-center gap-2 w-fit"
                >
                  ← Refine Blend
                </button>
              </div>
              <InfiniteGrid results={results} onMovieClick={setSelectedMovie} />
            </motion.div>
          )}

          {appState === 'results' && results.length === 0 && (
            <motion.div
              key="no-results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="w-full flex-1 flex flex-col items-center justify-center min-h-[60vh] gap-6"
            >
              <h2 className="text-4xl font-bold text-white tracking-tight">No matches found.</h2>
              <p className="text-white/50 text-lg">Try blending different vibes or movies.</p>
              <button
                onClick={() => setAppState('input')}
                className="px-8 py-4 bg-white text-black font-bold rounded-full hover:scale-105 transition-transform shadow-[0_8px_30px_rgba(255,255,255,0.12)] text-lg"
              >
                Go Back
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <AnimatePresence>
        {selectedMovie && (
          <MovieModal
            movie={selectedMovie}
            onClose={() => setSelectedMovie(null)}
            onMovieSelect={setSelectedMovie}
            onPersonSelect={(person) => {
              setSelectedMovie(null);
              setSeeds([]);
              setActiveTags([{ id: person.id, name: person.name, type: 'person' }]);
              setAppState('input');
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
