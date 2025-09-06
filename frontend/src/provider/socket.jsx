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
    // Use same port in production, different port in development
    const socketUrl = process.env.NODE_ENV === 'production' 
      ? window.location.origin  // Same port as the server
      : "http://localhost:9001"; // Different port in development
    
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
