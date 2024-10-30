
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import CssBaseline from '@mui/material/CssBaseline';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormLabel from '@mui/material/FormLabel';
import FormControl from '@mui/material/FormControl';
import Link from '@mui/material/Link';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import MuiCard from '@mui/material/Card';
import { styled } from '@mui/material/styles';
import ForgotPassword from './ForgotPassword';
import { CogIcon, FacebookIcon, SitemarkIcon } from './CustomIcons';
import AppTheme from './AppTheme';
import ColorModeSelect from './ColorModeSelect';
import React, { useState } from 'react';
import { Avatar, Card, CardContent, IconButton, Tabs, Tab, InputAdornment, } from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import Grid from '@mui/material/Grid2';
import PropTypes from 'prop-types';







const SignInContainer = styled(Stack)(({ theme }) => ({
    minHeight: '100vh', // Full viewport height for vertical centering
    display: 'flex', // Flexbox display for centering
    justifyContent: 'center', // Center vertically
    alignItems: 'center', // Center horizontally
    position: 'relative', // Required for the background with ::before
    padding: theme.spacing(2),
    [theme.breakpoints.up('sm')]: {
      padding: theme.spacing(4),
    },
    '&::before': {
      content: '""',
      display: 'block',
      position: 'absolute',
      zIndex: -1,
      inset: 0,
      backgroundImage:
        'radial-gradient(ellipse at 50% 50%, hsl(210, 100%, 97%), hsl(0, 0%, 100%))',
      backgroundRepeat: 'no-repeat',
      ...theme.applyStyles('dark', {
        backgroundImage:
          'radial-gradient(at 50% 50%, hsla(210, 100%, 16%, 0.5), hsl(220, 30%, 5%))',
      }),
    },
  }));
  

  export default function ProfilePage(props) {
    const [value, setValue] = React.useState(0);

   


    
    return (
        <AppTheme {...props}>
          <CssBaseline enableColorScheme />
          <SignInContainer direction="column" justifyContent="space-between">
            <ColorModeSelect sx={{ position: 'fixed', top: '1rem', right: '1rem' }} />
            <Card variant="outlined">
              <box>
                
              </box>
            
              
            </Card>
          </SignInContainer>
        

        </AppTheme>
      );
    }


  
