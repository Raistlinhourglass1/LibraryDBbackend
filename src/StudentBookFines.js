import * as React from 'react';
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
import { DataGrid, GridRowsProp, GridColDef, gridDateTimeFormatter } from '@mui/x-data-grid';
import Chip from '@mui/material/Chip';
import { differenceInDays } from 'date-fns';



function renderStatus(status) {
  const colors = {
    Early: 'success',
    Late: 'error',
  };

  return <Chip label={status} color={colors[status]} size="small" />;
}

const calculateTimeDue = (dueDate) => {
  const now = new Date(); // Get the current date
  const due = new Date(dueDate); // Convert the due date to a Date object
  const daysDifference = differenceInDays(now, due);

  if (daysDifference > 0) {
    return { status: 'Late', timeDue: `${daysDifference} days overdue`, overdueDays: daysDifference }; // If overdue
  } else if (daysDifference === 0) {
    return { status: 'Early', timeDue: 'Due today', overdueDays: 0 }; // Due today
  } else {
    return { status: 'Early', timeDue: `${Math.abs(daysDifference)} days remaining`, overdueDays: 0 }; // Early
  }
};

const calculateAmountDue = (overdueDays) => {
  const ratePerDay = 20; // $20 per day overdue
  return overdueDays * ratePerDay;
};




const columns = [
    { 
      field: 'id', 
      headerName: 'ID', 
      width: 110
    },
    {
        field: 'status', 
        headerName: 'Status', 
        width: 130,
        sortable: false,
        renderCell: (params) => {
          const { status } = calculateTimeDue(params.row.dueDate);
          return renderStatus(status);
        },

    },
    {
      field: 'title',
      headerName: 'Book Title',
      width: 150,
      editable: true,
    },
    {
      field: 'ISBN',
      headerName: 'Book ISBN',
      width: 160,
      editable: true,
    },
    {
      field: 'dueDate',
      headerName: 'Due Date',
      width: 150,
    },
    {
      field: 'elaspedTime', // In the 00.00 Format
      headerName: 'Time Overdue',
      description: 'This column has a value getter and is not sortable.',
      sortable: false,
      width: 160,
      renderCell: (params) => {
        const { timeDue } = calculateTimeDue(params.row.dueDate);
        return timeDue;
      },
    },
    {
        field: 'Due',
        headerName: 'Amount Due',
        width: 170,
        sortable: false,
        editable: true, //amount should be changed automatically
        renderCell: (params) => {
          const { overdueDays } = calculateTimeDue(params.row.dueDate);
          const amountDue = calculateAmountDue(overdueDays);
          return `$${amountDue}`; // Display the amount due in dollars
        },

  
      },

  ];







  const rows = [
    { id: 1, 
      Catagory: 'Book', 
      title: 'Calculus 2010', 
      ISBN: '9781617408397',
      dueDate: '2024/12/31',
    },
    { id: 2, 
      Catagory: 'Book', 
      title: 'Physics 2425', 
      ISBN: '6354728191032', 
      dueDate: '2024/10/15',
    },
    { id: 3, 
      Catagory: 'Book', 
      title: 'Music 1752', 
      ISBN: '2948673205671',
      dueDate: '2024/11/31',
    },
    { id: 4, 
      Catagory: 'Book', 
      title: 'Astrology 1852', 
      ISBN: '7853926140289', 
      dueDate: '2024/11/14',
    },
    { id: 5, 
      Catagory: 'Book', 
      title: 'Geology 2684', 
      ISBN: '4912063781520', 
      dueDate: '2023/10/31',
    },

    
  ];



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
  
export default function StudentBookFines(props) {
return (
<AppTheme {...props}>
  <CssBaseline enableColorScheme />
  <SignInContainer direction='column' justifyContent='space-between'>
    <ColorModeSelect sx={{ position: 'fixed', top: '1rem', right: '1rem' }} />
    <card varient="outlines">
    <Box
    sx={{
        height: 663,
        width: '80%', // Adjust the width of the table box
        margin: 'auto', // Center horizontally
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'absolute', // Position the box absolutely in relation to the viewport
        top: '50%', // Move it to 50% from the top of the viewport
        left: '50%', // Move it to 50% from the left of the viewport
        transform: 'translate(-50%, -50%)', // Center the box by moving it back by 50% of its own width and height
        boxShadow: 3, // Add a shadow to the enclosing box
        borderRadius: 2, // Optional: rounded corners
        padding: 2, // Optional: some padding around the table
        bgcolor: 'background.paper', // Optional: change the background color of the box
    }}
  >
   <DataGrid
          rows={rows}
          columns={columns}
          initialState={{
            pagination: {
              paginationModel: {
                pageSize: 10,
              },
            },
          }}
          pageSizeOptions={[5]}
          checkboxSelection
          disableRowSelectionOnClick
        />
  </Box>
    </card>
  </SignInContainer>

</AppTheme>
)
}
