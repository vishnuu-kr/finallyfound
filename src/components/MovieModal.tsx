import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Clock, Calendar, Star, Play, ArrowUp, Share2, AlertCircle, Twitter, Facebook } from 'lucide-react';
import { MediaItem } from './MediaCard';
import { getMovieFullDetails } from '../services/tmdb';

interface MovieModalProps {
  movie: MediaItem;
  onClose: () => void;
  onMovieSelect?: (movie: MediaItem) => void;
  onPersonSelect?: (person: any) => void;
}

export default function MovieModal({ movie, onClose, onMovieSelect, onPersonSelect }: MovieModalProps) {
  const [details, setDetails] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setDetails(null); // Reset details when movie changes
    setIsLoading(true);
    setError(null);

    getMovieFullDetails(movie.id)
      .then(data => {
        setDetails(data);
        setIsLoading(false);
      })
      .catch(err => {
        console.error("Failed to load movie details:", err);
        setError("We couldn't load the full details for this movie right now. Please try again later.");
        setIsLoading(false);
      });
  }, [movie.id]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (e.currentTarget.scrollTop > 300) {
      setShowScrollTop(true);
    } else {
      setShowScrollTop(false);
    }
  };

  const scrollToTop = () => {
    scrollContainerRef.current?.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const handleShare = async () => {
    const movieUrl = `${window.location.origin}/?movie=${movie.id}`;
    const shareData = {
      title: movie.title,
      text: `I just found "${movie.title}" on finallyfound. Check it out! 🍿`,
      url: movieUrl,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
        alert('Link copied to clipboard!');
      }
    } catch (err) {
      console.error('Error sharing:', err);
    }
  };

  const handleTwitterShare = () => {
    const movieUrl = `${window.location.origin}/?movie=${movie.id}`;
    const text = `I just found "${movie.title}" on finallyfound. Check it out! 🍿`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(movieUrl)}`, '_blank');
  };

  const handleFacebookShare = () => {
    const movieUrl = `${window.location.origin}/?movie=${movie.id}`;
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(movieUrl)}`, '_blank');
  };

  const formatRuntime = (minutes: number) => {
    if (!minutes) return null;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h > 0) {
      return `${h}h ${m}m`;
    }
    return `${m}m`;
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-8">
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/20 backdrop-blur-2xl"
      />
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="relative w-full max-w-5xl bg-[#0A0A0A] border border-white/10 sm:rounded-[40px] overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.5)] flex flex-col max-h-[100vh] sm:max-h-[90vh]"
      >
        <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-50 flex items-center gap-2 sm:gap-3">
          <button onClick={handleFacebookShare} className="p-2 sm:p-3 bg-black/60 hover:bg-black/80 backdrop-blur-xl border border-white/10 rounded-full text-white transition-colors shadow-sm" title="Share on Facebook">
            <Facebook className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <button onClick={handleTwitterShare} className="p-2 sm:p-3 bg-black/60 hover:bg-black/80 backdrop-blur-xl border border-white/10 rounded-full text-white transition-colors shadow-sm" title="Share on Twitter">
            <Twitter className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <button onClick={handleShare} className="p-2 sm:p-3 bg-black/60 hover:bg-black/80 backdrop-blur-xl border border-white/10 rounded-full text-white transition-colors shadow-sm" title="Share">
            <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <button onClick={onClose} className="p-2 sm:p-3 bg-black/60 hover:bg-black/80 backdrop-blur-xl border border-white/10 rounded-full text-white transition-colors shadow-sm" title="Close">
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="overflow-y-auto w-full flex-1 pb-12 hide-scrollbar"
        >
          {/* Hero Image / Trailer */}
          <div className="relative w-full aspect-[16/9] bg-[#111]">
            {details?.trailerUrl && !error ? (
              <iframe
                src={`${details.trailerUrl}`}
                className="w-full h-full object-cover opacity-90"
                allowFullScreen
              />
            ) : (
              <img src={movie.backdropUrl || movie.posterUrl} alt={movie.title} className="w-full h-full object-cover opacity-80" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/20 to-transparent pointer-events-none" />
          </div>

          {/* Info */}
          <div className="px-6 sm:px-12 -mt-16 sm:-mt-24 relative z-10">
            <div className="flex flex-col sm:flex-row sm:items-end gap-4 sm:gap-8 mb-6 sm:mb-10">
              <img src={movie.posterUrl} alt="Poster" className="w-28 sm:w-48 rounded-[16px] sm:rounded-[24px] shadow-xl border-4 border-[#0A0A0A] mx-auto sm:mx-0" />
              <div className="flex-1 text-center sm:text-left">
                <h2 className="text-2xl sm:text-6xl font-extrabold text-white tracking-tight mb-3 sm:mb-4 drop-shadow-sm">{movie.title}</h2>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 sm:gap-4 text-xs sm:text-base font-medium text-white/70 mb-4 sm:mb-6">
                  <span className="flex items-center gap-1 px-3 py-1.5 bg-white/10 backdrop-blur-md rounded-full border border-white/10 text-white shadow-sm"><Star className="w-4 h-4 text-white" /> {movie.matchPercentage}% Match</span>
                  {(details?.releaseYear || movie.releaseDate) && <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4 sm:w-5 sm:h-5" /> {details?.releaseYear || movie.releaseDate}</span>}
                  {details?.runtime > 0 && <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 sm:w-5 sm:h-5" /> {formatRuntime(details.runtime)}</span>}
                </div>
                <a
                  href={`https://www.amazon.com/s?k=${encodeURIComponent(movie.title + ' movie')}&i=movies-tv&tag=${(import.meta as any).env.VITE_AMAZON_AFFILIATE_TAG || 'vibeblend-20'}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-3 w-full sm:w-auto px-8 sm:px-10 py-3 sm:py-4 bg-white text-black font-bold rounded-full hover:scale-105 transition-transform shadow-[0_8px_30px_rgba(255,255,255,0.2)] text-base sm:text-lg"
                >
                  <Play className="w-5 h-5 fill-black" />
                  Watch Now
                </a>
              </div>
            </div>

            <p className="text-base sm:text-xl text-white/80 leading-relaxed mb-8 sm:mb-12 font-medium">
              {movie.overview}
            </p>

            {/* Error State */}
            {error && (
              <div className="mb-12 p-6 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-4">
                <AlertCircle className="w-6 h-6 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-lg font-bold text-red-400 mb-1">Oops!</h3>
                  <p className="text-white/70">{error}</p>
                </div>
              </div>
            )}

            {/* Loading State */}
            {isLoading && !error && (
              <div className="flex flex-col justify-center items-center py-20 gap-4">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white"></div>
                <p className="text-white/50 font-medium animate-pulse">Loading movie details...</p>
              </div>
            )}

            {/* Similar Movies */}
            {details?.similar && details.similar.length > 0 && (
              <div className="mb-12">
                <h3 className="text-2xl font-bold text-white mb-6">Similar Movies</h3>
                <div className="flex gap-4 sm:gap-6 overflow-x-auto pb-6 snap-x hide-scrollbar">
                  {details.similar.map((similarMovie: any) => (
                    <div
                      key={similarMovie.id}
                      className="flex-shrink-0 w-36 sm:w-48 snap-start group cursor-pointer"
                      onClick={() => onMovieSelect && onMovieSelect(similarMovie)}
                    >
                      <div className="w-full aspect-[2/3] rounded-[16px] sm:rounded-[24px] overflow-hidden bg-[#111] mb-3 shadow-sm border border-white/10 relative">
                        <img src={similarMovie.posterUrl} alt={similarMovie.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300" />
                      </div>
                      <p className="text-sm sm:text-base font-bold text-white truncate">{similarMovie.title}</p>
                      <div className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-white/50 mt-1">
                        <Star className="w-3 h-3 sm:w-4 sm:h-4 text-white" /> {similarMovie.matchPercentage}% Match
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reviews */}
            {details?.reviews && details.reviews.length > 0 && (
              <div className="mb-12">
                <h3 className="text-2xl font-bold text-white mb-6">User Reviews</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {details.reviews.map((review: any) => (
                    <div key={review.id} className="bg-[#111] p-6 rounded-[24px] border border-white/10 shadow-sm">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-white/10 text-white rounded-full flex items-center justify-center font-bold text-sm border border-white/20">
                          {review.author.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-bold text-white text-base">{review.author}</span>
                        {review.rating && (
                          <span className="ml-auto flex items-center gap-1 text-sm font-bold text-white bg-white/10 px-2 py-1 rounded-md">
                            <Star className="w-4 h-4 fill-white" /> {review.rating}/10
                          </span>
                        )}
                      </div>
                      <p className="text-base text-white/70 line-clamp-4 leading-relaxed">"{review.content}"</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Cast */}
            {details?.cast && details.cast.length > 0 && (
              <div className="mb-12">
                <h3 className="text-2xl font-bold text-white mb-6">Top Cast</h3>
                <div className="flex gap-4 sm:gap-6 overflow-x-auto pb-6 snap-x hide-scrollbar">
                  {details.cast.map((actor: any) => (
                    <div
                      key={actor.id}
                      className="flex-shrink-0 w-24 sm:w-28 snap-start cursor-pointer group"
                      onClick={() => onPersonSelect && onPersonSelect(actor)}
                    >
                      <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden bg-[#111] mb-3 shadow-sm border border-white/10 group-hover:border-white/40 transition-colors">
                        {actor.profileUrl ? (
                          <img src={actor.profileUrl} alt={actor.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-white/30 text-xs text-center p-2">No Image</div>
                        )}
                      </div>
                      <p className="text-sm sm:text-base font-bold text-white truncate text-center group-hover:text-white/80 transition-colors">{actor.name}</p>
                      <p className="text-xs sm:text-sm text-white/50 truncate text-center">{actor.character}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Scroll to Top Button */}
        <AnimatePresence>
          {showScrollTop && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={scrollToTop}
              className="absolute bottom-6 right-6 z-50 p-4 bg-white text-black hover:bg-white/90 rounded-full shadow-[0_8px_30px_rgba(255,255,255,0.2)] transition-colors"
            >
              <ArrowUp className="w-6 h-6" />
            </motion.button>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
