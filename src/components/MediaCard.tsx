import { motion } from 'motion/react';
import { Play } from 'lucide-react';

export interface MediaItem {
  id: string;
  title: string;
  posterUrl: string;
  backdropUrl?: string;
  matchPercentage: number;
  tags?: string[];
  type: 'movie';
  overview?: string;
  releaseDate?: string;
}

interface MediaCardProps {
  item: MediaItem;
  onClick?: () => void;
}

export default function MediaCard({ item, onClick }: MediaCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.04, y: -5 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="relative w-full flex flex-col gap-3 cursor-pointer group"
    >
      {/* Poster Image Container */}
      <div className="relative w-full aspect-[2/3] rounded-[24px] overflow-hidden bg-white/5 shadow-[0_8px_30px_rgba(0,0,0,0.5)] border border-white/10">
        <img
          src={item.posterUrl}
          alt={item.title}
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-500" />
        
        {/* Match Badge */}
        <div className="absolute top-3 right-3 px-3 py-1.5 text-xs font-bold rounded-full bg-black/60 backdrop-blur-xl border border-white/10 text-white shadow-md">
          {item.matchPercentage}% Match
        </div>
      </div>

      {/* Text Content */}
      <div className="flex flex-col px-2 mt-1">
        <h3 className="text-lg font-bold leading-tight line-clamp-1 text-white/90 group-hover:text-white transition-colors">{item.title}</h3>
        {item.tags && item.tags.length > 0 && (
          <p className="text-sm text-white/50 line-clamp-1 mt-0.5 font-medium">
            {item.tags.slice(0, 2).join(' • ')}
          </p>
        )}
      </div>
    </motion.div>
  );
}
