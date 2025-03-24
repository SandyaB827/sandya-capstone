import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../utils/api';
import SensorReadings from './SensorReadings';

const DeviceDetail = ({ refreshDevices }) => {
    const { id: deviceId } = useParams();
    const [device, setDevice] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchDevice = async () => {
            try {
                const response = await api.get(`/api/devices/${deviceId}`);
                const deviceData = response.data;
                
                // Get stored device states from localStorage
                const deviceStates = JSON.parse(localStorage.getItem('deviceStates') || '{}');
                
                // Merge API data with stored state
                const deviceWithStoredState = {
                    ...deviceData,
                    isOnline: deviceStates[deviceId] ?? deviceData.isOnline
                };
                
                setDevice(deviceWithStoredState);
                setError(null);
            } catch (err) {
                setError('Error fetching device details: ' + err.message);
                console.error('Error fetching device:', err);
                toast.error('Error fetching device details');
            } finally {
                setLoading(false);
            }
        };

        fetchDevice();
    }, [deviceId]);

    const handleDeviceControl = async (action) => {
        try {
            if (action === 'toggle') {
                // Get current device states from localStorage
                const deviceStates = JSON.parse(localStorage.getItem('deviceStates') || '{}');
                
                // Update the device state
                const newState = !device.isOnline;
                deviceStates[deviceId] = newState;
                
                // Save to localStorage
                localStorage.setItem('deviceStates', JSON.stringify(deviceStates));
                
                // Update local state
                setDevice(prev => ({
                    ...prev,
                    isOnline: newState
                }));
                
                // Refresh parent component if needed
                if (refreshDevices) {
                    refreshDevices();
                }
                
                toast.success(`Device ${newState ? 'turned on' : 'turned off'} successfully`);
            }
            // Handle other actions if needed (brightness, temperature)
            
        } catch (err) {
            setError('Error controlling device: ' + err.message);
            console.error('Error controlling device:', err);
            toast.error('Failed to control device');
        }
    };

    if (loading) {
        return (
            <div className="d-flex justify-content-center">
                <div className="spinner-border" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return <div className="alert alert-danger">{error}</div>;
    }

    if (!device) {
        return <div className="alert alert-warning">Device not found</div>;
    }

    return (
        <div className="container mt-4">
            <div className="row">
                <div className="col-md-4">
                    <div className="card">
                        <div className="card-body">
                            <h5 className="card-title">{device.name}</h5>
                            <p className="card-text">
                                <strong>Type:</strong> {device.type}<br />
                                <strong>Location:</strong> {device.location}<br />
                                <strong>Status:</strong>{' '}
                                <span className={`badge ${device.isOnline ? 'bg-success' : 'bg-danger'}`}>
                                    {device.isOnline ? 'Online' : 'Offline'}
                                </span>
                            </p>
                            <div className="d-grid gap-2">
                                <button
                                    className="btn btn-primary"
                                    onClick={() => handleDeviceControl('toggle')}
                                >
                                    Toggle Power
                                </button>
                                {device.type === 'Light' && (
                                    <button
                                        className="btn btn-secondary"
                                        onClick={() => handleDeviceControl('brightness')}
                                    >
                                        Adjust Brightness
                                    </button>
                                )}
                                {device.type === 'Thermostat' && (
                                    <button
                                        className="btn btn-secondary"
                                        onClick={() => handleDeviceControl('temperature')}
                                    >
                                        Set Temperature
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-md-8">
                    <SensorReadings deviceId={deviceId} />
                </div>
            </div>
        </div>
    );
};

export default DeviceDetail; 