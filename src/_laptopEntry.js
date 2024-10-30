import React, { useState } from 'react';
import { Link } from 'react-router-dom';

import styled from 'styled-components';
import NavBar from './Navbar';


const AppContainer = styled.div`
  font-family: Arial, sans-serif;
  background-color: #f0f0f0;
  min-height: 100vh;
`;

const Header = styled.header`
  background-color: #cc0000;
  color: white;
  padding: 10px 20px;
`;

const AppTitle = styled.h1`
  margin: 0;
  font-size: 24px;
`;

const Nav = styled.nav`
  display: flex;
  gap: 20px;
  margin-top: 10px;
`;

const NavItem = styled.a`
  color: white;
  text-decoration: none;
  &:hover {
    text-decoration: underline;
  }
`;

const MainContent = styled.main`
  max-width: 800px;
  margin: 40px auto;
  padding: 20px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
`;

const FormTitle = styled.h2`
  margin-top: 0;
  color: #333;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 15px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
`;

const Label = styled.label`
  margin-bottom: 5px;
  font-weight: bold;
  color: #555;
`;

const Input = styled.input`
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 16px;
`;

const ErrorMessage = styled.span`
  color: red;
  font-size: 14px;
  margin-top: 5px;
`;

const SubmitButton = styled.button`
  background-color: #cc0000;
  color: white;
  border: none;
  padding: 10px;
  font-size: 16px;
  cursor: pointer;
  border-radius: 4px;
  &:hover {
    background-color: #990000;
  }
`;

const LaptopEntry = () => {
  const [values, setValues] = useState({
    price: '',
    model_name: '',
    serial_number: ''
  });

  const [errors, setErrors] = useState({});
  const [submitStatus, setSubmitStatus] = useState('');


  const validateForm = (formValues) => {
    let errors = {};
    if (!formValues.price.trim()) {
      errors.price = "Price is required";
    }
    if (!formValues.model_name.trim()) {
      errors.model_name = "Model name is required";
    }
    if (!formValues.serial_number.trim()) {
      errors.serial_number = "Serial number is required";
    }
    return errors;
  };

  const handleInput = (event) => {
    const { name, value } = event.target;
    setValues(prev => ({...prev, [name]: value}));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitStatus('');
    const validationErrors = validateForm(values);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length === 0) {
      try {
        setSubmitStatus('submitting');
        const response = await fetch('http://localhost:5000/_laptopEntry', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(values)
        });

        const data = await response.json();
        
        if (response.ok) {
          setSubmitStatus('success');
          alert(data.message);
          setValues({
            model_name: '',
            serial_number: '',
            price: ''
          });
        } else {
          setSubmitStatus('error');
          alert(`Failed to add laptop: ${data.message}`);
        }
      } catch (error) {
        console.error('Error:', error);
        setSubmitStatus('error');
        alert('Failed to connect to server. Please try again.');
      }
    }
  };

  return (
    <AppContainer>
    <NavBar />
  <MainContent>
    <FormTitle>Laptop Entry</FormTitle>
    <Form onSubmit={handleSubmit}>
      {['price', 'model_name', 'serial_number'].map((field) => (
        <FormGroup key={field}>
          <Label htmlFor={field}>{field.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}</Label>
          <Input
            type={field === 'price' ? 'number' : 'text'}
            placeholder={`Enter ${field.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}`}
            name={field}
            value={values[field]}
            onChange={handleInput}
          />
          {errors[field] && <ErrorMessage>{errors[field]}</ErrorMessage>}
        </FormGroup>
      ))}
      <SubmitButton type='submit'>Add Laptop</SubmitButton>
      <Link to="/_laptopSearch" style={{ textDecoration: 'none' }}>
        <SubmitButton type='button' style={{ backgroundColor: '#f0f0f0', color: '#333' }}>Search Laptop</SubmitButton>
      </Link>
    </Form>
  </MainContent>
</AppContainer>
  );
};

export default LaptopEntry;