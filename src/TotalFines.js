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
import { DataGrid, GridRowsProp, GridColDef } from '@mui/x-data-grid';
import Chip from '@mui/material/Chip';
import { differenceInDays } from 'date-fns'; // Using date-fns for date calculations





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
    { field: 'id', headerName: 'ID', width: 110 },
    {
      field: 'status', 
      headerName: 'Status', 
      width: 150,
      renderCell: (params) => {
        const { status } = calculateTimeDue(params.row.dueDate);
        return renderStatus(status);
      },



  },
    {
      field: 'type', 
      headerName: 'Type', 
      width: 120,
      editable: true,
    },
    {
      field: 'firstName',
      headerName: 'First name',
      width: 150,
      editable: true,
    },
    {
      field: 'lastName',
      headerName: 'Last name',
      width: 150,
      editable: true,
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
      field: 'dueDate',
      headerName: 'Due Date',
      width: 150,
    },
    {
      field: 'Due',
      headerName: 'Amount Due',
      width: 170,
      editable: true, //amount should be changed automatically
      renderCell: (params) => {
        const { overdueDays } = calculateTimeDue(params.row.dueDate);
        const amountDue = calculateAmountDue(overdueDays);
        return `$${amountDue}`; // Display the amount due in dollars
      },
    },
  ];
  const rows = [
    { id: 1, type: 'Book', lastName: 'Snow', firstName: 'Jon', dueDate: '2024/10/21' },
    { id: 2, type: 'Book', lastName: 'Lannister', firstName: 'Cersei', dueDate: '2024/11/21' },
    { id: 3, type: 'Laptop', lastName: 'Lannister', firstName: 'Jaime', dueDate: '2025/12/24' },
    { id: 4, type: 'Book', lastName: 'Stark', firstName: 'Arya', dueDate: '2024/09/21' },
    { id: 5, type: 'Calculator', lastName: 'Targaryen', firstName: 'Daenerys', dueDate: '2024/08/21' },
    { id: 6, type: 'Laptop', lastName: 'Melisandre', firstName: 'Buddy', dueDate: '2024/05/21' },
    { id: 7, type: 'Calculator', lastName: 'Clifford', firstName: 'Ferrara', dueDate: '2020/01/01' },
    { id: 8, type: 'Book', lastName: 'Stark', firstName: 'Robb', dueDate: '2024/12/15' },
    { id: 9, type: 'Calculator', lastName: 'Bolton', firstName: 'Ramsay', dueDate: '2024/07/21' },
    { id: 10, type: 'Laptop', lastName: 'Tyrell', firstName: 'Margaery', dueDate: '2024/10/15' },
    { id: 11, type: 'Book', lastName: 'Martell', firstName: 'Oberyn', dueDate: '2024/09/01' },
    { id: 12, type: 'Laptop', lastName: 'Greyjoy', firstName: 'Theon', dueDate: '2024/03/30' },
    { id: 13, type: 'Calculator', lastName: 'Baelish', firstName: 'Petyr', dueDate: '2024/06/25' },
    { id: 14, type: 'Book', lastName: 'Baratheon', firstName: 'Stannis', dueDate: '2024/12/05' },
    { id: 15, type: 'Laptop', lastName: 'Baratheon', firstName: 'Robert', dueDate: '2025/01/31' },
    { id: 16, type: 'Calculator', lastName: 'Clegane', firstName: 'Sandor', dueDate: '2024/11/11' },
    { id: 17, type: 'Book', lastName: 'Tarth', firstName: 'Brienne', dueDate: '2025/02/10' },
    { id: 18, type: 'Calculator', lastName: 'Mormont', firstName: 'Jorah', dueDate: '2024/07/09' },
    { id: 19, type: 'Book', lastName: 'Tully', firstName: 'Edmure', dueDate: '2024/10/02' },
    { id: 20, type: 'Laptop', lastName: 'Arryn', firstName: 'Lysa', dueDate: '2024/08/30' },
    { id: 21, type: 'Calculator', lastName: 'Freys', firstName: 'Walder', dueDate: '2023/12/10' },
    { id: 22, type: 'Laptop', lastName: 'Reed', firstName: 'Meera', dueDate: '2024/01/15' },
    { id: 23, type: 'Book', lastName: 'Targaryen', firstName: 'Viserys', dueDate: '2024/11/02' },
    { id: 24, type: 'Calculator', lastName: 'Hound', firstName: 'Clegane', dueDate: '2024/09/28' },
    { id: 25, type: 'Laptop', lastName: 'Bolton', firstName: 'Roose', dueDate: '2024/04/18' },
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
  
export default function TotalFines(props) {
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