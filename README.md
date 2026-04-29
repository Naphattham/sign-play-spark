# SignMate (SignQuest)

**เว็บไซต์**: [https://signmate-test.web.app/](https://signmate-test.web.app/)

แอปพลิเคชันสำหรับเรียนรู้และฝึกฝนภาษามือผ่านเกมแบบอินเทอร์แอกทีฟ โดยใช้การเปิดกล้องเว็บแคมเพื่อจับภาพและวิเคราะห์ท่าทางภาษามือแบบเรียลไทม์ ผู้ใช้จะได้รับความสนุกสนานควบคู่ไปกับการเรียนรู้ผ่านมินิเกมต่างๆ

## 🌟 ฟีเจอร์หลัก (Features)

- **AI Sign Recognition**: ระบบตรวจจับภาษามือผ่านกล้องหน้าโดยใช้โมเดล Deep Learning (Keras) ประมวลผลแบบเรียลไทม์
- **Interactive Mini-Games**: สนุกไปกับเกมที่ช่วยฝึกฝนภาษามือ
  - *Sign Defender*
  - *Match & Sign*
  - *Sign Master Memory*
- **User Authentication**: ระบบสมัครสมาชิกและเข้าสู่ระบบ (Firebase Auth)
- **Profile & Leaderboard**: ระบบจัดการโปรไฟล์ส่วนตัวและการจัดอันดับผู้เล่นเพื่อความท้าทาย

## 💻 Tech Stack ที่ใช้

**Frontend:**
- **React.js** + **TypeScript**
- **Vite** (Build Tool)
- **Tailwind CSS** + **shadcn/ui** (UI Framework)
- **React Router Dom** (Routing)
- **React Webcam** (สำหรับเปิดกล้อง)

**Backend & ML:**
- **Firebase** (Hosting, Authentication, Firestore / Realtime Database)
- **Python** (Cloud Functions / Model API)
- **Keras** (Machine Learning Model - `final_model.keras`)

---

## 🚀 การติดตั้งและใช้งานโปรเจกต์ (Local Development)

### ข้อกำหนดเบื้องต้น (Prerequisites)
- [Node.js](https://nodejs.org/) แนะนำเวอร์ชัน v20.19.0
- [Python 3.x](https://www.python.org/) สำหรับรันส่วนของ Backend/Model (ถ้าต้องการ) แนะนำเวอร์ชัน Python 3.11.9

### 1. การทำงานกับ Frontend

โคลนโปรเจกต์และติดตั้ง Dependencies:

```bash
# 1. เข้าสู่โฟลเดอร์โปรเจกต์
cd sign-play-spark

# 2. ติดตั้ง Dependencies ฝั่ง Frontend
npm install

# 3. รัน Development Server
npm run dev
```
หลังจากรันเสร็จเรียบร้อยแล้วสามารถเข้าไปดูได้ที่ `http://localhost:5173`

### 2. การทำงานกับ Backend / Firebase Functions

โปรเจกต์นี้มีเซอร์วิสที่ใช้ Python สำหรับจัดการ API ตรวจจับภาษามือ

```bash
# 1. เข้าไปที่โฟลเดอร์ functions
cd functions

# 2. สร้าง Virtual Environment (แนะนำ)
python -m venv venv
source venv/bin/activate  # สำหรับ Mac/Linux
# venv\Scripts\activate   # สำหรับ Windows

# 3. ติดตั้งไลบรารี
pip install -r requirements.txt
```

---

## 🚀 การ Deploy

โปรเจกต์นี้โฮสต์อยู่บน **Firebase Hosting**
เว็บที่ Deploy ไว้แล้วสามารถเข้าถึงได้ที่: [https://signmate-test.web.app/](https://signmate-test.web.app/)

หากต้องการ Deploy อัปเดตใหม่ สามารถทำได้ผ่าน Firebase CLI:
```bash
# บิวต์ Production
npm run build

# Deploy ไปยัง Firebase
firebase deploy
```
