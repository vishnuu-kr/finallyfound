import { MediaItem } from './MediaCard';
import { Star } from 'lucide-react';

interface TrendingSectionProps {
  movies: MediaItem[];
  onMovieClick: (movie: MediaItem) => void;
}

export default function TrendingSection({ movies, onMovieClick }: TrendingSectionProps) {
  if (!movies || movies.length === 0) return null;

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 border-t border-white/5">
      <h2 className="text-xl font-medium tracking-tight text-white mb-6">Trending</h2>
      <div className="flex gap-4 overflow-x-auto pb-6 snap-x hide-scrollbar">
        {movies.map((movie, idx) => (
          <div 
            key={`${movie.id}-${idx}`} 
            className="flex-shrink-0 w-36 sm:w-48 snap-start group cursor-pointer"
            onClick={() => onMovieClick(movie)}
          >
            <div className="w-full aspect-[2/3] rounded-[16px] sm:rounded-[24px] overflow-hidden bg-[#111] mb-3 shadow-sm border border-white/10 relative">
              <img src={movie.posterUrl} alt={movie.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300" />
            </div>
            <p className="text-sm sm:text-base font-bold text-white truncate">{movie.title}</p>
            <div className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-white/50 mt-1">
              <Star className="w-3 h-3 sm:w-4 sm:h-4 text-white" /> {movie.matchPercentage}% Match
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
