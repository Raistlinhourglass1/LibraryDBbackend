import React, { useState } from 'react';
import { Breadcrumbs, Box, Button, Container, Link, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { DatePicker, LocalizationProvider  } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import dayjs from 'dayjs';

const type = [
    {
        value: 'newspaper',
        label: 'Newspaper',
    },
    {
        value: 'magazine',
        label: 'Magazine',
    },
    {
        value: 'journal',
        label: 'Journal',
    }
];

const format = [
    {
        value: 'print',
        label: 'Print',
    },
    {
        value: 'digital',
        label: 'Digital',
    },

];

const frequency = [
    {
        value: 'daily',
        label: 'Daily',
    },
    {
        value: 'weekly',
        label: 'Weekly',
    },
    {
        value: 'monthly',
        label: 'Monthly',
    },
    {
        value: 'quarterly',
        label: 'Quarterly',
    }
];

function PeriodicalEntry() {
    const [cleared, setCleared] = React.useState(false);
    
    const [formData, setFormData] = useState({
        pIssn: '',
        pTitle: '',
        pAuthor: '',
        pType: '',
        pPublisher: '',
        pCategory: '',
        pFormat: '',
        pUrl: '',
        pFrequency: '',
        pIssueDate: '',        
        pIssueVolume: '',
        pIssueNumber: '',
        pLanguage: '',
        pNumCopies: '',
        pDescription: '',
        pNotes: '',
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
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log('Original formData:', formData);

        try {
            const response = await fetch('http://localhost:5000/catalog-entry/periodical', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });
            console.log('Response:', response);

            if (response.ok) {
                setMessage('Periodical added successfully');
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
                    <Typography sx={{ color: 'text.primary' }}>Add New Periodical</Typography>
                </Breadcrumbs>

                <Typography variant="h4">Add New Periodical</Typography>

                <Box
                    component="form"
                    sx={{ '& .MuiTextField-root': { m: 1, width: '25ch' } }}
                    noValidate
                    autoComplete="off"
                    onSubmit={handleSubmit}
                    >
                    <div>
                        <TextField                           
                            helperText="Enter the ISSN if applicable"
                            id="standard-basic"
                            label="ISSN"                     
                            variant="standard"
                            name="pIssn"
                            value={formData.pIssn}
                            onChange={handleChange}
                            /*error={!/^\d{8}$/.test(formData.pIssn) && formData.pIssn !== ""}
                            helperText={(!/^\d{8}$/.test(formData.pIssn) && formData.pIssn !== "") ? "Invalid ISSN format (8-digit number)" : "Enter the ISSN"}*/
                            />
                         <TextField
                            required
                            helperText="Enter the Title"
                            id="standard-required"
                            label="Title"
                            variant="standard"
                            name="pTitle"
                            value={formData.pTitle}
                            onChange={handleChange}
                            />
                        <TextField
                            helperText="Enter the Author if applicable"
                            id="standard-basic"
                            label="Author"
                            variant="standard"
                            name="pAuthor"
                            value={formData.pAuthor}
                            onChange={handleChange}
                            />
                            <TextField
                            id="standard-select-type"
                            select
                            label="Type"
                            helperText="Please select the type of periodical"
                            variant="standard"
                            name="pType"
                            value={formData.pType}
                            onChange={handleChange}
                            >
                            {type.map((option) => (
                                <MenuItem key={option.value} value={option.value}>
                                {option.label}
                                </MenuItem>
                            ))}
                        </TextField>
                         <TextField
                            helperText="Enter the Publisher"
                            id="standard-basic"
                            label="Publisher"
                            variant="standard"
                            name="pPublisher"
                            value={formData.pPublisher}
                            onChange={handleChange}
                            />
                            <TextField
                            helperText="Enter the Category"
                            id="standard-basic"
                            label="Category"
                            variant="standard"
                            name="pCategory"
                            value={formData.pCategory}
                            onChange={handleChange}
                            />
                            <TextField
                            id="standard-select-type"
                            select
                            label="Format"
                            helperText="Please select the format"
                            variant="standard"
                            name="pFormat"
                            value={formData.pFormat}
                            onChange={handleChange}
                            >
                            {format.map((option) => (
                                <MenuItem key={option.value} value={option.value}>
                                {option.label}
                                </MenuItem>
                            ))}
                            </TextField>
                            <TextField
                            helperText="Enter the URL if applicable"
                            id="standard-basic"
                            label="URL"
                            variant="standard"
                            name="pUrl"
                            value={formData.pUrl}
                            onChange={handleChange}
                            />
                            <TextField
                            id="standard-select-type"
                            select
                            label="Frequency"
                            helperText="Please select the frequency of the issues"
                            variant="standard"
                            name="pFrequency"
                            value={formData.pFrequency}
                            onChange={handleChange}
                            >
                            {frequency.map((option) => (
                                <MenuItem key={option.value} value={option.value}>
                                {option.label}
                                </MenuItem>
                            ))}
                        </TextField>
                    </div>
                    <div>
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
                                label={'Date of Publication'} 
                                views={['year','month','day']} 
                                name="pIssueDate"
                                value={formData.pIssueDate ? dayjs(formData.pIssueDate, 'YYYY-MM-DD') : null} // Ensure valid date
                                onChange={(newValue) => {
                                    if (newValue && newValue.isValid()) { // Check if newValue is valid
                                        setFormData((prevFormData) => ({
                                            ...prevFormData,
                                            pIssueDate: newValue.format('YYYY-MM-DD'), // Format as 'YYYY-MM-DD'
                                        }));
                                    } else {
                                        setFormData((prevFormData) => ({
                                            ...prevFormData,
                                            pIssueDate: null, // Set to null when cleared
                                        }));
                                    }
                                }}
                                />
                        </LocalizationProvider>
                        <TextField
                            id="standard-basic"
                            label="Issue Volume"
                            variant="standard"
                            name="pIssueVolume"
                            value={formData.pIssueVolume}
                            onChange={handleChange}
                            />
                        <TextField
                            id="standard-basic"
                            label="Issue Number"
                            variant="standard"
                            name="pIssueNumber"
                            value={formData.pIssueNumber}
                            onChange={handleChange}
                            />
                        <TextField
                            id="standard-basic"
                            label="Language"
                            variant="standard"
                            name="pLanguage"
                            value={formData.pLanguage}
                            onChange={handleChange}
                        />                                                                
                        <TextField
                            id="standard-basic"
                            label="Number of Copies"
                            variant="standard"
                            name="pNumCopies"
                            value={formData.pNumCopies}
                            onChange={handleChange}
                        />
                        <div>                   
                         <TextField
                            id="outlined-multiline-static"
                            label="Description"
                            multiline
                            rows={4}
                            name="pDescription"
                            value={formData.pDescription}
                            onChange={handleChange}
                            />
                        <TextField
                            id="outlined-multiline-static"
                            label="Notes"
                            multiline
                            rows={4}
                            name="pNotes"
                            value={formData.pNotes}
                            onChange={handleChange}
                        />
                        </div> 
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

export default PeriodicalEntry