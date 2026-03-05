import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, X, Plus, Sparkles, Dna, Film, Trash2, User, Hash, Zap, Shuffle } from 'lucide-react';
import { Seed } from '../App';
import { searchMovie, getMovieDetails, searchKeyword, TMDBTag, searchMulti, searchMoviesList } from '../services/tmdb';
import { getAIRecommendations, buildCineMasterQuery } from '../services/ai';
import { MediaItem } from './MediaCard';

interface VibeBlenderProps {
  seeds: Seed[];
  setSeeds: (seeds: Seed[]) => void;
  activeTags: TMDBTag[];
  setActiveTags: (tags: TMDBTag[]) => void;
  onBlend: () => void;
  onAISearch: (results: MediaItem[]) => void;
}

const MOODS = [
  { id: 35, name: 'Happy', type: 'genre' },
  { id: 18, name: 'Sad', type: 'genre' },
  { id: 53, name: 'Thrilling', type: 'genre' },
  { id: 10749, name: 'Romantic', type: 'genre' },
];

const GENRES = [
  { id: 28, name: 'Action', type: 'genre' },
  { id: 12, name: 'Adventure', type: 'genre' },
  { id: 16, name: 'Animation', type: 'genre' },
  { id: 35, name: 'Comedy', type: 'genre' },
  { id: 80, name: 'Crime', type: 'genre' },
  { id: 99, name: 'Documentary', type: 'genre' },
  { id: 18, name: 'Drama', type: 'genre' },
  { id: 10751, name: 'Family', type: 'genre' },
  { id: 14, name: 'Fantasy', type: 'genre' },
  { id: 36, name: 'History', type: 'genre' },
  { id: 27, name: 'Horror', type: 'genre' },
  { id: 10402, name: 'Music', type: 'genre' },
  { id: 9648, name: 'Mystery', type: 'genre' },
  { id: 10749, name: 'Romance', type: 'genre' },
  { id: 878, name: 'Science Fiction', type: 'genre' },
  { id: 10770, name: 'TV Movie', type: 'genre' },
  { id: 53, name: 'Thriller', type: 'genre' },
  { id: 10752, name: 'War', type: 'genre' },
  { id: 37, name: 'Western', type: 'genre' }
];

