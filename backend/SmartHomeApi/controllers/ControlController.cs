using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartHomeApi.Data;
using SmartHomeApi.Models;
using System.Security.Claims;
using Microsoft.AspNetCore.SignalR;
using SmartHomeApi.Hubs;

namespace SmartHomeApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class ControlController : ControllerBase
    {
        private readonly SmartHomeDbContext _context;
        private readonly IHubContext<SmartHomeHub> _hubContext;

        public ControlController(SmartHomeDbContext context, IHubContext<SmartHomeHub> hubContext)
        {
            _context = context;
            _hubContext = hubContext;
        }

        // POST: api/Control/light/{id}
        [HttpPost("light/{id}")]
        public async Task<IActionResult> ControlLight(int id, [FromBody] DeviceCommand command)
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
            
            var device = await _context.Devices
                .Where(d => d.Id == id && d.UserId == userId && d.Type.ToLower() == "light")
                .FirstOrDefaultAsync();
                
            if (device == null)
            {
                return NotFound("Light device not found");
            }
            
            // Here you would normally integrate with the actual IoT device
            // For demo purposes, we'll just log the command
            Console.WriteLine($"Light command sent to {device.Name}: {command.Command}");
            
            // You could update device state in the database
            // device.State = command.Command;
            // await _context.SaveChangesAsync();
            
            return Ok(new { message = $"Command {command.Command} sent to light {device.Name}" });
        }

        // POST: api/Control/thermostat/{id}
        [HttpPost("thermostat/{id}")]
        public async Task<IActionResult> ControlThermostat(int id, [FromBody] ThermostatCommand command)
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
            
            var device = await _context.Devices
                .Where(d => d.Id == id && d.UserId == userId && d.Type.ToLower() == "thermostat")
                .FirstOrDefaultAsync();
                
            if (device == null)
            {
                return NotFound("Thermostat device not found");
            }
            
            // Here you would normally integrate with the actual IoT device
            Console.WriteLine($"Thermostat command sent to {device.Name}: Temperature={command.Temperature}, Mode={command.Mode}");
            
            return Ok(new { message = $"Temperature set to {command.Temperature}°C on {device.Name}" });
        }

        // POST: api/Control/door/{id}
        [HttpPost("door/{id}")]
        public async Task<IActionResult> ControlDoor(int id, [FromBody] DeviceCommand command)
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
            
            var device = await _context.Devices
                .Where(d => d.Id == id && d.UserId == userId && d.Type.ToLower() == "door")
                .FirstOrDefaultAsync();
                
            if (device == null)
            {
                return NotFound("Door device not found");
            }
            
            // Validate command is "lock" or "unlock"
            if (command.Command.ToLower() != "lock" && command.Command.ToLower() != "unlock")
            {
                return BadRequest("Command must be 'lock' or 'unlock'");
            }
            
            // Here you would normally integrate with the actual IoT device
            Console.WriteLine($"Door command sent to {device.Name}: {command.Command}");
            
            return Ok(new { message = $"Door {device.Name} {command.Command}ed successfully" });
        }

        // POST: api/Control/toggle/{id}
        [HttpPost("toggle/{id}")]
        public async Task<IActionResult> ToggleDevice(int id)
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
            
            var device = await _context.Devices
                .Where(d => d.Id == id && d.UserId == userId)
                .FirstOrDefaultAsync();
                
            if (device == null)
            {
                return NotFound("Device not found");
            }

            // Toggle the device's power state
            device.IsOnline = !device.IsOnline;
            await _context.SaveChangesAsync();

            // Notify connected clients about the status change
            await _hubContext.Clients.User(userId.ToString())
                .SendAsync("DeviceStatusUpdated", new { deviceId = device.Id, status = device.IsOnline });
            
            return Ok(new { status = device.IsOnline });
        }
    }

    public class DeviceCommand
    {
        public string Command { get; set; } // "on", "off", "lock", "unlock", etc.
    }

    public class ThermostatCommand
    {
        public int Temperature { get; set; }
        public string Mode { get; set; } // "heat", "cool", "auto", "off"
    }
} 