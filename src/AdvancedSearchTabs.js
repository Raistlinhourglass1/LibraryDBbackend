import React from 'react'
import { Breadcrumbs, Box, Button, Container, CssBaseline, Link, MenuItem, Stack, 
    Tab, Tabs, TextField, Typography } from '@mui/material';
import { DatePicker, LocalizationProvider  } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import AdvancedAllTab from './AdvancedAllTab';

function CustomTabPanel(int) {
    const { children, value, index, ...other } = int;
  
    return (
      <div
        role="tabpanel"
        hidden={value !== index}
        id={`simple-tabpanel-${index}`}
        aria-labelledby={`simple-tab-${index}`}
        {...other}
      >
        {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
      </div>
    );
  }
  
function AdvancedSearchTabs() {
    const [value, setValue] = React.useState(0);

    const handleChange = (event, newValue) => {
      setValue(newValue);
    };
  
  return (
    <>
    <Box sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={value} onChange={handleChange} aria-label="basic tabs example">
                <Tab label="All" />
                <Tab label="Books"/>
                <Tab label="Journals"/>
                <Tab label="Newspapers"/>
                <Tab label="Magazines"/>
                <Tab label="Digital"/>
                <Tab label="DVD"/>
            </Tabs>
        </Box>
        <CustomTabPanel value={value} index={0}>
          <AdvancedAllTab />
        </CustomTabPanel>
        <CustomTabPanel value={value} index={1}>
        Item Two
        </CustomTabPanel>
        <CustomTabPanel value={value} index={2}>
        Item Three
        </CustomTabPanel>
        <CustomTabPanel value={value} index={3}>
        Item Four
        </CustomTabPanel>
        <CustomTabPanel value={value} index={4}>
        Item Five
        </CustomTabPanel>
        <CustomTabPanel value={value} index={5}>
        Item Six
        </CustomTabPanel>
        <CustomTabPanel value={value} index={6}>
        Item Seven
        </CustomTabPanel>
    </Box>
    </>
  )
}

export default AdvancedSearchTabs