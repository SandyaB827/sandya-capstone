import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';

const DeviceDetail = ({ refreshDevices }) => {
  const [device, setDevice] = useState(null);
  const [sensorData, setSensorData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [controlLoading, setControlLoading] = useState(false);
  const { id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    fetchDeviceDetails();
    fetchDeviceSensorData();
  }, [id]);

  const fetchDeviceDetails = async () => {
    try {
      const response = await api.get(`/api/Devices/${id}`);
      setDevice(response.data);
    } catch (err) {
      console.error('Fetch device details error:', err);
      setError('Failed to load device details: ' + (err.response?.data || err.message));
      if (err.response?.status === 404) {
        // Device not found, redirect back to device list
        navigate('/devices');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchDeviceSensorData = async () => {
    try {
      const response = await api.get(`/api/Sensors/device/${id}`);
      setSensorData(response.data);
    } catch (err) {
      console.error('Fetch device sensor data error:', err);
      // We don't set an error here as this is secondary data
    }
  };

  const handleToggleLight = async (command) => {
    setControlLoading(true);
    try {
      await api.post(`/api/Control/light/${id}`, { command });
      alert(`Light ${command === 'on' ? 'turned on' : 'turned off'} successfully!`);
      fetchDeviceDetails(); // Refresh device details
    } catch (err) {
      console.error('Control light error:', err);
      alert('Failed to control light: ' + (err.response?.data || err.message));
    } finally {
      setControlLoading(false);
    }
  };

  const handleSetThermostat = async (temperature, mode) => {
    setControlLoading(true);
    try {
      await api.post(`/api/Control/thermostat/${id}`, { temperature, mode });
      alert(`Thermostat set to ${temperature}°C in ${mode} mode`);
      fetchDeviceDetails(); // Refresh device details
    } catch (err) {
      console.error('Control thermostat error:', err);
      alert('Failed to control thermostat: ' + (err.response?.data || err.message));
    } finally {
      setControlLoading(false);
    }
  };

  const handleControlDoor = async (command) => {
    setControlLoading(true);
    try {
      await api.post(`/api/Control/door/${id}`, { command });
      alert(`Door ${command}ed successfully!`);
      fetchDeviceDetails(); // Refresh device details
    } catch (err) {
      console.error('Control door error:', err);
      alert('Failed to control door: ' + (err.response?.data || err.message));
    } finally {
      setControlLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center p-5"><div className="spinner-border"></div></div>;
  }

  if (error) {
    return <div className="alert alert-danger">{error}</div>;
  }

  if (!device) {
    return <div className="alert alert-warning">Device not found</div>;
  }

  // Render different controls based on device type
  const renderDeviceControls = () => {
    switch (device.type.toLowerCase()) {
      case 'light':
        return (
          <div className="card-body">
            <h6>Light Controls</h6>
            <div className="btn-group">
              <button 
                className="btn btn-success" 
                onClick={() => handleToggleLight('on')}
                disabled={controlLoading}
              >
                Turn On
              </button>
              <button 
                className="btn btn-secondary" 
                onClick={() => handleToggleLight('off')}
                disabled={controlLoading}
              >
                Turn Off
              </button>
            </div>
          </div>
        );
      
      case 'thermostat':
        return (
          <div className="card-body">
            <h6>Thermostat Controls</h6>
            <div className="row g-3 align-items-center">
              <div className="col-auto">
                <label htmlFor="temperature" className="col-form-label">Temperature (°C)</label>
              </div>
              <div className="col-auto">
                <input 
                  type="number" 
                  id="temperature" 
                  className="form-control" 
                  min="16" 
                  max="30" 
                  defaultValue="22"
                />
              </div>
              <div className="col-auto">
                <select id="mode" className="form-select">
                  <option value="heat">Heat</option>
                  <option value="cool">Cool</option>
                  <option value="auto">Auto</option>
                  <option value="off">Off</option>
                </select>
              </div>
              <div className="col-auto">
                <button 
                  className="btn btn-primary"
                  onClick={() => {
                    const temp = document.getElementById('temperature').value;
                    const mode = document.getElementById('mode').value;
                    handleSetThermostat(parseInt(temp), mode);
                  }}
                  disabled={controlLoading}
                >
                  Set
                </button>
              </div>
            </div>
          </div>
        );
      
      case 'door':
        return (
          <div className="card-body">
            <h6>Door Controls</h6>
            <div className="btn-group">
              <button 
                className="btn btn-danger" 
                onClick={() => handleControlDoor('lock')}
                disabled={controlLoading}
              >
                Lock
              </button>
              <button 
                className="btn btn-success" 
                onClick={() => handleControlDoor('unlock')}
                disabled={controlLoading}
              >
                Unlock
              </button>
            </div>
          </div>
        );
      
      case 'camera':
        return (
          <div className="card-body text-center">
            <h6>Camera Feed</h6>
            <div className="bg-dark text-white p-5 mb-3">
              <p className="mb-0">Camera feed would be displayed here</p>
            </div>
            <button className="btn btn-primary">View Live Feed</button>
          </div>
        );
      
      default:
        return (
          <div className="card-body">
            <p className="text-muted">No controls available for this device type</p>
          </div>
        );
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4>{device.name}</h4>
        <Link to="/devices" className="btn btn-outline-secondary">Back to Devices</Link>
      </div>
      
      <div className="row">
        <div className="col-md-6">
          {/* Device Details Card */}
          <div className="card mb-4">
            <div className="card-header">
              <h5 className="mb-0">Device Details</h5>
            </div>
            <div className="card-body">
              <table className="table">
                <tbody>
                  <tr>
                    <th scope="row">Type</th>
                    <td>{device.type}</td>
                  </tr>
                  <tr>
                    <th scope="row">Location</th>
                    <td>{device.location}</td>
                  </tr>
                  <tr>
                    <th scope="row">Status</th>
                    <td>
                      {device.isOnline ? (
                        <span className="badge bg-success">Online</span>
                      ) : (
                        <span className="badge bg-secondary">Offline</span>
                      )}
                    </td>
                  </tr>
                  <tr>
                    <th scope="row">IP Address</th>
                    <td>{device.ipAddress || 'Not set'}</td>
                  </tr>
                  <tr>
                    <th scope="row">Added On</th>
                    <td>{new Date(device.addedAt).toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Device Controls Card */}
          <div className="card mb-4">
            <div className="card-header">
              <h5 className="mb-0">Controls</h5>
            </div>
            {renderDeviceControls()}
          </div>
        </div>
        
        <div className="col-md-6">
          {/* Recent Sensor Data Card */}
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">Recent Sensor Data</h5>
            </div>
            <div className="card-body">
              {sensorData.length === 0 ? (
                <div className="alert alert-info">No sensor data available for this device</div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-sm">
                    <thead>
                      <tr>
                        <th>Type</th>
                        <th>Value</th>
                        <th>Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sensorData.slice(0, 10).map((reading, index) => (
                        <tr key={index}>
                          <td>{reading.type}</td>
                          <td>{reading.value} {reading.unit}</td>
                          <td>{new Date(reading.timestamp).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeviceDetail; 