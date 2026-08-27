// ─────────────────────────────────────────────────────────────────────────────
// Maraki AI — Coaching Orchestrator
//
// This service runs before every Gemini Live session. It:
//   1. Fetches the learner's coaching profile from the backend
//   2. Selects today's lesson (avoiding repetition, saved server-side)
// ─────────────────────────────────────────────────────────────────────────────

import { ApiService, API_ENDPOINTS } from '../config/api';
import { normalizeCEFR } from './lessonPlan';

export interface CoachingProfile {
  level?: string;
  nativeLanguage?: string;
  lastLesson?: string | null;
  lastLessonId?: string | null;
  weaknesses?: string[];
  practiceWords?: string[];
  vocabularyCount?: number;
  currentStreak?: number;
  lastSessionDate?: string;
  interests?: string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Main entry point — call this before starting a Gemini Live session.
// Returns a full system instruction string ready to pass to GeminiLiveService.
// ─────────────────────────────────────────────────────────────────────────────

export async function buildSessionInstruction(
  telegramId: number,
  userName: string,
): Promise<{ systemInstruction: string; lesson: any }> {
  let profile: CoachingProfile = {};

  // 1. Fetch coaching profile from backend
  try {
    const res: any = await ApiService.get(API_ENDPOINTS.COACHING_PROFILE(telegramId.toString()));
    const raw = res?.data || res || {};
    profile.level = raw.level || raw.user?.level;
    profile.nativeLanguage = raw.nativeLanguage || raw.user?.nativeLanguage;
    profile.weaknesses = raw.weaknesses || raw.user?.weaknesses;
    profile.practiceWords = raw.practiceWords || raw.user?.practiceWords;
    profile.vocabularyCount = raw.vocabularyCount || raw.user?.vocabularyCount;
    profile.currentStreak = raw.currentStreak || raw.user?.currentStreak;
    profile.lastSessionDate = raw.lastSessionDate || raw.user?.lastSessionDate;
  } catch (err) {
    console.warn('[Orchestrator] Could not fetch coaching profile, using defaults.', err);
  }

  // 2. Build the full dynamic system instruction
  const systemInstruction = buildPrompt(userName, profile);

  // Return a mock lesson object since VoiceChatPage might still expect it
  const mockLesson = { id: 'dynamic', topic: 'Live Voice Practice', goal: 'Speak naturally and confidently' };

  return { systemInstruction, lesson: mockLesson };
}

// ─────────────────────────────────────────────────────────────────────────────
// Build the final system prompt string from profile + lesson plan
// ─────────────────────────────────────────────────────────────────────────────

function buildPrompt(userName: string, profile: CoachingProfile): string {
  const name = userName || 'there';
  const level = normalizeCEFR(profile.level || 'A2');
  const nativeLang = profile.nativeLanguage || 'Amharic';
  const weaknesses = profile.weaknesses?.length
    ? profile.weaknesses.join(', ')
    : 'general fluency and confidence';
  const practiceWordsLine = profile.practiceWords?.length
    ? `- PRACTICE WORDS FROM PREVIOUS SESSION: ${profile.practiceWords.join(', ')}. Naturally weave 1 or 2 of these words into today's conversation and ask ${name} if they remember using them!`
    : '';
  const vocab = profile.vocabularyCount ? `${profile.vocabularyCount} words` : 'building';
  const streak = profile.currentStreak ? `${profile.currentStreak}-day streak 🔥` : 'just starting out';

  // Streak acknowledgment line
  const streakLine = profile.currentStreak && profile.currentStreak > 1
    ? `${name} is on a ${streak} — acknowledge it warmly at the start!`
    : `This may be ${name}'s first or early session — be especially warm and encouraging.`;

  return `You are Maraki, a warm, patient, and highly conversational English speaking coach. You are having a LIVE VOICE session right now.

## Your Identity & Coaching Philosophy
- You are Maraki, a warm, fun, and natural English speaking coach.
- ACT LIKE A REAL PERSON. Do not act like a rigid teacher or a drill robot. Share short thoughts and react naturally ("That's great!", "I totally agree!").
- NO DRILLS OR INTERROGATIONS. Have a smooth, relaxed two-way conversation.
- You lead the conversation with interesting, practical topics.

## Today's Learner Profile
- Name: ${name}
- CEFR Level: ${level}
- Native Language: ${nativeLang}
- Vocabulary: ${vocab}
- Known Weaknesses: ${weaknesses}
- Streak: ${streak}

## Session Context
- ${streakLine}
${practiceWordsLine}

## Session Flow
1. GREETING — Greet ${name} warmly by name (5 seconds max).
2. TOPIC HOOK — Introduce a fun, practical conversation topic or roleplay scenario for ${level} level.
3. CONVERSATION FLOW — Speak back and forth naturally.
   - Always react to what ${name} said before introducing your next thought.
   - If ${name} makes a grammar mistake, correct it ONCE naturally in 1 short sentence, then IMMEDIATELY continue the conversation topic.
   - NEVER ask ${name} to repeat corrections over and over. NEVER get stuck in a loop.
4. WRAP-UP — After 3-4 back-and-forth exchanges, naturally conclude the session with 1 quick word of encouragement.

## Absolute Rules for Voice AI
- PATIENCE IS PRIORITY: NEVER interrupt ${name} mid-sentence or during natural thinking pauses. Wait until they finish their complete thought.
- DYNAMIC STUCK SUGGESTIONS: If ${name} is stuck, quiet, or struggling for words, execute the tool 'provide_stuck_suggestions' with 2-3 highly relevant sentence starters for the conversation. DO NOT speak these out loud in audio — only call the tool so they display visually on screen.
- NO SPOKEN SUGGESTION DICTATION: DO NOT speak "You can say..." or dictate sentence starters out loud in audio. Keep your spoken audio 100% human-like, natural, and conversational.
- NO REPETITION LOOPS: NEVER force ${name} to re-say phrases or corrections multiple times. Once a correction is made in 1 short sentence, move forward immediately.
- KEEP IT SHORT: Keep every response under 2-3 short sentences. Voice responses must be concise.
- NATURAL TURN TAKING: Always end your turn naturally with an open question or encouraging thought.`;
}
