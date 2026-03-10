export type Category = "general" | "emotions" | "qa" | "illness";

export interface Phrase {
  id: string;
  text: string;
  category: Category;
  videoUrl?: string;
}

export const categories: { id: Category; label: string; icon: string; color: string }[] = [
  { id: "general", label: "General", icon: "Hand", color: "bg-primary" },
  { id: "emotions", label: "Emotions", icon: "Heart", color: "bg-accent" },
  { id: "qa", label: "Q&A", icon: "HelpCircle", color: "bg-secondary" },
  { id: "illness", label: "Illness", icon: "Thermometer", color: "bg-destructive" },
];

export const phrases: Phrase[] = [
  // General
  { id: "g1", text: "Hello", category: "general" },
  { id: "g2", text: "Thank you", category: "general" },
  { id: "g3", text: "Please", category: "general" },
  { id: "g4", text: "Sorry", category: "general" },
  { id: "g5", text: "Goodbye", category: "general" },
  { id: "g6", text: "Yes", category: "general" },
  { id: "g7", text: "No", category: "general" },
  // Emotions
  { id: "e1", text: "Happy", category: "emotions" },
  { id: "e2", text: "Sad", category: "emotions" },
  { id: "e3", text: "Angry", category: "emotions" },
  { id: "e4", text: "Scared", category: "emotions" },
  { id: "e5", text: "Surprised", category: "emotions" },
  // Q&A
  { id: "q1", text: "What is your name?", category: "qa" },
  { id: "q2", text: "How are you?", category: "qa" },
  { id: "q3", text: "Where are you from?", category: "qa" },
  { id: "q4", text: "How old are you?", category: "qa" },
  // Illness
  { id: "i1", text: "Stomachache", category: "illness" },
  { id: "i2", text: "Headache", category: "illness" },
  { id: "i3", text: "Fever", category: "illness" },
  { id: "i4", text: "Cough", category: "illness" },
  { id: "i5", text: "I need help", category: "illness" },
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
