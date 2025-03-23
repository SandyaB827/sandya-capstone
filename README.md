# Smart Home Dashboard

A comprehensive IoT platform for monitoring and controlling smart home devices. This application allows users to register and manage various smart home devices, view sensor data in real-time, and receive alerts when sensor readings meet specific conditions.

## Features

- **User Authentication**: Secure registration and login system
- **Device Management**: Add, update, and remove various smart home devices
- **Real-time Monitoring**: View sensor data in real-time using SignalR
- **Alerts System**: Receive alerts when sensor readings meet specific conditions
- **Responsive Dashboard**: User-friendly interface to monitor all devices and sensor data
- **Simulation**: Test functionality by simulating sensor data

## Project Structure

The project is organized into several main directories:

- **frontend/**: React-based web interface
- **backend/**: ASP.NET Core API that handles business logic and database operations
- **database/**: Database setup and migration scripts
- **docs/**: Project documentation
- **tests/**: Unit and integration tests
- **deployment/**: Deployment scripts and configurations

## Technology Stack

- **Frontend**: React, Bootstrap, SignalR client
- **Backend**: ASP.NET Core, Entity Framework Core
- **Database**: MySQL
- **Authentication**: JWT (JSON Web Tokens)
- **Real-time Communication**: SignalR

## Getting Started

### Prerequisites

- .NET 6.0 SDK or later
- Node.js 14.x or later
- MySQL 8.0 or later

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/smart-home-dashboard.git
   cd smart-home-dashboard
   ```

2. Set up the backend:
   ```
   cd backend/SmartHomeApi
   dotnet restore
   dotnet ef database update
   ```

3. Set up the frontend:
   ```
   cd ../../frontend/smarthome-dashboard
   npm install
   ```

4. Configure connection settings:
   - Update the connection string in `backend/SmartHomeApi/appsettings.json`
   - Update the API URL in `.env` file in the frontend directory

### Running the Application

1. Start the backend:
   ```
   cd backend/SmartHomeApi
   dotnet run
   ```

2. Start the frontend:
   ```
   cd frontend/smarthome-dashboard
   npm start
   ```

3. Open your browser and navigate to `http://localhost:3000`

## Documentation

For more detailed information about the system, please refer to the documentation in the `docs/` directory:

- [System Architecture](docs/ARCHITECTURE.md)
- [Database Schema](docs/DATABASE.md)
- [Backend API](docs/BACKEND.md)
- [Frontend Components](docs/FRONTEND.md)

## License

This project is licensed under the MIT License - see the LICENSE file for details.
