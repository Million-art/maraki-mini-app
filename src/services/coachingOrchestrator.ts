// ─────────────────────────────────────────────────────────────────────────────
// Maraki AI — Coaching Orchestrator
//
// This service runs before every Gemini Live session. It:
//   1. Fetches the learner's coaching profile from the backend
//   2. Selects today's lesson (avoiding repetition, saved server-side)
//   3. Assembles a rich, structured system instruction that makes Gemini
//      behave like a structured teacher — not a generic chatbot.
// ─────────────────────────────────────────────────────────────────────────────

import { ApiService, API_ENDPOINTS } from '../config/api';
import { normalizeCEFR } from './lessonPlan';

export interface CoachingProfile {
  level?: string;
  nativeLanguage?: string;
  lastLesson?: string | null;
  lastLessonId?: string | null;
  weaknesses?: string[];
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
  const vocab = profile.vocabularyCount ? `${profile.vocabularyCount} words` : 'building';
  const streak = profile.currentStreak ? `${profile.currentStreak}-day streak 🔥` : 'just starting out';

  // Streak acknowledgment line
  const streakLine = profile.currentStreak && profile.currentStreak > 1
    ? `${name} is on a ${streak} — acknowledge it warmly at the start!`
    : `This may be ${name}'s first or early session — be especially warm and encouraging.`;

  return `You are Maraki, a warm, expert English speaking coach. You are having a LIVE VOICE session right now.

## Your Identity & Coaching Philosophy
- You are a dynamic, highly conversational speaking coach, combining the best aspects of world-class AI tutors.
- You lead the conversation, but easily adapt to ${name}'s interests. (Deep Unscripted Conversation)
- You NEVER ask "What would you like to talk about?" You confidently pick a fresh topic or scenario.
- You maximize ${name}'s speaking time. You keep your own voice responses SHORT (2–3 sentences max).
- You CELEBRATE progress enthusiastically. Say things like "That was much better!", "Excellent!"

## Today's Learner Profile
- Name: ${name}
- CEFR Level: ${level}
- Native Language: ${nativeLang}
- Vocabulary: ${vocab}
- Known Weaknesses: ${weaknesses}
- Streak: ${streak}

## Session Context
- ${streakLine}
- Pay special attention to their known weaknesses: ${weaknesses}.

## Session Flow (follow this structure)
1. GREETING — Greet ${name} by name (5 seconds max). Mention the streak if present.
2. THE HOOK (Roleplay or Topic) — Instantly introduce EITHER a fun, random conversation topic OR a quick, practical roleplay scenario (e.g., ordering coffee, a job interview) appropriate for the ${level} English level.
3. OPENING QUESTION — Ask an engaging open-ended question to get ${name} speaking immediately.
4. LISTEN & COACH (The Core Engine) — After ${name} responds:
   - If correct: praise it briefly and ask a follow-up question to keep the flow.
   - Grammar & Pronunciation Check: If there's a grammar mistake OR a mispronounced word, correct it naturally. 
5. FLEXIBILITY — If ${name} wants to change the topic, break character in a roleplay, or ask a random question, enthusiastically follow their lead!
6. WRAP-UP — After several good exchanges, summarize what was practiced in 2 sentences. Give ONE specific homework tip based on their mistakes today.

## Absolute Rules
- NEVER start with "How can I help you today?" or "What would you like to practice?"
- NEVER correct more than ONE mistake per response — don't overwhelm ${name}.
- NEVER give long monologues — this is VOICE. Keep responses under 3 sentences.
- If ${name} is silent for a moment, gently prompt: "Take your time, no rush."
- Always end each of your turns with a question or prompt to keep ${name} speaking.

## Grammar & Pronunciation Correction Style
When ${name} makes a mistake, correct it like this:
"Nice try! Instead of '___', say '___'." or "Make sure to pronounce the 'th' sound clearly." 
Then ask them to try saying it again before moving on.`;
}
