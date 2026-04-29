import generalImg from "@/asset/image/general.webp";
import emotionalImg from "@/asset/image/emotional.webp";
import qaImg from "@/asset/image/qa.webp";
import illnessImg from "@/asset/image/illness.webp";
import trophyImg from "@/asset/image/Trophy.webp";
import questImg from "@/asset/image/quest.webp";
import challengeImg from "@/asset/image/challenge.webp";
import lessonImg from "@/asset/image/lesson.webp";
import alreadyAteImg from "@/asset/image/Already ate | Not yet.webp";
import feverImg from "@/asset/image/fever.webp";
import goodbyeImg from "@/asset/image/Goodbye.webp";
import haveYouEatenImg from "@/asset/image/Have you eaten.webp";
import helloImg from "@/asset/image/Hello.webp";
import howMuchImg from "@/asset/image/How much.webp";
import loveImg from "@/asset/image/Love.webp";
import scaredImg from "@/asset/image/Scared.webp";
import soreThroatImg from "@/asset/image/Sore throat.webp";
import stomachacheImg from "@/asset/image/Stomachache.webp";
import tiredImg from "@/asset/image/Tired.webp";
import whatImg from "@/asset/image/What.webp";
import whyImg from "@/asset/image/Why.webp";
import angryImg from "@/asset/image/angry.webp";
import yesImg from "@/asset/image/yes.webp";
import noImg from "@/asset/image/no.webp";
import headacheImg from "@/asset/image/headache.webp";
import coldImg from "@/asset/image/cold.webp";
import fineUnhappyImg from "@/asset/image/I'm fine | Unhappy.webp";
import howAreYouImg from "@/asset/image/how_are_you.webp";

import { ref as dbRef, get } from "firebase/database";
import { database } from "@/lib/firebase";

// ── Types ──────────────────────────────────────────────
export type View = "home" | "lessons" | "game" | "leaderboard" | "quest" | "profile" | "playing" | "gamesetup";
export type ButtonState = "start" | "stop" | "collect" | "tryagain";

// ── Score Utility ──────────────────────────────────────
export const getScoreFromConfidence = (confidence: number): number => {
  if (confidence >= 0.80) return 100;
  if (confidence >= 0.65) return 70;
  if (confidence >= 0.50) return 40;
  return 0;
};

// ── Image Maps ─────────────────────────────────────────
export const phraseIconMap: Record<string, string> = {
  g1: helloImg,
  g2: goodbyeImg,
  g3: haveYouEatenImg,
  g4: alreadyAteImg,
  g5: howAreYouImg,
  g6: fineUnhappyImg,
  e1: angryImg,
  e2: scaredImg,
  e3: loveImg,
  e5: tiredImg,
  q1: whatImg,
  q2: whyImg,
  q3: howMuchImg,
  q4: yesImg,
  q5: noImg,
  i1: coldImg,
  i2: soreThroatImg,
  i3: stomachacheImg,
  i4: headacheImg,
  i5: feverImg,
};

export const categoryIconMap: Record<string, string> = {
  general: generalImg,
  emotions: emotionalImg,
  qa: qaImg,
  illness: illnessImg,
};

export { trophyImg, questImg, challengeImg, lessonImg };

