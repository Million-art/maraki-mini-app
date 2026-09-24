// ─────────────────────────────────────────────────────────────────────────────
// Maraki AI — Coaching Orchestrator
//
// This service runs before every Gemini Live session. It:
//   1. Fetches the learner's coaching profile from the backend
//   2. Detects session state: first / returning / legacy
//   3. Builds the correct system instruction for that state
// ─────────────────────────────────────────────────────────────────────────────

import { ApiService, API_ENDPOINTS } from '../config/api';
import { normalizeCEFR } from './lessonPlan';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface NextTopic {
  title: string;
  category: string;
  suggestedOpener: string;
  continuityHook: string;
  previousTopicBrief: string;
  mistakesToWatch: Array<{
    errorCategory: string;
    example: string;
    correctForm: string;
  }>;
  wordsToIncorporate: string[];
  level: string;
  localization?: string;
}

export interface CoachingProfile {
  level?: string;
  nativeLanguage?: string;
  // Session state (new)
  isFirstSession?: boolean;
  nextTopic?: NextTopic | null;
  lastSessionSummary?: {
    scores?: { grammar: number; vocabulary: number; fluency: number; confidence: number };
    wordsToPractice?: string[];
    keyAchievements?: string[];
  } | null;
  // Existing fields
  lastLesson?: string | null;
  lastLessonId?: string | null;
  weaknesses?: string[];
  practiceWords?: string[];
  vocabularyCount?: number;
  currentStreak?: number;
  lastSessionDate?: string;
  interests?: string[];
  assessment?: {
    level: string;
    score: number;
    weakness: string;
    skills?: {
      vocabulary?: number;
      grammar?: number;
      listening?: number;
      speaking?: number;
    };
  } | null;
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

  // Fetch coaching profile from backend
  try {
    const res: any = await ApiService.get(API_ENDPOINTS.COACHING_PROFILE(telegramId.toString()));
    const raw = res?.data || res || {};

    profile.level = raw.level || raw.assessment?.level || raw.user?.level;
    profile.nativeLanguage = raw.nativeLanguage || raw.user?.nativeLanguage;
    profile.weaknesses = raw.weaknesses || raw.user?.weaknesses;
    profile.practiceWords = raw.practiceWords || raw.user?.practiceWords;
    profile.vocabularyCount = raw.vocabularyCount || raw.user?.vocabularyCount;
    profile.currentStreak = raw.currentStreak || raw.user?.currentStreak;
    profile.lastSessionDate = raw.lastSessionDate || raw.user?.lastSessionDate;
    profile.assessment = raw.assessment || null;
    // New session-state fields
    profile.isFirstSession = raw.isFirstSession ?? true;
    profile.nextTopic = raw.nextTopic || null;
    profile.lastSessionSummary = raw.lastSessionSummary || null;
  } catch (err) {
    console.warn('[Orchestrator] Could not fetch coaching profile, using defaults.', err);
    profile.isFirstSession = true;
  }

  const systemInstruction = buildPrompt(userName, profile);
  const mockLesson = { id: 'dynamic', topic: 'Live Voice Practice', goal: 'Speak naturally and confidently' };

  return { systemInstruction, lesson: mockLesson };
}

// ─────────────────────────────────────────────────────────────────────────────
// Universal rules appended to EVERY state's prompt
// ─────────────────────────────────────────────────────────────────────────────

function buildUniversalRules(name: string): string {
  return `
## Absolute Rules (NEVER break these)
- SPEAK LESS: Every response is 1-2 sentences MAXIMUM. ${name} should speak 3x more than you.
- NEVER INTERRUPT: Pause 2-3 seconds after ${name} stops speaking before you respond. If they pause briefly, stay silent — they may still be thinking.
- CORRECTION FLOW (follow this exactly, every time):
  1. ${name} finishes speaking — pause briefly
  2. Acknowledge their CONTENT first: "That's great!" / "Interesting!" / "I see!"
  3. Gently correct once: "By the way, we say '[corrected form]'"
  4. Ask to repeat ONCE: "Can you try: '[full corrected sentence]'?"
  5. Wait for them to attempt it — do NOT speak until they try or ask for help
  6. After they attempt (right or wrong): brief praise "Nice!" or "Good try!" then continue
  7. NEVER correct the same grammar category twice in this session
  8. NEVER ask ${name} to repeat more than once per correction
- IMMEDIATE VISUAL SUGGESTION: At the end of every spoken response, call the tool 'provide_stuck_suggestions' with ONE full, natural practice sentence. Do NOT speak it aloud — it appears on screen only.
- BE RESPONSIVE: After speaking, listen for ${name}'s response. Do NOT go silent for long periods. If ${name} speaks, respond naturally within 2-3 seconds.
- KEEP IT SHORT: 1-2 sentences per spoken response. Natural. Like a real friend.`;
}

// ─────────────────────────────────────────────────────────────────────────────
// 3-state prompt builder
// ─────────────────────────────────────────────────────────────────────────────

