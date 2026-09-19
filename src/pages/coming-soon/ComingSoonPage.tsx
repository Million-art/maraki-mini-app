import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Bell,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';
import { cn } from '../../lib/utils';

export type ComingSoonType = 'exam' | 'ielts' | 'sat';

interface ComingSoonConfig {
  title: string;
  category: string;
  subtitle: string;
  amharicDescription: string;
  features: Array<{ title: string; desc: string }>;
}

const configs: Record<ComingSoonType, ComingSoonConfig> = {
  exam: {
    title: 'University & National Exams',
    category: 'Ethiopian Curriculum',
    subtitle: 'AI-Powered University Exit Exam, Remedial & Grade 12 Practice with Real-Time Explanations.',
    amharicDescription: 'የዩኒቨርሲቲ መውጫ ፈተናዎች (Exit Exam) እና የ12ኛ ክፍል ፈተናዎችን በAI የተደገፈ ጥያቄና መልስ በቅርቡ ይጠብቁ።',
    features: [
      {
        title: 'MoE Aligned Question Bank',
        desc: 'Curated official exam standards with detailed step-by-step rationales.',
      },
      {
        title: 'Timed Mock Simulation',
        desc: 'Experience real exam conditions with automated score breakdown.',
      },
      {
        title: 'Instant Amharic Clarifications',
        desc: 'Complex concepts simplified in clear, easy-to-grasp Amharic explanations.',
      },
    ],
  },
  ielts: {
    title: 'IELTS Academic & General',
    category: 'Scholarship & Global Prep',
    subtitle: 'Live Speaking Band Score Predictor, Academic Reading & Writing AI Evaluation.',
    amharicDescription: 'ለውጭ ሀገር ስኮላርሺፕ እና ለቪዛ የሚያስፈልግዎትን የ IELTS ፈተና በከፍተኛ ውጤት ለማለፍ የሚያስችል AI አሰልጣኝ።',
    features: [
      {
        title: 'Official Band 9 Rubric',
        desc: 'Get instant feedback on Fluency, Lexical Resource, and Pronunciation.',
      },
      {
        title: 'Interactive Speaking Examiner',
        desc: 'Simulated 3-part IELTS voice interviews with native accent models.',
      },
      {
        title: 'Mastercard & Erasmus Ready',
        desc: 'Tailored study tracks designed for Ethiopian scholarship applicants.',
      },
    ],
  },
  sat: {
    title: 'Digital SAT Mastery',
    category: 'Ivy League & Top 1% Prep',
    subtitle: 'Adaptive Question Modules & Instant Step-by-Step Math/English Breakdown.',
    amharicDescription: 'ለአሜሪካ እና አለም አቀፍ ዩኒቨርሲቲዎች ሙሉ ስኮላርሺፕ የሚያስገኝ የ Digital SAT የፈተና ዝግጅት።',
    features: [
      {
        title: 'Adaptive Digital SAT Modules',
        desc: 'Dynamic difficulty scaling matching the official Bluebook exam format.',
      },
      {
        title: '1500+ Target Score Strategy',
        desc: 'Advanced Reading comprehension shortcuts and grammar trap elimination.',
      },
      {
        title: 'Desmos & Math AI Shortcuts',
        desc: 'High-speed problem-solving techniques for complex SAT math sections.',
      },
    ],
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

  return (
    <div className="flex flex-col h-full w-full bg-white text-gray-900 font-sans select-none overflow-y-auto no-scrollbar">
      {/* Minimal Header */}
      <header className="px-6 py-4 flex items-center justify-between shrink-0 border-b border-gray-100 bg-white sticky top-0 z-20">
        <div>
          <h1 className="font-extrabold text-base text-gray-900 leading-tight">
            Maraki AI
          </h1>
          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block mt-0.5">
            EXAM PREP ACADEMY
          </span>
        </div>
      </header>

      {/* Main Centered Stage */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
        {/* Clean Typography - Just Plain Text, No Container Pill, No Flags */}
        <div className="text-center space-y-2 max-w-sm">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            {config.category}
          </p>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight leading-tight">
            {config.title}
          </h2>
          <p className="text-xs text-gray-600 font-medium leading-relaxed">
            {config.subtitle}
          </p>
          <p className="text-xs text-gray-500 font-normal leading-relaxed pt-1">
            {config.amharicDescription}
          </p>
        </div>

        {/* Feature List (Clean & Minimal) */}
        <div className="w-full max-w-sm space-y-2.5 my-6">
          {config.features.map((feat, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * idx, duration: 0.2 }}
              className="p-3.5 rounded-xl bg-gray-50/70 border border-gray-100"
            >
              <h4 className="text-xs font-bold text-gray-900">{feat.title}</h4>
              <p className="text-[11px] text-gray-500 leading-snug mt-0.5">{feat.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Clean Action Buttons */}
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
            <span>Practice Speaking in the meantime</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ComingSoonPage;