// ── Hint Map ───────────────────────────────────────────
export const phraseHintMap: Record<string, string> = {
  already: "ค่อยๆแบมือ -> สะบัดออกจากตัวช้าๆ -> ค้างไว้บริเวณเอว",
  angry: "ค่อยๆงอนิ้วมือ -> ดึงออกจากหน้าผาก -> ค้างไว้",
  bye_go: "ค่อยๆแบมือชิดกัน -> ตวัดมือออกจากตัวขึ้นไปด้านบน -> ค้างไว้",
  bye_me: "ค่อยๆนำมือแนบหน้าอก -> นิ้วเรียงชิดกัน -> ตบหน้าอกเบาๆ -> ค้างไว้",
  cold: "ค่อยๆเอียงหน้า -> ชูสองนิ้วขึ้นลง -> ตรงปลายจมูก -> ค้างไว้",
  eat: "ค่อยๆทำนิ้วทั้งหมดเป็นรูปจีบ -> ไว้บริเวณปาก -> ค้างไว้",
  fear: "ค่อยๆกำมือสองข้าง -> เขย่ามือ บริเวณหน้าอก -> ค้างไว้",
  fever: "ค่อยๆแบมือ -> นิ้วชิดติดกัน -> ไว้บริเวณหน้าผาก -> มือมาพัดขึ้นลงที่ท้อง -> ค้างไว้",
  fine: "ค่อยๆรูดมือจากกลางหน้าอก -> กำมือชูนิ้วโป้ง -> ยิ้ม -> ค้างไว้",
  headache: "ค่อยๆงอนิ้วมือ -> มือมาไว้ที่หัว -> ทำท่าทางขยุ้มๆ -> เอียงหัวไปหามือ -> ค้างไว้",
  hello_adult: "ค่อยๆพนมมือเป็นรูปดอกบัวแล้วก้มหัวลง -> ค้างไว้",
  hello_friend: "ค่อยๆแบนิ้วชิดกัน -> ไว้บริเวณหน้าผาก -> เคลื่อนมือมาข้างหน้า -> ค้างไว้",
  how_are_you: "ค่อยๆรูดมือจากกลางหน้าอก -> กำมือชูนิ้วโป้ง -> ก้มสงสัย -> ค้างไว้",
  how_much: "ค่อยๆนำแค่นิ้วโป้งถูนิ้วชี้ไปมา (นิ้วที่เหลือชิดกัน) -> ค้างไว้",
  love: "ค่อยๆแบมือมาซ้อนกัน -> วางไว้บริเวณหัวใจ -> เอียงคอ -> ค้างไว้",
  no: "ค่อยๆแบหลังมือ -> ส่ายไปมา (ขนานกับไหล่) -> ค้างไว้",
  rice: "ค่อยๆนำนิ้วโป้ง และนิ้วก้อยมาแตะๆกัน -> ค้างไว้",
  sore_throat: "ค่อยๆนำนิ้วโป้ง และนิ้วก้อย รูดลงที่คอเบาๆ -> ค้างไว้",
  stomachache: "ค่อยๆงอนิ้วมือทั้งห้า -> ขยำๆมือที่บริเวณหน้าท้อง (สะดือ) -> ค้างไว้",
  tired: "ค่อยๆนำนิ้วทั้งหมด ชี้เข้าที่ตัวเอง -> ห่อไหล่ -> หุบแขนเข้า -> ก้มลงเล็กน้อย -> ค้างไว้",
  unhappy: "ค่อยๆเอียงคอ -> รูดมือจากท้องถึงอก -> ค้างไว้บริเวณไหล่ -> ค่อยๆสะบัด -> ค้างไว้",
  what: "ค่อยๆนิ้วชี้ส่ายไปมา -> ขนานกับหน้าอกหรือหัวไหล่ -> ค้างไว้",
  why: "ค่อยๆแบนิ้วชิดกัน -> นาบมือไว้หน้าผาก -> ลากลงมาข้างหน้า -> กางนิ้วชี้และโป้งออก -> ค้างไว้",
  yes: "ค่อยๆกำมือ -> วางไว้หน้าอก -> กวักมือ -> ค้างไว้",
  yet: "ค่อยๆกางนิ้วก้อยและนิ้วโป้งออก -> ขยับส่ายไปมา -> ระยะเดียวกันกับหน้าอก -> ค้างไว้",
};

// ── Avatar Preloading ──────────────────────────────────
export const preloadAllAvatars = async () => {
  try {
    const usersRef = dbRef(database, 'users');
    const snapshot = await get(usersRef);

    if (snapshot.exists()) {
      const users = snapshot.val();
      Object.values(users).forEach((user: any) => {
        if (user.photoURL) {
          const img = new Image();
          img.src = user.photoURL;
        }
      });
    }
  } catch (error) {
    console.error("Error preloading avatars:", error);
  }
};

// ── Minimum scanning duration ──────────────────────────
export const MIN_SCANNING_DURATION = 1500;