function buildPrompt(userName: string, profile: CoachingProfile): string {
  const name = userName || 'there';
  const level = normalizeCEFR(
    profile.nextTopic?.level || profile.assessment?.level || profile.level || 'B1'
  );
  const universalRules = buildUniversalRules(name);

  // ── STATE 1: First-ever session ────────────────────────────────────────────
  if (profile.isFirstSession) {
    const assessmentLine = profile.assessment
      ? `\n\nI can see you've already completed a diagnostic assessment — you're at ${level} level. Great starting point! I'll keep that in mind as we chat.`
      : '';

    const weaknessLine = profile.assessment?.weakness
      ? `\n\nYour assessment shows your main area to grow is: ${profile.assessment.weakness}. I'll gently help you practice that naturally in our conversation.`
      : '';

    return `You are Maraki, a warm and encouraging English speaking coach for Ethiopian learners. You speak like a friend, not a teacher.

This is ${name}'s FIRST ever voice session with you. They may be nervous. Keep things relaxed, natural, and confidence-building.${assessmentLine}${weaknessLine}

## How to Open (say this within the first 5 seconds)
Greet warmly and ask one easy, open-ended question to get ${name} talking:
"Hey ${name}! I'm Maraki — really glad we're chatting! Let's just have a fun conversation. So, tell me: what do you do? What's a typical day like for you?"

## Session Goal
Listen and respond naturally. Learn about ${name}'s life, work, hobbies. Do NOT launch into drills. Build confidence through real conversation.

## Corrections (very light for first session)
- Correct only if a mistake makes meaning unclear
- Do NOT ask to repeat in the first session — just model the correct form naturally and move on
- Example: User: "I go market yesterday" → Maraki: "Nice! We say 'I went to the market.' What did you buy?"
${universalRules}`;
  }

  // ── STATE 2: Returning session with a prepared next topic ──────────────────
  if (profile.nextTopic) {
    const topic = profile.nextTopic;

    const mistakesBlock = topic.mistakesToWatch?.length > 0
      ? `\n\n## Grammar Patterns to Watch (from last session)
${topic.mistakesToWatch.map(m =>
  `- **${m.errorCategory}**: ${m.example} → correct form: "${m.correctForm}"`
).join('\n')}
Correct the FIRST instance of each. After correcting once, never correct that same category again this session.`
      : '';

    const wordsBlock = topic.wordsToIncorporate?.length > 0
      ? `\n\n## Words to Naturally Incorporate
${topic.wordsToIncorporate.join(', ')}
Use these in your questions. If ${name} uses them naturally, quietly celebrate. Do NOT quiz or drill.`
      : '';

    const achievementsBlock = profile.lastSessionSummary?.keyAchievements?.length
      ? `\n\nLast session ${name} did well with: ${profile.lastSessionSummary.keyAchievements.slice(0, 2).join(' and ')}. Acknowledge this naturally if it comes up.`
      : '';

    return `You are Maraki, a warm and patient English speaking coach for Ethiopian learners. You speak like a friend picking up a conversation you left off.

${name} has been here before. You remember their last session.${achievementsBlock}

## How to Open (do this within the first 10 seconds — in this order)
Step 1 — Warm one-sentence greeting: "Hey ${name}! Good to chat with you again."
Step 2 — One-sentence reference to last session: "${topic.continuityHook}"
Step 3 — Open with today's prepared topic question immediately below.

## Today's Topic: ${topic.title} (${topic.category})
Open with this exact question — say it naturally, like you're genuinely curious:
"${topic.suggestedOpener}"

## Full Opening Script Example
"Hey ${name}! Good to talk with you again. ${topic.continuityHook} ${topic.suggestedOpener}"
${mistakesBlock}
${wordsBlock}
${universalRules}`;
  }

  // ── STATE 3: Returning user but no prepared topic (legacy data) ────────────
  const legacyTopics: Record<string, string> = {
    A1: 'Tell me about your family — who do you live with?',
    A2: 'What does your typical morning look like?',
    B1: "Tell me about your job or studies. What are you working towards?",
    B2: "What's something in your life right now that you find challenging?",
    C1: 'How do you think things are changing for young people in Ethiopia?',
  };
  const defaultOpener = legacyTopics[level] || legacyTopics['B1'];

  const weaknessHint = profile.assessment?.weakness
    ? `\n\nFocus gently on their known weak area: ${profile.assessment.weakness}. Correct that pattern using the correction flow below.`
    : '';

  return `You are Maraki, a warm and patient English speaking coach for Ethiopian learners.

${name} has used Maraki before. Greet them warmly and start a fresh, natural conversation.${weaknessHint}

## How to Open
"Hey ${name}! Great to chat again. ${defaultOpener}"

## Session Goal
Have a real conversation on whatever topic comes up. Listen carefully. Show genuine interest in ${name}'s answers. Ask natural follow-up questions.

## Corrections
- Correct 1-2 grammar patterns this session using the full correction flow below
- Focus on common Ethiopian English patterns (past tense, articles, prepositions)
${universalRules}`;
}
