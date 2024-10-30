import * as React from 'react';
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

const CreateRoomContainer = styled(Stack)(({ theme }) => ({
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

export default function CreateRoom(props) {
  const [formData, setFormData] = React.useState({
    Rnum: '',
    Rname: '',
    Psize: '',
    Requip: '',
    Rdescript: ''
  });

  const [message, setMessage] = React.useState(null);
  const [messageType, setMessageType] = React.useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value,
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      const response = await fetch('http://localhost:5000/create-room', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setMessage('Room created successfully');
        setMessageType('success');
        setFormData({
            Rnum: '',
            Rname: '',
            Psize: '',
            Requip: '',
            Rdescript: ''
        });
      } else if (response.status === 400) {
        const errorData = await response.json();
        setMessage(errorData.message);
        setMessageType('danger');
      } else {
        setMessage('Error creating room');
        setMessageType('danger');
      }
    } catch (error) {
      console.error('Error:', error);
      setMessage('An error occurred while creating the room');
      setMessageType('danger');
    }
  };

  React.useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage(null);
        setMessageType('');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  return (
    <div>
      <NavBar />
      <AppTheme {...props}>
        <CssBaseline enableColorScheme />
        <CreateRoomContainer direction="column">
          <ColorModeSelect sx={{ position: 'fixed', top: '1rem', right: '1rem' }} />
          <Card variant="outlined">
            <Typography
              component="h1"
              variant="h4"
              sx={{ width: '100%', fontSize: 'clamp(2rem, 10vw, 2.15rem)', mt: 2 }}
            >
              Create Room
            </Typography>
            {message && (
              <div className={`alert alert-${messageType} mt-3`} role="alert">
                {message}
              </div>
            )}
            <Box
              component="form"
              onSubmit={handleSubmit}
              noValidate
              sx={{
                display: 'flex',
                flexDirection: 'column',
                width: '100%',
                gap: 2,
              }}
            >
              <FormControl>
                <FormLabel htmlFor="Rname">Room Name</FormLabel>
                <TextField
                  id="Rname"
                  value={formData.Rname}
                  onChange={handleChange}
                  placeholder="Enter room name"
                  required
                  fullWidth
                  variant="outlined"
                />
              </FormControl>
              <FormControl>
                <FormLabel htmlFor="Rnum">Room Number</FormLabel>
                <TextField
                  id="Rnum"
                  value={formData.Rnum}
                  onChange={handleChange}
                  placeholder="Enter room number"
                  required
                  fullWidth
                  variant="outlined"
                />
              </FormControl>
              <FormControl>
                <FormLabel htmlFor="Psize">Max Capacity</FormLabel>
                <TextField
                  id="Psize"
                  type="number"
                  value={formData.Psize}
                  onChange={handleChange}
                  placeholder="Enter max capacity"
                  required
                  fullWidth
                  variant="outlined"
                  inputProps={{ min: 1 }}
                />
              </FormControl>
              <FormControl>
                <FormLabel htmlFor="Requip">Room Equipment</FormLabel>
                <TextField
                  id="Requip"
                  value={formData.Requip}
                  onChange={handleChange}
                  placeholder="Enter room equipment"
                  required
                  fullWidth
                  variant="outlined"
                />
              </FormControl>
              <FormControl>
                <FormLabel htmlFor="Rdescript">Description</FormLabel>
                <TextField
                  id="Rdescript"
                  value={formData.Rdescript}
                  onChange={handleChange}
                  placeholder="Enter room description"
                  multiline
                  rows={4}
                  required
                  fullWidth
                  variant="outlined"
                />
              </FormControl>
              <Button
                type="submit"
                fullWidth
                variant="contained"
              >
                Create Room
              </Button>
            </Box>
          </Card>
        </CreateRoomContainer>
      </AppTheme>
    </div>
  );
}
