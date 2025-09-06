import React, { useMemo, useContext } from "react";
import { io } from "socket.io-client";
import { SessionManager } from "../utils/sessionManager";

// Create context
const SocketContext = React.createContext(null);

// Custom hook to use socket
export const useSocket = () => {
  return useContext(SocketContext);
};

// Provider component
export const SocketProvider = ({ children }) => {
  const socket = useMemo(() => {
    // Use environment variable for backend URL in production, localhost in development
    const socketUrl = process.env.NODE_ENV === 'production' 
      ? process.env.REACT_APP_BACKEND_URL || 'https://webrtc-backend-pcf7.onrender.com'  // Your Render backend URL
      : "http://localhost:9001"; // Development backend
    
    const socketInstance = io(socketUrl, {
      transports: ["websocket"],
    });
    
    // Add session persistence
    socketInstance.joinRoomWithSession = (emailId, roomId) => {
      const session = SessionManager.getUserSession(emailId);
      console.log('Joining room with session:', session);
      
      socketInstance.emit('join-room', {
        emailId,
        RoomId: roomId,
        sessionId: session.sessionId
      });
    };
    
    return socketInstance;
  }, []);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};
