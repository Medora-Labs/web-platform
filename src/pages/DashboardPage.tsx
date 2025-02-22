import React, { useState, useEffect } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  Box,
  CircularProgress,
} from '@mui/material';
import { TimePicker } from '@mui/x-date-pickers';
import AppointmentManager from '../components/AppointmentManager';
import AppointmentList from '../components/AppointmentList';

interface Doctor {
  _id: string;
  userId: string;
  name: string;
  specialization: string;
  phoneNumber: string;
  workingHours: {
    start: string;
    end: string;
  };
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const DashboardPage: React.FC = () => {
  const { user } = useUser();
  const { getToken } = useAuth();
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [endTime, setEndTime] = useState<Date | null>(null);

  const fetchDoctorProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get the token from Clerk
      const token = await getToken();
      
      const response = await fetch(`${API_URL}/api/doctors/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch doctor profile');
      }

      const data = await response.json();
      setDoctor(data);
      
      // Set form values
      setName(data.name || '');
      setSpecialization(data.specialization || '');
      setPhoneNumber(data.phoneNumber || '');
      if (data.workingHours) {
        const [startHour, startMinute] = data.workingHours.start.split(':');
        const [endHour, endMinute] = data.workingHours.end.split(':');
        
        const start = new Date();
        start.setHours(parseInt(startHour), parseInt(startMinute), 0);
        setStartTime(start);

        const end = new Date();
        end.setHours(parseInt(endHour), parseInt(endMinute), 0);
        setEndTime(end);
      }
    } catch (err) {
      setError('Failed to load doctor profile');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchDoctorProfile();
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);

      const workingHours = {
        start: startTime ? `${startTime.getHours().toString().padStart(2, '0')}:${startTime.getMinutes().toString().padStart(2, '0')}` : '09:00',
        end: endTime ? `${endTime.getHours().toString().padStart(2, '0')}:${endTime.getMinutes().toString().padStart(2, '0')}` : '17:00',
      };

      const token = await getToken();
      const response = await fetch(`${API_URL}/api/doctors/profile`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          specialization,
          phoneNumber,
          workingHours,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      const updatedDoctor = await response.json();
      setDoctor(updatedDoctor);
      setSuccess('Profile updated successfully');
      setIsEditing(false);
    } catch (err) {
      setError('Failed to update profile');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !doctor) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h5" component="h1">
                  Doctor Profile
                </Typography>
                {!isEditing && (
                  <Button variant="outlined" onClick={() => setIsEditing(true)}>
                    Edit Profile
                  </Button>
                )}
              </Box>

              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}

              {success && (
                <Alert severity="success" sx={{ mb: 2 }}>
                  {success}
                </Alert>
              )}

              {isEditing ? (
                <Box component="form" onSubmit={handleSubmit}>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Specialization"
                        value={specialization}
                        onChange={(e) => setSpecialization(e.target.value)}
                        required
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Phone Number"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        required
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TimePicker
                        label="Working Hours Start"
                        value={startTime}
                        onChange={setStartTime}
                        sx={{ width: '100%' }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TimePicker
                        label="Working Hours End"
                        value={endTime}
                        onChange={setEndTime}
                        sx={{ width: '100%' }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Box display="flex" gap={2}>
                        <Button
                          type="submit"
                          variant="contained"
                          disabled={loading}
                        >
                          Save Changes
                        </Button>
                        <Button
                          variant="outlined"
                          onClick={() => setIsEditing(false)}
                          disabled={loading}
                        >
                          Cancel
                        </Button>
                      </Box>
                    </Grid>
                  </Grid>
                </Box>
              ) : (
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body1">
                      <strong>Name:</strong> {doctor?.name}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body1">
                      <strong>Specialization:</strong> {doctor?.specialization}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body1">
                      <strong>Phone:</strong> {doctor?.phoneNumber}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body1">
                      <strong>Working Hours:</strong>{' '}
                      {doctor?.workingHours
                        ? `${doctor.workingHours.start} - ${doctor.workingHours.end}`
                        : 'Not set'}
                    </Typography>
                  </Grid>
                </Grid>
              )}
            </CardContent>
          </Card>
        </Grid>

        {doctor && (
          <>
            <Grid item xs={12} md={6}>
              <AppointmentList doctorId={doctor.userId} />
            </Grid>
            <Grid item xs={12} md={6}>
              <AppointmentManager doctorId={doctor.userId} />
            </Grid>
          </>
        )}
      </Grid>
    </Container>
  );
};

export default DashboardPage; 