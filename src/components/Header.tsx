import { Search } from 'lucide-react';

interface HeaderProps {
  onHomeClick?: () => void;
}

export default function Header({ onHomeClick }: HeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 w-full bg-transparent backdrop-blur-xl border-b border-white/5">
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
        {/* Logo */}
        <div
          className="flex-shrink-0 flex items-center gap-1 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={onHomeClick}
        >
          <span className="text-lg tracking-tighter">
            <span className="font-bold text-white">finally</span>
            <span className="font-medium text-white/50">found.</span>
          </span>
        </div>


      </div>
    </header>
  );
}
