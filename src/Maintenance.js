import React from 'react'
import { Button, Link } from '@mui/material';

function Maintenance() {
  return (
    <div>Sorry! This page is under maintenance
      <p></p>
        <Button component={Link} href="/" variant="text">Back to Home</Button>
    </div>

  )
}

export default Maintenance