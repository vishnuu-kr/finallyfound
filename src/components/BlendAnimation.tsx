import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { Seed } from '../App';

interface BlendAnimationProps {
  seeds: Seed[];
  onComplete: () => void;
}

export default function BlendAnimation({ onComplete }: BlendAnimationProps) {
  const [text, setText] = useState('Analyzing parameters...');
  
  useEffect(() => {
    const t1 = setTimeout(() => setText('Searching database...'), 1000);
    const t2 = setTimeout(() => setText('Curating selection...'), 2000);
    const t3 = setTimeout(onComplete, 3000);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#050505]">
      <motion.div
        key={text}
        initial={{ opacity: 0, filter: 'blur(10px)' }}
        animate={{ opacity: 1, filter: 'blur(0px)' }}
        exit={{ opacity: 0, filter: 'blur(10px)' }}
        className="text-white/70 font-mono text-sm tracking-widest uppercase"
      >
        {text}
      </motion.div>
    </div>
  );
}
