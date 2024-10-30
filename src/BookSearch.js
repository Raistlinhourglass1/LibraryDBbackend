import React, { useEffect, useState } from 'react'
import { Breadcrumbs, Box, Button, Card, CardMedia, CardContent, Container, Grid2, Link, TextField, Typography } from '@mui/material';
import BookSearchResults from './BookSearchResults';
import { useNavigate } from 'react-router-dom';

function BookSearch() {
    const [term, setTerm] = useState('');
    const [books, setBooks] = useState([]);

    const navigate = useNavigate();
    
    const handleSearch = async () => {
        //e.preventDefault();
        navigate(`/search?term=${encodeURIComponent(term)}`, { replace: true });
        console.log('Search initiated with term:', term);
        setBooks([]); 
        try {
            const response = await fetch(`http://localhost:5000/search?term=${encodeURIComponent(term)}`);
            console.log('Response received:', response);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const data = await response.json();
            console.log('Data fetched:', data);
            setBooks(Array.isArray(data) ? data : []); //check that its an array
        } catch (error) {
            console.error('Error fetching books:', error);
        }
    }
    
    useEffect(() => {
      if (term) {
         handleSearch();
        }
      }, [term]);
      
  return (
    <>
    <Container maxWidth="xl">
    <Box sx={{ bgcolor: '#f2f2f2', height: '100%' }}>
        <Breadcrumbs aria-label="breadcrumb">
            <Link underline="hover" color="inherit" href="/">
                Home
            </Link>
            <Link
                underline="hover"
                color="inherit"
                href="./BookEntry"
            >
                Books
            </Link>
            <Typography sx={{ color: 'text.primary' }}>Search</Typography>
        </Breadcrumbs>

        <Typography variant="h4">Search</Typography>
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
            <TextField
                id="standard-basic"
                label="Title, Author, ISBN, etc..."
                variant="standard"
                value={term}
                onChange={(e) => setTerm(e.target.value)}
            />
            <Button type="submit" variant="contained" onClick={(e) => { e.preventDefault(); handleSearch();}}>Enter</Button>
            <Button component={Link} href="/advanced-search" variant="text">Advanced Search</Button>
        </Box>
        {books.length > 0 && <BookSearchResults books={books} term={term} />}
    </Box>

    </Container>
    </>
  )
}

export default BookSearch