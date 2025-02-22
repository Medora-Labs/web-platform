import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Grid,
  IconButton,
  Paper,
  Stack,
  Typography,
  Badge,
} from '@mui/material';
import {
  Mic,
  MicOff,
  Videocam,
  VideocamOff,
  ScreenShare,
  StopScreenShare,
  CallEnd,
  People,
} from '@mui/icons-material';
import VideoPlayer from './VideoPlayer';
import DraggableVideo from './DraggableVideo';
import ParticipantsList from './ParticipantsList';

interface Peer {
  id: string;
  stream: MediaStream;
  connection: RTCPeerConnection;
  displayName: string;
  isMuted: boolean;
  isCameraOff: boolean;
  isScreenSharing: boolean;
}

interface MeetingRoomProps {
  meetingId: string;
  localStream: MediaStream;
  onLeaveMeeting: () => void;
  displayName: string;
}

const ICE_SERVERS = {
  iceServers: [
    {
      urls: [
        'stun:stun.l.google.com:19302',
        'stun:stun1.l.google.com:19302',
      ],
    },
  ],
};

const MeetingRoom: React.FC<MeetingRoomProps> = ({
  meetingId,
  localStream,
  onLeaveMeeting,
  displayName,
}) => {
  const [peers, setPeers] = useState<Map<string, Peer>>(new Map());
  const [isMicEnabled, setIsMicEnabled] = useState(true);
  const [isCameraEnabled, setIsCameraEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(false);
  const [focusedPeerId, setFocusedPeerId] = useState<string | null>(null);
  const [ws, setWs] = useState<WebSocket | null>(null);

  useEffect(() => {
    // Initialize WebSocket connection
    const wsUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws/meeting/${meetingId}`;
    const websocket = new WebSocket(wsUrl);

    websocket.onmessage = async (event) => {
      const data = JSON.parse(event.data);
      handleSignalingMessage(data);
    };

    setWs(websocket);

    return () => {
      websocket.close();
      // Cleanup peers
      peers.forEach((peer) => {
        peer.connection.close();
      });
      setPeers(new Map());
    };
  }, [meetingId]);

  const handleSignalingMessage = async (data: any) => {
    switch (data.type) {
      case 'new-peer':
        createPeerConnection(data.peerId, data.displayName, true);
        break;
      case 'offer':
        handleOffer(data.peerId, data.offer, data.displayName);
        break;
      case 'answer':
        handleAnswer(data.peerId, data.answer);
        break;
      case 'ice-candidate':
        handleIceCandidate(data.peerId, data.candidate);
        break;
      case 'peer-left':
        handlePeerLeft(data.peerId);
        break;
    }
  };

  const createPeerConnection = (peerId: string, peerDisplayName: string, isInitiator: boolean) => {
    const peerConnection = new RTCPeerConnection(ICE_SERVERS);

    // Add local tracks to the connection
    localStream.getTracks().forEach((track) => {
      peerConnection.addTrack(track, localStream);
    });

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        ws?.send(JSON.stringify({
          type: 'ice-candidate',
          peerId,
          candidate: event.candidate,
        }));
      }
    };

    // Handle incoming streams
    peerConnection.ontrack = (event) => {
      const [stream] = event.streams;
      setPeers((prevPeers) => {
        const newPeers = new Map(prevPeers);
        newPeers.set(peerId, {
          ...newPeers.get(peerId)!,
          stream,
        });
        return newPeers;
      });
    };

    // Create and send offer if initiator
    if (isInitiator) {
      peerConnection.createOffer()
        .then((offer) => peerConnection.setLocalDescription(offer))
        .then(() => {
          ws?.send(JSON.stringify({
            type: 'offer',
            peerId,
            offer: peerConnection.localDescription,
          }));
        });
    }

    setPeers((prevPeers) => {
      const newPeers = new Map(prevPeers);
      newPeers.set(peerId, {
        id: peerId,
        connection: peerConnection,
        stream: new MediaStream(),
        displayName: peerDisplayName,
        isMuted: false,
        isCameraOff: false,
        isScreenSharing: false,
      });
      return newPeers;
    });

    return peerConnection;
  };

  const handleOffer = async (peerId: string, offer: RTCSessionDescriptionInit, peerDisplayName: string) => {
    const peerConnection = createPeerConnection(peerId, peerDisplayName, false);
    await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);

    ws?.send(JSON.stringify({
      type: 'answer',
      peerId,
      answer,
    }));
  };

  const handleAnswer = async (peerId: string, answer: RTCSessionDescriptionInit) => {
    const peer = peers.get(peerId);
    if (peer) {
      await peer.connection.setRemoteDescription(new RTCSessionDescription(answer));
    }
  };

  const handleIceCandidate = async (peerId: string, candidate: RTCIceCandidateInit) => {
    const peer = peers.get(peerId);
    if (peer) {
      await peer.connection.addIceCandidate(new RTCIceCandidate(candidate));
    }
  };

  const handlePeerLeft = (peerId: string) => {
    const peer = peers.get(peerId);
    if (peer) {
      peer.connection.close();
      setPeers((prevPeers) => {
        const newPeers = new Map(prevPeers);
        newPeers.delete(peerId);
        return newPeers;
      });
    }
  };

  const toggleMic = () => {
    const audioTrack = localStream.getAudioTracks()[0];
    audioTrack.enabled = !audioTrack.enabled;
    setIsMicEnabled(audioTrack.enabled);
  };

  const toggleCamera = () => {
    const videoTrack = localStream.getVideoTracks()[0];
    videoTrack.enabled = !videoTrack.enabled;
    setIsCameraEnabled(videoTrack.enabled);
  };

  const toggleScreenShare = async () => {
    if (!isScreenSharing) {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
        });
        setScreenStream(stream);
        setIsScreenSharing(true);

        // Replace video track in all peer connections
        peers.forEach((peer) => {
          const sender = peer.connection
            .getSenders()
            .find((s) => s.track?.kind === 'video');
          if (sender) {
            sender.replaceTrack(stream.getVideoTracks()[0]);
          }
        });
      } catch (err) {
        console.error('Error sharing screen:', err);
      }
    } else {
      if (screenStream) {
        screenStream.getTracks().forEach((track) => track.stop());
        setScreenStream(null);
      }
      setIsScreenSharing(false);

      // Restore camera video track
      const videoTrack = localStream.getVideoTracks()[0];
      peers.forEach((peer) => {
        const sender = peer.connection
          .getSenders()
          .find((s) => s.track?.kind === 'video');
        if (sender) {
          sender.replaceTrack(videoTrack);
        }
      });
    }
  };

  const getGridLayout = () => {
    const totalPeers = peers.size;
    if (totalPeers === 0) return { cols: 1, rows: 1 }; // Only local user
    if (totalPeers === 1) return { cols: 1, rows: 1 }; // One peer (full screen)
    if (totalPeers <= 2) return { cols: 2, rows: 1 };
    if (totalPeers <= 4) return { cols: 2, rows: 2 };
    if (totalPeers <= 6) return { cols: 3, rows: 2 };
    return { cols: 3, rows: 2 }; // Max grid size, rest go to participants list
  };

  const getVisiblePeers = () => {
    const maxVisible = 6;
    const peerArray = Array.from(peers.values());
    
    if (focusedPeerId) {
      const focusedPeer = peers.get(focusedPeerId);
      if (focusedPeer) {
        return [focusedPeer];
      }
    }

    // If no peers, show local user in full screen
    if (peerArray.length === 0) {
      return [];
    }

    return peerArray.slice(0, maxVisible);
  };

  const handleParticipantClick = (participantId: string) => {
    setFocusedPeerId(focusedPeerId === participantId ? null : participantId);
    setIsParticipantsOpen(false);
  };

  const { cols, rows } = getGridLayout();
  const visiblePeers = getVisiblePeers();
  const hasOverflow = peers.size > 6;
  const showLocalUserFullScreen = peers.size === 0;

  return (
    <Box 
      sx={{ 
        width: '100vw',
        height: '100vh',
        bgcolor: '#202124',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {showLocalUserFullScreen ? (
        // Show local user in full screen when alone
        <Box sx={{ 
          width: '100%', 
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 2
        }}>
          <Box sx={{ width: '100%', height: '100%', maxHeight: '90vh' }}>
            <VideoPlayer
              stream={screenStream || localStream}
              isLocal={true}
              displayName={`${displayName} (You)`}
              isMuted={true}
            />
          </Box>
        </Box>
      ) : (
        // Show grid of peers with local user in draggable window
        <Box sx={{ 
          width: '100%', 
          height: '100%',
          p: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Grid
            container
            spacing={2}
            sx={{
              width: '100%',
              height: '100%',
              maxWidth: peers.size === 1 ? '100%' : '95%',
              maxHeight: '90%',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {visiblePeers.map((peer) => (
              <Grid
                key={peer.id}
                item
                xs={12}
                md={peers.size === 1 ? 12 : 12 / cols}
                sx={{
                  height: peers.size === 1 ? '100%' : `${100 / rows}%`,
                  minHeight: peers.size === 1 ? '90vh' : 200,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  p: 1
                }}
              >
                <Box sx={{ 
                  width: '100%', 
                  height: '100%', 
                  borderRadius: 2,
                  overflow: 'hidden',
                  bgcolor: 'black'
                }}>
                  <VideoPlayer
                    stream={peer.stream}
                    displayName={peer.displayName}
                    showMutedIndicator={peer.isMuted}
                    isMuted={peer.isMuted}
                  />
                </Box>
              </Grid>
            ))}
          </Grid>

          {peers.size > 0 && (
            <DraggableVideo
              stream={screenStream || localStream}
              displayName={`${displayName} (You)`}
            />
          )}
        </Box>
      )}

      {/* Controls */}
      <Box sx={{ 
        position: 'fixed', 
        bottom: 32, 
        left: '50%', 
        transform: 'translateX(-50%)',
        zIndex: 1200,
        bgcolor: 'rgba(32, 33, 36, 0.95)',
        borderRadius: 8,
        px: 3,
        py: 2,
        boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.15)'
      }}>
        <Stack
          direction="row"
          spacing={2}
          justifyContent="center"
          alignItems="center"
        >
          <IconButton
            onClick={toggleMic}
            color={isMicEnabled ? 'primary' : 'error'}
            sx={{ 
              bgcolor: isMicEnabled ? 'rgba(255, 255, 255, 0.1)' : 'error.dark',
              '&:hover': {
                bgcolor: isMicEnabled ? 'rgba(255, 255, 255, 0.15)' : 'error.main',
              },
              p: 2
            }}
          >
            {isMicEnabled ? <Mic /> : <MicOff />}
          </IconButton>
          <IconButton
            onClick={toggleCamera}
            color={isCameraEnabled ? 'primary' : 'error'}
            sx={{ 
              bgcolor: isCameraEnabled ? 'rgba(255, 255, 255, 0.1)' : 'error.dark',
              '&:hover': {
                bgcolor: isCameraEnabled ? 'rgba(255, 255, 255, 0.15)' : 'error.main',
              },
              p: 2
            }}
          >
            {isCameraEnabled ? <Videocam /> : <VideocamOff />}
          </IconButton>
          <IconButton
            onClick={toggleScreenShare}
            color={isScreenSharing ? 'error' : 'primary'}
            sx={{ 
              bgcolor: 'rgba(255, 255, 255, 0.1)',
              '&:hover': {
                bgcolor: 'rgba(255, 255, 255, 0.15)',
              },
              p: 2
            }}
          >
            {isScreenSharing ? <StopScreenShare /> : <ScreenShare />}
          </IconButton>
          <IconButton
            onClick={() => setIsParticipantsOpen(true)}
            sx={{ 
              bgcolor: 'rgba(255, 255, 255, 0.1)',
              '&:hover': {
                bgcolor: 'rgba(255, 255, 255, 0.15)',
              },
              p: 2
            }}
          >
            <Badge badgeContent={peers.size} color="primary">
              <People />
            </Badge>
          </IconButton>
          <IconButton
            onClick={onLeaveMeeting}
            sx={{ 
              bgcolor: 'error.dark',
              color: 'white',
              '&:hover': {
                bgcolor: 'error.main',
              },
              p: 2
            }}
          >
            <CallEnd />
          </IconButton>
        </Stack>
      </Box>

      <ParticipantsList
        participants={Array.from(peers.values()).map(peer => ({
          id: peer.id,
          displayName: peer.displayName,
          isMuted: peer.isMuted,
          isCameraOff: peer.isCameraOff,
          isScreenSharing: peer.isScreenSharing,
        }))}
        open={isParticipantsOpen}
        onClose={() => setIsParticipantsOpen(false)}
        onParticipantClick={handleParticipantClick}
      />
    </Box>
  );
};

export default MeetingRoom; 