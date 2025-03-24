using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using SmartHomeApi.Data;
using SmartHomeApi.Hubs;
using SmartHomeApi.Models;

namespace SmartHomeApi.Services
{
    public class SensorSimulationService : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly IHubContext<SmartHomeHub> _hubContext;
        private readonly Random _random = new Random();

        public SensorSimulationService(
            IServiceProvider serviceProvider,
            IHubContext<SmartHomeHub> hubContext)
        {
            _serviceProvider = serviceProvider;
            _hubContext = hubContext;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                using (var scope = _serviceProvider.CreateScope())
                {
                    var dbContext = scope.ServiceProvider.GetRequiredService<SmartHomeDbContext>();
                    var devices = await dbContext.Devices.ToListAsync(stoppingToken);

                    foreach (var device in devices)
                    {
                        var sensorData = GenerateSensorData(device);
                        dbContext.SensorData.Add(sensorData);

                        // Broadcast the new sensor data via SignalR
                        await _hubContext.Clients.All.SendAsync("SensorDataUpdated", new
                        {
                            deviceId = device.Id,
                            deviceName = device.Name,
                            sensorData = new
                            {
                                id = sensorData.Id,
                                deviceId = sensorData.DeviceId,
                                type = sensorData.Type,
                                value = sensorData.Value,
                                unit = sensorData.Unit,
                                isAlert = sensorData.IsAlert,
                                alertMessage = sensorData.AlertMessage,
                                timestamp = sensorData.Timestamp.ToString("o") // ISO 8601 format
                            }
                        }, stoppingToken);
                    }

                    await dbContext.SaveChangesAsync(stoppingToken);
                }

                await Task.Delay(TimeSpan.FromSeconds(15), stoppingToken);
            }
        }

        private SensorData GenerateSensorData(Device device)
        {
            var sensorData = new SensorData
            {
                DeviceId = device.Id,
                Timestamp = DateTime.UtcNow,
                IsAlert = false
            };

            switch (device.Type.ToLower())
            {
                case "temperature":
                    sensorData.Type = "Temperature";
                    sensorData.Value = _random.Next(18, 30).ToString();
                    sensorData.Unit = "°C";
                    if (int.Parse(sensorData.Value) > 28)
                    {
                        sensorData.IsAlert = true;
                        sensorData.AlertMessage = "High temperature detected!";
                    }
                    break;

                case "humidity":
                    sensorData.Type = "Humidity";
                    sensorData.Value = _random.Next(30, 70).ToString();
                    sensorData.Unit = "%";
                    if (int.Parse(sensorData.Value) > 65)
                    {
                        sensorData.IsAlert = true;
                        sensorData.AlertMessage = "High humidity detected!";
                    }
                    break;

                case "motion":
                    sensorData.Type = "Motion";
                    sensorData.Value = _random.Next(0, 100) < 20 ? "Detected" : "None";
                    sensorData.Unit = "";
                    if (sensorData.Value == "Detected")
                    {
                        sensorData.IsAlert = true;
                        sensorData.AlertMessage = "Motion detected!";
                    }
                    break;

                case "light":
                    sensorData.Type = "Light";
                    sensorData.Value = _random.Next(0, 1000).ToString();
                    sensorData.Unit = "lux";
                    break;

                default:
                    sensorData.Type = device.Type;
                    sensorData.Value = _random.Next(0, 100).ToString();
                    sensorData.Unit = "";
                    break;
            }

            return sensorData;
        }
    }
} 