import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
  Button,
  Container,
  IconButton,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import {
  Mic,
  MicOff,
  Videocam,
  VideocamOff,
} from '@mui/icons-material';

interface MeetingPreviewProps {
  meetingId: string;
  onJoinMeeting: (stream: MediaStream) => void;
}

const MeetingPreview: React.FC<MeetingPreviewProps> = ({
  meetingId,
  onJoinMeeting,
}) => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isMicEnabled, setIsMicEnabled] = useState(true);
  const [isCameraEnabled, setIsCameraEnabled] = useState(true);
  const [error, setError] = useState<string>('');
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const initializeMedia = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err) {
        console.error('Error accessing media devices:', err);
        setError('Could not access camera or microphone');
      }
    };

    initializeMedia();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const toggleMic = () => {
    if (stream) {
      const audioTrack = stream.getAudioTracks()[0];
      audioTrack.enabled = !audioTrack.enabled;
      setIsMicEnabled(audioTrack.enabled);
    }
  };

  const toggleCamera = () => {
    if (stream) {
      const videoTrack = stream.getVideoTracks()[0];
      videoTrack.enabled = !videoTrack.enabled;
      setIsCameraEnabled(videoTrack.enabled);
    }
  };

  const handleJoinMeeting = () => {
    if (stream) {
      onJoinMeeting(stream);
    }
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 4 }}>
        <Paper elevation={3} sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom align="center">
            Meeting Preview
          </Typography>
          <Typography variant="body1" gutterBottom align="center" color="textSecondary">
            Meeting ID: {meetingId}
          </Typography>

          {error ? (
            <Typography color="error" align="center">
              {error}
            </Typography>
          ) : (
            <Box
              sx={{
                position: 'relative',
                width: '100%',
                height: 400,
                backgroundColor: 'black',
                borderRadius: 1,
                overflow: 'hidden',
                mb: 2,
              }}
            >
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
            </Box>
          )}

          <Stack
            direction="row"
            spacing={2}
            justifyContent="center"
            alignItems="center"
            sx={{ mt: 2 }}
          >
            <IconButton
              onClick={toggleMic}
              color={isMicEnabled ? 'primary' : 'error'}
              sx={{ backgroundColor: 'rgba(0, 0, 0, 0.04)' }}
            >
              {isMicEnabled ? <Mic /> : <MicOff />}
            </IconButton>
            <IconButton
              onClick={toggleCamera}
              color={isCameraEnabled ? 'primary' : 'error'}
              sx={{ backgroundColor: 'rgba(0, 0, 0, 0.04)' }}
            >
              {isCameraEnabled ? <Videocam /> : <VideocamOff />}
            </IconButton>
            <Button
              variant="contained"
              color="primary"
              onClick={handleJoinMeeting}
              disabled={!stream}
            >
              Join Meeting
            </Button>
          </Stack>
        </Paper>
      </Box>
    </Container>
  );
};

export default MeetingPreview; 