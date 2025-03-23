# Backend Documentation

## Overview

The backend of the Smart Home Dashboard is an ASP.NET Core Web API application that provides a robust, secure, and scalable server-side implementation. It handles authentication, device management, and real-time communication with the frontend.

## Project Structure

```
backend/
└── SmartHomeApi/
    ├── controllers/       # API endpoint controllers
    ├── data/              # Database context and data access
    ├── Hubs/              # SignalR hubs for real-time communication
    ├── Migrations/        # Entity Framework Core migrations
    ├── models/            # Data models and DTOs
    ├── Properties/        # Project properties and launch settings
    ├── appsettings.json   # Application configuration
    └── Program.cs         # Application entry point and configuration
```

## Core Components

### Controllers

Controllers define the API endpoints and handle HTTP requests. The application includes the following controllers:

#### AuthController.cs

Handles user authentication and authorization:
- `POST /api/Auth/register`: Creates a new user account
- `POST /api/Auth/login`: Authenticates users and issues JWT tokens

#### DevicesController.cs

Manages smart home devices:
- `GET /api/Devices`: Returns all devices for the authenticated user
- `GET /api/Devices/{id}`: Returns details for a specific device
- `POST /api/Devices`: Creates a new device
- `PUT /api/Devices/{id}`: Updates an existing device
- `DELETE /api/Devices/{id}`: Removes a device

#### SensorsController.cs

Manages sensor data:
- `GET /api/Sensors`: Returns sensor data for all devices
- `GET /api/Sensors/{deviceId}`: Returns sensor data for a specific device
- `POST /api/Sensors`: Records new sensor data
- `GET /api/Sensors/alerts`: Returns all sensor readings that triggered alerts
- `POST /api/Sensors/simulate`: Simulates random sensor data for testing

#### ControlController.cs

Provides control operations for devices:
- `POST /api/Control/{deviceId}/toggle`: Toggles a device on or off
- `POST /api/Control/{deviceId}/set`: Sets a specific state or value for a device

### Models

Data models and DTOs (Data Transfer Objects) define the structure of the data used throughout the application:

- `User.cs`: User account information
- `Device.cs`: Smart home device details
- `SensorData.cs`: Sensor reading data
- `LoginModel.cs`: Login credentials DTO
- `DeviceDto.cs`: Device creation/update DTO

### Data Access

Database access is managed through Entity Framework Core:

- `SmartHomeDbContext.cs`: Defines the database context and entity relationships
- Migrations: Handle database schema creation and updates

### SignalR Hub

`SmartHomeHub.cs` provides real-time communication with frontend clients:

- Broadcasts sensor data updates
- Sends alert notifications
- Updates device status changes

### Authentication

The application uses JWT (JSON Web Token) authentication:

- Tokens are issued upon successful login
- Tokens include user identity claims
- Authentication is required for all sensitive endpoints

## Configuration

Application configuration is stored in `appsettings.json` and includes:

- Database connection string
- JWT authentication settings
- CORS policy configuration
- Logging settings

## Middleware Pipeline

The middleware pipeline is configured in `Program.cs` and includes:

1. Exception handling
2. Static file serving
3. Routing
4. CORS policy
5. Authentication
6. Authorization
7. Endpoint routing

## API Security

Security is implemented at multiple levels:

- HTTPS for all communications
- JWT authentication for user identification
- Password hashing with BCrypt
- Authorization checks on protected endpoints
- Input validation and sanitization

## Data Validation

Input validation is enforced through:

- Data annotations on model properties
- ModelState validation in controllers
- Custom validation logic for complex scenarios

## Error Handling

The application includes comprehensive error handling:

- Try-catch blocks for critical operations
- Consistent error response format
- Detailed logging for debugging
- Appropriate HTTP status codes

## Logging

The application uses .NET's built-in logging framework to record:

- Application startup and shutdown events
- Authentication attempts
- API requests and responses
- Exceptions and errors
- SignalR connection events

## Development Workflow

To work with the backend:

1. Install required dependencies (`dotnet restore`)
2. Apply latest migrations (`dotnet ef database update`)
3. Run the application (`dotnet run`)
4. Access the API at `https://localhost:5001`
5. Use Swagger UI for API testing at `https://localhost:5001/swagger` 