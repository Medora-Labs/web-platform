import React, { useState, useRef, useEffect } from 'react';
import { Box } from '@mui/material';
import VideoPlayer from './VideoPlayer';

interface DraggableVideoProps {
  stream: MediaStream;
  displayName: string;
  isMuted?: boolean;
}

const DraggableVideo: React.FC<DraggableVideoProps> = ({
  stream,
  displayName,
  isMuted = true,
}) => {
  const [position, setPosition] = useState({ x: window.innerWidth - 320, y: window.innerHeight - 240 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const boxRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (boxRef.current) {
      const rect = boxRef.current.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
      setIsDragging(true);
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging && boxRef.current) {
      const maxX = window.innerWidth - boxRef.current.offsetWidth;
      const maxY = window.innerHeight - boxRef.current.offsetHeight;
      
      const newX = Math.min(Math.max(0, e.clientX - dragOffset.x), maxX);
      const newY = Math.min(Math.max(0, e.clientY - dragOffset.y), maxY);
      
      setPosition({ x: newX, y: newY });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  return (
    <Box
      ref={boxRef}
      sx={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        width: 280,
        height: 210,
        zIndex: 1000,
        cursor: isDragging ? 'grabbing' : 'grab',
        boxShadow: 3,
        borderRadius: 2,
        overflow: 'hidden',
      }}
      onMouseDown={handleMouseDown}
    >
      <VideoPlayer
        stream={stream}
        isLocal={true}
        isMuted={isMuted}
        displayName={displayName}
      />
    </Box>
  );
};

export default DraggableVideo; 