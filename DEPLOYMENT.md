# Deployment Guide - Sign Language Recognition

## 📋 Pre-deployment Checklist

- [ ] Model files in `functions/model/`:
  - `final_model.keras`
  - `classes.pkl`
- [ ] Firebase project configured (`.firebaserc`)
- [ ] Dependencies installed
- [ ] API URLs configured in `signLanguageAPI.ts`

## 🚀 Deployment Steps

### 1. Install Dependencies

#### Frontend
```bash
npm install
```

#### Backend (Functions)
```bash
cd functions
pip install -r requirements.txt
```

### 2. Test Locally

#### Start Firebase Emulators
```bash
firebase emulators:start --only functions
```

Functions จะรันที่: `http://127.0.0.1:5001`

#### Start Frontend Dev Server
```bash
npm run dev
```

Frontend จะรันที่: `http://localhost:5173`

### 3. Test Model API

```bash
# Get model info
curl http://127.0.0.1:5001/signmate-cbe60/us-central1/get_model_info

# Should return:
# {
#   "classes": ["hello_adult", "hello_friend", ...],
#   "num_classes": 25,
#   "sequence_length": 40,
#   "features": 632,
#   "success": true
# }
```

### 4. Build Frontend

```bash
npm run build
```

### 5. Deploy to Firebase

#### Deploy Functions Only
```bash
firebase deploy --only functions
```

⚠️ **Warning**: Functions deployment อาจใช้เวลานาน เนื่องจากต้อง upload model files (~150MB)

#### Deploy Hosting Only
```bash
firebase deploy --only hosting
```

#### Deploy All
```bash
firebase deploy
```

## 🔧 Configuration

### Firebase Functions Region

Default: `us-central1`

เปลี่ยนได้ที่ `functions/main.py`:
```python
@https_fn.on_request(
    cors=https_fn.CorsOptions(cors_origins="*", cors_methods=["POST"]),
    region="asia-southeast1"  # เปลี่ยนเป็น Asia
)
```

### Increase Function Memory (Recommended)

เพิ่มใน `firebase.json`:
```json
{
  "functions": [
    {
      "source": "functions",
      "codebase": "default",
      "runtime": "python313",
      "memory": "2GB",
      "timeout": 60
    }
  ]
}
```

## 📊 Performance Optimization

### 1. Model Loading
Model จะโหลดตอนเริ่มต้น Cloud Function (cold start ~5-10 วินาที)
- ใช้ **Keep Warm** strategy ด้วย Cloud Scheduler (เรียก function ทุก 5 นาที)

### 2. Reduce Cold Starts
```bash
# เพิ่ม min instances (Paid Plan)
firebase functions:config:set functions.min_instances=1
```

### 3. Image Compression
ลดขนาดภาพก่อนส่ง API:
```typescript
// ใน videoFrameToDataUrl()
return canvas.toDataURL('image/jpeg', 0.6); // ลด quality
```

## 🐛 Common Issues

### Error: "Module not found: tensorflow"

**Solution:**
```bash
cd functions
pip install -r requirements.txt --upgrade
```

### Error: "Model file not found"

**Solution:**
```bash
# ตรวจสอบว่าไฟล์อยู่ในตำแหน่งที่ถูกต้อง
ls -la functions/model/
```

### Error: "CORS blocked"

**Solution:** ตรวจสอบว่า CORS config ใน `main.py` ถูกต้อง:
```python
@https_fn.on_request(cors=https_fn.CorsOptions(
    cors_origins="*",
    cors_methods=["POST", "OPTIONS", "GET"]
))
```

### Error: "Function timeout"

**Solution:** เพิ่ม timeout ใน `firebase.json`:
```json
{
  "functions": [{
    "timeout": 120
  }]
}
```

## 💰 Cost Estimation

### Firebase Functions (Pay-as-you-go)

| Metric | Free Tier | Estimated Usage | Cost |
|--------|-----------|-----------------|------|
| Invocations | 2M/month | ~100K/month | Free |
| Compute Time | 400K GB-sec | ~50K GB-sec | ~$1-2 |
| Networking | 5GB | ~2GB | Free |

### Firebase Hosting

| Metric | Free Tier | Estimated Usage | Cost |
|--------|-----------|-----------------|------|
| Storage | 10GB | ~500MB | Free |
| Transfer | 360MB/day | ~100MB/day | Free |

**Total Estimated Cost**: ~$1-3/month (low usage)

## 📈 Monitoring

### View Logs
```bash
# Real-time logs
firebase functions:log --only process_frame,predict_sign

# Filter by error
firebase functions:log --only process_frame --filter "ERROR"
```

### Firebase Console
- Functions: https://console.firebase.google.com/project/signmate-cbe60/functions
- Hosting: https://console.firebase.google.com/project/signmate-cbe60/hosting

## 🔐 Security Rules

### Rate Limiting (Recommended)

เพิ่ม rate limiting ใน `main.py`:
```python
from functools import wraps
from time import time

request_counts = {}

def rate_limit(max_requests=10, window=60):
    def decorator(func):
        @wraps(func)
        def wrapper(req):
            ip = req.headers.get('X-Forwarded-For', req.remote_addr)
            now = time()
            
            if ip not in request_counts:
                request_counts[ip] = []
            
            # Remove old requests
            request_counts[ip] = [
                t for t in request_counts[ip] 
                if now - t < window
            ]
            
            if len(request_counts[ip]) >= max_requests:
                return https_fn.Response(
                    json.dumps({"error": "Rate limit exceeded"}),
                    status=429
                )
            
            request_counts[ip].append(now)
            return func(req)
        return wrapper
    return decorator

@https_fn.on_request(...)
@rate_limit(max_requests=30, window=60)
def process_frame(req):
    # ...
```

## 🎯 Next Steps

1. ✅ Test locally with emulators
2. ✅ Deploy functions to production
3. ✅ Deploy frontend to Firebase Hosting
4. 🔄 Monitor performance and costs
5. 🚀 Optimize based on usage patterns

## 📞 Support

- Firebase Documentation: https://firebase.google.com/docs
- TensorFlow Lite: https://www.tensorflow.org/lite
- MediaPipe: https://google.github.io/mediapipe/
