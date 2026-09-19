import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  GraduationCap,
  Globe2,
  Sparkles,
  Bell,
  CheckCircle2,
  ChevronRight,
  BookOpen,
  Trophy,
  Zap,
  Target
} from 'lucide-react';
import { cn } from '../../lib/utils';

export type ComingSoonType = 'exam' | 'ielts' | 'sat';

interface ComingSoonConfig {
  title: string;
  badge: string;
  subtitle: string;
  amharicDescription: string;
  features: Array<{ icon: React.ElementType; title: string; desc: string }>;
  icon: React.ElementType;
  gradient: string;
  glowColor: string;
  badgeColor: string;
  accentColor: string;
}

const configs: Record<ComingSoonType, ComingSoonConfig> = {
  exam: {
    title: 'University & National Exams',
    badge: '🇪🇹 Ethiopian Curriculum',
    subtitle: 'AI-Powered University Exit Exam, Remedial & Grade 12 Practice with Real-Time Explanations.',
    amharicDescription: 'የዩኒቨርሲቲ መውጫ ፈተናዎች (Exit Exam) እና የ12ኛ ክፍል ፈተናዎችን በAI የተደገፈ ጥያቄና መልስ በቅርቡ ይጠብቁ!',
    features: [
      {
        icon: BookOpen,
        title: 'MoE Aligned Question Bank',
        desc: 'Curated official exam standards with detailed step-by-step rationales.',
      },
      {
        icon: Target,
        title: 'Timed Mock Simulation',
        desc: 'Experience real exam conditions with automated score breakdown.',
      },
      {
        icon: Zap,
        title: 'Instant Amharic Clarifications',
        desc: 'Complex concepts simplified in clear, easy-to-grasp Amharic explanations.',
      },
    ],
    icon: GraduationCap,
    gradient: 'from-purple-500 via-indigo-500 to-blue-600',
    glowColor: 'bg-purple-500/20',
    badgeColor: 'bg-purple-100 text-purple-700 border-purple-200',
    accentColor: '#7C3AED',
  },
  ielts: {
    title: 'IELTS Academic & General Prep',
    badge: '🌍 Global Scholarship & Visa',
    subtitle: 'Live Speaking Band Score Predictor, Academic Reading & Writing AI Evaluation.',
    amharicDescription: 'ለውጭ ሀገር ስኮላርሺፕ እና ለቪዛ የሚያስፈልግዎትን የ IELTS ፈተና በከፍተኛ ውጤት ለማለፍ የሚያስችል AI አሰልጣኝ።',
    features: [
      {
        icon: Trophy,
        title: 'Official Band 9 Rubric',
        desc: 'Get instant feedback on Fluency, Lexical Resource, and Pronunciation.',
      },
      {
        icon: Globe2,
        title: 'Interactive Speaking Examiner',
        desc: 'Simulated 3-part IELTS voice interviews with native accent models.',
      },
      {
        icon: Target,
        title: 'Mastercard & Erasmus Ready',
        desc: 'Tailored study tracks designed for Ethiopian scholarship applicants.',
      },
    ],
    icon: Globe2,
    gradient: 'from-emerald-500 via-teal-500 to-cyan-600',
    glowColor: 'bg-emerald-500/20',
    badgeColor: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    accentColor: '#059669',
  },
  sat: {
    title: 'Digital SAT AI Mastery',
    badge: '🎓 Ivy League & Top 1% Prep',
    subtitle: 'Adaptive Question Modules & Instant Step-by-Step Math/English Breakdown.',
    amharicDescription: 'ለአሜሪካ እና አለም አቀፍ ዩኒቨርሲቲዎች ሙሉ ስኮላርሺፕ የሚያስገኝ የ Digital SAT የፈተና ዝግጅት።',
    features: [
      {
        icon: Sparkles,
        title: 'Adaptive Digital SAT Modules',
        desc: 'Dynamic difficulty scaling matching the official Bluebook exam format.',
      },
      {
        icon: Target,
        title: '1500+ Target Score Strategy',
        desc: 'Advanced Reading comprehension shortcuts and grammar trap elimination.',
      },
      {
        icon: Zap,
        title: 'Desmos & Math AI Shortcuts',
        desc: 'High-speed problem-solving techniques for complex SAT math sections.',
      },
    ],
    icon: Sparkles,
    gradient: 'from-amber-500 via-orange-500 to-rose-600',
    glowColor: 'bg-orange-500/20',
    badgeColor: 'bg-orange-100 text-orange-700 border-orange-200',
    accentColor: '#EA580C',
  },
};

