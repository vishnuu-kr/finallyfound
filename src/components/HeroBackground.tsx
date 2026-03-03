import { motion } from 'motion/react';
import { MediaItem } from './MediaCard';

export default function HeroBackground({ movies }: { movies: MediaItem[] }) {
  if (!movies || movies.length === 0) return null;

  // Duplicate arrays to create a seamless infinite loop
  const row1 = [...movies, ...movies];
  const row2 = [...movies.slice(10), ...movies.slice(0, 10), ...movies.slice(10), ...movies.slice(0, 10)];
  const row3 = [...movies.slice(5), ...movies.slice(0, 5), ...movies.slice(5), ...movies.slice(0, 5)];

  return (
    <div className="absolute inset-0 z-0 overflow-hidden opacity-[0.15] pointer-events-none flex flex-col gap-4 -skew-y-6 scale-125 origin-top-left translate-y-[-10%]">
      <div className="absolute inset-0 bg-gradient-to-b from-[#050505] via-transparent to-[#050505] z-10" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#050505] via-transparent to-[#050505] z-10" />
      
      <motion.div 
        animate={{ x: ["0%", "-50%"] }} 
        transition={{ repeat: Infinity, duration: 40, ease: "linear" }}
        className="flex gap-4 w-max"
      >
        {row1.map((m, i) => (
          <img key={`${m.id}-${i}`} src={m.posterUrl} className="w-32 md:w-48 h-48 md:h-72 object-cover rounded-xl" alt="" />
        ))}
      </motion.div>
      
      <motion.div 
        animate={{ x: ["-50%", "0%"] }} 
        transition={{ repeat: Infinity, duration: 35, ease: "linear" }}
        className="flex gap-4 w-max"
      >
        {row2.map((m, i) => (
          <img key={`${m.id}-${i}`} src={m.posterUrl} className="w-32 md:w-48 h-48 md:h-72 object-cover rounded-xl" alt="" />
        ))}
      </motion.div>

      <motion.div 
        animate={{ x: ["0%", "-50%"] }} 
        transition={{ repeat: Infinity, duration: 45, ease: "linear" }}
        className="flex gap-4 w-max"
      >
        {row3.map((m, i) => (
          <img key={`${m.id}-${i}`} src={m.posterUrl} className="w-32 md:w-48 h-48 md:h-72 object-cover rounded-xl" alt="" />
        ))}
      </motion.div>
    </div>
  );
}
