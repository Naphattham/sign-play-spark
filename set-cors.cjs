// set-cors.js
const admin = require("firebase-admin");
const serviceAccount = require("./signmate-cbe60-firebase-adminsdk-fbsvc-10c3dafbe2.json"); // 👈 เปลี่ยนชื่อไฟล์ให้ตรง

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: "signmate-cbe60.firebasestorage.app" // 👈 โดเมน Storage ของคุณ
});

const bucket = admin.storage().bucket();

// อนุญาตให้ทุกเว็บ (*) ดึงไฟล์ไปใช้ได้
const corsConfiguration = [
  {
    origin: ["*"],
    method: ["GET"],
    maxAgeSeconds: 3600
  }
];

bucket.setCorsConfiguration(corsConfiguration)
  .then(() => {
    console.log("✅ อัปเดต CORS สำเร็จแล้ว! Safari ควรจะเล่นวิดีโอได้แล้วครับ");
  })
  .catch((err) => {
    console.error("❌ เกิดข้อผิดพลาด:", err);
  });