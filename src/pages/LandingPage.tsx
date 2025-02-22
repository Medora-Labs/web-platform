import { Container, Typography, Button, Box, Grid } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <Container maxWidth="lg">
      <Box sx={{ minHeight: '100vh', py: 8 }}>
        <Grid container spacing={4} alignItems="center" sx={{ m: 0 }}>
          <Grid item xs={12} md={6}>
            <Typography variant="h2" component="h1" gutterBottom>
              Medora AI
            </Typography>
            <Typography variant="h5" color="text.secondary" paragraph>
              Transform your medical practice with our intelligent appointment scheduling system. Let our AI handle your appointments while you focus on patient care.
            </Typography>
            <Box sx={{ mt: 4 }}>
              <Button
                variant="contained"
                size="large"
                onClick={() => navigate('/sign-up')}
                sx={{ mr: 2 }}
              >
                Get Started
              </Button>
              <Button
                variant="outlined"
                size="large"
                onClick={() => navigate('/sign-in')}
              >
                Sign In
              </Button>
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Box
              component="img"
              src="https://www.infotalkcorp.com/wp-content/uploads/2020/07/best_multilingual_cantonese_ai_auto_virtual_-receptionist_hong_kong.jpg"
              alt="AI Receptionist"
              sx={{
                width: '100%',
                height: 'auto',
                borderRadius: 2,
                boxShadow: 3,
              }}
            />
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default LandingPage;