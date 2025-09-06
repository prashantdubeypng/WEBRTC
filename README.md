# WebRTC Video Calling App 🎥

A modern WebRTC video calling application with real-time peer-to-peer communication.

## Features ✨

- 🎨 Modern animated landing page
- 📹 High-quality video calling
- 🔄 Real-time signaling with Socket.io
- 📱 Responsive design
- 🚀 Production-ready deployment

## Architecture

- **Frontend**: React.js deployed on Vercel
- **Backend**: Node.js/Express with Socket.io deployed on Render
- **WebRTC**: Peer-to-peer video communication

## Local Development

### Prerequisites
- Node.js 16+ 
- npm or yarn

### Setup

1. Clone the repository:
```bash
git clone https://github.com/prashantdubeypng/WEBRTC.git
cd WEBRTC
```

2. Install dependencies:
```bash
npm run install:all
```

3. Start development servers:
```bash
npm run dev
```

- Frontend: http://localhost:3000
- Backend: http://localhost:9001

## Deployment

### Frontend (Vercel)

1. Fork/clone this repository
2. Connect your GitHub repo to Vercel
3. Set build settings:
   - **Build Command**: `cd frontend && npm run build`
   - **Output Directory**: `frontend/build`
   - **Root Directory**: `frontend`
4. Add environment variables:
   - `REACT_APP_BACKEND_URL`: Your Render backend URL

### Backend (Render)

1. Connect your GitHub repo to Render
2. Create a new Web Service
3. Set build settings:
   - **Build Command**: `cd client && npm install`
   - **Start Command**: `cd client && npm start`
4. Add environment variables:
   - `NODE_ENV`: `production`
   - `FRONTEND_URL`: Your Vercel frontend URL

## Environment Variables

### Frontend (.env)
```
REACT_APP_BACKEND_URL=https://your-backend.onrender.com
```

### Backend (Render)
```
NODE_ENV=production
FRONTEND_URL=https://your-frontend.vercel.app
PORT=10000
```

## Technology Stack

### Frontend
- React 18
- React Router
- Socket.io Client
- WebRTC APIs
- Modern CSS with animations

### Backend  
- Node.js
- Express.js
- Socket.io
- CORS configuration

## How It Works

1. **Landing Page**: Users see an animated landing page
2. **Room Creation**: Users can create or join video call rooms
3. **WebRTC Signaling**: Backend facilitates peer discovery and connection
4. **Video Calling**: Direct peer-to-peer video communication
5. **Real-time Communication**: Socket.io handles signaling messages

## Scripts

- `npm run dev` - Start development servers
- `npm run build` - Build production frontend
- `npm run start` - Start production server
- `npm run install:all` - Install all dependencies

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes  
4. Push to the branch
5. Create a Pull Request

## License

MIT License - see LICENSE file for details

---

Built with ❤️ by [prashantdubeypng](https://github.com/prashantdubeypng)