export const ComingSoonPage: React.FC<{ type: ComingSoonType }> = ({ type }) => {
  const navigate = useNavigate();
  const config = configs[type] || configs.exam;
  const storageKey = `maraki_notify_${type}`;

  const [isNotified, setIsNotified] = useState<boolean>(() => {
    return localStorage.getItem(storageKey) === 'true';
  });

  useEffect(() => {
    setIsNotified(localStorage.getItem(storageKey) === 'true');
  }, [storageKey]);

  const handleNotifyMe = () => {
    localStorage.setItem(storageKey, 'true');
    setIsNotified(true);
  };

  const IconComponent = config.icon;

  return (
    <div className="flex flex-col h-full w-full bg-white text-gray-900 font-sans select-none overflow-y-auto no-scrollbar relative">
      {/* Top Header */}
      <header className="px-6 py-4 flex items-center justify-between shrink-0 border-b border-gray-50 bg-white/80 backdrop-blur-md sticky top-0 z-20">
        <div>
          <h1 className="font-extrabold text-base text-gray-900 leading-tight flex items-center gap-2">
            Maraki AI
            <span className={cn('text-[9px] font-bold px-2 py-0.5 rounded-full border', config.badgeColor)}>
              COMING SOON
            </span>
          </h1>
          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block mt-0.5">
            EXAM PREP ACADEMY
          </span>
        </div>
      </header>

      {/* Main Centered Stage */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 relative">
        {/* Background Glowing Orb */}
        <motion.div
          animate={{
            scale: [1, 1.25, 1],
            opacity: [0.35, 0.7, 0.35],
          }}
          transition={{
            repeat: Infinity,
            duration: 4,
            ease: 'easeInOut',
          }}
          className={cn('absolute w-72 h-72 rounded-full blur-[48px] pointer-events-none', config.glowColor)}
        />

        {/* Floating Animated Mascot / Icon Badge */}
        <div className="relative mb-6">
          <motion.div
            animate={{
              rotate: [0, 360],
            }}
            transition={{
              repeat: Infinity,
              duration: 20,
              ease: 'linear',
            }}
            className={cn(
              'absolute -inset-3 rounded-full bg-gradient-to-r opacity-50 blur-md',
              config.gradient
            )}
          />

          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            className={cn(
              'relative w-24 h-24 rounded-full bg-gradient-to-br flex items-center justify-center text-white shadow-xl',
              config.gradient
            )}
          >
            <motion.div
              animate={{
                y: [0, -6, 0],
              }}
              transition={{
                repeat: Infinity,
                duration: 2.5,
                ease: 'easeInOut',
              }}
            >
              <IconComponent className="w-12 h-12 stroke-[2.2] drop-shadow-md" />
            </motion.div>
          </motion.div>
        </div>

        {/* Title & Badge */}
        <div className="text-center space-y-2 max-w-sm">
          <span className={cn('inline-block text-[10px] font-extrabold px-2.5 py-1 rounded-full border shadow-2xs', config.badgeColor)}>
            {config.badge}
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight leading-tight">
            {config.title}
          </h2>
          <p className="text-xs text-gray-600 font-medium leading-relaxed">
            {config.subtitle}
          </p>
          <p className="text-[11px] text-gray-500 font-semibold bg-gray-50 p-2.5 rounded-xl border border-gray-100">
            🇪🇹 {config.amharicDescription}
          </p>
        </div>

        {/* Feature Cards List */}
        <div className="w-full max-w-sm space-y-2.5 my-6">
          {config.features.map((feat, idx) => {
            const FeatIcon = feat.icon;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * idx, duration: 0.3 }}
                className="flex items-start gap-3 p-3 rounded-2xl bg-white border border-gray-100 shadow-2xs hover:border-gray-200 transition-all"
              >
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-2xs"
                  style={{ backgroundColor: `${config.accentColor}15`, color: config.accentColor }}
                >
                  <FeatIcon className="w-4 h-4 stroke-[2.5]" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-900">{feat.title}</h4>
                  <p className="text-[10px] text-gray-500 leading-snug mt-0.5">{feat.desc}</p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Notification / Waitlist Action */}
        <div className="w-full max-w-sm space-y-3">
          <button
            onClick={handleNotifyMe}
            disabled={isNotified}
            className={cn(
              'w-full py-3.5 px-4 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.98]',
              isNotified
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default'
                : 'bg-gradient-to-r text-white hover:opacity-95 shadow-orange-500/20',
              !isNotified && config.gradient
            )}
          >
            {isNotified ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>You're on the priority waitlist!</span>
              </>
            ) : (
              <>
                <Bell className="w-4 h-4" />
                <span>Notify Me When Launched</span>
              </>
            )}
          </button>

          <button
            onClick={() => navigate('/')}
            className="w-full py-3 px-4 rounded-2xl font-semibold text-xs text-gray-600 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 transition-all flex items-center justify-center gap-1.5"
          >
            <span>🎙️ Practice Live Voice Coach in the meantime</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ComingSoonPage;
