using DynartDemoApp.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DynartDemoApp.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PermissionsController(ApplicationDbContext db, ILogger<PermissionsController> logger)
    : ControllerBase
{
    private readonly ILogger<PermissionsController> _logger = logger;

    [HttpGet]
    public async Task<IActionResult> GetUserPermissions()
    {
        var email = User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value;

        if (string.IsNullOrEmpty(email))
        {
            return Unauthorized();
        }

        var permissions = await db.Users
            .Where(u => u.Email == email)
            .SelectMany(u => u.UserRoles)
            .SelectMany(ur => ur.Role.RolePermissions)
            .Select(rp => rp.Permission.Name)
            .Distinct()
            .ToListAsync();

        return Ok(new { permissions });
    }
}
