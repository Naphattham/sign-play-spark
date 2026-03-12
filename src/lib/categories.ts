export type Category = "general" | "emotions" | "qa" | "illness";

export interface Phrase {
  id: string;
  text: string;
  category: Category;
  videoUrl?: string;
  emoji?: string;
  english?: string;
}

export const categories: { id: Category; label: string; icon: string; color: string }[] = [
  { id: "general", label: "บทสนทนาทั่วไป", icon: "Hand", color: "bg-primary" },
  { id: "emotions", label: "อารมณ์", icon: "Heart", color: "bg-accent" },
  { id: "qa", label: "คำถาม-คำตอบ", icon: "HelpCircle", color: "bg-secondary" },
  { id: "illness", label: "อาการเจ็บป่วย", icon: "Thermometer", color: "bg-destructive" },
];

export const phrases: Phrase[] = [
  // General
  { id: "g1", text: "สวัสดี (ผู้ใหญ่ | เพื่อน)", category: "general", emoji: "👋", english: "Hello" },
  { id: "g2", text: "ลาก่อน", category: "general", emoji: "👋", english: "Goodbye" },
  { id: "g3", text: "กินข้าวแล้วหรือยัง?", category: "general", emoji: "🍚", english: "Have you eaten?" },
  { id: "g4", text: "กินแล้ว | ยังไม่ได้กิน", category: "general", emoji: "✅", english: "Already ate | Not yet" },
  { id: "g5", text: "สบายดีไหม?", category: "general", emoji: "😊", english: "How are you?" },
  { id: "g6", text: "สบายดี", category: "general", emoji: "👍", english: "I'm fine" },
  // Emotions
  { id: "e1", text: "โกรธ", category: "emotions", emoji: "😡", english: "Angry" },
  { id: "e2", text: "กลัว", category: "emotions", emoji: "😨", english: "Scared" },
  { id: "e3", text: "รัก", category: "emotions", emoji: "❤️", english: "Love" },
  { id: "e4", text: "ไม่สบายใจ", category: "emotions", emoji: "🙁", english: "Uncomfortable" },
  { id: "e5", text: "เหนื่อย", category: "emotions", emoji: "😩", english: "Tired" },
  // Q&A
  { id: "q1", text: "อะไร?", category: "qa", emoji: "❓", english: "What?" },
  { id: "q2", text: "ทำไม?", category: "qa", emoji: "🤔", english: "Why?" },
  { id: "q3", text: "เท่าไหร่?", category: "qa", emoji: "💰", english: "How much?" },
  { id: "q4", text: "ใช่", category: "qa", emoji: "✅", english: "Yes" },
  { id: "q5", text: "ไม่", category: "qa", emoji: "❌", english: "No" },

  // Illness
  { id: "i1", text: "เป็นหวัด", category: "illness", emoji: "🤧", english: "Cold" },
  { id: "i2", text: "เจ็บคอ", category: "illness", emoji: "😷", english: "Sore throat" },
  { id: "i3", text: "ปวดท้อง", category: "illness", emoji: "🤰", english: "Stomachache" },
  { id: "i4", text: "ปวดหัว", category: "illness", emoji: "🤕", english: "Headache" },
  { id: "i5", text: "เป็นไข้", category: "illness", emoji: "🌡️", english: "Fever" },
];

export const getPhrasesByCategory = (category: Category) =>
  phrases.filter((p) => p.category === category);

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
