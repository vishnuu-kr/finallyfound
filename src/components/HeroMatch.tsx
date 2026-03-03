import { motion } from 'motion/react';
import { Play, ChevronDown } from 'lucide-react';
import { Seed } from '../App';
import { MediaItem } from './MediaCard';

interface HeroMatchProps {
  heroMovie: MediaItem;
  seeds: Seed[];
  onMovieClick: (movie: MediaItem) => void;
}

export default function HeroMatch({ heroMovie, seeds, onMovieClick }: HeroMatchProps) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
      className="relative w-full h-[85vh] flex flex-col justify-end p-6 md:p-16 overflow-hidden bg-[#050505]"
    >
      {/* Background Video/Image */}
      <div className="absolute inset-0 z-0">
        <img 
          src={heroMovie.backdropUrl || heroMovie.posterUrl} 
          alt="Hero Background" 
          className="w-full h-full object-cover opacity-40 mix-blend-screen"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#050505] via-[#050505]/40 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-4xl pb-12">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex flex-wrap items-center gap-3 mb-4"
        >
          <span className="px-4 py-1.5 text-xs font-bold uppercase tracking-widest rounded-full bg-white/10 backdrop-blur-xl border border-white/20 text-white">
            Top Match
          </span>
          <span className="px-4 py-1.5 text-xs font-bold uppercase tracking-widest rounded-full bg-white text-black shadow-[0_4px_14px_rgba(255,255,255,0.25)]">
            {heroMovie.matchPercentage}% Match
          </span>
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="text-6xl md:text-8xl font-extrabold tracking-tight mb-4 text-white drop-shadow-sm"
        >
          {heroMovie.title}
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="text-xl md:text-2xl text-white/70 mb-10 max-w-3xl leading-relaxed font-medium"
        >
          {heroMovie.overview ? (
            <span className="line-clamp-3">{heroMovie.overview}</span>
          ) : (
            <>Matches the vibe of <span className="font-bold text-white">{seeds.map(s => s.title).join(', ') || 'your selected tags'}</span>.</>
          )}
        </motion.p>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1 }}
          className="flex flex-wrap items-center gap-4"
        >
          <a 
            href={`https://www.amazon.com/s?k=${encodeURIComponent(heroMovie.title + ' movie')}&tag=vibeblend-20`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-8 py-4 bg-white text-black font-bold rounded-full hover:scale-105 transition-transform flex items-center gap-2 text-lg shadow-[0_8px_30px_rgba(255,255,255,0.2)]"
          >
            <Play className="w-5 h-5 fill-black" />
            Watch Now
          </a>
          <button onClick={() => onMovieClick(heroMovie)} className="px-8 py-4 bg-white/10 backdrop-blur-2xl border border-white/20 text-white font-bold rounded-full hover:bg-white/20 transition-colors flex items-center gap-2 text-lg shadow-sm">
            More Info
          </button>
        </motion.div>
      </div>
    </motion.div>
  );
}
