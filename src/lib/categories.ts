export type Category = "general" | "emotions" | "qa" | "illness";

export interface Phrase {
  id: string;
  text: string;
  category: Category;
  videoUrl?: string;
  emoji?: string;
  english?: string;
  modelClass?: string; // Maps to model prediction class
  modelClasses?: string[]; // For phrases with multiple variants
  variantModelMapping?: {
    adult?: string | string[];
    friend?: string | string[];
  }; // Maps variant to specific model classes
}

export const categories: { id: Category; label: string; icon: string; color: string }[] = [
  { id: "general", label: "บทสนทนาทั่วไป", icon: "Hand", color: "bg-primary" },
  { id: "emotions", label: "อารมณ์", icon: "Heart", color: "bg-accent" },
  { id: "qa", label: "คำถาม-คำตอบ", icon: "HelpCircle", color: "bg-secondary" },
  { id: "illness", label: "อาการเจ็บป่วย", icon: "Thermometer", color: "bg-destructive" },
];

export const phrases: Phrase[] = [
  // General (บทสนทนาทั่วไป)
  {
    id: "g1",
    text: "สวัสดี (ผู้ใหญ่ | เพื่อน)",
    category: "general",
    emoji: "👋",
    english: "Hello",
    modelClasses: ["hello_adult", "hello_friend"],
    variantModelMapping: {
      adult: "hello_adult",
      friend: "hello_friend"
    }
  },
  {
    id: "g2",
    text: "ลาก่อน",
    category: "general",
    emoji: "👋",
    english: "Goodbye",
    modelClasses: ["bye_go", "bye_me"]
  },
  {
    id: "g3",
    text: "กินข้าวหรือยัง?",
    category: "general",
    emoji: "🍚",
    english: "Have you eaten?",
    modelClasses: ["rice", "eat", "yet"]
  },
  {
    id: "g4",
    text: "กินแล้ว | ยังไม่ได้กิน",
    category: "general",
    emoji: "✅",
    english: "Already ate | Not yet",
    modelClasses: ["already", "yet", "eat"]
  },
  {
    id: "g5",
    text: "สบายดีไหม?",
    category: "general",
    emoji: "😊",
    english: "How are you?",
    modelClass: "how_are_you"
  },
  {
    id: "g6",
    text: "สบายดี | ไม่สบายใจ",
    category: "general",
    emoji: "👍",
    english: "I'm fine | Unhappy",
    modelClasses: ["fine", "unhappy"],
    variantModelMapping: {
      adult: "fine",
      friend: "unhappy"
    }
  },

  // Emotions (อารมณ์)
  {
    id: "e1",
    text: "โกรธ",
    category: "emotions",
    emoji: "😡",
    english: "Angry",
    modelClass: "angry"
  },
  {
    id: "e2",
    text: "กลัว",
    category: "emotions",
    emoji: "😨",
    english: "Scared",
    modelClass: "fear"
  },
  {
    id: "e3",
    text: "รัก",
    category: "emotions",
    emoji: "❤️",
    english: "Love",
    modelClass: "love"
  },

  {
    id: "e5",
    text: "เหนื่อย",
    category: "emotions",
    emoji: "😩",
    english: "Tired",
    modelClass: "tired"
  },

  // Q&A (คำถาม-คำตอบ)
  {
    id: "q1",
    text: "อะไร?",
    category: "qa",
    emoji: "❓",
    english: "What?",
    modelClass: "what"
  },
  {
    id: "q2",
    text: "ทำไม?",
    category: "qa",
    emoji: "🤔",
    english: "Why?",
    modelClass: "why"
  },
  {
    id: "q3",
    text: "เท่าไหร่?",
    category: "qa",
    emoji: "💰",
    english: "How much?",
    modelClass: "how_much"
  },
  {
    id: "q4",
    text: "ใช่",
    category: "qa",
    emoji: "✅",
    english: "Yes",
    modelClass: "yes"
  },
  {
    id: "q5",
    text: "ไม่",
    category: "qa",
    emoji: "❌",
    english: "No",
    modelClass: "no"
  },

  // Illness (อาการเจ็บป่วย)
  {
    id: "i1",
    text: "เป็นหวัด",
    category: "illness",
    emoji: "🤧",
    english: "Cold",
    modelClass: "cold"
  },
  {
    id: "i2",
    text: "เจ็บคอ",
    category: "illness",
    emoji: "😷",
    english: "Sore throat",
    modelClass: "sore_throat"
  },
  {
    id: "i3",
    text: "ปวดท้อง",
    category: "illness",
    emoji: "🤰",
    english: "Stomachache",
    modelClass: "stomachache"
  },
  {
    id: "i4",
    text: "ปวดหัว",
    category: "illness",
    emoji: "🤕",
    english: "Headache",
    modelClass: "headache"
  },
  {
    id: "i5",
    text: "เป็นไข้",
    category: "illness",
    emoji: "🌡️",
    english: "Fever",
    modelClass: "fever"
  },
];

