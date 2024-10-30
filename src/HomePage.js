import React from 'react'
import NavBar from './Navbar'
import Header from './Header'
import { Container, Typography } from '@mui/material'
import Grid2 from '@mui/material'

function Home() {
  return (
    <>
    <Container>
      <NavBar />
    </Container>
      <Typography> This is the home page </Typography>
    </>
  )
}

export default Home