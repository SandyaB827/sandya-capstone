import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../utils/api';
import { signalRConnection } from '../utils/signalRConnection';

const DeviceList = ({ devices, loading, error, refreshDevices }) => {
  useEffect(() => {
    // Listen for device status updates
    signalRConnection.addListener('DeviceStatusUpdated', (update) => {
      console.log('Device status update received:', update);
      refreshDevices();
    });

    return () => {
      signalRConnection.removeListener('DeviceStatusUpdated');
    };
  }, [refreshDevices]);

  const handleToggleDevice = async (deviceId, currentStatus) => {
    try {
      // Get current devices state
      const currentDevices = devices;
      
      // Update the device status locally
      const updatedDevices = currentDevices.map(device => {
        if (device.id === deviceId) {
          return { ...device, isOnline: !currentStatus };
        }
        return device;
      });

      // Store the updated state in localStorage
      localStorage.setItem('deviceStates', JSON.stringify(
        updatedDevices.reduce((acc, device) => {
          acc[device.id] = device.isOnline;
          return acc;
        }, {})
      ));
      
      // Update UI through the parent's refresh function with merged state
      const deviceStates = JSON.parse(localStorage.getItem('deviceStates') || '{}');
      const updatedDevicesWithState = currentDevices.map(device => ({
        ...device,
        isOnline: deviceStates[device.id] ?? device.isOnline
      }));
      
      // Update the devices state in the parent component
      refreshDevices(updatedDevicesWithState);
      
      toast.success(`Device ${currentStatus ? 'turned off' : 'turned on'} successfully`);
    } catch (err) {
      console.error('Toggle device error:', err);
      toast.error('Failed to toggle device');
    }
  };

  const handleDeleteDevice = async (deviceId) => {
    if (window.confirm('Are you sure you want to delete this device?')) {
      try {
        await api.delete(`/api/Devices/${deviceId}`);
        toast.success('Device deleted successfully');
        refreshDevices();
      } catch (err) {
        console.error('Delete device error:', err);
        toast.error('Failed to delete device');
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
                      <div className="btn-group">
                        <Link to={`/devices/${device.id}`} className="btn btn-sm btn-info me-1">
                          View
                        </Link>
                        <button
                          className="btn btn-sm btn-primary me-1"
                          onClick={() => handleToggleDevice(device.id, device.isOnline)}
                        >
                          {device.isOnline ? 'Turn Off' : 'Turn On'}
                        </button>
                        <button
                          className="btn btn-sm btn-danger"
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