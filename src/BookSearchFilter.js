import React from 'react'
import { Accordion, AccordionDetails , AccordionSummary } from '@mui/material';
import {  Box, Button, Checkbox, MenuItem, Stack, TextField, Typography } from '@mui/material';
import  { FormLabel, FormControl, FormControlLabel, FormGroup, FormHelperText } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import IndeterminateCheckBoxIcon from '@mui/icons-material/IndeterminateCheckBox';


function BookSearchFilter() {
    const [state, setState] = React.useState({
        book: false,
        journal: false,
        magazine: false,
        newspaper: false,
        digital: false,
        dvd: false
      });

      const handleChange = (event) => {
        setState({
          ...state,
          [event.target.name]: event.target.checked,
        });
      };
    
      const { book, journal, magazine, newspaper, digital, dvd } = state;
      const error = [book, journal, magazine, newspaper, digital, dvd].filter((v) => v).length !== 2;
  return (
    <>
    <Stack
          direction="column"
          sx={{
            p: 2,
            gap: 1,
            justifyContent: "flex-start",
            alignItems: 'stretch',
            maxWidth: '100%',
            minWidth: '100%'
          }}
        >
          <Typography>Exclude</Typography>
          <Accordion>
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              aria-controls="panel1-content"
              id="panel1-header"
            >
              <Typography>Material Type</Typography>
            </AccordionSummary>
            <AccordionDetails>
              
            <FormControl sx={{ pt: 0, ml: 2 }} component="fieldset" variant="standard">
                <FormGroup>
                    <FormControlLabel
                        control={
                        <Checkbox checked={book} onChange={handleChange} name="book" />
                        }
                        label="Books"
                    />
                    <FormControlLabel
                        control={
                        <Checkbox checked={journal} onChange={handleChange} name="journal" />
                        }
                        label="Journals"
                    />
                    <FormControlLabel
                        control={
                        <Checkbox checked={magazine} onChange={handleChange} name="magazine" />
                        }
                        label="Magazines"
                    />
                    <FormControlLabel
                        control={
                        <Checkbox checked={newspaper} onChange={handleChange} name="newspaper" />
                        }
                        label="Newspapers"
                    />
                    <FormControlLabel
                        control={
                        <Checkbox checked={digital} onChange={handleChange} name="digital" />
                        }
                        label="Digital"
                    />
                    <FormControlLabel
                        control={
                        <Checkbox checked={dvd} onChange={handleChange} name="dvd" />
                        }
                        label="CD/DVD"
                    />
                </FormGroup>
                <FormHelperText></FormHelperText>
            </FormControl>

            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              aria-controls="panel2-content"
              id="panel2-header"
            >
              <Typography>Format Type</Typography>
            </AccordionSummary>
          <AccordionDetails>
            <Typography>
              Add the checkboxes here
            </Typography>
          </AccordionDetails>
        </Accordion>
        </Stack>
      </>
  )
}

export default BookSearchFilter