export default function VibeBlender({
  seeds, setSeeds, activeTags, setActiveTags, onBlend, onAISearch
}: VibeBlenderProps) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [isAddingTag, setIsAddingTag] = useState(false);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (query.trim().length > 2) {
        try {
          const results = await searchMulti(query);
          setSuggestions(results);
        } catch (err) {
          console.error('Error fetching suggestions:', err);
          setSuggestions([]);
        }
      } else {
        setSuggestions([]);
      }
    };
    const timeoutId = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timeoutId);
  }, [query]);

  const selectItem = async (item: any) => {
    try {
      setIsExtracting(true);
      setQuery('');
      setSuggestions([]);

      if (item.type === 'movie') {
        const details = await getMovieDetails(item.id);

        const newSeed: Seed = {
          id: details.id,
          title: details.title,
          posterUrl: details.posterUrl,
          overview: details.overview,
          releaseDate: details.releaseDate,
          director: details.director,
          cast: details.cast,
          tags: details.tags
        };

        setSeeds([...seeds, newSeed]);
      } else if (item.type === 'person') {
        if (!activeTags.find(t => t.id === item.id)) {
          setActiveTags([...activeTags, { id: item.id, name: item.name, type: 'person' }]);
        }
      }
    } catch (err: any) {
      console.error(err);
      alert(`Error: ${err.message}`);
    } finally {
      setIsExtracting(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsExtracting(true);

    // ─── AI-FIRST SEARCH: CineMaster is the brain ───
    try {
      const cineMasterQuery = buildCineMasterQuery({ freeText: query });
      const aiResult = await getAIRecommendations(cineMasterQuery);
      if (aiResult && aiResult.recommendations.length > 0) {
        // Look up each AI recommendation on TMDB to get posters & metadata
        const tmdbPromises = aiResult.recommendations.map(async (rec) => {
          try {
            const searchQuery = rec.year ? `${rec.title}` : rec.title;
            const results = await searchMoviesList(searchQuery);
            if (results.length > 0) {
              const bestMatch = results[0];
              return {
                id: bestMatch.id.toString(),
                title: bestMatch.title || rec.title,
                posterUrl: (bestMatch.posterUrl || '').replace('/w92', '/w500') || 'https://picsum.photos/seed/fallback/600/900',
                matchPercentage: rec.matchScore,
                matchReason: rec.matchReason,
                type: 'movie' as const,
                releaseDate: bestMatch.releaseDate || (rec.year?.toString() ?? ''),
                overview: '',
              } as MediaItem;
            }
            // Fallback: no TMDB match, skip
            return null;
          } catch {
            return null;
          }
        });

        const mediaItems = (await Promise.all(tmdbPromises)).filter((m): m is MediaItem => m !== null);

        if (mediaItems.length > 0) {
          setQuery('');
          setSuggestions([]);
          setIsExtracting(false);
          onAISearch(mediaItems);
          return;
        }
      }
    } catch (err) {
      console.error('AI Search Error:', err);
      // Fall through to manual search below
    }

    if (suggestions.length > 0) {
      selectItem(suggestions[0]);
    } else {
      try {
        const movie = await searchMovie(query);
        if (!movie) {
          alert(`Could not find anything named "${query}"`);
          setIsExtracting(false);
          return;
        }
        selectItem({ ...movie, type: 'movie' });
      } catch (err: any) {
        console.error(err);
        alert(`Error: ${err.message}`);
        setIsExtracting(false);
      }
    }
  };

  const removeSeed = (indexToRemove: number) => {
    const newSeeds = seeds.filter((_, index) => index !== indexToRemove);
    setSeeds(newSeeds);
  };

  const clearAll = () => {
    setSeeds([]);
    setActiveTags([]);
  };

  const removeTag = (tagId: number | string) => {
    setActiveTags(activeTags.filter(t => t.id !== tagId));
  };

  const addTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTag.trim()) return;

    const tag = await searchKeyword(newTag.trim());
    if (tag && !activeTags.find(t => t.id === tag.id)) {
      setActiveTags([...activeTags, tag]);
    } else if (!tag) {
      setActiveTags([...activeTags, { id: Date.now(), name: newTag.trim(), type: 'keyword' }]);
    }
    setNewTag('');
    setIsAddingTag(false);
  };

  const toggleQuickFilter = (filter: any) => {
    if (activeTags.find(t => t.id === filter.id)) {
      removeTag(filter.id);
    } else {
      setActiveTags([...activeTags, { id: filter.id, name: filter.name, type: filter.type as any }]);
    }
  };

  const isShared = (tagId: number | string) => {
    if (seeds.length < 2) return false;
    let count = 0;
    seeds.forEach(seed => {
      if (seed.tags.some(t => t.id === tagId)) count++;
    });
    return count > 1;
  };

  return (
    <div className="flex flex-col w-full max-w-3xl mx-auto px-4 sm:px-6 py-4 sm:py-6 gap-6 sm:gap-8">

      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        {/* Search Bar */}
        <form
          onSubmit={handleSearch}
          className="w-full relative group z-50"
        >
          <div className="relative flex items-center bg-[#111]/80 backdrop-blur-md border border-white/10 rounded-full px-4 py-2 transition-all duration-300 focus-within:border-white/40 focus-within:shadow-[0_0_30px_rgba(255,255,255,0.1)] focus-within:bg-[#1a1a1a]">
            <div className="pl-2 pr-2 text-white/50 group-focus-within:text-white transition-colors">
              <Search className="w-5 h-5" />
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search films, actors, or directors..."
              className="flex-1 bg-transparent border-none outline-none text-sm sm:text-base text-white placeholder:text-white/40 py-2 sm:py-3"
              autoFocus
            />
            {query.trim() && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="p-2 mr-1 text-white/40 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <button
              type="submit"
              disabled={!query.trim() || isExtracting}
              className="px-4 sm:px-6 py-2 bg-white text-black font-medium rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/90 transition-all flex items-center gap-2 text-sm ml-1 sm:ml-2"
            >
              {isExtracting ? (
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
                  <Dna className="w-4 h-4" />
                </motion.div>
              ) : 'Add'}
            </button>
          </div>

          {/* Autocomplete Dropdown */}
          <AnimatePresence>
            {suggestions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="absolute top-full left-0 right-0 mt-2 bg-[#111] rounded-2xl border border-white/10 overflow-hidden z-50 max-h-96 overflow-y-auto"
              >
                {suggestions.map((item) => (
                  <button
                    key={`${item.type}-${item.id}`}
                    type="button"
                    onClick={() => selectItem(item)}
                    className="w-full flex items-center gap-4 p-3 hover:bg-white/5 transition-colors text-left border-b border-white/5 last:border-0"
                  >
                    <div className="w-12 h-16 shrink-0 flex items-center justify-center">
                      {item.profileUrl || item.posterUrl ? (
                        <img
                          src={item.profileUrl || item.posterUrl}
                          alt={item.name || item.title}
                          className={`object-cover ${item.type === 'person' ? 'w-12 h-12 rounded-full border border-white/10' : 'w-11 h-16 rounded-md border border-white/10'}`}
                        />
                      ) : (
                        <div className={`bg-white/5 flex items-center justify-center border border-white/5 ${item.type === 'person' ? 'w-12 h-12 rounded-full' : item.type === 'keyword' ? 'w-11 h-11 rounded-full' : 'w-11 h-16 rounded-md'}`}>
                          {item.type === 'person' ? <User className="w-5 h-5 text-white/40" /> : item.type === 'keyword' ? <Hash className="w-5 h-5 text-white/40" /> : <Film className="w-5 h-5 text-white/40" />}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h4 className="font-medium text-white text-base truncate">{item.title || item.name}</h4>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-sm font-bold uppercase tracking-wider shrink-0 ${item.type === 'movie' ? 'bg-blue-500/20 text-blue-400' : item.type === 'keyword' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-purple-500/20 text-purple-400'}`}>
                          {item.type === 'movie' ? 'Movie' : item.type === 'keyword' ? 'Keyword' : item.knownFor || 'Person'}
                        </span>
                      </div>
                      <p className="text-sm text-white/50 capitalize truncate">
                        {item.type === 'movie' ? item.releaseDate : item.type === 'keyword' ? 'Theme / Concept' : 'Cast & Crew'}
                      </p>
                    </div>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </form>
      </motion.div>

      {/* Feeling Indecisive? — Random Vibe Mixer */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full mt-2 sm:mt-4 px-2">
        <button
          onClick={() => {
            // Pick 3-5 random moods/genres from the combined pool
            const pool = [...MOODS, ...GENRES];
            const count = 3 + Math.floor(Math.random() * 3); // 3, 4, or 5
            const shuffled = pool.sort(() => Math.random() - 0.5);
            const picked = shuffled.slice(0, count);
            // Deduplicate with existing tags, then set
            const newTags = picked.filter(p => !activeTags.some(t => t.id === p.id));
            setActiveTags([
              ...activeTags.filter(t => !picked.some(p => p.id === t.id)),
              ...newTags.map(p => ({ id: p.id, name: p.name, type: p.type as any }))
            ]);
          }}
          className="w-full flex items-center justify-center gap-2.5 px-6 py-3 bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-orange-500/20 hover:from-purple-500/30 hover:via-pink-500/30 hover:to-orange-500/30 border border-white/10 hover:border-white/25 rounded-2xl transition-all duration-300 group"
        >
          <Shuffle className="w-4 h-4 text-purple-300 group-hover:text-white transition-colors" />
          <span className="text-sm font-semibold text-white/70 group-hover:text-white transition-colors">Feeling Indecisive? Random Mix</span>
          <span className="text-xs text-white/40 hidden sm:inline">— picks 3–5 vibes for you</span>
        </button>
      </motion.div>

      {/* Quick Filters - iOS Horizontal Scroll Style */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-3 w-full mt-2 sm:mt-4">
        <h2 className="text-sm font-semibold tracking-tight text-white/50 px-2 uppercase">Quick Add</h2>
        <div className="flex overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-2 gap-2 sm:gap-3 snap-x hide-scrollbar">
          {MOODS.map(mood => {
            const isActive = activeTags.some(t => t.id === mood.id);
            return (
              <button
                key={mood.id}
                onClick={() => toggleQuickFilter(mood)}
                className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-full border transition-all snap-start ${isActive ? 'bg-white border-white text-black' : 'bg-transparent border-white/20 text-white/70 hover:border-white/50 hover:text-white'
                  }`}
              >
                <span className="text-sm">{mood.name}</span>
              </button>
            );
          })}
          {GENRES.map(genre => {
            const isActive = activeTags.some(t => t.id === genre.id);
            return (
              <button
                key={genre.id}
                onClick={() => toggleQuickFilter(genre)}
                className={`flex-shrink-0 px-4 py-2 text-sm rounded-full border transition-all snap-start ${isActive ? 'bg-white border-white text-black' : 'bg-transparent border-white/20 text-white/70 hover:border-white/50 hover:text-white'
                  }`}
              >
                {genre.name}
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* Seeds Container - iOS Grouped List */}
      {seeds.length > 0 && (
        <div className="w-full flex flex-col gap-3 mt-2 sm:mt-4">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-sm font-semibold tracking-tight text-white/50 uppercase">Ingredients</h2>
            <button
              onClick={clearAll}
              className="text-xs font-medium text-white/40 hover:text-white transition-colors px-3 py-1 rounded-full hover:bg-white/5"
            >
              Clear All
            </button>
          </div>

          <div className="bg-[#111]/50 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/5">
            <AnimatePresence>
              {seeds.map((seed, index) => (
                <motion.div
                  key={`${seed.id}-${index}`}
                  layout
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="relative flex items-center p-3 border-b border-white/5 last:border-0 group"
                >
                  <div className="w-12 h-16 sm:w-14 sm:h-20 shrink-0 rounded-md overflow-hidden bg-white/5 mr-3 sm:mr-4">
                    <img src={seed.posterUrl} alt={seed.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>

                  <div className="flex flex-col flex-1 min-w-0">
                    <h4 className="text-base sm:text-lg font-medium text-white truncate">
                      {seed.title} {seed.releaseDate && <span className="text-white/50 text-xs sm:text-sm font-normal ml-1">({seed.releaseDate})</span>}
                    </h4>
                    {seed.director && <p className="text-xs sm:text-sm text-white/60 truncate mt-0.5 sm:mt-1">Dir. {seed.director}</p>}
                    {seed.cast && seed.cast.length > 0 && (
                      <p className="text-[10px] sm:text-xs text-white/40 truncate mt-0.5 sm:mt-1">
                        Starring: {seed.cast.slice(0, 3).join(', ')}
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() => removeSeed(index)}
                    className="ml-2 sm:ml-4 p-2 text-white/30 hover:text-white hover:bg-white/10 rounded-full transition-colors shrink-0"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Vibe Pool */}
      {(seeds.length > 0 || activeTags.length > 0) && (
        <motion.div layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-3 sm:gap-4 w-full mt-4 sm:mt-6">
          <h2 className="text-sm font-semibold tracking-tight text-white/50 px-2 uppercase">Blend DNA</h2>

          <div className="flex flex-wrap gap-2 px-2">
            <AnimatePresence>
              {activeTags.map(tag => {
                const shared = isShared(tag.id);
                return (
                  <motion.div
                    key={tag.id}
                    layout
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all duration-300 ${shared
                      ? 'bg-white border-white text-black shadow-[0_0_15px_rgba(255,255,255,0.4)]'
                      : tag.type === 'person'
                        ? 'bg-purple-500/10 border-purple-500/30 text-purple-300 hover:border-purple-500/50 hover:bg-purple-500/20'
                        : tag.type === 'keyword'
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:border-emerald-500/50 hover:bg-emerald-500/20'
                          : 'bg-transparent border-white/20 text-white/80 hover:border-white/40 hover:text-white'
                      }`}
                  >
                    {tag.type === 'person' && <User className="w-3 h-3" />}
                    <span className="text-sm">{tag.name}</span>
                    <button onClick={() => removeTag(tag.id)} className="p-0.5 hover:bg-white/20 rounded-full transition-colors ml-1">
                      <X className="w-3 h-3" />
                    </button>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {isAddingTag ? (
              <form onSubmit={addTag} className="flex items-center">
                <input
                  autoFocus
                  value={newTag}
                  onChange={e => setNewTag(e.target.value)}
                  onBlur={() => { if (!newTag) setIsAddingTag(false) }}
                  className="px-3 py-1.5 bg-transparent border border-white/50 rounded-full text-sm outline-none w-32 text-white placeholder:text-white/40 focus:border-white focus:shadow-[0_0_10px_rgba(255,255,255,0.2)] transition-all"
                  placeholder="Add tag..."
                />
              </form>
            ) : (
              <button
                onClick={() => setIsAddingTag(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-transparent hover:bg-white/10 rounded-full border border-dashed border-white/30 transition-colors text-white/60 hover:text-white"
              >
                <Plus className="w-3 h-3" />
                <span className="text-sm">Add tag</span>
              </button>
            )}
          </div>
        </motion.div>
      )}

      {/* Sticky Bottom Bar for Blend Button */}
      <AnimatePresence>
        {(seeds.length > 0 || activeTags.length > 0) && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-0 left-0 right-0 p-4 sm:p-6 bg-gradient-to-t from-[#050505] via-[#050505]/90 to-transparent z-40 flex justify-center pointer-events-none"
          >
            <button
              onClick={onBlend}
              className="pointer-events-auto w-full max-w-md py-3 sm:py-4 bg-white rounded-full font-bold text-black text-base sm:text-lg tracking-tight hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-[0_0_40px_rgba(255,255,255,0.3)]"
            >
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
              Find Blend
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
