import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { Seed } from '../App';

interface BlendAnimationProps {
  seeds: Seed[];
  onComplete: () => void;
  waitForResults?: boolean;
}

export default function BlendAnimation({ onComplete, waitForResults }: BlendAnimationProps) {
  const [text, setText] = useState('Analyzing parameters...');
  const [minTimePassed, setMinTimePassed] = useState(false);
  
  useEffect(() => {
    const t1 = setTimeout(() => setText('Searching database...'), 1500);
    const t2 = setTimeout(() => setText('Curating selection...'), 4000);
    const t3 = setTimeout(() => setText('Finding hidden gems...'), 8000);
    const t4 = setTimeout(() => setText('Almost there...'), 15000);
    const t5 = setTimeout(() => setMinTimePassed(true), 3000);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); clearTimeout(t5); };
  }, []);

  // Transition when BOTH min time has passed AND results are ready
  useEffect(() => {
    if (minTimePassed && waitForResults) {
      onComplete();
    } else if (minTimePassed && !waitForResults) {
      setText('Almost there...');
    }
  }, [minTimePassed, waitForResults, onComplete]);

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
