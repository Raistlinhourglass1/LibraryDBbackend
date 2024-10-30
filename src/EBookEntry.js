import React, { useState } from 'react';
import { Breadcrumbs, Box, Button, Container, Link, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { DatePicker, LocalizationProvider  } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import dayjs from 'dayjs';

const format = [
    {
        value: 'pdf',
        label: 'PDF',
    },
    {
        value: 'epub',
        label: 'EPUB',
    },
    {
        value: 'online',
        label: 'Online',
    }
];

const access_type = [
    {
        value: 'open access',
        label: 'Open Access',
    },
    {
        value: 'subscription-based',
        label: 'Subscription-Based',
    },
    {
        value: 'library patrons only',
        label: 'Library Patrons Only',
    }
];

function EBookEntry() {
    const [cleared, setCleared] = React.useState(false);
    
    const [formData, setFormData] = useState({
        ebIsbn: '',
        ebTitle: '',
        ebAuthor: '',
        ebPublisher: '',
        ebCategory: '',
        ebEdition: '',
        ebLanguage: '',
        ebDate: '',
        ebFormat: '',
        ebUrl:'',
        ebAccessType: '',
        ebNumCopies: '',
        ebSummary: '',
        ebNotes: '',
    });

    const [message, setMessage] = useState(null); 
    const [messageType, setMessageType] = useState('');
    const [error, setError] = useState(false); // State for error
    const [helperText, setHelperText] = useState(''); // State for helper text

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value,
        });
        if (!/^\d{10}|\d{13}$/.test(value)) {
            setError(true);
            setHelperText("Invalid ISBN format");
          } else {
            setError(false);
            setHelperText("Enter the ISBN");
          }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log('Original formData:', formData);

        try {
            const response = await fetch('http://localhost:5000/catalog-entry/ebook', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });
            console.log('Response:', response);

            if (response.ok) {
                setMessage('eBook added successfully');
                setMessageType('success');
            } else if (response.status === 400) {
                const errorData = await response.json();
                setMessage(errorData.message);
                setMessageType('danger');
            } else {
                const errorData = await response.json(); // Get the error data if available
                throw new Error(`Error: ${errorData.message || 'Something went wrong'}`);
                //setMessage('Error adding book');
                //setMessageType('danger');
            }
            const responseData = await response.json();
            setMessage(responseData.message); // Set success message
        } catch (error) {
            console.error('Error:', error);
            setMessage('Error submitting data:' + error.message);
            setMessageType('danger');
        }
    };
    
    React.useEffect(() => {
        if (cleared) {
        const timeout = setTimeout(() => {
            setCleared(false);
        }, 1500);
    
        return () => clearTimeout(timeout);
        }
        return () => {};
    }, [cleared]);
      
  return (
    <>
        <Container maxWidth="lg">
            <Box sx={{ bgcolor: '#f2f2f2', height: '100%' }}>
                <Breadcrumbs aria-label="breadcrumb">
                    <Link underline="hover" color="inherit" href="/">
                        Home
                    </Link>
                    <Link
                        underline="hover"
                        color="inherit"
                        href="/material-ui/getting-started/installation/"
                    >
                        Books
                    </Link>
                    <Typography sx={{ color: 'text.primary' }}>Add New eBook</Typography>
                </Breadcrumbs>

                <Typography variant="h4">Add New eBook</Typography>

                <Box
                    component="form"
                    sx={{ '& .MuiTextField-root': { m: 1, width: '25ch' } }}
                    noValidate
                    autoComplete="off"
                    onSubmit={handleSubmit}
                    >
                    <div>
                        <TextField
                            helperText="Enter the ISBN"
                            id="standard-basic"
                            label="ISBN"
                            type="number"
                            variant="standard"
                            name="ebIsbn"
                            value={formData.ebIsbn}
                            onChange={handleChange}
                            />
                         <TextField
                            required
                            helperText="Enter the Title"
                            id="standard-required"
                            label="Title"
                            variant="standard"
                            name="ebTitle"
                            value={formData.ebTitle}
                            onChange={handleChange}
                            />
                        <TextField
                            required
                            helperText="Enter the Author"
                            id="standard-required"
                            label="Author"
                            variant="standard"
                            name="ebAuthor"
                            value={formData.ebAuthor}
                            onChange={handleChange}
                            />
                         <TextField
                            helperText="Enter the Publisher"
                            id="standard-basic"
                            label="Publisher"
                            variant="standard"
                            name="ebPublisher"
                            value={formData.ebPublisher}
                            onChange={handleChange}
                            />
                            <TextField
                            helperText="Enter the Category"
                            id="standard-basic"
                            label="Category"
                            variant="standard"
                            name="ebCategory"
                            value={formData.ebCategory}
                            onChange={handleChange}
                            />
                    </div>
                    <div>
                        <TextField
                            id="standard-basic"
                            label="Edition"
                            variant="standard"
                            name="ebEdition"
                            value={formData.ebEdition}
                            onChange={handleChange}
                            />
                        <TextField
                            id="standard-basic"
                            label="Language"
                            variant="standard"
                            name="ebLanguage"
                            value={formData.ebLanguage}
                            onChange={handleChange}
                        />
                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                            <DatePicker 
                                variant='standard'
                                slotProps={{
                                    textField: {
                                      helperText: 'Year',
                                    }, field: { 
                                        clearable: true, 
                                        onClear: () => setCleared(true) 
                                    }
                                  }}
                                label={'Copyright Year'} 
                                views={['year']} 
                                name="ebDate"
                                value={formData.ebDate ? dayjs(formData.ebDate, 'YYYY') : null} // Ensure valid date
                                onChange={(newValue) => {
                                    if (newValue) { // Check if newValue is valid
                                        setFormData((prevFormData) => ({
                                            ...prevFormData,
                                            ebDate: newValue.year(), // Store the year directly as a number
                                        }));
                                    } else {
                                        setFormData((prevFormData) => ({
                                            ...prevFormData,
                                            ebDate: null, // Set to null when cleared
                                        }));
                                    }
                                }}
                                />
                                 
                        </LocalizationProvider>
                    <div>
                        <TextField
                            id="standard-select-type"
                            select
                            label="Format"
                            helperText="Please select the format type"
                            variant="standard"
                            name="ebFormat"
                            value={formData.ebFormat}
                            onChange={handleChange}
                            >
                            {format.map((option) => (
                                <MenuItem key={option.value} value={option.value}>
                                {option.label}
                                </MenuItem>
                            ))}
                        </TextField>
                        <TextField
                            id="standard-basic"
                            label="URL"
                            variant="standard"
                            name="ebUrl"
                            value={formData.ebUrl}
                            onChange={handleChange}
                        />
                        <TextField
                            id="standard-select-type"
                            select
                            label="Access Type"
                            helperText="Please select the access type"
                            variant="standard"
                            name="ebAccessType"
                            value={formData.ebAccessType}
                            onChange={handleChange}
                            >
                            {access_type.map((option) => (
                                <MenuItem key={option.value} value={option.value}>
                                {option.label}
                                </MenuItem>
                            ))}
                        </TextField>
                        <TextField
                            id="standard-basic"
                            label="Number of Copies"
                            variant="standard"
                            name="ebNumCopies"
                            value={formData.ebNumCopies}
                            onChange={handleChange}
                        />
                        
                    </div>
                         <TextField
                            id="outlined-multiline-static"
                            label="Summary"
                            multiline
                            rows={4}
                            name="ebSummary"
                            value={formData.ebSummary}
                            onChange={handleChange}
                            />
                        <TextField
                            id="outlined-multiline-static"
                            label="Notes"
                            multiline
                            rows={4}
                            name="ebNotes"
                            value={formData.ebNotes}
                            onChange={handleChange}
                        />
                    </div>
                </Box>
                <Stack spacing={2} direction="row" justifyContent="flex-end">
                    <Button variant="text">Clear</Button>
                    <Button variant="outlined">Cancel</Button>
                    <Button variant="contained" color="primary" onClick={handleSubmit}>Enter</Button>
                </Stack>
                {/*message && <div>{message}</div>} {'FIXME:: cant add book info'*/}
            </Box>
        </Container>
    </>
  )
}

export default EBookEntry