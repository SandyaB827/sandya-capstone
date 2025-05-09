import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

const DeviceForm = ({ refreshDevices }) => {
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    location: '',
    ipAddress: '',
    apiKey: '',
    isOnline: true
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Define device types with their descriptions
  const deviceTypes = [
    { value: 'Light', label: 'Light' },
    { value: 'Thermostat', label: 'Thermostat' },
    { value: 'Door', label: 'Door' },
    { value: 'Camera', label: 'Camera' },
    { value: 'Sensor', label: 'Sensor' }
  ];

  const locationSuggestions = ['Living Room', 'Kitchen', 'Bedroom', 'Bathroom', 'Office', 'Garage', 'Outdoor'];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    // Clear error when user makes changes
    if (error) setError('');
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Device name is required');
      return false;
    }
    if (!formData.type) {
      setError('Please select a device type');
      return false;
    }
    if (!formData.location) {
      setError('Please select a location');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const requestData = {
        Name: formData.name.trim(),
        Type: formData.type,
        Location: formData.location,
        IpAddress: formData.ipAddress.trim(),
        ApiKey: formData.apiKey.trim(),
        IsOnline: formData.isOnline
      };

      console.log("Submitting device data:", requestData);
      
      await api.post('/api/Devices', requestData);
      alert('Device added successfully!');
      refreshDevices();
      navigate('/devices');
    } catch (err) {
      console.error('Add device error:', err);
      let errorMsg = 'Failed to add device';
      
      if (err.response?.data) {
        console.log("Error details:", err.response.data);
        if (typeof err.response.data === 'string') {
          errorMsg += ': ' + err.response.data;
        } else if (err.response.data.errors) {
          errorMsg += ': ' + Object.values(err.response.data.errors)
            .flat()
            .join(', ');
        } else if (err.response.data.title) {
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
              placeholder="Enter device name"
            />
          </div>
          
          <div className="mb-3">
            <label htmlFor="type" className="form-label">Device Type</label>
            <select
              className={`form-select ${!formData.type ? 'is-invalid' : ''}`}
              id="type"
              name="type"
              value={formData.type}
              onChange={handleChange}
              required
            >
              <option value="">Select a device type</option>
              {deviceTypes.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
            {!formData.type && <div className="invalid-feedback">Please select a device type</div>}
          </div>
          
          <div className="mb-3">
            <label htmlFor="location" className="form-label">Location</label>
            <select
              className={`form-select ${!formData.location ? 'is-invalid' : ''}`}
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
            {!formData.location && <div className="invalid-feedback">Please select a location</div>}
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