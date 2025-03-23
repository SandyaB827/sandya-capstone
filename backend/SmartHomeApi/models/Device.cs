using System.ComponentModel.DataAnnotations;

namespace SmartHomeApi.Models
{
    public class Device
    {
        public int Id { get; set; }

        [Required]
        [MaxLength(100)]
        public string Name { get; set; }

        [Required]
        [MaxLength(50)]
        public string Type { get; set; } // e.g., "Light", "Thermostat", "Door", "Camera"

        [Required]
        [MaxLength(100)]
        public string Location { get; set; } // e.g., "Living Room", "Kitchen"

        public string IpAddress { get; set; }

        [MaxLength(100)]
        public string ApiKey { get; set; }

        public bool IsOnline { get; set; } = true;

        public int UserId { get; set; }
        
        public User User { get; set; }

        public DateTime AddedAt { get; set; } = DateTime.Now;
    }
} 