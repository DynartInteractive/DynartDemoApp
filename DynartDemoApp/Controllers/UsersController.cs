using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using DynartDemoApp.Data;
using DynartDemoApp.Models;

namespace DynartDemoApp.Controllers;

[ApiController]
[Route("api/users")]
[Authorize(Policy = "users:read")]
public class UsersController(ApplicationDbContext context) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetUsers()
    {
        var users = await context.Users
            .Include(u => u.UserRoles)
            .ThenInclude(ur => ur.Role)
            .Select(u => new
            {
                u.Id,
                u.Email,
                u.DisplayName,
                u.CreatedAt,
                Role = u.UserRoles.Select(ur => ur.Role.Name).FirstOrDefault() ?? "User"
            })
            .ToListAsync();

        return Ok(users);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetUser(int id)
    {
        var user = await context.Users
            .Include(u => u.UserRoles)
            .ThenInclude(ur => ur.Role)
            .Where(u => u.Id == id)
            .Select(u => new
            {
                u.Id,
                u.Email,
                u.DisplayName,
                u.CreatedAt,
                Role = u.UserRoles.Select(ur => ur.Role.Name).FirstOrDefault() ?? "User"
            })
            .FirstOrDefaultAsync();

        if (user == null)
            return NotFound(new { message = "User not found" });

        return Ok(user);
    }

    [HttpPost]
    [Authorize(Policy = "users:write")]
    public async Task<IActionResult> CreateUser([FromBody] CreateUserRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Name))
            return BadRequest(new { message = "Email and Name are required" });

        // Check if user already exists
        if (await context.Users.AnyAsync(u => u.Email == request.Email))
            return BadRequest(new { message = "User with this email already exists" });

        var user = new User
        {
            Email = request.Email,
            DisplayName = request.Name,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        context.Users.Add(user);
        await context.SaveChangesAsync();

        // Assign role
        var role = await context.Roles.FirstOrDefaultAsync(r => r.Name == (request.Role ?? "User"));
        if (role != null)
        {
            context.UserRoles.Add(new UserRole
            {
                UserId = user.Id,
                RoleId = role.Id
            });
            await context.SaveChangesAsync();
        }

        return CreatedAtAction(nameof(GetUser), new { id = user.Id }, new
        {
            user.Id,
            user.Email,
            user.DisplayName,
            user.CreatedAt,
            Role = role?.Name ?? "User"
        });
    }

    [HttpPut("{id}")]
    [Authorize(Policy = "users:write")]
    public async Task<IActionResult> UpdateUser(int id, [FromBody] UpdateUserRequest request)
    {
        var user = await context.Users
            .Include(u => u.UserRoles)
            .FirstOrDefaultAsync(u => u.Id == id);

        if (user == null)
            return NotFound(new { message = "User not found" });

        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Name))
            return BadRequest(new { message = "Email and Name are required" });

        // Check if email is taken by another user
        if (await context.Users.AnyAsync(u => u.Email == request.Email && u.Id != id))
            return BadRequest(new { message = "Email is already taken" });

        user.Email = request.Email;
        user.DisplayName = request.Name;
        user.UpdatedAt = DateTime.UtcNow;

        // Update role if specified
        if (!string.IsNullOrWhiteSpace(request.Role))
        {
            var role = await context.Roles.FirstOrDefaultAsync(r => r.Name == request.Role);
            if (role != null)
            {
                // Remove existing roles
                context.UserRoles.RemoveRange(user.UserRoles);

                // Add new role
                context.UserRoles.Add(new UserRole
                {
                    UserId = user.Id,
                    RoleId = role.Id
                });
            }
        }

        await context.SaveChangesAsync();

        return Ok(new
        {
            user.Id,
            user.Email,
            user.DisplayName,
            user.UpdatedAt,
            Role = request.Role ?? "User"
        });
    }

    [HttpDelete("{id}")]
    [Authorize(Policy = "admin:access")]
    public async Task<IActionResult> DeleteUser(int id)
    {
        var user = await context.Users.FindAsync(id);

        if (user == null)
            return NotFound(new { message = "User not found" });

        context.Users.Remove(user);
        await context.SaveChangesAsync();

        return NoContent();
    }
}

public record CreateUserRequest(string Email, string Name, string? Role);
public record UpdateUserRequest(string Email, string Name, string? Role);
