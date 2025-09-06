const express = require('express')
const path = require('path')
const app = express()
const parser = require('body-parser')
const { Server } = require('socket.io')

app.use(parser.json())

// CORS middleware for API endpoints
app.use((req, res, next) => {
    const allowedOrigins = [
        'http://localhost:3000',
        'https://your-frontend-name.vercel.app',  // Replace with your actual Vercel URL
        process.env.FRONTEND_URL
    ].filter(Boolean);
    
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }
    
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
        return;
    }
    
    next();
});

// Health check endpoint for Render
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// API endpoint to get server info
app.get('/api/info', (req, res) => {
    res.json({ 
        message: 'WebRTC Signaling Server', 
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development'
    });
});

const PORT = process.env.PORT || 9001;

// Start HTTP server and Socket.IO
const server = require('http').createServer(app);
const io = new Server(server, {
    cors: {
        origin: [
            'http://localhost:3000',
            'https://your-frontend-name.vercel.app',  // Replace with your actual Vercel URL
            process.env.FRONTEND_URL
        ].filter(Boolean),
        methods: ["GET", "POST"],
        credentials: true
    },
});

const socketroomid = new Map();
const socketemailmapping = new Map();

io.on('connection', (socket) => {
    console.log('new connection')
    socket.on('join-room', (data) => {
        const { emailId, RoomId } = data;
        console.log(emailId, 'joined-room', RoomId)
        socketroomid.set(emailId, socket.id)
        socketemailmapping.set(socket.id, emailId)
        socket.join(RoomId);
        socket.emit('joined-room', { RoomId })
        socket.broadcast.to(RoomId).emit('user-joined', { emailId })
    })
    
    socket.on('call-user', data => {
        const { emailId, offer } = data;
        console.log('Forwarding call from', socketemailmapping.get(socket.id), 'to', emailId);
        console.log('Offer data:', offer);
        
        const socketId = socketroomid.get(emailId);
        const fromcall = socketemailmapping.get(socket.id);
        
        if (!socketId) {
            console.log('Target user not found:', emailId);
            return;
        }
        
        socket.to(socketId).emit('incoming-call', { from: fromcall, offer });
    });
    
    socket.on('call-accepted', (data) => {
        const { emailId, ans } = data;
        console.log('Call accepted by', socketemailmapping.get(socket.id), 'sending to', emailId);
        console.log('Answer data:', ans);
        
        const socketId = socketroomid.get(emailId);
        
        if (!socketId) {
            console.log('Target user not found:', emailId);
            return;
        }
        
        socket.to(socketId).emit("call-accepted", { ans });
    })
    
    // Handle ICE candidates
    socket.on('ice-candidate', (data) => {
        const { emailId, candidate } = data;
        const socketId = socketroomid.get(emailId);
        const fromUser = socketemailmapping.get(socket.id);
        
        if (!socketId) {
            console.log('Target user not found for ICE candidate:', emailId);
            return;
        }
        
        console.log('Forwarding ICE candidate from', fromUser, 'to', emailId);
        socket.to(socketId).emit('ice-candidate', { from: fromUser, candidate });
    });
})

server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🌐 WebRTC app available at http://localhost:${PORT}`);
});
