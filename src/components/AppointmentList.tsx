import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { useAuth } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  TextField,
} from '@mui/material';
import { VideoCall } from '@mui/icons-material';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface Appointment {
  _id: string;
  patientName: string;
  patientPhone: string;
  startTime: string;
  endTime: string;
  status: 'scheduled' | 'completed' | 'cancelled';
}

interface AppointmentListProps {
  doctorId: string;
}

const AppointmentList: React.FC<AppointmentListProps> = ({ doctorId }) => {
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('scheduled');

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = await getToken();
      const queryParams = new URLSearchParams({
        date: new Date(selectedDate).toISOString(),
        status: statusFilter,
      });

      const response = await fetch(
        `${API_URL}/api/appointments/doctor/${doctorId}?${queryParams}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      if (!response.ok) {
        throw new Error('Failed to fetch appointments');
      }
      const data = await response.json();
      setAppointments(data);
    } catch (err) {
      setError('Failed to load appointments');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedDate) {
      fetchAppointments();
    }
  }, [selectedDate, statusFilter, doctorId]);

  const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(event.target.value);
  };

  const handleStatusChange = async (appointmentId: string, newStatus: string) => {
    try {
      setLoading(true);
      setError(null);
      const token = await getToken();
      const response = await fetch(`${API_URL}/api/appointments/${appointmentId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update appointment status');
      }

      setSuccess('Appointment status updated successfully');
      fetchAppointments();
    } catch (err) {
      setError('Failed to update appointment status');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (appointmentId: string) => {
    try {
      setLoading(true);
      setError(null);
      const token = await getToken();
      const response = await fetch(`${API_URL}/api/appointments/${appointmentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to cancel appointment');
      }

      setSuccess('Appointment cancelled successfully');
      fetchAppointments();
    } catch (err) {
      setError('Failed to cancel appointment');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinMeeting = (appointmentId: string) => {
    window.open(`/meeting/${appointmentId}`, '_blank');
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Appointments
        </Typography>

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

        <Box sx={{ mb: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                type="date"
                fullWidth
                label="Select Date"
                value={selectedDate}
                onChange={handleDateChange}
                InputLabelProps={{ 
                  shrink: true,
                  sx: {
                    color: 'primary.main',
                  }
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                      borderColor: 'rgba(0, 0, 0, 0.23)',
                    },
                    '&:hover fieldset': {
                      borderColor: 'primary.main',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: 'primary.main',
                    },
                  },
                  '& input[type="date"]::-webkit-calendar-picker-indicator': {
                    cursor: 'pointer',
                    filter: 'invert(0.5)',
                    '&:hover': {
                      filter: 'invert(0.7)',
                    },
                  },
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel sx={{ color: 'primary.main' }}>Status</InputLabel>
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  label="Status"
                  sx={{
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(0, 0, 0, 0.23)',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'primary.main',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'primary.main',
                    },
                  }}
                >
                  <MenuItem value="scheduled">Scheduled</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="cancelled">Cancelled</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Box>

        {loading ? (
          <Box display="flex" justifyContent="center" my={4}>
            <CircularProgress />
          </Box>
        ) : appointments.length === 0 ? (
          <Alert severity="info">No appointments found</Alert>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Time</TableCell>
                  <TableCell>Patient Name</TableCell>
                  <TableCell>Phone</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {appointments.map((appointment) => (
                  <TableRow key={appointment._id}>
                    <TableCell>
                      {format(new Date(appointment.startTime), 'h:mm a')} -{' '}
                      {format(new Date(appointment.endTime), 'h:mm a')}
                    </TableCell>
                    <TableCell>{appointment.patientName}</TableCell>
                    <TableCell>{appointment.patientPhone}</TableCell>
                    <TableCell>{appointment.status}</TableCell>
                    <TableCell>
                      {appointment.status === 'scheduled' && (
                        <>
                          <Button
                            size="small"
                            variant="contained"
                            color="primary"
                            onClick={() => handleJoinMeeting(appointment._id)}
                            startIcon={<VideoCall />}
                            sx={{ mr: 1 }}
                          >
                            Join Meeting
                          </Button>
                          <Button
                            size="small"
                            onClick={() =>
                              handleStatusChange(appointment._id, 'completed')
                            }
                            sx={{ mr: 1 }}
                          >
                            Complete
                          </Button>
                          <Button
                            size="small"
                            color="error"
                            onClick={() => handleCancel(appointment._id)}
                          >
                            Cancel
                          </Button>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </CardContent>
    </Card>
  );
};

export default AppointmentList; 