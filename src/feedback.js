import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import FormLabel from '@mui/material/FormLabel';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
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

const FeedbackContainer = styled(Stack)(({ theme }) => ({
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

function Feedback(props) {
  const [formData, setFormData] = useState({
    userId: '', // Initialize userId field
    type: '',
    bookName: '', 
    bookAuthor: '', 
    rating: '', 
    comments: ''
  });

  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState('');

  useEffect(() => {
    const userId = localStorage.getItem('userId');
    if (userId) {
      setFormData((prevData) => ({ ...prevData, userId }));
    }
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const token = localStorage.getItem('token'); // fetch the token
  
    console.log('Submitting feedback with data:', formData);
  
    try {
      const response = await fetch('http://localhost:5000/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });
  
      const responseData = await response.json();
      if (response.ok) {
        setMessage(responseData.message || 'Feedback created successfully');
        setMessageType('success');
        setFormData({
          userId: formData.userId, // persist userId when resetting form
          type: '',
          bookName: '', 
          bookAuthor: '', 
          rating: '', 
          comments: ''
        });
        setTimeout(() => {
          setMessage(null);
          setMessageType('');
        }, 2000);
      } else if (response.status === 400) {
        setMessage(responseData.message || 'Validation error');
        setMessageType('danger');
      } else {
        setMessage('Error creating feedback');
        setMessageType('danger');
      }
    } catch (error) {
      console.error('Error:', error);
      setMessage('An error occurred while creating the feedback');
      setMessageType('danger');
    }
  };

  return (
    <div>
      <NavBar />
      <AppTheme {...props}>
        <CssBaseline enableColorScheme />
        <FeedbackContainer direction="column">
          <ColorModeSelect sx={{ position: 'fixed', top: '1rem', right: '1rem' }} />
          <Card variant="outlined">
            <Typography
              component="h1"
              variant="h4"
              sx={{ width: '100%', fontSize: 'clamp(2rem, 10vw, 2.15rem)', mt: 2 }}
            >
              Leave a Book Review
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
                <FormLabel htmlFor="type">Issue</FormLabel>
                <TextField
                  id="type"
                  select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  fullWidth
                  variant="outlined"
                  SelectProps={{
                    native: true,
                  }}
                >
                  <option value="" disabled>Select issue type</option>
                  <option value="comment">Comment</option>
                  <option value="suggestion">Suggestion</option>
                  <option value="complaint">Complaint</option>
                  <option value="review">Review</option>
                </TextField>
              </FormControl>
              <FormControl>
                <FormLabel htmlFor="bookName">Book Name</FormLabel>
                <TextField
                  id="bookName"
                  name="bookName"
                  value={formData.bookName}
                  onChange={handleChange}
                  placeholder="Enter book name"
                  required
                  fullWidth
                  variant="outlined"
                />
              </FormControl>
              <FormControl>
                <FormLabel htmlFor="bookAuthor">Book Author</FormLabel>
                <TextField
                  id="bookAuthor"
                  name="bookAuthor"
                  value={formData.bookAuthor}
                  onChange={handleChange}
                  placeholder="Enter book author"
                  required
                  fullWidth
                  variant="outlined"
                />
              </FormControl>
              <FormControl>
                <FormLabel htmlFor="rating">Overall Rating</FormLabel>
                <TextField
                  id="rating"
                  type="number"
                  name="rating"
                  value={formData.rating}
                  onChange={handleChange}
                  placeholder="Enter rating (1-10)"
                  required
                  fullWidth
                  variant="outlined"
                  inputProps={{ min: 1, max: 10 }}
                />
              </FormControl>
              <FormControl>
                <FormLabel htmlFor="comments">Comments</FormLabel>
                <TextField
                  id="comments"
                  name="comments"
                  value={formData.comments}
                  onChange={handleChange}
                  placeholder="Enter comments"
                  multiline
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
                Submit Feedback
              </Button>
            </Box>
          </Card>
        </FeedbackContainer>
      </AppTheme>
    </div>
  );
}

export default Feedback;
