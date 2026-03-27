#!/usr/bin/env bash
# =============================================================================
# convert_to_hls.sh
# Converts every MP4 inside public/videos/**/ to optimised HLS and uploads
# to Firebase Storage under gs://<BUCKET>/videos/
#
# Usage:
#   chmod +x scripts/convert_to_hls.sh
#   FIREBASE_BUCKET=your-project.appspot.com ./scripts/convert_to_hls.sh
#
# Prerequisites:
#   brew install ffmpeg
#   npm install -g firebase-tools   (already logged-in: firebase login)
# =============================================================================

set -euo pipefail

# ── Config ──────────────────────────────────────────────────────────────────
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
VIDEOS_DIR="$PROJECT_ROOT/public/videos"
HLS_OUT_DIR="$PROJECT_ROOT/public/hls"
BUCKET="${FIREBASE_BUCKET:-}"          # e.g. your-project.appspot.com
SEGMENT_DURATION=6                     # seconds per .ts chunk
VIDEO_BITRATE="800k"                   # target video bitrate
AUDIO_BITRATE="96k"                    # target audio bitrate
MAX_WIDTH=720                          # downscale width (keeps aspect ratio)

if [[ -z "$BUCKET" ]]; then
  echo "❌  Please set FIREBASE_BUCKET env var (e.g. your-project.appspot.com)"
  exit 1
fi

command -v ffmpeg  >/dev/null || { echo "❌  ffmpeg not found. Run: brew install ffmpeg"; exit 1; }
command -v gsutil  >/dev/null || command -v firebase >/dev/null || {
  echo "❌  Neither gsutil nor firebase CLI found."; exit 1;
}

mkdir -p "$HLS_OUT_DIR"
mkdir -p "$VIDEOS_DIR"

# ── Process each MP4 ────────────────────────────────────────────────────────
# เข้าไปในโฟลเดอร์ videos ก่อน เพื่อให้ find คืนค่าเป็น Path สั้นๆ ป้องกันปัญหาเว้นวรรคและ Path ซ้อน
cd "$VIDEOS_DIR"

find . -type f -name "*.mp4" | while IFS= read -r RELATIVE_DOT; do
  RELATIVE="${RELATIVE_DOT#./}"                    # ตัด ./ ด้านหน้าออก e.g. general/สวัสดี.mp4
  INPUT_FILE="$VIDEOS_DIR/$RELATIVE"               # ประกอบกลับเป็น Path เต็มที่ถูกต้อง
  CATEGORY="$(dirname "$RELATIVE")"                # e.g. general
  BASENAME="$(basename "$RELATIVE" .mp4)"          # e.g. สวัสดี
  
  # If iconv can't transliterate Thai chars, keep original name – Firebase Storage handles Unicode fine
  SAFE_NAME="$BASENAME"

  OPTIMISED="$HLS_OUT_DIR/$CATEGORY/${SAFE_NAME}/optimized.mp4"
  HLS_DIR="$HLS_OUT_DIR/$CATEGORY/${SAFE_NAME}"
  PLAYLIST="$HLS_DIR/index.m3u8"

  mkdir -p "$HLS_DIR"

  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "📹  Processing: $RELATIVE"

  # ── Step 1: Optimise MP4 ──────────────────────────────────────────────────
  if [[ ! -f "$OPTIMISED" ]]; then
    echo "   ⚙️  Optimising → $OPTIMISED"
    ffmpeg -y -i "$INPUT_FILE" \
      -vf "scale='min($MAX_WIDTH,iw)':-2" \
      -c:v libx264 -preset slow -crf 23 \
      -b:v "$VIDEO_BITRATE" -maxrate "$VIDEO_BITRATE" -bufsize "1600k" \
      -c:a aac -b:a "$AUDIO_BITRATE" \
      -movflags +faststart \
      -loglevel warning \
      "$OPTIMISED"
    echo "   ✅  Optimised"
  else
    echo "   ⏭️  optimized.mp4 already exists – skipping optimisation"
  fi

  # ── Step 2: Convert to HLS ────────────────────────────────────────────────
  if [[ ! -f "$PLAYLIST" ]]; then
    echo "   📦  Converting to HLS (${SEGMENT_DURATION}s segments)…"
    ffmpeg -y -i "$OPTIMISED" \
      -c:v copy -c:a copy \
      -hls_time "$SEGMENT_DURATION" \
      -hls_list_size 0 \
      -hls_segment_filename "$HLS_DIR/segment_%03d.ts" \
      -hls_flags independent_segments \
      -f hls \
      -loglevel warning \
      "$PLAYLIST"
    echo "   ✅  HLS segments created"
  else
    echo "   ⏭️  index.m3u8 already exists – skipping HLS conversion"
  fi

  # ── Step 3: Upload to Firebase Storage ───────────────────────────────────
  REMOTE_PATH="videos/$CATEGORY/$SAFE_NAME"
  echo "   ☁️  Uploading → gs://$BUCKET/$REMOTE_PATH/"

  if command -v gsutil >/dev/null; then
    gsutil -m -h "Cache-Control:public,max-age=31536000" \
      cp -r "$HLS_DIR"/* "gs://$BUCKET/$REMOTE_PATH/"
  else
    # Firebase CLI fallback (slower but works without gcloud)
    firebase storage:upload \
      --bucket "$BUCKET" \
      --destination "$REMOTE_PATH" \
      "$HLS_DIR" \
      --recursive 2>/dev/null || {
        echo "   ⚠️  firebase CLI upload failed – try installing gsutil or use the console"
      }
  fi

  echo "   ✅  Upload complete"
  echo "   🔗  URL: https://storage.googleapis.com/$BUCKET/$REMOTE_PATH/index.m3u8"

done

echo ""
echo "🎉  All videos processed!"
echo ""
echo "📋  Next steps:"
echo "    1. Deploy updated storage.rules: firebase deploy --only storage"
echo "    2. Apply CORS settings:          gsutil cors set scripts/cors.json gs://$BUCKET"
echo "    3. Use the HLSVideoPlayer component with the Firebase Storage URLs above."