# Frontend Documentation

## Overview

The frontend of the Smart Home Dashboard is a React-based single-page application (SPA) that provides a responsive and intuitive user interface for managing and monitoring smart home devices. It communicates with the backend API for data operations and uses SignalR for real-time updates.

## Project Structure

```
frontend/
└── smarthome-dashboard/
    ├── public/             # Static assets
    ├── src/
    │   ├── components/     # React components
    │   ├── utils/          # Utility functions
    │   ├── App.js          # Main application component
    │   ├── App.css         # Application styles
    │   └── index.js        # Application entry point
    ├── package.json        # Dependencies and scripts
    └── .env                # Environment variables
```

## Core Components

### App.js

The main application component that:
- Sets up routing
- Manages authentication state
- Establishes SignalR connection
- Handles data fetching
- Provides global state

### Authentication Components

#### Login.js

- Provides a form for user authentication
- Handles JWT token storage
- Redirects authenticated users

#### Register.js

- Provides a form for user registration
- Validates user input
- Displays feedback on registration status

### Device Management Components

#### DeviceList.js

- Displays all devices for the authenticated user
- Provides links to detailed device views
- Allows for device deletion

#### DeviceDetail.js

- Shows detailed information for a specific device
- Displays device control interfaces
- Shows historical sensor data for the device
- Provides device editing and deletion options

#### DeviceForm.js

- Provides a form for adding new devices
- Handles validation and form submission
- Supports various device types with dynamic fields

### Monitoring Components

#### Dashboard.js

- Main landing page after authentication
- Displays summary cards with key metrics
- Shows recent sensor data and alerts
- Provides quick access to device management

#### SensorReadings.js

- Displays detailed sensor data
- Supports filtering by device and sensor type
- Visualizes data trends with charts

## State Management

The application uses React's built-in state management with:

- `useState` for component-level state
- Props for parent-child communication
- Context API for global state (if needed)

## API Communication

API communication is handled through:

- Axios for HTTP requests
- Custom API utility in `utils/api.js` that:
  - Sets up base URL
  - Manages authentication headers
  - Handles common error scenarios

## Real-time Communication

Real-time updates are implemented using:

- SignalR client library
- Connection established on authentication
- Event handlers for different types of updates:
  - Sensor data updates
  - Device status changes
  - Alert notifications

## UI Framework

The application uses:

- Bootstrap for responsive layout and components
- Custom CSS for application-specific styling
- Responsive design for mobile and desktop views

## Authentication Flow

1. User enters credentials
2. Credentials sent to backend API
3. If valid, JWT token received and stored
4. Token included in subsequent API requests
5. Token expiration handled for session management

## Routing

React Router handles application routing:

- Public routes:
  - `/login`: User authentication
  - `/register`: New user registration

- Protected routes (require authentication):
  - `/`: Dashboard
  - `/devices`: Device list
  - `/devices/add`: Add new device
  - `/devices/:id`: Device details
  - `/sensors`: Sensor readings

## Error Handling

The application includes comprehensive error handling:

- API error handling with user-friendly messages
- Form validation with immediate feedback
- Connection error handling
- Fallback UI for loading and error states

## Data Visualization

Sensor data is visualized using:

- Tables for data listings
- Charts for trend visualization
- Color-coded alerts for important notifications

## Environment Configuration

Environment-specific configuration is stored in `.env` files:

- `REACT_APP_API_BASE_URL`: Backend API URL
- `REACT_APP_VERSION`: Application version
- Additional environment-specific settings

## Development Workflow

To work with the frontend:

1. Install dependencies (`npm install`)
2. Start the development server (`npm start`)
3. Access the application at `http://localhost:3000`
4. Build for production (`npm run build`)

## Performance Considerations

The application implements performance optimizations:

- React.memo for expensive components
- Pagination for large data sets
- Debounced search inputs
- Efficient re-rendering strategies 