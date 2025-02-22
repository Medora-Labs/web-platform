import { SignUp } from '@clerk/clerk-react';
import { Box, Container } from '@mui/material';

const SignUpPage = () => {
  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          py: 4,
        }}
      >
        <SignUp
          routing="path"
          path="/sign-up"
          signInUrl="/sign-in"
          afterSignUpUrl="/dashboard"
        />
      </Box>
    </Container>
  );
};

export default SignUpPage; 