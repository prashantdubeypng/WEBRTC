import React, { useMemo, useContext,useEffect ,useState, useCallback} from "react";

// Create the context
const PeerContext = React.createContext(null);

// Custom hook to access the peer
export const usePeer = () => {
  return useContext(PeerContext);
};

// Provider component
export const PeerProvider = ({ children }) => {
  const peer = useMemo(() => {
    const peerConnection = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun3.l.google.com:19302' },
        { urls: 'stun:stun4.l.google.com:19302' },
        // OpenRelay Project STUN servers (more reliable)
        { urls: 'stun:openrelay.metered.ca:80' },
        // Alternative public STUN servers
        { urls: 'stun:stun.relay.metered.ca:80' }
      ],
      iceCandidatePoolSize: 10  // Generate more ICE candidates
    });
    
    // Log ICE connection state changes
    peerConnection.oniceconnectionstatechange = () => {
      console.log('ICE connection state:', peerConnection.iceConnectionState);
      
      // Handle failed connections
      if (peerConnection.iceConnectionState === 'failed') {
        console.log('ICE connection failed, attempting restart...');
        setStreamSent(false); // Reset stream state to allow re-sending
        peerConnection.restartIce();
      }
      
      // Reset stream state on disconnection to allow reconnection
      if (peerConnection.iceConnectionState === 'disconnected') {
        console.log('ICE connection disconnected, resetting stream state...');
        setStreamSent(false);
      }
    };
    
    peerConnection.onconnectionstatechange = () => {
      console.log('Connection state:', peerConnection.connectionState);
    };
    
    // Add ontrack event handler directly to peer connection
    peerConnection.ontrack = (event) => {
      console.log('🎥 Track event received:', event);
      console.log('Event streams:', event.streams);
      console.log('Event track:', event.track);
      
      if (event.streams && event.streams[0]) {
        console.log('✅ Setting remote stream from ontrack');
        // We'll handle this through the callback system
      } else {
        console.log('❌ No streams in track event');
      }
    };
    
    // Add more detailed ICE candidate logging
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('🧊 New ICE candidate:', event.candidate.type, event.candidate.protocol);
      } else {
        console.log('🧊 All ICE candidates have been sent');
      }
    };
    
    return peerConnection;
  }, []);
  
  const [streamSent, setStreamSent] = useState(false);
  const [remoteStream, setremoteStream] = useState(null);
  const createoffer = async () => {
    const offer = await peer.createOffer();
    await peer.setLocalDescription(offer);
    return offer;
  };
  const createAnswere = async(offer)=>{
    try {
      console.log('Creating answer for offer:', offer);
      
      // Validate offer object
      if (!offer || typeof offer !== 'object') {
        throw new Error('Invalid offer object');
      }
      
      if (!offer.type || !offer.sdp) {
        throw new Error('Offer missing type or sdp property');
      }
      
      await peer.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);
      return answer;
    } catch (error) {
      console.error('Error creating answer:', error);
      throw error;
    }
  }
  
  const setremoteanser = async (ans) => {
    try {
      console.log('Setting remote answer:', ans);
      
      // Validate answer object
      if (!ans || typeof ans !== 'object') {
        throw new Error('Invalid answer object');
      }
      
      if (!ans.type || !ans.sdp) {
        throw new Error('Answer missing type or sdp property');
      }
      
      await peer.setRemoteDescription(new RTCSessionDescription(ans));
    } catch (error) {
      console.error('Error setting remote answer:', error);
      throw error;
    }
  }
  const sendstream = async(stream) => {
    console.log('🎵 SENDSTREAM called - checking for duplicates...');
    
    if (streamSent) {
      console.log('⚠️ Stream already sent, skipping duplicate call');
      return;
    }
    
    console.log('📤 Adding stream to peer connection');
    const tracks = stream.getTracks();
    let tracksAdded = 0;
    
    for(const track of tracks) {
      // Check if track is already added to avoid duplicates
      const senders = peer.getSenders();
      const existingSender = senders.find(sender => sender.track === track);
      
      if (!existingSender) {
        console.log('✅ Adding NEW track:', track.kind);
        peer.addTrack(track, stream);
        tracksAdded++;
      } else {
        console.log('⚠️ Track already exists:', track.kind);
      }
    }
    
    if (tracksAdded > 0) {
      setStreamSent(true);
      console.log('✅ Stream sending complete. Tracks added:', tracksAdded);
    } else {
      console.log('⚠️ No new tracks were added');
    }
  };
  const handletrackevent = useCallback((ev) => {
    console.log('🎥 Track event received in handler:', ev);
    console.log('Event streams:', ev.streams);
    console.log('Event track kind:', ev.track?.kind);
    
    const streams = ev.streams;
    if (streams && streams[0]) {
      console.log('✅ Setting remote stream:', streams[0]);
      console.log('Stream tracks:', streams[0].getTracks().map(t => t.kind));
      setremoteStream(streams[0]);
    } else {
      console.log('❌ No streams in track event, creating new stream');
      // If no stream is provided, create one with the track
      const newStream = new MediaStream([ev.track]);
      console.log('✅ Created new stream with track:', newStream);
      setremoteStream(newStream);
    }
  }, []);
        
      useEffect(()=>{
        peer.addEventListener('track',handletrackevent);
        
        return ()=>{
          peer.removeEventListener('track',handletrackevent);
          
        }
      },[handletrackevent , peer])
  return (
    <PeerContext.Provider value={{ 
      peer, 
      createoffer, 
      createAnswere, 
      setremoteanser,
      sendstream, 
      remoteStream
    }}>
      {children}
    </PeerContext.Provider>
  );
};
