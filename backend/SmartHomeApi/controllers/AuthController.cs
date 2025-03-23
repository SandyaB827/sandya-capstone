using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using SmartHomeApi.Data;
using SmartHomeApi.Models;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using BCrypt.Net;

namespace SmartHomeApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly SmartHomeDbContext _context;
        private readonly IConfiguration _configuration;

        public AuthController(SmartHomeDbContext context, IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] User user)
        {
            Console.WriteLine($"Register attempt for user: {user.Username}, Email: {user.Email}");
            
            if (_context.Users.Any(u => u.Username == user.Username || u.Email == user.Email))
            {
                Console.WriteLine("Username or email already exists");
                return BadRequest("Username or email already exists.");
            }

            // Store the original password for logging
            string originalPassword = user.PasswordHash;
            
            // Hash the password
            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(user.PasswordHash);
            
            Console.WriteLine($"Original password: {originalPassword.Substring(0, 3)}*** (truncated)");
            Console.WriteLine($"Hashed password: {user.PasswordHash}");
            
            _context.Users.Add(user);
            await _context.SaveChangesAsync();
            return Ok("User registered successfully.");
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginModel loginModel)
        {
            Console.WriteLine($"Login attempt for user: {loginModel.Username}");
            
            var user = _context.Users.FirstOrDefault(u => u.Username == loginModel.Username);
            
            if (user == null)
            {
                Console.WriteLine("User not found");
                return Unauthorized("Invalid username or password.");
            }
            
            bool passwordVerified = BCrypt.Net.BCrypt.Verify(loginModel.PasswordHash, user.PasswordHash);
            Console.WriteLine($"Password verification result: {passwordVerified}");
            
            if (!passwordVerified)
            {
                return Unauthorized("Invalid username or password.");
            }

            var token = GenerateJwtToken(user);
            return Ok(new { Token = token, Username = user.Username });
        }

        private string GenerateJwtToken(User user)
        {
            var claims = new[]
            {
                new Claim(ClaimTypes.Name, user.Username),
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString())
            };

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: _configuration["Jwt:Issuer"],
                audience: _configuration["Jwt:Audience"],
                claims: claims,
                expires: DateTime.Now.AddHours(1),
                signingCredentials: creds);

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        // Example of a protected endpoint
        [Authorize]
        [HttpGet("devices")]
        public IActionResult GetDevices()
        {
            var devices = new[] { "Light", "Thermostat", "Door Lock" };
            return Ok(devices);
        }
    }
}