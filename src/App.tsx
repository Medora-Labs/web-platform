import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ClerkProvider } from '@clerk/clerk-react';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ThemeProvider, CssBaseline } from '@mui/material';
import theme from './theme';
import LandingPage from './pages/LandingPage';
import DashboardPage from './pages/DashboardPage';
import PrivateRoute from './components/PrivateRoute';

// Import pages (we'll create these next)
import SignUpPage from './pages/SignUpPage';
import SignInPage from './pages/SignInPage';

// Replace with your actual Clerk publishable key
const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

function App() {
  return (
    <ClerkProvider publishableKey={clerkPubKey}>
      <ThemeProvider theme={theme}>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <CssBaseline />
          <Router>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/sign-up" element={<SignUpPage />} />
              <Route path="/sign-in" element={<SignInPage />} />
              <Route
                path="/dashboard"
                element={
                  <PrivateRoute>
                    <DashboardPage />
                  </PrivateRoute>
                }
              />
            </Routes>
          </Router>
        </LocalizationProvider>
      </ThemeProvider>
    </ClerkProvider>
  );
}

export default App;
