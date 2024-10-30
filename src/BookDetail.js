import React, {useEffect, useState} from 'react'
import { Box, Button, Card, CardContent, CardMedia, Container, Link, Stack, Typography } from '@mui/material';
import Grid from '@mui/material/Grid2';
import bookCover from './external/book-cover.png';
import { useParams } from 'react-router-dom';
import { useNavigate, useLocation } from 'react-router-dom';

function BookDetail() {
  
  const { book_id } = useParams();
  const [book, setBook] = useState(null);

  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const term = queryParams.get('term'); // Extracts the search term
  console.log('Search term:', term);

  const handleBackToSearch = () => {
    console.log('Search term before navigation:', term);
    navigate(`/search?term=${encodeURIComponent(term)}`);
  };
  useEffect(() => {
    const fetchBook = async () => {
      try {
        const response = await fetch(`http://localhost:5000/books/${book_id}`); // searches specific book id
        if (!response.ok) throw new Error('Book not found');
        const data = await response.json();
        setBook(data);
      } catch (error) {
        console.error('Error fetching book:', error);
    }
    };

    fetchBook();
}, [book_id]);

if (!book) return <p>Loading...</p>;

  return (
    <>
      <Container maxWidth="lg" >

          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <CardMedia
                  component="img"
                  sx={{ width: '220px', maxHeight: '260px', objectFit: 'cover', mb: 2 }}
                  image={bookCover} // Replace with blob
                  alt={book.book_title}
              />
            </Grid>
            <Grid item xs={12} md={8}>
              <Typography variant="h2">{book.book_title}</Typography>
        
              <Typography gutterBottom sx={{ fontSize: 20 }}>
                <span style={{ color: 'primary.main' }}>ISBN:</span> 
                <span style={{ color: 'text.secondary' }}> {book.isbn}</span>
              </Typography>

              <Typography variant="subtitle1">
                <span style={{ color: 'primary.main' }}>Author:</span> {book.author}
              </Typography>

              <Typography>
                <span style={{ color: 'primary.main' }}>Publisher:</span> {book.publisher}
              </Typography>

              <Typography sx={{ wordWrap: 'break-word' }}>
                <span style={{ color: 'primary.main' }}>Summary:</span> {book.book_summary}
              </Typography>

              <Typography>
                <span style={{ color: 'primary.main' }}>Category:</span> {book.book_category}
              </Typography>

              <Typography>
                <span style={{ color: 'primary.main' }}>Copyright Year:</span> {book.year_copyright}
              </Typography>

              <Typography>
                <span style={{ color: 'primary.main' }}>Edition:</span> {book.edition}
              </Typography>

              <Typography>
                <span style={{ color: 'primary.main' }}>Number of Pages:</span> {book.num_pages}
              </Typography>

              <Typography>
                <span style={{ color: 'primary.main' }}>Media Type:</span> {book.media_type}
              </Typography>

              <Typography>
                <span style={{ color: 'primary.main' }}>Language:</span> {book.language}
              </Typography>

              <Typography>
                <span style={{ color: 'primary.main' }}>Available:</span> {book.availability ? "Yes" : "No"/*FIXME:: THIS IS A BOOL */}
              </Typography>

              <Typography>
                <span style={{ color: 'primary.main' }}>Holds:</span> 0 {/*FIXME:: ADD HOLD NUMBER HERE*/}
              </Typography>
                {/* Add more book details as needed */} 
              </Grid> 
                <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-end', gap: 2,}}>
                  <Button variant="contained">Reserve</Button>
                  <Button>
                      Add to List
                  </Button>
                </Box>
          </Grid>

          <Grid container spacing={2}>
          <Button onClick={handleBackToSearch}>
                      Back to Search
                  </Button>
            <Typography>Reviews Go Here ^^</Typography>
          </Grid>
      </Container>
    </>
  );
}

export default BookDetail