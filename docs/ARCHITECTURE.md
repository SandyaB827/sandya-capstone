# System Architecture

## Overview

The Smart Home Dashboard is built using a client-server architecture with distinct frontend and backend components that communicate via RESTful API endpoints and real-time SignalR connections.

## High-level Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│  React Frontend │◄────►   ASP.NET API   │◄────►   MySQL Database│
│  (SPA)          │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        ▲                        ▲                        
        │                        │                        
        ▼                        ▼                        
┌─────────────────┐     ┌─────────────────┐              
│                 │     │                 │              
│  User Browser   │     │  IoT Devices    │              
│                 │     │                 │              
└─────────────────┘     └─────────────────┘              
```

## Key Components

### Frontend (React)

The frontend is a single-page application built with React that provides a responsive user interface for managing smart home devices and monitoring their data.

- **Authentication**: Manages user registration, login, and token-based authentication
- **Device Management**: Interface for adding, editing, and removing devices
- **Dashboard**: Main interface displaying device status, sensor readings, and alerts
- **Real-time Updates**: Uses SignalR client to receive real-time updates from the backend
- **Responsive Design**: Built with Bootstrap for a responsive experience across different devices

### Backend (ASP.NET Core)

The backend is an ASP.NET Core API that handles business logic, data persistence, and real-time communication with the frontend.

- **API Controllers**: RESTful endpoints for CRUD operations on devices, users, and sensor data
- **Authentication Service**: JWT-based authentication and authorization
- **Database Access**: Uses Entity Framework Core to interact with the MySQL database
- **SignalR Hub**: Manages real-time communication with the frontend clients
- **Data Processing**: Processes sensor data and determines when to trigger alerts

### Database (MySQL)

The database stores all application data including user accounts, device configurations, and sensor readings.

- **Users**: User account information and credentials
- **Devices**: IoT device metadata and configuration
- **Sensor Data**: Historical sensor readings from connected devices
- **Relationships**: Maintains relationship integrity between users, devices, and sensor data

## Communication Flow

1. **Authentication Flow**:
   - User submits credentials via the frontend
   - Backend validates credentials, generates JWT token
   - Frontend stores token and includes it in subsequent requests

2. **Device Management Flow**:
   - Authenticated user performs device CRUD operations via the UI
   - Frontend makes API calls to the backend
   - Backend updates the database and returns results

3. **Real-time Monitoring Flow**:
   - Backend receives sensor data from IoT devices
   - Data is processed, stored in database, and evaluated for alerts
   - SignalR pushes real-time updates to connected frontend clients
   - Frontend updates UI with new data without page refresh

## Security Considerations

- **Authentication**: JWT-based authentication with secure token storage
- **Authorization**: Role-based access control for protected endpoints
- **Data Protection**: HTTPS for all client-server communication
- **Input Validation**: Validation on both client and server side
- **Password Handling**: Secure password hashing using BCrypt

## Scalability Considerations

- **Horizontal Scaling**: Backend API can be scaled horizontally behind a load balancer
- **Database Performance**: Indexes on frequently queried fields, efficient query patterns
- **SignalR Scale-out**: Support for scaling SignalR across multiple server instances
- **Pagination**: Data retrieval with pagination to handle large datasets

## Future Architecture Enhancements

- **Microservices**: Break down into smaller, more specialized services
- **Message Queue**: Implement message queuing for asynchronous processing
- **Containerization**: Docker containers for easier deployment and scaling
- **API Gateway**: Add an API gateway for better request routing and security 