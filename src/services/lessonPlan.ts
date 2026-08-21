// ─────────────────────────────────────────────────────────────────────────────
// Maraki AI — Lesson Plan Rotation Table
// Each lesson has a clear topic, measurable goal, opening question, and grammar focus.
// The orchestrator selects from this table to ensure every session has a purpose.
// ─────────────────────────────────────────────────────────────────────────────

export interface LessonPlan {
  id: string;
  level: string;
  topic: string;
  goal: string;
  opener: string;
  grammarFocus: string;
  coachingPrompts: string[]; // Things Maraki says to push learner forward
}

export const LESSON_PLANS: Record<string, LessonPlan[]> = {
  A1: [
    {
      id: 'a1-introductions',
      level: 'A1',
      topic: 'Introductions',
      goal: 'Introduce yourself using 3+ complete sentences',
      opener: 'Tell me your name, where you live, and one thing you enjoy doing.',
      grammarFocus: 'Simple present: "My name is...", "I live in...", "I like..."',
      coachingPrompts: [
        'Can you use a full sentence?',
        'Try adding "My name is" at the start.',
        'Great! Now tell me what you do for fun.',
      ],
    },
    {
      id: 'a1-family',
      level: 'A1',
      topic: 'Family',
      goal: 'Describe 3 family members using adjectives',
      opener: 'Tell me about one person in your family. Who are they and what are they like?',
      grammarFocus: 'Adjectives with "be": "My mother is kind and hardworking."',
      coachingPrompts: [
        'Can you describe how they look?',
        'What does that person do every day?',
        'Excellent! Try adding one more adjective.',
      ],
    },
    {
      id: 'a1-colors-objects',
      level: 'A1',
      topic: 'Describing Objects',
      goal: 'Describe 5 objects using color, size, and shape',
      opener: 'Look around the room. Pick any object and describe it to me in English.',
      grammarFocus: 'Adjective order: size → color → noun: "a small red book"',
      coachingPrompts: [
        'What color is it?',
        'Is it big or small?',
        'Add one more detail — what is it made of?',
      ],
    },
    {
      id: 'a1-daily-routine',
      level: 'A1',
      topic: 'Daily Routine',
      goal: 'Describe a typical day using 5+ time expressions',
      opener: 'Walk me through what you do every morning from the time you wake up.',
      grammarFocus: 'Time adverbs: "first", "then", "after that", "finally"',
      coachingPrompts: [
        'What time do you wake up?',
        'Then what do you do after that?',
        'Can you use "then" to connect those two ideas?',
      ],
    },
    {
      id: 'a1-food-preferences',
      level: 'A1',
      topic: 'Food & Preferences',
      goal: 'Express food likes and dislikes with reasons',
      opener: 'What is your favorite Ethiopian food? Describe it and tell me why you love it.',
      grammarFocus: '"I love/like/hate ___ing" and "because..."',
      coachingPrompts: [
        'Can you tell me WHY you like it?',
        'Describe how it tastes — is it spicy, sweet, sour?',
        'What food do you dislike?',
      ],
    },
  ],

  A2: [
    {
      id: 'a2-past-tense',
      level: 'A2',
      topic: 'Past Tense — Weekend Stories',
      goal: 'Use past tense verbs naturally in 5+ sentences',
      opener: 'Tell me about something interesting you did last weekend. What happened?',
      grammarFocus: 'Simple past: "I went", "I saw", "I ate" (not "I go", "I see")',
      coachingPrompts: [
        'Use the past tense — instead of "I go", say "I went".',
        'Can you add more detail? Who were you with?',
        'And then what happened after that?',
      ],
    },
    {
      id: 'a2-expressing-opinions',
      level: 'A2',
      topic: 'Expressing Opinions',
      goal: 'Give 3 opinions using "I think", "I believe", "In my opinion"',
      opener: 'What do you think about learning English? Is it important for people in Ethiopia?',
      grammarFocus: '"I think that...", "I believe...", "In my opinion, ..."',
      coachingPrompts: [
        'Can you start with "I think that..."?',
        'Give me a reason for your opinion.',
        'What do other people think about that? Do you agree?',
      ],
    },
    {
      id: 'a2-comparisons',
      level: 'A2',
      topic: 'Comparisons',
      goal: 'Compare 3 things using comparative and superlative forms',
      opener: 'Compare Addis Ababa to another city you know. Which is bigger, busier, or more interesting?',
      grammarFocus: 'Comparatives: "bigger than", "more expensive than"; Superlatives: "the most..."',
      coachingPrompts: [
        'Can you use "than" to compare those two?',
        'Which one is the BEST? Use "the most" or add "-est".',
        'Give me one more comparison — what about the food?',
      ],
    },
    {
      id: 'a2-future-plans',
      level: 'A2',
      topic: 'Future Plans',
      goal: 'Discuss 3 future goals using "will" and "going to"',
      opener: 'Tell me about your plans for the next 6 months. What are you going to do?',
      grammarFocus: '"going to" for plans, "will" for predictions and decisions',
      coachingPrompts: [
        'Is this a plan or a prediction? Use "going to" for plans.',
        'When exactly are you going to do that?',
        'What will happen if you achieve that goal?',
      ],
    },
    {
      id: 'a2-ordering-food',
      level: 'A2',
      topic: 'Ordering Food & Shopping',
      goal: 'Roleplay ordering at a restaurant or shopping naturally',
      opener: 'Let\'s roleplay. I am a waiter at a restaurant. You just sat down — what would you like to order?',
      grammarFocus: 'Polite requests: "Could I have...", "I\'d like...", "Can I get..."',
      coachingPrompts: [
        'Try using "Could I have..." — it sounds more polite.',
        'Ask me what today\'s special is.',
        'How would you ask for the bill at the end?',
      ],
    },
    {
      id: 'a2-giving-directions',
      level: 'A2',
      topic: 'Giving Directions',
      goal: 'Give clear directions using prepositions of place',
      opener: 'Imagine I am a tourist. How do I get from Bole Airport to Meskel Square?',
      grammarFocus: '"Turn left/right", "go straight", "next to", "across from", "at the corner of"',
      coachingPrompts: [
        'Tell me which direction first — left or right?',
        'How far do I walk? Give me a landmark.',
        'What do I do after I reach the first turn?',
      ],
    },
  ],

  B1: [
    {
      id: 'b1-job-interviews',
      level: 'B1',
      topic: 'Job Interviews',
      goal: 'Answer 5 common interview questions fluently and professionally',
      opener: 'Let\'s practice for a job interview. Tell me about yourself and your professional background.',
      grammarFocus: 'Present perfect: "I have worked at...", "I have achieved..."',
      coachingPrompts: [
        'Use the present perfect — "I have worked" not "I worked" for ongoing experience.',
        'Can you give a specific example to support that?',
        'Why should we hire YOU over another candidate?',
      ],
    },
    {
      id: 'b1-storytelling',
      level: 'B1',
      topic: 'Storytelling',
      goal: 'Tell a clear, engaging story with beginning, middle, and end',
      opener: 'Tell me about the most memorable day of your life. Take me through it step by step.',
      grammarFocus: 'Past continuous for background: "I was walking when..." + past simple for events',
      coachingPrompts: [
        'Set the scene first — where were you and what were you doing?',
        'Use "suddenly" or "all of a sudden" for the turning point.',
        'How did the story end? How did you feel?',
      ],
    },
    {
      id: 'b1-problem-solving',
      level: 'B1',
      topic: 'Problem Solving & Advice',
      goal: 'Give and discuss advice using modal verbs confidently',
      opener: 'Your friend is stressed because they can\'t manage their time. What advice would you give them?',
      grammarFocus: 'Modals for advice: "should", "ought to", "could", "might want to"',
      coachingPrompts: [
        'Start with "I think you should..."',
        'Give a reason for your advice.',
        'What if that doesn\'t work? What else could they try?',
      ],
    },
    {
      id: 'b1-debates',
      level: 'B1',
      topic: 'Agreeing & Disagreeing',
      goal: 'Respectfully disagree and defend a point of view',
      opener: 'Some people say social media is harmful to society. Do you agree or disagree? Why?',
      grammarFocus: '"I agree that..., however", "While I understand..., I think", "On the other hand"',
      coachingPrompts: [
        'Can you disagree more politely? Try "I see your point, but..."',
        'Support your argument with one real-world example.',
        'What is the strongest argument against YOUR view?',
      ],
    },
    {
      id: 'b1-health-lifestyle',
      level: 'B1',
      topic: 'Health & Lifestyle',
      goal: 'Discuss healthy habits and make recommendations',
      opener: 'How would you describe your daily lifestyle? Is it healthy? What could you improve?',
      grammarFocus: 'Conditionals: "If I exercised more, I would feel better."',
      coachingPrompts: [
        'Use "If I..." to describe what you could change.',
        'What habit has the biggest impact on health?',
        'Can you give a recommendation for someone who is always tired?',
      ],
    },
  ],

  B2: [
    {
      id: 'b2-abstract-topics',
      level: 'B2',
      topic: 'Abstract Ideas & Philosophy',
      goal: 'Discuss a complex topic with nuance and supporting arguments',
      opener: 'Is happiness more about what you have or what you do? Make your case.',
      grammarFocus: 'Hedging language: "arguably", "it could be said that", "evidence suggests"',
      coachingPrompts: [
        'Can you support that claim with an example from real life or history?',
        'What would someone who disagrees say?',
        'Try using "It could be argued that..." to introduce a counterpoint.',
      ],
    },
    {
      id: 'b2-professional-negotiation',
      level: 'B2',
      topic: 'Professional Negotiation',
      goal: 'Negotiate, persuade, and reach a compromise in English',
      opener: 'You want a raise at work. Your manager says the budget is tight. How do you negotiate?',
      grammarFocus: 'Formal language, conditional structures: "If we were to reach...", "Would you consider..."',
      coachingPrompts: [
        'Make your opening offer using formal language.',
        'How do you respond when they say no the first time?',
        'Find a middle ground — what could you propose as a compromise?',
      ],
    },
    {
      id: 'b2-critical-analysis',
      level: 'B2',
      topic: 'Critical Analysis',
      goal: 'Analyze a situation and present a structured argument',
      opener: 'Why do you think some countries develop faster economically than others?',
      grammarFocus: 'Passive voice for objectivity: "It has been suggested that...", "Studies have shown..."',
      coachingPrompts: [
        'Use evidence or a real example to back up that point.',
        'Consider both sides — is there a counter-argument?',
        'How would you summarize your position in two sentences?',
      ],
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// Select the next lesson for a user — avoids repeating the last lesson.
// Uses day-of-year modulo for consistency within a day (same lesson all day).
// ─────────────────────────────────────────────────────────────────────────────

export function selectLesson(level: string, lastLessonId?: string | null): LessonPlan {
  const normalized = normalizeCEFR(level);
  const plans = LESSON_PLANS[normalized] || LESSON_PLANS['A2'];

  // Prefer lessons that weren't used last time
  const available = plans.filter((p) => p.id !== lastLessonId);
  const pool = available.length > 0 ? available : plans;

  // Pick a random lesson from the available pool so they get a fresh topic every session
  const randomIndex = Math.floor(Math.random() * pool.length);
  return pool[randomIndex];
}

export function normalizeCEFR(level: string): string {
  if (!level) return 'A2';
  const l = level.toUpperCase();
  if (l.includes('A1') || l === 'BEGINNER' || l === 'STARTER') return 'A1';
  if (l.includes('A2') || l === 'ELEMENTARY') return 'A2';
  if (l.includes('B1') || l === 'INTERMEDIATE' || l === 'PRE-INTERMEDIATE') return 'B1';
  if (l.includes('B2') || l === 'UPPER-INTERMEDIATE' || l === 'UPPER') return 'B2';
  if (l.includes('C1') || l.includes('C2') || l === 'ADVANCED' || l === 'PROFICIENT') return 'B2';
  return 'A2'; // safe default
}
