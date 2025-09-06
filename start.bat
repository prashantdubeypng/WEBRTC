@echo off
echo 🚀 Starting WebRTC Application...
echo 📦 Installing dependencies...

REM Install root dependencies
call npm install

REM Install backend dependencies
echo 📦 Installing backend dependencies...
cd client
call npm install
cd ..

REM Install frontend dependencies
echo 📦 Installing frontend dependencies...
cd frontend
call npm install
cd ..

echo 🔨 Building frontend...
cd frontend
call npm run build
cd ..

echo 🎬 Starting application...
call npm run dev
