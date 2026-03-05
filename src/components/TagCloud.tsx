import { motion, AnimatePresence } from 'motion/react';

interface TagCloudProps {
  tags: string[];
  selectedTags: Set<string>;
  onToggle: (tag: string) => void;
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
};

const item = {
  hidden: { opacity: 0, scale: 0.8, y: 10 },
  show: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 20 } }
};

export default function TagCloud({ tags, selectedTags, onToggle }: TagCloudProps) {
  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="flex flex-wrap gap-2 sm:gap-3 justify-center"
    >
      <AnimatePresence mode="popLayout">
        {tags.map((tag) => {
          const isSelected = selectedTags.has(tag);
          return (
            <motion.button
              key={tag}
              variants={item}
              layout
              initial="hidden"
              animate="show"
              exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
              onClick={() => onToggle(tag)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm transition-colors duration-200 border ${
                isSelected
                  ? 'bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.4)]'
                  : 'bg-transparent text-white/70 border-white/20 hover:border-white/50 hover:text-white hover:bg-white/5'
              }`}
            >
              {tag}
            </motion.button>
          );
        })}
      </AnimatePresence>
    </motion.div>
  );
}
