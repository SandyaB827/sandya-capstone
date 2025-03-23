using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartHomeApi.Data;
using SmartHomeApi.Models;
using System.Security.Claims;

namespace SmartHomeApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class DevicesController : ControllerBase
    {
        private readonly SmartHomeDbContext _context;

        public DevicesController(SmartHomeDbContext context)
        {
            _context = context;
        }

        // GET: api/Devices
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Device>>> GetDevices()
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
            return await _context.Devices.Where(d => d.UserId == userId).ToListAsync();
        }

        // GET: api/Devices/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Device>> GetDevice(int id)
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
            var device = await _context.Devices
                .Where(d => d.UserId == userId && d.Id == id)
                .FirstOrDefaultAsync();

            if (device == null)
            {
                return NotFound();
            }

            return device;
        }

        // POST: api/Devices
        [HttpPost]
        public async Task<ActionResult<Device>> AddDevice(DeviceDto deviceDto)
        {
            try
            {
                // Check for required fields
                if (string.IsNullOrEmpty(deviceDto.Name))
                {
                    return BadRequest("Device name is required.");
                }
                
                if (string.IsNullOrEmpty(deviceDto.Type))
                {
                    return BadRequest("Device type is required.");
                }
                
                if (string.IsNullOrEmpty(deviceDto.Location))
                {
                    return BadRequest("Device location is required.");
                }
                
                var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
                
                // Map DTO to Device
                var device = new Device
                {
                    Name = deviceDto.Name,
                    Type = deviceDto.Type,
                    Location = deviceDto.Location,
                    IpAddress = deviceDto.IpAddress,
                    ApiKey = deviceDto.ApiKey,
                    IsOnline = deviceDto.IsOnline,
                    UserId = userId,
                    AddedAt = DateTime.Now
                };
                
                // Log the received device for debugging
                Console.WriteLine($"Adding device: Name={device.Name}, Type={device.Type}, Location={device.Location}");
                
                _context.Devices.Add(device);
                await _context.SaveChangesAsync();

                return CreatedAtAction(nameof(GetDevice), new { id = device.Id }, device);
            }
            catch (Exception ex)
            {
                // Log the exception
                Console.WriteLine($"Error adding device: {ex.Message}");
                if (ex.InnerException != null)
                {
                    Console.WriteLine($"Inner exception: {ex.InnerException.Message}");
                }
                
                return StatusCode(500, "An error occurred while adding the device. Please try again.");
            }
        }

        // PUT: api/Devices/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateDevice(int id, Device device)
        {
            if (id != device.Id)
            {
                return BadRequest();
            }

            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
            var existingDevice = await _context.Devices
                .Where(d => d.UserId == userId && d.Id == id)
                .FirstOrDefaultAsync();

            if (existingDevice == null)
            {
                return NotFound();
            }

            // Update only allowed properties
            existingDevice.Name = device.Name;
            existingDevice.Location = device.Location;
            existingDevice.IpAddress = device.IpAddress;
            existingDevice.ApiKey = device.ApiKey;
            existingDevice.IsOnline = device.IsOnline;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!DeviceExists(id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }

            return NoContent();
        }

        // DELETE: api/Devices/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteDevice(int id)
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
            var device = await _context.Devices
                .Where(d => d.UserId == userId && d.Id == id)
                .FirstOrDefaultAsync();
                
            if (device == null)
            {
                return NotFound();
            }

            _context.Devices.Remove(device);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool DeviceExists(int id)
        {
            return _context.Devices.Any(e => e.Id == id);
        }
    }
}