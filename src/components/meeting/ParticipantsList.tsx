import React from 'react';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  IconButton,
  Typography,
} from '@mui/material';
import { Person, Mic, MicOff, Videocam, VideocamOff } from '@mui/icons-material';

interface Participant {
  id: string;
  displayName: string;
  isMuted: boolean;
  isCameraOff: boolean;
  isScreenSharing?: boolean;
}

interface ParticipantsListProps {
  participants: Participant[];
  open: boolean;
  onClose: () => void;
  onParticipantClick: (participantId: string) => void;
}

const ParticipantsList: React.FC<ParticipantsListProps> = ({
  participants,
  open,
  onClose,
  onParticipantClick,
}) => {
  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      variant="temporary"
      sx={{
        '& .MuiDrawer-paper': {
          width: 320,
          bgcolor: 'background.paper',
        },
      }}
    >
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Participants ({participants.length})
        </Typography>
        <List>
          {participants.map((participant) => (
            <ListItem
              key={participant.id}
              button
              onClick={() => onParticipantClick(participant.id)}
              secondaryAction={
                <Box>
                  <IconButton size="small" disabled>
                    {participant.isMuted ? <MicOff color="error" /> : <Mic color="primary" />}
                  </IconButton>
                  <IconButton size="small" disabled>
                    {participant.isCameraOff ? (
                      <VideocamOff color="error" />
                    ) : (
                      <Videocam color="primary" />
                    )}
                  </IconButton>
                </Box>
              }
            >
              <ListItemAvatar>
                {participant.isCameraOff ? (
                  <Avatar>
                    <Person />
                  </Avatar>
                ) : (
                  <Avatar alt={participant.displayName} src="/default-avatar.png" />
                )}
              </ListItemAvatar>
              <ListItemText
                primary={participant.displayName}
                secondary={participant.isScreenSharing ? 'Sharing screen' : ''}
              />
            </ListItem>
          ))}
        </List>
      </Box>
    </Drawer>
  );
};

export default ParticipantsList; 