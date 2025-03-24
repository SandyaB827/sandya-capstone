using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using SmartHomeApi.Data;
using SmartHomeApi.Hubs;
using SmartHomeApi.Models;
using System.Security.Claims;

namespace SmartHomeApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class SensorsController : ControllerBase
    {
        private readonly SmartHomeDbContext _context;
        private readonly IHubContext<SmartHomeHub> _hubContext;

        public SensorsController(SmartHomeDbContext context, IHubContext<SmartHomeHub> hubContext)
        {
            _context = context;
            _hubContext = hubContext;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetAllSensorData()
        {
            var sensorData = await _context.SensorData
                .Include(s => s.Device)
                .OrderByDescending(s => s.Timestamp)
                .Take(100)
                .Select(s => new
                {
                    id = s.Id,
                    deviceId = s.DeviceId,
                    type = s.Type,
                    value = s.Value,
                    unit = s.Unit,
                    isAlert = s.IsAlert,
                    alertMessage = s.AlertMessage,
                    timestamp = s.Timestamp.ToString("o"), // ISO 8601 format
                    deviceName = s.Device.Name
                })
                .ToListAsync();

            return Ok(sensorData);
        }

        [HttpGet("{deviceId}")]
        public async Task<ActionResult<IEnumerable<object>>> GetDeviceSensorData(int deviceId)
        {
            var device = await _context.Devices.FindAsync(deviceId);
            if (device == null)
            {
                return NotFound("Device not found");
            }

            var sensorData = await _context.SensorData
                .Where(s => s.DeviceId == deviceId)
                .OrderByDescending(s => s.Timestamp)
                .Take(50)
                .Select(s => new
                {
                    id = s.Id,
                    deviceId = s.DeviceId,
                    type = s.Type,
                    value = s.Value,
                    unit = s.Unit,
                    isAlert = s.IsAlert,
                    alertMessage = s.AlertMessage,
                    timestamp = s.Timestamp.ToString("o") // ISO 8601 format
                })
                .ToListAsync();

            return Ok(sensorData);
        }

        [HttpGet("latest/{deviceId}")]
        public async Task<ActionResult<object>> GetLatestSensorData(int deviceId)
        {
            var device = await _context.Devices.FindAsync(deviceId);
            if (device == null)
            {
                return NotFound("Device not found");
            }

            var latestReading = await _context.SensorData
                .Where(s => s.DeviceId == deviceId)
                .OrderByDescending(s => s.Timestamp)
                .Select(s => new
                {
                    id = s.Id,
                    deviceId = s.DeviceId,
                    type = s.Type,
                    value = s.Value,
                    unit = s.Unit,
                    isAlert = s.IsAlert,
                    alertMessage = s.AlertMessage,
                    timestamp = s.Timestamp.ToString("o") // ISO 8601 format
                })
                .FirstOrDefaultAsync();

            if (latestReading == null)
            {
                return NotFound("No sensor data available for this device");
            }

            return Ok(latestReading);
        }

        [HttpGet("history/{deviceId}")]
        public async Task<ActionResult<IEnumerable<object>>> GetDeviceSensorHistory(int deviceId, 
            [FromQuery] DateTime? startDate, 
            [FromQuery] DateTime? endDate)
        {
            var device = await _context.Devices.FindAsync(deviceId);
            if (device == null)
            {
                return NotFound("Device not found");
            }

            var query = _context.SensorData
                .Where(s => s.DeviceId == deviceId);

            if (startDate.HasValue)
            {
                query = query.Where(s => s.Timestamp >= startDate.Value);
            }

            if (endDate.HasValue)
            {
                query = query.Where(s => s.Timestamp <= endDate.Value);
            }

            var sensorData = await query
                .OrderByDescending(s => s.Timestamp)
                .Select(s => new
                {
                    id = s.Id,
                    deviceId = s.DeviceId,
                    type = s.Type,
                    value = s.Value,
                    unit = s.Unit,
                    isAlert = s.IsAlert,
                    alertMessage = s.AlertMessage,
                    timestamp = s.Timestamp.ToString("o") // ISO 8601 format
                })
                .ToListAsync();

            return Ok(sensorData);
        }

        // GET: api/Sensors/alerts
        [HttpGet("alerts")]
        public async Task<ActionResult<IEnumerable<SensorData>>> GetAlerts()
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
            
            var alerts = await _context.SensorData
                .Include(s => s.Device)
                .Where(s => s.IsAlert && s.Device.UserId == userId)
                .OrderByDescending(s => s.Timestamp)
                .Take(20)
                .ToListAsync();

            return alerts;
        }

        // POST: api/Sensors
        [HttpPost]
        public async Task<ActionResult<SensorData>> PostSensorData(SensorData sensorData)
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
            
            // Verify the device belongs to the user
            var device = await _context.Devices
                .Where(d => d.Id == sensorData.DeviceId && d.UserId == userId)
                .FirstOrDefaultAsync();
                
            if (device == null)
            {
                return NotFound("Device not found");
            }
            
            _context.SensorData.Add(sensorData);
            await _context.SaveChangesAsync();
            
            // Send real-time update via SignalR
            await _hubContext.Clients.User(userId.ToString()).SendAsync("SensorDataUpdated", new
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
            });
            
            // If it's an alert, send a separate notification
            if (sensorData.IsAlert)
            {
                var alertMessage = new
                {
                    deviceName = device.Name,
                    location = device.Location,
                    type = sensorData.Type,
                    value = sensorData.Value,
                    message = sensorData.AlertMessage,
                    timestamp = sensorData.Timestamp.ToString("o")
                };
                
                await _hubContext.Clients.User(userId.ToString()).SendAsync("AlertNotification", alertMessage);
            }

            return CreatedAtAction(nameof(GetDeviceSensorData), new { deviceId = sensorData.DeviceId }, sensorData);
        }
        
        // POST: api/Sensors/simulate
        [HttpPost("simulate")]
        public async Task<IActionResult> SimulateSensorData()
        {
            try
            {
                var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
                
                // Get all devices for this user
                var devices = await _context.Devices.Where(d => d.UserId == userId).ToListAsync();
                
                // If no devices exist, create a sample device for demonstration
                if (!devices.Any())
                {
                    Console.WriteLine("No devices found - creating sample devices for demo");
                    
                    // Create some sample devices
                    var sampleDevices = new List<Device>
                    {
                        new Device
                        {
                            Name = "Living Room Light",
                            Type = "Light",
                            Location = "Living Room",
                            UserId = userId,
                            IsOnline = true,
                            IpAddress = "192.168.1.101",
                            ApiKey = "sample-key-1",
                            AddedAt = DateTime.Now
                        },
                        new Device
                        {
                            Name = "Kitchen Thermostat",
                            Type = "Thermostat",
                            Location = "Kitchen",
                            UserId = userId,
                            IsOnline = true,
                            IpAddress = "192.168.1.102",
                            ApiKey = "sample-key-2",
                            AddedAt = DateTime.Now
                        },
                        new Device
                        {
                            Name = "Front Door",
                            Type = "Door",
                            Location = "Entrance",
                            UserId = userId,
                            IsOnline = true,
                            IpAddress = "192.168.1.103",
                            ApiKey = "sample-key-3",
                            AddedAt = DateTime.Now
                        }
                    };
                    
                    _context.Devices.AddRange(sampleDevices);
                    await _context.SaveChangesAsync();
                    
                    // Update our devices list with the newly created ones
                    devices = sampleDevices;
                }
                
                var random = new Random();
                var simulatedData = new List<SensorData>();
                
                foreach (var device in devices)
                {
                    // Simulate different data types depending on device type
                    switch (device.Type.ToLower())
                    {
                        case "thermostat":
                            var tempAlert = random.Next(10) == 0; // 10% chance of alert
                            simulatedData.Add(new SensorData
                            {
                                DeviceId = device.Id,
                                Type = "Temperature",
                                Value = (18 + random.Next(10)).ToString(), // Temperature between 18-28
                                Unit = "C",
                                IsAlert = tempAlert, 
                                AlertMessage = tempAlert ? "Abnormal temperature detected" : null,
                                Timestamp = DateTime.Now
                            });
                            break;
                            
                        case "light":
                            simulatedData.Add(new SensorData
                            {
                                DeviceId = device.Id,
                                Type = "Brightness",
                                Value = (random.Next(100)).ToString(), // 0-100% brightness
                                Unit = "%",
                                IsAlert = false,
                                AlertMessage = null,
                                Timestamp = DateTime.Now
                            });
                            break;
                            
                        case "door":
                            var doorStatus = random.Next(2) == 0 ? "locked" : "unlocked";
                            var doorAlert = doorStatus == "unlocked" && random.Next(5) == 0; // Alert if unlocked with 20% chance
                            simulatedData.Add(new SensorData
                            {
                                DeviceId = device.Id,
                                Type = "Status",
                                Value = doorStatus,
                                Unit = null,
                                IsAlert = doorAlert,
                                AlertMessage = doorAlert ? "Door left unlocked" : null,
                                Timestamp = DateTime.Now
                            });
                            break;
                            
                        case "camera":
                            var motionDetected = random.Next(10) == 0; // 10% chance of motion
                            simulatedData.Add(new SensorData
                            {
                                DeviceId = device.Id,
                                Type = "Motion",
                                Value = motionDetected ? "detected" : "none",
                                Unit = null,
                                IsAlert = motionDetected,
                                AlertMessage = motionDetected ? "Motion detected" : null,
                                Timestamp = DateTime.Now
                            });
                            break;
                            
                        default:
                            // For unknown device types, create generic sensor data
                            simulatedData.Add(new SensorData
                            {
                                DeviceId = device.Id,
                                Type = "Status",
                                Value = "active",
                                Unit = null,
                                IsAlert = false,
                                AlertMessage = null,
                                Timestamp = DateTime.Now
                            });
                            break;
                    }
                }
                
                // Save all simulated data
                _context.SensorData.AddRange(simulatedData);
                await _context.SaveChangesAsync();
                
                // Send real-time updates
                foreach (var data in simulatedData)
                {
                    await _hubContext.Clients.User(userId.ToString()).SendAsync("SensorDataUpdated", new
                    {
                        deviceId = data.DeviceId,
                        deviceName = devices.First(d => d.Id == data.DeviceId).Name,
                        sensorData = new
                        {
                            id = data.Id,
                            deviceId = data.DeviceId,
                            type = data.Type,
                            value = data.Value,
                            unit = data.Unit,
                            isAlert = data.IsAlert,
                            alertMessage = data.AlertMessage,
                            timestamp = data.Timestamp.ToString("o") // ISO 8601 format
                        }
                    });
                    
                    if (data.IsAlert)
                    {
                        var device = devices.First(d => d.Id == data.DeviceId);
                        var alertMessage = new
                        {
                            deviceName = device.Name,
                            location = device.Location,
                            type = data.Type,
                            value = data.Value,
                            message = data.AlertMessage,
                            timestamp = data.Timestamp.ToString("o")
                        };
                        
                        await _hubContext.Clients.User(userId.ToString()).SendAsync("AlertNotification", alertMessage);
                    }
                }
                
                return Ok(new { message = $"Generated {simulatedData.Count} sensor readings", data = simulatedData });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in simulate endpoint: {ex.Message}");
                return StatusCode(500, "An error occurred while simulating sensor data.");
            }
        }
    }
} 