import React, { useState, useEffect } from 'react';
import api from '../utils/api';

const SensorReadings = ({ devices, sensorData: initialSensorData }) => {
  const [selectedType, setSelectedType] = useState('all');
  const [selectedDevice, setSelectedDevice] = useState('all');
  const [sensorData, setSensorData] = useState(initialSensorData || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Available sensor types
  const sensorTypes = ['temperature', 'humidity', 'motion', 'brightness', 'status'];

  useEffect(() => {
    if (selectedType !== 'all') {
      fetchSensorDataByType();
    } else if (initialSensorData) {
      setSensorData(initialSensorData);
    }
  }, [selectedType]);

  const fetchSensorDataByType = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get(`/api/Sensors/${selectedType}`);
      setSensorData(response.data);
    } catch (err) {
      console.error('Fetch sensor data error:', err);
      setError('Failed to load sensor data: ' + (err.response?.data || err.message));
      setSensorData([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredData = selectedDevice === 'all' 
    ? sensorData 
    : sensorData.filter(reading => reading.deviceId === parseInt(selectedDevice));

  const getGroupedData = () => {
    const grouped = filteredData.reduce((acc, reading) => {
      const type = reading.type.toLowerCase();
      if (!acc[type]) acc[type] = [];
      acc[type].push(reading);
      return acc;
    }, {});

    // Sort readings by timestamp (newest first) within each group
    Object.keys(grouped).forEach(type => {
      grouped[type].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    });

    return grouped;
  };

  const groupedData = getGroupedData();

  return (
    <div className="card">
      <div className="card-header">
        <h5 className="mb-0">Sensor Readings</h5>
      </div>
      <div className="card-body">
        {/* Filters */}
        <div className="row mb-4">
          <div className="col-md-5">
            <label htmlFor="sensorType" className="form-label">Filter by Sensor Type:</label>
            <select 
              id="sensorType" 
              className="form-select"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
            >
              <option value="all">All Types</option>
              {sensorTypes.map(type => (
                <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
              ))}
            </select>
          </div>
          <div className="col-md-5">
            <label htmlFor="deviceFilter" className="form-label">Filter by Device:</label>
            <select 
              id="deviceFilter" 
              className="form-select"
              value={selectedDevice}
              onChange={(e) => setSelectedDevice(e.target.value)}
            >
              <option value="all">All Devices</option>
              {devices.map(device => (
                <option key={device.id} value={device.id}>{device.name}</option>
              ))}
            </select>
          </div>
          <div className="col-md-2 d-flex align-items-end">
            <button 
              className="btn btn-primary w-100" 
              onClick={fetchSensorDataByType}
              disabled={loading}
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Error message */}
        {error && <div className="alert alert-danger">{error}</div>}

        {/* Loading indicator */}
        {loading && <div className="text-center my-3"><div className="spinner-border"></div></div>}

        {/* Sensor data by type */}
        {!loading && filteredData.length === 0 ? (
          <div className="alert alert-info">No sensor data available for the selected filters.</div>
        ) : (
          Object.entries(groupedData).map(([type, readings]) => (
            <div key={type} className="mb-4">
              <h5 className="border-bottom pb-2">{type.charAt(0).toUpperCase() + type.slice(1)} Readings</h5>
              <div className="table-responsive">
                <table className="table table-striped table-sm">
                  <thead>
                    <tr>
                      <th>Device</th>
                      <th>Value</th>
                      <th>Unit</th>
                      <th>Timestamp</th>
                      <th>Alert</th>
                    </tr>
                  </thead>
                  <tbody>
                    {readings.map((reading, index) => {
                      const device = devices.find(d => d.id === reading.deviceId) || {};
                      return (
                        <tr key={index}>
                          <td>{device.name || `Device ${reading.deviceId}`}</td>
                          <td>{reading.value}</td>
                          <td>{reading.unit || '-'}</td>
                          <td>{new Date(reading.timestamp).toLocaleString()}</td>
                          <td>
                            {reading.isAlert ? (
                              <span className="badge bg-danger">Alert</span>
                            ) : (
                              <span className="badge bg-success">Normal</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default SensorReadings; 