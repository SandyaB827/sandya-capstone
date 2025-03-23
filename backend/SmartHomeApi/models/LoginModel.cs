using System.ComponentModel.DataAnnotations;

namespace SmartHomeApi.Models
{
    public class LoginModel
    {
        [Required]
        [MaxLength(50)]
        public string Username { get; set; }

        [Required]
        [MaxLength(255)]
        public string PasswordHash { get; set; }
    }
} 