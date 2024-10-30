import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import FormLabel from '@mui/material/FormLabel';
import FormControl from '@mui/material/FormControl';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import MuiCard from '@mui/material/Card';
import { styled } from '@mui/material/styles';
import AppTheme from './AppTheme';
import ColorModeSelect from './ColorModeSelect';
import NavBar from './Navbar';

const Card = styled(MuiCard)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignSelf: 'center',
  width: '100%',
  padding: theme.spacing(4),
  gap: theme.spacing(2),
  margin: 'auto',
  [theme.breakpoints.up('sm')]: {
    maxWidth: '450px',
  },
  boxShadow:
    'hsla(220, 30%, 5%, 0.05) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.05) 0px 15px 35px -5px',
  ...theme.applyStyles('dark', {
    boxShadow:
      'hsla(220, 30%, 5%, 0.5) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.08) 0px 15px 35px -5px',
  }),
}));

const ReservationContainer = styled(Stack)(({ theme }) => ({
  minHeight: '100vh',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  position: 'relative',
  padding: theme.spacing(2),
  backgroundImage:
    'radial-gradient(ellipse at 50% 50%, hsl(210, 100%, 97%), hsl(0, 0%, 100%))',
  backgroundRepeat: 'no-repeat',
  ...theme.applyStyles('dark', {
    backgroundImage:
      'radial-gradient(at 50% 50%, hsla(210, 100%, 16%, 0.5), hsl(220, 30%, 5%))',
  }),
  [theme.breakpoints.up('sm')]: {
    padding: theme.spacing(4),
  },
}));

function RoomReservation(props) {
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState('');
  const [partySize, setPartySize] = useState(0);
  const [selectedRoomCapacity, setSelectedRoomCapacity] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [reservationDate, setReservationDate] = useState('');
  const [reservationTime, setReservationTime] = useState('');
  const [duration, setDuration] = useState(0);
  const [successMessage, setSuccessMessage] = useState('');
  const [loggedInUserId, setLoggedInUserId] = useState(null); //store loggedin user

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const response = await fetch('http://localhost:5000/get-rooms');
        const data = await response.json();
        setRooms(data);
      } catch (error) {
        console.error('Error fetching rooms:', error);
      }
    };

    //get logged in user from local storage
    setLoggedInUserId(localStorage.getItem('loggedInUserId'));
    fetchRooms();
  }, []);

  const handleRoomSelection = (e) => {
    const selectedRoomId = e.target.value;
    const room = rooms.find((room) => room.room_id === parseInt(selectedRoomId));
    setSelectedRoom(selectedRoomId);
    if (room) {
      setSelectedRoomCapacity(room.room_capacity);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const token = localStorage.getItem('token'); // fetch the token from local storage

    if (partySize > selectedRoomCapacity) {
      setErrorMessage(`The party size exceeds the room's capacity of ${selectedRoomCapacity}.`);
      return;
    }
    setErrorMessage('');
  
    const reservationDateTime = `${reservationDate}T${reservationTime}`;
    try {
      const response = await fetch('http://localhost:5000/reserve-room', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`, //authorization with token
        },
        body: JSON.stringify({
          user_id: loggedInUserId, //user_id
          roomId: selectedRoom,
          partySize: partySize,
          reservationDateTime: reservationDateTime,
          duration: duration,
        }),
      });
      const result = await response.json();
      if (response.ok) {
        setSuccessMessage(result.message);
      } else {
        setErrorMessage(result.message || 'Error making reservation. Please try again.');
      }
    } catch (error) {
      console.error('Error:', error);
      setErrorMessage('Error making reservation. Please try again.');
      setSuccessMessage('');
    }
  };

  return (
    <div>
      <NavBar />
      <AppTheme {...props}>
        <CssBaseline enableColorScheme />
        <ReservationContainer direction="column">
          <ColorModeSelect sx={{ position: 'fixed', top: '1rem', right: '1rem' }} />
          <Card variant="outlined">
            <Typography
              component="h1"
              variant="h4"
              sx={{ width: '100%', fontSize: 'clamp(2rem, 10vw, 2.15rem)', mt: 2 }}
            >
              Room Reservation
            </Typography>
            {errorMessage && <div className="alert alert-danger mt-3">{errorMessage}</div>}
            {successMessage && <div className="alert alert-success mt-3">{successMessage}</div>}
            <Box component="form" onSubmit={handleSubmit} noValidate sx={{ display: 'flex', flexDirection: 'column', width: '100%', gap: 2 }}>
              <FormControl>
                <FormLabel htmlFor="room">Available Rooms</FormLabel>
                <TextField
                  id="room"
                  select
                  name="selectedRoom"
                  value={selectedRoom}
                  onChange={handleRoomSelection}
                  fullWidth
                  variant="outlined"
                  SelectProps={{ native: true }}
                >
                  <option value="" disabled>Select a room</option>
                  {rooms.map((room) => (
                    <option key={room.room_id} value={room.room_id}>
                      {room.room_name} (Capacity: {room.room_capacity}) - {room.room_description}
                    </option>
                  ))}
                </TextField>
              </FormControl>
              <FormControl>
                <FormLabel htmlFor="partySize">Party Size</FormLabel>
                <TextField
                  id="partySize"
                  type="number"
                  name="partySize"
                  value={partySize}
                  onChange={(e) => setPartySize(e.target.value)}
                  fullWidth
                  variant="outlined"
                  inputProps={{ min: 1 }}
                />
              </FormControl>
              <FormControl>
                <FormLabel htmlFor="duration">Duration (hrs)</FormLabel>
                <TextField
                  id="duration"
                  type="number"
                  name="duration"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  fullWidth
                  variant="outlined"
                  inputProps={{ min: 1, max: 8 }}
                />
              </FormControl>
              <FormControl>
                <FormLabel htmlFor="reservationDate">Reservation Date</FormLabel>
                <TextField
                  id="reservationDate"
                  type="date"
                  name="reservationDate"
                  value={reservationDate}
                  onChange={(e) => setReservationDate(e.target.value)}
                  fullWidth
                  variant="outlined"
                />
              </FormControl>
              <FormControl>
                <FormLabel htmlFor="reservationTime">Reservation Time</FormLabel>
                <TextField
                  id="reservationTime"
                  type="time"
                  name="reservationTime"
                  value={reservationTime}
                  onChange={(e) => setReservationTime(e.target.value)}
                  fullWidth
                  variant="outlined"
                />
              </FormControl>
              <Button type="submit" fullWidth variant="contained">
                Reserve Room
              </Button>
            </Box>
          </Card>
        </ReservationContainer>
      </AppTheme>
    </div>
  );
}

export default RoomReservation;
