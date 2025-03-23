import React from 'react';
import { Link } from 'react-router-dom';

const Dashboard = ({ devices, sensorData, alerts, loading, error }) => {
  // Get counts for device types
  const deviceCounts = devices.reduce((acc, device) => {
    const type = device.type.toLowerCase();
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});

  const totalDevices = devices.length;
  const totalAlerts = alerts.length;
  
  // Group alerts by type
  const alertGroups = alerts.reduce((acc, alert) => {
    const type = alert.type?.toLowerCase() || 'unknown';
    if (!acc[type]) acc[type] = [];
    acc[type].push(alert);
    return acc;
  }, {});

  if (loading) {
    return <div className="text-center p-5"><div className="spinner-border"></div></div>;
  }

  if (error) {
    return <div className="alert alert-danger">{error}</div>;
  }

  return (
    <div className="row">
      {/* Summary Cards */}
      <div className="col-12 mb-4">
        <div className="row">
          <div className="col-md-3 mb-3">
            <div className="card bg-primary text-white h-100">
              <div className="card-body">
                <h5 className="card-title">Total Devices</h5>
                <h2>{totalDevices}</h2>
                <Link to="/devices" className="text-white">View All</Link>
              </div>
            </div>
          </div>
          <div className="col-md-3 mb-3">
            <div className="card bg-success text-white h-100">
              <div className="card-body">
                <h5 className="card-title">Active Devices</h5>
                <h2>{devices.filter(d => d.isOnline).length}</h2>
              </div>
            </div>
          </div>
          <div className="col-md-3 mb-3">
            <div className="card bg-warning text-dark h-100">
              <div className="card-body">
                <h5 className="card-title">Sensor Readings</h5>
                <h2>{sensorData.length}</h2>
              </div>
            </div>
          </div>
          <div className="col-md-3 mb-3">
            <div className="card bg-danger text-white h-100">
              <div className="card-body">
                <h5 className="card-title">Active Alerts</h5>
                <h2>{totalAlerts}</h2>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Devices */}
      <div className="col-md-8">
        <div className="card mb-4">
          <div className="card-header d-flex justify-content-between align-items-center">
            <h5 className="mb-0">Devices</h5>
            <Link to="/devices/add" className="btn btn-sm btn-primary">Add Device</Link>
          </div>
          <div className="card-body">
            {totalDevices === 0 ? (
              <div className="alert alert-info">
                No devices added yet. <Link to="/devices/add">Add your first device</Link>
              </div>
            ) : (
              <div className="row">
                {Object.entries(deviceCounts).map(([type, count]) => (
                  <div key={type} className="col-md-4 mb-3">
                    <div className="card">
                      <div className="card-body text-center">
                        <h5 className="card-title">{type.charAt(0).toUpperCase() + type.slice(1)}</h5>
                        <p className="display-4">{count}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {totalDevices > 0 && (
              <div className="text-center mt-3">
                <Link to="/devices" className="btn btn-outline-primary">Manage Devices</Link>
              </div>
            )}
          </div>
        </div>

        {/* Recent Sensor Data */}
        <div className="card">
          <div className="card-header">
            <h5 className="mb-0">Recent Sensor Data</h5>
          </div>
          <div className="card-body">
            {sensorData.length === 0 ? (
              <div className="alert alert-info">No sensor data available</div>
            ) : (
              <div className="table-responsive">
                <table className="table table-sm">
                  <thead>
                    <tr>
                      <th>Device</th>
                      <th>Type</th>
                      <th>Value</th>
                      <th>Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sensorData.slice(0, 5).map((reading, index) => {
                      const device = devices.find(d => d.id === reading.deviceId) || {};
                      return (
                        <tr key={index}>
                          <td>{device.name || `Device ${reading.deviceId}`}</td>
                          <td>{reading.type}</td>
                          <td>{reading.value} {reading.unit}</td>
                          <td>{new Date(reading.timestamp).toLocaleTimeString()}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            {sensorData.length > 0 && (
              <div className="text-center">
                <Link to="/sensors" className="btn btn-outline-primary">View All Data</Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Alerts */}
      <div className="col-md-4">
        <div className="card">
          <div className="card-header bg-danger text-white">
            <h5 className="mb-0">Alerts</h5>
          </div>
          <div className="card-body">
            {totalAlerts === 0 ? (
              <div className="alert alert-success">No active alerts</div>
            ) : (
              <div>
                {Object.entries(alertGroups).map(([type, alerts]) => (
                  <div key={type} className="mb-3">
                    <h6 className="border-bottom pb-2">{type.toUpperCase()} Alerts ({alerts.length})</h6>
                    {alerts.slice(0, 3).map((alert, index) => (
                      <div key={index} className="alert alert-danger mb-2 py-2">
                        <small className="d-block text-muted">
                          {new Date(alert.timestamp).toLocaleString()}
                        </small>
                        <div><strong>{alert.deviceName || `Device ${alert.deviceId}`}</strong>: {alert.message}</div>
                        <small>{alert.location}</small>
                      </div>
                    ))}
                    {alerts.length > 3 && (
                      <p className="text-center"><small>+ {alerts.length - 3} more</small></p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 