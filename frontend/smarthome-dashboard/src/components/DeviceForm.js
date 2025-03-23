import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

const DeviceForm = ({ refreshDevices }) => {
  const [formData, setFormData] = useState({
    name: '',
    type: 'Light', // Default type
    location: '',
    ipAddress: '',
    apiKey: '',
    isOnline: true
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const deviceTypes = ['Light', 'Thermostat', 'Door', 'Camera', 'Sensor'];
  const locationSuggestions = ['Living Room', 'Kitchen', 'Bedroom', 'Bathroom', 'Office', 'Garage', 'Outdoor'];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Log the data being sent to help debug
    console.log("Submitting device data:", formData);

    try {
      // Convert property names to match backend model (camelCase to PascalCase)
      const requestData = {
        Name: formData.name,
        Type: formData.type,
        Location: formData.location,
        IpAddress: formData.ipAddress,
        ApiKey: formData.apiKey,
        IsOnline: formData.isOnline
      };

      console.log("Formatted request data:", requestData);
      
      await api.post('/api/Devices', requestData);
      alert('Device added successfully!');
      refreshDevices();
      navigate('/devices');
    } catch (err) {
      console.error('Add device error:', err);
      let errorMsg = 'Failed to add device';
      
      // Check for validation errors in the response
      if (err.response?.data) {
        console.log("Error details:", err.response.data);
        if (typeof err.response.data === 'string') {
          errorMsg += ': ' + err.response.data;
        } else if (err.response.data.errors) {
          // Handle validation error object
          errorMsg += ': ' + Object.values(err.response.data.errors)
            .flat()
            .join(', ');
        } else if (err.response.data.title) {
          // Handle problem details
          errorMsg += ': ' + err.response.data.title;
          if (err.response.data.detail) {
            errorMsg += ' - ' + err.response.data.detail;
          }
        }
      } else if (err.message) {
        errorMsg += ': ' + err.message;
      }
      
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <h5 className="mb-0">Add New Device</h5>
      </div>
      <div className="card-body">
        {error && <div className="alert alert-danger">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="name" className="form-label">Device Name</label>
            <input
              type="text"
              className="form-control"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="mb-3">
            <label htmlFor="type" className="form-label">Device Type</label>
            <select
              className="form-select"
              id="type"
              name="type"
              value={formData.type}
              onChange={handleChange}
              required
            >
              {deviceTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          
          <div className="mb-3">
            <label htmlFor="location" className="form-label">Location</label>
            <select
              className="form-select"
              id="location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              required
            >
              <option value="">Select a location</option>
              {locationSuggestions.map(loc => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
          </div>
          
          <div className="mb-3">
            <label htmlFor="ipAddress" className="form-label">IP Address (optional)</label>
            <input
              type="text"
              className="form-control"
              id="ipAddress"
              name="ipAddress"
              value={formData.ipAddress}
              onChange={handleChange}
              placeholder="192.168.1.100"
            />
          </div>
          
          <div className="mb-3">
            <label htmlFor="apiKey" className="form-label">API Key (optional)</label>
            <input
              type="text"
              className="form-control"
              id="apiKey"
              name="apiKey"
              value={formData.apiKey}
              onChange={handleChange}
              placeholder="Device API key if needed"
            />
          </div>
          
          <div className="mb-3 form-check">
            <input
              type="checkbox"
              className="form-check-input"
              id="isOnline"
              name="isOnline"
              checked={formData.isOnline}
              onChange={handleChange}
            />
            <label className="form-check-label" htmlFor="isOnline">Device is online</label>
          </div>
          
          <div className="d-flex justify-content-between">
            <button 
              type="button" 
              className="btn btn-outline-secondary" 
              onClick={() => navigate('/devices')}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Adding...
                </>
              ) : 'Add Device'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DeviceForm; 