// Session management utility
export const SessionManager = {
  // Generate a unique user session ID
  generateSessionId: () => {
    return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  },

  // Get or create user session
  getUserSession: (emailId) => {
    const sessionKey = `webrtc_session_${emailId}`;
    let session = localStorage.getItem(sessionKey);
    
    if (!session) {
      session = JSON.stringify({
        sessionId: SessionManager.generateSessionId(),
        emailId: emailId,
        createdAt: Date.now(),
        lastActive: Date.now()
      });
      localStorage.setItem(sessionKey, session);
    }
    
    const sessionData = JSON.parse(session);
    // Update last active time
    sessionData.lastActive = Date.now();
    localStorage.setItem(sessionKey, JSON.stringify(sessionData));
    
    return sessionData;
  },

  // Clear user session
  clearSession: (emailId) => {
    const sessionKey = `webrtc_session_${emailId}`;
    localStorage.removeItem(sessionKey);
  },

  // Check if session is still valid (24 hours)
  isSessionValid: (sessionData) => {
    const twentyFourHours = 24 * 60 * 60 * 1000;
    return (Date.now() - sessionData.createdAt) < twentyFourHours;
  }
};
