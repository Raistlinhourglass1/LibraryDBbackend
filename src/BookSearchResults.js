import React, { useState } from 'react'
import { Box, Button, Card, CardContent, CardActions, CardMedia, Container, Divider, Link, MenuItem, Paper, Stack, TextField, Typography } from '@mui/material';
import Grid from '@mui/material/Grid2';
import bookCover from './external/book-cover.png';
import { useNavigate, useLocation } from 'react-router-dom';
import queryString from 'query-string';
import BookSearchFilter from './BookSearchFilter';
import BookDetail from './BookDetail';
import _bookReservation from './_bookReservation';

function BookSearchResults({books = [], term}) {
    console.log('Data fetched:', books);
    console.log('Search term:', term);
    const location = useLocation(); //pull from navigate in BookSearch
    //const { term } = queryString.parse(location.search);
    
    const navigate = useNavigate();
    const [showDetails, setShowDetails] = useState(false); //pulls details page
    const [book, setBook] = useState([]);

    const handleShowDetails = () => {
        setShowDetails(true);
    };

    const handleReserve = (book) => {
        navigate('/_bookReservation', { state: { book } });
    };

    return (
    <>
    {books.length === 0 ? (
                <Typography variant="h6" color="text.secondary">
                    No books found matching your search criteria.
                </Typography>
            ) : (
    <Grid sx={{ display: 'grid', 
        gap: 10, 
        gridTemplateRows: 'auto',
        justifyContent: 'center'
        }} 
        container direction="row" 
        style={{marginTop: "10px"}}>

        <Container maxWidth="xl">
            <Box sx={{ bgcolor: '#f2f2f2', height: '100%' }}>
                <Grid container spacing={3}>
                    {books.map((book) => (
                        <Paper square elevation={3} item xs={12} key={book.isbn}>
                            <Card style={{ width: '100%', display: 'flex' }}>
                                <CardMedia
                                    component="img"
                                    sx={{ width: 151 }}
                                    image={bookCover} // Replace with blob
                                    alt={book.title}
                                />
                                <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                                
                                <CardContent  sx={{ flex: '1 0 auto' }}>
                                    <Typography gutterBottom sx={{ color: 'text.secondary', fontSize: 14 }}>
                                        {book.media_type}
                                    </Typography>

                                    <Link href={`/books/${book.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                                            {book.title}
                                    </Link>

                                    
                                    {book.author && (<Typography variant="body2" color="text.secondary">
                                        by {book.author}
                                    </Typography>)}
                                </CardContent>
                                
                                </Box>
                                <Stack direction="column"
                                    spacing={1}
                                    sx={{
                                    justifyContent: "flex-start",
                                    alignItems: "flex-end",}}>
                                    <button onClick={() => handleReserve(book)}
                                        className="bg-blue-500 hover:bg-blue-600 text-blue font-medium py-2 px-4 rounded transition-colors">
                                        Reserve                               
                                        </button>
                                    
                                    <Link href={`/books/${book.id}?term=${encodeURIComponent(term)}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                                        <Button size="small" onClick={handleShowDetails} >View Summary</Button>
                                    </Link>
                                </Stack>
                            </Card>
                            
                        </Paper>
                    ))}
                    </Grid>
            </Box>
        </Container>
    </Grid>)}

    </>
  )
}

export default BookSearchResults