import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Provider } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import { store } from "./store";
import Layout from "./components/layout/Layout";
import VoiceChatPage from "./pages/voice/VoiceChatPage";
import mascotGif from "./assets/mascot.gif";

export default function App() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Show splash screen for 2.5 seconds
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Provider store={store}>
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="splash"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, y: -50 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black text-white font-sans"
          >
            <div className="flex flex-col items-center max-w-sm px-6 text-center space-y-6">
              {/* Mascot GIF Container */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.1 }}
                className="w-36 h-36 rounded-full border-4 border-lime/30 bg-white/5 overflow-hidden flex items-center justify-center shadow-[0_10px_30px_rgba(197,244,0,0.15)]"
              >
                <img
                  src={mascotGif}
                  alt="Maraki Mascot"
                  className="w-32 h-32 object-contain"
                />
              </motion.div>

              {/* Title */}
              <div className="space-y-2">
                <motion.h1
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                  className="text-4xl font-display text-orange uppercase tracking-wider"
                >
                  Maraki AI
                </motion.h1>
                <motion.p
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                  className="text-xs font-medium text-light/60 uppercase tracking-widest"
                >
                  Your Voice & Grammar Tutor
                </motion.p>
              </div>

              {/* Loader Line */}
              <div className="w-32 h-1 bg-white/10 rounded-full overflow-hidden relative">
                <motion.div
                  initial={{ left: "-100%" }}
                  animate={{ left: "100%" }}
                  transition={{
                    repeat: Infinity,
                    duration: 1.5,
                    ease: "easeInOut",
                  }}
                  className="absolute top-0 bottom-0 w-1/2 bg-lime rounded-full"
                />
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="app"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="h-full w-full"
          >
            <Router>
              <Routes>
                <Route path="/" element={<Layout />}>
                  <Route index element={<VoiceChatPage />} />
                  <Route path="*" element={<VoiceChatPage />} />
                </Route>
              </Routes>
            </Router>
          </motion.div>
        )}
      </AnimatePresence>
    </Provider>
  );
}
