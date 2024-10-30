import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CssBaseline from '@mui/material/CssBaseline';
import AppTheme from './AppTheme';

const Nice = (props) => {
  return (
    <AppTheme {...props}>
      <CssBaseline />
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          backgroundColor: 'black',
        }}
      >
        <Typography
          variant="h1"
          sx={{
            fontSize: '10rem',
            fontWeight: 'bold',
            background: 'linear-gradient(90deg, #ff0000, #ffa500, #ffff00, #008000, #0000ff, #4b0082, #ee82ee)',
            WebkitBackgroundClip: 'text',
            color: 'transparent',
            textAlign: 'center',
          }}
        >
          BITCHNESS
        </Typography>
      </Box>
    </AppTheme>
  );
};

export default Nice;
