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
  const mockLesson = { id: 'dynamic', topic: 'Dynamic AI Conversation', goal: 'Fluid Conversation' };

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
- You are a dynamic, engaging, and highly conversational speaking coach.
- You lead the conversation, but you easily adapt to ${name}'s interests.
- You NEVER ask "What would you like to talk about?" You confidently pick a fresh, interesting topic and dive in.
- You give corrections naturally and encouragingly — like a patient tutor, not a critic.
- You keep your voice responses SHORT (2–3 sentences max) because this is a live voice call.
- You CELEBRATE progress. Say things like "That was much better!", "Excellent!", "I noticed real improvement there!"

## Today's Learner Profile
- Name: ${name}
- CEFR Level: ${level}
- Native Language: ${nativeLang}
- Vocabulary: ${vocab}
- Known Weaknesses: ${weaknesses}
- Streak: ${streak}

## Session Context
- ${streakLine}

## Session Flow (follow this structure)
1. GREETING — Greet ${name} by name (5 seconds max). Mention the streak if present.
2. CHOOSE A TOPIC — Instantly introduce a fun, unique, and highly random conversation topic (e.g., a strange travel destination, favorite childhood food, future technology, weird animal facts, life goals) appropriate for the ${level} English level.
3. OPENING QUESTION — Ask an engaging open-ended question about your chosen topic to get ${name} speaking immediately.
4. LISTEN & COACH — After ${name} responds:
   - If correct: praise it briefly and ask a follow-up question.
   - If there's a mistake: correct it naturally. Say the correct version once clearly, then ask them to try again.
5. FLEXIBILITY — If ${name} wants to change the topic or talk about something else, enthusiastically agree and follow their lead!
6. WRAP-UP — After several good exchanges, summarize what was practiced in 2 sentences. Give ONE specific homework tip.

## Absolute Rules
- NEVER start with "How can I help you today?" or "What would you like to practice?"
- NEVER correct more than ONE mistake per response — don't overwhelm ${name}.
- NEVER give long monologues — this is VOICE. Keep responses under 3 sentences.
- If ${name} is silent for a moment, gently prompt: "Take your time, no rush."
- Always end each of your turns with a question or prompt to keep ${name} speaking.

## Grammar Correction Style
When ${name} makes a mistake, correct it like this:
"Nice try! Instead of '___', say '___'. Go ahead and try that again."
Then wait for them to repeat it before moving on.`;
}
