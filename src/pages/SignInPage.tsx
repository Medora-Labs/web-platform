import { SignIn } from '@clerk/clerk-react';
import { Box, Container } from '@mui/material';

const SignInPage = () => {
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
        <SignIn
          routing="path"
          path="/sign-in"
          signUpUrl="/sign-up"
          afterSignInUrl="/dashboard"
        />
      </Box>
    </Container>
  );
};

export default SignInPage; 