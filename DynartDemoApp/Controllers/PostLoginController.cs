using System.Security.Claims;
using DynartDemoApp.Data;
using DynartDemoApp.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DynartDemoApp.Controllers;

[ApiController]
[Route("api/post-login")]
public class PostLoginController(ILogger<PostLoginController> logger, ApplicationDbContext db, IConfiguration configuration)
    : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get()
    {
        if (!User.Identity?.IsAuthenticated ?? true)
        {
            return Redirect("/");
        }

        var email = User.FindFirst(ClaimTypes.Email)?.Value;
        var provider = User.FindFirst("http://schemas.microsoft.com/ws/2008/06/identity/claims/authenticationmethod")?.Value ?? "Google";
        var providerKey = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (string.IsNullOrEmpty(email) || string.IsNullOrEmpty(providerKey))
        {
            logger.LogWarning("Login failed: missing email or provider key");
            return Redirect("/");
        }

        // Find or create user by email
        var user = await db.Users
            .Include(u => u.ExternalLogins)
            .Include(u => u.UserRoles)
            .FirstOrDefaultAsync(u => u.Email == email);

        if (user == null)
        {
            // Register new user
            user = new User
            {
                Email = email,
                DisplayName = User.FindFirst(ClaimTypes.Name)?.Value ?? email,
                CreatedAt = DateTime.UtcNow
            };
            db.Users.Add(user);
            await db.SaveChangesAsync();

            // Assign default "User" role (RoleId = 1)
            db.UserRoles.Add(new UserRole { UserId = user.Id, RoleId = 1 });

            logger.LogInformation("New user registered: {Email}", email);
        }

        // Link external login if not exists
        if (!user.ExternalLogins.Any(el => el.Provider == provider && el.ProviderKey == providerKey))
        {
            db.ExternalLogins.Add(new ExternalLogin
            {
                UserId = user.Id,
                Provider = provider,
                ProviderKey = providerKey,
                CreatedAt = DateTime.UtcNow
            });
        }

        user.LastLoginAt = DateTime.UtcNow;
        await db.SaveChangesAsync();

        logger.LogInformation("User {Email} logged in successfully via {Provider}", email, provider);

        var frontendUrl = configuration["FrontendUrl"] ?? "http://localhost:3000";
        return Redirect(frontendUrl);
    }
}
