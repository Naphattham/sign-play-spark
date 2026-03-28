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
  "สวัสดี (ผู้ใหญ่)":      "/videos/general/hello_adult.webp",
  "สวัสดี (ผู้ใหญ่)main":  "/videos/general/hello_adult_main.webp",
  "สวัสดี (เพื่อน)":       "/videos/general/hello_friend.webp",
  "สวัสดี (เพื่อน)main":   "/videos/general/hello_friend_main.webp",
  "สบายดีไหม":             "/videos/general/how_are_you.webp",
  "สบายดี":                "/videos/general/fine.webp",
  "ไม่สบายใจ":             "/videos/general/unhappy.webp",
  "กินข้าวแล้วหรือยัง":   "/videos/general/Are_you_eaten.webp",
  "กินข้าวหรือยัง":        "/videos/general/Are_you_eaten.webp",
  "กินแล้ว":               "/videos/general/already_eat.webp",
  "ยังไม่ได้กิน":          "/videos/general/not_eat.webp",
  "ลาก่อน":                "/videos/general/goodbye.webp",
  // General — live step clips
  "กิน":                   "/videos/general/eat.webp",
  "แล้ว":                  "/videos/general/already.webp",
  "ยัง":                   "/videos/general/not_yet.webp",
  "ฉัน":                   "/videos/general/me.webp",
  "ไป":                    "/videos/general/go.webp",
  "ข้าว":                  "/videos/general/rice.webp",
  "หรือยัง":               "/videos/general/or_not_yet.webp",
  // Emotions
  "กลัว":                  "/videos/emotions/fear.webp",
  "รัก":                   "/videos/emotions/love.webp",
  "เหนื่อย":               "/videos/emotions/tired.webp",
  "โกรธ":                  "/videos/emotions/angry.webp",
  // Q&A
  "ทำไม":                  "/videos/qa/why.webp",
  "อะไร":                  "/videos/qa/what.webp",
  "เท่าไหร่":              "/videos/qa/how_much.webp",
  "ใช่":                   "/videos/qa/yes.webp",
  "ไม่":                   "/videos/qa/no.webp",
  // Illness
  "ปวดท้อง":               "/videos/illness/stomachache.webp",
  "ปวดหัว":                "/videos/illness/headache.webp",
  "เจ็บคอ":                "/videos/illness/sore_throat.webp",
  "เป็นหวัด":              "/videos/illness/cold.webp",
  "เป็นไข้":               "/videos/illness/fever.webp",
  // Tips
  "hello_adult-tip":       "/videos/Tips_video/hello_adult-tip.webp",
  "hello_friend-tip":      "/videos/Tips_video/hello_friend-tip.webp",
  "bye_me-tip":            "/videos/Tips_video/bye_me-tip.webp",
  "bye_go-tip":            "/videos/Tips_video/bye_go-tip.webp",
  "rice-tip":              "/videos/Tips_video/rice-tip.webp",
  "eat-tip":               "/videos/Tips_video/eat-tip.webp",
  "yet-tip":               "/videos/Tips_video/yet-tip.webp",
  "already-tip":           "/videos/Tips_video/already-tip.webp",
  "how_are_you-tip":       "/videos/Tips_video/how_are_you-tip.webp",
  "fine-tip":              "/videos/Tips_video/fine-tip.webp",
  "unhappy-tip":           "/videos/Tips_video/unhappy-tip.webp",
  "angry-tip":             "/videos/Tips_video/angry-tip.webp",
  "fear-tip":              "/videos/Tips_video/fear-tip.webp",
  "love-tip":              "/videos/Tips_video/love-tip.webp",
  "tired-tip":             "/videos/Tips_video/tired-tip.webp",
  "what-tip":              "/videos/Tips_video/what-tip.webp",
  "why-tip":               "/videos/Tips_video/why-tip.webp",
  "how_much-tip":          "/videos/Tips_video/how_much-tip.webp",
  "yes-tip":               "/videos/Tips_video/yes-tip.webp",
  "no-tip":                "/videos/Tips_video/no-tip.webp",
  "stomachache-tip":       "/videos/Tips_video/stomachache-tip.webp",
  "headache-tip":          "/videos/Tips_video/headache-tip.webp",
  "sore_throat-tip":       "/videos/Tips_video/sore_throat-tip.webp",
  "cold-tip":              "/videos/Tips_video/cold-tip.webp",
  "fever-tip":             "/videos/Tips_video/fever-tip.webp",
};

/**
 * Returns the direct /videos/*.webp path for a given display name or tip key.
 * Fallback: constructs a best-guess path if key is not in the map.
 */
export const getVideoUrl = (category: Category | string, fileName: string): string => {
  if (VIDEO_URL_MAP[fileName]) return VIDEO_URL_MAP[fileName];
  // Fallback — construct path directly (English filename, no mapping needed)
  return `/videos/${category}/${fileName}.webp`;
};
