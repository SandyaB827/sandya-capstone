import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, Link } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import { HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import api from './utils/api';
import Login from './components/Login';
import Register from './components/Register';
import DeviceList from './components/DeviceList';
import DeviceDetail from './components/DeviceDetail';
import Dashboard from './components/Dashboard';
import SensorReadings from './components/SensorReadings';
import DeviceForm from './components/DeviceForm';

function App() {
  const [devices, setDevices] = useState([]);
  const [sensorData, setSensorData] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));
  const [hubConnection, setHubConnection] = useState(null);

  // Set up SignalR connection when authentication state changes
  useEffect(() => {
    if (isAuthenticated) {
      fetchDevices();
      fetchAlerts();
      connectToSignalR();
    } else {
      // Disconnect SignalR when logged out
      if (hubConnection) {
        hubConnection.stop();
        setHubConnection(null);
      }
    }
    
    return () => {
      // Clean up connection when component unmounts
      if (hubConnection) {
        hubConnection.stop();
      }
    };
  }, [isAuthenticated]);

  // Connect to SignalR hub
  const connectToSignalR = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const connection = new HubConnectionBuilder()
        .withUrl(`${process.env.REACT_APP_API_BASE_URL}/smarthomehub?access_token=${token}`)
        .configureLogging(LogLevel.Information)
        .withAutomaticReconnect()
        .build();
        
      connection.on("SensorDataUpdated", (data) => {
        console.log("Real-time sensor update received:", data);
        setSensorData(prevData => {
          // Remove any existing data for this device+type and add the new one
          const filtered = prevData.filter(d => 
            !(d.deviceId === data.deviceId && d.type === data.type)
          );
          return [data, ...filtered];
        });
      });
      
      connection.on("AlertNotification", (alert) => {
        console.log("Alert notification received:", alert);
        setAlerts(prevAlerts => [alert, ...prevAlerts]);
      });
      
      connection.on("DeviceStatusUpdated", (update) => {
        console.log("Device status update received:", update);
        setDevices(prevDevices => 
          prevDevices.map(device => 
            device.id === update.deviceId 
              ? { ...device, status: update.status } 
              : device
          )
        );
      });
      
      await connection.start();
      console.log("SignalR Connected!");
      setHubConnection(connection);
    } catch (err) {
      console.error("SignalR Connection Error: ", err);
    }
  };

  const fetchDevices = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/api/Devices');
      setDevices(response.data);
    } catch (err) {
      console.error('Fetch devices error:', err.response || err);
      setError('Failed to fetch devices: ' + (err.response?.statusText || err.message));
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        setIsAuthenticated(false);
      }
      setDevices([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAlerts = async () => {
    try {
      const response = await api.get('/api/Sensors/alerts');
      setAlerts(response.data);
    } catch (err) {
      console.error('Fetch alerts error:', err.response || err);
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        setIsAuthenticated(false);
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    setDevices([]);
    setError(null);
    setSensorData([]);
    setAlerts([]);
  };

  const ProtectedRoute = ({ children }) => {
    if (!isAuthenticated) {
      return <Navigate to="/login" />;
    }
    return children;
  };

  const simulateSensorData = async () => {
    try {
      await api.post('/api/Sensors/simulate');
    } catch (err) {
      console.error('Simulate sensor data error:', err);
    }
  };

  return (
    <Router>
      <div className="container-fluid">
        <nav className="navbar navbar-expand-lg navbar-dark bg-primary mb-4">
          <div className="container">
            <Link className="navbar-brand" to="/">Smart Home Dashboard</Link>
            <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
              <span className="navbar-toggler-icon"></span>
            </button>
            <div className="collapse navbar-collapse" id="navbarNav">
              <ul className="navbar-nav me-auto">
                {isAuthenticated && (
                  <>
                    <li className="nav-item">
                      <Link className="nav-link" to="/">Dashboard</Link>
                    </li>
                    <li className="nav-item">
                      <Link className="nav-link" to="/devices">Devices</Link>
                    </li>
                    <li className="nav-item">
                      <Link className="nav-link" to="/sensors">Sensors</Link>
                    </li>
                  </>
                )}
              </ul>
              <div className="d-flex">
                {isAuthenticated ? (
                  <>
                    <button className="btn btn-outline-light me-2" onClick={simulateSensorData}>
                      Simulate Data
                    </button>
                    <button className="btn btn-outline-light" onClick={handleLogout}>
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Link className="btn btn-outline-light me-2" to="/login">Login</Link>
                    <Link className="btn btn-outline-light" to="/register">Register</Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </nav>

        <div className="container mt-4">
          <Routes>
            <Route path="/login" element={<Login setAuth={setIsAuthenticated} />} />
            <Route path="/register" element={<Register />} />
            
            <Route path="/" element={
              <ProtectedRoute>
                <Dashboard 
                  devices={devices} 
                  sensorData={sensorData} 
                  alerts={alerts} 
                  loading={loading}
                  error={error}
                />
              </ProtectedRoute>
            } />
            
            <Route path="/devices" element={
              <ProtectedRoute>
                <DeviceList 
                  devices={devices} 
                  loading={loading} 
                  error={error}
                  refreshDevices={fetchDevices}
                />
              </ProtectedRoute>
            } />
            
            <Route path="/devices/add" element={
              <ProtectedRoute>
                <DeviceForm refreshDevices={fetchDevices} />
              </ProtectedRoute>
            } />
            
            <Route path="/devices/:id" element={
              <ProtectedRoute>
                <DeviceDetail refreshDevices={fetchDevices} />
              </ProtectedRoute>
            } />
            
            <Route path="/sensors" element={
              <ProtectedRoute>
                <SensorReadings 
                  devices={devices}
                  sensorData={sensorData}
                />
              </ProtectedRoute>
            } />
            
            <Route path="*" element={<Navigate to="/login" />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;