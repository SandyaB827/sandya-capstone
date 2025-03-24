import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../utils/api';
import { signalRConnection } from '../utils/signalRConnection';
import { Line } from 'react-chartjs-2';
import 'react-toastify/dist/ReactToastify.css';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

const SensorReadings = ({ deviceId, devices, sensorData: initialSensorData }) => {
    const [sensorData, setSensorData] = useState([]);
    const [latestReading, setLatestReading] = useState(null);
    const [chartData, setChartData] = useState(null);
    const [error, setError] = useState(null);
    const [isMounted, setIsMounted] = useState(true);
    const token = localStorage.getItem('token');
    const REFRESH_INTERVAL = 300000; // 5 minutes in milliseconds

    const showNotification = (message, type = 'info') => {
        toast[type](message, {
            position: "top-right",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
        });
    };

    const processReading = (reading) => {
        console.log('Processing reading:', reading);
        if (!reading) {
            console.warn('Received null or undefined reading');
            return null;
        }

        // Skip status updates
        if (reading.type === 'Status') {
            console.log('Skipping status update:', reading);
            return null;
        }

        try {
            const processed = {
                ...reading,
                timestamp: reading.timestamp ? new Date(reading.timestamp).toISOString() : null,
                value: reading.value || '0',
                type: reading.type || 'Unknown',
                unit: reading.unit || '',
                isAlert: reading.isAlert || false,
                alertMessage: reading.alertMessage || null
            };
            console.log('Processed reading:', processed);
            if (!processed.timestamp) {
                console.warn('No timestamp in processed reading');
            }
            return processed;
        } catch (error) {
            console.error('Error processing reading:', error, 'Original reading:', reading);
            return null;
        }
    };

    const simulateSensorData = async () => {
        try {
            await api.post('/api/sensors/simulate');
            showNotification('Sensor data simulation triggered', 'success');
            // Fetch new data after simulation, but skip showing additional notifications
            await fetchSensorData(true);
        } catch (error) {
            console.error('Error simulating sensor data:', error);
            showNotification('Failed to simulate sensor data', 'error');
        }
    };

    const fetchAllSensorsData = async () => {
        try {
            const response = await api.get('/api/sensors');
            console.log('Fetched all sensors data:', response.data);
            return response.data;
        } catch (error) {
            console.error('Error fetching all sensors data:', error);
            showNotification('Failed to fetch sensor data', 'error');
            return [];
        }
    };

    const fetchSensorData = async (skipSimulation = false) => {
        if (!isMounted) return;

        if (!deviceId) {
            try {
                // Only simulate if explicitly requested
                if (!skipSimulation) {
                    await simulateSensorData();
                }
                
                const allSensorsData = await fetchAllSensorsData();
                
                if (!isMounted) return;

                const processedData = allSensorsData
                    .map(reading => processReading(reading))
                    .filter(reading => reading && reading.timestamp && reading.type !== 'Status')
                    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

                console.log('Processed all sensors data:', processedData);
                
                setSensorData(processedData);
                if (processedData.length > 0) {
                    setLatestReading(processedData[0]);
                    if (!skipSimulation) {
                        showNotification('Sensor data updated successfully', 'success');
                    }
                }
                updateChartData(processedData);
            }
            catch (error) {
                console.error('Error fetching all sensors data:', error);
                if (isMounted) {
                    setError('Failed to fetch sensor data');
                    showNotification('Failed to fetch sensor data', 'error');
                }
            }
            return;
        }

        try {
            console.log('Fetching sensor data for device:', deviceId);
            const response = await api.get(`/api/sensors/${deviceId}`);
            console.log('Raw API response:', response.data);
            
            if (!isMounted) return;

            const processedData = response.data
                .filter(reading => reading.type !== 'Status')
                .map(reading => {
                    const processed = processReading(reading);
                    if (!processed) {
                        console.warn('Failed to process reading:', reading);
                    }
                    return processed;
                })
                .filter(reading => {
                    if (!reading || !reading.timestamp) {
                        console.warn('Filtering out invalid reading:', reading);
                        return false;
                    }
                    return true;
                })
                .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

            console.log('Processed and sorted data:', processedData);

            setSensorData(processedData);
            if (processedData.length > 0) {
                console.log('Setting latest reading:', processedData[0]);
                setLatestReading(processedData[0]);
                showNotification('Sensor data updated successfully', 'success');
            }
            updateChartData(processedData);
            setError(null);
        } catch (error) {
            console.error('Error fetching sensor data:', error.response || error);
            if (isMounted) {
                setError('Failed to fetch sensor data');
                showNotification('Failed to fetch sensor data', 'error');
            }
        }
    };

    useEffect(() => {
        setIsMounted(true);
        let refreshInterval;

        const setupSignalR = async () => {
            try {
                await signalRConnection.start(token);

                const handleSensorUpdate = (update) => {
                    if (!isMounted) return;
                    
                    console.log('Received real-time update:', update);
                    if (deviceId && update.deviceId !== deviceId) {
                        return;
                    }

                    try {
                        const sensorData = update.sensorData || update;
                        
                        if (sensorData.type === 'Status') {
                            console.log('Skipping status update in real-time:', sensorData);
                            return;
                        }

                        console.log('Processing real-time sensor data:', sensorData);
                        
                        const processedReading = processReading(sensorData);
                        console.log('Processed real-time reading:', processedReading);
                        
                        if (processedReading) {
                            setLatestReading(processedReading);
                            setSensorData(prevData => {
                                const newData = [processedReading, ...prevData]
                                    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                                    .slice(0, 50);
                                console.log('Updated sensor data state:', newData);
                                updateChartData(newData);
                                return newData;
                            });

                            // Only show alert notifications for real alerts
                            if (processedReading.isAlert) {
                                const deviceName = devices?.find(d => d.id === processedReading.deviceId)?.name || 'Unknown Device';
                                showNotification(
                                    `Alert from ${deviceName}: ${processedReading.alertMessage || 'Alert condition detected!'}`,
                                    'warning'
                                );
                            }
                        }
                    } catch (error) {
                        console.error('Error processing sensor update:', error);
                        showNotification('Error processing sensor update', 'error');
                    }
                };

                signalRConnection.addListener('SensorDataUpdated', handleSensorUpdate);
                return () => signalRConnection.removeListener('SensorDataUpdated', handleSensorUpdate);
            } catch (error) {
                console.error('Error setting up SignalR:', error);
                if (isMounted) {
                    setError('Failed to establish real-time connection');
                    showNotification('Failed to establish real-time connection', 'error');
                }
            }
        };

        // Initial setup - fetch data without simulation first
        setupSignalR().then(() => fetchSensorData(true));

        // Set up refresh interval only for the sensors overview page
        if (!deviceId) {
            console.log('Setting up 5-minute refresh interval');
            refreshInterval = setInterval(() => {
                console.log('Auto-refreshing sensor data...');
                // Auto-refresh should not trigger simulation
                fetchSensorData(true);
            }, REFRESH_INTERVAL);
        }

        return () => {
            setIsMounted(false);
            if (refreshInterval) {
                clearInterval(refreshInterval);
            }
        };
    }, [deviceId, token, initialSensorData, devices]);

    const updateChartData = (data) => {
        if (!data || data.length === 0) return;

        try {
            const validData = data.filter(reading => 
                reading && reading.timestamp && !isNaN(new Date(reading.timestamp))
            );

            if (validData.length === 0) return;

            const timestamps = validData.map(reading => 
                new Date(reading.timestamp).toLocaleTimeString('en-US')
            );

            const values = validData.map(reading => {
                if (!reading.value) return 0;
                if (reading.type === 'Motion') {
                    return reading.value === 'Detected' ? 1 : 0;
                }
                const numValue = parseFloat(reading.value);
                return isNaN(numValue) ? 0 : numValue;
            });

            setChartData({
                labels: timestamps,
                datasets: [
                    {
                        label: `${validData[0].type} ${validData[0].unit}`.trim(),
                        data: values,
                        fill: false,
                        borderColor: 'rgb(75, 192, 192)',
                        tension: 0.1
                    }
                ]
            });
        } catch (error) {
            console.error('Error updating chart data:', error);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            if (isNaN(date)) return 'N/A';
            return date.toLocaleString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: true
            });
        } catch (error) {
            return 'N/A';
        }
    };

    const renderSensorTable = () => {
        if (error) {
            return (
                <div className="alert alert-danger" role="alert">
                    {error}
                </div>
            );
        }

        const validReadings = sensorData.filter(reading => 
            reading && reading.timestamp && !isNaN(new Date(reading.timestamp))
        );

        return (
            <div className="card mb-4">
                <div className="card-body">
                    <h5 className="card-title">Recent Readings</h5>
                    <div className="table-responsive">
                        <table className="table table-striped">
                            <thead>
                                <tr>
                                    <th>Type</th>
                                    <th>Value</th>
                                    <th>Unit</th>
                                    <th>Time</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {validReadings.length > 0 ? (
                                    validReadings.slice(0, 10).map((reading, index) => (
                                        <tr key={index}>
                                            <td>{reading.type}</td>
                                            <td>{reading.value}</td>
                                            <td>{reading.unit}</td>
                                            <td>{formatDate(reading.timestamp)}</td>
                                            <td>
                                                <span className={`badge ${reading.isAlert ? 'bg-warning' : 'bg-success'}`}>
                                                    {reading.isAlert ? 'Alert' : 'Normal'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="text-center">
                                            No sensor readings available
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    };

    const renderLatestReading = () => {
        if (!latestReading || !latestReading.timestamp) return null;

        return (
            <div className="card mb-4">
                <div className="card-body">
                    <h5 className="card-title">Latest Reading</h5>
                    <p className="card-text">
                        <strong>Type:</strong> {latestReading.type}<br />
                        <strong>Value:</strong> {latestReading.value} {latestReading.unit}<br />
                        <strong>Time:</strong> {formatDate(latestReading.timestamp)}<br />
                        {latestReading.isAlert && (
                            <div className="alert alert-warning mt-2">
                                {latestReading.alertMessage || 'Alert condition detected!'}
                            </div>
                        )}
                    </p>
                </div>
            </div>
        );
    };

    return (
        <div className="sensor-readings">
            {renderLatestReading()}
            {renderSensorTable()}
            
            {chartData && (
                <div className="card">
                    <div className="card-body">
                        <h5 className="card-title">Historical Data</h5>
                        <Line 
                            data={chartData}
                            options={{
                                responsive: true,
                                plugins: {
                                    legend: {
                                        position: 'top',
                                    },
                                    title: {
                                        display: true,
                                        text: 'Sensor Readings Over Time'
                                    }
                                },
                                scales: {
                                    y: {
                                        beginAtZero: true
                                    }
                                }
                            }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default SensorReadings; 