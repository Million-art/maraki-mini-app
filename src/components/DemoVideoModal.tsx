import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Crown } from 'lucide-react';

interface DemoVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: () => void;
}

export const DemoVideoModal: React.FC<DemoVideoModalProps> = ({
  isOpen,
  onClose,
  onUpgrade,
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-hidden"
      >
        <motion.div
          initial={{ scale: 0.95, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden relative text-gray-900 flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50/90 shrink-0">
            <div className="flex items-center gap-2">
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

          {/* CTA Button Footer */}
          <div className="p-5 bg-white space-y-4">
            {/* Context Message */}
            <div className="text-center space-y-1.5 px-2 pb-2">
              <p className="text-sm font-bold text-gray-900 leading-snug">
                የነፃ የልምምድ ጊዜዎ ተጠናቋል! ያለገደብ ለመጠቀም ወደ Premium ያሳድጉ። 🚀
              </p>
              <p className="text-xs font-medium text-gray-600">
                Your free trial has ended! Upgrade to Maraki Premium to unlock unlimited live voice sessions.
              </p>
            </div>

            <button
              onClick={onUpgrade}
              className="w-full py-4 px-5 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 hover:from-amber-600 hover:to-orange-600 text-white font-extrabold text-sm tracking-wide shadow-xl shadow-orange-500/25 active:scale-95 transition-all flex items-center justify-center gap-2 border border-orange-400/20"
            >
              <Crown className="w-4 h-4 fill-current text-white" />
              <span>Upgrade to VIP</span>
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default DemoVideoModal;
