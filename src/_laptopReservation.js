import React, { useState, useEffect } from 'react';
import NavBar from './Navbar';


const LaptopReservationForm = () => {
  const [formData, setFormData] = useState({
    userId: '',
    model_name: '',
    reservation_date_time: ''
  });

  useEffect(() => {
    const userId = localStorage.getItem('userId');
    if (userId) {
      setFormData((prevData) => ({ ...prevData, userId }));
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };



  const handleSubmit = async (e) => {
    e.preventDefault();

    const token = localStorage.getItem('token'); // fetch the token

    try{
      const response = await fetch('http://localhost:5000/_laptopReservation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData)
      });
  
      const data = await response.json();
      
      if (response.ok) {
        alert('Reservation created successfully!');
        // Reset form
        setFormData({
          userId: formData.userId, 
          reservation_date_time: ''
        });
      } else {
        alert(`Error: ${data.message}`);
      }
    } catch(error){
      console.error('Error submitting reservation:', error);
    alert('Error submitting reservation. Please try again.');
    }    
  };

  return (
    <div>
    <NavBar />

  <div style={{ padding: '20px', maxWidth: '500px', margin: '0 auto', background: '#fff', borderRadius: '8px', boxShadow: '0 0 10px rgba(0,0,0,0.1)' }}>
    <h2 style={{ textAlign: 'center', color: '#333' }}>Laptop Reservation</h2>
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
      {/*
      <div>
        <label htmlFor="model_name">Model Name:</label>
        <input
          type="text"
          id="model_name"
          name="model_name"
          value={formData.model_name}
          onChange={handleChange}
          required
          style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
        />
      </div>
      */}

      <div>
        <label htmlFor="reservation_date_time">Reservation Date & Time:</label>
        <input
          type="date"
          id="reservation_date_time"
          name="reservation_date_time"
          value={formData.reservation_date_time}
          onChange={handleChange}
          required
          style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
        />
      </div>

      
{/*
      <div>
        <label htmlFor="reservation_type">Reservation Type:</label>
        <select
          id="reservation_type"
          name="reservation_type"
          value={formData.reservation_type}
          onChange={handleChange}
          style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
        >
          <option value="">Select type</option>
          <option value="book">Book</option>
          <option value="periodical">Periodical</option>
        </select>
      </div>
*/}
      <button
        type="submit"
        style={{
          width: '100%',
          padding: '10px',
          backgroundColor: '#d9534f',
          color: '#fff',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        Submit Reservation
      </button>
    </form>
    </div>
  </div>
  );
};

export default LaptopReservationForm;