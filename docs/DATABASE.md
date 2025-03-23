# Database Schema Documentation

## Overview

The Smart Home Dashboard application uses a MySQL database to store and manage all application data. The database schema is designed to support user management, device tracking, and sensor data collection.

## Entity-Relationship Diagram

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│                 │       │                 │       │                 │
│      Users      │◄──1───┤     Devices     │◄──1───┤   SensorData    │
│                 │       │                 │       │                 │
└─────────────────┘       └─────────────────┘       └─────────────────┘
        1                        1                        N
        │                        │                        
        │                        │                        
        │                        N                        
        └────────────N──────────┘                        
```

## Tables

### Users

Stores user account information for authentication and authorization.

| Column        | Type         | Constraints        | Description                       |
|---------------|--------------|-------------------|-----------------------------------|
| Id            | int          | PK, auto-increment | Unique identifier                 |
| Username      | varchar(50)  | Required, Unique   | User's login name                 |
| PasswordHash  | varchar(255) | Required           | Hashed password                   |
| Email         | varchar(100) | Required, Unique   | User's email address              |
| CreatedAt     | datetime     | Default: Now       | Account creation timestamp        |

### Devices

Stores information about all registered smart home devices.

| Column        | Type         | Constraints        | Description                       |
|---------------|--------------|-------------------|-----------------------------------|
| Id            | int          | PK, auto-increment | Unique identifier                 |
| Name          | varchar(100) | Required           | Device name                       |
| Type          | varchar(50)  | Required           | Device type (Light, Thermostat, etc.) |
| Location      | varchar(100) | Required           | Physical location of device       |
| IpAddress     | varchar(15)  |                    | Device IP address                 |
| ApiKey        | varchar(100) |                    | API key for device communication  |
| IsOnline      | bool         | Default: true      | Device connectivity status        |
| UserId        | int          | FK: Users.Id       | Owner of device                   |
| AddedAt       | datetime     | Default: Now       | Device registration timestamp     |

### SensorData

Stores historical sensor readings from all devices.

| Column        | Type         | Constraints        | Description                       |
|---------------|--------------|-------------------|-----------------------------------|
| Id            | int          | PK, auto-increment | Unique identifier                 |
| DeviceId      | int          | Required, FK: Devices.Id | Related device              |
| Type          | varchar(50)  | Required           | Sensor type (Temperature, Humidity, etc.) |
| Value         | varchar(50)  | Required           | Sensor reading value              |
| Unit          | varchar(10)  | Nullable           | Unit of measurement (C, %, lux, etc.) |
| IsAlert       | bool         | Default: false     | Whether this reading triggered an alert |
| AlertMessage  | varchar(255) | Nullable           | Description of alert condition    |
| Timestamp     | datetime     | Default: Now       | Reading timestamp                 |

## Entity Relationships

1. **User to Devices (One-to-Many)**
   - A user can own multiple devices
   - Each device belongs to exactly one user
   - When a user is deleted, all associated devices are automatically deleted (cascade delete)

2. **Device to SensorData (One-to-Many)**
   - A device can have multiple sensor readings
   - Each sensor reading is associated with exactly one device
   - When a device is deleted, all associated sensor data is automatically deleted (cascade delete)

## Indexes

1. **Users Table**
   - Primary Key: `Id`
   - Unique Index: `Username`
   - Unique Index: `Email`

2. **Devices Table**
   - Primary Key: `Id`
   - Index: `UserId` (for efficient querying of a user's devices)

3. **SensorData Table**
   - Primary Key: `Id`
   - Index: `DeviceId` (for efficient querying of a device's sensor data)
   - Index: `Timestamp` (for efficient querying of data by time)

## Migrations

The database schema is managed through Entity Framework Core migrations. Migrations are tracked in the `backend/SmartHomeApi/Migrations` directory and can be applied using the `dotnet ef database update` command.

Key migrations include:

1. Initial creation of the database schema
2. Addition of device management tables
3. Addition of sensor data tables
4. Updates to make certain fields nullable (AlertMessage, Unit) in the SensorData table

## Data Access

All database access is managed through Entity Framework Core, with the database context defined in `backend/SmartHomeApi/data/SmartHomeDbContext.cs`. This provides a strongly-typed, object-oriented approach to database operations.

## Connection Configuration

Database connection settings are stored in the `appsettings.json` file in the backend project. For security, sensitive connection information should be stored in user secrets or environment variables in production environments. 