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
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    });
    
    // Log ICE connection state changes
    peerConnection.oniceconnectionstatechange = () => {
      console.log('ICE connection state:', peerConnection.iceConnectionState);
    };
    
    peerConnection.onconnectionstatechange = () => {
      console.log('Connection state:', peerConnection.connectionState);
    };
    
    return peerConnection;
  }, []);
  
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
    console.log('Adding stream to peer connection');
    const tracks = stream.getTracks();
    for(const track of tracks) {
      // Check if track is already added to avoid duplicates
      const senders = peer.getSenders();
      const existingSender = senders.find(sender => sender.track === track);
      
      if (!existingSender) {
        console.log('Adding track:', track.kind);
        peer.addTrack(track, stream);
      } else {
        console.log('Track already added:', track.kind);
      }
    }
  };
  const handletrackevent = useCallback((ev) => {
    console.log('Track event received:', ev);
    const streams = ev.streams;
    if (streams && streams[0]) {
      console.log('Setting remote stream');
      setremoteStream(streams[0]);
    } else {
      console.log('No streams in track event');
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
