using System.ComponentModel.DataAnnotations;

namespace SmartHomeApi.Models
{
    public class DeviceDto
    {
        [Required]
        [MaxLength(100)]
        public string Name { get; set; }

        [Required]
        [MaxLength(50)]
        public string Type { get; set; }

        [Required]
        [MaxLength(100)]
        public string Location { get; set; }

        public string IpAddress { get; set; }

        [MaxLength(100)]
        public string ApiKey { get; set; }

        public bool IsOnline { get; set; } = true;
    }
} 