export const getPhrasesByCategory = (category: Category) =>
  phrases.filter((p) => p.category === category);

/**
 * Resolves the primary model class name for a phrase, used for logging.
 * Respects variantModelMapping > modelClass > first of modelClasses.
 */
export function resolveTargetClass(phrase: Phrase, variant?: "adult" | "friend"): string {
  if (phrase.variantModelMapping && variant) {
    const mapping = phrase.variantModelMapping[variant];
    if (typeof mapping === 'string') return mapping;
    if (Array.isArray(mapping) && mapping.length > 0) return mapping[0];
  }
  if (phrase.modelClass) return phrase.modelClass;
  if (phrase.modelClasses && phrase.modelClasses.length > 0) return phrase.modelClasses[0];
  return '';
}

// Helper function to find phrase by model class prediction
export const getPhraseByModelClass = (modelClass: string): Phrase | undefined => {
  return phrases.find(
    (p) =>
      p.modelClass === modelClass ||
      p.modelClasses?.includes(modelClass)
  );
};

// Helper function to check if a model prediction matches a phrase
export const checkPhraseMatch = (
  phrase: Phrase,
  modelClass: string,
  variant?: "adult" | "friend"
): boolean => {
  // If phrase has variant mapping and a variant is specified, use it
  if (phrase.variantModelMapping && variant && phrase.variantModelMapping[variant]) {
    const variantClasses = phrase.variantModelMapping[variant];
    if (typeof variantClasses === 'string') {
      return variantClasses === modelClass;
    } else if (Array.isArray(variantClasses)) {
      return variantClasses.includes(modelClass);
    }
  }

  // Fallback to original behavior
  if (phrase.modelClass === modelClass) return true;
  if (phrase.modelClasses?.includes(modelClass)) return true;
  return false;
};

// Helper function to check if a phrase is fully completed 
// (for phrases with multiple sub-parts like g1 and g4, verifies both are collected)
export const isPhraseCompletedCheck = (phraseId: string, completedPhrases: Set<string>): boolean => {
  if (phraseId === "g1" || phraseId === "g4" || phraseId === "g6") {
    return completedPhrases.has(`${phraseId}_adult`) && completedPhrases.has(`${phraseId}_friend`);
  }
  return completedPhrases.has(phraseId);
};

export const leaderboardData = [
  { rank: 1, username: "SignMaster99", points: 12450 },
  { rank: 2, username: "HandTalker", points: 11200 },
  { rank: 3, username: "GestureKing", points: 9870 },
  { rank: 4, username: "QuietHero", points: 8540 },
  { rank: 5, username: "SignNinja", points: 7320 },
  { rank: 6, username: "ASL_Pro", points: 6100 },
  { rank: 7, username: "WaveRider", points: 5400 },
  { rank: 8, username: "FingerSpell", points: 4890 },
  { rank: 9, username: "MuteButLoud", points: 3200 },
  { rank: 10, username: "NewLearner", points: 1050 },
];

/**
 * Direct map from logical video keys to /videos/*.webp public paths.
 * Each key is the Thai display name or internal English key used in the app.
 */
