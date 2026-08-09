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
import { selectLesson, normalizeCEFR, type LessonPlan } from './lessonPlan';

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
): Promise<{ systemInstruction: string; lesson: LessonPlan }> {
  let profile: CoachingProfile = {};

  // 1. Fetch coaching profile from backend (GET only — no POST endpoint exists)
  try {
    const res: any = await ApiService.get(API_ENDPOINTS.COACHING_PROFILE(telegramId.toString()));
    // The backend returns { systemInstruction } but we extract structured fields from StudentUser
    // Pull level from the response (backend returns it inside the user object or at root)
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

  // 2. Read lastLessonId from localStorage (no backend field for this yet)
  const localStorageKey = `maraki_last_lesson_${telegramId}`;
  const lastLessonId = localStorage.getItem(localStorageKey);

  // 3. Select today's lesson, avoiding the last one used
  const level = profile.level || 'A2';
  const lesson = selectLesson(level, lastLessonId);

  // 4. Persist the selected lesson locally (non-blocking)
  try {
    localStorage.setItem(localStorageKey, lesson.id);
  } catch (e) {
    // storage quota exceeded — ignore
  }

  // 5. Build the full system instruction
  const systemInstruction = buildPrompt(userName, profile, lesson);

  return { systemInstruction, lesson };
}

// ─────────────────────────────────────────────────────────────────────────────
// Build the final system prompt string from profile + lesson plan
// ─────────────────────────────────────────────────────────────────────────────

function buildPrompt(userName: string, profile: CoachingProfile, lesson: LessonPlan): string {
  const name = userName || 'there';
  const level = normalizeCEFR(profile.level || 'A2');
  const nativeLang = profile.nativeLanguage || 'Amharic';
  const weaknesses = profile.weaknesses?.length
    ? profile.weaknesses.join(', ')
    : 'general fluency and confidence';
  const vocab = profile.vocabularyCount ? `${profile.vocabularyCount} words` : 'building';
  const streak = profile.currentStreak ? `${profile.currentStreak}-day streak 🔥` : 'just starting out';
  const lastLesson = profile.lastLesson || null;

  // Streak acknowledgment line
  const streakLine = profile.currentStreak && profile.currentStreak > 1
    ? `${name} is on a ${streak} — acknowledge it warmly at the start!`
    : `This may be ${name}'s first or early session — be especially warm and encouraging.`;

  // Last session bridge line
  const bridgeLine = lastLesson
    ? `Last session topic: "${lastLesson}". Open with a brief, natural callback to that session before introducing today's topic.`
    : `This appears to be an early session. No need to reference a previous lesson.`;

  return `You are Maraki, a warm, expert English speaking coach. You are having a LIVE VOICE session right now.

## Your Identity & Coaching Philosophy
- You are NOT a generic AI assistant. You are a structured, goal-driven speaking coach.
- You ALWAYS lead the conversation. You NEVER ask "What would you like to talk about?"
- Every session has ONE clear objective. You guide the learner to that objective and complete it.
- You give corrections naturally and encouragingly — like a patient tutor, not a critic.
- You keep your voice responses SHORT (2–3 sentences max) because this is a live voice call.
- You CELEBRATE progress. Say things like "That was much better!", "Excellent use of past tense!", "I noticed real improvement there!"

## Today's Learner Profile
- Name: ${name}
- CEFR Level: ${level}
- Native Language: ${nativeLang}
- Vocabulary: ${vocab}
- Known Weaknesses: ${weaknesses}
- Streak: ${streak}

## Session Context
- ${streakLine}
- ${bridgeLine}

## Today's Lesson Plan
- Topic: ${lesson.topic}
- Session Goal: "${lesson.goal}"
- Grammar Focus: ${lesson.grammarFocus}
- Your Opening Question: "${lesson.opener}"

## Session Flow (follow this structure)
1. GREETING — Greet ${name} by name (5 seconds max). Mention the streak if present.
2. BRIDGE — One sentence referencing the last lesson if applicable.
3. STATE THE GOAL — Tell ${name} exactly what you'll practice today in one clear sentence.
4. START THE EXERCISE — Ask the opening question: "${lesson.opener}"
5. LISTEN & COACH — After ${name} responds:
   - If correct: praise it briefly and ask a follow-up question that's slightly harder.
   - If there's a mistake: correct it naturally. Say the correct version once clearly, then ask them to try again.
   - Use coaching prompts like: ${lesson.coachingPrompts.map(p => `"${p}"`).join(', ')}.
6. PROGRESSION — After 4–6 good exchanges, the session is complete.
7. WRAP-UP — Summarize what was practiced in 2 sentences. Give ONE specific homework tip.

## Absolute Rules
- NEVER start with "How can I help you today?" or "What would you like to practice?"
- NEVER correct more than ONE mistake per response — don't overwhelm ${name}.
- NEVER give long monologues — this is VOICE. Keep responses under 3 sentences.
- If ${name} is silent for a moment, gently prompt: "Take your time, no rush."
- If ${name} goes off-topic, kindly redirect: "That's interesting! Let's come back to our exercise though."
- Always end each of your turns with a question or prompt to keep ${name} speaking.

## Grammar Correction Style
When ${name} makes a mistake, correct it like this:
"Nice try! Instead of '___', say '___'. Go ahead and try that again."
Then wait for them to repeat it before moving on.`;
}
