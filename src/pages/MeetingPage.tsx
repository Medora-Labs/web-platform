import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import MeetingPreview from '../components/meeting/MeetingPreview';
import MeetingRoom from '../components/meeting/MeetingRoom';

const MeetingPage: React.FC = () => {
  const { meetingId } = useParams<{ meetingId: string }>();
  const navigate = useNavigate();
  const { user } = useUser();
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isInMeeting, setIsInMeeting] = useState(false);

  if (!meetingId) {
    navigate('/');
    return null;
  }

  const handleJoinMeeting = (stream: MediaStream) => {
    setLocalStream(stream);
    setIsInMeeting(true);
  };

  const handleLeaveMeeting = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    setLocalStream(null);
    setIsInMeeting(false);
    // If it's a popup window, close it, otherwise redirect to root
    if (window.opener) {
      // navigate('/');
      window.close();
    } else {
      navigate('/');
    }
  };

  return isInMeeting && localStream ? (
    <MeetingRoom
      meetingId={meetingId}
      localStream={localStream}
      onLeaveMeeting={handleLeaveMeeting}
      displayName={user?.fullName || 'Anonymous'}
    />
  ) : (
    <MeetingPreview
      meetingId={meetingId}
      onJoinMeeting={handleJoinMeeting}
    />
  );
};

export default MeetingPage; 