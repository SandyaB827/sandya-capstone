using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using SmartHomeApi.Models;

namespace SmartHomeApi.Hubs
{
    [Authorize]
    public class SmartHomeHub : Hub
    {
        // This hub will be used to send real-time updates to connected clients
        
        // Method to broadcast sensor data to all connected clients
        public async Task BroadcastSensorData(SensorData data)
        {
            await Clients.All.SendAsync("SensorDataUpdated", data);
        }
        
        // Method to send notification for a specific user
        public async Task SendUserNotification(string userId, string message, string type)
        {
            await Clients.User(userId).SendAsync("NotificationReceived", new { message, type });
        }
        
        // Method to send device status update for a specific user
        public async Task SendDeviceStatusUpdate(string userId, int deviceId, string status)
        {
            await Clients.User(userId).SendAsync("DeviceStatusUpdated", new { deviceId, status });
        }
        
        // Method to alert all users about a security breach
        public async Task AlertSecurityBreach(string location, string details)
        {
            await Clients.All.SendAsync("SecurityBreachAlert", new { location, details, timestamp = DateTime.Now });
        }
    }
} 