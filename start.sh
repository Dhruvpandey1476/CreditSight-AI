#!/bin/bash
# CreditSight — One-command startup

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  CreditSight — Alternative Credit AI"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check .env
if [ ! -f .env ]; then
  echo "⚠  .env not found — copying from .env.example"
  cp .env.example .env
  echo "👉 Edit .env and add your ANTHROPIC_API_KEY"
  exit 1
fi

export $(grep -v '^#' .env | xargs)

# Generate data if not present
if [ ! -f backend/data/synthetic_borrowers.csv ]; then
  echo "📊 Generating synthetic dataset..."
  cd backend && python data/generate_data.py && cd ..
fi

# Train model if not present
if [ ! -f backend/models/xgb_credit_model.json ]; then
  echo "🤖 Training XGBoost model..."
  cd backend && python models/train_model.py && cd ..
fi

# Start backend
echo "🚀 Starting FastAPI backend on :8000"
cd backend && python run.py &
BACKEND_PID=$!
cd ..

sleep 4

# Start frontend
echo "⚡ Starting React frontend on :3000"
cd frontend && npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ✅ CreditSight is running!"
echo "  🌐 Frontend: http://localhost:3000"
echo "  🔌 API Docs: http://localhost:8000/docs"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

trap "kill $BACKEND_PID $FRONTEND_PID" EXIT
wait
