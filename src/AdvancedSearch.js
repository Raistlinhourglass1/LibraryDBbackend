import React from 'react'
import { Breadcrumbs, Box, Button, Container, CssBaseline, Link, MenuItem, Stack, Tab, Tabs, TextField, Typography } from '@mui/material';
import { DatePicker, LocalizationProvider  } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import AdvancedSearchTabs from './AdvancedSearchTabs';
import BookSearch from './BookSearch';

function AdvancedSearch() {
  return (
    <>
    <Container>
    <Box sx={{ bgcolor: '#f2f2f2', height: '100%' }}>
    <Breadcrumbs aria-label="breadcrumb">
            <Link underline="hover" color="inherit" href="/Home">
                Home
            </Link>
            <Link
                underline="hover"
                color="inherit"
                href="/Books"
            >
                Books
            </Link>
            <Link underline="hover" color="inherit" href="/search">
                Search
            </Link>
            <Typography sx={{ color: 'text.primary' }}>Advanced Search</Typography>
        </Breadcrumbs>
        <Typography variant="h4">Advanced Search</Typography>
        <Typography variant="subtitle1">Search for books, journals, newspapers, magazines and more</Typography>

        <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            component="form"
            sx={{ '& .MuiTextField-root': { m: 1, width: '50ch' } }}
            noValidate
            autoComplete="off"
            >
                <AdvancedSearchTabs />
                
            </Box>
    </Box>
    </Container>
    </>
  )
}

export default AdvancedSearch