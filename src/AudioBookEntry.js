import React, { useState } from 'react';
import { Breadcrumbs, Box, Button, Container, Link, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { DatePicker, LocalizationProvider  } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import dayjs from 'dayjs';

const format = [
    {
        value: 'mp3',
        label: 'MP3',
    },
    {
        value: 'cd',
        label: 'CD',
    },
    {
        value: 'digitaldownload',
        label: 'Digital Download',
    }
];

function AudioBookEntry() {
    const [cleared, setCleared] = React.useState(false);
    
    const [formData, setFormData] = useState({
        abIsbn: '',
        abTitle: '',
        abAuthor: '',
        abNarrator: '',
        abPublisher: '',
        abCategory: '',
        abEdition: '',
        abLanguage: '',
        abDate: '',
        abDuration: '',
        abFormat: '',
        abNumCopies: '',
        abSummary: '',
        abNotes: '',
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
            const response = await fetch('http://localhost:5000/catalog-entry/audiobook', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });
            console.log('Response:', response);

            if (response.ok) {
                setMessage('Audiobook added successfully');
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
                    <Typography sx={{ color: 'text.primary' }}>Add New Audiobook</Typography>
                </Breadcrumbs>

                <Typography variant="h4">Add New Audiobook</Typography>

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
                            type="number"
                            variant="standard"
                            name="abIsbn"
                            value={formData.abIsbn}
                            onChange={handleChange}
                            />
                         <TextField
                            required
                            helperText="Enter the Title"
                            id="standard-required"
                            label="Title"
                            variant="standard"
                            name="abTitle"
                            value={formData.abTitle}
                            onChange={handleChange}
                            />
                        <TextField
                            required
                            helperText="Enter the Author"
                            id="standard-required"
                            label="Author"
                            variant="standard"
                            name="abAuthor"
                            value={formData.abAuthor}
                            onChange={handleChange}
                            />
                        <TextField
                            required
                            helperText="Enter the Narrator"
                            id="standard-basic"
                            label="Narrator"
                            variant="standard"
                            name="abNarrator"
                            value={formData.abNarrator}
                            onChange={handleChange}
                            />
                         <TextField
                            required
                            helperText="Enter the Publisher"
                            id="standard-basic"
                            label="Publisher"
                            variant="standard"
                            name="abPublisher"
                            value={formData.abPublisher}
                            onChange={handleChange}
                            />
                            <TextField
                            required
                            helperText="Enter the Category"
                            id="standard-basic"
                            label="Category"
                            variant="standard"
                            name="abCategory"
                            value={formData.abCategory}
                            onChange={handleChange}
                            />
                    </div>
                    <div>
                        <TextField
                            required
                            id="standard-basic"
                            label="Edition"
                            variant="standard"
                            name="abEdition"
                            value={formData.abEdition}
                            onChange={handleChange}
                            />
                        <TextField
                            required
                            id="standard-basic"
                            label="Language"
                            variant="standard"
                            name="abLanguage"
                            value={formData.abLanguage}
                            onChange={handleChange}
                        />
                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                            <DatePicker 
                                variant='standard'
                                slotProps={{
                                    textField: {
                                      helperText: 'Year, Month and Day',
                                    }, field: { 
                                        clearable: true, 
                                        onClear: () => setCleared(true) 
                                    }
                                  }}
                                label={'Date Published'} 
                                views={['year','month','day']} 
                                name="abDate"
                                value={formData.abDate ? dayjs(formData.abDate, 'YYYY-MM-DD') : null} // Ensure valid date
                                onChange={(newValue) => {
                                    if (newValue && newValue.isValid()) { // Check if newValue is valid
                                        setFormData((prevFormData) => ({
                                            ...prevFormData,
                                            abDate: newValue.format('YYYY-MM-DD'), // Format as 'YYYY-MM-DD'
                                        }));
                                    } else {
                                        setFormData((prevFormData) => ({
                                            ...prevFormData,
                                            abDate: null, // Set to null when cleared
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
                            name="abFormat"
                            value={formData.abFormat}
                            onChange={handleChange}
                            >
                            {format.map((option) => (
                                <MenuItem key={option.value} value={option.value}>
                                {option.label}
                                </MenuItem>
                            ))}
                        </TextField>
                        <TextField
                            required
                            id="standard-basic"
                            label="Duration"
                            variant="standard"
                            name="abDuration"
                            value={formData.abDuration}
                            onChange={handleChange}
                            />
                        <TextField
                            required
                            id="standard-basic"
                            label="Number of Copies"
                            variant="standard"
                            name="abNumCopies"
                            value={formData.abNumCopies}
                            onChange={handleChange}
                        />
                        
                    </div>
                         <TextField
                            id="outlined-multiline-static"
                            label="Summary"
                            multiline
                            rows={4}
                            name="abSummary"
                            value={formData.abSummary}
                            onChange={handleChange}
                            />
                        <TextField
                            id="outlined-multiline-static"
                            label="Notes"
                            multiline
                            rows={4}
                            name="abNotes"
                            value={formData.abNotes}
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

export default AudioBookEntry