import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import NavBar from './Navbar';

const MainContent = styled.div`
  max-width-xl p-6 mx-auto bg-white rounded-lg shadow-md
`;

const SearchForm = styled.form`
  space-y-4
`;

const FormGroup = styled.div`
  flex flex-col space-y-2
`;

const Label = styled.label`
  text-sm font-medium text-gray-700
`;

const Input = styled.input`
  w-full p-2 border rounded-md
`;

const Button = styled.button`
  w-full bg-red-600 text-white p-2 rounded-md hover:bg-red-700 disabled:bg-red-300
`;

const ResultItem = styled.div`
  p-4 border rounded-md bg-gray-50 mb-4
`;

const ErrorText = styled.span`
  text-sm text-red-600
`;

const LaptopSearch = () => {
  const [searchParams, setSearchParams] = useState({
    price: '',
    model_name: '',
    serial_number: ''
  });
  
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSearchParams(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateSearchParams = () => {
    const errors = {};
    
    if (searchParams.price && isNaN(parseFloat(searchParams.price))) {
      errors.price = "Please enter a valid price";
    }
    
    if (searchParams.serial_number && !/^[A-Za-z0-9]*$/.test(searchParams.serial_number)) {
      errors.serial_number = "Serial number must be alphanumeric";
    }

    return errors;
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    setError('');
    
    const validationErrors = validateSearchParams();
    if (Object.keys(validationErrors).length > 0) {
      setError('Please correct the form errors');
      return;
    }

    setIsLoading(true);

    try {
      // Build query string only from non-empty parameters
      const queryParams = new URLSearchParams();
      Object.entries(searchParams).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });

      const response = await fetch(`http://localhost:5000/_laptopSearch?${queryParams.toString()}`);
      
      if (!response.ok) {
        throw new Error('Search failed');
      }

      const data = await response.json();
      setSearchResults(data.results || []);
    } catch (err) {
      setError('Failed to search laptops. Please try again.');
      console.error('Search error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const clearSearch = () => {
    setSearchParams({
      price: '',
      model_name: '',
      serial_number: ''
    });
    setSearchResults([]);
    setError('');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <NavBar />
      <MainContent>
        <h2 className="text-2xl font-bold mb-6">Laptop Search</h2>
        <p className="mb-4 text-gray-600">Search by any combination of criteria below:</p>
        
        <SearchForm onSubmit={handleSearch}>
          <FormGroup>
            <Label>Price</Label>
            <Input
              type="number"
              name="price"
              value={searchParams.price}
              onChange={handleInputChange}
              placeholder="Enter maximum price"
              step="0.01"
            />
          </FormGroup>

          <FormGroup>
            <Label>Model Name</Label>
            <Input
              type="text"
              name="model_name"
              value={searchParams.model_name}
              onChange={handleInputChange}
              placeholder="Enter model name"
            />
          </FormGroup>

          <FormGroup>
            <Label>Serial Number</Label>
            <Input
              type="text"
              name="serial_number"
              value={searchParams.serial_number}
              onChange={handleInputChange}
              placeholder="Enter serial number"
            />
          </FormGroup>

          {error && <ErrorText>{error}</ErrorText>}

          <div className="flex gap-4 mt-6">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Searching...' : 'Search'}
            </Button>
            <Button
              type="button"
              onClick={clearSearch}
              className="bg-gray-500 hover:bg-gray-600"
            >
              Clear
            </Button>
          </div>
        </SearchForm>

        <div className="mt-8">
          {searchResults.length > 0 ? (
            <div>
              <h3 className="text-xl font-semibold mb-4">Search Results ({searchResults.length})</h3>
              {searchResults.map((laptop, index) => (
                <ResultItem key={index}>
                  <p><strong>Model:</strong> {laptop.model_name}</p>
                  <p><strong>Serial Number:</strong> {laptop.serial_number}</p>
                  <p><strong>Price:</strong> ${laptop.price}</p>
                </ResultItem>
              ))}
            </div>
          ) : !isLoading && (
            <p className="text-gray-600">No laptops found matching your criteria.</p>
          )}
        </div>
      </MainContent>
    </div>
  );
};

export default LaptopSearch;