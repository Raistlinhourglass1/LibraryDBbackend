import React from 'react'
import { Accordion, AccordionDetails , AccordionSummary } from '@mui/material';
import {  Box, Button, Checkbox, MenuItem, Link, Stack, TextField, Typography } from '@mui/material';
import  { FormLabel, FormControl, FormControlLabel, FormGroup} from '@mui/material';
import Grid from '@mui/material/Grid2';
import { DatePicker, LocalizationProvider  } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import dayjs from 'dayjs';

import AdvancedExclude from './AdvancedExclude';

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

const searchby = [
  {
    value: 'any',
    label: 'Any',
  },
  {
      value: 'title',
      label: 'Title',
  },
  {
      value: 'author',
      label: 'Author',
  },
  {
    value: 'isbn',
    label: 'ISBN',
  },
  {
    value: 'author',
    label: 'Author',
  },
  {
    value: 'publisher',
    label: 'Publisher',
  },
  {
    value: 'category',
    label: 'Category',
  }
];

const contains = [
  {
    value: 'starts',
    label: 'starts with',
  },
  {
      value: 'contains',
      label: 'contains',
  },
  {
      value: 'contains_exact_phrase',
      label: 'contains exact phrase',
  }
];

const languages = [
  {
    value: 'any',
    label: 'Any',
  },
  {
    value: 'chinese',
    label: 'Chinese',
  },
  {
    value: 'english',
    label: 'English',
  },
  {
    value: 'french',
    label: 'French',
  },
  {
    value: 'german',
    label: 'German',
  },
  {
    value: 'korean',
    label: 'Korean',
  },
  {
    value: 'japanese',
    label: 'Japanese',
  },
  {
    value: 'spanish',
    label: 'Spanish',
  },
  {
    value: 'swedish',
    label: 'Swedish',
  },
  {
    value: 'vietnamese',
    label: 'Vietnamese',
  },
];
//how to add new language??

const formattype = [
  {
    value: 'any',
    label: 'Any',
  },
  {
    value: 'printbooks',
    label: 'Print Books',
  },
  {
      value: 'ebooks',
      label: 'eBooks',
  },
  {
    value: 'audiobooks',
    label: 'Audiobooks',
  },
  {
    value: 'dvds',
    label: 'DVDs',
  },
  {
    value: 'cds',
    label: 'CDs',
  },
  {
    value: 'electronic',
    label: 'Electronic Resources',
  },
  {
    value: 'online',
    label: 'Online',
  }
];

const currentDate = dayjs();

function AdvancedAllTab() {
  const [cleared, setCleared] = React.useState(false);
    
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
    <Grid container direction="row" style={{ marginTop: "10px "}}>
        <Box
          component="form"
          sx={{ '& .MuiTextField-root': { m: 1, width: '20ch' } }}
          noValidate
          autoComplete="off"
          >
          <div>
            <Typography variant="subtitle1" sx={{ color: 'text.primary' }}>Search by:</Typography>
            <TextField
                  id="standard-select-type"
                  select
                  label=""
                  defaultValue="any"
                  variant="standard"
                  >
                  {searchby.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                      {option.label}
                      </MenuItem>
                  ))}
              </TextField>
              <TextField
                  id="standard-select-type"
                  select
                  label=""
                  defaultValue="starts"
                  variant="standard"
                  >
                  {contains.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                      {option.label}
                      </MenuItem>
                  ))}
              </TextField>
              <TextField
                  required
                  helperText="Enter a search term"
                  id="standard-search"
                  label=""
                  type="search"
                  defaultValue=""
                  variant="standard"
                  />
          </div>

          <Button color="secondary">+ Add A New Search Term</Button>
          <p></p>
          <div>
            <Typography>Date Range</Typography>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <DatePicker 
                      label={'Start Date'} 
                      views={['year', 'month', 'day']} 
                      />
                  <DatePicker 
                      label={'End Date'} 
                      views={['day','month', 'year']} 
                      maxDate={currentDate}
                      defaultValue={currentDate}
                      slotProps={{
                          textField: {
                            helperText: '',
                          }, field: { 
                              clearable: true, 
                              onClear: () => setCleared(true) 
                          }
                        }}
                      
                      />
              </LocalizationProvider>
          </div>
          <div>
              <TextField
                  id="standard-select-type"
                  select
                  label="Media Type"
                  defaultValue="physical"
                  helperText=""
                  variant="standard"
                  >
                  {categories.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                      {option.label}
                      </MenuItem>
                  ))}
              </TextField>
              <TextField
                  id="standard-select-type"
                  select
                  label="Language"
                  defaultValue="english"
                  helperText=""
                  variant="standard"
                  >
                  {languages.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                      {option.label}
                      </MenuItem>
                  ))}
              </TextField>
              <TextField
                  id="standard-select-type"
                  select
                  label="Format type"
                  defaultValue="any"
                  helperText=""
                  variant="standard"
                  >
                  {formattype.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                      {option.label}
                      </MenuItem>
                  ))}
              </TextField>
          </div>
      </Box>
        <AdvancedExclude />
      <Box>
      <FormControlLabel control={<Checkbox />} label="Show Available Books Only" />
      </Box>
    </Grid>
    <Stack spacing={2} direction="row" justifyContent="flex-end">
        <Button variant="text">Clear</Button>
        <Button component={Link} href="/search" variant="outlined">Cancel</Button>
        <Button variant="contained">Search</Button>
    </Stack>
   
    </>
  )
}

export default AdvancedAllTab