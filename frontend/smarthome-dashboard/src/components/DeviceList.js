import React from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';

const DeviceList = ({ devices, loading, error, refreshDevices }) => {
  const handleDeleteDevice = async (deviceId) => {
    if (window.confirm('Are you sure you want to delete this device?')) {
      try {
        await api.delete(`/api/Devices/${deviceId}`);
        alert('Device deleted successfully');
        refreshDevices();
      } catch (err) {
        console.error('Delete device error:', err);
        alert('Failed to delete device');
      }
    }
  };

  const getStatusBadge = (isOnline) => {
    return isOnline ? 
      <span className="badge bg-success">Online</span> : 
      <span className="badge bg-secondary">Offline</span>;
  };

  if (loading) {
    return <div className="text-center p-5"><div className="spinner-border"></div></div>;
  }

  if (error) {
    return <div className="alert alert-danger">{error}</div>;
  }

  return (
    <div className="card">
      <div className="card-header d-flex justify-content-between align-items-center">
        <h5 className="mb-0">My Devices</h5>
        <Link to="/devices/add" className="btn btn-primary">Add Device</Link>
      </div>
      <div className="card-body">
        {devices.length === 0 ? (
          <div className="alert alert-info">
            No devices found. <Link to="/devices/add">Add your first device</Link>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Location</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {devices.map(device => (
                  <tr key={device.id}>
                    <td>{device.name}</td>
                    <td>{device.type}</td>
                    <td>{device.location}</td>
                    <td>{getStatusBadge(device.isOnline)}</td>
                    <td>
                      <div className="btn-group btn-group-sm">
                        <Link to={`/devices/${device.id}`} className="btn btn-outline-primary">
                          Details
                        </Link>
                        <button 
                          className="btn btn-outline-danger"
                          onClick={() => handleDeleteDevice(device.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default DeviceList; 