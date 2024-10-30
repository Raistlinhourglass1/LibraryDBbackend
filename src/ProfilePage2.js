import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Stack from '@mui/material/Stack';
import MuiCard from '@mui/material/Card';
import { styled } from '@mui/material/styles';
import Grid from '@mui/material/Grid2';
import { Avatar, Paper, Tabs, Tab, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';
import PropTypes from 'prop-types';
import AppTheme from './AppTheme';
import ColorModeSelect from './ColorModeSelect';
import StudentBookRentals from './StudentBookRentals';
import StudentLaptopRentals from './StudentLaptopRentals';
import StudentCalculatorRentals from './StudentCalculatorRentals';
import Link from '@mui/material/Link';
import RoomReserveTable from './RoomReserveTable';



// Function to determine the max books allowed based on user_level
const getMaxBooksAllowed = (userLevel) => {
  switch (userLevel) {
    case 'Student':
      return 10;
    case 'Teacher':
      return 50;
    case 'Staff':
      return 100;
    case 'Admin':
      return 200;
    default:
      return 0;
  }
};

// Functions for calculating data
const SignInContainer = styled(Stack)(({ theme }) => ({
  minHeight: '100vh',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  position: 'relative',
  padding: theme.spacing(2),
  '&::before': {
    content: '""',
    display: 'block',
    position: 'absolute',
    zIndex: -1,
    inset: 0,
    backgroundImage: 'radial-gradient(ellipse at 50% 50%, hsl(210, 100%, 97%), hsl(0, 0%, 100%))',
    backgroundRepeat: 'no-repeat',
    ...theme.applyStyles('dark', {
      backgroundImage: 'radial-gradient(at 50% 50%, hsla(210, 100%, 16%, 0.5), hsl(220, 30%, 5%))',
    }),
  },
}));

function CustomTabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

CustomTabPanel.propTypes = {
  children: PropTypes.node,
  index: PropTypes.number.isRequired,
  value: PropTypes.number.isRequired,
};

function a11yProps(index) {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`,
  };
}

export default function ProfilePage2(props) {
  const [value, setValue] = useState(0); // Tab state
  const [userInfo, setUserInfo] = useState(null); // State to hold user profile data
  const [isEditing, setIsEditing] = useState(false); // Edit mode state
  const [editedInfo, setEditedInfo] = useState({}); // State to hold edited info
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false); // State for delete confirmation dialog
  const navigate = useNavigate();

  const fetchProfileData = () => {
    const token = localStorage.getItem('token');
    axios
      .get('http://localhost:5000/ProfilePage2', {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((response) => {
        setUserInfo(response.data);
        setEditedInfo({
          first_name: response.data.first_name,
          last_name: response.data.last_name,
        });
        console.log("User Info:", response.data);
      })
      .catch((error) => {
        console.error('Error fetching profile data:', error);
        localStorage.removeItem('token');
        navigate('/SignIn');
      });
  };

  useEffect(() => {
    fetchProfileData();
  }, [navigate]);

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedInfo({ ...editedInfo, [name]: value });
  };

  const handleSave = () => {
    const token = localStorage.getItem('token');
    axios
      .put('http://localhost:5000/ProfilePage2', editedInfo, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(() => {
        setIsEditing(false);
        fetchProfileData(); // Refresh profile data after successful update
      })
      .catch((error) => {
        console.error('Error updating profile data:', error);
      });
  };

  const handleDeleteProfile = () => {
    const token = localStorage.getItem('token');
    axios
      .delete('http://localhost:5000/DeleteProfile', {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(() => {
        navigate('/SignIn'); // Redirect after deletion
      })
      .catch((error) => {
        console.error('Error deleting profile:', error);
      });
  };

  const openDeleteConfirmDialog = () => {
    setOpenConfirmDialog(true);
  };

  const closeDeleteConfirmDialog = () => {
    setOpenConfirmDialog(false);
  };

  if (!userInfo) {
    return <Typography>Loading...</Typography>; // Loading state while fetching data
  }

  return (
    <AppTheme {...props}>
      <CssBaseline enableColorScheme />
      <SignInContainer direction="column" justifyContent="space-between">
        <ColorModeSelect sx={{ position: 'fixed', top: '1rem', right: '1rem' }} />
        <MuiCard variant="outlined">
          <Paper elevation={0} sx={{ p: 3, width: '1500px', height: '700px', bgcolor: 'background.paper' }}> 
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Paper elevation={1} sx={{ p: 2, textAlign: 'center', height: '650px' }}>
                  <Avatar
                    alt="Profile Picture"
                    src="/static/images/avatar/2.jpg" // Replace with dynamic image path
                    sx={{ width: 150, height: 150, mb: 2 }}
                  />
                  <Button variant="contained" component="label" fullWidth>
                    Change Photo
                    <input type="file" hidden />
                  </Button>
                  <Box mt={4} sx={{ textAlign: 'left' }}>
                    <Typography variant="h6" gutterBottom>
                      Additional Links
                    </Typography>
                    <Box mt={2}>
                      <Link href="/SignIn" variant="body1" display="block" gutterBottom>
                        Sign out
                      </Link>
                      <br />
                      <Link href="/Feedback" variant="body2" display="block" gutterBottom>
                        Feedback
                      </Link>
                      <br />
                      <Link href="/reserve-room" variant="body2" display="block" gutterBottom>
                        Room Reservation
                      </Link>
                      <br />
                      <Link href="/create-room" variant="body2" display="block" gutterBottom>
                        Create Room
                      </Link>
                      <br />
                      {(userInfo.user_level === 'Staff' || userInfo.user_level === 'Admin') && (
                        <>
                          <Link href="http://localhost:3000/Nice" variant="body2" display="block" gutterBottom>
                            Nice
                          </Link>
                          <br />
                          <Link href="/Reports" variant="body2" display="block" gutterBottom>
                            Reports
                          </Link>
                        </>
                      )}
                    </Box>
                  </Box>
                </Paper>
              </Grid>

              <Grid item xs={12} md={8}>
                <Paper elevation={1} sx={{ p: 3, height: '650px', width: '1250px' }}>
                  <Grid container justifyContent="space-between">
                    <Box>
                      {isEditing ? (
                        <Box>
                          <TextField
                            label="First Name"
                            name="first_name"
                            value={editedInfo.first_name}
                            onChange={handleInputChange}
                            fullWidth
                            margin="normal"
                          />
                          <TextField
                            label="Last Name"
                            name="last_name"
                            value={editedInfo.last_name}
                            onChange={handleInputChange}
                            fullWidth
                            margin="normal"
                          />
                        </Box>
                      ) : (
                        <Box>
                          <Typography variant="h4">
                            {userInfo.first_name} {userInfo.last_name}
                          </Typography>
                          <Typography color="primary">{userInfo.user_level} at University of Houston</Typography>
                        </Box>
                      )}
                    </Box>
                    {isEditing ? (
                      <Box>
                        <Button variant="outlined" color="primary" onClick={handleSave} sx={{ ml: 2 }}>
                          Save
                        </Button>
                        <Button variant="outlined" color="secondary" onClick={handleEditToggle} sx={{ ml: 2 }}>
                          Cancel
                        </Button>
                        <Button variant="contained" color="error" onClick={openDeleteConfirmDialog} sx={{ ml: 2 }}>
                          Delete Profile
                        </Button>
                      </Box>
                    ) : (
                      <Button variant="outlined" color="primary" onClick={handleEditToggle}>
                        Edit Profile
                      </Button>
                    )}
                  </Grid>

                  <Dialog
                    open={openConfirmDialog}
                    onClose={closeDeleteConfirmDialog}
                  >
                    <DialogTitle>Confirm Delete</DialogTitle>
                    <DialogContent>
                      <DialogContentText>Are you sure you want to delete your profile?</DialogContentText>
                    </DialogContent>
                    <DialogActions>
                      <Button onClick={closeDeleteConfirmDialog} color="secondary">Cancel</Button>
                      <Button onClick={handleDeleteProfile} color="error">Yes, Delete</Button>
                    </DialogActions>
                  </Dialog>

                  <Box mt={3}>
                    <Box sx={{ width: '100%' }}>
                      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                        <Tabs value={value} onChange={handleChange} aria-label="basic tabs example">
                          <Tab label="Profile Details" {...a11yProps(0)} />
                          <Tab label="Book Rentals" {...a11yProps(1)} />
                          <Tab label="Laptop Rentals" {...a11yProps(2)} />
                          <Tab label="Calculator Rentals" {...a11yProps(3)} />
                          <Tab label="Reservations" {...a11yProps(4)} />
                          <Tab label="Fines Due" {...a11yProps(5)} />
                        </Tabs>
                      </Box>

                      <CustomTabPanel value={value} index={0}>
                        <Box>
                          <Grid container spacing={4}>
                            <Grid item xs={12} sm={6}>
                              <Typography variant="body1">First Name</Typography>
                              <br />
                              <Typography variant="body1">Last Name</Typography>
                              <br />
                              <Typography variant="body1">Email</Typography>
                              <br />
                              <Typography variant="body1">User ID</Typography>
                              <br />
                              <Typography variant="body1">Max Books Allowed</Typography>
                            </Grid>

                            <Grid item xs={12} sm={8}>
                              <Typography variant="body2" color="primary">{userInfo.first_name}</Typography>
                              <br />
                              <Typography variant="body2" color="primary">{userInfo.last_name}</Typography>
                              <br />
                              <Typography variant="body2" color="primary">{userInfo.email}</Typography>
                              <br />
                              <Typography variant="body2" color="primary">{userInfo.user_ID}</Typography>
                              <br />
                              <Typography variant="body2" color="primary">{getMaxBooksAllowed(userInfo.user_level)}</Typography>
                              <br />
                            </Grid>
                          </Grid>
                        </Box>
                      </CustomTabPanel>

                      <CustomTabPanel value={value} index={1}>
                        <StudentBookRentals />
                      </CustomTabPanel>

                      <CustomTabPanel value={value} index={2}>
                        <StudentLaptopRentals />
                      </CustomTabPanel>

                      <CustomTabPanel value={value} index={3}>
                        <StudentCalculatorRentals />
                      </CustomTabPanel>

                      <CustomTabPanel value={value} index={4}>
                        <RoomReserveTable/>
                      </CustomTabPanel>

                      <CustomTabPanel value={value} index={5}>
                        Fines Due
                      </CustomTabPanel>
                    </Box>
                  </Box>
                </Paper>
              </Grid>
            </Grid>
          </Paper>
        </MuiCard>
      </SignInContainer>
    </AppTheme>
  );
}