import React, { useState, useEffect } from 'react';
import TagCloud from './TagCloud';
import { motion } from 'motion/react';
import { TMDBTag } from '../services/tmdb';

const ALL_TAGS: TMDBTag[] = [
  { id: 210024, name: 'Cyberpunk', type: 'keyword' },
  { id: 285366, name: 'Post-Apocalyptic', type: 'keyword' },
  { id: 10084, name: 'Massive Plot Twist', type: 'keyword' },
  { id: 10077, name: 'High Tension', type: 'keyword' },
  { id: 271555, name: 'Takes Place in One Room', type: 'keyword' },
  { id: 209714, name: 'Morally Grey Protagonist', type: 'keyword' },
  { id: 230941, name: 'Mind-Bending', type: 'keyword' },
  { id: 242301, name: 'Slow Burn', type: 'keyword' },
  { id: 215324, name: 'Rainy Day', type: 'keyword' },
  { id: 9715, name: 'Cozy', type: 'keyword' },
  { id: 9717, name: 'Feel-Good', type: 'keyword' },
  { id: 180547, name: 'Heartwarming', type: 'keyword' },
  { id: 10714, name: 'Serial Killer', type: 'keyword' },
  { id: 155030, name: 'Superhero', type: 'keyword' },
  { id: 4565, name: 'Dystopia', type: 'keyword' },
  { id: 10349, name: 'Survival', type: 'keyword' },
  { id: 33637, name: 'Found Family', type: 'keyword' },
  { id: 9840, name: 'Alternate Reality', type: 'keyword' },
  { id: 14604, name: 'Heist', type: 'keyword' },
  { id: 10123, name: 'Dark Comedy', type: 'keyword' },
  { id: 158718, name: 'Psychological Thriller', type: 'keyword' },
  { id: 12377, name: 'Time Travel', type: 'keyword' },
  { id: 4152, name: 'Coming of Age', type: 'keyword' },
  { id: 10840, name: 'Whodunit', type: 'keyword' }
];

interface VibeMixerProps {
  activeTags: TMDBTag[];
  setActiveTags: (tags: TMDBTag[]) => void;
}

export default function VibeMixer({ activeTags, setActiveTags }: VibeMixerProps) {
  const [displayTags, setDisplayTags] = useState<TMDBTag[]>([]);

  useEffect(() => {
    // Shuffle the tags and pick 10 on mount
    const shuffled = [...ALL_TAGS].sort(() => 0.5 - Math.random());
    setDisplayTags(shuffled.slice(0, 10));
  }, []);

  const handleTagToggle = (tagName: string) => {
    const existingTag = activeTags.find(t => t.name === tagName);
    if (existingTag) {
      setActiveTags(activeTags.filter(t => t.id !== existingTag.id));
    } else {
      const mixerTag = ALL_TAGS.find(t => t.name === tagName);
      if (mixerTag) {
        setActiveTags([...activeTags, mixerTag]);
      }
    }
    // Auto-scroll to blend section so user sees their selection + Find Blend button
    setTimeout(() => {
      const blendBtn = document.querySelector('[data-blend-section]');
      if (blendBtn) blendBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 150);
  };

  return (
    <section className="w-full max-w-4xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 flex flex-col items-center gap-3 sm:gap-4">
      <div className="text-center space-y-1.5 sm:space-y-2">
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl sm:text-5xl md:text-6xl font-semibold tracking-tighter text-white"
        >
          Define the vibe.
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-sm sm:text-base text-white/50 max-w-xl mx-auto tracking-tight"
        >
          Mix movies, moods, and themes to find your next watch.
        </motion.p>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="w-full mt-4"
      >
        <TagCloud 
          tags={displayTags.map(t => t.name)} 
          selectedTags={new Set(activeTags.map(t => t.name))}
          onToggle={handleTagToggle}
        />
      </motion.div>

      {/* Selected count indicator */}
      {activeTags.length > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-xs text-white/40 font-medium tracking-wide mt-2"
        >
          {activeTags.length} vibe{activeTags.length > 1 ? 's' : ''} selected — scroll down to blend ↓
        </motion.div>
      )}
    </section>
  );
}
