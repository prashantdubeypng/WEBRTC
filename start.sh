#!/bin/bash

echo "🚀 Starting WebRTC Application..."
echo "📦 Installing dependencies..."

# Install root dependencies
npm install

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd client
npm install
cd ..

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd frontend
npm install
cd ..

echo "🔨 Building frontend..."
cd frontend
npm run build
cd ..

echo "🎬 Starting application..."
npm run dev
