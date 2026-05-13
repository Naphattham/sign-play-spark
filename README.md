# SignMate

**เว็บไซต์**: [https://signmate-cbe60.web.app/](https://signmate-cbe60.web.app/)

แอปพลิเคชันสำหรับเรียนรู้และฝึกฝนภาษามือผ่านเกมแบบอินเทอร์แอกทีฟ โดยใช้การเปิดกล้องเว็บแคมเพื่อจับภาพและวิเคราะห์ท่าทางภาษามือแบบเรียลไทม์ ผู้ใช้จะได้รับความสนุกสนานควบคู่ไปกับการเรียนรู้ผ่านมินิเกมต่างๆ

## 🌟 ฟีเจอร์หลัก (Features)

- **AI Sign Recognition**: ระบบตรวจจับภาษามือผ่านกล้องหน้าโดยใช้โมเดล Deep Learning (Keras) ประมวลผลแบบเรียลไทม์
- **Interactive Mini-Games**: สนุกไปกับเกมที่ช่วยฝึกฝนภาษามือ
  - *Sign Defender*
  - *Match & Sign*
  - *Sign Master Memory* 
  - *Sign Defender Page*
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

### 1. การตั้งค่า Environment Variables (.env)

โปรเจกต์นี้จำเป็นต้องใช้ค่าคอนฟิกของ Firebase สำหรับเชื่อมต่อฐานข้อมูลและระบบยืนยันตัวตน ให้ทำการสร้างไฟล์ `.env` (หรือเปลี่ยนชื่อจากไฟล์ `.env.example`) ไว้ที่ root ของโปรเจกต์ (`sign-play-spark/`) และกำหนดค่าต่างๆ ดังนี้:

```env
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
VITE_FIREBASE_DATABASE_URL=your_firebase_database_url
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
VITE_FIREBASE_APP_ID=your_firebase_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_firebase_measurement_id
```

> **หมายเหตุ**: สามารถนำค่าเหล่านี้ได้จากการตั้งค่า Project Settings ใน Firebase Console

### 2. การทำงานกับ Frontend

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

### 3. การทำงานกับ Backend / Firebase Functions

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
เว็บที่ Deploy ไว้แล้วสามารถเข้าถึงได้ที่: [https://signmate-cbe60.web.app/](https://signmate-cbe60.web.app/)

หากต้องการ Deploy อัปเดตใหม่ สามารถทำได้ผ่าน Firebase CLI:
```bash
# บิวต์ Production
npm run build

# Deploy ไปยัง Firebase
firebase deploy
```

---

## 👥 ผู้พัฒนา (Developers)

1. [นาย นภัทร ธรรมธีโร]
2. [นางสาว ปัณณ์ ทิตย์วงศ์]
3. [นางสาว ธนัชพร รางดี]
4. [นางสาว กรรณิกา ปรางทอง]
5. [นางสาว ฉัตรแก้ว อุปโคตร]
