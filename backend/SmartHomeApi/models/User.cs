using System.ComponentModel.DataAnnotations;

namespace SmartHomeApi.Models
{
    public class User
    {
        public int Id { get; set; }

        [Required]
        [MaxLength(50)]
        public string Username { get; set; }

        [Required]
        [MaxLength(255)]
        public string PasswordHash { get; set; }

        [Required]
        [MaxLength(100)]
        public string Email { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.Now;
        
        // Navigation property for devices owned by this user
        public ICollection<Device> Devices { get; set; }
    }
}