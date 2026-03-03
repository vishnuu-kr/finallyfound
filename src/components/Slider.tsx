import React, { useState, useRef, useEffect } from 'react';
import { motion, useMotionValue, useTransform } from 'motion/react';

interface SliderProps {
  label: string;
  minLabel: string;
  maxLabel: string;
  defaultValue?: number;
}

export default function Slider({ label, minLabel, maxLabel, defaultValue = 50 }: SliderProps) {
  const [value, setValue] = useState(defaultValue);
  const sliderRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const updateValue = (clientX: number) => {
    if (!sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setValue(percentage);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    updateValue(e.clientX);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    updateValue(e.clientX);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  return (
    <div className="w-full flex flex-col gap-3">
      <div className="flex justify-between items-center text-sm font-medium px-2">
        <span className="text-black/50">{minLabel}</span>
        <span className="text-black font-bold tracking-wide uppercase text-xs">{label}</span>
        <span className="text-black/50">{maxLabel}</span>
      </div>
      
      <div 
        ref={sliderRef}
        className="relative h-14 w-full bg-white/60 backdrop-blur-xl rounded-full border border-black/5 overflow-hidden cursor-pointer touch-none shadow-inner"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <motion.div 
          className="absolute top-0 left-0 bottom-0 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full"
          style={{ width: `${value}%` }}
          transition={{ type: 'spring', bounce: 0, duration: 0.1 }}
        />
        
        <motion.div
          animate={{ scale: isDragging ? 1.1 : 1 }}
          className="absolute top-1 bottom-1 w-12 bg-white rounded-full shadow-md flex items-center justify-center pointer-events-none border border-black/5"
          style={{ left: `calc(${value}% - 24px)` }}
        >
          <div className="w-1 h-5 bg-black/20 rounded-full" />
        </motion.div>
      </div>
    </div>
  );
}
