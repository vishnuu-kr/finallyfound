import { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { ChevronDown } from 'lucide-react';
import MediaCard, { MediaItem } from './MediaCard';

interface InfiniteGridProps {
  results: MediaItem[];
  onMovieClick: (movie: MediaItem) => void;
}

type SortOption = 'match' | 'date';

export default function InfiniteGrid({ results, onMovieClick }: InfiniteGridProps) {
  const [sortBy, setSortBy] = useState<SortOption>('match');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const sortedResults = useMemo(() => {
    return [...results].sort((a, b) => {
      if (sortBy === 'match') {
        // AI picks always first, then by match %
        if (a.isAIPick && !b.isAIPick) return -1;
        if (!a.isAIPick && b.isAIPick) return 1;
        return (b.matchPercentage || 0) - (a.matchPercentage || 0);
      } else {
        const yearA = a.releaseDate ? parseInt(a.releaseDate) : 0;
        const yearB = b.releaseDate ? parseInt(b.releaseDate) : 0;
        return yearB - yearA;
      }
    });
  }, [results, sortBy]);

  return (
    <section className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-6 sm:mb-8">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white drop-shadow-sm">Your Blend Results</h2>
          <span className="text-xs sm:text-sm text-white/50 font-medium">{results.length} matches found</span>
        </div>
        
        <div className="relative z-20">
          <button 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-sm font-medium text-white transition-colors"
          >
            Sort by: {sortBy === 'match' ? 'Match %' : 'Newest'}
            <ChevronDown className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </button>
          
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-40 bg-[#111] border border-white/10 rounded-xl shadow-xl overflow-hidden backdrop-blur-xl">
              <button
                onClick={() => { setSortBy('match'); setIsDropdownOpen(false); }}
                className={`w-full text-left px-4 py-3 text-sm transition-colors ${sortBy === 'match' ? 'bg-white/10 text-white font-medium' : 'text-white/70 hover:bg-white/5 hover:text-white'}`}
              >
                Match Percentage
              </button>
              <button
                onClick={() => { setSortBy('date'); setIsDropdownOpen(false); }}
                className={`w-full text-left px-4 py-3 text-sm transition-colors ${sortBy === 'date' ? 'bg-white/10 text-white font-medium' : 'text-white/70 hover:bg-white/5 hover:text-white'}`}
              >
                Release Date
              </button>
            </div>
          )}
        </div>
      </div>

      <motion.div 
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: {
              staggerChildren: 0.1,
            },
          },
        }}
        className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-6"
      >
        {sortedResults.map((item) => (
          <motion.div
            key={item.id}
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0 },
            }}
          >
            <MediaCard item={item} onClick={() => onMovieClick(item)} />
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
