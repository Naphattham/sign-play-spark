"""
Thai Sign Language Recognition API
✅ SEQUENCE_LENGTH = 40
✅ TARGET_FEATURES = 632 (pose+face_selected+hands + motion)
✅ Firebase Cloud Functions integration (Extreme Memory Optimized & CORS Fixed)
"""

from firebase_functions import https_fn, options
from firebase_admin import initialize_app
import os
import json
import base64
import pickle

# Initialize Firebase Admin
initialize_app()

# ============================================================
# CONFIG (Constants only)
# ============================================================
BASE_DIR        = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR       = os.path.join(BASE_DIR, "model")

POSE_POINTS     = 25
HAND_POINTS     = 21
EYEBROW_IDX     = [55, 65, 52, 53, 46, 285, 295, 282, 283, 276]
MOUTH_IDX       = [61,146,91,181,84,17,314,405,321,375,
                   78,95,88,178,87,14,317,402,318,324]
FACE_SELECTED   = EYEBROW_IDX + MOUTH_IDX
FACE_POINTS     = len(FACE_SELECTED)   # 30

BASE_FEATURES   = (POSE_POINTS * 4) + (FACE_POINTS * 3) + (HAND_POINTS * 3 * 2)
TARGET_FEATURES = BASE_FEATURES * 2   # 632
SEQUENCE_LENGTH = 40
PRED_THRESHOLD  = 0.5

# ============================================================
# ISOLATED LAZY LOADING (เพื่อป้องกัน RAM เต็ม)
# ============================================================
_classes_instance = None
_model_instance = None
_holistic_instance = None

_np = None
_cv2 = None
_mp = None
_tf = None

def get_np():
    global _np
    if _np is None:
        import numpy as np
        _np = np
    return _np

def get_cv2():
    global _cv2
    if _cv2 is None:
        import cv2
        _cv2 = cv2
    return _cv2

def get_mp():
    global _mp
    if _mp is None:
        import mediapipe as mp
        _mp = mp
    return _mp

def get_tf():
    global _tf
    if _tf is None:
        import tensorflow as tf
        # ตั้งค่าให้ GPU คืน Memory (ถ้ามี)
        gpus = tf.config.list_physical_devices('GPU')
        if gpus:
            try:
                for gpu in gpus:
                    tf.config.experimental.set_memory_growth(gpu, True)
                print(f"✅ Metal GPU: {len(gpus)}")
            except RuntimeError as e:
                print(e)
        else:
            print("ℹ️  CPU mode")
        _tf = tf
    return _tf

def get_classes():
    global _classes_instance
    if _classes_instance is None:
        print("📂 Loading classes...")
        with open(os.path.join(MODEL_DIR, "classes.pkl"), "rb") as f:
            _classes_instance = pickle.load(f)
    return _classes_instance

def get_model():
    global _model_instance
    if _model_instance is None:
        tf = get_tf()
        model_path = os.path.join(MODEL_DIR, "final_model.keras")
        print("📂 Loading TensorFlow Model...")
        _model_instance = tf.keras.models.load_model(model_path)
    return _model_instance

def get_holistic():
    global _holistic_instance
    if _holistic_instance is None:
        mp = get_mp()
        print("📂 Loading MediaPipe Holistic...")
        _holistic_instance = mp.solutions.holistic.Holistic(
            static_image_mode=False,
            model_complexity=1,
            smooth_landmarks=True,
            refine_face_landmarks=True,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5
        )
        print("✅ MediaPipe ready!")
    return _holistic_instance

# ============================================================
# HELPER FUNCTIONS 
# ============================================================
def normalize_frame(frame):
    np = get_np()
    frame = frame.copy()
    nose_x, nose_y = frame[0], frame[1]
    ls_x = frame[11*4]; ls_y = frame[11*4+1]
    rs_x = frame[12*4]; rs_y = frame[12*4+1]
    shoulder_dist = np.sqrt((ls_x-rs_x)**2 + (ls_y-rs_y)**2)
    if shoulder_dist == 0:
        shoulder_dist = 1.0
    for i in range(len(frame)):
        if i % 3 == 0:
            frame[i] = (frame[i] - nose_x) / shoulder_dist
        elif i % 3 == 1:
            frame[i] = (frame[i] - nose_y) / shoulder_dist
    return frame

def hand_relative(frame):
    frame = frame.copy()
    pose_offset = POSE_POINTS * 4
    face_offset = pose_offset + FACE_POINTS * 3
    left_start  = face_offset
    right_start = face_offset + HAND_POINTS * 3

    lw_x, lw_y = frame[left_start], frame[left_start+1]
    rw_x, rw_y = frame[right_start], frame[right_start+1]

    for i in range(HAND_POINTS):
        idx = left_start + i*3
        frame[idx] -= lw_x; frame[idx+1] -= lw_y
    for i in range(HAND_POINTS):
        idx = right_start + i*3
        frame[idx] -= rw_x; frame[idx+1] -= rw_y
    return frame

def extract_frame(frame_bgr, holistic):
    cv2 = get_cv2()
    np = get_np()
    rgb = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2RGB)
    results = holistic.process(rgb)
    kp = []

    if results.pose_landmarks:
        for i in range(POSE_POINTS):
            lm = results.pose_landmarks.landmark[i]
            kp.extend([lm.x, lm.y, lm.z, lm.visibility])
    else:
        kp.extend([0.0] * (POSE_POINTS * 4))

    if results.face_landmarks:
        for idx in FACE_SELECTED:
            lm = results.face_landmarks.landmark[idx]
            kp.extend([lm.x, lm.y, lm.z])
    else:
        kp.extend([0.0] * (FACE_POINTS * 3))

    for hand in [results.left_hand_landmarks, results.right_hand_landmarks]:
        if hand:
            for lm in hand.landmark:
                kp.extend([lm.x, lm.y, lm.z])
        else:
            kp.extend([0.0] * (HAND_POINTS * 3))

    return np.array(kp, dtype=np.float32), results

