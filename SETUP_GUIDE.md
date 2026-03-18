# Sign Language Recognition Setup Guide

## การเชื่อมต่อ Model กับ Frontend

โปรเจคนี้ใช้ Thai Sign Language Recognition Model ที่เชื่อมต่อกับ Firebase Cloud Functions

### 🎯 Model Classes

Model สามารถจำแนกภาษามือได้ **25 คำ**:

#### บทสนทนาทั่วไป (General)
- `hello_adult` - สวัสดี (ผู้ใหญ่)
- `hello_friend` - สวัสดี (เพื่อน)
- `bye_go` - ลาก่อน (คนอื่นไป)
- `bye_me` - ลาก่อน (ฉันไป)
- `rice` - กินข้าวแล้วหรือยัง
- `already` - กินแล้ว
- `yet` - ยังไม่ได้กิน
- `eat` - กิน
- `how_are_you` - สบายดีไหม
- `fine` - สบายดี

#### อารมณ์ (Emotions)
- `angry` - โกรธ
- `fear` - กลัว
- `love` - รัก
- `unhappy` - ไม่สบายใจ
- `tired` - เหนื่อย

#### คำถาม-คำตอบ (Q&A)
- `what` - อะไร
- `why` - ทำไม
- `how_much` - เท่าไหร่
- `yes` - ใช่
- `no` - ไม่

#### อาการเจ็บป่วย (Illness)
- `cold` - เป็นหวัด
- `sore_throat` - เจ็บคอ
- `stomachache` - ปวดท้อง
- `headache` - ปวดหัว
- `fever` - เป็นไข้

### 🏗️ Architecture

```
Frontend (React + TypeScript)
    ↓
WebcamView (Capture frames)
    ↓
useSignLanguageRecognition Hook
    ↓
signLanguageAPI Service
    ↓
Firebase Cloud Functions (Python)
    ↓
MediaPipe + TensorFlow Model
    ↓
Prediction Results
```

### 📦 ติดตั้ง Dependencies

#### Frontend
```bash
npm install
```

#### Backend (Firebase Functions)
```bash
cd functions
pip install -r requirements.txt
```

### 🚀 วิธีการใช้งาน

#### 1. รัน Frontend (Development)
```bash
npm run dev
```

#### 2. รัน Firebase Functions (Local Emulator)
```bash
firebase emulators:start --only functions
```

#### 3. Deploy to Firebase (Production)
```bash
# Deploy functions
firebase deploy --only functions

# Deploy hosting
npm run build
firebase deploy --only hosting
```

### 🔧 Configuration Files

#### `/functions/main.py`
- Cloud Functions endpoints
- Model loading และ inference
- MediaPipe keypoint extraction

#### `/src/lib/signLanguageAPI.ts`
- API client สำหรับเรียก Cloud Functions
- Frame processing utilities

#### `/src/hooks/useSignLanguageRecognition.ts`
- Custom React Hook สำหรับ real-time recognition
- Buffer management (40 frames)
- Prediction handling

#### `/src/lib/categories.ts`
- Phrase definitions พร้อม mapping ไปยัง model classes
- Helper functions สำหรับจับคู่ predictions

### 🎮 การทำงานของระบบ

1. **Webcam Capture**: WebcamView จับภาพจากกล้อง
2. **Frame Processing**: ทุก 100ms ส่งภาพไปที่ API เพื่อ extract keypoints
3. **Buffer Management**: เก็บ keypoints ล่าสุด 40 frames
4. **Prediction**: เมื่อ buffer เต็ม ส่งไปทำนายทุก 2 frames
5. **Match Detection**: เปรียบเทียบผลทำนายกับคำที่กำลังเล่น
6. **Completion**: เมื่อตรงกัน trigger success animation

### 📊 Model Specifications

- **Sequence Length**: 40 frames
- **Features per Frame**: 632
  - Pose: 25 points × 4 (x, y, z, visibility)
  - Face: 30 selected landmarks × 3 (x, y, z)
  - Hands: 21 points × 2 hands × 3 (x, y, z)
  - Motion: Same as above (temporal difference)
- **Model Type**: LSTM (3 layers: 128→64→32)
- **Confidence Threshold**: 0.5 (50%)

### 🐛 Troubleshooting

#### Model ไม่โหลด
```bash
# ตรวจสอบว่าไฟล์ model อยู่ในตำแหน่งที่ถูกต้อง
ls -la functions/model/
# ควรเห็น: classes.pkl, final_model.keras
```

#### API ไม่ตอบกลับ
```bash
# ตรวจสอบ Firebase Functions logs
firebase functions:log

# หรือดู emulator logs
# URL: http://127.0.0.1:4000/logs
```

#### Webcam ไม่ทำงาน
- ตรวจสอบว่าได้อนุญาตสิทธิ์กล้องในเบราว์เซอร์แล้ว
- ใช้ HTTPS หรือ localhost เท่านั้น (ข้อกำหนดของเบราว์เซอร์)

### 🔑 Environment Variables

สร้างไฟล์ `.env` (optional):
```env
VITE_FIREBASE_PROJECT_ID=signmate-cbe60
VITE_FUNCTIONS_URL=http://127.0.0.1:5001
```

### 📝 API Endpoints

#### `POST /process_frame`
Extract keypoints from a single frame
```json
{
  "frame": "base64_encoded_image"
}
```

#### `POST /predict_sign`
Predict sign from keypoints buffer
```json
{
  "keypoints_buffer": [[316 features], ...] // 40 frames
}
```

#### `GET /get_model_info`
Get model information
```json
{
  "classes": ["hello_adult", ...],
  "num_classes": 25,
  "sequence_length": 40,
  "features": 632
}
```

### 🎨 UI Integration

Recognition status แสดงใน webcam overlay:
- **Buffer Progress**: แสดงจำนวน frames ที่เก็บแล้ว (0-40)
- **Current Prediction**: แสดงคำที่ model ทำนาย
- **Confidence**: แสดงความมั่นใจ (0-100%)
- **Live Indicator**: แสดงสถานะ real-time processing

### 🔄 การอัพเดท Model

หากต้องการใช้ model ใหม่:
1. วาง `final_model.keras` และ `classes.pkl` ใน `functions/model/`
2. อัพเดท `SEQUENCE_LENGTH` และ `TARGET_FEATURES` ใน `main.py` หากจำเป็น
3. อัพเดท phrase mapping ใน `src/lib/categories.ts`
4. Deploy ใหม่

### 📧 Support

หากมีปัญหาติดต่อ: [GitHub Issues](https://github.com/yourusername/sign-play-spark/issues)
