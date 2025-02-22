import React from 'react';
import { useUser } from '@clerk/clerk-react';
import { Navigate } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';

interface PrivateRouteProps {
  children: React.ReactNode;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  const { isLoaded, isSignedIn } = useUser();

  if (!isLoaded) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!isSignedIn) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default PrivateRoute; 