export const VIDEO_URL_MAP: Record<string, string> = {
  // General — main clips
  "สวัสดี (ผู้ใหญ่)": "/videos/general/hello_adult.mp4",
  "สวัสดี (ผู้ใหญ่)main": "/videos/general/hello_adult_main.mp4",
  "สวัสดี (เพื่อน)": "/videos/general/hello_friend.mp4",
  "สวัสดี (เพื่อน)main": "/videos/general/hello_friend_main.mp4",
  "สบายดีไหม": "/videos/general/how_are_you.mp4",
  "สบายดี": "/videos/general/fine.mp4",
  "ไม่สบายใจ": "/videos/general/unhappy.mp4",
  "กินข้าวแล้วหรือยัง": "/videos/general/Are_you_eaten.mp4",
  "กินข้าวหรือยัง": "/videos/general/Are_you_eaten.mp4",
  "กินแล้ว": "/videos/general/already_eat.mp4",
  "ยังไม่ได้กิน": "/videos/general/not_eat.mp4",
  "ลาก่อน": "/videos/general/goodbye.mp4",
  // General — live step clips
  "กิน": "/videos/general/eat.mp4",
  "แล้ว": "/videos/general/already.mp4",
  "ยัง": "/videos/general/not_yet.mp4",
  "ฉัน": "/videos/general/me.mp4",
  "ไป": "/videos/general/go.mp4",
  "ข้าว": "/videos/general/rice.mp4",
  "หรือยัง": "/videos/general/or_not_yet.mp4",
  // Emotions
  "กลัว": "/videos/emotions/fear.mp4",
  "รัก": "/videos/emotions/love.mp4",
  "เหนื่อย": "/videos/emotions/tired.mp4",
  "โกรธ": "/videos/emotions/angry.mp4",
  // Q&A
  "ทำไม": "/videos/qa/why.mp4",
  "อะไร": "/videos/qa/what.mp4",
  "เท่าไหร่": "/videos/qa/how_much.mp4",
  "ใช่": "/videos/qa/yes.mp4",
  "ไม่": "/videos/qa/no.mp4",
  // Illness
  "ปวดท้อง": "/videos/illness/stomachache.mp4",
  "ปวดหัว": "/videos/illness/headache.mp4",
  "เจ็บคอ": "/videos/illness/sore_throat.mp4",
  "เป็นหวัด": "/videos/illness/cold.mp4",
  "เป็นไข้": "/videos/illness/fever.mp4",
  // Tips
  "hello_adult-tip": "/videos/Tips_video/hello_adult-tip.mp4",
  "hello_friend-tip": "/videos/Tips_video/hello_friend-tip.mp4",
  "bye_me-tip": "/videos/Tips_video/bye_me-tip.mp4",
  "bye_go-tip": "/videos/Tips_video/bye_go-tip.mp4",
  "rice-tip": "/videos/Tips_video/rice-tip.mp4",
  "eat-tip": "/videos/Tips_video/eat-tip.mp4",
  "yet-tip": "/videos/Tips_video/yet-tip.mp4",
  "already-tip": "/videos/Tips_video/already-tip.mp4",
  "how_are_you-tip": "/videos/Tips_video/how_are_you-tip.mp4",
  "fine-tip": "/videos/Tips_video/fine-tip.mp4",
  "unhappy-tip": "/videos/Tips_video/unhappy-tip.mp4",
  "angry-tip": "/videos/Tips_video/angry-tip.mp4",
  "fear-tip": "/videos/Tips_video/fear-tip.mp4",
  "love-tip": "/videos/Tips_video/love-tip.mp4",
  "tired-tip": "/videos/Tips_video/tired-tip.mp4",
  "what-tip": "/videos/Tips_video/what-tip.mp4",
  "why-tip": "/videos/Tips_video/why-tip.mp4",
  "how_much-tip": "/videos/Tips_video/how_much-tip.mp4",
  "yes-tip": "/videos/Tips_video/yes-tip.mp4",
  "no-tip": "/videos/Tips_video/no-tip.mp4",
  "stomachache-tip": "/videos/Tips_video/stomachache-tip.mp4",
  "headache-tip": "/videos/Tips_video/headache-tip.mp4",
  "sore_throat-tip": "/videos/Tips_video/sore_throat-tip.mp4",
  "cold-tip": "/videos/Tips_video/cold-tip.mp4",
  "fever-tip": "/videos/Tips_video/fever-tip.mp4",
};

/**
 * Returns the direct /videos/*.mp4 path for a given display name or tip key.
 * Fallback: constructs a best-guess path if key is not in the map.
 */
export const getVideoUrl = (category: Category | string, fileName: string): string => {
  if (VIDEO_URL_MAP[fileName]) return VIDEO_URL_MAP[fileName];
  // Fallback — construct path directly (English filename, no mapping needed)
  return `/videos/${category}/${fileName}.mp4`;
};
