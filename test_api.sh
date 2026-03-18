#!/bin/bash

# Test Script for Sign Language Recognition API
# Usage: ./test_api.sh [local|prod]

ENV=${1:-local}

if [ "$ENV" = "local" ]; then
    BASE_URL="http://127.0.0.1:5001/signmate-cbe60/us-central1"
    echo "🧪 Testing LOCAL API: $BASE_URL"
else
    BASE_URL="https://us-central1-signmate-cbe60.cloudfunctions.net"
    echo "🧪 Testing PRODUCTION API: $BASE_URL"
fi

echo ""
echo "=================================="
echo "1️⃣  Testing: GET /get_model_info"
echo "=================================="
curl -X GET "$BASE_URL/get_model_info" | jq '.'

echo ""
echo ""
echo "=================================="
echo "2️⃣  Testing: POST /process_frame"
echo "=================================="
echo "Note: This requires a base64 image"
echo "Skipping (manual test required)"

echo ""
echo ""
echo "=================================="
echo "3️⃣  Testing: POST /predict_sign"
echo "=================================="
echo "Note: This requires 40 frames of keypoints"
echo "Skipping (manual test required)"

echo ""
echo ""
echo "✅ Basic API health check complete!"
echo ""
echo "📝 To test process_frame and predict_sign:"
echo "   1. Start the frontend: npm run dev"
echo "   2. Open browser to http://localhost:5173"
echo "   3. Start a game and allow camera access"
echo "   4. Check browser console for API calls"
echo ""
