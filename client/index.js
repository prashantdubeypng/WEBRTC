const express = require('express')
const path = require('path')
const app = express()
const parser = require('body-parser')
const { Server } = require('socket.io')

app.use(parser.json())

// Serve static files from the React app build folder
app.use(express.static(path.join(__dirname, '../frontend/build')))

// Handle React routing, return all requests to React app
app.use((req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/build/index.html'))
})

const PORT = process.env.PORT || 9001;

// Start both HTTP server and Socket.IO on the same port
const server = require('http').createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
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
