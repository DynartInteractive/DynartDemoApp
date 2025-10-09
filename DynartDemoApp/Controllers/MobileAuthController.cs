using DynartDemoApp.Data;
using DynartDemoApp.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace DynartDemoApp.Controllers;

[ApiController]
[Route("api/mobile-auth")]
public class MobileAuthController(
    ApplicationDbContext context,
    IJwtService jwtService) : ControllerBase
{
    [HttpPost("exchange-cookie")]
    [Authorize(AuthenticationSchemes = "Cookies")]
    public async Task<IActionResult> ExchangeCookieForToken()
    {
        // Get user from cookie authentication
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
            return Unauthorized();

        // Load user with roles and permissions
        var user = await context.Users
            .Include(u => u.UserRoles)
            .ThenInclude(ur => ur.Role)
            .ThenInclude(r => r.RolePermissions)
            .ThenInclude(rp => rp.Permission)
            .FirstOrDefaultAsync(u => u.Id == int.Parse(userId));

        if (user == null)
            return Unauthorized();

        // Build claims including permissions
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(ClaimTypes.Email, user.Email),
            new(ClaimTypes.Name, user.DisplayName)
        };

        // Add permission claims
        var permissions = user.UserRoles
            .SelectMany(ur => ur.Role.RolePermissions)
            .Select(rp => rp.Permission.Name)
            .Distinct();

        foreach (var permission in permissions)
        {
            claims.Add(new Claim("permission", permission));
        }

        // Generate JWT token
        var token = jwtService.GenerateToken(claims);

        return Ok(new
        {
            token,
            user = new
            {
                user.Id,
                user.Email,
                user.DisplayName,
                permissions
            }
        });
    }

    [HttpPost("google")]
    public async Task<IActionResult> GoogleLogin([FromBody] GoogleLoginRequest request)
    {
        // Verify Google ID token
        try
        {
            var payload = await Google.Apis.Auth.GoogleJsonWebSignature
                .ValidateAsync(request.IdToken);

            // Find or create user
            var user = await context.Users
                .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
                .ThenInclude(r => r.RolePermissions)
                .ThenInclude(rp => rp.Permission)
                .FirstOrDefaultAsync(u => u.Email == payload.Email);

            if (user == null)
            {
                // Create new user
                user = new Models.User
                {
                    Email = payload.Email,
                    DisplayName = payload.Name,
                    CreatedAt = DateTime.UtcNow
                };
                context.Users.Add(user);

                // Assign default "User" role
                var userRole = await context.Roles
                    .FirstOrDefaultAsync(r => r.Name == "User");
                if (userRole != null)
                {
                    user.UserRoles.Add(new Models.UserRole
                    {
                        User = user,
                        Role = userRole
                    });
                }

                await context.SaveChangesAsync();

                // Reload user with relations
                user = await context.Users
                    .Include(u => u.UserRoles)
                    .ThenInclude(ur => ur.Role)
                    .ThenInclude(r => r.RolePermissions)
                    .ThenInclude(rp => rp.Permission)
                    .FirstAsync(u => u.Id == user.Id);
            }
            else
            {
                // Update existing user
                user.DisplayName = payload.Name;
                user.UpdatedAt = DateTime.UtcNow;
                await context.SaveChangesAsync();
            }

            // Build claims
            var claims = new List<Claim>
            {
                new(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new(ClaimTypes.Email, user.Email),
                new(ClaimTypes.Name, user.DisplayName)
            };

            var permissions = user.UserRoles
                .SelectMany(ur => ur.Role.RolePermissions)
                .Select(rp => rp.Permission.Name)
                .Distinct();

            foreach (var permission in permissions)
            {
                claims.Add(new Claim("permission", permission));
            }

            var token = jwtService.GenerateToken(claims);

            return Ok(new
            {
                token,
                user = new
                {
                    user.Id,
                    user.Email,
                    user.DisplayName,
                    permissions
                }
            });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = "Invalid Google token", error = ex.Message });
        }
    }
}

public record GoogleLoginRequest(string IdToken);
