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
  iconBg: string;
  iconColor: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
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
    iconBg: 'bg-purple-50',
    iconColor: 'text-purple-600',
    badgeBg: 'bg-purple-50',
    badgeText: 'text-purple-700',
    badgeBorder: 'border-purple-200',
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
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
    badgeBg: 'bg-emerald-50',
    badgeText: 'text-emerald-700',
    badgeBorder: 'border-emerald-200',
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
    iconBg: 'bg-orange-50',
    iconColor: 'text-[#FF5500]',
    badgeBg: 'bg-orange-50',
    badgeText: 'text-orange-700',
    badgeBorder: 'border-orange-200',
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
    <div className="flex flex-col h-full w-full bg-white text-gray-900 font-sans select-none overflow-y-auto no-scrollbar">
      {/* Clean Top Header */}
      <header className="px-6 py-4 flex items-center justify-between shrink-0 border-b border-gray-100 bg-white sticky top-0 z-20">
        <div>
          <h1 className="font-extrabold text-base text-gray-900 leading-tight flex items-center gap-2">
            Maraki AI
            <span className={cn('text-[9px] font-bold px-2 py-0.5 rounded-full border', config.badgeBg, config.badgeText, config.badgeBorder)}>
              COMING SOON
            </span>
          </h1>
          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block mt-0.5">
            EXAM PREP ACADEMY
          </span>
        </div>
      </header>

      {/* Main Centered Stage */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
        {/* Animated Icon Badge */}
        <div className="relative mb-6">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            className={cn(
              'w-20 h-20 rounded-2xl flex items-center justify-center border border-gray-200',
              config.iconBg
            )}
          >
            <motion.div
              animate={{
                y: [0, -4, 0],
              }}
              transition={{
                repeat: Infinity,
                duration: 2.5,
                ease: 'easeInOut',
              }}
            >
              <IconComponent className={cn('w-10 h-10 stroke-[2.2]', config.iconColor)} />
            </motion.div>
          </motion.div>
        </div>

        {/* Title & Badge */}
        <div className="text-center space-y-2 max-w-sm">
          <span className={cn('inline-block text-[10px] font-extrabold px-2.5 py-1 rounded-full border', config.badgeBg, config.badgeText, config.badgeBorder)}>
            {config.badge}
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight leading-tight">
            {config.title}
          </h2>
          <p className="text-xs text-gray-600 font-medium leading-relaxed">
            {config.subtitle}
          </p>
          <p className="text-[11px] text-gray-600 font-medium bg-gray-50 p-2.5 rounded-xl border border-gray-100">
            🇪🇹 {config.amharicDescription}
          </p>
        </div>

        {/* Feature Cards List (Flat, Clean) */}
        <div className="w-full max-w-sm space-y-2.5 my-6">
          {config.features.map((feat, idx) => {
            const FeatIcon = feat.icon;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 * idx, duration: 0.25 }}
                className="flex items-start gap-3 p-3 rounded-xl bg-white border border-gray-200"
              >
                <div
                  className={cn(
                    'w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border border-gray-100',
                    config.iconBg,
                    config.iconColor
                  )}
                >
                  <FeatIcon className="w-4 h-4 stroke-[2.2]" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-900">{feat.title}</h4>
                  <p className="text-[11px] text-gray-500 leading-snug mt-0.5">{feat.desc}</p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Notification / Waitlist Action (Flat Solid Brand Buttons) */}
        <div className="w-full max-w-sm space-y-2.5">
          <button
            onClick={handleNotifyMe}
            disabled={isNotified}
            className={cn(
              'w-full py-3.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-[0.99]',
              isNotified
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default'
                : 'bg-[#FF5500] hover:bg-[#E64D00] text-white'
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
            className="w-full py-3 px-4 rounded-xl font-semibold text-xs text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 transition-all flex items-center justify-center gap-1.5"
          >
            <span>🎙️ Practice Speaking in the meantime</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ComingSoonPage;
