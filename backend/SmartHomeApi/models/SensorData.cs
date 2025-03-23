using System.ComponentModel.DataAnnotations;

namespace SmartHomeApi.Models
{
    public class SensorData
    {
        public int Id { get; set; }
        
        [Required]
        public int DeviceId { get; set; }
        
        public Device Device { get; set; }
        
        [Required]
        public string Type { get; set; } // "Temperature", "Humidity", "Motion", "Security", etc.
        
        [Required]
        public string Value { get; set; } // Store as string to handle different data types
        
        public string? Unit { get; set; } // "C", "%", "lux", etc.
        
        public bool IsAlert { get; set; } // Whether this reading represents an alert condition
        
        [MaxLength(255)]
        public string? AlertMessage { get; set; } // Alert description if applicable
        
        public DateTime Timestamp { get; set; } = DateTime.Now;
    }
} 