def process_buffer(raw_buf):
    np = get_np()
    seq = np.array(raw_buf, dtype=np.float32)
    seq = np.array([normalize_frame(f) for f in seq])
    seq = np.array([hand_relative(f) for f in seq])

    smoothed = seq.copy()
    for i in range(1, len(seq)-1):
        smoothed[i] = (seq[i-1] + seq[i] + seq[i+1]) / 3
    seq = smoothed

    motion = np.zeros_like(seq)
    for i in range(1, len(seq)):
        motion[i] = seq[i] - seq[i-1]

    return np.concatenate([seq, motion], axis=1)

# ============================================================
# CLOUD FUNCTION: Process Frame (DEPRECATED)
# ============================================================
@https_fn.on_request(
    cors=options.CorsOptions(cors_origins="*", cors_methods=["POST", "OPTIONS"]),
    memory=options.MemoryOption.GB_2
)
def process_frame(req: https_fn.Request) -> https_fn.Response:
    if req.method == "OPTIONS":
        return https_fn.Response(status=204)

    try:
        cv2 = get_cv2()
        np = get_np()
        
        data = req.get_json(silent=True, force=True)
        if not data or "frame" not in data:
            return https_fn.Response(
                json.dumps({"error": "No frame data provided"}), 
                status=400, 
                mimetype="application/json"
            )
        
        img_data = base64.b64decode(data["frame"].split(',')[1] if ',' in data["frame"] else data["frame"])
        nparr = np.frombuffer(img_data, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if frame is None:
            return https_fn.Response(
                json.dumps({"error": "Invalid image data"}), 
                status=400, 
                mimetype="application/json"
            )
        
        holistic = get_holistic()
        keypoints, _ = extract_frame(frame, holistic)
        
        return https_fn.Response(
            json.dumps({"keypoints": keypoints.tolist(), "success": True}),
            status=200, 
            mimetype="application/json"
        )
        
    except Exception as e:
        return https_fn.Response(
            json.dumps({"error": str(e), "success": False}), 
            status=500, 
            mimetype="application/json"
        )

# ============================================================
# CLOUD FUNCTION: Predict Sign 
# ============================================================
@https_fn.on_request(
    cors=options.CorsOptions(cors_origins="*", cors_methods=["POST", "OPTIONS"]),
    memory=options.MemoryOption.GB_4
)
def predict_sign(req: https_fn.Request) -> https_fn.Response:
    if req.method == "OPTIONS":
        return https_fn.Response(status=204)

    try:
        np = get_np()
        
        data = req.get_json(silent=True, force=True)
        if not data or "keypoints_buffer" not in data:
            return https_fn.Response(
                json.dumps({"error": "No keypoints buffer provided"}), 
                status=400, 
                mimetype="application/json"
            )
        
        raw_buffer = np.array(data["keypoints_buffer"], dtype=np.float32)
        
        if len(raw_buffer) != SEQUENCE_LENGTH:
            return https_fn.Response(
                json.dumps({"error": f"Expected {SEQUENCE_LENGTH} frames, got {len(raw_buffer)}"}), 
                status=400, 
                mimetype="application/json"
            )
        
        model = get_model()
        classes = get_classes()
        
        seq = process_buffer(list(raw_buffer))
        probs = model.predict(np.expand_dims(seq, 0), verbose=0)[0]
        top3_idx = np.argsort(probs)[-3:][::-1]
        
        top3 = [{"class": classes[i], "confidence": float(probs[i])} for i in top3_idx]
        
        return https_fn.Response(
            json.dumps({"prediction": classes[top3_idx[0]], "confidence": float(probs[top3_idx[0]]), "top3": top3, "success": True}),
            status=200, 
            mimetype="application/json"
        )
        
    except Exception as e:
        return https_fn.Response(
            json.dumps({"error": str(e), "success": False}), 
            status=500, 
            mimetype="application/json"
        )

# ============================================================
# CLOUD FUNCTION: Get Model Info (WARM-UP ENDPOINT)
# ============================================================
@https_fn.on_request(
    cors=options.CorsOptions(cors_origins="*", cors_methods=["GET", "OPTIONS"]),
    memory=options.MemoryOption.GB_4  # 🚨 เพิ่ม RAM เป็น 4GB เพราะฟังก์ชันนี้ต้องโหลด Model แล้ว
)
def get_model_info(req: https_fn.Request) -> https_fn.Response:
    if req.method == "OPTIONS":
        return https_fn.Response(status=204)

    classes = get_classes()
    
    # 🚨 บังคับโหลด TensorFlow Model ขึ้นมาบน RAM ทันที
    # ทำให้ตอนผู้ใช้กด Predict ครั้งแรก จะไม่มีอาการค้าง (Cold Start)
    get_model()

    return https_fn.Response(
        json.dumps({
            "classes": classes,
            "num_classes": len(classes),
            "sequence_length": SEQUENCE_LENGTH,
            "features": TARGET_FEATURES,
            "success": True
        }),
        status=200,
        mimetype="application/json"
    )