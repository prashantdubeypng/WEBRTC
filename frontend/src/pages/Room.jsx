import React, { useEffect, useCallback, useState, useRef } from 'react';
import {useSocket} from '../provider/socket'
import {usePeer} from '../provider/peer'
import './Room.css'
const Roompage = ()=>{
    const socket = useSocket();
    const {peer,createoffer, createAnswere, setremoteanser , sendstream, remoteStream} = usePeer();
    const [mystream, setMystream] = useState(null);
    const [remoteEmailId , setremoteEmailId] = useState(null)
    const videoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const hadlenewUserjoined = useCallback( async(data)=>{
        const {emailId} =data;
        console.log('🔷 NEW USER JOINED:', emailId);
        console.log('🔷 My stream available:', !!mystream);
        
        // Ensure we have our stream before sending it
        if (!mystream) {
            console.log('⚠️ No stream available yet, retrying in 1 second...');
            setTimeout(() => {
                if (mystream) {
                    console.log('✅ Stream now available, retrying connection to', emailId);
                    hadlenewUserjoined(data); // Retry
                } else {
                    console.log('❌ Stream still not available after retry');
                }
            }, 1000);
            return;
        }
        
        // Send our stream first, then create offer
        console.log('📹 Sending our stream to new user');
        await sendstream(mystream);
        
        console.log('📞 Creating offer for new user');
        const offer = await createoffer();
        console.log('📤 Sending offer:', offer);
        socket.emit('call-user', { emailId, offer: { type: offer.type, sdp: offer.sdp } });
        setremoteEmailId(emailId);
    },[createoffer, socket, mystream, sendstream])
    
    const handleincomingcall = useCallback(async(data)=>{
        try {
            const { from, offer } = data;
            console.log('🔵 INCOMING CALL from:', from);
            console.log('🔵 My stream available:', !!mystream);
            console.log('🔵 Received offer:', offer);
            
            // Validate offer data
            if (!offer || !offer.type || !offer.sdp) {
                console.error('❌ Invalid offer received:', offer);
                return;
            }
            
            // Ensure we have our stream before responding
            if (!mystream) {
                console.log('⚠️ No stream available for response, retrying in 1 second...');
                setTimeout(() => {
                    if (mystream) {
                        console.log('✅ Stream now available, retrying call handling');
                        handleincomingcall(data); // Retry
                    } else {
                        console.log('❌ Stream still not available after retry');
                    }
                }, 1000);
                return;
            }
            
            // Send our stream before creating answer
            console.log('📹 Sending our stream in response to incoming call');
            await sendstream(mystream);
            
            console.log('📞 Creating answer');
            const ans = await createAnswere(offer);
            console.log('📤 Sending answer:', ans);
            socket.emit('call-accepted', { emailId: from, ans: { type: ans.type, sdp: ans.sdp } });
            setremoteEmailId(from);
        } catch (error) {
            console.error('❌ Error handling incoming call:', error);
        }
    },[createAnswere, socket, mystream, sendstream])
    
    const handlecallaccepted = useCallback (async(data)=>{
        try {
            const { ans } = data;
            console.log('call get accepted');
            console.log('Received answer:', ans);
            
            // Validate answer data
            if (!ans || !ans.type || !ans.sdp) {
                console.error('Invalid answer received:', ans);
                return;
            }
            
            await setremoteanser(ans);
        } catch (error) {
            console.error('Error handling call accepted:', error);
        }
    },[setremoteanser])
    
    const handleIceCandidate = useCallback((data) => {
        const { candidate } = data;
        if (candidate) {
            peer.addIceCandidate(new RTCIceCandidate(candidate))
                .catch(error => console.error('Error adding ICE candidate:', error));
        }
    }, [peer]);
    
    // Setup ICE candidate handling
    useEffect(() => {
        const handleIceCandidateEvent = (event) => {
            if (event.candidate && remoteEmailId) {
                console.log('Sending ICE candidate');
                socket.emit('ice-candidate', {
                    emailId: remoteEmailId,
                    candidate: event.candidate
                });
            }
        };
        
        peer.addEventListener('icecandidate', handleIceCandidateEvent);
        
        return () => {
            peer.removeEventListener('icecandidate', handleIceCandidateEvent);
        };
    }, [peer, socket, remoteEmailId]);
    const getUserMediaStream = useCallback(async()=>{
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: true, 
                video: true 
            });
            console.log('Got user media stream');
            setMystream(stream);
        } catch (error) {
            console.error('Error accessing media devices:', error);
            // Try with just video if both fail
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                console.log('Got video-only stream');
                setMystream(stream);
            } catch (videoError) {
                console.error('Error accessing video:', videoError);
            }
        }
    }, [])
    useEffect(()=>{
        socket.on('user-joined',hadlenewUserjoined)
        socket.on('incoming-call',handleincomingcall)
        socket.on('call-accepted',handlecallaccepted)
        socket.on('ice-candidate', handleIceCandidate)
        return () => {
            socket.off('user-joined', hadlenewUserjoined);
            socket.off('incoming-call', handleincomingcall);
            socket.off('call-accepted',handlecallaccepted);
            socket.off('ice-candidate', handleIceCandidate);
        };
    },[socket, hadlenewUserjoined, handleincomingcall, handlecallaccepted, handleIceCandidate])
    useEffect(() => {
        getUserMediaStream();
        // Only run once on mount
    }, [getUserMediaStream]);
    
    // Send stream when it becomes available and ensure bi-directional sharing
    useEffect(() => {
        if (mystream) {
            console.log('📹 Stream available, adding to peer connection');
            sendstream(mystream);
            
            // If we have a remote user connected, ensure they get our new stream
            if (remoteEmailId) {
                console.log('🔄 Re-sharing stream with connected remote user:', remoteEmailId);
                // You might need to renegotiate here for the new stream
            }
        }
    }, [mystream, sendstream, remoteEmailId]);

    useEffect(() => {
        if (mystream && videoRef.current) {
            videoRef.current.srcObject = mystream;
            videoRef.current.onloadedmetadata = () => {
                videoRef.current.play();
            };
        }
    }, [mystream]);
    useEffect(() => {
        if (remoteStream && remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = remoteStream;
            remoteVideoRef.current.onloadedmetadata = () => {
                remoteVideoRef.current.play();
            };
        }
    }, [remoteStream]);

    return(
        <div className = 'room-container'>
            <div className="room-header">
                <div className="header-left">
                    <h1>ConnectSphere</h1>
                    <div className="room-info">
                        <span className="room-id">Room: {window.location.pathname.split('/')[2]}</span>
                        {remoteEmailId && (
                            <span className="connection-status">
                                <div className="status-dot"></div>
                                Connected to {remoteEmailId}
                            </span>
                        )}
                    </div>
                </div>
                <div className="header-right">
                    <div className="participant-count">
                        <span className="count-icon">👥</span>
                        <span>{remoteStream ? '2' : '1'} participants</span>
                    </div>
                </div>
            </div>
            
            <div className="video-grid">
                <div className="video-wrapper local-video">
                    <video ref={videoRef} autoPlay playsInline muted />
                    <div className="video-overlay">
                        <div className="video-label">
                            <span className="user-icon">👤</span>
                            You
                        </div>
                        <div className="video-controls-mini">
                            <button className="mini-control muted">🎤</button>
                        </div>
                    </div>
                </div>
                
                {remoteStream ? (
                    <div className="video-wrapper remote-video">
                        <video ref={remoteVideoRef} autoPlay playsInline />
                        <div className="video-overlay">
                            <div className="video-label">
                                <span className="user-icon">👤</span>
                                {remoteEmailId || 'Remote User'}
                            </div>
                            <div className="connection-quality">
                                <div className="quality-bars">
                                    <div className="bar active"></div>
                                    <div className="bar active"></div>
                                    <div className="bar active"></div>
                                    <div className="bar"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="video-wrapper waiting-user">
                        <div className="waiting-content">
                            <div className="waiting-animation">
                                <div className="pulse-ring"></div>
                                <div className="pulse-ring delay-1"></div>
                                <div className="pulse-ring delay-2"></div>
                                <div className="waiting-icon">📞</div>
                            </div>
                            <h3>Waiting for others to join...</h3>
                            <p>Share this room link to invite participants</p>
                            <button className="copy-link-btn" onClick={() => navigator.clipboard.writeText(window.location.href)}>
                                📋 Copy Room Link
                            </button>
                        </div>
                    </div>
                )}
            </div>
            
            <div className="room-controls">
                <div className="controls-left">
                    <button className="control-btn mute-btn" title="Mute/Unmute">
                        <span className="btn-icon">🎤</span>
                        <span className="btn-label">Mute</span>
                    </button>
                    <button className="control-btn video-btn" title="Camera On/Off">
                        <span className="btn-icon">📹</span>
                        <span className="btn-label">Camera</span>
                    </button>
                    <button className="control-btn share-btn" title="Share Screen">
                        <span className="btn-icon">🖥️</span>
                        <span className="btn-label">Share</span>
                    </button>
                </div>
                
                <div className="controls-center">
                    <button className="control-btn end-call-btn" title="End Call">
                        <span className="btn-icon">📞</span>
                    </button>
                </div>
                
                <div className="controls-right">
                    <button className="control-btn chat-btn" title="Chat">
                        <span className="btn-icon">💬</span>
                        <span className="btn-label">Chat</span>
                    </button>
                    <button className="control-btn settings-btn" title="Settings">
                        <span className="btn-icon">⚙️</span>
                        <span className="btn-label">Settings</span>
                    </button>
                </div>
            </div>
        </div>
    )
}
export default Roompage