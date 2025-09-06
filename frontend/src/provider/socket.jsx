import React, { useMemo, useContext } from "react";
import { io } from "socket.io-client";

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
      ? process.env.REACT_APP_BACKEND_URL || 'https://your-backend-name.onrender.com'  // Your Render backend URL
      : "http://localhost:9001"; // Development backend
    
    return io(socketUrl, {
      transports: ["websocket"],
    });
  }, []);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};
