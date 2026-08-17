import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, Pause, Crown, Volume2, VolumeX, Sparkles } from 'lucide-react';
import mascotGif from '../assets/connected.gif';

interface DemoVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: () => void;
  videoUrl?: string;
}

export const DemoVideoModal: React.FC<DemoVideoModalProps> = ({
  isOpen,
  onClose,
  onUpgrade,
  videoUrl = '/demo.mp4',
}) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  if (!isOpen) return null;

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
    }
    setIsMuted(!isMuted);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md overflow-hidden"
      >
        <motion.div
          initial={{ scale: 0.95, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="bg-white w-full h-full sm:h-[90vh] sm:max-w-md sm:rounded-3xl shadow-2xl overflow-hidden relative text-gray-900 flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50/90 shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-400 to-orange-500 flex items-center justify-center shadow-xs">
                <Crown className="w-4 h-4 text-white stroke-[2.5]" />
              </div>
              <h3 className="text-sm font-extrabold text-gray-900">
                Maraki Voice AI Demo
              </h3>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-400 hover:text-gray-700 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Video Player Container (Fills height dynamically) */}
          <div className="flex-1 relative w-full bg-gray-950 flex items-center justify-center overflow-hidden group">
            {videoUrl ? (
              <video
                ref={videoRef}
                src={videoUrl}
                autoPlay
                playsInline
                loop
                muted={isMuted}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="relative w-full h-full flex items-center justify-center bg-gradient-to-b from-gray-900 to-black">
                <img
                  src={mascotGif}
                  alt="Maraki Live Voice Demo"
                  className={`w-full h-full object-contain p-2 ${isPlaying ? 'animate-pulse' : 'opacity-60'}`}
                />
                <div className="absolute bottom-2 left-2 right-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 flex items-center justify-between text-[10px] text-amber-300 font-medium">
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-400 animate-spin" />
                    Real-time Gemini Voice Tutor
                  </span>
                  <span className="font-mono bg-amber-400/20 px-1.5 py-0.5 rounded text-amber-200 font-bold">
                    DEMO
                  </span>
                </div>
              </div>
            )}

            {/* Video Controls Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-4 pointer-events-none">
              <div className="flex justify-end pointer-events-auto">
                <button
                  onClick={toggleMute}
                  className="p-2 rounded-full bg-black/60 backdrop-blur-md text-white/90 hover:text-white hover:bg-black/80 transition-colors"
                >
                  {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </button>
              </div>

              <div className="flex items-center justify-start pointer-events-auto">
                <button
                  onClick={togglePlay}
                  className="p-2.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg transition-transform active:scale-95"
                >
                  {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
                </button>
              </div>
            </div>
          </div>

          {/* CTA Button Footer (Pinned to bottom) */}
          <div className="p-4 sm:p-5 bg-white border-t border-gray-100 shrink-0 pb-8 sm:pb-5">
            <button
              onClick={onUpgrade}
              className="w-full py-4 px-5 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 hover:from-amber-600 hover:to-orange-600 text-white font-extrabold text-xs sm:text-sm tracking-wide shadow-xl shadow-orange-500/25 active:scale-95 transition-all flex items-center justify-center gap-2 border border-orange-400/20"
            >
              <Crown className="w-4 h-4 fill-current text-white" />
              <span>Ready to speak English? Tap to unlock VIP</span>
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default DemoVideoModal;
