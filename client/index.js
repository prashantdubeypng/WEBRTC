// Load environment variables
require('dotenv').config();

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

// Debug endpoint to check active users (remove in production)
app.get('/api/debug/users', (req, res) => {
    const users = Array.from(socketemailmapping.entries()).map(([socketId, emailId]) => ({
        socketId: socketId.substring(0, 8) + '...', // Truncate for privacy
        emailId: emailId
    }));
    
    res.json({
        activeUsers: users.length,
        users: users,
        socketToEmail: Object.fromEntries(Array.from(socketemailmapping.entries()).map(([k,v]) => [k.substring(0,8)+'...', v])),
        emailToSocket: Object.fromEntries(Array.from(socketroomid.entries()).map(([k,v]) => [k, v.substring(0,8)+'...']))
    });
});

const PORT = process.env.PORT || 9001;

// Start HTTP server and Socket.IO
const server = require('http').createServer(app);
const io = new Server(server, {
    cors: {
        origin: [
            'http://localhost:3000',
            'https://webrtc-orpin.vercel.app/',  // Replace with your actual Vercel URL
            process.env.FRONTEND_URL
        ].filter(Boolean),
        methods: ["GET", "POST"],
        credentials: true
    },
});

const socketroomid = new Map();           // emailId -> socket.id
const socketemailmapping = new Map();     // socket.id -> emailId  
const sessionmapping = new Map();         // sessionId -> socket.id
const socketsessionmapping = new Map();   // socket.id -> sessionId

io.on('connection', (socket) => {
    console.log('new connection')
    socket.on('join-room', (data) => {
        const { emailId, RoomId, sessionId } = data;  // Add sessionId
        console.log(`${emailId} (session: ${sessionId}) joined room ${RoomId}`)
        
        // Check if user was already connected with different socket
        const existingSocketId = socketroomid.get(emailId);
        if (existingSocketId && existingSocketId !== socket.id) {
            console.log(`User ${emailId} rejoining - cleaning old socket ${existingSocketId}`);
            socketemailmapping.delete(existingSocketId);
            socketsessionmapping.delete(existingSocketId);
        }
        
        // Check if session was already connected with different socket
        const existingSessionSocket = sessionmapping.get(sessionId);
        if (existingSessionSocket && existingSessionSocket !== socket.id) {
            console.log(`Session ${sessionId} reconnecting - cleaning old socket ${existingSessionSocket}`);
            const oldEmail = socketemailmapping.get(existingSessionSocket);
            if (oldEmail) {
                socketroomid.delete(oldEmail);
            }
            socketemailmapping.delete(existingSessionSocket);
            socketsessionmapping.delete(existingSessionSocket);
        }
        
        // Update all mappings with current socket
        socketroomid.set(emailId, socket.id);
        socketemailmapping.set(socket.id, emailId);
        sessionmapping.set(sessionId, socket.id);
        socketsessionmapping.set(socket.id, sessionId);
        
        socket.join(RoomId);
        socket.emit('joined-room', { RoomId, reconnected: !!existingSocketId })
        socket.broadcast.to(RoomId).emit('user-joined', { emailId, reconnected: !!existingSocketId })
        
        console.log(`Active users: ${socketemailmapping.size}, Active sessions: ${sessionmapping.size}`);
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
    
    // Handle user disconnect - Clean up all mappings
    socket.on('disconnect', () => {
        const emailId = socketemailmapping.get(socket.id);
        const sessionId = socketsessionmapping.get(socket.id);
        
        if (emailId) {
            console.log(`User disconnected: ${emailId} (${socket.id}, session: ${sessionId})`);
            // Remove from all maps
            socketroomid.delete(emailId);
            socketemailmapping.delete(socket.id);
            if (sessionId) {
                sessionmapping.delete(sessionId);
                socketsessionmapping.delete(socket.id);
            }
            console.log(`Cleaned up mappings for ${emailId}`);
        } else {
            console.log(`Anonymous user disconnected: ${socket.id}`);
        }
    });
})

server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🌐 WebRTC app available at http://localhost:${PORT}`);
});
