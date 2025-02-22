import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { useAuth } from '@clerk/clerk-react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
} from '@mui/material';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface TimeSlot {
  start: string;
  end: string;
}

interface AppointmentManagerProps {
  doctorId: string;
}

const AppointmentManager: React.FC<AppointmentManagerProps> = ({ doctorId }) => {
  const { getToken } = useAuth();
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchAvailableSlots = async (date: string) => {
    try {
      setLoading(true);
      setError(null);
      const token = await getToken();
      const response = await fetch(
        `${API_URL}/api/appointments/available-slots/${doctorId}?date=${new Date(date).toISOString()}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      if (!response.ok) {
        throw new Error('Failed to fetch available slots');
      }
      const slots = await response.json();
      setAvailableSlots(slots);
    } catch (err) {
      setError('Failed to load available time slots');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedDate) {
      fetchAvailableSlots(selectedDate);
    }
  }, [selectedDate, doctorId]);

  const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(event.target.value);
    setSelectedSlot(null);
  };

  const handleSlotSelect = (slot: TimeSlot) => {
    setSelectedSlot(slot);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot) {
      setError('Please select a time slot');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const token = await getToken();
      const response = await fetch(`${API_URL}/api/appointments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          doctorId,
          patientName,
          patientPhone,
          startTime: selectedSlot.start,
          endTime: selectedSlot.end,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to book appointment');
      }

      setSuccess('Appointment booked successfully!');
      setPatientName('');
      setPatientPhone('');
      setSelectedSlot(null);
      fetchAvailableSlots(selectedDate);
    } catch (err) {
      setError('Failed to book appointment');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Book an Appointment
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

        <Box component="form" onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                type="date"
                fullWidth
                label="Select Date"
                value={selectedDate}
                onChange={handleDateChange}
                InputLabelProps={{ shrink: true }}
                inputProps={{ min: format(new Date(), 'yyyy-MM-dd') }}
              />
            </Grid>

            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Available Time Slots</InputLabel>
                <Select
                  value={selectedSlot ? JSON.stringify(selectedSlot) : ''}
                  onChange={(e) => handleSlotSelect(JSON.parse(e.target.value))}
                  label="Available Time Slots"
                  disabled={loading || availableSlots.length === 0}
                >
                  {availableSlots.map((slot) => (
                    <MenuItem
                      key={slot.start}
                      value={JSON.stringify(slot)}
                    >
                      {format(new Date(slot.start), 'h:mm a')} -{' '}
                      {format(new Date(slot.end), 'h:mm a')}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Patient Name"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                required
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Phone Number"
                value={patientPhone}
                onChange={(e) => setPatientPhone(e.target.value)}
                required
              />
            </Grid>

            <Grid item xs={12}>
              <Button
                type="submit"
                variant="contained"
                fullWidth
                disabled={loading || !selectedSlot}
              >
                {loading ? <CircularProgress size={24} /> : 'Book Appointment'}
              </Button>
            </Grid>
          </Grid>
        </Box>
      </CardContent>
    </Card>
  );
};

export default AppointmentManager; 