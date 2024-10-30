import React, { useState } from 'react';
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
  maxWidth: '100%', // allow the card to expand based on content
  boxShadow:
    'hsla(220, 30%, 5%, 0.05) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.05) 0px 15px 35px -5px',
  ...theme.applyStyles('dark', {
    boxShadow:
      'hsla(220, 30%, 5%, 0.5) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.08) 0px 15px 35px -5px',
  }),
}));

const ReportsContainer = styled(Stack)(({ theme }) => ({
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

const TableContainer = styled(Box)(({ theme }) => ({
  overflowX: 'auto',
  maxHeight: '400px', // making table scrollable if it grows too tall
  width: '100%',
  marginTop: theme.spacing(3),
  borderRadius: theme.shape.borderRadius,
  border: `1px solid ${theme.palette.divider}`,
  backgroundColor: theme.palette.background.paper,
}));

const StyledTable = styled('table')(({ theme }) => ({
  width: '100%',
  borderCollapse: 'collapse',
  '& th, & td': {
    padding: theme.spacing(1),
    border: `1px solid ${theme.palette.divider}`,
    textAlign: 'left',
  },
  '& th': {
    backgroundColor: theme.palette.action.hover,
  },
}));

function Reports(props) {
  const [specification, setSpecification] = useState('');
  const [date, setDate] = useState('');
  const [userId, setUserId] = useState('');
  const [staffId, setStaffId] = useState('');
  const [bookName, setBookName] = useState('');
  const [bookIsbn, setBookIsbn] = useState('');
  const [reportData, setReportData] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5000/get-reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ specification, date, user_id: userId, book_name: bookName, book_isbn: bookIsbn, staff_id: staffId }),
      });
      if (!response.ok) {
        throw new Error('Error fetching reports');
      }
      const data = await response.json();
      setReportData(data);
      setErrorMessage('');
    } catch (error) {
      console.error('Error:', error);
      setErrorMessage('Failed to fetch reports. Please try again.');
      setReportData([]);
    }
  };

  const renderTableHeaders = () => {
    if (reportData.length === 0) return null;
    const headers = Object.keys(reportData[0]);
    return (
      <thead>
        <tr>
          {headers.map((header, index) => (
            <th key={index}>{header}</th>
          ))}
        </tr>
      </thead>
    );
  };

  const renderTableRows = () => {
    return reportData.map((item, index) => (
      <tr key={index}>
        {Object.values(item).map((value, idx) => (
          <td key={idx}>{value}</td>
        ))}
      </tr>
    ));
  };

  return (
    <div>
      <NavBar />
      <AppTheme {...props}>
        <CssBaseline enableColorScheme />
        <ReportsContainer direction="column">
          <ColorModeSelect sx={{ position: 'fixed', top: '1rem', right: '1rem' }} />
          <Card variant="outlined">
            <Typography
              component="h1"
              variant="h4"
              sx={{ width: '100%', fontSize: 'clamp(2rem, 10vw, 2.15rem)', mt: 2 }}
            >
              Generate Report
            </Typography>
            {errorMessage && (
              <div className="alert alert-danger mt-3" role="alert">
                {errorMessage}
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
                <FormLabel htmlFor="specification">Specification</FormLabel>
                <TextField
                  id="specification"
                  select
                  name="specification"
                  value={specification}
                  onChange={(e) => setSpecification(e.target.value)}
                  fullWidth
                  variant="outlined"
                  SelectProps={{
                    native: true,
                  }}
                >
                  <option value="">-- Select Specification --</option>
                  <option value="laptops">Laptops</option>
                  <option value="calculators">Calculators</option>
                  <option value="books">Books</option>
                  <option value="audio_books">Audio Books</option>
                  <option value="library card">Library Card</option>
                  <option value="room reservations">Room Reservations</option>
                  <option value="feedback">Feedback</option>
                  <option value="users">Users</option>
                  <option value="staff">Staff</option>
                </TextField>

              </FormControl>
              <FormControl>
                <FormLabel htmlFor="date">By Date (optional, YYYY-MM-DD)</FormLabel>
                <TextField
                  id="date"
                  name="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  fullWidth
                  variant="outlined"
                />
              </FormControl>
              <FormControl>
                <FormLabel htmlFor="userId">By User ID (optional)</FormLabel>
                <TextField
                  id="userId"
                  name="userId"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  fullWidth
                  variant="outlined"
                />
              </FormControl>

              <FormControl>
                <FormLabel htmlFor="staffId">By Staff ID (optional)</FormLabel>
                <TextField
                  id="staffId"
                  name="staffId"
                  value={staffId}
                  onChange={(e) => setStaffId(e.target.value)}
                  fullWidth
                  variant="outlined"
                />
              </FormControl>

              <FormControl>
                <FormLabel htmlFor="bookName">By Book Name (optional)</FormLabel>
                <TextField
                  id="bookName"
                  name="bookName"
                  value={bookName}
                  onChange={(e) => setBookName(e.target.value)}
                  fullWidth
                  variant="outlined"
                />
              </FormControl>

              <FormControl>
                <FormLabel htmlFor="bookIsbn">By Book ISBN (optional)</FormLabel>
                <TextField
                  id="bookIsbn"
                  name="bookIsbn"
                  value={bookIsbn}
                  onChange={(e) => setBookIsbn(e.target.value)}
                  fullWidth
                  variant="outlined"
                />
              </FormControl>

              <Button type="submit" fullWidth variant="contained">
                Submit
              </Button>
            </Box>
            <Typography variant="h6" mt={4}>Report Data:</Typography>
            <TableContainer>
              {reportData.length > 0 ? (
                <StyledTable>
                  {renderTableHeaders()}
                  <tbody>{renderTableRows()}</tbody>
                </StyledTable>
              ) : (
                <Typography>No data available</Typography>
              )}
            </TableContainer>
          </Card>
        </ReportsContainer>
      </AppTheme>
    </div>
  );
}

export default Reports;
