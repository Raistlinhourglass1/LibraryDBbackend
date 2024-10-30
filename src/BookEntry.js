import React, { useState } from 'react';
import { Breadcrumbs, Box, Button, Container, CssBaseline, Link, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { DatePicker, LocalizationProvider  } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import dayjs from 'dayjs';

const categories = [
    {
        value: 'physical',
        label: 'Physical',
    },
    {
        value: 'digital',
        label: 'Digital',
    }
];
const sanitizeInput = (input) => {
    if (typeof input === 'string') {
        return input.replace(/'/g, "\'"); // Replace ' with ''
    }
    return input; // Return other types unchanged
};


function BookEntry() {
    const [cleared, setCleared] = React.useState(false);

    const [formData, setFormData] = useState({
        bIsbn: '',
        bTitle: '',
        bAuthor: '',
        bPublisher: '',
        bCategory: '',
        bEdition: '',
        bYear: '',
        //bDate: dayjs(),
        bMediaType: '',
        bNumPages: '',
        bNumCopies: '',
        bLang: '',
        bSummary: '',
        bNotes: '',
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
          if (name === 'bYear' && value) {
            setFormData((prevFormData) => ({
                ...prevFormData,
                bYear: value.year(),
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log('Original formData:', formData);
        const sanitizedData = {
            ...formData,
            bAuthor: sanitizeInput(formData.bAuthor),
            //bTitle: formData.bTitle.replace(/'/g, "''"),
            bSummary: sanitizeInput(formData.bSummary),
            // Add other fields that need sanitization
        };
        console.log('Original formData:', sanitizedData);
        try {
            const response = await fetch('http://localhost:5000/book-entry', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });
            console.log('Response:', response);

            if (response.ok) {
                setMessage('Book added successfully');
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
                    <Typography sx={{ color: 'text.primary' }}>Add New Book</Typography>
                </Breadcrumbs>

                <Typography variant="h4">Add New Book</Typography>

                <Box
                    component="form"
                    sx={{ '& .MuiTextField-root': { m: 1, width: '25ch' } }}
                    noValidate
                    autoComplete="off"
                    onSubmit={handleSubmit}
                    >
                    <div>
                        <TextField
                            required
                            helperText="Enter the ISBN"
                            id="standard-required"
                            label="ISBN"
                            variant="standard"
                            name="bIsbn"
                            value={formData.bIsbn}
                            onChange={handleChange}
                            />
                         <TextField
                            required
                            helperText="Enter the Title"
                            id="standard-required"
                            label="Title"
                            variant="standard"
                            name="bTitle"
                            value={formData.bTitle}
                            onChange={(e) => {
                                const sanitizedValue = sanitizeInput(e.target.value); // Sanitize input on change
                                setFormData((prevFormData) => ({
                                    ...prevFormData,
                                    bTitle: sanitizedValue, // Update state with sanitized value
                                }));
                            }}
                            />
                        <TextField
                            required
                            helperText="Enter the Author"
                            id="standard-required"
                            label="Author"
                            variant="standard"
                            name="bAuthor"
                            value={formData.bAuthor}
                            onChange={handleChange}
                            />
                         <TextField
                            helperText="Enter the Publisher"
                            id="standard-basic"
                            label="Publisher"
                            variant="standard"
                            name="bPublisher"
                            value={formData.bPublisher}
                            onChange={handleChange}
                            />
                            <TextField
                            helperText="Enter the Category"
                            id="standard-basic"
                            label="Category"
                            variant="standard"
                            name="bCategory"
                            value={formData.bCategory}
                            onChange={handleChange}
                            />
                        <TextField
                            id="standard-number"
                            label="Edition"
                            type="number"
                            variant="standard"
                            name="bEdition"
                            value={formData.bEdition}
                            onChange={handleChange}
                            slotProps={{
                                inputLabel: {
                                  shrink: true,
                                },
                              }}
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
                                name="bYear"
                                value={formData.bYear ? dayjs(formData.bYear, 'YYYY') : null} // Ensure valid date
                                onChange={(newValue) => {
                                    if (newValue) { // Check if newValue is valid
                                        setFormData((prevFormData) => ({
                                            ...prevFormData,
                                            bYear: newValue.year(), // Store the year directly as a number
                                        }));
                                    } else {
                                        setFormData((prevFormData) => ({
                                            ...prevFormData,
                                            bYear: null, // Set to null when cleared
                                        }));
                                    }
                                }}
                                />
                        </LocalizationProvider>
                    <div>
                        <TextField
                            id="standard-select-type"
                            select
                            label="Media Type"
                            helperText="Please select the media type"
                            variant="standard"
                            name="bMediaType"
                            value={formData.bMediaType}
                            onChange={handleChange}
                            >
                            {categories.map((option) => (
                                <MenuItem key={option.value} value={option.value}>
                                {option.label}
                                </MenuItem>
                            ))}
                        </TextField>
                        <TextField
                            id="standard-basic"
                            label="Number of Pages"
                            variant="standard"
                            name="bNumPages"
                            value={formData.bNumPages}
                            onChange={handleChange}
                            />
                        <TextField
                            id="standard-basic"
                            label="Number of Copies"
                            variant="standard"
                            name="bNumCopies"
                            value={formData.bNumCopies}
                            onChange={handleChange}
                        />
                        <TextField
                            id="standard-basic"
                            label="Language"
                            variant="standard"
                            name="bLang"
                            value={formData.bLang}
                            onChange={handleChange}
                        />
                    </div>
                         <TextField
                            id="outlined-multiline-static"
                            label="Summary"
                            multiline
                            rows={4}
                            name="bSummary"
                            value={formData.bSummary}
                            onChange={handleChange}
                            />
                        <TextField
                            id="outlined-multiline-static"
                            label="Notes"
                            multiline
                            rows={4}
                            name="bNotes"
                            value={formData.bNotes}
                            onChange={handleChange}
                        />
                    </div>
                </Box>
                <Stack spacing={2} direction="row" justifyContent="flex-end">
                    <Button variant="text">Clear</Button>
                    <Button variant="outlined">Cancel</Button>
                    <Button variant="contained" color="primary" onClick={handleSubmit}>Enter</Button>
                </Stack>
                {message && <div>{message}</div>} {/*'FIXME:: cant add book info'*/}
            </Box>
        </Container>
    </>
  )
}

export default BookEntry