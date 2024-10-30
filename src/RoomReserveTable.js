import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import { DataGrid } from '@mui/x-data-grid';
import Chip from '@mui/material/Chip';
import { differenceInHours } from 'date-fns';
import AppTheme from './AppTheme';
import axios from 'axios';



function renderStatus(status) {
  const colors = {
    Ongoing: 'success',
    Ended: 'error',
  };
  return <Chip label={status} color={colors[status]} size="small" />;
}

const calculateTimeDue = (reservationDateTime, reservationDuration) => {
  const now = new Date();
  const reservationStart = new Date(reservationDateTime); // Convert to Date object if needed
  const reservationEnd = new Date(reservationStart.getTime() + reservationDuration * 60 * 60 * 1000);
  const timeRemaining = differenceInHours(now, reservationEnd);

  if (now >= reservationEnd ) {
    return { status: 'Ended', timeDue: `${timeRemaining} hours overdue`, overdueHours: timeRemaining };
  // } else if (hoursDifference === 0) {
  //   return { status: 'Ended', timeDue: 'Ended now', overdueHours: 0 };
  } else {
    return { status: 'Ongoing', timeDue: `${Math.abs(timeRemaining)} hours remaining`, overdueHours: 0 };
  }
};

const calculateAmountDue = (overdueHours) => {
  const ratePerHour = 5;
  return overdueHours * ratePerHour;
};

const columns = [
  { field: 'reservation_id', headerName: 'Reservation ID', width: 110 },
  { field: 'user_id', headerName: 'User ID', width: 110 },
  {
    field: 'reservation_status',
    headerName: 'Status',
    width: 100,
    sortable: false,
    renderCell: (params) => {
      const { status } = calculateTimeDue(params.row.reservation_date, params.row.reservation_duration_hrs);
      return renderStatus(status);
    },
  },
  { field: 'room_number', headerName: 'Room Number', width: 150 },
  { field: 'reservation_duration_hrs', headerName: 'Duration (hrs)', width: 160 },
  { field: 'party_size', headerName: 'Party Size', width: 150 },
  // {
  //   field: 'elapsedTime',
  //   headerName: 'Time Overdue',
  //   sortable: false,
  //   width: 160,
  //   renderCell: (params) => {
  //     const { timeDue } = calculateTimeDue(params.row.reservation_date);
  //     return timeDue;
  //   },
  // },
  // {
  //   field: 'Due',
  //   headerName: 'Amount Due',
  //   width: 140,
  //   sortable: false,
  //   renderCell: (params) => {
  //     const { overdueHours } = calculateTimeDue(params.row.reservation_date);
  //     const amountDue = calculateAmountDue(overdueHours);
  //     return `$${amountDue}`;
  //   },
  // },
];

export default function RoomReserveTable(props) {
  const [rows, setRows] = useState([]);

  useEffect(() => {
     //Step 1: Retrieve JWT token from local storage
    const token = localStorage.getItem('token');
    console.log('Token retrieved from local storage:', token);

    // Step 2: Send a GET request to the '/ProfilePage2' endpoint with the token in the Authorization header
    console.log('Sending request to /RoomReserveTable with Authorization header');
    axios.get('http://localhost:5000/RoomReserveTable', {
      //headers: { Authorization: `Bearer ${token}` },
    })
      .then((response) => {
        // Step 3: Request was successful; response data is received
        console.log('Data received from server:', response.data);
        
        // Set the data to the rows state, which will populate the table
        setRows(response.data);
        console.log('Rows state updated with server data');
      })
      .catch((error) => {
        // Step 4: Handle any errors that occur during the request
        console.error('Error fetching data:', error);

        // Optional: Additional check if the error status is 401 (Unauthorized)
        if (error.response && error.response.status === 401) {
          console.warn('Unauthorized access - possibly due to an invalid token.');
        }
      });
  }, []);








  return (
    <AppTheme {...props}>
      <Box
        sx={{
          height: 390,
          width: '100%',
          display: 'flex',
          boxShadow: 3,
          borderRadius: 2,
          padding: 1,
          bgcolor: 'background.paper',
        }}
      >
        <DataGrid
  rows={rows}
  columns={columns}
  getRowId={(row) => row.reservation_id} // Specify reservation_id as the unique identifier
  initialState={{
    pagination: {
      paginationModel: { pageSize: 10 },
    },
  }}
  pageSizeOptions={[5, 10]}
  checkboxSelection
  disableRowSelectionOnClick
/>
      </Box>
    </AppTheme>
  );
}
