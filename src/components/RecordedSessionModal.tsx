import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, Pause, Download, Copy, Check, Sparkles, Mic } from 'lucide-react';

interface RecordedSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  audioUrl: string | null;
  durationSeconds: number;
  transcriptMessages: Array<{ sender: 'user' | 'ai'; originalText: string; timestamp: string }>;
}

export const RecordedSessionModal: React.FC<RecordedSessionModalProps> = ({
  isOpen,
  onClose,
  audioUrl,
  durationSeconds,
  transcriptMessages,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(durationSeconds || 0);
  const [copied, setCopied] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      setIsPlaying(false);
      setCurrentTime(0);
    }
  }, [isOpen]);

  const togglePlay = () => {
    if (!audioRef.current || !audioUrl) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(console.error);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      if (audioRef.current.duration && !isNaN(audioRef.current.duration)) {
        setTotalDuration(audioRef.current.duration);
      }
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const handleDownload = () => {
    if (!audioUrl) return;
    const a = document.createElement('a');
    a.href = audioUrl;
    const dateStr = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    a.download = `maraki-ai-recording-${dateStr}.wav`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleCopyTranscript = () => {
    const text = transcriptMessages
      .map((m) => `[${m.timestamp}] ${m.sender === 'ai' ? '🤖 Maraki AI' : '👤 You'}: ${m.originalText}`)
      .join('\n\n');

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = Math.floor(secs % 60);
    return `${mins}:${remainingSecs < 10 ? '0' : ''}${remainingSecs}`;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          {audioUrl && (
            <audio
              ref={audioRef}
              src={audioUrl}
              onTimeUpdate={handleTimeUpdate}
              onEnded={() => setIsPlaying(false)}
              onLoadedMetadata={() => {
                if (audioRef.current?.duration && !isNaN(audioRef.current.duration)) {
                  setTotalDuration(audioRef.current.duration);
                }
              }}
            />
          )}

          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            className="w-full max-w-md bg-[#161B22] border border-[#30363D] text-white rounded-3xl p-6 shadow-2xl relative overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-[#30363D]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#7CBD00]/20 border border-[#7CBD00]/40 flex items-center justify-center text-[#7CBD00]">
                  <Mic className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-white">Recorded AI Voice Session</h3>
                  <p className="text-xs text-slate-400">High-Fidelity 24kHz Studio Audio</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Audio Player Box */}
            <div className="my-6 bg-[#0D1117] border border-[#21262D] rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#7CBD00]">
                  <Sparkles className="w-4 h-4" />
                  <span>AI SPEECH RECORDING</span>
                </div>
                <span className="text-xs font-mono text-slate-400">
                  {formatTime(currentTime)} / {formatTime(totalDuration || durationSeconds)}
                </span>
              </div>

              {/* Progress Slider */}
              <div className="flex items-center gap-3">
                <button
                  onClick={togglePlay}
                  className="w-12 h-12 rounded-full bg-[#7CBD00] hover:bg-[#6ca400] text-black flex items-center justify-center shadow-lg transition-transform active:scale-95"
                >
                  {isPlaying ? <Pause className="w-6 h-6 fill-black" /> : <Play className="w-6 h-6 fill-black ml-0.5" />}
                </button>

                <div className="flex-1">
                  <input
                    type="range"
                    min={0}
                    max={totalDuration || durationSeconds || 100}
                    step={0.1}
                    value={currentTime}
                    onChange={handleSeek}
                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[#7CBD00]"
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <button
                onClick={handleDownload}
                disabled={!audioUrl}
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#7CBD00] hover:bg-[#6ca400] text-black font-semibold text-sm transition-all shadow-md active:scale-95 disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                <span>Save Audio (.wav)</span>
              </button>

              <button
                onClick={handleCopyTranscript}
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-sm border border-slate-700 transition-all active:scale-95"
              >
                {copied ? <Check className="w-4 h-4 text-[#7CBD00]" /> : <Copy className="w-4 h-4 text-slate-400" />}
                <span>{copied ? 'Copied!' : 'Copy Transcript'}</span>
              </button>
            </div>

            {/* Hint */}
            <p className="text-center text-[11px] text-slate-400">
              💡 You can download this recording file or copy the full dialog to share with anyone.
            </p>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default RecordedSessionModal;
