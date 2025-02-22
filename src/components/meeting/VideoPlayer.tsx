import React, { useEffect, useRef, useState } from 'react';
import { Box, Typography, Avatar } from '@mui/material';
import { MicOff, Person } from '@mui/icons-material';

interface VideoPlayerProps {
  stream: MediaStream;
  isMuted?: boolean;
  isLocal?: boolean;
  displayName?: string;
  showMutedIndicator?: boolean;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  stream,
  isMuted = false,
  isLocal = false,
  displayName = '',
  showMutedIndicator = false,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isCameraOff, setIsCameraOff] = useState(false);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
    }

    // Check if video track exists and is enabled
    const videoTrack = stream.getVideoTracks()[0];
    setIsCameraOff(!videoTrack || !videoTrack.enabled);

    // Listen for track enabled/disabled events
    const handleTrackEnabled = () => setIsCameraOff(false);
    const handleTrackDisabled = () => setIsCameraOff(true);

    if (videoTrack) {
      videoTrack.addEventListener('enabled', handleTrackEnabled);
      videoTrack.addEventListener('disabled', handleTrackDisabled);
    }

    return () => {
      if (videoTrack) {
        videoTrack.removeEventListener('enabled', handleTrackEnabled);
        videoTrack.removeEventListener('disabled', handleTrackDisabled);
      }
    };
  }, [stream]);

  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        height: '100%',
        backgroundColor: 'black',
        borderRadius: 1,
        overflow: 'hidden',
      }}
    >
      {isCameraOff ? (
        <Box
          sx={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          <Avatar
            sx={{
              width: 80,
              height: 80,
              bgcolor: 'primary.main',
            }}
          >
            <Person sx={{ fontSize: 40 }} />
          </Avatar>
          {displayName && (
            <Typography variant="h6" color="white">
              {displayName}
            </Typography>
          )}
        </Box>
      ) : (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isMuted || isLocal}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transform: isLocal ? 'scaleX(-1)' : 'none',
          }}
        />
      )}
      
      {displayName && !isCameraOff && (
        <Box
          sx={{
            position: 'absolute',
            bottom: 8,
            left: 8,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            padding: '4px 8px',
            borderRadius: 1,
          }}
        >
          <Typography variant="body2" color="white">
            {displayName}
          </Typography>
        </Box>
      )}

      {showMutedIndicator && (
        <Box
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            padding: '4px',
            borderRadius: '50%',
          }}
        >
          <MicOff sx={{ color: 'white', fontSize: 20 }} />
        </Box>
      )}
    </Box>
  );
};

export default VideoPlayer; 